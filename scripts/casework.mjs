#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table as textTable} from './lib/format.mjs';
import {page,table,record,writeOut} from './lib/render.mjs';

export const reports={
 programmes:'select code,name,policy_reference from programmes order by code',
 applications:'select code,name,programme,owner,due_on,status,last_decision,decision_state,evidence_gaps,open_appeals from v_casework order by due_on,code',
 'evidence-due':"select code,name,owner,due_on,finding,expires_on from v_evidence where finding<>'current' order by due_on,code,name",
 'decision-queue':"select code,owner,due_on,decision_state,evidence_gaps,requirements,open_appeals from v_casework where status='open' and (decision_state<>'current' or last_decision='more_information') order by due_on,code",
 recertifications:"select code,owner,recertify_on,last_decision,decision_state from v_casework where status='open' and recertify_on<=current_date+30 order by recertify_on,code",
 appeals:'select a.code,ap.id,ap.owner,ap.due_on,ap.status,ap.reason,ap.resolution from appeals ap join applications a on a.id=ap.application_id order by ap.due_on,a.code',
 'owner-load':"select owner,count(*)::int as open_cases,count(*) filter(where due_on<current_date and (decision_state<>'current' or last_decision='more_information'))::int as overdue,sum(evidence_gaps)::int as evidence_gaps,sum(open_appeals)::int as appeals from v_casework where status='open' group by owner order by owner",
 attention:'select * from v_attention order by due,code,finding',
 compliance:'select * from v_compliance order by code,rule,finding',
 activity:'select a.code,h.sequence,h.actor,h.action,h.note,h.created_at from activity h left join applications a on a.id=h.application_id order by h.sequence desc',
};
const kinds=['programmes','applications','requirements','evidence','decisions','appeals','activity','import_batches'];
const mutations=['add-programme','add','update','require-evidence','record-evidence','record-decision','open-appeal','resolve-appeal','log','import'];
export const commands=[...Object.keys(reports),'help','list','show',...mutations,'export','weekly-review','draft-request','draft-decision'];
const allowed={
 help:[],list:['kind'],show:['kind','ref'],
 'add-programme':['code','name','policy'],
 add:['code','name','programme','subject','owner','received-on','due-on','retention-on','recertify-on'],
 update:['ref','name','subject','owner','due-on','retention-on','recertify-on','status'],
 'require-evidence':['ref','name','policy','due-on'],
 'record-evidence':['ref','requirement','evidence','outcome','checked-on','expires-on'],
 'record-decision':['ref','outcome','reason','policy','evidence'],
 'open-appeal':['ref','decision','reason','owner','due-on'],
 'resolve-appeal':['ref','resolution','evidence'],
 log:['ref','note','contact-on'],
 import:['file','source','programme','owner','due-on','retention-on','map','dry-run'],
 export:['file','kind'], 'weekly-review':[], 'draft-request':['ref'],'draft-decision':['ref'],
};
const need=(o,k)=>{const v=o[k];if(typeof v!=='string'||!v.trim())throw Error(`Required --${k}=value`);return v.trim();};
const choice=(v,choices)=>{if(!choices.includes(v))throw Error(`Expected one of: ${choices.join(', ')}`);return v;};
const code=v=>{if(!/^[A-Za-z0-9_-]+$/.test(v))throw Error('Code uses letters, digits, underscore and hyphen only');return v;};
export function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Date must be a real YYYY-MM-DD: ${v}`);return v;}
const today=()=>new Date().toISOString().slice(0,10);
const noFuture=v=>{date(v);if(v>today())throw Error('Date cannot be in the future');return v;};
const named={programmes:'name',applications:'name',requirements:'name',evidence:'reference',decisions:'reason',appeals:'reason'};
export async function resolve(db,kind,ref,lock=false){
 choice(kind,kinds);if(!named[kind])throw Error(`Use list for ${kind}`);
 const col=named[kind];const withCode=['programmes','applications'].includes(kind);
 const rows=await db.query(`select * from ${kind} where id::text=$1 or lower(${col})=lower($1) ${withCode?'or lower(code)=lower($1)':''} order by id ${lock?'for update':''}`,[ref]);
 const found=rows.length?rows:await db.query(`select * from ${kind} where starts_with(id::text,$1) or position(lower($1) in lower(${col}))>0 order by id ${lock?'for update':''}`,[ref]);
 if(found.length!==1)throw Error(found.length?`Ambiguous ${kind}: ${found.map(x=>`${x.id} ${x.code||x[col]}`).join('; ')}`:`No ${kind} match: ${ref}`);
 return found[0];
}
async function audit(db,app,actor,action,before,after,note=''){
 await db.query('insert into activity(application_id,actor,action,note,before_data,after_data) values($1,$2,$3,$4,$5,$6)',[app,actor,action,note,JSON.stringify(before??null),JSON.stringify(after??null)]);
}
async function appForWrite(db,o){return resolve(db,'applications',need(o,'ref'),true);}
function writable(a){if(a.status!=='open')throw Error('Application is not open; reopen it with update first');}
function readFile(file){if(fs.statSync(file).size>20*1024*1024)throw Error('Import exceeds 20 MB; split by programme');return fs.readFileSync(file,'utf8');}
async function importSalesforce(db,o,pos,actor){
 if(pos.length!==1||pos[0]!=='salesforce')throw Error('Use import salesforce');
 const raw=readFile(need(o,'file')),rows=parseCsv(raw);if(!rows.length)throw Error('CSV has no application rows');
 const source=need(o,'source'),programme=await resolve(db,'programmes',need(o,'programme'));
 const owner=need(o,'owner'),due=date(need(o,'due-on')),retention=date(need(o,'retention-on'));
 const map=o.map?JSON.parse(readFile(o.map)):{};
 for(const [key,value] of Object.entries(map))if(!['id','name','subject','received','status'].includes(key)||typeof value!=='string')throw Error('Invalid field map');
 const get=(r,k,...fallback)=>{if(map[k]){if(!(map[k] in r))throw Error(`Missing mapped CSV column: ${map[k]}`);return r[map[k]];}return pick(r,...fallback);};
 const seen=new Set();const normal=rows.map((r,i)=>{
  const id=get(r,'id','Id','Individual Application ID','Application ID').trim();
  if(!/^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/.test(id))throw Error(`Row ${i+2}: Salesforce ID must have 15 or 18 alphanumeric characters`);
  if(seen.has(id))throw Error(`Duplicate application ID: ${id}`);seen.add(id);
  const name=get(r,'name','Name','Application Name').trim(),subject=get(r,'subject','AccountId','Account ID').trim();
  let received=get(r,'received','AppliedDate','Applied Date').trim();
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(received)){date(received.slice(0,10));if(!Number.isFinite(Date.parse(received)))throw Error('Invalid timestamp');received=new Date(received).toISOString().slice(0,10);}
  noFuture(received);if(!name||!subject)throw Error(`Row ${i+2}: missing Name or AccountId`);
  if(received>due||received>retention)throw Error(`Row ${i+2}: review dates precede receipt`);
  return {id,name,subject,received,status:get(r,'status','Status'),raw:r};
 });
 let inserted=0,updated=0,unchanged=0;
 for(const n of normal){
  const old=(await db.query('select * from applications where import_source=$1 and external_id=$2 for update',[source,n.id]))[0];
  if(old&&old.programme_id!==programme.id)throw Error('Application already belongs to another programme');
  const values=[n.name,n.subject,owner,n.received,due,retention,n.status,JSON.stringify(n.raw)];
  if(old){
   // Re-reading identical source data never resets local owners, review dates or edits.
   const same=Object.keys(n.raw).length===Object.keys(old.source_data).length&&Object.entries(n.raw).every(([k,v])=>old.source_data[k]===v);
   if(same){unchanged++;continue;}
   const next=(await db.query('update applications set name=$1,subject_ref=$2,owner=$3,received_on=$4,due_on=$5,retention_review_on=$6,source_status=$7,source_data=$8 where id=$9 returning *',[...values,old.id]))[0];
   await audit(db,old.id,actor,'import-update',old,next,source);updated++;
  }else{
   // Include the source in the code so multiple deployments can share this database.
   const suffix=createHash('sha256').update(source).digest('hex').slice(0,8);
   const next=(await db.query('insert into applications(name,subject_ref,owner,received_on,due_on,retention_review_on,source_status,source_data,code,programme_id,import_source,external_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *',[...values,`SF-${suffix}-${n.id}`,programme.id,source,n.id]))[0];
   await audit(db,next.id,actor,'import-add',null,next,source);inserted++;
  }
 }
 await db.query('insert into import_batches(source,sha256,rows_count,actor) values($1,$2,$3,$4)',[source,createHash('sha256').update(raw).digest('hex'),rows.length,actor]);
 return [{inserted,updated,unchanged,dry_run:!!o['dry-run'],note:'Source status preserved; local decisions require review'}];
}
async function mutate(db,cmd,o,pos,actor){
 if(cmd==='import')return importSalesforce(db,o,pos,actor);
 if(cmd==='add-programme'){
  const row=(await db.query('insert into programmes(code,name,policy_reference) values($1,$2,$3) returning *',[code(need(o,'code')),need(o,'name'),need(o,'policy')]))[0];
  await audit(db,null,actor,cmd,null,row);return [row];
 }
 if(cmd==='add'){
  const p=await resolve(db,'programmes',need(o,'programme'));
  const row=(await db.query('insert into applications(code,name,programme_id,subject_ref,owner,received_on,due_on,retention_review_on,recertify_on) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',[code(need(o,'code')),need(o,'name'),p.id,need(o,'subject'),need(o,'owner'),noFuture(need(o,'received-on')),date(need(o,'due-on')),date(need(o,'retention-on')),o['recertify-on']?date(o['recertify-on']):null]))[0];
  await audit(db,row.id,actor,cmd,null,row);return [row];
 }
 if(cmd==='resolve-appeal'){
  const a=await resolve(db,'appeals',need(o,'ref'),true);
  if(a.status!=='open')throw Error('Appeal is already resolved');
  const d=(await db.query('select * from decisions where id=$1',[a.decision_id]))[0];
  if(d.reviewer.toLowerCase()===actor.toLowerCase())throw Error('Appeal resolution needs a different reviewer from the original decision');
  const row=(await db.query("update appeals set status='resolved',resolution=$1,evidence_reference=$2,resolved_by=$3 where id=$4 returning *",[need(o,'resolution'),need(o,'evidence'),actor,a.id]))[0];
  await audit(db,a.application_id,actor,cmd,a,row,'Resolution does not replace the original decision');return [row];
 }
 const a=await appForWrite(db,o);
 if(cmd==='update'){
  const fields={'name':'name','subject':'subject_ref','owner':'owner','due-on':'due_on','retention-on':'retention_review_on','recertify-on':'recertify_on','status':'status'};
  const values=[],sets=[];for(const [key,col] of Object.entries(fields))if(o[key]!==undefined){let v=need(o,key);if(key.endsWith('-on'))v=date(v);if(key==='status')choice(v,['open','withdrawn','closed']);values.push(v);sets.push(`${col}=$${values.length}`);}
  if(!sets.length)throw Error('No changed fields supplied');values.push(a.id);
  const row=(await db.query(`update applications set ${sets.join(',')} where id=$${values.length} returning *`,values))[0];
  await audit(db,a.id,actor,cmd,a,row);return [row];
 }
 if(cmd==='log'){
  const contact=o['contact-on']?noFuture(o['contact-on']):null;
  if(contact&&contact<a.received_on)throw Error('Contact date precedes receipt');
  if(contact)await db.query('update applications set last_contact_on=greatest(last_contact_on,$1::date) where id=$2',[contact,a.id]);
  await audit(db,a.id,actor,cmd,null,{contact_on:contact},need(o,'note'));return [{code:a.code,logged:true}];
 }
 if(cmd==='open-appeal'){
  const d=await resolve(db,'decisions',need(o,'decision'));
  if(d.application_id!==a.id)throw Error('Decision belongs to another application');
  if((await db.query("select id from appeals where decision_id=$1 and status='open'",[d.id])).length)throw Error('An open appeal already exists for this decision');
  const row=(await db.query('insert into appeals(application_id,decision_id,reason,owner,due_on) values($1,$2,$3,$4,$5) returning *',[a.id,d.id,need(o,'reason'),need(o,'owner'),date(need(o,'due-on'))]))[0];
  await audit(db,a.id,actor,cmd,null,row);return [row];
 }
 writable(a);
 if(cmd==='require-evidence'){
  const row=(await db.query('insert into requirements(application_id,name,policy_reference,due_on) values($1,$2,$3,$4) returning *',[a.id,need(o,'name'),need(o,'policy'),date(need(o,'due-on'))]))[0];
  await audit(db,a.id,actor,cmd,null,row);return [row];
 }
 if(cmd==='record-evidence'){
  const ref=need(o,'requirement');const rs=await db.query('select * from requirements where application_id=$1 and (id::text=$2 or lower(name)=lower($2) or starts_with(id::text,$2)) order by id',[a.id,ref]);
  if(rs.length!==1)throw Error(`Requirement needs an exact name or unique ID in ${a.code}: ${rs.map(r=>`${r.id} ${r.name}`).join('; ')||'no match'}`);
  const old=(await db.query('select * from evidence where requirement_id=$1',[rs[0].id]))[0];
  const row=(await db.query('insert into evidence(requirement_id,reference,outcome,checked_on,expires_on,checked_by) values($1,$2,$3,$4,$5,$6) on conflict(requirement_id) do update set reference=excluded.reference,outcome=excluded.outcome,checked_on=excluded.checked_on,expires_on=excluded.expires_on,checked_by=excluded.checked_by returning *',[rs[0].id,need(o,'evidence'),choice(need(o,'outcome'),['accepted','rejected']),noFuture(need(o,'checked-on')),date(need(o,'expires-on')),actor]))[0];
  await audit(db,a.id,actor,cmd,old,row);return [row];
 }
 if(cmd==='record-decision'){
  const outcome=choice(need(o,'outcome'),['approved','declined','more_information']);
  if(actor.toLowerCase()===a.owner.toLowerCase())throw Error('Decision needs a reviewer different from the case owner');
  if((await db.query("select id from appeals where application_id=$1 and status='open'",[a.id])).length)throw Error('Resolve open appeals before recording a replacement decision');
  const ev=await db.query('select * from v_evidence where application_id=$1',[a.id]);
  if(outcome!=='more_information'&&(!ev.length||ev.some(e=>e.finding!=='current')))throw Error('A final decision needs a checklist and current accepted evidence for every requirement');
  if(outcome!=='more_information'&&a.retention_review_on<=today())throw Error('Review the retention purpose and update its date first');
  const row=(await db.query('insert into decisions(application_id,revision,outcome,reason,policy_reference,evidence_reference,reviewer) values($1,$2,$3,$4,$5,$6,$7) returning *',[a.id,a.revision,outcome,need(o,'reason'),need(o,'policy'),need(o,'evidence'),actor]))[0];
  await audit(db,a.id,actor,cmd,null,row,'Human decision recorded; no payment or notification');return [row];
 }
 throw Error(`Unknown mutation: ${cmd}`);
}
export async function run(db,cmd,o={},pos=[]){
 if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}; use help`);
 for(const k of Object.keys(o))if(![...(allowed[cmd]||[]),'json',...(mutations.includes(cmd)?['actor']:[])].includes(k))throw Error(`Unknown option --${k} for ${cmd}`);
 for(const k of ['json','dry-run'])if(o[k]!==undefined&&o[k]!==true)throw Error(`--${k} is a boolean flag`);
 if(cmd!=='import'&&pos.length)throw Error('Unexpected positional argument');
 if(reports[cmd])return db.query(reports[cmd]);
 if(cmd==='help')return commands.map(command=>({command,options:[...(allowed[command]||[]),...(mutations.includes(command)?['actor']:[]),'json'].join(', ')}));
 if(cmd==='list')return db.query(`select * from ${choice(need(o,'kind'),kinds)} order by created_at,id`);
 if(cmd==='show')return [await resolve(db,o.kind||'applications',need(o,'ref'))];
 if(cmd==='weekly-review')return {applications:await db.query(reports.applications),attention:await db.query(reports.attention),recertifications:await db.query(reports.recertifications)};
 if(cmd==='export'){
  const file=path.resolve(need(o,'file'));let body,count;
  if(o.kind){const k=choice(o.kind,kinds),rows=await db.query(`select * from ${k} order by created_at,id`);const headers=Object.keys(rows[0]||{});
   const safe=v=>{let s=typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
   body=[headers,...rows.map(r=>headers.map(h=>r[h]))].map(row=>row.map(safe).join(',')).join('\r\n')+'\r\n';count=rows.length;
  }else{const data={format:'benefit-casework-v1',exported_at:new Date().toISOString()};await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const k of kinds)data[k]=await db.query(`select * from ${k} order by created_at,id`);}finally{await db.exec('ROLLBACK');}body=JSON.stringify(data,null,2)+'\n';count=kinds.reduce((n,k)=>n+data[k].length,0);}
  fs.writeFileSync(file,body,{flag:'wx',mode:0o600});return [{file,records:count}];
 }
 if(cmd.startsWith('draft-')){
  const a=await resolve(db,'applications',need(o,'ref'));
  const v=(await db.query('select * from v_casework where id=$1',[a.id]))[0];
  let sections=[{title:'Application',html:record(v,['code','name','owner','programme','decision_state','last_decision'])}];
  if(cmd==='draft-request')sections.push({title:'Evidence to request',note:'Internal draft. Confirm the purpose and recipient before sending.',html:table(await db.query("select name,policy_reference,due_on,finding from v_evidence where application_id=$1 and finding<>'current' order by name",[a.id]))});
  else {if(v.decision_state!=='current')throw Error('No current decision to draft');const d=(await db.query('select * from decisions where application_id=$1 and revision=$2',[a.id,a.revision]))[0];sections.push({title:'Recorded human decision',note:'Internal draft. Check the appeal procedure and authorised wording before issuing.',html:record(d,['outcome','reason','policy_reference','evidence_reference','reviewer','created_at'])});}
  sections.push({title:'Recent history',html:table(await db.query('select actor,action,note,created_at from activity where application_id=$1 order by sequence desc limit 20',[a.id]))});
  return [{file:writeOut('drafts',`${cmd}-${a.id}`,page({title:cmd==='draft-request'?'Evidence request draft':'Decision record draft',subtitle:'Internal review only. Nothing sent.',sections}))}];
 }
 const actor=need(o,'actor');await db.exec('BEGIN');try{const result=await mutate(db,cmd,o,pos,actor);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}
}
export function parseArgs(args){const [cmd='help',...rest]=args,o={},pos=[];for(const a of rest){if(!a.startsWith('--')){pos.push(a);continue;}const at=a.indexOf('='),key=a.slice(2,at<0?undefined:at);if(Object.hasOwn(o,key))throw Error(`Duplicate option --${key}`);o[key]=at<0?true:a.slice(at+1);}return {cmd,o,pos};}
function human(data){if(Array.isArray(data)){if(!data.length)return '  (none)';return textTable(data,Object.keys(data[0]).map(key=>({key,label:key,width:75,format:v=>typeof v==='object'&&v!==null?JSON.stringify(v):v})));}return Object.entries(data).map(([key,value])=>`${key}\n${human(value)}`).join('\n\n');}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const {cmd,o,pos}=parseArgs(process.argv.slice(2));db=await getDb();const result=await run(db,cmd,o,pos);console.log(o.json?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}

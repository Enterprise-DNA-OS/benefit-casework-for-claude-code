create function touch_updated() returns trigger language plpgsql as $$begin new.updated_at=clock_timestamp();return new;end$$;
create table programmes (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'),
 name text not null check(length(trim(name))>0), policy_reference text not null check(length(trim(policy_reference))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table applications (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'),
 programme_id uuid not null references programmes(id), name text not null check(length(trim(name))>0),
 subject_ref text not null check(length(trim(subject_ref))>0), owner text not null check(length(trim(owner))>0),
 received_on date not null, due_on date not null, retention_review_on date not null, recertify_on date,
 status text not null default 'open' check(status in ('open','withdrawn','closed')),
 revision integer not null default 1 check(revision>0), last_contact_on date, source_status text not null default '',
 import_source text, external_id text, source_data jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(import_source,external_id),check(due_on>=received_on),check(retention_review_on>=received_on)
);
create table requirements (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id),
 name text not null check(length(trim(name))>0), policy_reference text not null check(length(trim(policy_reference))>0),
 due_on date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(application_id,name)
);
create table evidence (
 id uuid primary key default gen_random_uuid(), requirement_id uuid not null unique references requirements(id),
 reference text not null check(length(trim(reference))>0), outcome text not null check(outcome in ('accepted','rejected')),
 checked_on date not null, expires_on date not null, checked_by text not null check(length(trim(checked_by))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),check(expires_on>=checked_on)
);
create table decisions (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id), revision integer not null,
 outcome text not null check(outcome in ('approved','declined','more_information')),
 reason text not null check(length(trim(reason))>0), policy_reference text not null check(length(trim(policy_reference))>0),
 evidence_reference text not null check(length(trim(evidence_reference))>0), reviewer text not null check(length(trim(reviewer))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),unique(application_id,revision)
);
create table appeals (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id),
 decision_id uuid not null references decisions(id), reason text not null check(length(trim(reason))>0),
 owner text not null check(length(trim(owner))>0), due_on date not null, status text not null default 'open' check(status in ('open','resolved')),
 resolution text, evidence_reference text, resolved_by text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'resolved' or (length(trim(resolution))>0 and length(trim(evidence_reference))>0 and length(trim(resolved_by))>0))
);
create table activity (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity unique,
 application_id uuid references applications(id), actor text not null, action text not null, note text not null,
 before_data jsonb, after_data jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), source text not null, sha256 text not null, rows_count integer not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function revise_application() returns trigger language plpgsql as $$begin
 if (new.programme_id,new.name,new.subject_ref,new.owner,new.received_on,new.due_on,new.retention_review_on,new.recertify_on,new.status,new.source_data)
 is distinct from (old.programme_id,old.name,old.subject_ref,old.owner,old.received_on,old.due_on,old.retention_review_on,old.recertify_on,old.status,old.source_data) then new.revision=old.revision+1;end if;return new;end$$;
create trigger revision before update on applications for each row execute function revise_application();
create function revise_evidence() returns trigger language plpgsql as $$declare app uuid;begin
 if TG_TABLE_NAME='requirements' then app=new.application_id;
 else select application_id into app from requirements where id=new.requirement_id;end if;
 update applications set revision=revision+1 where id=app;return new;end$$;
create trigger revision after insert or update on requirements for each row execute function revise_evidence();
create trigger revision after insert or update on evidence for each row execute function revise_evidence();
create function immutable_history() returns trigger language plpgsql as $$begin raise exception 'History is append only';end$$;
create trigger immutable before update or delete on decisions for each row execute function immutable_history();
create trigger immutable before update or delete on activity for each row execute function immutable_history();
do $$declare t text;begin foreach t in array array['programmes','applications','requirements','evidence','decisions','appeals','activity','import_batches'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t);execute format('revoke all on %I from public',t);
end loop;end$$;
create index requirements_application on requirements(application_id);create index decisions_application on decisions(application_id);
create index appeals_application on appeals(application_id);create index activity_application on activity(application_id,sequence desc);
create view v_evidence with(security_invoker=true) as
 select a.code,a.owner,r.id,r.application_id,r.name,r.policy_reference,r.due_on,e.reference,e.checked_by,e.checked_on,e.expires_on,
 case when e.id is null then 'missing' when e.outcome='rejected' then 'rejected' when e.checked_on>current_date then 'future_check' when e.expires_on<current_date then 'expired' else 'current' end as finding
 from requirements r join applications a on a.id=r.application_id left join evidence e on e.requirement_id=r.id;
create view v_casework with(security_invoker=true) as
 select a.id,a.code,a.name,p.name as programme,a.owner,a.subject_ref,a.received_on,a.due_on,a.recertify_on,a.retention_review_on,a.status,a.revision,
 a.last_contact_on,d.outcome as last_decision,d.reviewer,
 case when d.id is null then 'unreviewed' when d.revision<>a.revision then 'stale' else 'current' end as decision_state,
 (select count(*)::int from v_evidence e where e.application_id=a.id and e.finding<>'current') as evidence_gaps,
 (select count(*)::int from requirements r where r.application_id=a.id) as requirements,
 (select count(*)::int from appeals ap where ap.application_id=a.id and ap.status='open') as open_appeals
 from applications a join programmes p on p.id=a.programme_id
 left join lateral (select * from decisions where application_id=a.id order by revision desc limit 1) d on true;
create view v_attention with(security_invoker=true) as
 select code,owner,'application_overdue'::text as finding,due_on as due from v_casework where status='open' and due_on<current_date and (decision_state<>'current' or last_decision='more_information')
 union all select code,owner,'evidence_'||finding,due_on from v_evidence where finding<>'current' and application_id in(select id from applications where status='open')
 union all select code,owner,'stale_decision',due_on from v_casework where decision_state='stale'
 union all select code,owner,'recertification_due',recertify_on from v_casework where status='open' and recertify_on<=current_date+30
 union all select a.code,ap.owner,'appeal_overdue',ap.due_on from appeals ap join applications a on a.id=ap.application_id where ap.status='open' and ap.due_on<current_date;
create view v_compliance with(security_invoker=true) as
 select code,'NZ-IPP9'::text as rule,'Retention purpose needs a human review; never delete automatically'::text as finding from applications where retention_review_on<=current_date
 union all select code,'NZ-IPP8','Evidence is '||finding from v_evidence where finding<>'current'
 union all select code,'LOCAL-CHECKLIST','No programme evidence checklist recorded' from v_casework where requirements=0
 union all select code,'LOCAL-REVIEW','Earlier decision does not cover the current application revision' from v_casework where decision_state='stale';

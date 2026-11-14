create or replace view v_casework with(security_invoker=true) as
 select a.id,a.code,a.name,p.name as programme,a.owner,a.subject_ref,a.received_on,a.due_on,a.recertify_on,a.retention_review_on,a.status,a.revision,
 a.last_contact_on,d.outcome as last_decision,d.reviewer,
 case when d.id is null then 'unreviewed' when d.revision<>a.revision then 'stale' when d.outcome<>'more_information' and exists(select 1 from v_evidence e where e.application_id=a.id and e.finding<>'current') then 'stale' when exists(select 1 from appeals ap where ap.application_id=a.id and ap.status='open') then 'under_appeal' else 'current' end as decision_state,
 (select count(*)::int from v_evidence e where e.application_id=a.id and e.finding<>'current') as evidence_gaps,
 (select count(*)::int from requirements r where r.application_id=a.id) as requirements,
 (select count(*)::int from appeals ap where ap.application_id=a.id and ap.status='open') as open_appeals
 from applications a join programmes p on p.id=a.programme_id
 left join lateral (select * from decisions where application_id=a.id order by revision desc limit 1) d on true;

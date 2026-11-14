do $$declare p uuid; a uuid; b uuid; c uuid; r uuid; d uuid;begin
 if exists(select 1 from programmes where code='DEMO-WARM') then return;end if;
 insert into programmes(code,name,policy_reference) values('DEMO-WARM','Winter essentials support','Fictional demonstration policy W-1') returning id into p;
 insert into applications(code,programme_id,name,subject_ref,owner,received_on,due_on,retention_review_on,recertify_on,last_contact_on) values
 ('APP-101',p,'Winter essentials review','HOUSEHOLD-DEMO-01','Mere',current_date-35,current_date-5,current_date+365,current_date+20,current_date-18) returning id into a;
 insert into requirements(application_id,name,policy_reference,due_on) values(a,'Current address evidence','Demo W-1 section 2',current_date-8);
 insert into requirements(application_id,name,policy_reference,due_on) values(a,'Household circumstances','Demo W-1 section 3',current_date-7) returning id into r;
 insert into evidence(requirement_id,reference,outcome,checked_on,expires_on,checked_by) values(r,'demo:household-review-101','accepted',current_date-60,current_date-10,'Mere');
 insert into applications(code,programme_id,name,subject_ref,owner,received_on,due_on,retention_review_on,recertify_on,last_contact_on) values
 ('APP-102',p,'Transport support review','HOUSEHOLD-DEMO-02','Wiremu',current_date-20,current_date+3,current_date+365,current_date+12,current_date-2) returning id into b;
 insert into requirements(application_id,name,policy_reference,due_on) values(b,'Current circumstances','Demo W-1 section 3',current_date+2) returning id into r;
 insert into evidence(requirement_id,reference,outcome,checked_on,expires_on,checked_by) values(r,'demo:review-102','accepted',current_date-2,current_date+60,'Wiremu');
 insert into decisions(application_id,revision,outcome,reason,policy_reference,evidence_reference,reviewer) select b,revision,'approved','Demo panel recorded support','Demo W-1','demo:panel-102','Aroha' from applications where id=b;
 insert into applications(code,programme_id,name,subject_ref,owner,received_on,due_on,retention_review_on,last_contact_on) values
 ('APP-103',p,'Winter essentials reconsideration','HOUSEHOLD-DEMO-03','Mere',current_date-70,current_date-50,current_date-1,current_date-40) returning id into c;
 insert into requirements(application_id,name,policy_reference,due_on) values(c,'Current circumstances','Demo W-1 section 3',current_date-60) returning id into r;
 insert into evidence(requirement_id,reference,outcome,checked_on,expires_on,checked_by) values(r,'demo:review-103','accepted',current_date-61,current_date+30,'Mere');
 insert into decisions(application_id,revision,outcome,reason,policy_reference,evidence_reference,reviewer) select c,revision,'declined','Demo reviewer recorded a policy mismatch','Demo W-1','demo:panel-103','Aroha' from applications where id=c returning id into d;
 insert into appeals(application_id,decision_id,reason,owner,due_on) values(c,d,'New circumstances supplied','Rangi',current_date-4);
 update applications set name='Winter essentials reconsideration, updated facts' where id=c;
 insert into activity(application_id,actor,action,note) values(a,'Demo seed','seed','Fictional records for testing'),(b,'Demo seed','seed','Fictional records for testing'),(c,'Demo seed','seed','Fictional records for testing');
end$$;

# Move the application register from Salesforce Benefit Management

## Export

An administrator with Export Reports permission prepares an Individual Applications report for one programme. Include Id (Individual Application ID), Name (Application Name), AccountId (Account ID), AppliedDate (Applied Date) and Status. The [Salesforce object reference](https://developer.salesforce.com/docs/industries/public-sector-dev/guide/sforce-api-objects-individualapplication.html) documents the application fields. Report labels depend on your organisation; inspect them instead of assuming a fixed vendor file.

Choose Export, Details Only, Comma Delimited CSV and UTF-8. Salesforce documents this [report export path](https://help.salesforce.com/s/articleView?id=000206326&language=en_US&type=1). If you encounter its documented CSV export issue, use Salesforce Classic or resolve it with the administrator. Do not use a formatted report, joined report, subtotal rows or a truncated spreadsheet preview.

Keep one row per application. Use full 15- or 18-character source IDs consistently. AppliedDate accepts YYYY-MM-DD or an ISO UTC timestamp ending in Z. Locale dates must be converted explicitly. Source files are limited to 20 MB per batch.

## Import

Create the programme with its approved policy reference first. Choose due and retention review dates for the imported batch. Save the file under imports/ and run:

```bash
npm run casework -- import salesforce --file=imports/applications.csv --source=our-deployment --programme=OUR-PROGRAMME --owner="Migration owner" --due-on=2026-12-01 --retention-on=2027-11-01 --actor="Migration owner" --dry-run
```

Use dates appropriate to the current batch. Remove --dry-run to commit the import. A customised report can use --map=fixtures/field-map.json. The map keys are id, name, subject, received and status. Each value is the exact source column heading. The fixture is synthetic, not an export taken from a customer account.

| Salesforce column | Local record |
|---|---|
| Id | external_id, matched with import_source |
| Name | Application label |
| AccountId | Pseudonymous subject reference, not a copied household profile |
| AppliedDate | Receipt date in UTC |
| Status | Historical source_status, never an automatic local approval |
| Other exported columns | Preserved in source_data for deliberate follow-up mapping |

Rows must contain Id, Name, AccountId and AppliedDate. Missing fields, malformed CSV, duplicate IDs, invalid dates and cross-programme conflicts stop the whole file. A dry run rolls back records, activity and import-batch history. Repeated identical source rows leave local owner changes and dates untouched. Changed source rows update imported fields and invalidate old local decisions. Review the changes before importing a refresh. Keep the same deployment label every time.

## Reconcile

Compare application counts and source IDs with Salesforce. Read source_status beside local decision_state. Add each programme's evidence checklist, record the evidence checks and retain signed human decision references. Check three complete cases, including an appeal and a recertification, before deciding what can move out of the old system.

The one-command import moves the application register. It does not migrate household relationships, attachments, benefit assignments, payments, historical assessments, permission rules, portals or policy logic. Enterprise DNA maps the agreed additional records for a custom version. Retain the source system for those functions until their replacement is tested and approved by the responsible organisation.

## Export and recovery

Create an ignored exports/ directory and run npm run casework -- export --file=exports/backup.json. The snapshot contains programmes, applications, requirements, evidence, decisions, appeals, activity and import batches. It preserves UUID relationships. It refuses to overwrite an existing file. CSV export with --kind=applications is spreadsheet-safe but changes formula-leading text for safety, so use JSON for exact records. This repo does not include an automatic restore command. For operational recovery, back up the database with its supported tooling and test restoration in a separate environment before go-live.

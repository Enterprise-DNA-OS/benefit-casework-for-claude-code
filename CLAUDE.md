# Benefit Casework for Claude Code: operating instructions

Read the database before answering. This is an internal casework register for a trusted operator handling benefit application reviews. It does not determine legal eligibility, award money, make payments or contact applicants.

## Working rules

- Use the casework CLI for recurring work. Read the full record and activity before changing it.
- The operator supplies actual facts, document references and human decisions. Never infer sensitive personal circumstances or an applicant's entitlement.
- Use pseudonymous subject references. Keep identity documents in the organisation's controlled document store.
- Use --actor for writes. The name is a recorded statement, not authenticated identity. Do not impersonate the reviewer.
- Missing evidence stays missing. A final decision requires the approved checklist, current evidence and a different reviewer from the case owner.
- Changes to facts, requirements or evidence invalidate earlier decisions. Re-imports preserve source status as historical data only.
- Drafts stay in drafts/. Never send, publish, make a payment or delete records. The authorised person approves outward wording and sends it elsewhere.
- Keep statutory policy interpretation with the responsible authority. Local dates are chosen by the operator and are not invented legal deadlines.
- Keep working data, exports, documents and credentials out of git. Use a separate DATA_DIR for live records. Never seed working data.
- Stay on main. Commit code changes with the trailer Agent: omni-rebuild-strategist.

## Routes

| Ask | Recipe |
|---|---|
| Read programme policies | /programmes |
| Read the application register | /applications |
| Find missing, rejected and expired evidence | /evidence-due |
| Prepare cases for a human decision | /decision-queue |
| Review recertifications due within 30 days | /recertifications |
| Read open and resolved appeals | /appeals |
| Balance case ownership and overdue reviews | /owner-load |
| Read the work needing attention | /attention |
| Check evidence accuracy and retention review prompts | /compliance |
| Read the change history | /activity |
| List accepted commands and options | /help |
| Read all records in one collection | /list |
| Read a complete named record | /show |
| Register a programme and its approved policy | /add-programme |
| Record an application received outside this system | /add |
| Correct case details and invalidate earlier review | /update |
| Add a requirement from the programme policy | /require-evidence |
| Record a person checking evidence | /record-evidence |
| Record the authorised reviewer decision | /record-decision |
| Record a request to review a particular decision | /open-appeal |
| Record an independent appeal review | /resolve-appeal |
| Record a contact or case note | /log |
| Bring an exported application report across | /import |
| Write a complete JSON snapshot | /export |
| Prepare the weekly casework review | /weekly-review |
| Draft an evidence request for internal review | /draft-request |
| Draft a current decision record for internal review | /draft-decision |
| Add a field or change a local rule | /customise |
| Add a read-only report | /new-view |
| Render the weekly HTML reports | /view |
| Render case, decision and appeal briefs | /docs |

## Storage and operation

scripts/casework.mjs is the only domain CLI. supabase/migrations holds the schema and read-only views. npm run migrate applies pending migrations. DATABASE_URL chooses PostgreSQL 15+; otherwise PGlite persists in .data/db. UTC dates are used consistently. Row security has no public policies. Use a trusted owner connection, never expose it to applicants. Shared use needs configured roles, identity, access logging and backup recovery testing. Administrators can alter database objects, so the history is not tamper-proof against an administrator.

npm test uses a temporary PGlite database or an empty disposable TEST_DATABASE_URL. Never point TEST_DATABASE_URL at working records. npm run demo uses fictional data. Reports use brand.json. All read-only views and documents can contain private information; store and share them under the same access controls as the source records.

Built and run through Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=salesforce-benefit-management

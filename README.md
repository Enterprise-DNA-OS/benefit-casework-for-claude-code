# Benefit Casework for Claude Code

Know which applications need evidence, which decisions are stale and which appeals need a reviewer.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install the database and command recipes. | Your programme policies, fields, review dates and agreed Salesforce records brought across. [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=salesforce-benefit-management). | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=salesforce-benefit-management). |

For small teams administering benefit casework. Keep applications, evidence requirements, human decision records, recertifications and appeals together. The database is the product. Claude Code, Codex, OpenCode or Cursor is the door. AGENTS.md carries the shared operating instructions.

Salesforce lists Public Sector Service Core at US$275 per user per month, billed annually. Ten seats imply US$33,000 a year at list price. This is a scenario, not a confirmed NZ/AU customer invoice or a quote for a complete deployment. [Research and scope](docs/research.md).

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/benefit-casework-for-claude-code.git
cd benefit-casework-for-claude-code
npm install
npm run demo
npm run casework -- attention
npm run view
npm run docs
```

Node 20+. PGlite stores the fictional demonstration in .data/db. For working records, use a separate DATA_DIR, run migrate and import without seed. DATABASE_URL selects PostgreSQL 15+. Configure trusted operator access and test backups before shared use. This is not an applicant portal.

## The weekly work

| Recipe | Result |
|---|---|
| /programmes | Read programme policies |
| /applications | Read the application register |
| /evidence-due | Find missing, rejected and expired evidence |
| /decision-queue | Prepare cases for a human decision |
| /recertifications | Review recertifications due within 30 days |
| /appeals | Read open and resolved appeals |
| /owner-load | Balance case ownership and overdue reviews |
| /attention | Read the work needing attention |
| /compliance | Check evidence accuracy and retention review prompts |
| /activity | Read the change history |
| /help | List accepted commands and options |
| /list | Read all records in one collection |
| /show | Read a complete named record |
| /add-programme | Register a programme and its approved policy |
| /add | Record an application received outside this system |
| /update | Correct case details and invalidate earlier review |
| /require-evidence | Add a requirement from the programme policy |
| /record-evidence | Record a person checking evidence |
| /record-decision | Record the authorised reviewer decision |
| /open-appeal | Record a request to review a particular decision |
| /resolve-appeal | Record an independent appeal review |
| /log | Record a contact or case note |
| /import | Bring an exported application report across |
| /export | Write a complete JSON snapshot |
| /weekly-review | Prepare the weekly casework review |
| /draft-request | Draft an evidence request for internal review |
| /draft-decision | Draft a current decision record for internal review |

/customise changes fields and local rules through a tested migration. /new-view adds a read-only report. npm run docs produces case review briefs, decision records and appeal briefs. npm run view renders the week, evidence and recertification reports with your brand.json. Print the HTML to PDF when you need a document.

All 27 CLI commands support --json. Options use --key=value. Read help for accepted fields. Name matching is case-insensitive. Partial IDs work, and ambiguous matches list candidates and exit with an error. Writes require --actor. The actor name is not authenticated identity.

## Evidence and human decisions

A programme has a policy reference. Each application has a checklist chosen from that policy. Evidence carries the reference, checker, review date, expiry and accepted or rejected result. A final decision needs current accepted evidence for every requirement, a current retention review date and a reviewer different from the case owner. An information request can be recorded before evidence is complete.

Changing the application facts, requirements or evidence advances its revision. Earlier decisions become stale. Evidence expiry is checked at read time. An open appeal blocks a replacement decision until a different reviewer records its resolution. Decisions and activity are append-only through the database's normal write path. An administrator can alter the database and is not constrained by this history mechanism.

The authorised person supplies every outcome and reason. The software checks record completeness. It does not determine statutory entitlement, award a benefit, execute payments or send notices. Programme policy and review dates must come from the responsible organisation. The demo programme is fictional. [Compliance sources and exact scope](docs/compliance.md).

## Ten questions to ask

These are checks the CLI answers now. They are not claims that Salesforce cannot be configured to produce similar reports.

1. Which overdue applications also have evidence gaps? Use /applications.
2. Which evidence references have expired? Use /evidence-due.
3. Which earlier decisions no longer cover the current facts? Use /applications.
4. Which applications have no evidence checklist at all? Use /compliance.
5. Which recertifications fall due in the next 30 days? Use /recertifications.
6. Which appeal deadlines have passed and who owns them? Use /attention.
7. Which case owner has the largest overdue queue? Use /owner-load.
8. Which records need a retention-purpose review? Use /compliance.
9. What did each reviewer record and when? Use /activity.
10. Which decisions are under appeal or awaiting more information? Use /applications.

## Your first hour: ten things to ask for

1. Set our business name and colours in brand.json.
2. Show the overdue applications and their owners.
3. Explain which household evidence is missing.
4. Find decisions based on older facts.
5. Show recertifications due in the next 30 days.
6. Draft an evidence request for APP-101.
7. Render the appeal review brief for APP-103.
8. Preview our Salesforce application report import.
9. Add our programme region through /customise.
10. Add a report grouping overdue work by region through /new-view.

## Bring the application register across

First add your programme and policy with /add-programme. Export a Salesforce Individual Applications report as Details Only CSV in UTF-8, with the columns described in the [switching guide](docs/replace-salesforce-benefit-management.md).

```bash
npm run casework -- import salesforce --file=imports/applications.csv --source=our-deployment --programme=OUR-PROGRAMME --owner="Migration owner" --due-on=2026-12-01 --retention-on=2027-11-01 --actor="Migration owner" --dry-run
```

Choose review dates from your policy. Remove --dry-run to import. --map=fixtures/field-map.json maps customised headers. Source statuses are retained as history, including Approved, but never create a local decision. Repeated identical rows leave local edits alone. Changed source rows update imported fields and invalidate earlier review. Applications match on deployment name and source ID. A bad row or late conflict rolls back the entire file.

This imports application records, not payment history, household members, attachments or configured decision rules. Map those separately before retiring a source system. The complete export contains all eight record collections as JSON. CSV exports protect spreadsheet formula cells and are for review, not exact restore. [Why no front end](docs/why-no-front-end.md).

## Tests

npm test creates a temporary database, migrates, seeds twice, exercises every CLI command and checks stale decisions, evidence expiry, independent reviewers, appeal controls, atomic imports, exports and HTML escaping. The manual workflow defines Node 20 and 22 on Windows and Linux plus PostgreSQL 17. TEST_DATABASE_URL must be an empty disposable database. Working DATABASE_URL is ignored by the test.

## Make it yours

Enterprise DNA builds your agreed intake screens, connections, programme-specific rules or a different stack into your version. Omni by Enterprise DNA installs and runs it for one setup fee, then a retainer. Hosting and coding-agent usage have separate costs. [Spend 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=salesforce-benefit-management).

MIT. Not affiliated with Salesforce or Anthropic.

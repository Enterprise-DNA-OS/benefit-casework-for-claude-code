# Record a person checking evidence

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- record-evidence --ref=<application> --requirement="<requirement name or id>" --evidence="<controlled document reference>" --outcome=accepted --checked-on=<YYYY-MM-DD> --expires-on=<YYYY-MM-DD> --actor="<checker>"
```

Use the approved programme policy to choose the requirement or evidence expiry. Never invent a statutory threshold. Record controlled document references, not raw identity documents.

Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

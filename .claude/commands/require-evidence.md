# Add a requirement from the programme policy

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- require-evidence --ref=<application> --name="<requirement>" --policy="<policy section>" --due-on=<YYYY-MM-DD> --actor="<operator>"
```

Use the approved programme policy to choose the requirement or evidence expiry. Never invent a statutory threshold. Record controlled document references, not raw identity documents.

Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

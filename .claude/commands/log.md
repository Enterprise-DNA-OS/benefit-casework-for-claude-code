# Record a contact or case note

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- log --ref=<application> --note="<actual contact or observation>" --contact-on=<YYYY-MM-DD> --actor="<operator>"
```


Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

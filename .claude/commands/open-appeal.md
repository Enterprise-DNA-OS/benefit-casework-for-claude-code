# Record a request to review a particular decision

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- open-appeal --ref=<application> --decision=<decision-id> --reason="<received reason>" --owner="<appeal owner>" --due-on=<YYYY-MM-DD> --actor="<operator>"
```


Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

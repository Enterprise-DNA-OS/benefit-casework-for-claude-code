# Record an application received outside this system

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- add --code=<code> --name="<case label>" --programme=<programme> --subject=<pseudonymous-reference> --owner="<owner>" --received-on=<YYYY-MM-DD> --due-on=<YYYY-MM-DD> --retention-on=<YYYY-MM-DD> --actor="<operator>"
```


Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

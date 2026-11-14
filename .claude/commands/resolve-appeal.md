# Record an independent appeal review

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- resolve-appeal --ref=<appeal-id> --resolution="<human resolution>" --evidence="<review reference>" --actor="<appeal reviewer>"
```

The reviewer must differ from the original decision reviewer. Resolution does not rewrite that decision. If a new decision is required, record the changed facts or evidence and then record the authorised replacement review.

Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

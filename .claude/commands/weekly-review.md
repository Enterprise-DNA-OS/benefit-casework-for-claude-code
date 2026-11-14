# Prepare the weekly casework review

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- weekly-review
```

This reads applications, attention and recertifications together. State overdue cases, evidence gaps, stale decisions and appeals by owner. Separate current evidence from unknowns. Draft a short Monday review without sending it.

Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

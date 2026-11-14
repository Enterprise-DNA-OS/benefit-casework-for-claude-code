# Bring an exported application report across

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- import salesforce --file=<UTF-8.csv> --source=<deployment-name> --programme=<programme> --owner="<migration owner>" --due-on=<YYYY-MM-DD> --retention-on=<YYYY-MM-DD> --actor="<operator>" --dry-run
```

Read docs/replace-salesforce-benefit-management.md first. Compare the dry-run counts and source columns. Remove --dry-run only for an authorised import. Source statuses never create local approvals.

Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

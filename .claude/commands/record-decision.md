# Record the authorised reviewer decision

Read CLAUDE.md. Read the relevant full record and activity before writing. Resolve ambiguous matches with the operator.

```bash
npm run casework -- record-decision --ref=<application> --outcome=approved --reason="<reviewer supplied reason>" --policy="<policy reference>" --evidence="<signed decision reference>" --actor="<reviewer>"
```

The reviewer must supply the outcome, reason, policy and signed evidence reference. Never infer entitlement or decide for them. Outcomes are approved, declined or more_information. Final outcomes need current accepted evidence for every requirement, a current retention review date and a reviewer different from the case owner. These checks establish record completeness, not statutory eligibility.

Add --json for structured output. Report what the records establish and what still needs evidence. Write operations require the actual operator name, not a fictional identity. Drafts stay in drafts/ and are never sent.

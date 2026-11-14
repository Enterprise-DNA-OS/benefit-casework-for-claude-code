# Compliance checks and their limits

Checked 14 November 2026. The rules below are prompts to review records. They do not certify compliance or determine a person's legal entitlement. The demo programme and its policy references are fictional. The responsible authority supplies the actual policy, lawful basis, retention schedule and review procedure.

| Rule | Source | What the command checks |
|---|---|---|
| NZ-IPP8 | [NZ Privacy Commissioner, Principle 8](https://www.privacy.org.nz/privacy-principles/8/) | Missing, rejected, expired or future-dated evidence is flagged before use. |
| NZ-IPP9 | [NZ Privacy Commissioner, Principle 9](https://www.privacy.org.nz/privacy-principles/9/) | A retention-purpose review is due when its operator-selected date arrives. Nothing is deleted. |
| LOCAL-CHECKLIST | Organisation's approved programme policy, recorded on each requirement | No checklist means a final decision cannot be recorded. |
| LOCAL-REVIEW | This build's review-control design | Changed facts, changed evidence or expired evidence make the earlier final review stale. |
| LOCAL-INDEPENDENCE | This build's review-control design | Decision reviewer differs from the case owner; appeal reviewer differs from the original decision reviewer. |

Principle 8 requires reasonable steps to check information before use. The checks here show gaps in recorded evidence, not whether the underlying facts are true. Principle 9 limits retention to a lawful purpose. It does not prescribe the review date used by this software. Resolve relevant public-records retention requirements before deleting anything in another system.

The last three rules are local controls, not assertions that legislation demands those exact checks. Do not apply this NZ privacy checklist as Australian legal advice. An Australian deployment needs its applicable obligations reviewed and configured by its responsible organisation.

The system never calculates a statutory entitlement, awards a benefit, pays money or issues a notice. Only a human decision already made by an authorised reviewer is recorded. Completeness of a checklist does not establish eligibility. Do not put actual sensitive data in the demo or git.

Actor names are operator supplied. Shared production use needs authenticated identity, role separation, approved hosting, access review, backup recovery testing and controlled document storage. Row security is enabled with no public policies. A privileged database administrator can alter the schema, data and history.

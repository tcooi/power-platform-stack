# Spawn templates

Sub-agents start with an empty context and may not load skills on their own. Put everything they need **in the brief**.

## Standard brief
```
ROLE: <agent name>
GOAL: <one sentence>
MODE: lightweight | standard | full
PROJECT: client=<>, env=<url> (confirmed by user <date>), solution=<uniqueName>, prefix=<prefix>
INPUTS: <paths, e.g. docs/requirements.md, docs/design/solution-design.md>
APPROVED CHANGES: <exact list, or "none – documents only">
RULES (copied from skills):
  - <3–8 bullets copied from the relevant skill(s), e.g. data-model-design, our build standards>
TOOLS AVAILABLE: <e.g. pac 2.x signed in, Dataverse MCP read-only, Microsoft Learn MCP>
DONE WHEN: <acceptance criteria>
RETURN: Summary, Artifacts, Assumptions, Open questions, Risks, Next step
```

## Which skills to copy rules from
| Sub-agent | Skills / resources |
|---|---|
| requirements-analyst | solution-design (resources/fit-gap-analysis.md) |
| solution-designer | solution-design (all resources), tool-selection-guide |
| alm-architect | alm (all resources) |
| pro-code-developer | pro-code (all resources) |
| the-critic | the design/plan being reviewed plus quality-review (resources/security-governance-review.md) |
| solution-reviewer | quality-review, testing (resources/test-strategy.md) |
| uat-tester | testing, the app's regression suite in `tests/<app>/` |
| app-analyst | the app/solution names, existing `docs/as-built/`, the change request |
| support-engineer | the incident report (who, what, when, record ids), ppdv-toolkit, flow-build (trigger checks) |

Every brief also carries the sub-agent rules from `resources/subagent-rules.md`.

Lightweight mode: GOAL, PROJECT, INPUTS, DONE WHEN only.

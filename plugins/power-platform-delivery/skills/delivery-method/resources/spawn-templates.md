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
| Sub-agent | Skills |
|---|---|
| requirements-analyst | fit-gap-analysis |
| solution-designer | data-model-design, security-model-design, solution-design-document, tool-selection-guide |
| alm-architect | plan-alm, environment-strategy, source-control-unpack, solution-alm-checklist |
| pro-code-developer | plugin-development, web-resource-js, pcf-control, custom-api-and-actions, ce-customization-patterns |
| the-critic | the design/plan being reviewed plus security-governance-review |
| solution-reviewer | solution-checker-review, security-governance-review, test-strategy |

Lightweight mode: GOAL, PROJECT, INPUTS, DONE WHEN only.

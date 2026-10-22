---
name: delivery-method
description: "How the delivery lead runs an engagement: per-project settings and state on disk (.pp/project.json, .pp/state/delivery.json) and the brief templates for sub-agents. Use at the start of every Power Platform session, after every phase/decision/build step, and whenever a sub-agent is started."
---

# Delivery method

## Rules
1. **Project settings** live in `.pp/project.json` (environments with url + id, solution, publisher prefix; no secrets). Create it with the user before any build; check it with `ppdv state check`.
2. **Progress** lives in `.pp/state/delivery.json`. Read it first and resume; update it only through `ppdv state phase|task|add` (schema-checked: valid phases, task statuses, no build phase without a recorded approval).
3. **Approvals** are recorded the moment the user gives them (`ppdv state add --kind approval --text "..."`).
4. **Sub-agents** get a self-contained brief (resources/spawn-templates.md): they don't see the conversation and may not load skills themselves.
5. **Test-only items** are recorded with `ppdv artifacts add` so `ppdv teardown` can remove them.

## Detailed guidance (load the file you need)
- `resources/project-context.md` — Per-project settings and delivery state on disk (.pp/project.json and .pp/state/delivery.json) so every agent uses the same environment, solution and publisher, and work resumes after a session reset. Use at the start of every Power Platform session and after every phase, decision or build step.
- `resources/spawn-templates.md` — Brief templates the delivery lead uses when starting sub-agents, so they get project settings, rules and approvals explicitly instead of relying on inherited skills. Use every time a sub-agent is started.

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
5. **Document layout** (all agents write here, nowhere else):
   - `docs/requirements.md`, `docs/design/` (solution design, critic review, approval request), `docs/alm-plan.md`
   - `docs/as-built/<app unique name>.md` (app-analyst; refreshed after each release)
   - `docs/changes/<id>.md` (request), `docs/changes/<id>-impact.md` (impact), `docs/changes/<id>-design.md` (design delta)
   - `docs/incidents/<id>.md` (support-engineer diagnosis), `docs/releases/<version>.md` (release notes)
   - `tests/<app>/` (regression suite)
6. **Precedence with Microsoft's skills.** Our project rules win on environment, solution, publisher prefix, naming, approvals and security model; Microsoft's skill wins on how to build correctly (form layout, Power Fx, flow definitions, PCF structure). Pass our rules **into** the Microsoft skill's inputs (for `/app-builder`: the spec's `solution`, `publisherPrefix`, `personas`, `app.newLook`, pages). A real conflict is reported to the user, never settled silently.
7. **Project standards** in `.pp/project.json` → `standards` (defaults shown): `{"newLook": true, "generativePages": "when-asked", "personaRoles": true, "formHeader": ["status"], "language": null}`. The lead applies them when calling Microsoft skills.
8. **One approval per change.** Record it with an id (`ppdv state add --kind approval --text "A3: <scope>"`) and pass that scope to the Microsoft skill. Where the skill supports an unattended mode (e.g. `/app-builder` with `POWER_PLATFORM_SKILLS_NONINTERACTIVE=1` / `--non-interactive`), run it with the approved spec as authoritative requirements: its lint, preview and dry run still run and it still refuses destructive changes, but it doesn't ask again. Where it must ask, compare its plan with the approval: same scope → "matches approval A3", one-word OK; different → show only the difference.
9. **Verify after every build step**: `ppdv verify --solution <solution> --since <build start>` must pass before anything is reported as done (solution membership incl. table subcomponents, publisher prefix, flow triggers; health as a warning).
10. **Test-only items** are recorded with `ppdv artifacts add` so `ppdv teardown` can remove them.

## Detailed guidance (load the file you need)
- `resources/project-context.md` — Per-project settings and delivery state on disk (.pp/project.json and .pp/state/delivery.json) so every agent uses the same environment, solution and publisher, and work resumes after a session reset. Use at the start of every Power Platform session and after every phase, decision or build step.
- `resources/spawn-templates.md` — Brief templates the delivery lead uses when starting sub-agents, so they get project settings, rules and approvals explicitly instead of relying on inherited skills. Use every time a sub-agent is started.

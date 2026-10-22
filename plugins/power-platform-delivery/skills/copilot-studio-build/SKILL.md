---
name: copilot-studio-build
description: "Our standards for Copilot Studio agents (instructions, tools, knowledge, evaluation, pac copilot pull/push/pack/publish, solution placement). Use whenever a Copilot Studio agent is designed, built, changed or evaluated."
---

# Copilot Studio build standards

**Microsoft tool**: `pac copilot clone|init`, **`pac copilot pull` before every edit**, `pac copilot push`, `pac copilot pack --publisher-prefix <prefix>` for pipelines; or the Copilot Studio VS Code extension. Details: `resources/agent-instructions-design.md`, `resources/agent-evaluation-plan.md`.

## Verified in TEST-US (2026-10-22)
- `pac copilot init --name … --publisher-prefix … --instructions … --environment <id>` scaffolds, packs, imports and connects the workspace in about a minute.
- **It puts the agent in its own new solution** (`<prefix>_<Name>`), not the project's working solution. Add it: `ppdv solution add --solution <working solution> --id <bot id> --type 10225 --required --apply` (brings the agent's components along), then check with `ppdv solution has`.
- `pac copilot pull` → edit YAML → `pac copilot push` works; confirm the change with `ppdv request GET "botcomponents?$filter=_parentbotid_value eq <bot id> and componenttype eq 15"`.
- `pac copilot publish --bot <id> --environment <env>` works. `pac copilot status` fails with a pac error (`componentstate_Property`); rely on publish's own result.
- Chatting needs Copilot Credits in the environment; check before planning evaluation runs.

## Our rules
- Start from job, audience and channels; tight instructions; one-to-two-sentence tool descriptions saying *when* to use each tool.
- Choose the harness deliberately (standard vs GitHub Copilot harness, which uses Copilot Credits).
- Decide authentication early (Entra SSO vs none).
- Agents ship in solutions with connection references and environment variables; deploy via pipelines.
- Evaluation set before publishing; re-run on every change.


## Always
- Run in the main session (the Microsoft skills ask you questions and wait for approval).
- Load `.pp/project.json`; confirm environment (`pac org who`), solution and prefix before the first change.
- After building, confirm every new component is in the solution (`ppdv solution has`; `ppdv solution add` if not), export and unpack (or commit via Git integration), record test-only items with `ppdv artifacts add`, and log progress with `ppdv state task|add` (never hand-edit the state file).

## Detailed guidance (load the file you need)
- `resources/agent-instructions-design.md` — Write effective Copilot Studio agent instructions, tool descriptions and knowledge setup. Use when drafting or tuning an agent.
- `resources/agent-evaluation-plan.md` — Plan and run evaluation of a Copilot Studio agent with test sets covering happy paths, edge cases and safety. Use before publishing.

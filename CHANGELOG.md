# Changelog

## 2.10.1 (2026-10-25)
- First fallback review: model-apps 2.19.0, dataverse 1.16.1 and pac 2.14.1. All entries still needed except `dv-int-range` (retired: the Python SDK route now sets whole-number min/max; verified in TEST-US with a temporary column, removed afterwards).
- Corrected two descriptions: `/app-builder` leaves the new look off by default but writes the header and navigation refresh ON for new apps; a view named like an existing one gets the spec's columns but not its sort or filters (the build now warns).
- README: install dataverse from `power-platform-skills` (the Anthropic marketplace pins 1.14.0), HTTPS workaround for the install, repo renamed to `tcooi/power-platform-stack`.

## 2.10.0 (2026-10-24)
- `fallbacks.json`: every fallback and conflict rule with the Microsoft plugin (or pac) version it was checked against. Skill tables carry the entry id; `validate.py` fails when an active entry isn't referenced, a retired one still is, or fields are missing, and warns after 90 days.
- `ppdv fallbacks status|outdated|review|mark|retire`: installed vs checked vs latest versions (GitHub, NuGet; no sign-in, no cost), changelog sections or commits since the checked version with the entries they mention, and dry-run updates of the file.
- `ppdv probe` reports unverified entries; the lead checks Microsoft's updated skill before using one.
- Weekly GitHub Action (`fallbacks.yml`) keeps one issue open while Microsoft has newer versions than we checked.
- First run: model-apps 2.17.0 → 2.19.0, dataverse 1.14.0 → 1.16.1 and pac 2.12.2 → 2.14.1 are behind upstream.

## 2.9.0 (2026-10-24)
- `ppdv verify`: after every build step checks that new/changed components (yours only) are in the solution (incl. table subcomponents), use the publisher prefix, flow triggers are registered; health as a warning. Verified live (pass on the E2E build, catches a component outside the solution with a foreign prefix).
- Raw `ppdv request` writes need `--reason`, are logged to `.pp/state/api-writes.jsonl`, record PATCH/PUT are read back, and the hook asks the user first.
- Precedence rule (our project rules vs Microsoft's how-to), project `standards` in `.pp/project.json`, known-conflict tables in build skills, one approval per change with ids and `/app-builder` unattended mode.
- Fix: piped toolkit output over 64 KB was truncated.
- Fix: probe reported the Dataverse CLI missing (`dataverse --version` exits 1); also reports the Python SDK.
- Eval `build-then-verify` (slow): approved build → Microsoft dv-metadata → `ppdv verify` before done (passes).

## 2.8.1 (2026-10-22)
- One document layout for all agents (`delivery-method` rule 5): the live app-analyst test wrote its impact analysis to a different folder than the agent file said.
- app-analyst verified live on the E2E Test app (as-built + CR-1 impact, read-only, ~9 min).

## 2.8.0 (2026-10-22)
- Application management: lead decides the work type first (new build, change request, incident, release) with a sequence for each.
- New `app-analyst` (as-built docs and impact analysis for existing apps) and `support-engineer` (read-only incident diagnosis).
- Updated: requirements-analyst (change requests and bugs), solution-designer (design deltas, no in-place edits of managed components), pro-code-developer (find source first, keep step registrations in sync), solution-reviewer (change stayed within scope), alm-architect (versioning, hotfix via patch or fast-track), uat-tester (regression suite per app in `tests/<app>/`).
- Canonical sub-agent rules in `delivery-method/resources/subagent-rules.md`; `validate.py` fails if an agent's copy drifts.
- Evals: change-request and incident routing.

## 2.7.0 (2026-10-22)
- Skills consolidated from 44 to 16; each has a short SKILL.md and on-demand `resources/`.
- `ppdv state` command and schema checks for `.pp/project.json` and `.pp/state/delivery.json`.
- Microsoft `pcf` plugin path tested via the delivery lead (build, gates, push, verify); `pcf` teardown type; `--env` accepts environment keys.
- Changelog, quick-start, eval results no longer committed.

## 2.6.0 (2026-10-22)
- Verified Microsoft `dataverse` plugin path (dv-metadata via the Dataverse CLI) and ALM deployment TEST-US → TEST (release solution, managed export, unpack, deployment settings, import, verification, teardown).
- `ppdv health`: detects a stuck background service (Dataverse-triggered flows and async plug-ins won't run).
- Teardown saves progress, survives dropped connections.

## 2.5.0
- `ppdv artifacts` + `teardown` for test artifacts; 19 offline tests; live smoke test; GitHub Actions CI.

## 2.4.0
- Guardrail hook covers `pac` writes (by `--environment` or the active pac profile) and MCP write tools.

## 2.3.0
- Copilot CLI portability (hook format, wrapper, probe, toolkit location); Copilot Studio findings; slow Full-mode eval with sub-agents.

## 2.2.0
- `scripts/ppdv.mjs` toolkit, guardrail hook, `uat-tester`, user testing and browser fallback skills, evals.

## 2.1.x
- E2E test findings, security role tool matrix, live role test.

## 2.0.0
- One plugin `power-platform-delivery`; lead builds in the main session with Microsoft's plugins; sub-agents non-interactive.

## 1.x
- Ten separate plugins (superseded).

# Changelog

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

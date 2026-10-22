---
name: flow-build
description: "Our standards for Power Automate cloud flows (Dataverse triggers, error handling, ownership, trigger registration checks), applied with Microsoft's power-automate plugin and ppdv flow commands. Use whenever a cloud flow is built, changed, turned on or debugged."
---

# Flow build standards

**Microsoft tool**: `power-automate` plugin (`/setup`, `/build-flow`, `/create-flow`, `/debug-flow`, `/diagnose-flow`, `/manage-flows`); needs `az login --allow-no-subscriptions`. New flows are created stopped for review. Details: `resources/flow-error-handling-pattern.md`, `resources/flow-dataverse-triggers.md`.

## Our rules
- Flows live in the solution with connection references and environment variables; verify membership after the plugin creates a flow.
- Dataverse triggers filter rows and select columns; guard against update loops.
- Try/Catch/Finally scopes; failures logged and alerted.
- Child flows for reuse; deliberate concurrency and pagination.
- Production flows owned by a service account or application user with a co-owner.
- Turn flows on only after review.

## Lessons from live builds (TEST-US, 2026-10-21)
- `/build-flow` runs headless (forked) and its FlowAgent `create_flow` cannot create a flow inside a solution, so it falls back to writing the `workflow` row through the Web API. Expect that, and check the result.
- **Turn flows on and off through the flow service**: `ppdv flow enable|disable --flow <id> --apply` (or `publish_flow` / `disable_flow` in the power-automate plugin). Setting `statecode` on the `workflow` row shows the flow as on but does **not** register its Dataverse trigger.
- For a Dataverse trigger written through the Web API: set `subscriptionRequest/name` to `<workflowid>:MTA`, and don't set `subscriptionRequest/filteringattributes` on a create-only trigger (message 1); filters only apply to updates.
- After turning a flow on, run `ppdv flow check-trigger --flow <id>` (and `ppdv flow fix-trigger` if it reports issues). Under the hood: `GET callbackregistrations?$filter=entityname eq '<table>'` must return `<workflowid>:MTA`. A flow can show Started with no runs and no error when it isn't.
- Prove it with one live test row (user-approved) and check run history before calling the flow done.


## Always
- Run in the main session (the Microsoft skills ask you questions and wait for approval).
- Load `.pp/project.json`; confirm environment (`pac org who`), solution and prefix before the first change.
- After building, confirm every new component is in the solution (`ppdv solution has`; `ppdv solution add` if not), export and unpack (or commit via Git integration), record test-only items with `ppdv artifacts add`, and log progress with `ppdv state task|add` (never hand-edit the state file).

## Detailed guidance (load the file you need)
- `resources/flow-error-handling-pattern.md` — Standard try/catch/finally scope pattern, retries and alerting for Power Automate flows. Use for any production flow.
- `resources/flow-dataverse-triggers.md` — Configure Dataverse triggers and actions correctly (filter rows, select columns, scope, relationships, upsert). Use when building Dataverse-driven flows.

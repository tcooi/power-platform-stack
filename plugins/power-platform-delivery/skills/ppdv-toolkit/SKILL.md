---
name: ppdv-toolkit
description: "Tested command-line toolkit (scripts/ppdv.mjs) for Power Platform work Microsoft's plugins don't cover: Web API requests with auth/retry/solution header, solution membership, publish, role privileges and assignment, flow enable/disable with trigger checks, choice defaults, view sorting, permission tests as a real user, and a tooling probe. Use instead of hand-written curl."
---

# ppdv toolkit

Run with Node 18+: `node "<plugin root>/scripts/ppdv.mjs" <command>`. Output is always JSON.

**Finding the plugin root**
- Claude Code: two folders above this skill's base directory (shown when the skill loads), or `$CLAUDE_PLUGIN_ROOT` in hooks.
- Copilot CLI: `~/.copilot/installed-plugins/<marketplace>/power-platform-delivery` (e.g. `~/.copilot/installed-plugins/ppp/power-platform-delivery`).
- Anywhere: `ls -d ~/.claude/plugins/cache/*/power-platform-delivery/*/ ~/.copilot/installed-plugins/*/power-platform-delivery 2>/dev/null` and use the newest.

**Safety built in**
- Target comes from `.pp/project.json` (first environment, or `--target <key>`), or `--env <url>`.
- Every write is a **dry run** unless `--apply` is given. Show the dry run to the user, get approval, then re-run with `--apply`.
- Writes are refused when the environment is not in `.pp/project.json`; production entries (`"production": true`, key `prod*`, or type Production) also need `--allow-prod` and explicit approval.
- Auth uses the Azure CLI session (`az login --allow-no-subscriptions`); 429/5xx are retried with `Retry-After`.

| Need | Command |
|---|---|
| Tools, auth, which Microsoft plugins/skills are installed | `probe` |
| Is the environment healthy (background service, stuck system jobs)? | `health` |
| Who/where am I | `whoami` |
| Any Web API call (fallback) | `request <METHOD> <path> [--data <json or @file>] [--solution <name>] [--strong]` |
| Is it in the solution / add it | `solution has --solution S --id G` · `solution add --solution S --id G --type N` · `solution components --solution S` |
| Publish | `publish [--entities a,b]` |
| Role privileges | `role get` · `role add --privilege prvX --depth Basic|Local|Deep|Global` · `role remove --privilege prvX` (all `--role <name or id>`) |
| Role members | `role members` · `role assign --user <upn>` · `role unassign --user <upn>` |
| Flow on/off through the flow service | `flow state|enable|disable --flow <workflowid>` (needs `"id"` of the environment in `.pp/project.json`) |
| Dataverse trigger health | `flow check-trigger --flow <id>` · `flow fix-trigger --flow <id>` (flow off first) |
| Choice column default | `choice default --table T --column C --value <int>` (form default only; API creates don't get it) |
| View sort | `view sort --view <name or id> --table T --attr <col> [--desc] [--replace]` |
| Record test artifacts / clean up | `artifacts add --type row|flow|bot|role|appmodule|webresource|connectionreference|column|table|solution --id <id> [--table T]` · `artifacts list` · `teardown` (dry run; `--apply` deletes in dependency order; only what was recorded) |
| What can a user actually do? | `test as-user --user <upn> --table T [--ops create,read,update,delete,read-others]` (impersonates via `CallerObjectId`, cleans up its rows) |

**Verified live in TEST-US (2026-10-22):** probe, whoami, guard refusal, role add/remove/assign/unassign/members, solution has, flow state/disable/enable/check-trigger/fix-trigger, choice default, view sort (fixed the app-builder sort gap; Microsoft's verifier then passed 19/19), test as-user (persona role: create/read/update allowed, delete and read-others denied).

**Facts learned with it**
- `DefaultFormValue` behaved differently per environment (set afterwards: API creates stayed empty; imported with the column: API creates got it). Test it; don't rely on it.
- `health` found an environment whose background service had been stuck for two days (Dataverse-triggered flows never ran there). Run it in preflight and before deploying.
- Turning a flow on by PATCHing `workflow.statecode` does not register its Dataverse trigger; `flow enable` (flow service) does.

---
name: tool-selection-guide
description: "Choose the best tool for a Power Platform task based on Microsoft Learn guidance: Microsoft's official agent plugins, Dataverse MCP, Dataverse CLI, Dataverse SDK for Python, pac CLI, Dataverse Web API, designers, pipelines and CI actions. Use before any command that reads or changes an environment."
---

# Tool selection guide

Our plugin holds the consulting method (phases, approvals, standards). **Building is done in the main session with Microsoft's official tooling**, which validates what it creates; our `*-build-standards` skills add our rules on top. Prefer the first available option in each row.

## 1. Microsoft agent plugins (install these first)

| Area | Plugin (marketplace) | Use for |
|---|---|---|
| Dataverse schema, data, queries, solutions, security, admin | `dataverse` (Claude Code: `dataverse@claude-plugins-official`; Copilot: `dataverse@awesome-copilot`; source `microsoft/Dataverse-skills`) | Skills `dv-connect`, `dv-metadata`, `dv-data`, `dv-query`, `dv-solution`, `dv-security`, `dv-admin` |
| Model-driven apps, generative pages | `model-apps@power-platform-skills` | `/app-builder` (tables, forms, views, charts, business rules, BPFs, app module, sitemap), `/genpage` |
| Canvas apps | `canvas-apps@power-platform-skills` | `/canvas-app` via live coauthoring + canvas authoring MCP (validates `.pa.yaml`) |
| Cloud flows | `power-automate@power-platform-skills` | `/build-flow`, `/create-flow`, `/debug-flow`, `/manage-flows` via the bundled FlowAgent MCP |
| PCF code components | `pcf@power-platform-skills` | Scaffold, build, package PCF |
| Code apps, Power Pages | `code-apps-preview`, `power-pages` (`@power-platform-skills`) | When the design uses them |

Install all Power Platform plugins: `/plugin marketplace add microsoft/power-platform-skills`, then install the plugins above.

## 2. Our toolkit (when Microsoft's plugins stop)
`scripts/ppdv.mjs` (skill `ppdv-toolkit`): tested commands with dry runs and an environment guard for Web API calls, solution membership, publish, role privileges/assignment, flow enable/disable and trigger checks, choice defaults, view sort, permission tests as a user, and the tooling probe. Browser actions (skill `browser-automation-fallback`) come after that.

## 3. Underlying tools (what those plugins and our agents use)

| Tool | Best for | Notes |
|---|---|---|
| **Dataverse MCP server** (`https://<org>.crm.dynamics.com/api/mcp`) | Interactive queries, schema discovery, small record or metadata operations | Admin must enable it and allow-list the client per environment; tenant admin consent for the CLI proxy. **Billed in Copilot Credits** for agents outside Copilot Studio (since 15 Dec 2025) unless users have D365 Premium or M365 Copilot licences. `delete_*` tools need explicit approval. Preview tools at `/api/mcp_preview`. |
| **Dataverse CLI** (`npm i -g @microsoft/dataverse`, preview) | Auth profiles (shared with pac), headless data query/CRUD/upsert, invoking custom APIs, local MCP proxy (`dataverse mcp <url>`) | `dataverse mcp <url> --validate` checks MCP prerequisites |
| **Dataverse SDK for Python** | Scripted schema operations, bulk data, paging, transformations, analytics | Uses the Web API |
| **pac CLI** | Solution ALM (`pac solution`), environments (`pac admin`), role assignment (`pac admin assign-user`), plug-ins (`pac plugin`), PCF (`pac pcf`), model apps (`pac model`), Copilot Studio (`pac copilot`), pipelines (`pac pipeline`) | `pac copilot mcp --run` exposes pac as a local MCP server (needs .NET 10) |
| **Dataverse Web API** | Only what managed tools don't cover — call it through `ppdv request`, not raw curl | Metadata writes with `MSCRM.SolutionUniqueName: <solution>`; read back with `Consistency: Strong` (metadata cache ~30 s) |
| **Maker designers** | Form header fields, command bar (modern designer), anything without an API skill | Always inside the working solution |

## 4. By task

| Task | Use | Avoid |
|---|---|---|
| Tables, columns, relationships, keys, choices | `dv-metadata` → Python SDK / Web API with solution header | Hand-written solution XML; Default solution |
| Forms, views, sitemap, app module, BPF, business rules | `/app-builder` (model-apps) or `dv-metadata` for forms/views; `pac model create --solution <name>` | `pac model create` without `--solution` (defaults to Default) |
| Bulk data / migration | `dv-data` → `CreateMultiple`/`UpdateMultiple`/`UpsertMultiple`, `$batch` (≤1,000 ops) | One request per row; MCP for volume |
| Ad hoc query | Dataverse MCP `read_query` / `dv-query` | Exporting to Excel by hand |
| Security roles: create, edit privileges, assign | `security-roles` matrix: `/app-builder` `personas[]` / `roleGrants[]`, Web API (`AddPrivilegesRole`, `ReplacePrivilegesRole`, `RemovePrivilegeRole`), `pac admin assign-user` / `assign-group`, `dv-security` | Editing roles in PROD; roles authored only by clicking |
| Choice column default | Web API `DefaultFormValue` | Hand-edited solution XML |
| Solution export/import/pack/check | `dv-solution` or `pac solution …` | Opening zips with standard tools |
| Source control | Dataverse Git integration (dev environments; managed environments required) or `pac solution clone`/`export`+`unpack` | `pac canvas pack/unpack` (deprecated) |
| Deployment | Pipelines in Power Platform (`pac pipeline deploy`), or GitHub Actions / Azure DevOps Build Tools v2 with a deployment settings file (`pac solution create-settings`) | Manual imports into UAT/PROD |
| Cloud flows | `power-automate` plugin; turn on/off and check triggers with `ppdv flow …` | Writing `clientdata` JSON blind; PATCHing `statecode` |
| Canvas apps | `canvas-apps` plugin (coauthoring) | Editing `.msapp` or `.fx.yaml` |
| Plug-ins | `pac plugin init --skip-signing` → plug-in package → `pac plugin push` / Plug-in Registration Tool | ILMerge (unsupported) |
| PCF | `pcf` plugin or `pac pcf init -fw react` → solution project | Shipping the temporary `PowerAppsTools_<prefix>` solution |
| Copilot Studio agents | `pac copilot clone/pull/push/pack` or the Copilot Studio VS Code extension | Pushing without pulling first |
| Permission tests | `ppdv test as-user` per persona | Assuming roles work because the build passed |
| UI tests | Power Platform Playwright samples / Playwright MCP (`testing`) | Test Engine / `pac test` (deprecated April 2026) |
| Designer-only actions | `browser-automation-fallback` (approval per action, user signs in) | Asking the user to click when the browser can do it |
| Docs and syntax | Microsoft Learn MCP (bundled) | Answering from memory |

## Rules
1. **Environment-first metadata**: make changes in Dataverse through a managed API, then export and unpack (or commit via Git integration). Never create components by writing solution XML.
2. Everything goes into the working unmanaged solution. If a tool cannot target a solution, add the component afterwards with `pac solution add-solution-component` and verify.
3. Confirm environment, solution and publisher prefix before the first change.
4. Read-only first; least powerful tool that does the job.
5. Destructive actions (delete rows, tables, columns, solutions, bulk delete) need explicit user approval, whatever the tool.
6. If the preferred tool is missing, say so, name the fallback from this guide, and ask before using it. Do not invent commands; check Microsoft Learn.

Sources: learn.microsoft.com/power-apps/developer/data-platform/agents-plugin/, …/maker/data-platform/data-platform-mcp, …/developer/data-platform/cli/, learn.microsoft.com/power-platform/developer/cli/reference/

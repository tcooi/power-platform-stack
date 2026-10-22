# Power Platform delivery marketplace

One plugin, `power-platform-delivery`, for **Claude Code** and **GitHub Copilot CLI**. It adds a consultant delivery method (phases, approvals, standards, reviews) on top of **Microsoft's official Power Platform and Dataverse plugins**, which do the building.

## How it fits together

```
You ──► pp-delivery-lead (main session: asks you, approves, keeps state)
          │
          ├─ builds in the main session:
          │     our *-build-standards skill  +  Microsoft skill
          │     dataverse-build-standards       dv-metadata, dv-data, dv-security, dv-solution
          │     model-driven-build-standards    /app-builder, /genpage
          │     canvas-build-standards          /canvas-app
          │     flow-build-standards            /build-flow, /debug-flow
          │     copilot-studio-build-standards  pac copilot
          │
          ├─ when a Microsoft skill can't do it: our tested toolkit (scripts/ppdv.mjs),
          │     then the browser (Playwright MCP, you sign in), then ask you
          │
          └─ delegates non-interactive work to sub-agents (briefs from spawn-templates):
                requirements-analyst, solution-designer, alm-architect, the-critic,
                pro-code-developer, solution-reviewer, uat-tester,
                app-analyst (existing apps), support-engineer (incidents)
```

## Toolkit, guardrails, evals

- **`scripts/ppdv.mjs`** (skill `ppdv-toolkit`): tested commands for what Microsoft's plugins don't cover — Web API with auth/retry/solution header, solution membership, publish, role privileges and assignment, flow on/off through the flow service with trigger checks, choice defaults, view sort, **permission tests as a real user** (`test as-user`), and a tooling `probe`. Writes are dry runs until `--apply`, and only target environments in `.pp/project.json` (production needs `--allow-prod`). Plain Node 18+, no dependencies, works the same from Claude Code and Copilot.
- **Guardrail hook**: denies shell writes to Dataverse environments not in `.pp/project.json` and asks before production writes. Claude Code reads `hooks/hooks.json`; Copilot CLI gets `hooks.json` in its own format. A wrapper (`scripts/run-guard-hook.sh`) finds the script in either install and never blocks when it can't (a crashing hook in Copilot would deny every call). ppdv's own guard applies in both tools regardless.
- **Testing like a user**: `uat-tester` sub-agent and `testing` skill (permissions per persona, automation checks, Playwright UI journeys). **Browser fallback** (`browser-automation-fallback`) for designer-only actions, with approval per action; you sign in, agents never type passwords.
- **Tests**: `node --test tests/offline.test.mjs` (19 offline tests: hook decisions, toolkit guard, dry runs, manifests; also run by GitHub Actions on every push) and `sh tests/live.sh` (live smoke test against a TEST environment from a project folder).
- **Cleanup**: record anything a test creates with `ppdv artifacts add`, remove it with `ppdv teardown --apply`.
- **Evals**: `node evals/run.mjs` runs scenarios headless against the lead with the plugin loaded (`claude -p --plugin-dir`) and checks both the answer and the environment. Results in `evals/last-run.json`. `--all` adds the slow Full-mode scenario (lead + 4 sub-agents + critic loop, ~10 min, ~$7 per run), which passed on 2026-10-22.

Why this split: Microsoft's build skills ask you questions and wait for approval, and sub-agents can't talk to you (and in Copilot don't inherit skills). So building runs in the main session where every installed skill is available; sub-agents get everything they need written into their brief and return assumptions and open questions.

Project settings and progress live in the client repo: `.pp/project.json` (environments, solution, publisher prefix) and `.pp/state/delivery.json` (phase, approvals, decisions, tasks). Sessions resume from them.

See also [docs/quickstart.md](docs/quickstart.md) and [CHANGELOG.md](CHANGELOG.md).

## Install

### 1. This plugin
Claude Code:
```
/plugin marketplace add tcooi/power-platform
/plugin install power-platform-delivery@ppp
```
Copilot CLI:
```
copilot plugin marketplace add tcooi/power-platform
copilot plugin install power-platform-delivery@ppp
```

### 2. Microsoft plugins (they do the building)
```
/plugin marketplace add microsoft/power-platform-skills
/plugin install model-apps@power-platform-skills
/plugin install canvas-apps@power-platform-skills
/plugin install power-automate@power-platform-skills
/plugin install pcf@power-platform-skills
```
Dataverse: Claude Code `/plugin install dataverse@claude-plugins-official`; Copilot `/plugin install dataverse@awesome-copilot`. Then ask "Connect to my Dataverse environment" (`dv-connect`).

### 3. Local tools
| Need | Used for | Setup |
|---|---|---|
| Power Platform CLI (`pac`) | solutions, environments, roles, plug-ins, PCF, model apps, Copilot Studio, pipelines | `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`, `pac auth create --environment <url>` |
| .NET SDK 10+ | canvas-apps plugin, `pac copilot mcp`, plug-in builds | `dotnet --list-sdks` |
| Node.js 18+ | Dataverse CLI / MCP proxy, power-automate plugin, PCF | |
| Azure CLI | power-automate plugin, Web API tokens | `az login --allow-no-subscriptions` |
| Git + GitHub / Azure DevOps | source control, CI/CD | |

### 4. Admin setup (once per environment)
- **Dataverse MCP**: enable "Allow MCP clients to interact with Dataverse MCP server" and the client (GitHub Copilot, Claude, or "Dataverse MCP CLI tool") in Power Platform admin center; tenant admin consent for the CLI proxy. Billed in Copilot Credits outside Copilot Studio.
- **Managed environments** for pipeline targets and Dataverse Git integration.
- **Coauthoring** on in Power Apps Studio for canvas apps edited by the plugin.

## Start

Run the lead as the main agent:
```bash
claude --agent power-platform-delivery:pp-delivery-lead
```
```bash
copilot --agent=pp-delivery-lead
```
It loads `.pp/project.json` (or creates it with you), runs a preflight, picks a response mode (direct, lightweight, standard, full) and works through discover → design (critic, approval) → build → review/test → go-live → handover.

## Contents

**Agents** (10): `pp-delivery-lead` (main; decides the work type: new build, change request, incident, release), and sub-agents `requirements-analyst`, `solution-designer`, `alm-architect`, `the-critic`, `pro-code-developer`, `solution-reviewer`, `uat-tester` (regression suite per app), `app-analyst` (as-built + impact analysis of existing apps), `support-engineer` (incident diagnosis).

**Skills** (16; each `SKILL.md` is short and loads `resources/` on demand):
- Method and tools: `delivery-method`, `tool-selection-guide`, `ppdv-toolkit`, `browser-automation-fallback`
- Design: `solution-design` (fit-gap, data model, security model, design document)
- Build standards (used with Microsoft's skills): `dataverse-build`, `security-roles`, `model-driven-build`, `canvas-build`, `flow-build`, `copilot-studio-build`, `pro-code`
- ALM: `alm` (plan, environments, source control, release solutions, deployment settings, pipelines)
- Quality and release: `quality-review`, `testing`, `release-and-handover`

Microsoft Learn MCP is bundled (`.mcp.json`).

## Status in GitHub Copilot CLI (2026-10-22)
- Marketplace and plugin install correctly (`copilot plugin marketplace add tcooi/power-platform`, `copilot plugin install power-platform-delivery@ppp` → 44 skills).
- Not yet verified with a model: the test account's Copilot CLI access was blocked by policy. Organizations can also disable third-party MCP servers, which removes the bundled Microsoft Learn server and Microsoft's Playwright/FlowAgent servers in Copilot; the toolkit (`ppdv`) doesn't depend on MCP.

## Upgrading from 1.x
The ten 1.x plugins (pp-delivery-lead, dataverse-builder, …) are merged into `power-platform-delivery`. Uninstall the old ones, then install this plugin.

## Authoring rules (cross-tool)
- Layout: `plugins/power-platform-delivery/{.claude-plugin/plugin.json, agents/<name>.agent.md, skills/<name>/SKILL.md, .mcp.json}`.
- Agent frontmatter: only `name` and quoted `description`; no `tools:` (omitted = all tools, including delegation in both tools).
- Sub-agents never ask the user; the lead owns approvals.
- No `commands/` (Claude Code only).
- Bump `version` in `plugin.json` and `marketplace.json` on every change.
- Validate: `python3 scripts/validate.py` and `claude plugin validate .`

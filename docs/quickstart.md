# Quick start for consultants

1. **Install** (once)
   - Claude Code: `/plugin marketplace add tcooi/power-platform` → `/plugin install power-platform-delivery@ppp`
   - Microsoft plugins: `/plugin marketplace add microsoft/power-platform-skills`, then install `model-apps`, `canvas-apps`, `power-automate`, `pcf`; plus `dataverse@claude-plugins-official` (Copilot: `dataverse@awesome-copilot`).
   - Tools: pac CLI, .NET 10 SDK, Node 18+, Azure CLI (`az login --allow-no-subscriptions`), Python 3 with a project `.venv` for the Dataverse SDK.

2. **Create the client project folder** and start the lead in it:
   ```bash
   mkdir contoso-crm && cd contoso-crm && claude --agent power-platform-delivery:pp-delivery-lead
   ```
   The lead creates `.pp/project.json` with you (environments, solution, publisher prefix) and runs the preflight (`ppdv probe`, `ppdv health`).

3. **Describe the outcome**, e.g. "Build an equipment loan app for IT" (Full mode) or "Add a Priority column to Case" (Lightweight). The lead asks for approval before every environment change.

4. **Test like a user**: `ppdv test as-user --user <test user> --table <table> --apply` per persona; Playwright journeys for the UI.

5. **Release**: the lead follows the `alm` skill (release solution → managed export → deployment settings → import → verify).

6. **Clean up test data**: `ppdv artifacts list`, `ppdv teardown --apply`.

Safety: writes only go to environments listed in `.pp/project.json`; production entries need explicit approval; the hook blocks writes elsewhere.

# Environment strategy

- Minimum: DEV (unmanaged; one per developer when working in parallel, connected to Git), TEST/UAT (managed), PROD (managed).
- Developer or sandbox environments for DEV/TEST; Production type for PROD; a production-type host for pipelines.
- Managed environments are required for pipeline targets and for Dataverse Git integration; they need premium licences for users.
- Name `<client>-<app>-<stage>`; record owner, region, language, currency.
- Configure DLP policies, solution checker enforcement and (if used) Dataverse MCP client allow-listing per environment.
- Never develop in PROD; no unmanaged customizations downstream.

**Tooling**: `pac admin create` / `pac admin list` / `pac admin backup`; governance in the Power Platform admin center; switch target with `pac auth select` / `pac org select`.

Sources: learn.microsoft.com/power-platform/alm/pipelines#frequently-asked-questions, learn.microsoft.com/power-platform/developer/cli/reference/admin

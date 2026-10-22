# GitHub Actions for Power Platform

Actions (`microsoft/powerplatform-actions`, pin a version): `actions-install` (first step when using @v1), `who-am-i`, `export-solution`, `unpack-solution`, `pack-solution`, `clone-solution`, `check-solution`, `import-solution`, `deploy-package`, environment create/copy/backup tasks.

Workflow: PR → pack + `check-solution` → merge → pack managed → import to TEST → GitHub *environment* with required reviewers → UAT/PROD.
- Auth: service principal (app-id, client-secret, tenant-id) stored as environment secrets; supports MFA tenants. Create the app user with `pac admin create-service-principal --environment <id> --role "<least-privilege role>"`.
- Runs on Windows and Linux runners (`deploy-package` is Windows only).
- Pass connection references and environment variables with a deployment settings file from `pac solution create-settings`.
- Alternative with less YAML: pipelines in Power Platform, triggered with `pac pipeline deploy`.

Sources: learn.microsoft.com/power-platform/alm/devops-github-actions, …/devops-github-available-actions

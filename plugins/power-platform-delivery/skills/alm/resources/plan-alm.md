# Plan ALM (planner only: never deploys)

1. Detect: solutions and publisher (`pac solution list`), environments (`pac admin list`), existing pipelines (`pac pipeline list`), Git integration status.
2. Ask: number of environments, managed environments available, approvers, release cadence, source control provider (GitHub/Azure DevOps), deployment tool.
3. Choose the deployment path:
   - **Pipelines in Power Platform** (default for most projects): in-product, validates dependencies, prompts for connection references/environment variables, stores artifacts; target environments must be managed environments. Developers can run `pac pipeline deploy --solutionName <sol> --stageId <id> --currentVersion <v> --newVersion <v> --wait`.
   - **GitHub Actions** or **Azure DevOps Build Tools v2** when the client needs custom CI/CD, PR gates or non-Power Platform steps.
4. Choose source control: Dataverse Git integration (dev environments) or pac export/unpack in CI.
5. Write `docs/alm-plan.md`: environment table, solution layering, variables per environment, deployment path, approvals, rollback.
6. Get approval, then execute with `alm` (resources/environment-strategy.md), `alm` (resources/source-control-unpack.md) and the matching pipeline skill.

Sources: learn.microsoft.com/power-platform/alm/pipelines, …/alm/git-integration/overview

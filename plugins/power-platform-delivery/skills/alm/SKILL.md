---
name: alm
description: "Application lifecycle management for Power Platform: ALM plan, environment strategy, source control (Git integration or pac unpack), release solutions, deployment settings, pipelines in Power Platform, GitHub Actions and Azure DevOps. Use at project start and for every export, import or deployment."
---

# Solution ALM checklist

1. `pac auth list`, `pac org who` — verify environment.
2. Publisher with client prefix exists; solution created under it (`dv-solution` can discover/create both).
3. Build components via solution-aware tools; if one lands outside, `pac solution add-solution-component`.
4. Source control: Git integration, or `pac solution export --name <sol> --path out/<sol>.zip` then `pac solution unpack --zipfile out/<sol>.zip --folder src/<sol> --packagetype Both`.
5. Environment variables and connection references for anything environment-specific; generate a settings file with `pac solution create-settings --solution-zip out/<sol>.zip --settings-file deploy/<stage>.json`.
6. `pac solution check --path out/<sol>.zip --outputDirectory out/check --geo <geo>` before import.
7. Version: `pac solution version` (build/revision) or `pac solution online-version --solution-name <sol> --solution-version x.y.z.w`.
8. Import managed downstream (pipelines or CI); never unmanaged into TEST/PROD.
9. Before deploying, run `ppdv health --target <env>` on the target: if its background service is stuck, Dataverse-triggered flows, async plug-ins and `--async` imports won't run there.

## Verified end to end (TEST-US → TEST, 2026-10-22)
1. Package only what you ship: create a release solution (`ppdv request POST solutions …`), then `ppdv solution add --type <n> --required` for each root component (table 1, role 20, flow 29, app 80); `--required` pulls in dependencies (connection reference, sitemap, app icon). Wait ~30 s after creating the solution before adding components.
2. `pac solution export --name <sol> --managed --path out/<sol>_managed.zip --environment <dev>` → `pac solution unpack --zipfile … --folder src/<sol> --packagetype Managed`.
3. `pac solution create-settings --solution-zip … --settings-file deploy/<stage>.json`, fill `ConnectionId` per environment (an existing connection in the target, e.g. `shared-commondataser-…`).
4. `pac solution import --path … --environment <target id> --settings-file deploy/<stage>.json --activate-plugins` (drop `--async` if the target says async operations are disabled).
5. Verify in the target with ppdv: table/app/role present and managed, `role get`, `flow check-trigger`, then a live test row.
6. Don't redeploy a shared catch-all dev solution unmanaged into another environment: it can overwrite that environment's own changes. Ship a purpose-built solution.

## Detailed guidance (load the file you need)
- `resources/plan-alm.md` — Plan environment strategy, source control and promotion path (DEV, TEST, UAT, PROD) before deploying anything. Planner only. Use at project start.
- `resources/environment-strategy.md` — Define Power Platform environment types, naming, ownership and governance settings for a project. Use when deciding DEV/TEST/PROD layout.
- `resources/source-control-unpack.md` — Put solutions under source control with Dataverse Git integration or pac solution clone/export/unpack. Use for source-controlled solution development.
- `resources/github-actions-pipeline.md` — Create GitHub Actions workflows for Power Platform export, check, build and deploy using microsoft/powerplatform-actions. Use for GitHub-based CI/CD.
- `resources/azure-devops-pipeline.md` — Create Azure DevOps YAML pipelines using Power Platform Build Tools v2. Use for Azure DevOps-based CI/CD.

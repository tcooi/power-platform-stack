# Azure DevOps pipelines

Use **Power Platform Build Tools v2** (pac-based; don't mix task versions): first `PowerPlatformToolInstaller@2` (optionally `AddToolsToPath: true`), then the WhoAmI task, `PowerPlatformExportSolution@2`, `PowerPlatformUnpackSolution@2`, `PowerPlatformPackSolution@2`, `PowerPlatformChecker@2`, `PowerPlatformImportSolution@2`, `PowerPlatformPublishCustomizations@2`.

- Service connection: **service principal via workload identity federation** (recommended), or service principal + secret.
- Stages: Build (pack + checker, SARIF output, `ErrorLevel`/`ErrorThreshold` gate) → Deploy TEST → Deploy UAT (environment approval) → PROD.
- Import with `UseDeploymentSettingsFile: true` and `DeploymentSettingsFile: <path>` per stage; `AsyncOperation: true` for large solutions.
- Secrets in variable groups / Key Vault.

Sources: learn.microsoft.com/power-platform/alm/devops-build-tools, …/devops-build-tool-tasks

# PCF control

**Tooling**: Microsoft's `pcf@power-platform-skills` plugin when installed; otherwise pac CLI.

1. `pac pcf init --namespace <Ns> --name <Name> --template field|dataset --framework react --run-npm-install` (React + platform libraries keeps bundles small).
2. Implement `init`, `updateView`, `getOutputs`, `destroy`; declare properties in `ControlManifest.Input.xml`. `npm start watch` for the test harness.
3. Dev deploy: `pac pcf push --publisher-prefix <prefix> --solution-unique-name <solution>` (without the solution name it lands in a temporary `PowerAppsTools_<prefix>` solution). Prefix must match the solution publisher.
4. Release: `pac solution init --publisher-name <pub> --publisher-prefix <prefix>`, `pac solution add-reference --path <pcfproj folder>`, build (`dotnet build` / `msbuild /t:restore` then build) in Release, ship the managed solution.
5. Versioning: `pac pcf version --strategy manifest` (or gittags/filetracking).
6. Canvas apps require the "Power Apps component framework for canvas apps" environment setting.
7. Test keyboard/accessibility, read-only/disabled states and themes.

Sources: learn.microsoft.com/power-platform/developer/cli/reference/pcf, learn.microsoft.com/power-apps/developer/component-framework/code-components-alm

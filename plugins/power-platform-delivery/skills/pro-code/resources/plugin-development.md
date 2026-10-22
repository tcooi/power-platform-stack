# Plug-in development

## Create and build
1. `pac plugin init --skip-signing` in an empty folder (folder name = project name). Use **plug-in packages** (dependent assemblies) from the start; ILMerge is not supported.
2. Projects must be SDK-style targeting `net462`. Don't rely on the sandbox's `System.Text.Json` version; include it in the package if needed.
3. Build produces a NuGet package in `bin/Debug|Release`.

## Register and deploy
- First registration: Plug-in Registration Tool (or Power Platform Tools for Visual Studio); register steps and images, add package and steps to the solution.
- Updates: `pac plugin push --pluginId <package-or-assembly-id> [--type Nuget|Assembly] [--configuration Release]`.
- Ship via the solution to TEST/PROD, never by pushing.

## Code rules
- Implement `IPlugin`; get context, service factory and `ITracingService`; stateless (no instance fields with state).
- Guard on message, entity, `Target` type and `context.Depth`; use pre/post images for changes.
- Stage: PreValidation (reject early), PreOperation (modify target in transaction), PostOperation (side effects). Async only for non-critical work.
- Time limit: 2 minutes. Set explicit `HttpClient.Timeout` for external calls (default 100 s is too long).
- Don't use `ExecuteMultiple`/batch or bulk messages inside plug-ins; do write plug-ins for `CreateMultiple`/`UpdateMultiple` on tables loaded in bulk.
- Unit test (e.g. FakeXrmEasy); enable plug-in trace log in DEV.
- Consider Dataverse low-code (Power Fx) plug-ins for simple logic before C#.

Sources: learn.microsoft.com/power-apps/developer/data-platform/build-and-package, learn.microsoft.com/power-platform/developer/cli/reference/plugin, …/howto/cli-create-package

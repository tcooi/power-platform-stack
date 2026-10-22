# Source control for solutions

## Option A: Dataverse Git integration (preferred for maker-heavy teams)
- Connect the solution (or environment) to Azure DevOps or GitHub from **Solutions > Source control**; commit and pull in the maker portal.
- Use only in development environments; development and target environments must be managed environments. Several dev environments can bind to the same Git location.
- Uses the YAML source format; repack with `pac solution pack --folder <root>` (pac 2.4.1+).

## Option B: pac CLI (code-first teams, CI)
```
pac solution export --name <sol> --path out/<sol>.zip
pac solution unpack --zipfile out/<sol>.zip --folder src/<sol> --packagetype Both
```
- Use `pac solution clone --name <sol>` when you need a `.cdsproj` project (to add plug-in or PCF references with `pac solution add-reference`); use export + unpack when only updating existing content.
- `pac solution sync` refreshes a cloned project from the environment.
- Build managed: `pac solution pack --zipfile out/<sol>_managed.zip --folder src/<sol> --packagetype Managed`.
- Never open solution zips with standard zip tools; never hand-create components in XML.
- Canvas apps: rely on solution export/Git integration (`pac canvas pack/unpack` is deprecated).

Sources: learn.microsoft.com/power-platform/alm/git-integration/overview, learn.microsoft.com/power-platform/developer/cli/reference/solution

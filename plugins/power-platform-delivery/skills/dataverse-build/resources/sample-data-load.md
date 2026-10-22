# Sample data load

## Tool order
1. `dv-data` (Microsoft `dataverse` plugin): bulk create/update/upsert, CSV import with lookup resolution, schema-driven sample data.
2. Dataverse SDK for Python for scripted loads; Dataverse CLI (`dataverse data …`) for small headless jobs.
3. Dataverse MCP `create_record` only for a handful of rows or verification.

## Bulk rules (Microsoft Learn)
- Use `CreateMultiple` / `UpdateMultiple` / `UpsertMultiple` for highest throughput. Not every standard table supports them yet: check `sdkmessagefilters` for the table first.
- On standard tables one failing row rolls back the whole request: validate data first. Start with 100–1,000 records per request and make the size configurable.
- When bulk messages are unavailable, use `$batch` (up to 1,000 operations per request); parallel requests improve throughput.
- Use alternate keys with upsert so loads are repeatable; load in dependency order (reference data, parents, children).
- Large payloads with plug-ins registered can hit the sandbox message size limit; consider `BypassCustomPluginExecution` (requires privilege) or disabling non-essential automation during the load, and re-enable afterwards.
- Mark seeded rows (e.g. a source column) so they can be removed; never load real personal data into non-production environments.

Sources: learn.microsoft.com/power-apps/developer/data-platform/bulk-operations, …/optimize-performance-create-update

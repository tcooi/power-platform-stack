# Dataverse schema build

## Tool order
1. `dv-metadata` (Microsoft `dataverse` plugin) — confirms environment, solution and prefix, creates via managed APIs, then exports/unpacks.
2. Dataverse SDK for Python (`client.tables`) for scripted, repeatable schema.
3. Web API `EntityDefinitions` when neither is available.
4. Dataverse MCP `create_table`/`update_table` only for prototypes or small tweaks; then confirm the table is in the solution (`pac solution add-solution-component` if not).

## Web API essentials
- `POST /api/data/v9.2/EntityDefinitions` with header `MSCRM.SolutionUniqueName: <solution>`; required: `SchemaName` (publisher prefix), `DisplayName`, `DisplayCollectionName`, `HasNotes`, `HasActivities`, `PrimaryNameAttribute` plus one `StringAttributeMetadata` with `IsPrimaryName: true`.
- Columns: `POST EntityDefinitions(LogicalName='<t>')/Attributes`; relationships: `POST RelationshipDefinitions`; option changes via `InsertOptionValue` etc. with `SolutionUniqueName` parameter.
- Set only `LocalizedLabels` in labels.
- Read back with `Consistency: Strong` (metadata is cached ~30 s, new items can 404 otherwise).
- Publish: `PublishAllXml` or `pac solution publish`.

## After building
`pac solution export --name <sol> --path out/<sol>.zip` and `pac solution unpack --zipfile out/<sol>.zip --folder src/<sol>` (or commit through Git integration). Computed columns: use formula columns, not calculated columns (see `pro-code` (resources/ce-customization-patterns.md)).

Sources: learn.microsoft.com/power-apps/developer/data-platform/webapi/create-update-entity-definitions-using-web-api, …/agents-plugin/reference#dv-metadata

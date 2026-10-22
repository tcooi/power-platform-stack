# Canvas performance and delegation

- Fix every delegation warning: delegable functions/operators for the data source, filter server-side on indexed columns.
- Reduce `OnStart`; use named formulas (`App.Formulas`) and load per screen.
- `Concurrent()` for parallel loads; cache only small, rarely changing lookups.
- Keep control counts low, avoid nested galleries, size images properly.
- Profile with Monitor; check App Checker / accessibility errors (the canvas authoring MCP exposes them when the `canvas-apps` plugin is connected).
- Raise the data row limit only with a written reason.

**Tooling**: edit with Microsoft's `canvas-apps` plugin (coauthoring). To read source without editing: `pac canvas download` with `-d` extracts `.pa.yaml`.

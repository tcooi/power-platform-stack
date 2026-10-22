# Dataverse flows

- Trigger: choose Change type, Table, Scope; set **Select columns** and **Filter rows** (OData) so the flow only fires when needed.
- Use **Run as** deliberately (Modifying user vs Flow owner); use a service account/app user for production.
- Related rows: `$expand` via List rows; use alternate keys with Upsert.
- Large lists: turn on pagination and limit with `$top`; avoid Apply to each over thousands of rows (use `$filter` or batch).
- Put flows in the solution with connection references, environment variables for URLs and IDs.

## Tooling
Build, validate and debug with Microsoft's `power-automate` plugin (`/build-flow`, `/debug-flow`). Look up column logical names and choice values with Dataverse MCP `read_query` or `dv-query`. See `tool-selection-guide`.

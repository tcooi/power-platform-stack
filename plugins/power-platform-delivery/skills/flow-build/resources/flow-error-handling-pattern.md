# Flow error handling

Structure: `Try` scope -> `Catch` scope (Configure run after: has failed, timed out) -> `Finally` scope (run after all).
- In Catch use `result('Try')` filtered for failed actions; log to a Dataverse error table with run URL (`workflow()` + `run.name`) and notify a channel.
- Set retry policy on flaky connectors (exponential), timeouts on long waits, and concurrency control deliberately.
- Terminate with `Failed` in Catch so the run shows as failed.
- Avoid infinite loops from triggers updating the same row: filter columns and add a guard column.

## Tooling
Build, validate and debug with Microsoft's `power-automate` plugin (`/build-flow`, `/debug-flow`). Look up column logical names and choice values with Dataverse MCP `read_query` or `dv-query`. See `tool-selection-guide`.

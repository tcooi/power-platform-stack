# Tests

| Test | Needs | Run |
|---|---|---|
| Offline (hook, toolkit guard, manifests, routing) | Node 18+, Python 3 | `node --test tests/offline.test.mjs` (also in CI) |
| Routing check | Node | `node scripts/route-check.mjs` (also in CI) |
| Live smoke test | Your own sandbox + fixtures below | `sh tests/live.sh` from a project folder |
| Evals (the lead, headless) | Claude Code signed in, your own sandbox + fixtures, `evals/config.json` | `node evals/run.mjs` (`--all` adds the slow ones) |

Use a **sandbox you own**, never a client or production environment. The live test and some evals write test items there and remove them again.

## Fixtures (create once in your sandbox)
1. A publisher and an unmanaged solution (Microsoft's `dv-solution` skill, or make.powerapps.com → Solutions).
2. In that solution, a test table (e.g. `<prefix>_testitem`, display name "Test Item") with the default `<prefix>_name` column, and a model-driven app over it. Microsoft's `/app-builder` does both from one sentence.
3. A security role with create, read and write (user level) on that table and no delete, assigned to a test user who has only that role. Optional: needed for the as-user check.
4. Optional: a Dataverse-triggered cloud flow on the table (for the trigger check).

Then:
- **Live test**: `PP_TABLE=<table> PP_ROLE="<role>" PP_SOLUTION=<solution> [PP_FLOW=<workflow id>] [PP_TEST_USER=<upn>] sh tests/live.sh`
- **Evals**: copy `evals/config.example.json` to `evals/config.json` (git-ignored) and fill in the environment, solution and fixtures.

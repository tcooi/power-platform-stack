---
name: testing
description: "Test strategy and testing like a user: permission tests per persona (ppdv test as-user), automation checks, Playwright UI journeys, and the UAT plan. Use after builds and before UAT sign-off."
---

# User acceptance testing

## 1. Permissions per persona (no browser, fast)
For each persona role and each table it touches:
```
node "<plugin root>/scripts/ppdv.mjs" test as-user --user <test user upn> --table <table> --ops create,read,update,delete,read-others --apply
```
Compare with the persona's declared privileges (the app spec or security model). Any difference is a defect. Needs a test user who holds the role (assign with `ppdv role assign`), and the runner needs the System Administrator role (impersonation privilege).

## 2. Automation behaviour
Create a row as the test user (or admin), wait, then read it back to prove flows/plug-ins ran (e.g. default due date set). For flows also run `ppdv flow check-trigger` and read run history.

## 3. UI journeys (browser)
- Preferred for repeatable suites: Microsoft's **Power Platform Playwright samples** (`microsoft/power-platform-playwright-samples`, TypeScript, `AppProvider`, `ModelDrivenAppPage`, `CanvasAppPage`). Test Engine / `pac test` is deprecated.
- Quick checks: the Playwright MCP (bundled with Microsoft's model-apps and power-pages plugins): open the app URL, take snapshots, click through the journey, take screenshots as evidence.
- **Sign-in is done by a human.** The agent opens the sign-in page and asks the user (or test-user owner) to sign in in that browser window. Never type passwords; never read them from files or chat. Reuse the browser session or Playwright storage state afterwards.
- Journeys to cover per persona: open the app, open the list view, create a record, edit it, see automation results, try a forbidden action (should be blocked).

## 4. Report
Table per persona: check, expected, actual, evidence (JSON output or screenshot path), pass/fail. Log results and defects with `ppdv state add --kind risk|lesson` and `ppdv state task`. Clean up test data (ppdv cleans its own rows).

## Detailed guidance (load the file you need)
- `resources/test-strategy.md` — Define the test strategy: plug-in unit tests, Power Platform Playwright UI tests, flow smoke tests, agent evaluations and UAT. Use when planning quality assurance.
- `resources/uat-plan.md` — Write the UAT plan with scenarios, test users, entry/exit criteria and defect handling. Use before user acceptance testing.

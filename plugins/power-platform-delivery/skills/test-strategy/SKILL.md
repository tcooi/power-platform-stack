---
name: test-strategy
description: "Define the test strategy: plug-in unit tests, Power Platform Playwright UI tests, flow smoke tests, agent evaluations and UAT. Use when planning quality assurance."
---

# Test strategy

| Layer | Tool |
|---|---|
| Plug-ins | Unit tests (e.g. FakeXrmEasy) |
| Canvas, model-driven, custom pages, generative pages | **Power Platform Playwright samples** (TypeScript, `AppProvider`, `ModelDrivenAppPage`, `CanvasAppPage`); AI-assisted authoring with the Playwright MCP |
| Flows | Trigger with test data, check run history; `/debug-flow` from the power-automate plugin on failures |
| Copilot Studio agents | Evaluation sets in Copilot Studio |
| Security | `ppdv test as-user` per persona role (impersonation, cleans up), plus one sign-in per role for UI checks (`user-acceptance-test`) |
| Performance | Representative data volume in TEST |

Power Apps Test Engine and `pac test run` are **deprecated (April 2026)**; migrate existing YAML tests with Microsoft's migration guide. Run unit and smoke tests in CI; manual UAT for acceptance only.

Sources: learn.microsoft.com/power-platform/developer/playwright-samples/overview, learn.microsoft.com/power-platform/important-changes-coming#deprecation-of-test-engine

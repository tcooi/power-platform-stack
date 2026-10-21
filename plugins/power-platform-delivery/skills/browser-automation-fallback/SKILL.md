---
name: browser-automation-fallback
description: "Last-resort fallback: do a maker-portal or admin-center action through the browser (Playwright MCP) when no API, CLI or Microsoft plugin skill can do it, e.g. form header fields, designer-only settings, environment feature toggles, enabling canvas coauthoring. Use only after tool-selection-guide and ppdv have no option, and only with per-action approval."
---

# Browser automation fallback

Order of preference is always: Microsoft plugin skill → `ppdv` / pac / Web API → **browser** → ask the user to do it.

## Rules
1. **Test and development environments only** by default. Production needs explicit approval for the exact change.
2. **Approval per action**: describe the exact clicks and the expected result, get a yes, then do it.
3. **Sign-in is the user's job.** Navigate to the page; if a Microsoft sign-in page appears, ask the user to sign in in the Playwright browser window, wait, continue. Never type passwords, codes or secrets; never copy them from files.
4. Use accessibility snapshots (`browser_snapshot`) to find elements, not screen coordinates. Take a screenshot before saving and after, store paths as evidence.
5. Never accept terms, consent prompts, purchases or licence changes without the user.
6. After the UI change, **verify through an API** (ppdv request / Microsoft verifier) and export/unpack the solution so the change lands in source control.
7. If the page layout doesn't match expectations, stop and ask; don't guess clicks.

## Known UI-only actions (and where to go)
| Action | Where |
|---|---|
| Fields in a form header | make.powerapps.com → Solutions → solution → table → Forms → form designer → Header → add field → Save and publish |
| Business rule when `CreateProcessWithWfomJson` is unavailable | table → Business rules designer |
| Canvas coauthoring on | Power Apps Studio → Settings → Updates → Coauthoring |
| Dataverse MCP / managed environments / other feature toggles | admin.powerplatform.microsoft.com → Environments → environment → Settings → Product → Features |

Playwright MCP tools (Claude Code names): `mcp__plugin_model-apps_playwright__browser_navigate`, `…_snapshot`, `…_click`, `…_type`, `…_take_screenshot`, `…_wait_for`. In Copilot CLI use the equivalent Playwright MCP tools from the same plugin.

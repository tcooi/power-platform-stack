---
name: canvas-build
description: "Our standards for canvas apps (screens, Power Fx, delegation, performance, component libraries), applied with Microsoft's canvas-apps plugin and live coauthoring. Use whenever a canvas app is built or changed."
---

# Canvas build standards

**Microsoft tool**: `canvas-apps` plugin: `/configure-canvas-mcp`, then `/canvas-app`. Needs .NET SDK 10+, the app created and saved in the solution, Studio open with coauthoring on. Details: `resources/canvas-performance-delegation.md`, `resources/canvas-component-library.md`.

## Our rules
- Agree screens, data sources and key Power Fx before building.
- Dataverse over SharePoint/Excel where possible; delegable formulas; named formulas; light `OnStart`.
- Component library and theme tokens; no hard-coded colors.
- `IfError` with friendly notifications; accessible labels and focus order.
- Connection references, not personal connections. No `pac canvas pack/unpack` (deprecated).


## Always
- Run in the main session (the Microsoft skills ask you questions and wait for approval).
- Load `.pp/project.json`; confirm environment (`pac org who`), solution and prefix before the first change.
- After building, confirm every new component is in the solution (`ppdv solution has`; `ppdv solution add` if not), export and unpack (or commit via Git integration), record test-only items with `ppdv artifacts add`, and log progress with `ppdv state task|add` (never hand-edit the state file).

## Detailed guidance (load the file you need)
- `resources/canvas-performance-delegation.md` — Review canvas app formulas for delegation warnings and performance. Use when a canvas app is slow or returns incomplete data.
- `resources/canvas-component-library.md` — Create and reuse canvas component libraries and a consistent theme. Use for multi-app consistency.

## Shortcuts to refuse
| You might think | Instead |
|---|---|
| A personal connection is fine for testing. | It travels with the app and breaks for every other user. Use connection references from the start. |
| The delegation warning only matters with big data. | Data grows; the app then silently shows the first 500/2000 rows. Fix the query or document the limit. |
| I'll put the logic in App.OnStart. | Slows every start. Use named formulas and load data where it's needed. |

## Red flags (stop and fix)
- Delegation warnings left in App Checker.
- Hard-coded environment URLs, IDs or e-mail addresses (use environment variables).
- Accessibility errors from App Checker not fixed or waived.
- The app saved outside the project solution.

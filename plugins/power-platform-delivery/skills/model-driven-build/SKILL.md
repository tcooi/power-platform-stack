---
name: model-driven-build
description: "Our standards for model-driven apps and changes to out-of-the-box apps (app modules, sitemap, forms, views with sort and filters, command bar, business rules, business process flows, generative pages), applied with Microsoft's /app-builder and /genpage, with ppdv and the browser as fallbacks. Use whenever a model-driven app, form or view is built or changed."
---

# Model-driven build standards

**Microsoft tool**: `model-apps` plugin (`/app-builder`, `/genpage`); `pac model create --name … --solution <solution> --publish` (always pass `--solution`). Details: `resources/app-modules-forms-views.md`, `resources/command-bar-power-fx.md`, `resources/business-rules-and-bpf.md`.

## Our rules
- Role-based apps with a small, task-grouped sitemap; assign the app to security roles.
- OOTB apps (Sales Hub, Customer Service Hub…): your own app module, forms and views in your solution; never edit managed originals.
- Business rules and Power Fx command bar before JavaScript; code goes to the `pro-code-developer` sub-agent.
- Forms: key status in header, tabs by phase, few controls on load. Views: the columns users need, quick-find columns, lookup views.
- Generative pages only where a form/view/dashboard can't do the job; record why.

## What /app-builder can't do, and what to use instead (checked versions in `fallbacks.json`)
| Need | Use | Id |
|---|---|---|
| Fields in the form **header** | Form designer, via `browser-automation-fallback` or the user (then export/unpack). Don't hand-edit `formxml`; it needs exact control IDs and a mistake breaks the form. | `mda-header-fields` |
| **Default value** of a Choice column | `ppdv choice default --table T --column C --value N --apply` (Web API: update the column (`.../Attributes(LogicalName='<col>')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`) with `DefaultFormValue` + `MSCRM.SolutionUniqueName`, then publish. Observed: when the default was set on an existing column (TEST-US) API-created rows stayed empty; when the column arrived with the default through a solution import (TEST) API-created rows got it. Don't rely on it for API/import creates: test one row in each environment, and keep a flow or plug-in where it matters. | `mda-choice-default` |
| A view sorted/filtered your way | Don't name it `Active <plural>` (or like any view the table has): the build adds the spec's columns to that view but not its sort or filters, and only warns. Use a distinct name, or fix the sort with `ppdv view sort --view <name> --table T --attr <col> --replace --apply`. | `mda-view-sort` |
| Business rules | `businessRules[]` only works where the environment exposes `CreateProcessWithWfomJson`; otherwise the build skips them with a warning. Fall back to the business rule designer. | `mda-business-rules` |


## Always
- Run in the main session (the Microsoft skills ask you questions and wait for approval).
- Load `.pp/project.json`; confirm environment (`pac org who`), solution and prefix before the first change.
- After building, confirm every new component is in the solution (`ppdv solution has`; `ppdv solution add` if not), export and unpack (or commit via Git integration), record test-only items with `ppdv artifacts add`, and log progress with `ppdv state task|add` (never hand-edit the state file).

## Detailed guidance (load the file you need)
- `resources/app-modules-forms-views.md` — Create app modules, sitemap, forms and views for a model-driven app with Microsoft's /app-builder skill, dv-metadata, pac model or the designers. Use when building or restructuring the UI of a model-driven app.
- `resources/command-bar-power-fx.md` — Add or change model-driven app command bar buttons with Power Fx command bar (modern commanding). Use for custom buttons and rules.
- `resources/business-rules-and-bpf.md` — Create business rules and business process flows for model-driven apps with Microsoft's /app-builder skill or the designers. Use for form logic and guided stage-based processes.

## Known conflicts with Microsoft's defaults (our rule wins; checked versions in `fallbacks.json`)
| Tool | Microsoft default | Our rule | Id |
|---|---|---|---|
| `/app-builder` | Genpage-first: proposes generative pages for overviews | `standards.generativePages` (default: only when asked) | `mda-genpage-first` |
| `/app-builder` | New look off (`app.newLook`), but header and navigation refresh written ON for a new app unless `app.headerNavigationRefresh: false` | `standards.newLook` | `mda-new-look` |
| `/app-builder` | One role per persona when `personas[]` is given; edits only roles it created | security model from the design; existing roles via `roleGrants[]` | `mda-persona-roles` |
| `/app-builder` | Creates/uses the spec's solution | always the project's `solution.uniqueName` and prefix | `mda-solution` |
| `pac model create` | Default solution | always pass `--solution` | `pac-model-create-solution` |

## Shortcuts to refuse
| You might think | Instead |
|---|---|
| I'll change the managed form in TEST, it's only a small fix. | Managed components are changed in dev and released. An unmanaged layer in TEST blocks future updates. |
| I'll hand-edit the formxml to put fields in the header. | Exact control IDs are required and a mistake breaks the form. Use the form designer (browser fallback or the user). |
| Naming the view 'Active Items' is clearest. | It merges into the stock view and loses its sort and filters. Use a distinct name. |
| A generative page will look better. | Only when a form, view or dashboard can't do the job, and the reason is recorded (`standards.generativePages`). |

## Red flags (stop and fix)
- App, form or view built outside the project solution (`pac model create` without `--solution`).
- Edits to a Microsoft out-of-the-box form instead of a copy, without a design decision.
- A spec rebuilt after hand edits in the designer (the rebuild reverts them).
- The app checked only as System Administrator.

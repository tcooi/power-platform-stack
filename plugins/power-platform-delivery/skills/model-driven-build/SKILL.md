---
name: model-driven-build
description: "Our standards for model-driven apps and changes to out-of-the-box apps (app modules, sitemap, forms, views, command bar, business rules, BPFs, generative pages), applied with Microsoft's /app-builder and /genpage, with ppdv and the browser as fallbacks. Use whenever a model-driven app is built or changed."
---

# Model-driven build standards

**Microsoft tool**: `model-apps` plugin (`/app-builder`, `/genpage`); `pac model create --name … --solution <solution> --publish` (always pass `--solution`). Details: `resources/app-modules-forms-views.md`, `resources/command-bar-power-fx.md`, `resources/business-rules-and-bpf.md`.

## Our rules
- Role-based apps with a small, task-grouped sitemap; assign the app to security roles.
- OOTB apps (Sales Hub, Customer Service Hub…): your own app module, forms and views in your solution; never edit managed originals.
- Business rules and Power Fx command bar before JavaScript; code goes to the `pro-code-developer` sub-agent.
- Forms: key status in header, tabs by phase, few controls on load. Views: the columns users need, quick-find columns, lookup views.
- Generative pages only where a form/view/dashboard can't do the job; record why.

## What /app-builder can't do, and what to use instead
| Need | Use |
|---|---|
| Fields in the form **header** | Form designer, via `browser-automation-fallback` or the user (then export/unpack). Don't hand-edit `formxml`; it needs exact control IDs and a mistake breaks the form. |
| **Default value** of a Choice column | `ppdv choice default --table T --column C --value N --apply` (Web API: update the column (`.../Attributes(LogicalName='<col>')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`) with `DefaultFormValue` + `MSCRM.SolutionUniqueName`, then publish. Observed: when the default was set on an existing column (TEST-US) API-created rows stayed empty; when the column arrived with the default through a solution import (TEST) API-created rows got it. Don't rely on it for API/import creates: test one row in each environment, and keep a flow or plug-in where it matters. |
| A view sorted/filtered your way | Don't name it `Active <plural>`: that merges into the table's stock default view and the authored sort and filters are dropped (`--verify` reports the missing sort). Use a distinct name, or fix the sort with `ppdv view sort --view <name> --table T --attr <col> --replace --apply`. |
| Business rules | `businessRules[]` only works where the environment exposes `CreateProcessWithWfomJson`; otherwise the build skips them with a warning. Fall back to the business rule designer. |


## Always
- Run in the main session (the Microsoft skills ask you questions and wait for approval).
- Load `.pp/project.json`; confirm environment (`pac org who`), solution and prefix before the first change.
- After building, confirm every new component is in the solution (`ppdv solution has`; `ppdv solution add` if not), export and unpack (or commit via Git integration), record test-only items with `ppdv artifacts add`, and log progress with `ppdv state task|add` (never hand-edit the state file).

## Detailed guidance (load the file you need)
- `resources/app-modules-forms-views.md` — Create app modules, sitemap, forms and views for a model-driven app with Microsoft's /app-builder skill, dv-metadata, pac model or the designers. Use when building or restructuring the UI of a model-driven app.
- `resources/command-bar-power-fx.md` — Add or change model-driven app command bar buttons with Power Fx command bar (modern commanding). Use for custom buttons and rules.
- `resources/business-rules-and-bpf.md` — Create business rules and business process flows for model-driven apps with Microsoft's /app-builder skill or the designers. Use for form logic and guided stage-based processes.

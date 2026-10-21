---
name: model-driven-build-standards
description: "Our standards for model-driven apps and changes to out-of-the-box apps, applied together with Microsoft's model-apps plugin (/app-builder, /genpage) and pac model. Use whenever app modules, forms, views, sitemap, command bar, business rules or BPFs are built."
---

# Model-driven build standards

**Microsoft tool**: `model-apps` plugin (`/app-builder`, `/genpage`); `pac model create --name … --solution <solution> --publish` (always pass `--solution`). Details: `app-modules-forms-views`, `command-bar-power-fx`, `business-rules-and-bpf`.

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
| **Default value** of a Choice column | `ppdv choice default --table T --column C --value N --apply` (Web API: update the column (`.../Attributes(LogicalName='<col>')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`) with `DefaultFormValue` + `MSCRM.SolutionUniqueName`, then publish. Verified: it is only the *form* default; rows created through the API stay empty, so add a flow or plug-in for API/import creates. |
| A view sorted/filtered your way | Don't name it `Active <plural>`: that merges into the table's stock default view and the authored sort and filters are dropped (`--verify` reports the missing sort). Use a distinct name, or fix the sort with `ppdv view sort --view <name> --table T --attr <col> --replace --apply`. |
| Business rules | `businessRules[]` only works where the environment exposes `CreateProcessWithWfomJson`; otherwise the build skips them with a warning. Fall back to the business rule designer. |


## Always
- Run in the main session (the Microsoft skills ask you questions and wait for approval).
- Load `.pp/project.json`; confirm environment (`pac org who`), solution and prefix before the first change.
- After building, confirm every new component is in the solution (`pac solution add-solution-component` if not), export and unpack (or commit via Git integration), and log the result in `.pp/state/delivery.json`.

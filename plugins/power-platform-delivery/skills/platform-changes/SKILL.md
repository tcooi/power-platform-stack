---
name: platform-changes
description: "Keeps existing Power Platform / D365 CE solutions working through change: Microsoft deprecations (deprecated controls, designers, connectors, features) and release waves, and safely removing, retiring or replacing components (columns, tables, forms, flows, plug-ins) that are in managed solutions or have dependencies. Use when Microsoft announces or deprecates something, before a release wave, or when a client asks to remove, delete or replace a component."
---

# Platform changes and safe removal

Two kinds of change hit apps after go-live: Microsoft changes the platform, and the client wants something removed or replaced. Both break things when done in one step. Treat removal as a small project: find what depends on it, replace, migrate, then remove through a release.

## Microsoft deprecations and release waves
1. **Check the sources**, never memory: learn.microsoft.com/power-platform/important-changes-coming (Power Platform deprecations), the Dynamics 365 and Power Platform release plans (two waves a year), and Message center in the Microsoft 365 admin center. Record the URL and the date you checked.
2. **Find what is affected** in each client solution (`app-analyst` as-built plus a search of the unpacked solution in source control): controls, designers, connectors, client API calls, processes, environment types.
3. **Write an impact note** per deprecation in `docs/changes/<id>-impact.md`: what is affected, deadline, replacement, effort, risk. Treat each as a change request (`delivery-method` work types).
4. **Plan before the deadline** with the client, not after the feature stops working. Early-access a release wave in a sandbox and run the regression suites (`tests/<app>/`) there first.

Examples worth checking at every client (verify current status on Learn): Editable Grid and Read-Only Grid controls → Power Apps grid control; classic app/form/view designers; Dynamics 365 for phones and tablets → Power Apps mobile; Power Apps Test Engine / `pac test` → Playwright; unmanaged developer environments → managed developer environments or sandboxes; `Xrm.Page` → `formContext`; legacy connectors replaced by new versions.

## Safe removal (expand, migrate, contract)
1. **Find dependencies first**: Show dependencies in the maker portal, or the Web API functions `RetrieveDependenciesForDelete` / `RetrieveDependentComponents`. Also search flows, plug-ins, JavaScript, Power BI reports, integrations and canvas apps, which Dataverse dependency tracking doesn't always see.
2. **Expand**: build the replacement next to the old component (new column, new flow) and release it.
3. **Migrate**: move data (`dv-data` bulk update), switch forms, views, flows and integrations to the new component, and release that.
4. **Hide, don't delete yet**: remove the old component from forms and views, mark it obsolete in its description, and keep it for one release cycle so you can roll back.
5. **Contract**: delete it in **dev**, then release with an **Upgrade** import (solution action Upgrade, `pac solution import --stage-and-upgrade`, or `--import-as-holding` then `pac solution upgrade` when data must move in between). Components missing from the new managed version are removed in the target. Never delete a managed component directly in test or production, and never delete a whole managed solution to get rid of one component: that deletes every component and its data.
6. **Data is gone for good** when a column or table is deleted. Get the client's written approval and an export of the data first.

## Shortcuts to refuse
| You might think | Instead |
|---|---|
| Nobody uses that column, just delete it. | Check dependencies and data first; integrations and reports don't show up in the app. |
| I'll delete it in production, it's quicker. | Delete in dev and release with an Upgrade; a manual delete leaves environments different. |
| We'll handle the deprecation when it breaks. | Plan from the announcement; the deadline is fixed and the replacement takes time. |
| Uninstall and reinstall the managed solution to clean up. | That deletes all its data. Use an Upgrade. |

## Red flags (stop and fix)
- A delete planned without a dependency check or a data export.
- Data migration and component removal in the same release.
- A deprecation known for months with no impact note or plan.
- A solution imported as **Update** when components were removed (they stay in the target).

Sources: learn.microsoft.com/power-apps/maker/data-platform/update-solutions#removing-a-managed-component-from-the-target-environment, learn.microsoft.com/power-platform/alm/removing-dependencies, learn.microsoft.com/power-platform/alm/dependency-tracking-solution-components, learn.microsoft.com/power-platform/important-changes-coming (checked 2026-11-05).

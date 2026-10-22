# App module, forms and views

## Tool order
1. `/app-builder` (Microsoft `model-apps` plugin) — plans, gets approval, builds forms, views, charts, BRs, BPFs, app module and sitemap.
2. `dv-metadata` for individual forms and views.
3. `pac model create --name "<App>" --solution <solution> --publish`, then the app designer in the maker portal.
Never hand-write FormXml/SiteMap XML except to resolve a diff.

## Design rules
- App module in the solution with only the tables the persona needs; assign security roles to the app.
- Sitemap grouped by task (Work, Customers, Setup); dashboards or generative pages (`/genpage`, `pac model genpage upload`) for landing pages.
- Main form per persona/context: header with key status fields, tabs by phase, sub-grids for related rows, timeline where activities matter.
- Views: columns and sort users need, quick-find columns, a lookup view per table used in lookups.
- OOTB apps: copy forms into your solution (or use form order) rather than editing managed forms.
- Test load time per persona (fewer controls on load, collapsed tabs).

Sources: learn.microsoft.com/power-apps/maker/model-driven-apps/model-driven-app-external-tools, learn.microsoft.com/power-platform/developer/cli/reference/model

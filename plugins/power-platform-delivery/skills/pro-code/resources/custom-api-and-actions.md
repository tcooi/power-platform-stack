# Custom API

- Create the Custom API (unique name with prefix, binding type, allowed step type, request parameters, response properties) in the solution, e.g. with the Plug-in Registration Tool, then associate the plug-in type.
- Prefer Custom APIs over legacy custom process actions for new work.
- Callers: Web API (`POST /api/data/v9.2/<name>`), flows (perform an unbound/bound action), Power Fx, generative pages, Dataverse CLI `dataverse api …`, and Copilot Studio/agents as tools.
- Secure with an execute privilege so only specific roles can call it; custom APIs run as the calling user.

Sources: learn.microsoft.com/power-apps/developer/data-platform/custom-api, …/create-custom-api-prt

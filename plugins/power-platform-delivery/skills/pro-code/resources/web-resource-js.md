# Web resource JavaScript

- Namespace everything (`var Contoso = Contoso || {};`), never `Xrm.Page`.
- Handlers receive `executionContext`; get `formContext` from it and pass it on.
- Use `Xrm.WebApi` (async) not synchronous XHR; handle promises with errors surfaced via `formContext.ui.setFormNotification`.
- Register events on the form designer: OnLoad, OnSave, column OnChange; tick "Pass execution context".
- Keep scripts small and per-table; TypeScript + `@types/xrm` and a bundler for larger code.
- Ship as web resource in the solution; use a naming path like `contoso_/scripts/account.js`.

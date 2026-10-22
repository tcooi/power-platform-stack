# Command bar with Power Fx

- Use the modern command designer in the app designer; select the component (main grid, main form, subgrid, associated view).
- Visibility: Power Fx expression, e.g. `Self.Selected.Item.'Status' = 'Status (Opportunities)'.Open`.
- Action: Power Fx formula (`Patch`, `Navigate`, `Notify`, call a flow) before reaching for JavaScript.
- Use JavaScript command actions only for what Power Fx cannot do; register the web resource in the same solution.
- Test on grid selection (single vs multiple) and on each form state.
- Ribbon Workbench is legacy: only for buttons modern commanding cannot express.

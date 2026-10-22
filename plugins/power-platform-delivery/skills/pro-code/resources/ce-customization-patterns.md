# CE customization patterns

| Need | Prefer |
|---|---|
| Show/hide, require, set value | Business rule |
| Computed value from the same row (or simple math/text/date) | Formula column (Power Fx). Not calculated columns, which Microsoft is steering makers away from |
| Aggregate over child rows | Rollup column (no formula-column replacement for aggregation) |
| Command bar button | Power Fx command bar (modern), else Ribbon Workbench |
| Cross-record validation | Synchronous plug-in (PreValidation/PreOperation) |
| Heavy/async work | Async plug-in or cloud flow |
| Custom UI control | PCF |

Form script skeleton:
```js
var Contoso = Contoso || {};
Contoso.Account = {
  onLoad: function (executionContext) {
    var formContext = executionContext.getFormContext();
  }
};
```

## Formula columns (replace calculated columns)

Use Dataverse **formula columns** (data type `fx Formula`, Power Fx) for new computed columns. Known limits to design around:
- Cannot output a **currency** column; use `Decimal(currencyColumn)` and an exchange rate for currency inputs, and a decimal result.
- No aggregation or cross-row logic (use rollup columns, a flow or a plug-in).
- Cannot trigger flows or plug-ins on a formula column, and duplicate detection ignores them.
- Output type is fixed by the formula; you cannot change it later.
- Not shown in mobile offline mode; max 1,000-character formula; chain depth 10.
- A rollup can use only a *simple* formula column (same-row columns or constants, no `UTCNow()`).
- Null numeric inputs count as 0 (calculated columns returned null).
Existing calculated columns keep working; do not convert in place (you cannot turn a simple column into a formula column, so add a new column and migrate). Check the current Microsoft Learn page "Work with Dataverse formula columns" before committing to a design.

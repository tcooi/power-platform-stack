# Data model design

1. List entities and reuse standard tables first (account, contact, task, appointment, etc.).
2. For each new table: display/schema name with publisher prefix, ownership (User/Team vs Organization), primary name column, key columns, alternate keys.
3. Relationships: 1:N, N:1, N:N (prefer an explicit intersect table when the relationship has attributes). Choose cascade behavior deliberately (default Parent-child vs Referential, Restrict Delete).
4. Columns: prefer Choice over free text, use Currency/Decimal correctly, avoid Lookup-heavy forms, plan auto-number columns.
5. Audit, change tracking (needed for offline/sync) and row-level security needs.
6. Output a Mermaid `erDiagram` plus a table-by-table spec ready to build with `dataverse-build` and Microsoft's `dv-metadata`.

Avoid: duplicating standard tables, using Text where Choice fits, one table per screen.

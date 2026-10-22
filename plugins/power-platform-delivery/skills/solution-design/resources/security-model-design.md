# Security model design

1. Decide the business unit structure (keep it as flat as possible; BUs control data access scope, not org charts).
2. Define personas -> security roles. Copy and trim from OOTB roles rather than starting blank. Start from least privilege.
3. Per role, per table: Create/Read/Write/Delete/Append/Append To/Assign/Share with access level (User, BU, Parent-child BU, Org).
4. Use owner teams / access teams for record sharing patterns, group teams tied to Entra groups for membership.
5. Field-level security only for genuinely sensitive columns.
6. Include roles for app access (model-driven app must be assigned to roles), service principals / application users and flow owners.
7. Output a role x table matrix and a test plan (one test user per persona).

---
name: security-roles-setup
description: "Create, edit, assign and remove Dataverse security roles with the right tool: /app-builder personas and roleGrants for the app's own roles, the Web API for privilege edits on any role, pac admin and dv-security for assignment. Use whenever roles, privileges or role assignments change."
---

# Security roles setup

Build roles repeatably with tools, not by clicking. Every change still needs user approval naming the role, the privileges or member, and the environment.

## Which tool for which job

| Task | First choice | Fallback |
|---|---|---|
| Create or edit the app's own roles | `/app-builder` `personas[]` (one role per persona; a rebuild sets privileges to exactly what the spec lists) | Web API `POST /roles` + `ReplacePrivilegesRole` |
| Give an existing role access to new tables | `/app-builder` `roleGrants[]` (adds only) | `ppdv role add` (Web API `AddPrivilegesRole`) |
| Remove privileges from a role `/app-builder` didn't create | `ppdv role remove` (Web API `RemovePrivilegeRole`) | Maker portal role designer |
| Assign users | `pac admin assign-user` (also adds the user to the environment; business unit defaults to the connection's) or `dv-security` (previews and confirms) | `/app-builder` `personas[].assignTo.users` (adds only); Web API associate |
| Assign Entra groups / teams | `pac admin assign-group` | `/app-builder` `personas[].assignTo.teams`; Web API `teamroles_association` |
| Unassign | `ppdv role unassign` | Power Platform admin center |
| Application users (integrations, flows) | `pac admin create-service-principal --role "<least-privilege role>"` (defaults to System Administrator otherwise) or `pac admin assign-user --application-user` | Admin center |
| List roles | `pac admin list-roles --environment <id>` | Web API `GET roles` |

## /app-builder personas (preferred for the app's roles)
- Each persona declares jobs with per-table privileges: `access` = read, create, write, delete, append, appendTo, assign, share; `scope` = `user` / `businessUnit` / `parentChild` / `organization`.
- `appAccess: true` (default) adds app read access and links the app to the role, so the app opens for non-admins.
- It only edits roles it created. A same-name role made elsewhere, or a managed role, is refused: use `roleGrants[]` (add-only) or the Web API for those.
- `assignTo` only adds members; it never removes.
- Roles are keyed by (name, business unit): personas with the same name in the same business unit share one role.
- **Change persona roles in the spec, not with the Web API.** A Web API edit to a persona role is drift: `verify-model-app.js` reports it (`role-privileges`) and the next rebuild reverts it.

## Web API essentials (Microsoft Learn)
- Create: `POST /roles` with `"businessunitid@odata.bind": "businessunits(<id>)"` and `name`. Add it to the working solution afterwards (`pac solution add-solution-component`) and confirm membership.
- Privileges: look up IDs in `privileges` (names like `prvCreate<entity>`, `prvRead<entity>`), then call the bound actions `AddPrivilegesRole`, `ReplacePrivilegesRole` or `RemovePrivilegeRole` on `roles(<id>)`. Depth: Basic (user), Local (business unit), Deep (parent-child), Global (organization).
- Assign: `POST systemusers(<id>)/systemuserroles_association/$ref` with `{"@odata.id": "<org>/api/data/v9.2/roles(<roleid>)"}`; teams through `teamroles_association`. Unassign with `DELETE` on the same `$ref` with `?$id=`.
- Payload shape for the privilege actions: `RemovePrivilegeRole` takes `{"Privilege": {"@odata.type": "Microsoft.Dynamics.CRM.privilege", "privilegeid": "<id>"}}` (not `PrivilegeId`); `AddPrivilegesRole` / `ReplacePrivilegesRole` take `Privileges` (array of `RolePrivilege` with `PrivilegeId`, `Depth`).
- Read back with `RetrieveRolePrivilegesRole(RoleId=<id>)` (names and depths) to verify.

## Platform rules
- You can't assign a role with more privileges than you hold yourself.
- Role definitions travel in solutions; **assignments don't**. Re-assign in each environment (script it with pac or the Web API).
- Roles belong to a business unit; check `businessUnitId` when the org has more than the root one.
- Least privilege. When not using personas, copy and trim an OOTB role (e.g. Basic User) rather than starting blank.
- Never edit roles directly in UAT/PROD; ship them in the solution.

## Verify
Permissions as the user: `ppdv test as-user --user <upn> --table <t> --ops create,read,update,delete,read-others --apply`.
Tested live in TEST-US (2026-10-21): persona role created in the solution and linked to the app, assigned with `pac admin assign-user`, one privilege removed with `RemovePrivilegeRole`, drift caught by verify.

Sign in as a test user per persona and check visibility and CRUD. `/app-builder --verify` also checks persona roles grant at least the declared depth.

Sources: learn.microsoft.com/power-apps/developer/data-platform/webapi/reference/addprivilegesrole, …/reference/entities/role, …/aad-group-team, learn.microsoft.com/power-platform/developer/cli/reference/admin, learn.microsoft.com/power-platform/admin/assign-security-roles

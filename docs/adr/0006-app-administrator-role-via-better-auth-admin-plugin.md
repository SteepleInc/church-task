# App Administrator role via Better Auth admin plugin

App Administration (the cross-Church `/admin` surface that lists every Church and User and supports impersonation) is authorized by an application-level admin role, not by a User's per-Church Membership Role. We use Better Auth's `admin()` plugin server-side and `adminClient()` client-side, include the plugin's `role`/`banned`/`banReason`/`banExpires` fields on the Postgres `user` table and `impersonated_by` on the `session` table, and gate every cross-tenant Zero/server query and impersonation on App Administrator status server-side.

## Considered Options

- **Keep the existing per-Church owner/admin gate** (`canAccessInternalNavigation`). Rejected: it lets any Church owner/admin read every other Church's data — privilege escalation across tenants — and cannot authorize impersonation.
- **Env/config allow-list of admin user IDs.** Rejected: requires hand-rolling impersonation and manual list maintenance; the admin plugin gives both for free and matches PreachX.

## Consequences

- The Better Auth schema includes admin-plugin fields as canonical Postgres/Drizzle columns.
- Client helpers use App Administrator naming, such as `useIsAppAdmin`, so app-level administration is not confused with Church Membership admin roles.
- Church owners/admins do not automatically gain `/admin` access unless granted the app `admin` role.

# Scheduled Work

Scheduled/background work runs in the Effect/Drizzle server package, not from browser traffic.

## Cycle Maintenance

The old Convex cron was `Sunday Cycle maintenance` on `0 8 * * 0`. The new equivalent entrypoint is:

```sh
DATABASE_URL=postgres://... bun run scheduled:cycle-maintenance
```

It calls `runScheduledCycleMaintenance` from `@church-task/server`, which:

- Ensures the current Cycle and next two weekly Cycles for each Church.
- Rolls unfinished Tasks from closed Cycles into the following Cycle.
- Projects Template Tasks into ensured Cycles.
- Records system Activity rows for created Cycles, rolled Tasks, and projected Template Tasks.

Production hosting for the scheduler is still a deployment-topology decision. Local/dev invocation is the command above, and tests cover the job through a real Postgres harness.

## Convex Scheduled/Background Inventory

- `packages/backend-old/convex/crons.ts`: `Sunday Cycle maintenance` (`0 8 * * 0`) called `internal.cycleMaintenance.internalRunForAllChurches`. This is ported to `runScheduledCycleMaintenance` in `@church-task/server`.
- `packages/backend-old/convex/polar.ts`: `syncProducts` was starter Polar/billing background work. Billing is out of scope for the migration and this action is obsolete rather than ported.
- Other `internalMutation` files under `packages/backend-old/convex/` are invoked by product, onboarding, or agent operations rather than registered background schedules. Those paths are handled by the feature-specific migration issues.

# Scheduled Work

Scheduled/background work runs in the Effect/Drizzle server package, not from browser traffic.

## Cycle Maintenance

The migrated equivalent of the old `Sunday Cycle maintenance` cron (`0 8 * * 0`) is:

```sh
DATABASE_URL=postgres://... bun run scheduled:cycle-maintenance
```

It calls `runScheduledCycleMaintenance` from `@church-task/server`, which:

- Ensures the current Cycle and next two weekly Cycles for each Church.
- Rolls unfinished Tasks from closed Cycles into the following Cycle.
- Projects Template Tasks into ensured Cycles.
- Records system Activity rows for created Cycles, rolled Tasks, and projected Template Tasks.

Production hosting for the scheduler is still a deployment-topology decision. Local/dev invocation is the command above, and tests cover the job through a real Postgres harness.

## Historical Scheduled/Background Inventory

- Old-stack `Sunday Cycle maintenance` called `internal.cycleMaintenance.internalRunForAllChurches`. This is ported to `runScheduledCycleMaintenance` in `@church-task/server`.
- Old starter Polar/billing background work was obsolete rather than ported because billing is outside the current architecture.
- Other old internal mutations were invoked by product, onboarding, or agent operations rather than registered background schedules. Those paths were handled by the feature-specific migration issues.

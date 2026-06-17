# Fractional string keys for Board Order

Tasks need a persisted manual ordering within Board Columns (Board Order), and drag operations should update only the moved Task rather than reindexing a whole column. We store a required `board_order` string on every Task, generated with the `fractional-indexing` package (`generateKeyBetween` / `generateNKeysBetween`); keys are assigned at creation in the centralized task creation path (appended to the end of the destination column) and rewritten on drag to slot between the destination neighbors. Since there were no production users when the field was introduced, the field is required from day one with no nullable fallback or migration.

## Considered Options

- **Integer positions with reindex-on-move** — rejected: O(column) writes per drag, noisy for optimistic updates and the activity log.
- **Float midpoint ranks** — rejected: exhausts precision after ~50 adjacent inserts and needs renormalization; fractional string keys solve the same problem without it.
- **Nullable rank with creation-time fallback** — rejected: only useful to avoid a migration, and with a nukeable DB the two-tier sort logic isn't worth carrying.

## Consequences

- Every task-creation path must assign a key because `board_order` is required by the schema.
- Ordering is a plain string comparison scoped within a column; columns partition by `workflow_status_id`, so one field serves all Boards.

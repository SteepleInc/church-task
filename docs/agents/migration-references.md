# Migration References

For PRD #164 implementation work, treat these local checkouts as the preferred implementation references when present:

- `.reference/drizzle` for Drizzle ORM, Drizzle Kit, migrations, and beta integration checks.
- `.reference/zero` for Zero, `drizzle-zero`, `zero-cache`, query helpers, mutators, and generated schema conventions.
- `.reference/effect-smol` for the Effect v4 / effect-smol API shape used by Drizzle integration experiments.
- `/Users/izakfilmalter/Projects/PreachX/preach-x` for package shape, Better Auth session/plugin patterns, Zero endpoint mounting, and local test ergonomics.

Legacy `.reference/confect` and `.reference/convex-backend` checkouts are old-stack behavior references only. New migration code must not import them or use them as target architecture examples.

# Deprecated: local merge prompt

The local Sandcastle workflow no longer merges completed branches directly into
the current checkout.

Completed branches are pushed to GitHub and opened as PRs instead. The local
runner enables auto-merge by default after the Sandcastle review cycle, and
GitHub owns the final integration step so branches get normal checks, review
comments, and merge history.

If local merge automation is reintroduced, it should be a separate explicitly
named flow, not the default `bun run sandcastle` behavior.

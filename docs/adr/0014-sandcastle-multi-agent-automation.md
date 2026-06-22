# Sandcastle multi-agent automation

Church Work uses Sandcastle to run GitHub issue work in isolated branches, then publishes completed branches as GitHub PRs from the local runner. Each issue stays on one deterministic branch (`sandcastle/issue-{id}`) while multiple specialist agents work in sequence on that branch: an all-around builder (`openai/gpt-5.5` via OpenCode with low reasoning, using the host OpenCode config and OpenCode's Codex/OpenAI OAuth auth mounted into the sandbox) handles backend, data, plumbing, and baseline implementation; an Opus UI builder (`anthropic/claude-opus-4-8` via OpenCode, using the host OpenCode Anthropic auth plugin and OAuth auth mounted into the sandbox) runs only when the planner marks `needsUi: true`; the all-around verify/fixer writes or updates targeted tests and fixes integration failures; the local runner pushes completed branches and creates/updates PRs; UI and code review agents then run against the open PR branch and push follow-up commits when needed; the runner enables GitHub auto-merge by default when available, otherwise waits for passing checks and merges the PR through GitHub; it also polls PR checks and runs repair agents on failed checks. Final merging happens through GitHub so checks, PR review comments, merge history, and issue-closing semantics remain the source of truth.

## Considered Options

- **Single generalist agent for every phase** — rejected: GPT-5.5 is fast and strong for broad implementation, but is not reliable enough for Church Work's UI design-language fit.
- **Opus for every phase** — rejected: Opus is better for UI judgment but a poor default for backend, data, plumbing, and repo-wide repair work.
- **Separate branches for data and UI stages** — rejected: cross-branch handoff would add coordination and merge complexity; one branch per issue lets agents hand off in-place.
- **Local mega-merge after agent review** — rejected: it hides integration inside the caller's checkout and loses the normal PR review/checks path.
- **GitHub PR merge after local agent production** — accepted: the workflow remains locally initiated, while integration happens through GitHub PRs.

## Consequences

- Issues that include meaningful user-facing UI need a planner-provided `needsUi` flag and `uiBrief`.
- UI agents may touch data wiring when needed to make the interface real, but broad frontend plumbing remains the all-around builder's responsibility.
- User-visible changes should gain targeted Playwright E2E coverage during the verify/fixer phase; CI runs the full E2E suite.
- Sandcastle prompt files are part of the engineering workflow and should be updated as the agent division of labor evolves.
- `bun run sandcastle` should not merge branches locally by default; it should publish PRs and enable GitHub auto-merge. Auto-merge may be disabled explicitly with `SANDCASTLE_AUTO_MERGE=false` when PRs should remain open for manual inspection/merge.
- Failed GitHub PR checks should be repaired on the same PR branch by a local Sandcastle repair agent. This keeps the PR inspectable while still letting GitHub own the eventual merge.
- Final Sandcastle review should happen after the PR exists so the review cycle is visible on the same GitHub PR that will auto-merge.

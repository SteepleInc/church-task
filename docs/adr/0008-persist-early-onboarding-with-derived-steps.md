# Persist-early onboarding with derived steps

Onboarding creates the Church the moment the Church Profile step is submitted (`organization.create` + `setActive`, with the existing `afterCreateOrganization` hook seeding the default Workflow, Key Dates, and Starter Teams), rather than batching all persistence into a final "complete" call. The current step is derived — never stored — from URL search state plus live org state via a `resolveStep` function, ported from PreachX's onboarding data flow, whose protections (atomic `completeOnboarding` plugin, `clearOrgForOnboarding`, completed-flag gating) were battle-tested there. Steps are `churchProfile` → `initialTeams` → `finished` (the finished step exists to absorb a future billing step's Stripe return). The Initial Teams step is a live editor over persisted teams, not a local draft list.

## Considered Options

- **Defer all persistence to the end of the flow (previous behavior).** Rejected: any refresh or device change mid-flow silently lost the church profile and team edits, because step resolution depended on in-memory React state the URL could not back up.
- **Stash drafts in sessionStorage instead of persisting.** Rejected: survives refresh but not devices or logout, and diverges from the reference flow we want to stay faithful to.

## Consequences

- Once the Church exists, the Church Profile step is unreachable for the rest of onboarding — `resolveStep` auto-advances past it, and there is deliberately no back navigation. Profile typos are fixed post-onboarding at `/settings/org`. (PreachX has a vestigial `orgId`-in-URL edit mechanism; it was never wired up and is intentionally not ported.)
- A Church can exist with `completedOnboarding: false` for any length of time; all routing guards must treat that as "in onboarding," never "in the product."
- Deliberate deviations from the PreachX reference: no `orgId` step param and a stronger no-active-org rule in `resolveStep` (a stale `?step=` URL can never render an orgless step). We do keep PreachX's session read model for auth routing: `orgCompletedOnboarding`, `orgRole`, and `userRole` are copied onto the session when the Active Church changes, when Onboarding completes, and when a new session is created. Route guards can decide quickly from the session, while pages still read live Church state from Convex for rendering.
- Backend `STARTER_TEAMS` is the single canonical default-team list; the frontend's separate suggestion list is removed (it previously double-created teams on top of the seed).

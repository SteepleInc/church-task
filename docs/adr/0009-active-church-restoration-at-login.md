# Active Church restoration at login

A Better Auth session-create hook assigns `activeOrganizationId` on every new session: first the previous session's active org (when that membership still exists), then the user's most recently joined Church, else unset. Previously nothing set the field at login, so every re-login landed users on a blank onboarding screen regardless of their Churches; PreachX's equivalent hook picks an arbitrary unordered first membership, which we deliberately did not copy — restoring the previous session is what makes "logged out mid-onboarding of a new Church, logged back in" return to that Church's onboarding instead of a coin-flip org.

## Consequences

- A user with no Churches gets no Active Church and is routed into onboarding's Church Profile step — that is the intended new-signup path, not an error state.
- `skipOrgFallback` remains write-only (set by `clearOrgForOnboarding`): the fallback runs only at session creation, so clearing the active org mid-session cannot be undone by it. The flag becomes meaningful only if a mid-session fallback is ever added.

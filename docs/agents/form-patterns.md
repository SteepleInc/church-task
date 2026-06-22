# Form patterns

Agent-facing default: use TanStack Form for actual user-editable forms in the web app.

## Default to TanStack Form

Use TanStack Form for flows where a user edits values that will be validated, submitted, saved, or used to create/update domain state. This includes create dialogs, edit dialogs, onboarding steps, settings forms, invite/member flows, and any multi-field submit action.

Do not use component-local `useState` as the primary state holder for form values when the interaction is an actual submitted form. Local value state tends to duplicate validation/submission logic and bypasses the shared field primitives.

Start from the existing shared helpers and primitives:

- `apps/web/src/components/form/ts-form.ts` exports `useAppForm` and `withForm` from TanStack Form.
- `apps/web/src/components/form/ts-field.tsx` defines the shared form/field contexts.
- `apps/web/src/components/form/*-field.tsx` contains field components such as `InputField`, `TextareaField`, `SelectField`, `DatePickerField`, `SwitchField`, `TagInputField`, and entity selection fields.
- `apps/web/src/components/form/form.tsx`, `form-error-display.tsx`, and `card-form.tsx` provide the shared submit/error/layout shell.

Prefer copying the shape of existing flows such as `features/auth/sign-in-email-form.tsx`, `features/settings/invite-member.tsx`, `features/quick-actions/edit-org-quick-action.tsx`, or Template authoring forms before inventing a new form shape.

## Keep ephemeral UI state local

`useState` is still appropriate for local, non-submitted UI state, especially when it controls presentation rather than submitted values:

- popover, dropdown, sheet, and dialog open/closed state
- focus, hover, highlighted row, selected tab, or disclosure state
- optimistic/loading flags not already represented by a mutation/form status
- view mode, sort, or tab state that is not submitted as a form
- ephemeral search/filter text for command palettes, combobox filtering, or local list narrowing that does not itself submit a form
- component internals such as measured dimensions or animation toggles

Concrete examples:

- Acceptable `useState`: `const [open, setOpen] = useState(false)` for a picker popover, or `const [query, setQuery] = useState("")` for local command-menu filtering.
- Use TanStack Form instead: a New Task dialog with title, description, assignee, due date, and submit validation; a settings page that saves Church name/time zone; or an Invite Member form that collects emails and role.

When in doubt, ask: "Will these values be submitted or validated as a user form?" If yes, reach for `useAppForm` and shared field components. If no, local UI state is usually fine.

# church-task

Church Task is a Bun + Turborepo TypeScript monorepo for church work management. The current architecture uses TanStack Start, Postgres, Drizzle, Zero, Better Auth, Effect, shared UI primitives, and shared config/env packages.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - React app/runtime shell with file-based routing
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Postgres + Drizzle** - Source-of-truth schema, migrations, seed/reset tooling, and server-side database access
- **Zero** - Synced product data, client queries, mutators, and list-query helpers
- **Better Auth** - Postgres-backed authentication, sessions, organization context, and admin helpers
- **Effect** - Typed server/API, CLI, MCP, and scheduled-work composition
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Local Setup

Prepare the local server/database stack:

```bash
bun run dev:setup
```

`bun run dev:setup` is served by `@church-task/server` and should prepare the local Drizzle/Postgres-backed development state for the current stack.

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.

## Agent Platform Setup

The CLI and MCP smoke-test path for agents is documented in `docs/agent-platform-setup.md`.

Start with the public CLI health check after the local server stack is running:

```bash
bun packages/cli/src/bin.ts health
```

## UI Customization

React web apps in this stack share UI primitives through `apps/web/src/components` and shared packages where appropriate.

- Change design tokens and global styles in `apps/web/src/styles.css`.
- Update web components in `apps/web/src/components/*`.
- Keep reusable cross-package UI or utility additions aligned with existing package exports.

## Git Hooks and Formatting

- Format and lint fix: `bun run check`
- Full local verification including typecheck and E2E: `bun run check:full`

## Project Structure

```
church-task/
├── apps/
│   └── web/              # TanStack Start web app
├── backend/
│   └── server/           # Effect API/server runtime
├── packages/
│   ├── auth/             # Better Auth configuration and helpers
│   ├── cli/              # Agent/CLI entrypoints
│   ├── config/           # Shared TypeScript/tooling config
│   ├── db/               # Drizzle schema, migrations, seeds, and DB helpers
│   ├── domain/           # API contracts, tagged errors, pure domain logic
│   ├── env/              # Environment handling
│   ├── shared/           # Cross-cutting helpers such as TypeID factories
│   ├── test-harness/     # Testcontainers, seed, and E2E harness helpers
│   └── zero/             # Zero schema, queries, mutators, and list helpers
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start the Effect server package
- `bun run dev:setup`: Prepare local development database/server state
- `bun run check-types`: Check TypeScript types across all apps
- `bun run check`: Run Oxlint and Oxfmt
- `bun run check:full`: Run formatting/linting, typecheck, and Playwright E2E
- `bun run test:e2e`: Run the Playwright E2E suite against the local stack

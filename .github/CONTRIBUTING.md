# Contributing to FlowChat

Thank you for your interest in contributing to FlowChat. This document covers our conventions, workflow, and quality expectations.

---

## Code Style

This project follows strict conventions documented in [`CLAUDE.md`](../CLAUDE.md). The key rules are summarized here — refer to CLAUDE.md for the complete specification.

### TypeScript

- `strict: true` everywhere — no exceptions
- Explicit return types on all functions and methods
- No `any` — use `unknown` and narrow
- No non-null assertions (`!`) — handle nullability explicitly

### Naming

| Style                  | Usage                                      |
| ---------------------- | ------------------------------------------ |
| `camelCase`            | Variables, functions, methods, Zod schemas |
| `PascalCase`           | React components, types, interfaces        |
| `kebab-case`           | File names (`auth.service.ts`)             |
| `SCREAMING_SNAKE_CASE` | Constants and environment variables        |

### File Rules

- Max ~200 lines per file. Extract when approaching this limit.
- One primary export per file.
- No barrel `index.ts` files unless the package boundary requires it.
- Co-locate feature code within the feature directory.

### Styling

- Tailwind CSS classes only — no CSS-in-JS, no inline styles
- Use `@flowchat/ui` components for shared primitives (Button, Input, Avatar, Modal)

### Backend Architecture

Every endpoint follows the strict four-layer pattern:

```
Route → Controller → Service → Repository → Database
```

- **Routes:** path + method + middleware. No logic.
- **Controllers:** extract input, call service, return response. No business logic.
- **Services:** all business logic. No direct DB calls.
- **Repositories:** all database queries. No business logic.

### Logging

- Use Pino on the server — never `console.log`
- Never log passwords, tokens, or PII

---

## Branch Naming

Use this format:

```
<type>/<short-description>
```

| Type        | When to use                                |
| ----------- | ------------------------------------------ |
| `feat/`     | New feature                                |
| `fix/`      | Bug fix                                    |
| `refactor/` | Code restructuring without behavior change |
| `docs/`     | Documentation only                         |
| `test/`     | Adding or updating tests                   |
| `chore/`    | Build, CI, dependency updates              |

Examples:

- `feat/message-threads`
- `fix/refresh-token-rotation`
- `refactor/extract-upload-service`
- `docs/api-reference`

---

## Pull Request Process

### Before opening a PR

1. **Create a feature branch** from `main` using the naming convention above
2. **Keep commits focused** — one logical change per commit
3. **Run the full quality suite** locally:

```bash
pnpm lint        # Zero warnings
pnpm typecheck   # Zero errors
pnpm test        # All tests pass
```

### PR Description

Include:

- A summary of what changed and why
- How to test the change (manual steps or new test coverage)
- Screenshots for UI changes

### PR Checklist

Copy this into your PR description and check off each item:

```markdown
### Checklist

- [ ] Branch follows naming convention (`feat/`, `fix/`, etc.)
- [ ] Code follows project conventions (see CLAUDE.md)
- [ ] `pnpm lint` passes with zero warnings
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm test` passes
- [ ] New features include tests (service-layer unit tests at minimum)
- [ ] No `console.log` statements (use Pino on the server)
- [ ] No `any` types
- [ ] No secrets or credentials committed
- [ ] API changes include updated docs/api.md
- [ ] Database changes include a Drizzle migration (`drizzle-kit generate`)
- [ ] Environment variable changes are reflected in .env.example and README.md
```

---

## Development Workflow

### Adding a New Backend Feature

1. Create the feature directory under `apps/server/src/features/<name>/`
2. Create all five files: `<name>.routes.ts`, `<name>.controller.ts`, `<name>.service.ts`, `<name>.repository.ts`, `<name>.schemas.ts`
3. Register the router in `apps/server/src/app.ts`
4. Add service-layer tests in `<name>.service.test.ts`

### Adding a New Frontend Feature

1. Create the feature directory under `apps/web/src/features/<name>/`
2. Create: API hooks (`api/`), components (`components/`), any shared types
3. Use TanStack Query for server state, Zustand only for ephemeral UI state

### Database Changes

1. Modify or create schema files in `apps/server/src/db/schema/`
2. Generate a migration: `pnpm --filter @flowchat/server drizzle-kit generate`
3. Run the migration: `pnpm --filter @flowchat/server migrate`
4. Commit the migration file — never hand-edit generated migrations

### Adding Environment Variables

1. Add the variable to the Zod schema in `apps/server/src/lib/env.ts`
2. Add it to both `.env.example` files (root and `apps/server/`)
3. Document it in the README.md environment variables table
4. If it's a frontend variable, prefix with `VITE_` and add to `apps/web/.env`

---

## Reporting Issues

Open an issue with:

- Steps to reproduce
- Expected behavior vs actual behavior
- Browser/Node.js version
- Relevant error messages or screenshots

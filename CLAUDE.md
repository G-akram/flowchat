# CLAUDE.md — Slack Clone Project Rules

> This file is read automatically by Claude Code. Follow every rule strictly.
> No exceptions unless the user explicitly overrides a rule in the prompt.

---

## Project Overview

A production-grade Slack clone built as a portfolio project.
Monorepo (Turborepo) with a React/Vite frontend, Node.js backend, and shared packages.

---

## Monorepo Structure

```
/
├── apps/
│   ├── web/          # React + Vite + TypeScript (frontend)
│   └── server/       # Node.js + Express + Socket.IO (backend)
├── packages/
│   ├── ui/           # Shared shadcn/ui components
│   ├── types/        # Shared TypeScript types & Zod schemas
│   └── config/       # Shared ESLint, Prettier, TS configs
├── docker-compose.yml
└── CLAUDE.md
```

---

## Tech Stack

### Frontend (apps/web)

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query v5 (server state)
- Zustand (ephemeral UI state only — e.g., sidebar open, active modal)
- React Hook Form + Zod
- Socket.IO client

### Backend (apps/server)

- Node.js + Express + TypeScript
- Drizzle ORM + drizzle-kit (migrations)
- PostgreSQL
- Socket.IO
- Pino (logging)
- Redis (presence tracking, pub/sub for multi-instance scaling)
- JWT (access token, 15min) + refresh token rotation (httpOnly cookie, 7d)
- Zod (all input validation)

### Infrastructure

- Docker Compose (local: Postgres + Redis)
- S3-compatible storage (file uploads — add last)

---

## Architecture Rules

### Backend Layer Rules

```
Route → Controller → Service → Repository → Database
```

- **Routes**: define path + HTTP method + middleware only. No logic.
- **Controllers**: extract validated input, call service, return response. No business logic.
- **Services**: all business logic lives here. No direct DB calls — use repositories.
- **Repositories**: all database queries live here. No business logic.
- **Schemas**: Zod schemas for every request (body, params, query). Defined in `schemas/` within each feature.

```
apps/server/src/
├── features/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   └── auth.schemas.ts
│   ├── messages/
│   ├── channels/
│   ├── workspaces/
│   └── users/
├── socket/
│   ├── socket.server.ts      # Socket.IO initialization + auth middleware
│   ├── handlers/
│   │   ├── message.handler.ts
│   │   ├── typing.handler.ts
│   │   └── presence.handler.ts
│   └── events.ts             # Typed event name constants
├── middleware/
│   ├── authenticate.ts       # JWT verification middleware
│   ├── error-handler.ts      # Global Express error handler
│   ├── rate-limit.ts
│   └── validate.ts           # Zod validation middleware factory
├── lib/
│   ├── db.ts                 # Drizzle instance
│   ├── redis.ts              # Redis client
│   ├── logger.ts             # Pino instance
│   ├── env.ts                # Zod-validated process.env
│   └── errors.ts             # AppError class + error codes
├── types/
└── app.ts
```

### Frontend Feature Structure

```
apps/web/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/              # React Query hooks (useLogin, useRegister, etc.)
│   │   └── schemas.ts        # Zod schemas (same shape as backend)
│   ├── messages/
│   ├── channels/
│   └── workspaces/
├── components/               # Truly generic, stateless UI components
├── lib/
│   ├── api-client.ts         # Axios instance with interceptors
│   ├── socket.ts             # Socket.IO client singleton
│   └── query-client.ts       # TanStack Query client config
├── hooks/                    # Global hooks (useAuth, useSocket)
├── stores/                   # Zustand stores (UI state only)
├── types/                    # Frontend-only types (re-export from packages/types)
└── main.tsx
```

---

## Code Quality Rules

### TypeScript

- `strict: true` in all tsconfigs — no exceptions
- Explicit return types on all functions and methods
- No `any`. Use `unknown` and narrow it.
- No non-null assertions (`!`) — handle nullability explicitly
- Use `satisfies` operator when validating object literals against types

### Naming Conventions

- `camelCase` → variables, functions, methods
- `PascalCase` → React components, TypeScript types/interfaces
- `kebab-case` → file names (e.g., `auth.service.ts`, `message-list.tsx`)
- `SCREAMING_SNAKE_CASE` → constants and env variable names
- `camelCase` → Zod schema instances (e.g., `loginSchema`, `createChannelSchema`)

### File Conventions

- Max ~200 lines per file. Extract when approaching this limit.
- One primary export per file.
- No barrel `index.ts` files unless the package boundary requires it.
- Co-locate feature code. Don't scatter a feature across global folders.

---

## API Conventions

### Response Shape

Success:

```json
{ "data": { ... } }
```

Error:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "email" } }
```

- Always use these shapes. Never return a raw string or untyped object.
- HTTP status codes must be semantically correct (201 for creates, 204 for deletes, etc.)

### Pagination

- Use **cursor-based pagination** for all list endpoints (never offset-based)
- Query params: `cursor` (last item ID) + `limit` (default 50, max 100)
- Response includes `nextCursor: string | null`

### Auth

- Access token: JWT, 15-minute expiry, sent in `Authorization: Bearer` header
- Refresh token: opaque, 7-day expiry, stored in httpOnly Secure cookie
- Socket auth: pass access token in socket handshake `auth` object

---

## Realtime (Socket.IO) Rules

### Typed Events

Define all event names as constants in `socket/events.ts`. Never use raw strings.

```typescript
export const SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  PRESENCE_UPDATE: 'presence:update',
  CHANNEL_JOINED: 'channel:joined',
} as const;
```

### Cache Update Pattern

When a socket event is received on the frontend:

1. Do NOT refetch — manually update the React Query cache
2. Use `queryClient.setQueryData` or `queryClient.invalidateQueries` only when consistency is critical

### Optimistic Updates (message send)

1. Optimistically insert the message into the React Query cache with a temp ID
2. Fire the API call
3. On success: replace temp message with server response
4. On error: roll back the optimistic insert and show an error toast
5. Other clients receive the new message via socket broadcast

---

## Error Handling

### Backend

- Custom `AppError` class: `new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404)`
- All thrown `AppError` instances are caught by the global error handler in `middleware/error-handler.ts`
- Unexpected errors are logged with Pino and returned as `INTERNAL_ERROR` (never leak stack traces)

### Frontend

- API errors map to the `{ error: { code, message, field? } }` shape
- React Query `onError` callbacks show toasts for non-form errors
- Form errors use React Hook Form's `setError` with the `field` from the response
- Every async UI state has three states rendered: loading, error, empty

---

## Database Rules (Drizzle)

- All schema definitions live in `apps/server/src/db/schema/`
- One file per domain entity (e.g., `users.ts`, `messages.ts`, `channels.ts`)
- All migrations generated via `drizzle-kit generate` — never hand-edited
- Migration files are committed to git and never modified after generation
- A `migrate.ts` script runs migrations on startup in non-production; in production it runs as a separate step

---

## Environment Validation

`apps/server/src/lib/env.ts` must validate all environment variables using Zod at startup.
If any required variable is missing, throw immediately with a descriptive error before the server starts.

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  CLIENT_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

---

## Logging (Pino)

- Use `pino` on the server. Never use `console.log` in production paths.
- `pino-http` for request logging (auto-logs method, url, status, response time)
- Log levels: `error` for caught exceptions, `warn` for expected bad states, `info` for key events, `debug` for dev only
- Never log sensitive data (passwords, tokens, PII)

---

## Testing Strategy

- **Unit tests**: Vitest for service-layer functions (mock the repository)
- **Integration tests**: Supertest for API routes (use a test database)
- **E2E**: One Playwright smoke test covering sign up → create channel → send message
- Test files co-located with source: `auth.service.test.ts` next to `auth.service.ts`

---

## Anti-Patterns (Never Do These)

- No `data`, `stuff`, `thing`, `temp`, `foo`, `bar` as variable names
- No `any` type — ever
- No TODO comments unless the user explicitly asks for a placeholder
- No pseudo-code or placeholder implementations
- No business logic in routes, controllers, or React components
- No direct database calls outside of repositories
- No `console.log` — use Pino on the server, structured logs only
- No deeply nested callbacks or promise chains — use async/await
- No over-engineering: don't add an abstraction until you need it twice
- No magic numbers — extract to named constants
- No implicit returns in complex functions
- No CSS in JS — use Tailwind classes only
- No Zustand for server state — that belongs in React Query

---

## Output Rules for Claude Code

- Follow the existing folder structure exactly
- No explanations inside code (comments should be rare and meaningful)
- No `// eslint-disable` unless absolutely unavoidable — fix the root cause
- When creating a new feature, always create: route + controller + service + repository + schema
- When creating a new frontend feature, always create: api hook + component + types
- Make **surgical edits** — show only the changed code with enough surrounding context to locate it. Use `// CHANGED START` and `// CHANGED END` markers to delimit edits. These markers are navigation aids, not code comments — always remove them from the final file.
- Only return a complete file if more than 50% of it changed.

# FlowChat

A production-grade Slack clone featuring real-time messaging, workspaces, channels, direct messages, presence tracking, emoji reactions, file uploads, and in-app notifications 

<!-- TODO: Replace with an actual screenshot -->

![FlowChat Screenshot](docs/screenshot-placeholder.png)

---

## Features

- **Workspaces** — create and manage isolated team workspaces with invite-by-email
- **Channels** — public and private channels within a workspace
- **Direct Messages** — 1-on-1 conversations between workspace members
- **Real-time Messaging** — instant delivery via Socket.IO with optimistic UI updates
- **Message Editing & Deletion** — inline editing with confirmation dialog; edits and deletes broadcast in real time to all channel members
- **Presence** — live online / away / offline indicators with heartbeat
- **Typing Indicators** — see who is typing in a channel
- **Emoji Reactions** — react to any message with any emoji
- **File Uploads** — attach images, PDFs, and text files (up to 2 MB) via Supabase Storage
- **In-app Media Viewer** — full-screen image lightbox with zoom/pan and gallery navigation; native PDF reader; zero third-party viewer dependencies
- **Message Search** — full-text search across workspace messages (PostgreSQL `tsvector`)
- **Notifications** — in-app notifications for channel invites, workspace membership changes
- **Auth** — email/password registration with JWT access tokens and rotating refresh tokens
- **Keyboard Navigation** — Alt+Arrow to switch channels, Escape to close modals

---

## Tech Stack

| Layer                | Technology                       | Why                                                           |
| -------------------- | -------------------------------- | ------------------------------------------------------------- |
| **Monorepo**         | Turborepo + pnpm                 | Fast, incremental builds with workspace dependency management |
| **Frontend**         | React 18 + Vite + TypeScript     | Fast HMR, type safety, mature ecosystem                       |
| **Styling**          | Tailwind CSS + shadcn/ui         | Utility-first CSS with accessible, composable components      |
| **Server State**     | TanStack Query v5                | Declarative caching, background refetches, optimistic updates |
| **UI State**         | Zustand                          | Lightweight store for ephemeral UI state (sidebar, modals)    |
| **Forms**            | React Hook Form + Zod            | Performant forms with schema-based validation                 |
| **Backend**          | Node.js + Express + TypeScript   | Proven HTTP framework with strong typing                      |
| **ORM**              | Drizzle ORM + drizzle-kit        | Type-safe SQL, zero-overhead, migration tooling               |
| **Database**         | PostgreSQL 16                    | ACID transactions, full-text search, robust JSON support      |
| **Realtime**         | Socket.IO                        | Reliable WebSocket abstraction with rooms and namespaces      |
| **Cache / Presence** | Redis 7                          | In-memory presence tracking and pub/sub for scaling           |
| **Logging**          | Pino                             | Structured, low-overhead JSON logging                         |
| **File Storage**     | Supabase Storage (S3-compatible) | Managed object storage with presigned URLs                    |
| **Validation**       | Zod (shared)                     | Single schema definition used on both client and server       |

---

## Project Structure

```
flowchat/
├── apps/
│   ├── web/            # React + Vite frontend
│   └── server/         # Node.js + Express + Socket.IO backend
├── packages/
│   ├── ui/             # Shared shadcn/ui component library
│   ├── types/          # Shared TypeScript types and Zod schemas
│   └── config/         # Shared ESLint, Prettier, and TypeScript configs
├── docker-compose.yml  # PostgreSQL 16 + Redis 7
├── CLAUDE.md           # AI coding assistant rules and conventions
└── docs/
    ├── architecture.md # System design, data model, auth flow
    └── api.md          # REST endpoint and Socket.IO event reference
```

See [docs/architecture.md](docs/architecture.md) for a detailed system design overview.

---

## Prerequisites

| Tool                            | Version                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| **Node.js**                     | 20+                                                          |
| **pnpm**                        | 9+ (`corepack enable && corepack prepare pnpm@9 --activate`) |
| **Docker** + **Docker Compose** | Any recent version                                           |

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd flowchat

# 2. Enable pnpm via Corepack (ships with Node.js 20+)
corepack enable
corepack prepare pnpm@9 --activate

# 3. Install dependencies
pnpm install

# 4. Copy environment files
cp .env.example .env
cp apps/server/.env.example apps/server/.env
# Edit both .env files — see "Environment Variables" below

# 5. Start PostgreSQL and Redis
docker compose up -d

# 6. Verify containers are healthy
docker compose ps
# Both flowchat-postgres and flowchat-redis should show "healthy"

# 7. Run database migrations
pnpm --filter @flowchat/server migrate

# 8. (Optional) Seed the database with sample data
pnpm --filter @flowchat/server seed

# 9. Start all services in development mode
pnpm dev
```

The frontend runs at **http://localhost:5173** and the API at **http://localhost:4000**.

To verify the backend is healthy:

```bash
curl http://localhost:4000/api/health
# {"data":{"status":"ok","timestamp":"...","dbConnected":true,"redisConnected":true}}
```

---

## Environment Variables

### Server (`apps/server/.env`)

All variables are validated at startup via Zod (`apps/server/src/lib/env.ts`). The server will refuse to start if any required variable is missing or invalid.

| Variable                    | Required | Default           | Description                                                         |
| --------------------------- | -------- | ----------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`              | Yes      | —                 | PostgreSQL connection string. `postgresql://flowchat:flowchat@localhost:5432/flowchat` |
| `REDIS_URL`                 | Yes      | —                 | Redis connection string. `redis://localhost:6379`                    |
| `JWT_SECRET`                | Yes      | —                 | Secret for signing JWT access tokens. Must be >= 32 characters.     |
| `JWT_REFRESH_SECRET`        | Yes      | —                 | Secret for refresh token operations. Must be >= 32 characters.      |
| `PORT`                      | No       | `4000`            | Port the Express server listens on.                                 |
| `NODE_ENV`                  | Yes      | —                 | One of `development`, `production`, or `test`.                      |
| `CLIENT_URL`                | Yes      | —                 | Frontend origin for CORS. `http://localhost:5173`                   |
| `SUPABASE_URL`              | Yes      | —                 | Supabase project URL for file storage.                              |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes      | —                 | Supabase service role key (server-side only, never expose to client). |
| `SUPABASE_BUCKET_NAME`      | No       | `flowchat-bucket` | Supabase Storage bucket name.                                       |

### Frontend (`apps/web/.env`)

| Variable               | Required | Default                | Description                                      |
| ---------------------- | -------- | ---------------------- | ------------------------------------------------ |
| `VITE_API_URL`         | No       | `/api`                 | Base URL for API requests.                       |
| `VITE_SOCKET_URL`      | No       | `http://localhost:4000`| Socket.IO server URL.                            |
| `VITE_SUPABASE_URL`    | Yes      | —                      | Supabase project URL (same as server).           |
| `VITE_SUPABASE_ANON_KEY` | Yes   | —                      | Supabase anonymous key (safe for client use).    |

> **Security note:** Never commit real secrets to git. The `.env` file is gitignored. Use the `.env.example` files as templates.

---

## Scripts

| Command                                    | Description                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| `pnpm dev`                                 | Start all apps in development mode (Vite + tsx watch) |
| `pnpm build`                               | Build all apps and packages                           |
| `pnpm typecheck`                           | Run TypeScript type checking across the monorepo      |
| `pnpm lint`                                | Lint all packages with ESLint                         |
| `pnpm format`                              | Format all files with Prettier                        |
| `pnpm --filter @flowchat/server migrate`   | Run Drizzle database migrations                       |
| `pnpm --filter @flowchat/server seed`      | Seed the database with sample data                    |
| `pnpm --filter @flowchat/server db:studio` | Open Drizzle Studio (database GUI)                    |

---

## Running Tests

```bash
# Unit + integration tests (Vitest + Supertest)
pnpm test

# Type checking only
pnpm typecheck

# Lint only
pnpm lint
```

Test files are co-located with source code (e.g., `auth.service.test.ts` next to `auth.service.ts`).

---

## Architecture

For a detailed breakdown of the system design, backend layers, database schema, real-time event flow, and authentication, see:

- **[docs/architecture.md](docs/architecture.md)** — System design, data model, auth flow, key decisions
- **[docs/api.md](docs/api.md)** — Complete REST and Socket.IO API reference

---

## Contributing

See **[.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)** for the code style guide, PR checklist, and branch naming conventions.

---

## License
use it as u wish.

# FlowChat

A production-grade Slack clone built with React, Node.js, and Socket.IO.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd flowchat

# 2. Copy environment variables
cp .env.example .env
# Edit .env and fill in any secrets (JWT_SECRET, JWT_REFRESH_SECRET must be 32+ chars)

# 3. Start Postgres and Redis
docker-compose up -d

# 4. Install dependencies
pnpm install

# 5. Run database migrations
pnpm --filter @flowchat/server migrate

# 6. Start all services in development mode
pnpm dev
```

The web app runs at http://localhost:5173 and the API at http://localhost:4000.

## Project Structure

```
/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── server/       # Node.js + Express + Socket.IO backend
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/        # Shared TypeScript types and Zod schemas
│   └── config/       # Shared ESLint, Prettier, TS configs
└── docker-compose.yml
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files with Prettier |

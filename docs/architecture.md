# Architecture

This document describes the system design of FlowChat — a production-grade Slack clone built with TypeScript across the full stack.

---

## System Design Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  React 18 + Vite · TanStack Query · Zustand · Socket.IO Client  │
└────────────────────────┬───────────────────┬─────────────────────┘
                         │  HTTP (REST)      │  WebSocket
                         ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Node.js + Express Server                       │
│                                                                   │
│  ┌─────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Routes  │→│ Controllers │→│ Services  │→│ Repositories  │    │
│  └─────────┘  └────────────┘  └──────────┘  └──────┬───────┘    │
│                                                      │            │
│  ┌──────────────┐  ┌───────────┐                     │            │
│  │  Socket.IO    │  │ Middleware │                     │            │
│  │  (Realtime)   │  │  Stack    │                     │            │
│  └──────┬───────┘  └───────────┘                     │            │
│         │                                             │            │
└─────────┼─────────────────────────────────────────────┼────────────┘
          │                                             │
          ▼                                             ▼
┌──────────────────┐                         ┌──────────────────────┐
│   Redis 7        │                         │   PostgreSQL 16      │
│   - Presence TTL │                         │   - All persistent   │
│   - Pub/Sub      │                         │     data             │
│                  │                         │   - Full-text search │
└──────────────────┘                         └──────────────────────┘
                                                        │
                                             ┌──────────────────────┐
                                             │  Supabase Storage    │
                                             │  (S3-compatible)     │
                                             │  - File uploads      │
                                             └──────────────────────┘
```

The system follows a traditional client-server model with two communication channels:

1. **REST API** — CRUD operations for all resources (auth, workspaces, channels, messages, etc.)
2. **WebSocket (Socket.IO)** — real-time event delivery for messages, typing indicators, and presence

---

## Backend Layer Diagram

Every HTTP request passes through a strict, four-layer architecture:

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  Route                                                   │
│  Defines path, HTTP method, and middleware chain.         │
│  No logic — just wiring.                                 │
├─────────────────────────────────────────────────────────┤
│  Middleware                                               │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │  rate-limit   │  │ authenticate│  │ validate (Zod)  │  │
│  └──────────────┘  └────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Controller                                              │
│  Extracts validated input from req.body / req.params /   │
│  req.query, calls the service layer, formats the HTTP    │
│  response. No business logic.                            │
├─────────────────────────────────────────────────────────┤
│  Service                                                 │
│  ALL business logic lives here. Orchestrates repository  │
│  calls, enforces authorization, emits socket events.     │
│  Never touches the database directly.                    │
├─────────────────────────────────────────────────────────┤
│  Repository                                              │
│  ALL database queries live here. Returns plain data      │
│  objects. No business logic, no HTTP awareness.          │
├─────────────────────────────────────────────────────────┤
│  Database (Drizzle ORM → PostgreSQL)                     │
└─────────────────────────────────────────────────────────┘
```

### File naming convention

Each feature follows the same file structure:

```
features/<feature>/
├── <feature>.routes.ts       # Route definitions
├── <feature>.controller.ts   # Request handling
├── <feature>.service.ts      # Business logic
├── <feature>.repository.ts   # Database queries
└── <feature>.schemas.ts      # Zod validation schemas
```

---

## Database Schema Overview

All schema definitions use Drizzle ORM and live in `apps/server/src/db/schema/`.

### Entity Relationship Diagram

```
┌───────────────────┐       ┌────────────────────────┐
│      users        │       │     workspaces          │
├───────────────────┤       ├────────────────────────┤
│ id (PK, uuid)     │◄──────│ owner_id (FK)          │
│ email (unique)    │       │ id (PK, uuid)          │
│ username (unique) │       │ name                    │
│ display_name      │       │ slug (unique)           │
│ password_hash     │       │ created_at              │
│ avatar_url        │       └───────────┬────────────┘
│ created_at        │                   │
│ updated_at        │                   │
└───────┬───────────┘                   │
        │                               │
        │      ┌────────────────────────┴───────┐
        │      │     workspace_members           │
        │      ├────────────────────────────────┤
        ├─────►│ workspace_id (PK, FK)          │
        │      │ user_id (PK, FK)               │
        │      │ role (owner|admin|member)       │
        │      │ joined_at                       │
        │      └────────────────────────────────┘
        │
        │      ┌────────────────────────────────┐
        │      │     channels                    │
        │      ├────────────────────────────────┤
        ├─────►│ created_by_id (FK → users)     │
        │      │ id (PK, uuid)                  │
        │      │ workspace_id (FK)              │
        │      │ name                            │
        │      │ description                     │
        │      │ is_private                      │
        │      │ is_direct_message               │
        │      │ created_at                      │
        │      └───────────┬────────────────────┘
        │                  │
        │   ┌──────────────┴─────────┐
        │   │   channel_members      │
        │   ├────────────────────────┤
        ├──►│ channel_id (PK, FK)    │
        │   │ user_id (PK, FK)       │
        │   │ joined_at              │
        │   │ last_read_at           │
        │   └────────────────────────┘
        │
        │   ┌────────────────────────┐
        │   │   messages              │
        │   ├────────────────────────┤
        ├──►│ user_id (FK)           │
        │   │ id (PK, uuid)          │
        │   │ channel_id (FK)        │
        │   │ content (full-text idx)│
        │   │ edited_at              │
        │   │ created_at             │
        │   └───┬──────────┬─────────┘
        │       │          │
        │       │          │  ┌──────────────────────┐
        │       │          │  │ message_attachments   │
        │       │          │  ├──────────────────────┤
        │       │          └─►│ message_id (FK)      │
        │       │             │ id (PK, uuid)        │
        │       │             │ url                   │
        │       │             │ file_name             │
        │       │             │ file_size             │
        │       │             │ mime_type             │
        │       │             └──────────────────────┘
        │       │
        │       │  ┌──────────────────────────────┐
        │       │  │   reactions                   │
        │       │  ├──────────────────────────────┤
        ├──────►│  │ message_id (PK, FK)          │
        │       └─►│ user_id (PK, FK)             │
        │          │ emoji (PK)                    │
        │          │ created_at                    │
        │          └──────────────────────────────┘
        │
        │   ┌────────────────────────┐
        │   │   refresh_tokens       │
        │   ├────────────────────────┤
        ├──►│ user_id (FK)           │
        │   │ id (PK, uuid)          │
        │   │ token_hash (unique)    │
        │   │ expires_at             │
        │   │ created_at             │
        │   └────────────────────────┘
        │
        │   ┌────────────────────────────────┐
        │   │   notifications                │
        │   ├────────────────────────────────┤
        └──►│ user_id (FK)                   │
            │ id (PK, uuid)                  │
            │ workspace_id (FK)              │
            │ type (enum)                    │
            │ title                           │
            │ body                            │
            │ action_url                      │
            │ is_read                         │
            │ created_at                      │
            └────────────────────────────────┘
```

### Key indexes

| Table           | Index                            | Type      | Purpose                         |
| --------------- | -------------------------------- | --------- | ------------------------------- |
| `messages`      | `messages_content_search_idx`    | GIN       | Full-text search via `tsvector` |
| `messages`      | `messages_created_at_idx`        | B-tree    | Cursor-based pagination         |
| `channels`      | `channels_workspace_dm_idx`      | Composite | Filter DMs per workspace        |
| `notifications` | `notifications_user_created_idx` | Composite | List by user, sorted by date    |
| `reactions`     | `reactions_message_id_idx`       | B-tree    | Fetch reactions for a message   |

### Enums

| Enum name               | Values                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| `workspace_member_role` | `owner`, `admin`, `member`                                                     |
| `notification_type`     | `channel_invited`, `channel_removed`, `workspace_invited`, `workspace_removed` |

---

## Realtime Event Flow

Socket.IO manages two types of rooms:

- **`channel:{channelId}`** — scoped to a single channel for message and typing events
- **`workspace:{workspaceId}`** — scoped to a workspace for presence events

### Message Flow

```
┌──────────┐        ┌──────────────┐        ┌──────────────┐
│  Sender  │  POST  │   REST API   │  emit  │  Socket.IO   │
│ (Client) │───────►│ /messages    │───────►│  Server      │
└──────────┘        └──────────────┘        └──────┬───────┘
                                                    │
                    ┌───────────────────────────────┘
                    │  broadcast to room channel:{id}
                    │  event: "message:new"
                    ▼
            ┌──────────────┐
            │  All clients  │ → Update React Query cache directly
            │  in channel   │   (no refetch needed)
            └──────────────┘
```

1. Sender makes a REST `POST /api/channels/:channelId/messages` call
2. The sender's UI performs an optimistic insert into the React Query cache with a temp ID
3. The service layer persists the message, then broadcasts `message:new` via Socket.IO
4. All other clients in the channel room receive the event and insert into their cache
5. The sender replaces their optimistic message with the server response (or rolls back on error)

### Typing Indicator Flow

```
Client A                    Socket.IO Server              Client B
   │                              │                           │
   │──typing:start {channelId}──►│                           │
   │                              │──typing:start {userId}──►│
   │                              │                           │
   │  (3s debounce)               │                           │
   │                              │                           │
   │──typing:stop {channelId}───►│                           │
   │                              │──typing:stop {userId}───►│
```

Typing events are pure Socket.IO relay (no REST, no persistence). The frontend debounces typing start events (500ms) and auto-stops after 3 seconds of inactivity.

### Presence Flow

```
Client                     Socket.IO Server                Redis
  │                              │                           │
  │──workspace:join {id}────────►│                           │
  │                              │──SET presence:user:{uid}─►│
  │                              │  (TTL: 70s, status: online)
  │                              │                           │
  │                              │──broadcast presence:update─►  Other clients
  │                              │  {userId, status: 'online'}   in workspace
  │                              │
  │  (every 60s)                 │
  │──presence:heartbeat────────►│                           │
  │                              │──EXPIRE refresh TTL──────►│
  │                              │
  │  (disconnect)                │
  │──────X                       │──DEL key─────────────────►│
  │                              │──broadcast {status: 'offline'}
```

Redis keys follow the pattern `presence:user:{userId}` with a 70-second TTL. The client sends heartbeats every 60 seconds to keep the key alive. If the client disconnects without sending a `workspace:leave`, the disconnect handler cleans up the Redis key and broadcasts an offline status.

---

## Auth Flow

### Registration

```
Client                          Server                       Database
  │                                │                            │
  │  POST /api/auth/register       │                            │
  │  {email, username,             │                            │
  │   displayName, password}       │                            │
  │───────────────────────────────►│                            │
  │                                │  Check email uniqueness    │
  │                                │───────────────────────────►│
  │                                │  Hash password (bcrypt 12) │
  │                                │  Insert user               │
  │                                │───────────────────────────►│
  │                                │  Generate JWT (15min exp)  │
  │                                │  Generate refresh token    │
  │                                │  (64-byte random, SHA-256  │
  │                                │   hash stored in DB)       │
  │                                │───────────────────────────►│
  │  201 {user, accessToken}       │                            │
  │  + Set-Cookie: refreshToken    │                            │
  │  (httpOnly, secure, 7d)        │                            │
  │◄───────────────────────────────│                            │
```

### Login

```
Client                          Server                       Database
  │                                │                            │
  │  POST /api/auth/login          │                            │
  │  {email, password}             │                            │
  │───────────────────────────────►│                            │
  │                                │  Find user by email        │
  │                                │───────────────────────────►│
  │                                │  Verify password (bcrypt)  │
  │                                │  Generate token pair       │
  │                                │───────────────────────────►│
  │  200 {user, accessToken}       │                            │
  │  + Set-Cookie: refreshToken    │                            │
  │◄───────────────────────────────│                            │
```

### Token Refresh (Rotation)

```
Client                          Server                       Database
  │                                │                            │
  │  POST /api/auth/refresh        │                            │
  │  Cookie: refreshToken=<raw>    │                            │
  │───────────────────────────────►│                            │
  │                                │  SHA-256 hash the raw token│
  │                                │  Look up hash in DB        │
  │                                │───────────────────────────►│
  │                                │  Verify not expired        │
  │                                │  DELETE old refresh token  │
  │                                │───────────────────────────►│
  │                                │  Generate new token pair   │
  │                                │  Store new refresh hash    │
  │                                │───────────────────────────►│
  │  200 {user, accessToken}       │                            │
  │  + Set-Cookie: refreshToken    │                            │
  │  (new token, old one invalid)  │                            │
  │◄───────────────────────────────│                            │
```

Each refresh token is **single-use**. After a refresh, the old token is deleted and a new one is issued. This prevents replay attacks — if an attacker steals a refresh token, the legitimate user's next refresh will invalidate the stolen token.

### Frontend Token Lifecycle

```
1. Login/Register → Store access token in memory (not localStorage)
2. Every API call → Attach via Authorization: Bearer header
3. 401 response → Axios interceptor queues failed requests,
                   calls POST /auth/refresh (uses httpOnly cookie),
                   retries queued requests with new token
4. Refresh fails → Clear all state, redirect to /login
```

---

## Key Design Decisions

### DMs as channels

Direct messages are modeled as regular channels with `is_direct_message = true`. This avoids duplicating the entire message/membership infrastructure. A composite index `(workspace_id, is_direct_message)` keeps DM queries fast.

### Full-text search via PostgreSQL

Instead of adding Elasticsearch, message search uses PostgreSQL's built-in `tsvector` with a GIN index. This simplifies the infrastructure while providing good-enough search for the expected scale.

### Cursor-based pagination

All list endpoints use cursor-based pagination (last item ID + limit) instead of offset-based. This prevents issues with shifting offsets when new items are inserted and performs consistently regardless of page depth.

### Redis for presence only

Redis is used exclusively for real-time presence tracking (not for caching or sessions). This keeps the caching story simple — TanStack Query handles all client-side caching, and PostgreSQL handles all persistent data.

### Optimistic updates

Message sending uses a full optimistic update pattern: insert a temporary message immediately, replace it with the server response on success, or roll back on failure. This makes the UI feel instant regardless of network latency.

### Supabase for file storage

File uploads use a two-step presign/confirm flow through Supabase Storage (S3-compatible). The client uploads directly to Supabase using a presigned URL, then confirms the upload with the backend. This keeps large file bodies off the API server.

### Socket.IO room strategy

Two room types separate concerns: `channel:{id}` for message/typing events and `workspace:{id}` for presence. Message CRUD happens through REST endpoints (which emit socket events server-side). Only typing and presence use direct client-to-server socket relay.

### Access token in memory

Access tokens are stored in a JavaScript variable (not localStorage or cookies) to minimize XSS exposure. Refresh tokens use httpOnly secure cookies, which are inaccessible to JavaScript.

### No barrel files

The codebase avoids `index.ts` barrel files to keep imports explicit and improve tree-shaking. Each file has one primary export, and imports reference the file directly.

### Message ownership enforced at the service layer

Edit and delete operations verify `message.userId === requestingUserId` inside `message.service.ts` before reaching the repository. The check is not in the controller (HTTP concern) or the repository (data concern) — it is business logic and lives in the service. This means the same check applies whether the operation is triggered via REST or any future interface.

The service throws `AppError('FORBIDDEN', ..., 403)` on ownership failure, which the global error handler converts to the standard `{ error: { code, message } }` response shape.

### In-app media viewer — zero dependencies

Images and PDFs open in a full-screen overlay instead of a new browser tab. The viewer is built without third-party viewer libraries:

- **Images** — CSS `transform: scale() translate()` with cursor-centered zoom math. A non-passive `wheel` event listener (required by modern browsers to call `preventDefault`) is attached directly to the DOM via `useEffect`. Zoom and pan state is managed with `useReducer` to keep all transitions in a single pure reducer with no side effects.
- **PDFs** — Native browser `<iframe>` pointing at the Supabase Storage URL. Supported in all modern browsers; leverages the built-in PDF engine (Chrome PDFium, Firefox, Safari). Zero client-side processing.
- **Gallery** — Each message's previewable attachments (images + PDFs) form a gallery. The active item index and item list live in a Zustand store (`useMediaViewerStore`) — ephemeral UI state, never server state.
- **Architecture** — The viewer mounts once in `WorkspaceLayout` as a portal to `document.body` at `z-[300]` (above all modals). Any component can open it by calling `useMediaViewerStore((s) => s.open)` — no prop drilling required.

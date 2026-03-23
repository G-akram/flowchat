# API Reference

Complete reference for all REST endpoints and Socket.IO events in the FlowChat API.

Base URL: `http://localhost:4000/api`

---

## Response Format

All responses follow a consistent shape.

**Success:**

```json
{ "data": { ... } }
```

**Paginated Success:**

```json
{ "data": [...], "nextCursor": "uuid-or-null" }
```

**Error:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "optionalFieldName"
  }
}
```

### Error Codes

| Code                  | HTTP Status | Description                                     |
| --------------------- | ----------- | ----------------------------------------------- |
| `VALIDATION_ERROR`    | 400         | Request body/params/query failed Zod validation |
| `UNAUTHORIZED`        | 401         | Missing or invalid authentication               |
| `INVALID_CREDENTIALS` | 401         | Wrong email or password                         |
| `TOKEN_EXPIRED`       | 401         | JWT or refresh token has expired                |
| `TOKEN_INVALID`       | 401         | Malformed token                                 |
| `FORBIDDEN`           | 403         | Authenticated but not authorized                |
| `NOT_FOUND`           | 404         | Resource does not exist                         |
| `CONFLICT`            | 409         | Resource already exists                         |
| `EMAIL_TAKEN`         | 409         | Email address already registered                |
| `ALREADY_A_MEMBER`    | 409         | User is already a member                        |
| `NOT_A_MEMBER`        | 403         | User is not a member of the resource            |
| `CANNOT_LEAVE`        | 403         | Cannot leave (e.g., workspace owner)            |
| `CANNOT_DELETE`       | 403         | Cannot delete (e.g., insufficient role)         |
| `RATE_LIMITED`        | 429         | Too many requests                               |
| `FILE_TOO_LARGE`      | 400         | Upload exceeds 2 MB limit                       |
| `INVALID_FILE_TYPE`   | 400         | Unsupported MIME type                           |
| `UPLOAD_FAILED`       | 500         | File upload to storage failed                   |
| `INTERNAL_ERROR`      | 500         | Unexpected server error                         |

---

## Authentication

Most endpoints require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <access-token>
```

Endpoints marked with **Auth: No** do not require authentication. Rate-limited auth endpoints (login, register) allow 100 requests per minute per IP. All other endpoints allow 300 requests per minute per IP.

---

## REST Endpoints

### Health

| Method | Path          | Auth | Description                            |
| ------ | ------------- | ---- | -------------------------------------- |
| GET    | `/api/health` | No   | Health check (DB + Redis connectivity) |

**Response:**

```json
{
  "data": {
    "status": "ok",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "dbConnected": true,
    "redisConnected": true
  }
}
```

---

### Auth

#### POST `/api/auth/register`

Register a new user account.

- **Auth:** No
- **Rate Limit:** 100/min

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "displayName": "John Doe",
  "password": "securepassword123"
}
```

**Response (201):**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatarUrl": null,
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbG..."
  }
}
```

Sets `refreshToken` httpOnly cookie (7-day expiry).

---

#### POST `/api/auth/login`

Authenticate an existing user.

- **Auth:** No
- **Rate Limit:** 100/min

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):** Same shape as register.

---

#### POST `/api/auth/refresh`

Exchange a refresh token for a new token pair (rotation).

- **Auth:** No (uses httpOnly cookie)

**Request:** No body. The `refreshToken` cookie is read automatically.

**Response (200):** Same shape as register.

Sets a new `refreshToken` cookie. The old refresh token is invalidated.

---

#### POST `/api/auth/logout`

Invalidate the current refresh token and clear the cookie.

- **Auth:** No

**Response (204):** No body.

---

#### GET `/api/auth/me`

Get the currently authenticated user.

- **Auth:** Yes

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": null,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Workspaces

All workspace endpoints require authentication.

#### POST `/api/workspaces`

Create a new workspace. The creator becomes the owner.

**Request Body:**

```json
{
  "name": "My Team",
  "slug": "my-team"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "uuid",
    "name": "My Team",
    "slug": "my-team",
    "ownerId": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### GET `/api/workspaces`

List all workspaces the user is a member of.

**Response (200):**

```json
{
  "data": [
    { "id": "uuid", "name": "My Team", "slug": "my-team", "ownerId": "uuid", "createdAt": "..." }
  ]
}
```

---

#### GET `/api/workspaces/:workspaceId`

Get a single workspace by ID.

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "name": "My Team",
    "slug": "my-team",
    "ownerId": "uuid",
    "createdAt": "..."
  }
}
```

---

#### PATCH `/api/workspaces/:workspaceId`

Update workspace name or slug.

**Request Body:**

```json
{ "name": "Renamed Team", "slug": "renamed-team" }
```

**Response (200):** Updated workspace object.

---

#### DELETE `/api/workspaces/:workspaceId`

Delete a workspace. Only the owner can delete.

**Response (204):** No body.

---

#### POST `/api/workspaces/:workspaceId/leave`

Leave a workspace. The owner cannot leave.

**Response (204):** No body.

---

#### GET `/api/workspaces/:workspaceId/members`

List all members of a workspace.

**Response (200):**

```json
{
  "data": [
    {
      "userId": "uuid",
      "role": "owner",
      "joinedAt": "2025-01-01T00:00:00.000Z",
      "user": { "id": "uuid", "displayName": "John Doe", "username": "johndoe", "avatarUrl": null }
    }
  ]
}
```

---

#### POST `/api/workspaces/:workspaceId/members`

Invite a user to the workspace by email.

**Request Body:**

```json
{ "email": "newuser@example.com" }
```

**Response (201):** Member object.

---

#### DELETE `/api/workspaces/:workspaceId/members/:userId`

Remove a member from the workspace.

**Response (204):** No body.

---

### Channels

All channel endpoints require authentication. Channels are nested under workspaces.

#### POST `/api/workspaces/:workspaceId/channels`

Create a new channel.

**Request Body:**

```json
{
  "name": "general",
  "description": "General discussion",
  "isPrivate": false
}
```

**Response (201):** Channel object.

---

#### GET `/api/workspaces/:workspaceId/channels`

List all channels in a workspace that the user can see.

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "workspaceId": "uuid",
      "name": "general",
      "description": "General discussion",
      "isPrivate": false,
      "isDirectMessage": false,
      "createdById": "uuid",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/workspaces/:workspaceId/channels/:channelId`

Get a single channel.

**Response (200):** Channel object.

---

#### PATCH `/api/workspaces/:workspaceId/channels/:channelId`

Update a channel's name or description.

**Request Body:**

```json
{ "name": "engineering", "description": "Engineering team chat" }
```

**Response (200):** Updated channel object.

---

#### DELETE `/api/workspaces/:workspaceId/channels/:channelId`

Delete a channel.

**Response (204):** No body.

---

#### POST `/api/workspaces/:workspaceId/channels/:channelId/join`

Join a public channel.

**Response (200):** Channel member object.

---

#### POST `/api/workspaces/:workspaceId/channels/:channelId/leave`

Leave a channel.

**Response (204):** No body.

---

#### GET `/api/workspaces/:workspaceId/channels/:channelId/members`

List channel members.

**Response (200):**

```json
{
  "data": [
    {
      "userId": "uuid",
      "joinedAt": "2025-01-01T00:00:00.000Z",
      "user": { "id": "uuid", "displayName": "John Doe", "username": "johndoe", "avatarUrl": null }
    }
  ]
}
```

---

#### POST `/api/workspaces/:workspaceId/channels/:channelId/members`

Add a member to a channel.

**Request Body:**

```json
{ "userId": "uuid" }
```

**Response (201):** Channel member object.

---

#### DELETE `/api/workspaces/:workspaceId/channels/:channelId/members/:userId`

Remove a member from a channel.

**Response (204):** No body.

---

### Messages

All message endpoints require authentication. Messages are nested under channels.

#### GET `/api/channels/:channelId/messages`

List messages in a channel (cursor-based pagination, newest first).

**Query Parameters:**

| Param    | Type   | Default | Description                  |
| -------- | ------ | ------- | ---------------------------- |
| `cursor` | string | —       | Message ID to paginate after |
| `limit`  | number | 50      | Messages per page (max 100)  |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "channelId": "uuid",
      "userId": "uuid",
      "content": "Hello world!",
      "editedAt": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "user": { "id": "uuid", "displayName": "John Doe", "username": "johndoe", "avatarUrl": null },
      "attachments": [],
      "reactions": []
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

---

#### POST `/api/channels/:channelId/messages`

Send a message to a channel.

**Request Body:**

```json
{
  "content": "Hello world!",
  "attachments": [
    { "url": "https://...", "fileName": "photo.png", "fileSize": 102400, "mimeType": "image/png" }
  ]
}
```

`attachments` is optional.

**Response (201):** Message object with user, attachments, and reactions.

---

#### PATCH `/api/channels/:channelId/messages/:messageId`

Edit a message. **Only the message author can edit their own messages.**

**Request Body:**

```json
{ "content": "Updated message text" }
```

| Field     | Type   | Rules                       |
| --------- | ------ | --------------------------- |
| `content` | string | 1–4000 characters, required |

**Response (200):** Full updated message object (same shape as `GET` response), with `editedAt` set to the current timestamp.

**Error responses:**

| Code        | Status | When                                          |
| ----------- | ------ | --------------------------------------------- |
| `FORBIDDEN` | 403    | Authenticated user is not the message author  |
| `NOT_FOUND` | 404    | Message or channel does not exist             |

**Side effect:** Broadcasts `message:updated` to the `channel:{channelId}` Socket.IO room so all connected clients update their cache without refetching.

---

#### DELETE `/api/channels/:channelId/messages/:messageId`

Delete a message. **Only the message author can delete their own messages.**

**Response (204):** No body.

**Error responses:**

| Code        | Status | When                                          |
| ----------- | ------ | --------------------------------------------- |
| `FORBIDDEN` | 403    | Authenticated user is not the message author  |
| `NOT_FOUND` | 404    | Message or channel does not exist             |

**Side effect:** Broadcasts `message:deleted` to the `channel:{channelId}` Socket.IO room so all connected clients immediately remove the message from their cache.

---

### Reactions

All reaction endpoints require authentication.

#### POST `/api/messages/:messageId/reactions`

Add a reaction to a message.

**Request Body:**

```json
{ "emoji": "thumbsup" }
```

**Response (201):** Reaction object.

---

#### DELETE `/api/messages/:messageId/reactions/:emoji`

Remove your reaction from a message.

**Response (204):** No body.

---

### Direct Messages

All DM endpoints require authentication. DMs are nested under workspaces.

#### POST `/api/workspaces/:workspaceId/dms`

Open a DM conversation with another user. Creates a DM channel if one doesn't exist.

**Request Body:**

```json
{ "userId": "uuid" }
```

**Response (200 or 201):** DM channel object.

---

#### GET `/api/workspaces/:workspaceId/dms`

List all DM conversations in a workspace.

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "workspaceId": "uuid",
      "isDirectMessage": true,
      "otherUser": {
        "id": "uuid",
        "displayName": "Jane Smith",
        "username": "janesmith",
        "avatarUrl": null
      },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Search

#### GET `/api/workspaces/:workspaceId/search`

Full-text search across workspace messages using PostgreSQL `tsvector`.

**Query Parameters:**

| Param   | Type   | Default | Description             |
| ------- | ------ | ------- | ----------------------- |
| `q`     | string | —       | Search query (required) |
| `limit` | number | 20      | Max results             |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "content": "matching message...",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "user": { "id": "uuid", "displayName": "John Doe" },
      "channel": { "id": "uuid", "name": "general", "isDirectMessage": false }
    }
  ]
}
```

---

### Users

All user endpoints require authentication.

#### GET `/api/users/me`

Get the current user's profile.

**Response (200):** User object.

---

#### PATCH `/api/users/me`

Update the current user's profile.

**Request Body:**

```json
{ "displayName": "New Name", "avatarUrl": "https://..." }
```

**Response (200):** Updated user object.

---

#### GET `/api/users/:userId`

Get another user's profile.

**Response (200):** User object.

---

### Presence

#### GET `/api/workspaces/:workspaceId/presence`

Get the presence status of all workspace members. Returns data from Redis.

- **Auth:** Yes

**Response (200):**

```json
{
  "data": [
    { "userId": "uuid", "status": "online" },
    { "userId": "uuid", "status": "away" }
  ]
}
```

Users not in the response are offline.

---

### Uploads

All upload endpoints require authentication.

#### POST `/api/uploads/presign`

Request a presigned URL for uploading a file to Supabase Storage.

**Request Body:**

```json
{
  "fileName": "photo.png",
  "fileSize": 102400,
  "mimeType": "image/png"
}
```

Constraints: max 2 MB, allowed types: `image/*`, `application/pdf`, `text/*`.

**Response (200):**

```json
{
  "data": {
    "uploadUrl": "https://...",
    "fileUrl": "https://...",
    "filePath": "uploads/uuid/photo.png"
  }
}
```

---

#### POST `/api/uploads/confirm`

Confirm that a file upload completed successfully.

**Request Body:**

```json
{
  "filePath": "uploads/uuid/photo.png",
  "fileName": "photo.png",
  "fileSize": 102400,
  "mimeType": "image/png"
}
```

**Response (200):**

```json
{ "data": { "url": "https://..." } }
```

---

### Notifications

All notification endpoints require authentication.

#### GET `/api/notifications`

List all notifications for the current user.

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "workspaceId": "uuid",
      "type": "channel_invited",
      "title": "You were added to #general",
      "body": null,
      "actionUrl": "/app/workspace-id/channel-id",
      "isRead": false,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### PATCH `/api/notifications/:notificationId/read`

Mark a single notification as read.

**Response (200):** Updated notification object.

---

#### POST `/api/notifications/read-all`

Mark all notifications as read.

**Response (204):** No body.

---

#### DELETE `/api/notifications/:notificationId`

Delete a single notification.

**Response (204):** No body.

---

#### DELETE `/api/notifications/all`

Delete all notifications.

**Response (204):** No body.

---

## Socket.IO Events

The Socket.IO server runs on the same port as the HTTP server (default: 4000).

### Connection

Connect with an access token in the auth handshake:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: '<access-token>' },
  withCredentials: true,
});
```

The server verifies the JWT and attaches `userId` to the socket session.

---

### Client → Server Events

These events are sent from the client to the server.

#### `channel:join`

Join a channel room to receive messages and typing events.

```typescript
socket.emit('channel:join', channelId: string);
```

---

#### `channel:leave`

Leave a channel room.

```typescript
socket.emit('channel:leave', channelId: string);
```

---

#### `typing:start`

Notify that the user started typing.

```typescript
socket.emit('typing:start', { channelId: string, displayName?: string });
```

---

#### `typing:stop`

Notify that the user stopped typing.

```typescript
socket.emit('typing:stop', { channelId: string, displayName?: string });
```

---

#### `workspace:join`

Join a workspace room for presence updates. Sets user status to online.

```typescript
socket.emit('workspace:join', workspaceId: string);
```

---

#### `workspace:leave`

Leave a workspace room.

```typescript
socket.emit('workspace:leave', workspaceId: string);
```

---

#### `presence:heartbeat`

Keep presence alive (send every 60 seconds).

```typescript
socket.emit('presence:heartbeat', { status?: 'online' | 'away' });
```

---

### Server → Client Events

These events are broadcast from the server to connected clients.

#### `message:new`

A new message was created in a channel.

```typescript
{
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  }
  attachments: Array<{
    id: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  reactions: Array<{ emoji: string; userId: string }>;
}
```

**Room:** `channel:{channelId}`

---

#### `message:updated`

A message was edited.

```typescript
{
  id: string;
  channelId: string;
  content: string;
  editedAt: string;
}
```

**Room:** `channel:{channelId}`

---

#### `message:deleted`

A message was deleted.

```typescript
{
  id: string;
  channelId: string;
}
```

**Room:** `channel:{channelId}`

---

#### `typing:start`

A user started typing in a channel.

```typescript
{
  channelId: string;
  userId: string;
  displayName: string;
}
```

**Room:** `channel:{channelId}` (excluding the sender)

---

#### `typing:stop`

A user stopped typing in a channel.

```typescript
{
  channelId: string;
  userId: string;
  displayName: string;
}
```

**Room:** `channel:{channelId}` (excluding the sender)

---

#### `presence:update`

A user's presence status changed.

```typescript
{
  userId: string;
  status: 'online' | 'away' | 'offline';
}
```

**Room:** `workspace:{workspaceId}`

---

#### `workspace:member:added`

A new member was added to the workspace.

**Room:** `workspace:{workspaceId}`

---

#### `workspace:member:removed`

A member was removed from the workspace.

**Room:** `workspace:{workspaceId}`

---

#### `channel:member:added`

A member was added to a channel.

**Room:** `channel:{channelId}`

---

#### `channel:member:removed`

A member was removed from a channel.

**Room:** `channel:{channelId}`

---

#### `channel:updated`

A channel was updated (name, description, etc.).

**Room:** `workspace:{workspaceId}`

---

#### `channel:deleted`

A channel was deleted.

**Room:** `workspace:{workspaceId}`

---

#### `notification:new`

A new notification was created for the user. Sent directly to the user's socket(s), not to a room.

```typescript
{
  id: string;
  userId: string;
  workspaceId: string;
  type: 'channel_invited' | 'channel_removed' | 'workspace_invited' | 'workspace_removed';
  title: string;
  body: string | null;
  actionUrl: string | null;
  isRead: false;
  createdAt: string;
}
```

**Delivery:** Direct emit to all sockets belonging to the target user.

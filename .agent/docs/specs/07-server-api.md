# Server API and WebSocket Specification

## 1. Overview

The Server API provides a RESTful interface for Kanban operations and a WebSocket interface for real-time synchronization between clients.

## 2. REST API

All JSON endpoints reside at the root `/` (no versioning currently).

### 2.1 Boards

#### `GET /boards`

- **Result**: `Board[]` (metadata only)

#### `POST /boards`

- **Body**: `Partial<Board>` (at minimum `title`)
- **Result**: Full `Board` object with default columns.

### 2.2 Cards

#### `GET /boards/:boardId/cards`

- **Result**: `Card[]` for the specified board.

#### `POST /boards/:boardId/cards`

- **Body**: `Partial<Card>` (at minimum `title`, `status`)
- **Result**: Full `Card` object including `boardId`.

#### `PUT /cards/:cardId`

- **Body**: `Partial<Card>`
- **Result**: Updated `Card` object.
- **Constraints**: `id` and `createdAt` are immutable. `updatedAt` is server-set.

#### `DELETE /cards/:cardId`

- **Result**: `204 No Content`

#### `PATCH /cards/:cardId/move`

- **Body**: `{ toStatus: ColumnId, toPosition: number }`
- **Result**: Updated `Card` object with new status and position.

## 3. WebSocket API

### 3.1 Connection

Connect to `/ws`.

### 3.2 Outbound Events (Server -> Client)

The server broadcasts the following JSON objects during mutations:

#### `card_created`

Payload: Full `Card` object.

#### `card_updated`

Payload: Full `Card` object.

#### `card_deleted`

Payload: `{ id: CardId }`

#### `card_moved`

Payload:

```json
{
  "id": "card-1",
  "boardId": "board-1",
  "fromStatus": "todo",
  "toStatus": "in_progress",
  "fromPosition": 0,
  "toPosition": 1
}
```

## 4. Validation

Input validation is performed using **Zod** schemas in `@lofi-pm/core`.

- **Restricted Fields**: `boardId` in body is ignored in `PUT` requests to prevent accidental board transfer.
- **Error Handling**: `400 Bad Request` on validation failure, `500 Internal Server Error` on persistence failure.

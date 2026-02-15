# ADR 0005: Server Architecture and Real-time Synchronization

## Status

Accepted

## Context

The Server needs to provide both a stable persistence layer and a way to push updates to multiple connected clients (CLI, MCP, Web) in real-time.

## Decision

Implement the Server using:

- **Fastify**: For a high-performance, plugin-based REST API.
- **Repository Pattern**: To decouple route handlers from SQL implementation details.
- **WebSocket EventBus**: A singleton service that manages client connections and broadcasts mutation events (`card_created`, etc.) across the application.

## Consequences

### Positive

- **Zero-Latency Feel**: Clients receive updates immediately when another client makes a change.
- **Testability**: Fastify's `inject` allows for robust integration testing of routes and WS logic.

### Negative

- WebSocket state is ephemeral and tied to the specific server instance.
- Requires careful handling of connection lifecycle to prevent resource leaks.

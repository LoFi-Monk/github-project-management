import type { WebSocket } from 'ws';

/**
 * Simple event bus for broadcasting messages to connected WebSocket clients.
 *
 * Intent: Decouples route logic from WebSocket connection management.
 */
export class EventBus {
  private clients: Set<WebSocket> = new Set();

  /**
   * Register a new WebSocket client.
   */
  addClient(ws: WebSocket) {
    this.clients.add(ws);
    ws.on('close', () => this.clients.delete(ws));
  }

  /**
   * Broadcast an event to all connected clients.
   *
   * @param type - The event type (e.g., 'card_created')
   * @param payload - The data associated with the event
   */
  broadcast(type: string, payload: unknown) {
    const message = JSON.stringify({ type, payload });
    for (const client of this.clients) {
      if (client.readyState === 1) {
        // OPEN
        client.send(message);
      }
    }
  }

  /**
   * Clears all client connections from the event bus and terminates their WebSocket connections.
   * This ensures that no stale connections persist between tests or during server shutdown.
   */
  clear() {
    for (const client of this.clients) {
      client.terminate();
    }
    this.clients.clear();
  }
}

/**
 * Singleton instance of the EventBus.
 *
 * Intent: Shared event bus for the entire application to broadcast WebSocket messages.
 */
export const eventBus = new EventBus();

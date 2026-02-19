import { Board, type BoardId } from '@lofi-pm/core';

const API_BASE = 'http://localhost:3000';

/**
 * Intent: Provide a central HTTP client for the board resources.
 *
 * Guarantees:
 * - Fetches a full board aggregate by ID from the server.
 * - Validates the response against the {@link Board} schema.
 * - Throws an error on non-OK responses or validation failure.
 *
 * @param id - The ID of the board to fetch.
 * @returns A promise resolving to a validated {@link Board} object.
 * @throws {Error} If the fetch fails or data is invalid.
 */
export async function getBoard(id: BoardId): Promise<Board> {
  const response = await fetch(`${API_BASE}/boards/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Board not found');
    }
    throw new Error(`Failed to fetch board: ${response.statusText}`);
  }

  const data = await response.json();
  return Board.parse(data);
}

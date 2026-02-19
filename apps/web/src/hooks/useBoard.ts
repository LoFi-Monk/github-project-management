import type { Board, BoardId } from '@lofi-pm/core';
import { useEffect, useState } from 'react';
import { getBoard } from '../lib/api';

/**
 * Result object returned by the {@link useBoard} hook.
 */
interface UseBoardResult {
  /** The board data, or null if loading or failed. */
  board: Board | null;
  /** Whether the data is currently being fetched. */
  loading: boolean;
  /** Error message if the fetch failed, or null. */
  error: string | null;
}

/**
 * Intent: Provide a reactive way to fetch and manage the state of a specific board.
 *
 * Guarantees:
 * - Automatically fetches board data on mount and whenever the ID changes.
 * - Exposes loading state while the request is in flight.
 * - Provides a clear error message on failure.
 *
 * @param id - The ID of the board to fetch.
 * @returns An object containing the board data, loading state, and error message.
 */
export function useBoard(id: BoardId): UseBoardResult {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setBoard(null);

    getBoard(id)
      .then((data) => {
        if (isMounted) {
          setBoard(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { board, loading, error };
}

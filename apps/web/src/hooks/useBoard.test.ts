import type { Board } from '@lofi-pm/core';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as api from '../lib/api';
import { useBoard } from './useBoard';

vi.mock('../lib/api');

describe('useBoard Hook', () => {
  const mockBoard: Board = {
    id: 'board-1' as any,
    title: 'Test Board',
    columns: {},
    cards: {},
  };

  it('returns loading state initially', () => {
    vi.mocked(api.getBoard).mockReturnValue(new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useBoard('board-1' as any));

    expect(result.current.loading).toBe(true);
    expect(result.current.board).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns board data on success', async () => {
    vi.mocked(api.getBoard).mockResolvedValue(mockBoard);
    const { result } = renderHook(() => useBoard('board-1' as any));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.board).toEqual(mockBoard);
    expect(result.current.error).toBeNull();
  });

  it('returns error on failure', async () => {
    vi.mocked(api.getBoard).mockRejectedValue(new Error('Fetch failed'));
    const { result } = renderHook(() => useBoard('board-1' as any));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.board).toBeNull();
    expect(result.current.error).toBe('Fetch failed');
  });

  it('resets board to null when ID changes', async () => {
    vi.mocked(api.getBoard).mockResolvedValue(mockBoard);

    const { result, rerender } = renderHook(({ id }) => useBoard(id), {
      initialProps: { id: 'board-1' as any },
    });

    // Wait for first load
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.board).toEqual(mockBoard);

    // Change ID
    vi.mocked(api.getBoard).mockReturnValue(new Promise(() => {})); // Hang second fetch
    rerender({ id: 'board-2' as any });

    // Verify state is reset even though fetch is pending
    expect(result.current.loading).toBe(true);
    expect(result.current.board).toBeNull(); // This is the bug: it currently stays mockBoard
  });
});

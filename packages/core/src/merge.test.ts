import { describe, expect, it } from 'vitest';
import { mergeCards } from './merge';
import type { Card, CardId, ColumnId } from './schema';

describe('mergeCards', () => {
  // Helper to create valid cards
  const createCard = (overrides: Partial<Card> = {}): Card => ({
    id: 'c1' as CardId,
    title: 'Test Card',
    status: 'todo' as ColumnId,
    priority: 'medium',
    labels: [],
    assignees: [],
    position: 0,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    ...overrides,
  });

  it('should return remote card when local is clean and remote is changed', () => {
    const local = createCard({ title: 'Original' });
    const remote = createCard({ title: 'Remote Update' });
    // Local has no dirty fields, so it's clean.

    const result = mergeCards(local, remote);
    expect(result.title).toBe('Remote Update');
  });

  it('should return local card when local is dirty and remote is unchanged', () => {
    const snapshot = { title: 'Original' };
    const local = createCard({
      title: 'Local Update',
      dirtyFields: ['title'],
      syncSnapshot: snapshot,
    });
    const remote = createCard({ title: 'Original', syncSnapshot: snapshot });

    const result = mergeCards(local, remote);
    expect(result.title).toBe('Local Update');
  });

  it('should mark conflict when both are changed', () => {
    const snapshot = { title: 'Original' };
    const local = createCard({ title: 'Local', dirtyFields: ['title'], syncSnapshot: snapshot });
    const remote = createCard({ title: 'Remote', syncSnapshot: snapshot });

    const result = mergeCards(local, remote);

    // Expect conflict
    expect(result.syncStatus).toBe('conflict');
    // For now, let's assume it keeps local value but marks conflict.
    expect(result.title).toBe('Local');
  });

  it('should merge non-conflicting changes', () => {
    const snapshot = { title: 'Original', status: 'todo' };
    // Local changed title
    const local = createCard({
      title: 'Local Title',
      status: 'todo' as ColumnId,
      dirtyFields: ['title'],
      syncSnapshot: snapshot,
    });
    // Remote changed status
    const remote = createCard({
      title: 'Original',
      status: 'done' as ColumnId,
      syncSnapshot: snapshot,
    });

    const result = mergeCards(local, remote);

    expect(result.title).toBe('Local Title');
    expect(result.status).toBe('done'); // Remote change accepted since local didn't touch it
    expect(result.syncStatus).not.toBe('conflict'); // No conflict
  });

  it('should handle array field changes correctly', () => {
    const local = createCard({ labels: ['a', 'b'] });
    const remote = createCard({ labels: ['a', 'c'] });
    // Local clean (no dirtyFields), remote changed -> accept remote
    const result = mergeCards(local, remote);
    expect(result.labels).toEqual(['a', 'c']);
  });

  it('should detect conflict in array fields', () => {
    const snapshot = { labels: ['a'] };
    const local = createCard({
      labels: ['a', 'b'],
      dirtyFields: ['labels'],
      syncSnapshot: snapshot,
    });
    const remote = createCard({ labels: ['a', 'c'], syncSnapshot: snapshot });

    const result = mergeCards(local, remote);

    expect(result.syncStatus).toBe('conflict');
  });

  it('should handle array length mismatch', () => {
    const local = createCard({ labels: ['a', 'b'] });
    const remote = createCard({ labels: ['a'] });
    const result = mergeCards(local, remote);
    expect(result.labels).toEqual(['a']);
  });
});

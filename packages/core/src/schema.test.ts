import { describe, expect, it } from 'vitest';
import { Board, Card } from './schema';

describe('Schema Validation', () => {
  it('should validate a correct Card', () => {
    const card = {
      id: 'c1',
      title: 'Test',
      status: 'todo',
      priority: 'medium',
      labels: ['bug'],
      assignees: ['user1'],
      position: 1,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };
    const result = Card.safeParse(card);
    expect(result.success).toBe(true);
  });

  it('should fail on missing fields', () => {
    const card = {
      id: 'c1',
      // Missing title
      status: 'todo',
    };
    const result = Card.safeParse(card);
    expect(result.success).toBe(false);
  });

  it('should validate Board structure', () => {
    const board = {
      id: 'b1',
      title: 'Main Board',
      columns: {
        todo: { id: 'todo', title: 'To Do', cards: ['c1'] },
      },
      cards: {
        c1: {
          id: 'c1',
          title: 'Task 1',
          status: 'todo',
          priority: 'low',
          labels: [],
          assignees: [],
          position: 0,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      },
    };
    // We need to cast strict types for the test object to match Zod expectations if we pass raw JS
    // or just use safeParse.
    const result = Board.safeParse(board);
    if (!result.success) console.log(result.error);
    expect(result.success).toBe(true);
  });
});

import type { Board } from '@lofi-pm/core';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BoardLayout } from './BoardLayout';

describe('BoardLayout', () => {
  const mockBoard: Board = {
    id: 'board-1' as any,
    title: 'Project Board',
    columns: {
      todo: { id: 'todo' as any, title: 'To Do', cards: ['card-1' as any] },
      in_progress: { id: 'in_progress' as any, title: 'In Progress', cards: ['card-2' as any] },
    } as any,
    cards: {
      'card-1': {
        id: 'card-1' as any,
        title: 'Card 1',
        status: 'todo',
        priority: 'low',
        labels: [],
        assignees: [],
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'card-2': {
        id: 'card-2' as any,
        title: 'Card 2',
        status: 'in_progress',
        priority: 'high',
        labels: [],
        assignees: [],
        position: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as any,
  };

  it('renders all columns from the board data', () => {
    render(<BoardLayout board={mockBoard} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('distributes cards to the correct columns', () => {
    render(<BoardLayout board={mockBoard} />);

    // Find "To Do" column and check for its card
    const todoColumn = screen
      .getAllByTestId('column')
      .find((col) => within(col).queryByText('To Do'));
    expect(todoColumn).toBeDefined();
    expect(within(todoColumn!).getByText('Card 1')).toBeInTheDocument();

    // Find "In Progress" column and check for its card
    const inProgressColumn = screen
      .getAllByTestId('column')
      .find((col) => within(col).queryByText('In Progress'));
    expect(inProgressColumn).toBeDefined();
    expect(within(inProgressColumn!).getByText('Card 2')).toBeInTheDocument();
  });
});

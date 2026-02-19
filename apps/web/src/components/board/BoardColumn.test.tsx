import type { Card, Column } from '@lofi-pm/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BoardColumn } from './BoardColumn';

describe('BoardColumn', () => {
  const mockColumn: Column = {
    id: 'todo' as any,
    title: 'To Do',
    cards: ['card-1' as any, 'card-2' as any],
  };

  const mockCards: Card[] = [
    {
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
    {
      id: 'card-2' as any,
      title: 'Card 2',
      status: 'todo',
      priority: 'high',
      labels: [],
      assignees: [],
      position: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('renders column title and card count', () => {
    render(<BoardColumn column={mockColumn} cards={mockCards} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders the list of cards', () => {
    render(<BoardColumn column={mockColumn} cards={mockCards} />);
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('renders empty state when no cards are provided', () => {
    const emptyColumn = { ...mockColumn, cards: [] };
    render(<BoardColumn column={emptyColumn} cards={[]} />);
    expect(screen.getByText('No cards yet')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

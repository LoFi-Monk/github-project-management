import type { Card, CardId } from '@lofi-pm/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BoardCard } from './BoardCard';

describe('BoardCard', () => {
  const mockCard: Card = {
    id: 'card-1' as CardId,
    title: 'Test Card',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    labels: ['bug', 'ui'],
    assignees: ['lofim'],
    position: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders card title', () => {
    render(<BoardCard card={mockCard} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<BoardCard card={mockCard} />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders labels', () => {
    render(<BoardCard card={mockCard} />);
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('ui')).toBeInTheDocument();
  });
});

import type { Board } from '@lofi-pm/core';
import { BoardColumn } from './BoardColumn';

/**
 * Props for the {@link BoardLayout} component.
 */
interface BoardLayoutProps {
  /** The full board aggregate to display. */
  board: Board;
}

/**
 * Intent: The top-level container for a Kanban board, arranging columns in a horizontal grid.
 *
 * Guarantees:
 * - Dynamically renders all columns present in the board data.
 * - Correctly distributes card entities to their respective columns.
 * - Provides horizontal overflow scrolling for many columns.
 *
 * @param props - Component properties including the board data.
 * @returns A React board layout element.
 */
export function BoardLayout({ board }: BoardLayoutProps) {
  // Sort columns to ensure consistent order (backlog -> todo -> in_progress -> review -> done)
  const columnOrder = ['backlog', 'todo', 'in_progress', 'review', 'done'];
  const sortedColumns = Object.values(board.columns).sort((a, b) => {
    return columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id);
  });

  return (
    <div className="flex h-screen w-full bg-background overflow-x-auto p-4 gap-4 select-none">
      {sortedColumns.map((column) => {
        // Map the card IDs in the column to the actual card objects in the board
        const columnCards = column.cards.map((cardId) => board.cards[cardId]).filter(Boolean); // Safety filter

        return <BoardColumn key={column.id} column={column} cards={columnCards} />;
      })}
    </div>
  );
}

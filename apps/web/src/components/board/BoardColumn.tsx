import type { Card, Column } from '@lofi-pm/core';
import { Badge } from '@/components/ui/badge';
import { BoardCard } from './BoardCard';

/**
 * Props for the {@link BoardColumn} component.
 */
interface BoardColumnProps {
  /** The column metadata. */
  column: Column;
  /** The list of cards currently active in this column. */
  cards: Card[];
}

/**
 * Intent: Render a single Kanban column containing a list of cards.
 *
 * Guarantees:
 * - Displays the column title and total card count in the header.
 * - Renders a scrollable list of {@link BoardCard} components.
 * - Shows an empty state message if no cards are present.
 *
 * @param props - Component properties including column and card data.
 * @returns A React board column element.
 */
export function BoardColumn({ column, cards }: BoardColumnProps) {
  const hasCards = cards.length > 0;

  return (
    <div
      data-testid="column"
      className="flex flex-col w-80 bg-secondary/30 rounded-lg p-2 max-h-full"
    >
      <div className="flex items-center justify-between p-2 mb-2">
        <h3 className="font-semibold text-sm truncate">{column.title}</h3>
        <Badge variant="secondary" className="text-xs font-normal bg-secondary">
          {cards.length}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 custom-scrollbar p-1">
        {hasCards ? (
          cards.map((card) => <BoardCard key={card.id} card={card} />)
        ) : (
          <div className="flex items-center justify-center py-10 border-2 border-dashed border-secondary rounded-lg">
            <p className="text-xs text-muted-foreground">No cards yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

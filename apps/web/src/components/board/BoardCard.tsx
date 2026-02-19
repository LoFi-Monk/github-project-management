import type { Card } from '@lofi-pm/core';
import { Badge } from '@/components/ui/badge';
import { Card as CardContainer, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Props for the {@link BoardCard} component.
 */
interface BoardCardProps {
  /** The card data to display. */
  card: Card;
}

/**
 * Intent: Display task information in a scannable format within a Kanban column.
 *
 * Guarantees:
 * - Renders the card title and description.
 * - Displays priority and status badges.
 * - Lists all associated labels.
 *
 * @param props - Component properties including the card data.
 * @returns A React card element.
 */
export function BoardCard({ card }: BoardCardProps) {
  return (
    <CardContainer className="mb-2 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight">{card.title}</CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase px-1 py-0">
            {card.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        {card.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{card.description}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <Badge key={label} variant="secondary" className="text-[10px] px-1 py-0">
              {label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </CardContainer>
  );
}

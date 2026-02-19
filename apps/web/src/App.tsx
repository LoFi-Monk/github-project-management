import type { BoardId } from '@lofi-pm/core';
import { BoardLayout } from './components/board';
import { useBoard } from './hooks/useBoard';

/**
 * Intent: The main application entry point that orchestrates the board view.
 *
 * Guarantees:
 * - Fetches initial board data using {@link useBoard}.
 * - Displays a loading spinner or skeleton while fetching.
 * - Shows an error message if the fetch fails.
 * - Renders the {@link BoardLayout} upon successful data retrieval.
 */
function App() {
  // For this milestone, we'll fetch a board with a known ID.
  // In a real app, this might come from a route parameter or dashboard.
  const { board, loading, error } = useBoard('board-1' as BoardId);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading board...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-destructive">Error Loading Board</h2>
        <p className="text-muted-foreground">{error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  return <BoardLayout board={board} />;
}

export default App;

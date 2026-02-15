import { useState } from 'react';
import { Button } from '@/components/ui/button';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-bold text-4xl">Vite + React + shadcn/ui</h1>
      <div className="card">
        <Button onClick={() => setCount((count) => count + 1)}>count is {count}</Button>
      </div>
      <p className="text-muted-foreground">Local-first Kanban project scaffolded!</p>
    </div>
  );
}

export default App;

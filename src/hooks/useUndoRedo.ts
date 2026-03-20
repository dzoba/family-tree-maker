import { useState, useCallback } from 'react';

interface Action {
  type: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  description: string;
}

export function useUndoRedo() {
  const [past, setPast] = useState<Action[]>([]);
  const [future, setFuture] = useState<Action[]>([]);

  const pushAction = useCallback((action: Action) => {
    setPast((prev) => [...prev.slice(-49), action]); // Keep last 50
    setFuture([]); // Clear redo stack
  }, []);

  const undo = useCallback(async () => {
    const action = past[past.length - 1];
    if (!action) return;
    await action.undo();
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [...prev, action]);
  }, [past]);

  const redo = useCallback(async () => {
    const action = future[future.length - 1];
    if (!action) return;
    await action.redo();
    setFuture((prev) => prev.slice(0, -1));
    setPast((prev) => [...prev, action]);
  }, [future]);

  return {
    pushAction,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    lastAction: past[past.length - 1]?.description,
  };
}

import { useReducer, useCallback } from "react";

const createInitialState = (initialPresent) => ({
  past: [],
  present:
    typeof initialPresent === "function" ? initialPresent() : initialPresent,
  future: [],
  lastAction: null,
});

const historyReducer = (state, action) => {
  const { past, present, future } = state;
  const maxHistory = action.maxHistory || 50;

  switch (action.type) {
    case "UNDO": {
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
        lastAction: {
          type: "undo",
          cardCount: Array.isArray(previous) ? previous.length : 0,
          timestamp: Date.now(),
        },
      };
    }

    case "REDO": {
      if (future.length === 0) return state;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present].slice(-maxHistory),
        present: next,
        future: newFuture,
        lastAction: {
          type: "redo",
          cardCount: Array.isArray(next) ? next.length : 0,
          timestamp: Date.now(),
        },
      };
    }

    case "SET": {
      const nextPresent =
        typeof action.payload === "function"
          ? action.payload(present)
          : action.payload;

      // Avoid creating history if there's no actual change
      if (nextPresent === present) return state;
      if (
        Array.isArray(present) &&
        Array.isArray(nextPresent) &&
        present.length === nextPresent.length &&
        present.every((val, idx) => val === nextPresent[idx])
      ) {
        return state;
      }

      return {
        past: [...past, present].slice(-maxHistory),
        present: nextPresent,
        future: [],
        lastAction: { type: "set", timestamp: Date.now() },
      };
    }

    case "RESET": {
      return createInitialState(action.payload);
    }

    default:
      return state;
  }
};

export function useHistoryState(initialPresent, maxHistory = 50) {
  const [state, dispatch] = useReducer(
    historyReducer,
    initialPresent,
    createInitialState
  );

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const setState = useCallback(
    (newPresentOrFn) => {
      dispatch({ type: "SET", payload: newPresentOrFn, maxHistory });
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    dispatch({ type: "UNDO", maxHistory });
  }, [maxHistory]);

  const redo = useCallback(() => {
    dispatch({ type: "REDO", maxHistory });
  }, [maxHistory]);

  return {
    state: state.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount: state.past.length,
    futureCount: state.future.length,
    lastAction: state.lastAction,
  };
}


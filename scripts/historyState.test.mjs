import assert from "node:assert/strict";

// Test the historyReducer logic directly
const createInitialState = (initialPresent) => ({
  past: [],
  present: typeof initialPresent === "function" ? initialPresent() : initialPresent,
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

    default:
      return state;
  }
};

// 1. Initial State
let state = createInitialState(["card1", "card2"]);
assert.deepEqual(state.present, ["card1", "card2"]);
assert.equal(state.past.length, 0);

// 2. Action: Delete card2
state = historyReducer(state, {
  type: "SET",
  payload: (prev) => prev.filter((c) => c !== "card2"),
});
assert.deepEqual(state.present, ["card1"]);
assert.equal(state.past.length, 1);
assert.deepEqual(state.past[0], ["card1", "card2"]);

// 3. Exactly 1 Click UNDO
state = historyReducer(state, { type: "UNDO" });
assert.deepEqual(state.present, ["card1", "card2"]);
assert.equal(state.past.length, 0);
assert.equal(state.future.length, 1);
assert.deepEqual(state.future[0], ["card1"]);

// 4. Exactly 1 Click REDO
state = historyReducer(state, { type: "REDO" });
assert.deepEqual(state.present, ["card1"]);
assert.equal(state.past.length, 1);
assert.equal(state.future.length, 0);

console.log("historyState test passed successfully!");

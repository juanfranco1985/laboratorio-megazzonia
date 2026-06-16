import { createInitialState, normalizeState } from "../state.mjs";

export class SaveSystem {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return createInitialState();
      return normalizeState(JSON.parse(raw));
    } catch (_error) {
      return createInitialState();
    }
  }

  save(state) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (_error) {
      // Ignore storage failures.
    }
  }
}

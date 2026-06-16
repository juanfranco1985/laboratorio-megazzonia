import { DEFAULT_SETTINGS, DEFAULT_STATS, STORAGE_KEYS } from "../utils/constants.js";

export class Storage {
  constructor(namespace = "sudoku-procedural", nativeBridge = null) {
    this.namespace = namespace;
    this.nativeBridge = nativeBridge;
    this.memory = new Map();
    this.available = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const probeKey = `${this.namespace}:probe`;
      globalThis.localStorage.setItem(probeKey, "1");
      globalThis.localStorage.removeItem(probeKey);
      return true;
    } catch (_error) {
      return false;
    }
  }

  buildKey(key) {
    return `${this.namespace}:${key}`;
  }

  readLocalItem(fullKey) {
    if (!this.available) {
      return undefined;
    }

    try {
      const raw = globalThis.localStorage.getItem(fullKey);
      if (raw === null) {
        return undefined;
      }
      const value = JSON.parse(raw);
      this.memory.set(fullKey, value);
      return value;
    } catch (_error) {
      return undefined;
    }
  }

  writeLocalItem(fullKey, value) {
    if (!this.available) {
      return false;
    }

    try {
      globalThis.localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (_error) {
      return false;
    }
  }

  removeLocalItem(fullKey) {
    if (!this.available) {
      return false;
    }

    try {
      globalThis.localStorage.removeItem(fullKey);
      return true;
    } catch (_error) {
      return false;
    }
  }

  readNativeItem(fullKey) {
    if (!this.nativeBridge?.isAvailable()) {
      return undefined;
    }

    try {
      const raw = this.nativeBridge.storageGetItem(fullKey);
      if (typeof raw !== "string" || raw.length === 0) {
        return undefined;
      }
      const value = JSON.parse(raw);
      this.memory.set(fullKey, value);

      if (this.available) {
        this.writeLocalItem(fullKey, value);
      }

      return value;
    } catch (_error) {
      return undefined;
    }
  }

  writeNativeItem(fullKey, value) {
    if (!this.nativeBridge?.isAvailable()) {
      return false;
    }

    try {
      return this.nativeBridge.storageSetItem(fullKey, JSON.stringify(value));
    } catch (_error) {
      return false;
    }
  }

  removeNativeItem(fullKey) {
    if (!this.nativeBridge?.isAvailable()) {
      return false;
    }

    try {
      return this.nativeBridge.storageRemoveItem(fullKey);
    } catch (_error) {
      return false;
    }
  }

  getItem(key, fallbackValue = null) {
    const fullKey = this.buildKey(key);

    const localValue = this.readLocalItem(fullKey);
    if (localValue !== undefined) {
      return localValue;
    }

    const nativeValue = this.readNativeItem(fullKey);
    if (nativeValue !== undefined) {
      return nativeValue;
    }

    return this.memory.has(fullKey) ? this.memory.get(fullKey) : fallbackValue;
  }

  setItem(key, value) {
    const fullKey = this.buildKey(key);
    this.memory.set(fullKey, value);
    this.writeLocalItem(fullKey, value);
    this.writeNativeItem(fullKey, value);
  }

  removeItem(key) {
    const fullKey = this.buildKey(key);
    this.memory.delete(fullKey);
    this.removeLocalItem(fullKey);
    this.removeNativeItem(fullKey);
  }

  loadSettings() {
    return {
      ...DEFAULT_SETTINGS,
      ...this.getItem(STORAGE_KEYS.settings, {}),
    };
  }

  saveSettings(settings) {
    this.setItem(STORAGE_KEYS.settings, settings);
  }

  loadStats() {
    const stored = this.getItem(STORAGE_KEYS.stats, {});
    return {
      ...DEFAULT_STATS,
      ...stored,
      bestTimes: {
        ...DEFAULT_STATS.bestTimes,
        ...(stored.bestTimes || {}),
      },
    };
  }

  saveStats(stats) {
    this.setItem(STORAGE_KEYS.stats, stats);
  }

  loadGame() {
    return this.getItem(STORAGE_KEYS.game, null);
  }

  saveGame(game) {
    this.setItem(STORAGE_KEYS.game, game);
  }

  clearGame() {
    this.removeItem(STORAGE_KEYS.game);
  }

  loadAnalyticsQueue() {
    const queue = this.getItem(STORAGE_KEYS.analytics, []);
    return Array.isArray(queue) ? queue : [];
  }

  saveAnalyticsQueue(queue) {
    this.setItem(STORAGE_KEYS.analytics, Array.isArray(queue) ? queue : []);
  }
}

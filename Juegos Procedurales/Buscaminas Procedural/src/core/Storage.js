import { STORAGE_KEYS } from "../utils/constants.js";
import { safeParseJSON } from "../utils/helpers.js";
import { hydrateGameState, serializeGameState } from "./GameState.js";
import { createDefaultSettings, sanitizeSettings } from "./Settings.js";
import { createEmptyStats, sanitizeStats } from "./StatsTracker.js";

function readStorage(key) {
  try {
    return safeParseJSON(localStorage.getItem(key), null);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return false;
  }

  return true;
}

export class StorageManager {
  loadSettings() {
    return sanitizeSettings(readStorage(STORAGE_KEYS.settings) ?? createDefaultSettings());
  }

  saveSettings(settings) {
    return writeStorage(STORAGE_KEYS.settings, settings);
  }

  loadStats() {
    return sanitizeStats(readStorage(STORAGE_KEYS.stats) ?? createEmptyStats());
  }

  saveStats(stats) {
    return writeStorage(STORAGE_KEYS.stats, stats);
  }

  loadSession() {
    const rawSession = readStorage(STORAGE_KEYS.session);
    return rawSession ? hydrateGameState(rawSession) : null;
  }

  saveSession(state) {
    return writeStorage(STORAGE_KEYS.session, serializeGameState(state));
  }

  clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.session);
    } catch {
      return false;
    }

    return true;
  }
}

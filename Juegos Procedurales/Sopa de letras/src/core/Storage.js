import { STORAGE_KEYS } from '../utils/constants.js';

export class Storage {
  loadSettings() {
    return this.readJson(STORAGE_KEYS.settings, null) ?? {};
  }

  saveSettings(settings) {
    this.writeJson(STORAGE_KEYS.settings, settings);
  }

  loadGame() {
    return this.readJson(STORAGE_KEYS.currentGame, null);
  }

  saveGame(snapshot) {
    this.writeJson(STORAGE_KEYS.currentGame, snapshot);
  }

  clearGame() {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.currentGame);
    } catch (error) {
      console.warn('No se pudo limpiar la partida guardada.', error);
    }
  }

  loadStats() {
    return this.readJson(STORAGE_KEYS.stats, null) ?? {};
  }

  saveStats(stats) {
    this.writeJson(STORAGE_KEYS.stats, stats);
  }

  readJson(key, fallbackValue) {
    try {
      const rawValue = window.localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallbackValue;
    } catch (error) {
      console.warn(`No se pudo leer ${key}.`, error);
      return fallbackValue;
    }
  }

  writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`No se pudo guardar ${key}.`, error);
    }
  }
}

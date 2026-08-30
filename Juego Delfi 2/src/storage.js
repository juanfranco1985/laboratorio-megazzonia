import { SAVE_KEY, freshSave, normalizeSave } from "./game-data.js";
export function readSave() {
  try { return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))); }
  catch { return freshSave(); }
}
export function writeSave(value) { localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(value))); }
export function clearSave() { localStorage.removeItem(SAVE_KEY); }
export function hasSave() { return Boolean(localStorage.getItem(SAVE_KEY)); }

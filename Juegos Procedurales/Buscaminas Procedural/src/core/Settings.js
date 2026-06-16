import {
  ACTION_MODES,
  DEFAULT_CUSTOM_CONFIG,
  SEED_INPUT_MAX_LENGTH,
  THEMES,
} from "../utils/constants.js";
import { normalizeCustomConfig, sanitizeDifficultyId } from "./Validator.js";

function sanitizeSeedInput(value) {
  return String(value ?? "").trim().slice(0, SEED_INPUT_MAX_LENGTH);
}

export function createDefaultSettings() {
  return {
    difficulty: "easy",
    theme: THEMES.auto,
    actionMode: ACTION_MODES.reveal,
    zenMode: false,
    seedInput: "",
    custom: { ...DEFAULT_CUSTOM_CONFIG },
  };
}

export function sanitizeSettings(rawSettings = {}) {
  const defaults = createDefaultSettings();
  const theme = Object.values(THEMES).includes(rawSettings.theme)
    ? rawSettings.theme
    : defaults.theme;
  const actionMode = Object.values(ACTION_MODES).includes(rawSettings.actionMode)
    ? rawSettings.actionMode
    : defaults.actionMode;

  return {
    difficulty: sanitizeDifficultyId(rawSettings.difficulty ?? defaults.difficulty),
    theme,
    actionMode,
    zenMode: Boolean(rawSettings.zenMode),
    seedInput: sanitizeSeedInput(rawSettings.seedInput ?? defaults.seedInput),
    custom: normalizeCustomConfig(rawSettings.custom ?? DEFAULT_CUSTOM_CONFIG),
  };
}

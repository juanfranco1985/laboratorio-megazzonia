import {
  CUSTOM_LIMITS,
  DEFAULT_CUSTOM_CONFIG,
  DIFFICULTY_ORDER,
  DIFFICULTY_PRESETS,
} from "../utils/constants.js";
import { clamp, coerceInteger, computeMaxMines } from "../utils/helpers.js";

export function sanitizeDifficultyId(value) {
  return DIFFICULTY_ORDER.includes(value) ? value : "easy";
}

export function normalizeCustomConfig(rawConfig = DEFAULT_CUSTOM_CONFIG) {
  const rows = clamp(
    coerceInteger(rawConfig.rows, DEFAULT_CUSTOM_CONFIG.rows),
    CUSTOM_LIMITS.minRows,
    CUSTOM_LIMITS.maxRows,
  );
  const cols = clamp(
    coerceInteger(rawConfig.cols, DEFAULT_CUSTOM_CONFIG.cols),
    CUSTOM_LIMITS.minCols,
    CUSTOM_LIMITS.maxCols,
  );
  const mines = clamp(
    coerceInteger(rawConfig.mines, DEFAULT_CUSTOM_CONFIG.mines),
    CUSTOM_LIMITS.minMines,
    computeMaxMines(rows, cols),
  );

  return { rows, cols, mines };
}

export function validateCustomConfig(rawConfig = DEFAULT_CUSTOM_CONFIG) {
  const normalized = normalizeCustomConfig(rawConfig);
  const maxMines = computeMaxMines(normalized.rows, normalized.cols);
  const issues = [];

  if (coerceInteger(rawConfig.rows, normalized.rows) !== normalized.rows) {
    issues.push(`Filas ajustadas a ${normalized.rows}.`);
  }

  if (coerceInteger(rawConfig.cols, normalized.cols) !== normalized.cols) {
    issues.push(`Columnas ajustadas a ${normalized.cols}.`);
  }

  if (coerceInteger(rawConfig.mines, normalized.mines) !== normalized.mines) {
    issues.push(`Minas ajustadas a ${normalized.mines}.`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    maxMines,
    normalized,
  };
}

export function resolveDifficultyConfig(difficultyId, customConfig) {
  const normalizedDifficulty = sanitizeDifficultyId(difficultyId);

  if (normalizedDifficulty === "custom") {
    const normalized = normalizeCustomConfig(customConfig);
    return {
      id: "custom",
      label: DIFFICULTY_PRESETS.custom.label,
      ...normalized,
      isCustom: true,
    };
  }

  return {
    ...DIFFICULTY_PRESETS[normalizedDifficulty],
    isCustom: false,
  };
}

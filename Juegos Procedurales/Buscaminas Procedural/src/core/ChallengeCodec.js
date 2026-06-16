import { CHALLENGE_CODE_PREFIX } from "../utils/constants.js";
import { normalizeCustomConfig, sanitizeDifficultyId } from "./Validator.js";

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeSeedInput(value) {
  return String(value ?? "").trim();
}

export function parseChallengeCode(value) {
  const normalized = normalizeSeedInput(value);

  if (!normalized.startsWith(`${CHALLENGE_CODE_PREFIX}|`)) {
    return null;
  }

  const parts = normalized.split("|");

  if (parts.length < 9) {
    return null;
  }

  const difficultyId = sanitizeDifficultyId(parts[1]);
  const rows = Number.parseInt(parts[2], 10);
  const cols = Number.parseInt(parts[3], 10);
  const mines = Number.parseInt(parts[4], 10);
  const zenMode = parts[5] === "1";
  const seed = safeDecode(parts[6]);
  const openingRow = Number.parseInt(parts[7], 10);
  const openingCol = Number.parseInt(parts[8], 10);

  if (!seed || !Number.isFinite(rows) || !Number.isFinite(cols) || !Number.isFinite(mines)) {
    return null;
  }

  if (!Number.isFinite(openingRow) || !Number.isFinite(openingCol)) {
    return null;
  }

  return {
    difficultyId,
    customConfig: normalizeCustomConfig({ rows, cols, mines }),
    zenMode,
    seed,
    openingCell: { row: openingRow, col: openingCol },
  };
}

export function buildChallengeCode(state) {
  if (!state?.generated || !state.seed || !state.openingCell) {
    return "";
  }

  const seed = encodeURIComponent(state.seed);

  return [
    CHALLENGE_CODE_PREFIX,
    state.config.id,
    state.rows,
    state.cols,
    state.mines,
    state.config.zenMode ? "1" : "0",
    seed,
    state.openingCell.row,
    state.openingCell.col,
  ].join("|");
}

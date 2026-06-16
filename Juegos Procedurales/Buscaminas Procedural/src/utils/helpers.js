import {
  CUSTOM_LIMITS,
  DIFFICULTY_PRESETS,
  GAME_STATUS,
} from "./constants.js";

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function coerceInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeParseJSON(source, fallback = null) {
  try {
    return source ? JSON.parse(source) : fallback;
  } catch {
    return fallback;
  }
}

export function formatTime(elapsedMs) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatPercent(numerator, denominator) {
  if (!denominator) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function getNeighborCoords(row, col, rows, cols) {
  const neighbors = [];

  for (let nextRow = row - 1; nextRow <= row + 1; nextRow += 1) {
    for (let nextCol = col - 1; nextCol <= col + 1; nextCol += 1) {
      const isCurrentCell = nextRow === row && nextCol === col;
      const isInsideBoard =
        nextRow >= 0 &&
        nextRow < rows &&
        nextCol >= 0 &&
        nextCol < cols;

      if (!isCurrentCell && isInsideBoard) {
        neighbors.push([nextRow, nextCol]);
      }
    }
  }

  return neighbors;
}

export function computeMaxMines(rows, cols) {
  return Math.max(1, rows * cols - 9);
}

export function describeDifficulty(config) {
  return `${config.rows}x${config.cols} - ${config.mines} minas`;
}

export function truncateMiddle(value, maxLength = 28) {
  const source = String(value ?? "");

  if (source.length <= maxLength) {
    return source;
  }

  const sideLength = Math.max(4, Math.floor((maxLength - 3) / 2));
  return `${source.slice(0, sideLength)}...${source.slice(-sideLength)}`;
}

export function getDifficultyLabel(difficultyId) {
  return DIFFICULTY_PRESETS[difficultyId]?.label ?? DIFFICULTY_PRESETS.easy.label;
}

export function getSessionStateLabel(state) {
  if (!state) {
    return "Sin partida";
  }

  if (state.isPaused) {
    return "Pausada";
  }

  if (state.status === GAME_STATUS.ready) {
    return "Listo";
  }

  if (state.status === GAME_STATUS.playing) {
    return "Jugando";
  }

  if (state.status === GAME_STATUS.won) {
    return "Victoria";
  }

  return "Derrota";
}

export function isSessionInProgress(state) {
  return Boolean(
    state &&
      (state.status === GAME_STATUS.ready || state.status === GAME_STATUS.playing),
  );
}

export function buildCustomHint(customConfig) {
  const maxMines = computeMaxMines(customConfig.rows, customConfig.cols);
  return `Rango seguro: ${CUSTOM_LIMITS.minRows}-${CUSTOM_LIMITS.maxRows} filas, ${CUSTOM_LIMITS.minCols}-${CUSTOM_LIMITS.maxCols} columnas, hasta ${maxMines} minas.`;
}

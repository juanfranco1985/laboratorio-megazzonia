import { BOARD_SIZE, BOX_SIZE, CELL_COUNT } from "./constants.js";

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function rowColToIndex(row, col) {
  return row * BOARD_SIZE + col;
}

export function indexToRowCol(index) {
  return {
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE,
  };
}

export function getBoxIndex(index) {
  const { row, col } = indexToRowCol(index);
  return Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
}

export function createEmptyBoard() {
  return Array(CELL_COUNT).fill(0);
}

export function copyBoard(board) {
  return board.slice();
}

export function countFilledCells(board) {
  return board.reduce((total, value) => total + (value !== 0 ? 1 : 0), 0);
}

export function findFirstEmptyCell(board) {
  return board.findIndex((value) => value === 0);
}

export function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function setBit(mask, digit) {
  return mask | (1 << (digit - 1));
}

export function clearBit(mask, digit) {
  return mask & ~(1 << (digit - 1));
}

export function hasBit(mask, digit) {
  return (mask & (1 << (digit - 1))) !== 0;
}

export function toggleBit(mask, digit) {
  return mask ^ (1 << (digit - 1));
}

export function countBits(mask) {
  let count = 0;
  let working = mask;
  while (working) {
    working &= working - 1;
    count += 1;
  }
  return count;
}

export function bitmaskToValues(mask) {
  const values = [];
  for (let digit = 1; digit <= BOARD_SIZE; digit += 1) {
    if (hasBit(mask, digit)) {
      values.push(digit);
    }
  }
  return values;
}

export function valuesToBitmask(values) {
  return values.reduce((mask, value) => setBit(mask, value), 0);
}

export function coerceNumberArray(input, length, fillValue = 0) {
  if (!Array.isArray(input)) {
    return Array(length).fill(fillValue);
  }

  return Array.from({ length }, (_, index) => {
    const value = Number(input[index]);
    return Number.isFinite(value) ? value : fillValue;
  });
}

export function wait(milliseconds) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateKey(dateKey, locale = "es-AR") {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  if (!year || !month || !day) {
    return String(dateKey);
  }

  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function tryVibrate(pattern) {
  if (!globalThis.navigator || typeof globalThis.navigator.vibrate !== "function") {
    return;
  }

  try {
    globalThis.navigator.vibrate(pattern);
  } catch (_error) {
    // Intentionally ignored.
  }
}

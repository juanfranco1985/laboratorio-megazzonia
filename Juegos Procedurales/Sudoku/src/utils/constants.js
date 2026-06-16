export const APP_NAME = "Sudoku Procedural";
export const APP_VERSION = "1.0.0";

export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const DIGITS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);

export const STORAGE_KEYS = Object.freeze({
  settings: "settings",
  stats: "stats",
  game: "current-game",
  analytics: "analytics-queue",
});

export const DIFFICULTY_ORDER = Object.freeze(["easy", "medium", "hard", "expert"]);

export const DIFFICULTY_CONFIG = Object.freeze({
  easy: {
    id: "easy",
    label: "Facil",
    targetClues: [40, 45],
    scoreRange: [0, 320],
    maxGuesses: 0,
    maxDepth: 0,
    minAdvancedMoves: 0,
  },
  medium: {
    id: "medium",
    label: "Media",
    targetClues: [34, 39],
    scoreRange: [180, 420],
    maxGuesses: 1,
    maxDepth: 1,
    minAdvancedMoves: 0,
  },
  hard: {
    id: "hard",
    label: "Dificil",
    targetClues: [29, 33],
    scoreRange: [340, 620],
    maxGuesses: 2,
    maxDepth: 2,
    minAdvancedMoves: 1,
  },
  expert: {
    id: "expert",
    label: "Experto",
    targetClues: [24, 28],
    scoreRange: [520, 9999],
    maxGuesses: 8,
    maxDepth: 6,
    minAdvancedMoves: 2,
  },
});

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "system",
  showErrors: true,
  haptics: true,
  focusMode: false,
});

export const DEFAULT_STATS = Object.freeze({
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalHintsUsed: 0,
  rewardedHintsUsed: 0,
  dailyWins: 0,
  lastDailyWinKey: null,
  totalPlayTimeMs: 0,
  bestTimes: {
    easy: null,
    medium: null,
    hard: null,
    expert: null,
  },
  lastCompletedDifficulty: null,
});

export const THEME_SEQUENCE = Object.freeze(["system", "dark", "light"]);
export const DAILY_DIFFICULTY_ROTATION = Object.freeze(["easy", "medium", "hard", "expert"]);
export const MAX_HISTORY_STEPS = 120;
export const ANALYTICS_QUEUE_LIMIT = 80;

function buildUnits() {
  const rows = [];
  const columns = [];
  const boxes = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const rowUnit = [];
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      rowUnit.push(row * BOARD_SIZE + col);
    }
    rows.push(rowUnit);
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const columnUnit = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      columnUnit.push(row * BOARD_SIZE + col);
    }
    columns.push(columnUnit);
  }

  for (let boxRow = 0; boxRow < BOX_SIZE; boxRow += 1) {
    for (let boxCol = 0; boxCol < BOX_SIZE; boxCol += 1) {
      const boxUnit = [];
      for (let row = 0; row < BOX_SIZE; row += 1) {
        for (let col = 0; col < BOX_SIZE; col += 1) {
          const realRow = boxRow * BOX_SIZE + row;
          const realCol = boxCol * BOX_SIZE + col;
          boxUnit.push(realRow * BOARD_SIZE + realCol);
        }
      }
      boxes.push(boxUnit);
    }
  }

  return { rows, columns, boxes };
}

const UNITS = buildUnits();

export const ROW_UNITS = Object.freeze(UNITS.rows);
export const COLUMN_UNITS = Object.freeze(UNITS.columns);
export const BOX_UNITS = Object.freeze(UNITS.boxes);
export const ALL_UNITS = Object.freeze([...ROW_UNITS, ...COLUMN_UNITS, ...BOX_UNITS]);

export const CELL_TO_UNITS = Object.freeze(
  Array.from({ length: CELL_COUNT }, (_, index) => {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const box = Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
    return [ROW_UNITS[row], COLUMN_UNITS[col], BOX_UNITS[box]];
  })
);

export const CELL_PEERS = Object.freeze(
  Array.from({ length: CELL_COUNT }, (_, index) => {
    const peers = new Set();
    for (const unit of CELL_TO_UNITS[index]) {
      for (const cellIndex of unit) {
        if (cellIndex !== index) {
          peers.add(cellIndex);
        }
      }
    }
    return Object.freeze([...peers]);
  })
);

export const GENERATION_ATTEMPTS = 14;

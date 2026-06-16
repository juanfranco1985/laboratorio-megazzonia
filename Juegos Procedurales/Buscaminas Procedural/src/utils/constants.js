export const APP_VERSION = "1.1.0";

export const DIFFICULTY_PRESETS = {
  easy: { id: "easy", label: "Facil", rows: 9, cols: 9, mines: 10 },
  medium: { id: "medium", label: "Medio", rows: 12, cols: 16, mines: 30 },
  hard: { id: "hard", label: "Dificil", rows: 16, cols: 18, mines: 55 },
  custom: { id: "custom", label: "Personalizado", rows: 12, cols: 12, mines: 20 },
};

export const DIFFICULTY_ORDER = ["easy", "medium", "hard", "custom"];

export const DEFAULT_CUSTOM_CONFIG = {
  rows: DIFFICULTY_PRESETS.custom.rows,
  cols: DIFFICULTY_PRESETS.custom.cols,
  mines: DIFFICULTY_PRESETS.custom.mines,
};

export const CUSTOM_LIMITS = {
  minRows: 8,
  maxRows: 24,
  minCols: 8,
  maxCols: 24,
  minMines: 8,
};

export const STORAGE_KEYS = {
  settings: "bp.settings",
  stats: "bp.stats",
  session: "bp.session",
};

export const CHALLENGE_CODE_PREFIX = "bp1";
export const SEED_INPUT_MAX_LENGTH = 200;

export const ACTION_MODES = {
  reveal: "reveal",
  flag: "flag",
};

export const ACTION_MODE_OPTIONS = [
  { id: ACTION_MODES.reveal, label: "Revelar" },
  { id: ACTION_MODES.flag, label: "Bandera" },
];

export const THEMES = {
  auto: "auto",
  light: "light",
  dark: "dark",
};

export const THEME_OPTIONS = [
  { id: THEMES.auto, label: "Auto" },
  { id: THEMES.light, label: "Claro" },
  { id: THEMES.dark, label: "Oscuro" },
];

export const GAME_STATUS = {
  ready: "ready",
  playing: "playing",
  won: "won",
  lost: "lost",
};

export const LONG_PRESS_MS = 360;
export const TIMER_TICK_MS = 250;
export const SAVE_THROTTLE_MS = 1000;

export const VIBRATION_PATTERNS = {
  flag: [12],
  zenMine: [18, 32, 18],
  win: [24, 60, 24],
  lose: [48, 56, 48],
};

export const APP_NAME = 'Sopa Infinita';

export const STORAGE_KEYS = {
  settings: 'sopa-infinita.settings',
  currentGame: 'sopa-infinita.current-game',
  stats: 'sopa-infinita.stats',
};

export const THEMES = ['light'];
export const PLAY_MODES = ['classic', 'daily'];
export const TIMER_MODES = ['timed', 'zen'];
export const PLAY_MODE_OPTIONS = [
  { id: 'classic', label: 'Clasica', hint: 'Libre' },
  { id: 'daily', label: 'Diaria', hint: 'Hoy' },
];
export const TIMER_MODE_OPTIONS = [
  { id: 'timed', label: 'Crono', hint: 'Tiempo' },
  { id: 'zen', label: 'Zen', hint: 'Sin reloj' },
];

export const LETTER_BAG = 'AAAAAAEEEEEEIIIIOOOOOUUUBCDFGHLMNPRRSTT';
export const PACK_MANIFEST_URL = './packs/manifest.json';
export const MAX_EXTERNAL_PACK_SOURCES = 8;
export const REWARDED_HINT_PLACEMENT = 'reward_hint';

export const DIRECTION_VECTORS = {
  E: { key: 'E', label: 'Horizontal', rowStep: 0, colStep: 1 },
  W: { key: 'W', label: 'Horizontal inversa', rowStep: 0, colStep: -1 },
  S: { key: 'S', label: 'Vertical', rowStep: 1, colStep: 0 },
  N: { key: 'N', label: 'Vertical inversa', rowStep: -1, colStep: 0 },
  SE: { key: 'SE', label: 'Diagonal descendente', rowStep: 1, colStep: 1 },
  NW: { key: 'NW', label: 'Diagonal ascendente', rowStep: -1, colStep: -1 },
  NE: { key: 'NE', label: 'Diagonal superior', rowStep: -1, colStep: 1 },
  SW: { key: 'SW', label: 'Diagonal inferior', rowStep: 1, colStep: -1 },
};

export const DIFFICULTY_PRESETS = {
  easy: {
    id: 'easy',
    label: 'Fácil',
    size: 10,
    wordCount: 6,
    directions: ['E', 'S'],
    minWordLength: 4,
    maxWordLength: 8,
    description: '10x10 · 6 palabras · solo lectura directa',
  },
  medium: {
    id: 'medium',
    label: 'Media',
    size: 12,
    wordCount: 8,
    directions: ['E', 'W', 'S', 'N'],
    minWordLength: 5,
    maxWordLength: 9,
    description: '12x12 · 8 palabras · filas y columnas en ambos sentidos',
  },
  hard: {
    id: 'hard',
    label: 'Difícil',
    size: 14,
    wordCount: 10,
    directions: ['E', 'W', 'S', 'N', 'SE', 'NW'],
    minWordLength: 5,
    maxWordLength: 11,
    description: '14x14 · 10 palabras · diagonales selectivas',
  },
  expert: {
    id: 'expert',
    label: 'Experto',
    size: 16,
    wordCount: 12,
    directions: ['E', 'W', 'S', 'N', 'SE', 'NW', 'NE', 'SW'],
    minWordLength: 6,
    maxWordLength: 14,
    description: '16x16 · 12 palabras · ocho direcciones',
  },
};

export const DEFAULT_SETTINGS = {
  category: 'animals',
  difficulty: 'medium',
  theme: 'light',
  playMode: 'classic',
  timerMode: 'timed',
  customSeed: '',
  externalPackUrls: [],
  inactiveSourceIds: [],
};

export const BOARD_GENERATION_RETRIES = 80;
export const WORD_PLACEMENT_ATTEMPTS = 140;
export const FEEDBACK_DURATION_MS = 950;
export const TOAST_DURATION_MS = 2200;
export const HINT_CHARGES = {
  timed: 3,
  zen: 5,
};

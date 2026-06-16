import { ACTION_MODES, APP_VERSION, GAME_STATUS } from "../utils/constants.js";
import { coerceInteger } from "../utils/helpers.js";

function createGameId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `game-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function createCell(row, col) {
  return {
    row,
    col,
    mine: false,
    adjacent: 0,
    revealed: false,
    flagged: false,
    exploded: false,
    wrongFlag: false,
    resolvedMine: false,
  };
}

export function createEmptyBoard(rows, cols) {
  const board = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      board.push(createCell(row, col));
    }
  }

  return board;
}

export function indexFromCoord(row, col, cols) {
  return row * cols + col;
}

export function getCell(board, row, col, cols) {
  return board[indexFromCoord(row, col, cols)] ?? null;
}

export function touchState(state) {
  state.updatedAt = Date.now();
  return state;
}

export function createGameState(config, actionMode = ACTION_MODES.reveal, options = {}) {
  return {
    version: APP_VERSION,
    gameId: createGameId(),
    config: { ...config },
    rows: config.rows,
    cols: config.cols,
    mines: config.mines,
    board: createEmptyBoard(config.rows, config.cols),
    flagsUsed: 0,
    remainingSafeCells: config.rows * config.cols - config.mines,
    status: GAME_STATUS.ready,
    isPaused: false,
    generated: false,
    firstMoveMade: false,
    elapsedMs: 0,
    seed: null,
    requestedSeed: options.requestedSeed ?? null,
    plannedOpeningCell: options.plannedOpeningCell ?? null,
    openingCell: null,
    zenMistakes: 0,
    countedInStats: false,
    selectedAction: actionMode,
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function serializeCell(cell) {
  return {
    m: cell.mine ? 1 : 0,
    a: cell.adjacent,
    r: cell.revealed ? 1 : 0,
    f: cell.flagged ? 1 : 0,
    x: cell.exploded ? 1 : 0,
    w: cell.wrongFlag ? 1 : 0,
    z: cell.resolvedMine ? 1 : 0,
  };
}

function hydrateCell(snapshot, row, col) {
  return {
    row,
    col,
    mine: Boolean(snapshot?.m ?? snapshot?.mine),
    adjacent: coerceInteger(snapshot?.a ?? snapshot?.adjacent, 0),
    revealed: Boolean(snapshot?.r ?? snapshot?.revealed),
    flagged: Boolean(snapshot?.f ?? snapshot?.flagged),
    exploded: Boolean(snapshot?.x ?? snapshot?.exploded),
    wrongFlag: Boolean(snapshot?.w ?? snapshot?.wrongFlag),
    resolvedMine: Boolean(snapshot?.z ?? snapshot?.resolvedMine),
  };
}

export function serializeGameState(state) {
  return {
    version: state.version,
    gameId: state.gameId,
    config: state.config,
    rows: state.rows,
    cols: state.cols,
    mines: state.mines,
    board: state.board.map(serializeCell),
    status: state.status,
    isPaused: state.isPaused,
    generated: state.generated,
    firstMoveMade: state.firstMoveMade,
    elapsedMs: state.elapsedMs,
    seed: state.seed,
    requestedSeed: state.requestedSeed,
    plannedOpeningCell: state.plannedOpeningCell,
    openingCell: state.openingCell,
    zenMistakes: state.zenMistakes,
    countedInStats: state.countedInStats,
    selectedAction: state.selectedAction,
    result: state.result,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
}

export function hydrateGameState(snapshot) {
  if (!snapshot?.config) {
    return null;
  }

  const rows = coerceInteger(snapshot.rows ?? snapshot.config.rows, 0);
  const cols = coerceInteger(snapshot.cols ?? snapshot.config.cols, 0);
  const mines = coerceInteger(snapshot.mines ?? snapshot.config.mines, 0);

  if (!rows || !cols || !Array.isArray(snapshot.board) || snapshot.board.length !== rows * cols) {
    return null;
  }

  const board = snapshot.board.map((cell, index) =>
    hydrateCell(cell, Math.floor(index / cols), index % cols),
  );
  const flagsUsed = board.filter((cell) => cell.flagged).length;
  const remainingSafeCells = board.filter((cell) => !cell.mine && !cell.revealed).length;
  const selectedAction = Object.values(ACTION_MODES).includes(snapshot.selectedAction)
    ? snapshot.selectedAction
    : ACTION_MODES.reveal;

  return {
    version: snapshot.version ?? APP_VERSION,
    gameId: snapshot.gameId ?? createGameId(),
    config: {
      ...snapshot.config,
      rows,
      cols,
      mines,
      isCustom: Boolean(snapshot.config.isCustom),
    },
    rows,
    cols,
    mines,
    board,
    flagsUsed,
    remainingSafeCells,
    status: Object.values(GAME_STATUS).includes(snapshot.status)
      ? snapshot.status
      : GAME_STATUS.ready,
    isPaused: Boolean(snapshot.isPaused),
    generated: Boolean(snapshot.generated),
    firstMoveMade: Boolean(snapshot.firstMoveMade),
    elapsedMs: Math.max(0, coerceInteger(snapshot.elapsedMs, 0)),
    seed: snapshot.seed ?? null,
    requestedSeed: snapshot.requestedSeed ?? null,
    plannedOpeningCell: snapshot.plannedOpeningCell ?? null,
    openingCell: snapshot.openingCell ?? null,
    zenMistakes: Math.max(0, coerceInteger(snapshot.zenMistakes, 0)),
    countedInStats: Boolean(snapshot.countedInStats),
    selectedAction,
    result: snapshot.result ?? null,
    createdAt: coerceInteger(snapshot.createdAt, Date.now()),
    updatedAt: coerceInteger(snapshot.updatedAt, Date.now()),
  };
}

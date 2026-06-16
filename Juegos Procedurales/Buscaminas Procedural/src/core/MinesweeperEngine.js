import { ACTION_MODES, GAME_STATUS } from "../utils/constants.js";
import { populateBoard } from "./BoardGenerator.js";
import {
  createGameState,
  getCell,
  hydrateGameState,
  touchState,
} from "./GameState.js";
import {
  autoFlagMines,
  countFlaggedNeighbors,
  getChordTargets,
  revealAllMines,
  revealArea,
} from "./RevealSystem.js";
import { resolveDifficultyConfig } from "./Validator.js";

export class MinesweeperEngine {
  constructor(initialActionMode = ACTION_MODES.reveal) {
    this.initialActionMode = initialActionMode;
    this.state = null;
    this.lastConfig = resolveDifficultyConfig("easy");
  }

  getState() {
    return this.state;
  }

  hasGame() {
    return Boolean(this.state);
  }

  startNewGame({
    difficultyId,
    customConfig,
    actionMode = this.initialActionMode,
    zenMode = false,
    seedInput = "",
    plannedOpeningCell = null,
  }) {
    const config = {
      ...resolveDifficultyConfig(difficultyId, customConfig),
      zenMode: Boolean(zenMode),
    };
    this.lastConfig = config;
    this.state = createGameState(config, actionMode, {
      requestedSeed: seedInput || null,
      plannedOpeningCell,
    });
    return this.#result(true, ["game-reset"]);
  }

  restartCurrentGame(actionMode = this.state?.selectedAction ?? this.initialActionMode) {
    const sourceConfig = this.state?.config ?? this.lastConfig;
    return this.startNewGame({
      difficultyId: sourceConfig.id,
      customConfig: sourceConfig.id === "custom" ? sourceConfig : null,
      actionMode,
      zenMode: Boolean(sourceConfig.zenMode),
      seedInput: this.state?.requestedSeed ?? null,
      plannedOpeningCell: this.state?.plannedOpeningCell ?? null,
    });
  }

  restoreSession(snapshot) {
    const hydratedState = hydrateGameState(snapshot);

    if (!hydratedState) {
      return this.#result(false, []);
    }

    this.state = hydratedState;
    this.lastConfig = hydratedState.config;
    return this.#result(true, ["session-restored"]);
  }

  clearGame() {
    this.state = null;
    return this.#result(true, ["game-cleared"]);
  }

  hasPlannedOpening() {
    return Boolean(this.state?.plannedOpeningCell && !this.state?.generated);
  }

  playPlannedOpening() {
    if (!this.state?.plannedOpeningCell || this.state.generated) {
      return this.#result(false, []);
    }

    const { row, col } = this.state.plannedOpeningCell;
    return this.revealCell(row, col);
  }

  setActionMode(actionMode) {
    if (!Object.values(ACTION_MODES).includes(actionMode)) {
      return this.#result(false, []);
    }

    this.initialActionMode = actionMode;

    if (this.state) {
      this.state.selectedAction = actionMode;
      touchState(this.state);
      return this.#result(true, ["mode-changed"]);
    }

    return this.#result(false, []);
  }

  setElapsedMs(elapsedMs) {
    if (!this.state) {
      return this.#result(false, []);
    }

    this.state.elapsedMs = elapsedMs;
    touchState(this.state);
    return this.#result(true, []);
  }

  pauseGame() {
    if (!this.state || this.state.isPaused || this.#isFinished()) {
      return this.#result(false, []);
    }

    this.state.isPaused = true;
    touchState(this.state);
    return this.#result(true, ["paused"]);
  }

  resumeGame() {
    if (!this.state || !this.state.isPaused) {
      return this.#result(false, []);
    }

    this.state.isPaused = false;
    touchState(this.state);
    return this.#result(true, ["resumed"]);
  }

  revealCell(row, col) {
    if (!this.state || this.state.isPaused || this.#isFinished()) {
      return this.#result(false, []);
    }

    const cell = getCell(this.state.board, row, col, this.state.cols);

    if (!cell) {
      return this.#result(false, []);
    }

    if (cell.revealed) {
      return this.#chordCell(row, col);
    }

    if (cell.flagged) {
      return this.#result(false, []);
    }

    return this.#revealHiddenCell(row, col);
  }

  toggleFlag(row, col) {
    if (!this.state || this.state.isPaused || this.#isFinished()) {
      return this.#result(false, []);
    }

    const cell = getCell(this.state.board, row, col, this.state.cols);

    if (!cell || cell.revealed) {
      return this.#result(false, []);
    }

    cell.flagged = !cell.flagged;
    cell.wrongFlag = false;
    this.state.flagsUsed += cell.flagged ? 1 : -1;
    touchState(this.state);
    return this.#result(true, ["flag-toggled"]);
  }

  #revealHiddenCell(row, col, existingEvents = []) {
    const events = [...existingEvents];
    this.#ensureGenerated(row, col, events);

    const cell = getCell(this.state.board, row, col, this.state.cols);

    if (!cell || cell.revealed || cell.flagged) {
      return this.#result(false, []);
    }

    if (cell.mine && this.state.config.zenMode) {
      const changed = this.#resolveZenMine(cell, row, col, events);
      if (!changed) {
        return this.#result(false, []);
      }

      touchState(this.state);
      return this.#result(true, events);
    }

    const result = revealArea(this.state.board, this.state.rows, this.state.cols, row, col);

    if (!result.changed) {
      return this.#result(false, []);
    }

    if (result.mineHit) {
      return this.#loseGame(row, col, events);
    }

    return this.#finalizeRevealProgress(result.revealedCount, events);
  }

  #chordCell(row, col) {
    const cell = getCell(this.state.board, row, col, this.state.cols);

    if (!cell || !cell.revealed || cell.adjacent <= 0 || !this.state.generated) {
      return this.#result(false, []);
    }

    const flaggedNeighbors = countFlaggedNeighbors(
      this.state.board,
      this.state.rows,
      this.state.cols,
      row,
      col,
    );

    if (flaggedNeighbors !== cell.adjacent) {
      return this.#result(false, []);
    }

    const targets = getChordTargets(
      this.state.board,
      this.state.rows,
      this.state.cols,
      row,
      col,
    );

    if (targets.length === 0) {
      return this.#result(false, []);
    }

    const events = ["chord-used"];
    let totalRevealed = 0;
    let anyChange = false;

    for (const [targetRow, targetCol] of targets) {
      const targetCell = getCell(this.state.board, targetRow, targetCol, this.state.cols);

      if (!targetCell || targetCell.revealed || targetCell.flagged) {
        continue;
      }

      if (targetCell.mine && this.state.config.zenMode) {
        const changed = this.#resolveZenMine(targetCell, targetRow, targetCol, events);
        anyChange ||= changed;
        continue;
      }

      const revealResult = revealArea(
        this.state.board,
        this.state.rows,
        this.state.cols,
        targetRow,
        targetCol,
      );

      anyChange ||= revealResult.changed;
      totalRevealed += revealResult.revealedCount;

      if (revealResult.mineHit) {
        return this.#loseGame(targetRow, targetCol, events);
      }
    }

    if (!anyChange) {
      return this.#result(false, []);
    }

    return this.#finalizeRevealProgress(totalRevealed, events);
  }

  #ensureGenerated(row, col, events) {
    if (this.state.generated) {
      return this.#result(true, events);
    }

    const generated = populateBoard(
      this.state.board,
      this.state.rows,
      this.state.cols,
      this.state.mines,
      row,
      col,
      this.state.requestedSeed ?? undefined,
    );

    this.state.board = generated.board;
    this.state.seed = generated.seed;
    this.state.generated = true;
    this.state.firstMoveMade = true;
    this.state.status = GAME_STATUS.playing;
    this.state.openingCell = { row, col };

    if (!this.state.countedInStats) {
      this.state.countedInStats = true;
      events.push("game-started");
    }

    return this.#result(true, events);
  }

  #resolveZenMine(cell, row, col, events) {
    let changed = false;

    if (!cell.flagged) {
      cell.flagged = true;
      this.state.flagsUsed += 1;
      changed = true;
    }

    if (!cell.resolvedMine) {
      cell.resolvedMine = true;
      this.state.zenMistakes += 1;
      changed = true;
    }

    if (!changed) {
      return false;
    }

    this.state.result = {
      kind: "zen-mine",
      row,
      col,
      mistakes: this.state.zenMistakes,
    };
    events.push("zen-mine-resolved");
    return true;
  }

  #finalizeRevealProgress(revealedCount, events) {
    this.state.remainingSafeCells -= revealedCount;

    if (this.state.remainingSafeCells <= 0) {
      autoFlagMines(this.state.board);
      this.state.flagsUsed = this.state.mines;
      this.state.status = GAME_STATUS.won;
      this.state.result = {
        kind: "won",
        zenMistakes: this.state.zenMistakes,
      };
      touchState(this.state);
      return this.#result(true, [...events, "game-won"]);
    }

    touchState(this.state);
    return this.#result(true, events);
  }

  #loseGame(row, col, events) {
    revealAllMines(this.state.board);
    this.state.status = GAME_STATUS.lost;
    this.state.result = { kind: "lost", row, col };
    touchState(this.state);
    return this.#result(true, [...events, "game-lost"]);
  }

  #isFinished() {
    return (
      this.state?.status === GAME_STATUS.won || this.state?.status === GAME_STATUS.lost
    );
  }

  #result(changed, events) {
    return {
      changed,
      events,
      state: this.state,
    };
  }
}

import {
  CELL_COUNT,
  DAILY_DIFFICULTY_ROTATION,
  DEFAULT_STATS,
  MAX_HISTORY_STEPS,
} from "../utils/constants.js";
import {
  clearBit,
  coerceNumberArray,
  copyBoard,
  countFilledCells,
  findFirstEmptyCell,
  formatDateKey,
  getLocalDateKey,
  toggleBit,
  wait,
} from "../utils/helpers.js";
import { createSessionSeed } from "../utils/random.js";
import { evaluateBoard } from "./Validator.js";

function cloneTurnState(game, elapsedMs) {
  return {
    current: copyBoard(game.current),
    notes: copyBoard(game.notes),
    selectedIndex: game.selectedIndex,
    noteMode: game.noteMode,
    paused: game.paused,
    completed: game.completed,
    elapsedMs,
    hintCount: game.hintCount,
    mistakeCount: game.mistakeCount,
  };
}

export class GameState {
  constructor({ engine, storage, settings, timer, nativeBridge, analytics }) {
    this.engine = engine;
    this.storage = storage;
    this.settings = settings;
    this.timer = timer;
    this.nativeBridge = nativeBridge;
    this.analytics = analytics;
    this.listeners = new Set();
    this.screen = "home";
    this.stats = this.buildStats();
    this.game = null;
    this.isGenerating = false;
    this.history = {
      undo: [],
      redo: [],
    };

    this.timer.onTick = (elapsedMs) => {
      if (!this.game || this.game.completed || this.game.paused) {
        return;
      }
      this.game.elapsedMs = elapsedMs;
      this.persistGame();
      this.emit();
    };
  }

  buildStats() {
    const stored = this.storage.loadStats();
    return {
      ...DEFAULT_STATS,
      ...stored,
      bestTimes: {
        ...DEFAULT_STATS.bestTimes,
        ...(stored.bestTimes || {}),
      },
    };
  }

  getDailyChallengeSpec(dateKey = getLocalDateKey()) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const daySerial = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
    const difficulty = DAILY_DIFFICULTY_ROTATION[Math.abs(daySerial) % DAILY_DIFFICULTY_ROTATION.length];
    return {
      id: dateKey,
      dateKey,
      difficulty,
      seed: `daily:${dateKey}:${difficulty}`,
      label: formatDateKey(dateKey),
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit() {
    const snapshot = this.getSnapshot();

    if (this.nativeBridge) {
      this.nativeBridge.setBackContext({
        screen: snapshot.screen,
        hasDialog: false,
        hasActiveGame: Boolean(snapshot.game && !snapshot.game.completed),
        gamePaused: Boolean(snapshot.game?.paused),
        gameCompleted: Boolean(snapshot.game?.completed),
      });
    }

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  async init() {
    const savedGame = this.storage.loadGame();
    if (savedGame && !savedGame.completed) {
      this.game = this.hydrateGame(savedGame);
      this.resetHistory();
      this.screen = "home";
      this.game.paused = true;
      this.syncTimerState(this.game.elapsedMs, true);
      this.persistGame();
      this.analytics?.track("session_restored", {
        difficulty: this.game.difficulty,
        mode: this.game.mode,
        dailyId: this.game.dailyId,
      });
    }
    this.analytics?.flush();
    this.emit();
  }

  hydrateGame(game) {
    const puzzle = coerceNumberArray(game.puzzle, CELL_COUNT, 0);
    const current = coerceNumberArray(game.current, CELL_COUNT, 0);
    const solution = coerceNumberArray(game.solution, CELL_COUNT, 0);
    const notes = coerceNumberArray(game.notes, CELL_COUNT, 0);
    const selectedIndex =
      Number.isInteger(game.selectedIndex) && game.selectedIndex >= 0 ? game.selectedIndex : findFirstEmptyCell(current);

    return {
      id: game.id || `${game.seed || "resume"}:${Date.now()}`,
      seed: game.seed || createSessionSeed("resume"),
      mode: game.mode || "standard",
      dailyId: game.dailyId || null,
      dailyLabel: game.dailyLabel || null,
      difficulty: game.difficulty || "easy",
      puzzle,
      current,
      solution,
      notes,
      analysis: game.analysis || this.engine.analyze(puzzle),
      selectedIndex: selectedIndex === -1 ? 0 : selectedIndex,
      noteMode: Boolean(game.noteMode),
      paused: Boolean(game.paused),
      completed: Boolean(game.completed),
      elapsedMs: Number(game.elapsedMs) || 0,
      hintCount: Number(game.hintCount) || 0,
      mistakeCount: Number(game.mistakeCount) || 0,
      createdAt: game.createdAt || new Date().toISOString(),
      revision: Number(game.revision) || 0,
    };
  }

  getSnapshot() {
    const settings = this.settings.get();
    const dailyChallenge = this.getDailyChallengeSpec();
    const snapshot = {
      screen: this.screen,
      settings,
      stats: this.stats,
      isGenerating: this.isGenerating,
      hasSavedGame: Boolean(this.game && !this.game.completed),
      canUndo: this.history.undo.length > 0,
      canRedo: this.history.redo.length > 0,
      dailyChallenge: {
        ...dailyChallenge,
        completedToday: this.stats.lastDailyWinKey === dailyChallenge.dateKey,
        activeToday:
          Boolean(this.game) &&
          this.game.mode === "daily" &&
          this.game.dailyId === dailyChallenge.dateKey &&
          !this.game.completed,
      },
      game: null,
    };

    if (!this.game) {
      return snapshot;
    }

    const evaluation = evaluateBoard(
      this.game.current,
      this.game.puzzle,
      this.game.solution,
      settings.showErrors
    );

    const selectedValue =
      this.game.selectedIndex !== null && this.game.selectedIndex >= 0
        ? this.game.current[this.game.selectedIndex]
        : 0;

    const matchingIndices =
      selectedValue === 0
        ? []
        : this.game.current
            .map((value, index) => (value === selectedValue ? index : -1))
            .filter((index) => index !== -1);

    snapshot.game = {
      ...this.game,
      elapsedMs: this.game.completed ? this.game.elapsedMs : this.timer.getElapsedMs(),
      givenCount: countFilledCells(this.game.puzzle),
      selectedValue,
      matchingIndices,
      duplicates: [...evaluation.duplicates],
      incorrect: [...evaluation.incorrect],
      solved: evaluation.solved,
      hasConflicts: evaluation.hasConflicts,
      progressPercent: Math.round((countFilledCells(this.game.current) / CELL_COUNT) * 100),
      canUndo: this.history.undo.length > 0,
      canRedo: this.history.redo.length > 0,
      rewardHintReady: true,
      advancedMoves: this.game.analysis?.advancedMoves || 0,
    };

    return snapshot;
  }

  async startNewGame(difficulty, options = {}) {
    if (this.game && !this.game.completed) {
      this.stats.currentStreak = 0;
    }

    this.stats.played += 1;
    this.persistStats();
    this.isGenerating = true;
    this.emit();
    await wait(16);

    const seed = options.seed || createSessionSeed(difficulty);
    const generated = this.engine.generateGame(difficulty, seed);
    const selectedIndex = findFirstEmptyCell(generated.puzzle);

    this.game = {
      id: `${generated.seed}:${Date.now()}`,
      seed: generated.seed,
      mode: options.mode || "standard",
      dailyId: options.dailyId || null,
      dailyLabel: options.dailyLabel || null,
      difficulty,
      puzzle: copyBoard(generated.puzzle),
      current: copyBoard(generated.puzzle),
      solution: copyBoard(generated.solution),
      notes: Array(CELL_COUNT).fill(0),
      analysis: generated.analysis,
      selectedIndex: selectedIndex === -1 ? 0 : selectedIndex,
      noteMode: false,
      paused: false,
      completed: false,
      elapsedMs: 0,
      hintCount: 0,
      mistakeCount: 0,
      createdAt: new Date().toISOString(),
      revision: 1,
    };

    this.resetHistory();
    this.screen = "game";
    this.isGenerating = false;
    this.syncTimerState(0, false);
    this.persistGame();
    this.analytics?.track("game_start", {
      difficulty,
      mode: this.game.mode,
      dailyId: this.game.dailyId,
      seed: this.game.seed,
    });
    this.emit();
  }

  startDailyChallenge(dateKey = getLocalDateKey()) {
    const daily = this.getDailyChallengeSpec(dateKey);
    return this.startNewGame(daily.difficulty, {
      mode: "daily",
      seed: daily.seed,
      dailyId: daily.dateKey,
      dailyLabel: daily.label,
    });
  }

  discardSavedGame() {
    this.timer.stop();
    this.storage.clearGame();
    this.game = null;
    this.resetHistory();
    this.screen = "home";
    this.analytics?.track("saved_game_discarded");
    this.emit();
  }

  openHome() {
    if (this.game && !this.game.completed) {
      this.pauseGame("menu");
    }
    this.screen = "home";
    this.emit();
  }

  resumeToGame() {
    if (!this.game) {
      return;
    }
    this.screen = "game";
    if (this.game.paused && !this.game.completed) {
      this.game.paused = false;
      this.syncTimerState(this.game.elapsedMs, false);
      this.persistGame();
      this.analytics?.track("game_resume", {
        difficulty: this.game.difficulty,
        mode: this.game.mode,
      });
    }
    this.bumpRevision(false);
    this.emit();
  }

  pauseGame(reason = "manual") {
    if (!this.game || this.game.completed) {
      return;
    }
    this.game.paused = true;
    this.game.elapsedMs = this.timer.pause();
    this.persistGame();
    this.analytics?.track("game_pause", {
      reason,
      difficulty: this.game.difficulty,
      mode: this.game.mode,
    });
    this.emit();
  }

  selectCell(index) {
    if (!this.game || this.game.paused || this.isGenerating) {
      return;
    }
    this.game.selectedIndex = index;
    this.bumpRevision();
    this.triggerHaptics(10);
    this.emit();
  }

  moveSelection(rowDelta, colDelta) {
    if (!this.game || this.game.paused || this.isGenerating) {
      return;
    }

    const currentIndex = Number.isInteger(this.game.selectedIndex) ? this.game.selectedIndex : 0;
    const row = Math.floor(currentIndex / 9);
    const col = currentIndex % 9;
    const nextRow = (row + rowDelta + 9) % 9;
    const nextCol = (col + colDelta + 9) % 9;
    this.game.selectedIndex = nextRow * 9 + nextCol;
    this.bumpRevision();
    this.emit();
  }

  toggleNoteMode() {
    if (!this.game || this.game.paused) {
      return;
    }
    this.game.noteMode = !this.game.noteMode;
    this.bumpRevision(false);
    this.emit();
  }

  toggleFocusMode() {
    const current = this.settings.get();
    this.settings.update({ focusMode: !current.focusMode });
    this.bumpRevision(false);
    this.emit();
  }

  eraseSelectedCell() {
    if (!this.canEditSelectedCell()) {
      return;
    }

    const index = this.game.selectedIndex;
    if (this.game.current[index] === 0 && this.game.notes[index] === 0) {
      return;
    }

    this.pushHistory();
    this.game.current[index] = 0;
    this.game.notes[index] = 0;
    this.bumpRevision();
    this.persistGame();
    this.emit();
  }

  applyDigit(digit) {
    if (!this.canEditSelectedCell()) {
      return;
    }

    if (this.game.noteMode) {
      this.toggleNoteDigit(digit);
      return;
    }

    const index = this.game.selectedIndex;
    if (this.game.current[index] === digit) {
      return;
    }

    this.pushHistory();
    this.game.current[index] = digit;
    this.game.notes[index] = 0;
    this.prunePeerNotes(index, digit);

    if (digit !== this.game.solution[index]) {
      this.game.mistakeCount += 1;
    }

    this.bumpRevision();
    this.triggerHaptics([8]);
    this.persistGame();
    this.completeIfSolved();
    this.emit();
  }

  toggleNoteDigit(digit) {
    if (!this.canEditSelectedCell()) {
      return;
    }

    const index = this.game.selectedIndex;
    if (this.game.current[index] !== 0) {
      return;
    }

    this.pushHistory();
    this.game.notes[index] = toggleBit(this.game.notes[index], digit);
    this.bumpRevision();
    this.persistGame();
    this.emit();
  }

  giveHint(source = "standard") {
    if (!this.game || this.game.paused || this.game.completed) {
      return false;
    }

    const preferredIndex = this.game.selectedIndex;
    const hintIndex =
      this.isHintEligible(preferredIndex) ?
        preferredIndex
      : this.game.current.findIndex((_value, index) => this.isHintEligible(index));

    if (hintIndex === -1) {
      return false;
    }

    this.pushHistory();
    const correctValue = this.game.solution[hintIndex];
    this.game.current[hintIndex] = correctValue;
    this.game.notes[hintIndex] = 0;
    this.prunePeerNotes(hintIndex, correctValue);
    this.game.selectedIndex = hintIndex;
    this.game.hintCount += 1;
    this.stats.totalHintsUsed += 1;
    if (source === "rewarded") {
      this.stats.rewardedHintsUsed += 1;
    }
    this.persistStats();
    this.bumpRevision();
    this.triggerHaptics([18]);
    this.persistGame();
    this.analytics?.track("hint_used", {
      source,
      difficulty: this.game.difficulty,
      mode: this.game.mode,
    });
    this.completeIfSolved();
    this.emit();
    return true;
  }

  async requestRewardedHint() {
    if (!this.game || this.game.paused || this.game.completed) {
      return false;
    }

    const hasEligibleCell = this.game.current.some((_value, index) => this.isHintEligible(index));
    if (!hasEligibleCell) {
      return false;
    }

    this.analytics?.track("rewarded_hint_requested", {
      difficulty: this.game.difficulty,
      mode: this.game.mode,
    });

    const granted = await this.nativeBridge.requestRewardedHint();
    if (!granted) {
      this.analytics?.track("rewarded_hint_denied", {
        difficulty: this.game.difficulty,
        mode: this.game.mode,
      });
      return false;
    }

    this.analytics?.track("rewarded_hint_granted", {
      difficulty: this.game.difficulty,
      mode: this.game.mode,
    });
    return this.giveHint("rewarded");
  }

  restartGame() {
    if (!this.game) {
      return;
    }

    this.game.current = copyBoard(this.game.puzzle);
    this.game.notes = Array(CELL_COUNT).fill(0);
    this.game.noteMode = false;
    this.game.paused = false;
    this.game.completed = false;
    this.game.elapsedMs = 0;
    this.game.hintCount = 0;
    this.game.mistakeCount = 0;
    this.game.selectedIndex = findFirstEmptyCell(this.game.puzzle);
    this.resetHistory();
    this.bumpRevision();
    this.syncTimerState(0, false);
    this.persistGame();
    this.analytics?.track("game_restart", {
      difficulty: this.game.difficulty,
      mode: this.game.mode,
    });
    this.emit();
  }

  undo() {
    if (!this.game || this.history.undo.length === 0) {
      return;
    }

    const previous = this.history.undo.pop();
    this.history.redo.push(cloneTurnState(this.game, this.timer.getElapsedMs()));
    this.restoreTurnState(previous);
    this.analytics?.track("undo", {
      difficulty: this.game.difficulty,
      mode: this.game.mode,
    });
    this.emit();
  }

  redo() {
    if (!this.game || this.history.redo.length === 0) {
      return;
    }

    const next = this.history.redo.pop();
    this.history.undo.push(cloneTurnState(this.game, this.timer.getElapsedMs()));
    this.restoreTurnState(next);
    this.analytics?.track("redo", {
      difficulty: this.game.difficulty,
      mode: this.game.mode,
    });
    this.emit();
  }

  restoreTurnState(state) {
    this.game.current = copyBoard(state.current);
    this.game.notes = copyBoard(state.notes);
    this.game.selectedIndex = state.selectedIndex;
    this.game.noteMode = state.noteMode;
    this.game.paused = state.paused;
    this.game.completed = state.completed;
    this.game.elapsedMs = state.elapsedMs;
    this.game.hintCount = state.hintCount;
    this.game.mistakeCount = state.mistakeCount;
    this.bumpRevision();
    this.syncTimerState(state.elapsedMs, state.paused || state.completed);
    this.persistGame();
  }

  cycleTheme() {
    this.settings.cycleTheme();
    this.emit();
  }

  toggleShowErrors() {
    const current = this.settings.get();
    this.settings.update({ showErrors: !current.showErrors });
    this.bumpRevision(false);
    this.emit();
  }

  handleAppHidden() {
    if (!this.game || this.game.paused || this.game.completed) {
      return;
    }
    this.pauseGame("background");
  }

  handleHostPause() {
    if (this.game && !this.game.paused && !this.game.completed) {
      this.pauseGame("host-pause");
    }

    this.persistGame();
    this.persistStats();
    this.analytics?.flush();
  }

  handleHostResume() {
    this.nativeBridge?.refresh?.();
    this.analytics?.flush();
    this.emit();
  }

  persistGame() {
    if (!this.game || this.game.completed) {
      this.storage.clearGame();
      return;
    }

    this.storage.saveGame({
      ...this.game,
      elapsedMs: this.game.completed ? this.game.elapsedMs : this.timer.getElapsedMs(),
    });
  }

  persistStats() {
    this.storage.saveStats(this.stats);
  }

  canEditSelectedCell() {
    if (!this.game || this.game.paused || this.game.completed) {
      return false;
    }

    const index = this.game.selectedIndex;
    return Number.isInteger(index) && index >= 0 && this.game.puzzle[index] === 0;
  }

  isHintEligible(index) {
    return (
      Number.isInteger(index) &&
      index >= 0 &&
      this.game.puzzle[index] === 0 &&
      this.game.current[index] !== this.game.solution[index]
    );
  }

  prunePeerNotes(index, value) {
    if (value === 0) {
      return;
    }

    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let peer = 0; peer < CELL_COUNT; peer += 1) {
      const peerRow = Math.floor(peer / 9);
      const peerCol = peer % 9;
      const sameRow = peerRow === row;
      const sameCol = peerCol === col;
      const sameBox = peerRow >= boxRow && peerRow < boxRow + 3 && peerCol >= boxCol && peerCol < boxCol + 3;

      if ((sameRow || sameCol || sameBox) && peer !== index) {
        this.game.notes[peer] = clearBit(this.game.notes[peer], value);
      }
    }
  }

  completeIfSolved() {
    if (!this.game) {
      return;
    }

    const evaluation = evaluateBoard(
      this.game.current,
      this.game.puzzle,
      this.game.solution,
      this.settings.get().showErrors
    );

    if (!evaluation.solved) {
      return;
    }

    const finalElapsed = this.timer.pause();
    this.game.completed = true;
    this.game.paused = true;
    this.game.elapsedMs = finalElapsed;
    this.stats.won += 1;
    this.stats.currentStreak += 1;
    this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.currentStreak);
    this.stats.totalPlayTimeMs += finalElapsed;
    this.stats.lastCompletedDifficulty = this.game.difficulty;

    if (this.game.mode === "daily" && this.stats.lastDailyWinKey !== this.game.dailyId) {
      this.stats.dailyWins += 1;
      this.stats.lastDailyWinKey = this.game.dailyId;
    }

    const bestTime = this.stats.bestTimes[this.game.difficulty];
    if (bestTime === null || finalElapsed < bestTime) {
      this.stats.bestTimes[this.game.difficulty] = finalElapsed;
    }

    this.persistStats();
    this.storage.clearGame();
    this.analytics?.track("game_completed", {
      difficulty: this.game.difficulty,
      mode: this.game.mode,
      dailyId: this.game.dailyId,
      elapsedMs: finalElapsed,
      hints: this.game.hintCount,
      mistakes: this.game.mistakeCount,
    });
    this.triggerHaptics([30, 20, 30]);
  }

  pushHistory() {
    if (!this.game) {
      return;
    }

    this.history.undo.push(cloneTurnState(this.game, this.timer.getElapsedMs()));
    if (this.history.undo.length > MAX_HISTORY_STEPS) {
      this.history.undo.shift();
    }
    this.history.redo = [];
  }

  resetHistory() {
    this.history.undo = [];
    this.history.redo = [];
  }

  syncTimerState(elapsedMs, paused) {
    this.timer.start(elapsedMs);
    if (paused) {
      this.timer.pause();
    }
  }

  bumpRevision(persist = true) {
    if (!this.game) {
      return;
    }
    this.game.revision += 1;
    if (persist) {
      this.persistGame();
    }
  }

  triggerHaptics(pattern) {
    if (!this.settings.get().haptics) {
      return;
    }
    this.nativeBridge.vibrate(pattern);
  }
}

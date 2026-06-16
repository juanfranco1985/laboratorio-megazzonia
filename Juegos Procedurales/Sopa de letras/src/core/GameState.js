export class GameState {
  constructor(settings) {
    this.settings = { ...settings };
    this.screen = 'home';
    this.settingsPanelOpen = false;
    this.currentGame = null;
  }

  setSettings(settings) {
    this.settings = { ...settings };
  }

  setScreen(screen) {
    this.screen = screen;
  }

  setSettingsPanelOpen(isOpen) {
    this.settingsPanelOpen = isOpen;
  }

  startGame(puzzle, options = {}) {
    this.currentGame = {
      puzzle,
      foundWordIds: [],
      paused: false,
      pauseReason: null,
      completed: false,
      selectionFeedback: null,
      lastFoundWordId: null,
      hintsUsed: 0,
      maxHints: options.maxHints ?? 0,
      bonusHints: options.bonusHints ?? 0,
      hintedWordIds: [],
    };
    this.screen = 'game';
    this.settingsPanelOpen = false;
  }

  loadGame(snapshot) {
    this.currentGame = {
      ...snapshot,
      foundWordIds: [...(snapshot.foundWordIds || [])],
      selectionFeedback: null,
      hintsUsed: Number(snapshot.hintsUsed || 0),
      maxHints: Number(snapshot.maxHints || 0),
      bonusHints: Number(snapshot.bonusHints || 0),
      hintedWordIds: [...(snapshot.hintedWordIds || [])],
    };
  }

  pause(reason = 'user') {
    if (!this.currentGame || this.currentGame.completed) {
      return false;
    }

    this.currentGame.paused = true;
    this.currentGame.pauseReason = reason;
    return true;
  }

  resume() {
    if (!this.currentGame || this.currentGame.completed) {
      return false;
    }

    this.currentGame.paused = false;
    this.currentGame.pauseReason = null;
    return true;
  }

  markWordFound(wordId) {
    if (!this.currentGame || this.currentGame.foundWordIds.includes(wordId)) {
      return false;
    }

    this.currentGame.foundWordIds = [...this.currentGame.foundWordIds, wordId];
    this.currentGame.lastFoundWordId = wordId;

    if (this.currentGame.foundWordIds.length >= this.currentGame.puzzle.placedWords.length) {
      this.currentGame.completed = true;
      this.currentGame.paused = false;
      this.currentGame.pauseReason = null;
    }

    return true;
  }

  setFeedback(feedback) {
    if (this.currentGame) {
      this.currentGame.selectionFeedback = feedback;
    }
  }

  clearFeedback() {
    if (this.currentGame) {
      this.currentGame.selectionFeedback = null;
    }
  }

  registerHint(wordId) {
    if (!this.currentGame || this.getRemainingHints() <= 0) {
      return false;
    }

    this.currentGame.hintsUsed += 1;

    if (wordId && !this.currentGame.hintedWordIds.includes(wordId)) {
      this.currentGame.hintedWordIds = [...this.currentGame.hintedWordIds, wordId];
    }

    return true;
  }

  grantBonusHint(amount = 1) {
    if (!this.currentGame) {
      return false;
    }

    this.currentGame.bonusHints += amount;
    return true;
  }

  getRemainingCount() {
    if (!this.currentGame) {
      return 0;
    }

    return this.currentGame.puzzle.placedWords.length - this.currentGame.foundWordIds.length;
  }

  getRemainingHints() {
    if (!this.currentGame) {
      return 0;
    }

    return Math.max(0, this.currentGame.maxHints + this.currentGame.bonusHints - this.currentGame.hintsUsed);
  }

  canContinue() {
    return Boolean(this.currentGame && !this.currentGame.completed);
  }

  serialize(timerState) {
    if (!this.currentGame) {
      return null;
    }

    return {
      puzzle: this.currentGame.puzzle,
      foundWordIds: this.currentGame.foundWordIds,
      paused: this.currentGame.paused,
      pauseReason: this.currentGame.pauseReason,
      completed: this.currentGame.completed,
      lastFoundWordId: this.currentGame.lastFoundWordId,
      hintsUsed: this.currentGame.hintsUsed,
      maxHints: this.currentGame.maxHints,
      bonusHints: this.currentGame.bonusHints,
      hintedWordIds: this.currentGame.hintedWordIds,
      timer: timerState,
    };
  }
}

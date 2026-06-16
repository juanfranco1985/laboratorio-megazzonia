import { formatTime } from '../utils/helpers.js';
import { TOAST_DURATION_MS } from '../utils/constants.js';
import { ControlsView } from './ControlsView.js';
import { GridView } from './GridView.js';
import { ModalView } from './ModalView.js';
import { StatsView } from './StatsView.js';
import { WordListView } from './WordListView.js';

export class Renderer {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.refs = this.createRefs();
    this.controlsView = new ControlsView(this.refs);
    this.gridView = new GridView(this.refs.gridContainer);
    this.wordListView = new WordListView(this.refs.wordList, this.refs.wordCounter);
    this.modalView = new ModalView(this.refs.modalRoot);
    this.statsView = new StatsView(this.refs.homeStats, this.refs.panelStats);
  }

  bind(callbacks) {
    this.controlsView.bind(callbacks);
    this.gridView.bind({ onSelectionCommit: callbacks.onSelectionCommit });
    this.modalView.bind(callbacks);
  }

  render({
    state,
    settings,
    stats,
    dailySummary,
    categories,
    sources,
    difficulties,
    playModes,
    timerModes,
    elapsedMs,
    bestTimeMs,
  }) {
    const hasActiveGame = Boolean(state.currentGame);
    const showGameScreen = state.screen === 'game' && hasActiveGame;

    this.refs.homeScreen.hidden = showGameScreen;
    this.refs.gameScreen.hidden = !showGameScreen;
    this.controlsView.render({
      settings,
      categories,
      sources,
      difficulties,
      playModes,
      timerModes,
      dailyAction: state.dailyAction,
      canContinue: state.canContinue,
      paused: Boolean(state.currentGame?.paused),
      canPause: Boolean(state.currentGame && !state.currentGame.completed),
      theme: settings.theme,
      isSettingsPanelOpen: state.settingsPanelOpen,
      hasActiveGame,
      canHint: Boolean(
        state.currentGame
        && !state.currentGame.paused
        && !state.currentGame.completed
        && (state.remainingHints > 0 || state.canEarnRewardedHint)
      ),
      canEarnRewardedHint: state.canEarnRewardedHint,
      remainingHints: state.remainingHints,
    });
    this.statsView.render(stats, bestTimeMs, dailySummary);
    this.renderCategoryPreview(categories, settings.category);
    this.refs.homeBestTimeChip.textContent = settings.timerMode === 'timed'
      ? (bestTimeMs ? `Mejor ${formatTime(bestTimeMs)}` : 'Sin record')
      : 'Zen sin record';

    if (showGameScreen) {
      this.renderGame(state.currentGame, elapsedMs, state.remainingHints);
    } else {
      this.setFeedback(null);
      this.refs.pauseOverlay.hidden = true;
    }
  }

  updateTimer(elapsedMs) {
    this.refs.timerChip.textContent = formatTime(elapsedMs);
  }

  flashSelection(cells, tone) {
    this.gridView.flashSelection(cells, tone);
  }

  setFeedback(feedback) {
    if (!feedback?.message) {
      this.refs.feedbackBanner.hidden = true;
      this.refs.feedbackBanner.textContent = '';
      this.refs.feedbackBanner.className = 'feedback-banner';
      return;
    }

    this.refs.feedbackBanner.hidden = false;
    this.refs.feedbackBanner.textContent = feedback.message;
    this.refs.feedbackBanner.className = `feedback-banner is-${feedback.tone}`;
  }

  showVictoryModal(payload) {
    this.modalView.showVictory(payload);
  }

  hideModal() {
    this.modalView.hide();
  }

  showToast(message, tone = 'info') {
    const toastElement = document.createElement('div');
    toastElement.className = `toast toast--${tone}`;
    toastElement.textContent = message;
    this.refs.toastRoot.appendChild(toastElement);

    window.setTimeout(() => {
      toastElement.classList.add('is-leaving');
      window.setTimeout(() => toastElement.remove(), 240);
    }, TOAST_DURATION_MS);
  }

  renderGame(currentGame, elapsedMs, remainingHints) {
    const puzzle = currentGame.puzzle;
    const remainingCount = puzzle.placedWords.length - currentGame.foundWordIds.length;
    const modeLabel = this.getModeLabel(puzzle);

    this.refs.gameTitle.textContent = puzzle.categoryLabel;
    this.refs.gameSubtitle.textContent = `${puzzle.difficultyLabel} · ${puzzle.size}x${puzzle.size} · ${puzzle.placedWords.length} palabras · ${modeLabel}`;
    this.refs.categoryChip.textContent = puzzle.isExternalCategory
      ? `${puzzle.categoryLabel} · ${puzzle.categorySourceLabel}`
      : puzzle.categoryLabel;
    this.refs.difficultyChip.textContent = puzzle.difficultyLabel;
    this.refs.remainingChip.textContent = `${remainingCount} restantes`;
    this.refs.modeChip.textContent = modeLabel;
    this.refs.hintChip.textContent = `${remainingHints} pistas`;
    this.refs.seedChip.textContent = `Seed ${this.formatSeed(puzzle.seed)}`;

    if (puzzle.timerMode === 'zen') {
      this.refs.timerLabel.textContent = 'Ritmo';
      this.refs.timerChip.textContent = 'Zen';
    } else {
      this.refs.timerLabel.textContent = 'Tiempo';
      this.updateTimer(elapsedMs);
    }

    this.wordListView.render(
      puzzle.placedWords,
      currentGame.foundWordIds,
      currentGame.lastFoundWordId,
    );
    this.gridView.render({
      puzzle,
      foundWordIds: currentGame.foundWordIds,
      disabled: currentGame.paused || currentGame.completed,
    });
    this.refs.pauseOverlay.hidden = !currentGame.paused;
    this.setFeedback(currentGame.selectionFeedback);
  }

  renderCategoryPreview(categories, activeCategoryId) {
    this.refs.homeCategoryPreview.innerHTML = categories.map((category) => `
      <article class="category-pill ${category.id === activeCategoryId ? 'is-active' : ''}">
        <strong>${category.label}</strong>
        <span>${category.isExternal ? category.sourceLabel : `${category.wordCount} palabras`}</span>
      </article>
    `).join('');
  }

  getModeLabel(puzzle) {
    const playLabel = puzzle.playMode === 'daily' ? 'Diaria' : 'Clasica';
    const timerLabel = puzzle.timerMode === 'zen' ? 'Zen' : 'Crono';
    return `${playLabel} · ${timerLabel}`;
  }

  formatSeed(seed) {
    return seed.length > 14 ? `${seed.slice(0, 6)}...${seed.slice(-5)}` : seed;
  }

  createRefs() {
    const get = (id) => this.document.getElementById(id);

    return {
      homeScreen: get('home-screen'),
      gameScreen: get('game-screen'),
      homeCategory: get('home-category'),
      panelCategory: get('panel-category'),
      homeDifficulty: get('home-difficulty'),
      panelDifficulty: get('panel-difficulty'),
      homePlayMode: get('home-play-mode'),
      panelPlayMode: get('panel-play-mode'),
      homeTimerMode: get('home-timer-mode'),
      panelTimerMode: get('panel-timer-mode'),
      homeSeed: get('home-seed'),
      panelSeed: get('panel-seed'),
      homeDailySeed: get('home-daily-seed'),
      panelDailySeed: get('panel-daily-seed'),
      homePackUrl: get('home-pack-url'),
      homePackAdd: get('home-pack-add'),
      homePackClear: get('home-pack-clear'),
      homePackSources: get('home-pack-sources'),
      homeNewGame: get('home-new-game'),
      homeDailyGame: get('home-daily-game'),
      homeContinueGame: get('home-continue-game'),
      homeThemeToggle: get('home-theme-toggle'),
      homeStats: get('home-stats'),
      homeBestTimeChip: get('home-best-time-chip'),
      homeCategoryPreview: get('home-category-preview'),
      gameHome: get('game-home'),
      settingsToggle: get('settings-toggle'),
      settingsClose: get('settings-close'),
      settingsPanel: get('settings-panel'),
      gameTitle: get('game-title'),
      gameSubtitle: get('game-subtitle'),
      categoryChip: get('category-chip'),
      difficultyChip: get('difficulty-chip'),
      remainingChip: get('remaining-chip'),
      modeChip: get('mode-chip'),
      hintChip: get('hint-chip'),
      timerLabel: get('timer-label'),
      timerChip: get('timer-chip'),
      seedChip: get('seed-chip'),
      gridContainer: get('grid-container'),
      pauseOverlay: get('pause-overlay'),
      feedbackBanner: get('feedback-banner'),
      wordCounter: get('word-counter'),
      wordList: get('word-list'),
      panelStats: get('panel-stats'),
      pauseButton: get('pause-button'),
      restartButton: get('restart-button'),
      newButton: get('new-button'),
      hintButton: get('hint-button'),
      shareButton: get('share-button'),
      themeButton: get('theme-button'),
      modalRoot: get('modal-root'),
      toastRoot: get('toast-root'),
    };
  }
}

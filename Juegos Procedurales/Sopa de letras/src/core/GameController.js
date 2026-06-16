import {
  FEEDBACK_DURATION_MS,
  HINT_CHARGES,
  PLAY_MODE_OPTIONS,
  REWARDED_HINT_PLACEMENT,
  TIMER_MODE_OPTIONS,
} from '../utils/constants.js';
import { formatTime, getDateKey, uniqueStrings } from '../utils/helpers.js';
import { Renderer } from '../ui/Renderer.js';
import { ThemeManager } from '../ui/ThemeManager.js';
import { ContentManager } from './ContentManager.js';
import { GameState } from './GameState.js';
import { NativeBridge } from './NativeBridge.js';
import { Settings } from './Settings.js';
import { StatsManager } from './StatsManager.js';
import { Storage } from './Storage.js';
import { Timer } from './Timer.js';
import { WordSearchEngine } from './WordSearchEngine.js';

export class GameController {
  constructor(documentRef = document, hostWindow = window) {
    this.document = documentRef;
    this.hostWindow = hostWindow;
    this.contentManager = new ContentManager();
    this.storage = new Storage();
    this.settings = new Settings(this.storage.loadSettings());
    this.stats = new StatsManager(this.storage.loadStats());
    this.state = new GameState(this.settings.get());
    this.engine = new WordSearchEngine(this.contentManager);
    this.renderer = new Renderer(this.document);
    this.themeManager = new ThemeManager(this.document.body);
    this.nativeBridge = new NativeBridge(hostWindow);
    this.bootstrapOptions = this.getBootstrapOptions();
    this.timer = new Timer({
      onTick: (elapsedMs) => this.handleTimerTick(elapsedMs),
    });
    this.feedbackTimeoutId = null;
    this.lastPersistedSecond = -1;
  }

  async init() {
    this.renderer.bind(this.createCallbacks());
    this.attachLifecycle();

    if (Object.keys(this.bootstrapOptions.settingsPatch).length > 0) {
      this.settings.update(this.bootstrapOptions.settingsPatch);
    }

    await this.reloadContentSources(
      [
        ...this.settings.get().externalPackUrls,
        ...this.bootstrapOptions.packUrls,
      ],
      this.settings.get().inactiveSourceIds,
      {
        showErrorsAsToast: false,
      },
    );

    this.themeManager.apply(this.settings.get().theme);

    if (this.bootstrapOptions.hasExplicitShareConfig) {
      this.state.setSettings(this.settings.get());
      this.render();

      if (this.bootstrapOptions.shouldAutoStart) {
        this.startNewGame({
          skipAbandonTracking: true,
        });
      } else {
        this.renderer.showToast('Seed compartida lista para jugar');
      }

      return;
    }

    this.syncDailySeedSetting();
    const savedGame = this.storage.loadGame();

    if (this.shouldRestoreSavedGame(savedGame)) {
      this.resumeSavedGame(savedGame);
      this.renderer.showToast('Partida restaurada');
      return;
    }

    if (savedGame?.puzzle?.isRankedDaily) {
      this.storage.clearGame();
    }

    this.render();
  }

  createCallbacks() {
    return {
      onSelectionCommit: (cells) => this.handleSelection(cells),
      onSettingsChange: (patch) => this.handleSettingsChange(patch),
      onUseDailySeed: () => this.useDailySeed(),
      onStartNewGame: () => this.startNewGame(),
      onStartDailyGame: () => this.startDailyGame(),
      onContinueGame: () => this.continueGame(),
      onRestartGame: () => this.restartGame(),
      onPauseToggle: () => this.togglePause(),
      onOpenHome: () => this.openHome(),
      onToggleTheme: () => this.toggleTheme(),
      onToggleSettingsPanel: () => this.toggleSettingsPanel(),
      onUseHint: () => this.useHint(),
      onShareCurrentGame: () => this.shareCurrentGame(),
      onAddPackSource: (sourceUrl) => this.addPackSource(sourceUrl),
      onClearPackSources: () => this.clearPackSources(),
      onToggleSource: (sourceId) => this.toggleSource(sourceId),
      onRemoveSource: (sourceId) => this.removeSource(sourceId),
      modalHome: () => this.handleModalHome(),
      modalNew: () => this.handleModalNew(),
      modalRestart: () => this.handleModalRestart(),
      modalShare: () => this.shareCurrentGame(),
    };
  }

  attachLifecycle() {
    this.hostWindow.addEventListener('beforeunload', () => this.persistAll());
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.hidden) {
        this.persistAll();
      }
    });
  }

  handleSettingsChange(patch) {
    const mergedSettings = this.settings.update(patch);
    const syncedSettings = this.resolveSettingsWithDailySeed(mergedSettings, patch);
    const validatedSettings = this.getValidatedSettings(syncedSettings);
    this.settings.update(validatedSettings);
    this.state.setSettings(this.settings.get());
    this.persistSettings();
    this.render();
  }

  resolveSettingsWithDailySeed(settings, patch = {}) {
    if (settings.playMode !== 'daily') {
      return settings;
    }

    if (patch.customSeed && patch.customSeed.trim()) {
      return settings;
    }

    return {
      ...settings,
      customSeed: this.contentManager.getDailySeed(settings.category, settings.difficulty),
    };
  }

  toggleTheme() {
    const nextTheme = this.settings.get().theme === 'dark' ? 'light' : 'dark';
    this.handleSettingsChange({ theme: nextTheme });
    this.themeManager.apply(nextTheme);
  }

  useDailySeed() {
    const currentSettings = this.settings.get();
    const dailySeed = this.contentManager.getDailySeed(
      currentSettings.category,
      currentSettings.difficulty,
    );

    this.handleSettingsChange({
      playMode: 'daily',
      customSeed: dailySeed,
    });
    this.renderer.showToast('Seed diaria preparada para esta configuracion');
  }

  startDailyGame() {
    const dailySummary = this.getDailySummary();
    const inProgressDaily = this.getInProgressRankedDaily();

    if (inProgressDaily) {
      this.continueGame();
      return;
    }

    if (dailySummary.completedToday) {
      this.renderer.showToast('El desafio diario de hoy ya fue completado.', 'info');
      return;
    }

    const profile = this.contentManager.getDailyChallengeProfile();
    this.handleSettingsChange({
      category: profile.categoryId,
      difficulty: profile.difficultyId,
      playMode: 'daily',
      timerMode: 'timed',
      customSeed: profile.seed,
    });
    this.startNewGame({
      toastMessage: 'Desafio diario cargado',
      gameOverrides: {
        category: profile.categoryId,
        difficulty: profile.difficultyId,
        playMode: 'daily',
        timerMode: 'timed',
        customSeed: profile.seed,
        dailyChallengeDateKey: profile.dateKey,
        isRankedDaily: true,
      },
    });
  }

  startNewGame(options = {}) {
    try {
      if (this.hasAbandonableGame() && !options.skipAbandonTracking) {
        this.stats.recordAbandon();
      }

      const baseSettings = this.settings.get();
      const runtimeSettings = {
        ...baseSettings,
        ...(options.gameOverrides || {}),
      };
      const puzzle = this.engine.createPuzzle(runtimeSettings);

      this.stats.recordGameStart();
      this.state.startGame(puzzle, {
        maxHints: HINT_CHARGES[puzzle.timerMode] ?? HINT_CHARGES.timed,
      });

      if (puzzle.timerMode === 'timed') {
        this.timer.start(0);
      } else {
        this.timer.reset();
      }

      this.lastPersistedSecond = 0;
      this.renderer.hideModal();
      this.persistAll();
      this.render();
      this.renderer.showToast(options.toastMessage || 'Nueva sopa generada');
      this.trackEvent('game_start', {
        categoryId: puzzle.categoryId,
        difficultyId: puzzle.difficultyId,
        playMode: puzzle.playMode,
        timerMode: puzzle.timerMode,
        seed: puzzle.seed,
        rankedDaily: puzzle.isRankedDaily,
      });
    } catch (error) {
      console.error(error);
      this.renderer.showToast('No se pudo generar el tablero.', 'error');
      this.trackEvent('game_start_failed', {
        message: error.message,
      });
    }
  }

  continueGame() {
    if (!this.state.currentGame) {
      return;
    }

    this.state.setScreen('game');

    if (this.state.currentGame.paused && this.state.currentGame.pauseReason === 'screen') {
      this.state.resume();

      if (this.state.currentGame.puzzle.timerMode === 'timed') {
        this.timer.resume();
      }
    }

    this.render();
  }

  restartGame() {
    if (!this.state.currentGame) {
      this.startNewGame();
      return;
    }

    if (this.hasAbandonableGame()) {
      this.stats.recordAbandon();
    }

    const puzzle = this.state.currentGame.puzzle;

    this.stats.recordGameStart();
    this.state.startGame(puzzle, {
      maxHints: HINT_CHARGES[puzzle.timerMode] ?? HINT_CHARGES.timed,
    });

    if (puzzle.timerMode === 'timed') {
      this.timer.start(0);
    } else {
      this.timer.reset();
    }

    this.lastPersistedSecond = 0;
    this.renderer.hideModal();
    this.persistAll();
    this.render();
    this.renderer.showToast('Partida reiniciada');
    this.trackEvent('game_restart', {
      categoryId: puzzle.categoryId,
      difficultyId: puzzle.difficultyId,
      playMode: puzzle.playMode,
      timerMode: puzzle.timerMode,
      rankedDaily: puzzle.isRankedDaily,
    });
  }

  togglePause() {
    if (!this.state.currentGame || this.state.currentGame.completed) {
      return;
    }

    if (this.state.currentGame.paused) {
      this.state.resume();

      if (this.state.currentGame.puzzle.timerMode === 'timed') {
        this.timer.resume();
      }
    } else {
      this.state.pause('user');

      if (this.state.currentGame.puzzle.timerMode === 'timed') {
        this.timer.pause();
      }
    }

    this.persistGame();
    this.render();
  }

  openHome() {
    if (this.state.currentGame && !this.state.currentGame.paused && !this.state.currentGame.completed) {
      this.state.pause('screen');

      if (this.state.currentGame.puzzle.timerMode === 'timed') {
        this.timer.pause();
      }
    }

    this.state.setScreen('home');
    this.state.setSettingsPanelOpen(false);
    this.persistGame();
    this.render();
  }

  toggleSettingsPanel() {
    if (this.state.screen !== 'game') {
      return;
    }

    this.state.setSettingsPanelOpen(!this.state.settingsPanelOpen);
    this.render();
  }

  handleSelection(cells) {
    if (!this.state.currentGame || this.state.currentGame.paused || this.state.currentGame.completed) {
      return;
    }

    const match = this.engine.matchSelection(
      this.state.currentGame.puzzle,
      cells,
      this.state.currentGame.foundWordIds,
    );

    if (!match) {
      this.applyFeedback({
        cells,
        tone: 'error',
        message: 'La seleccion no coincide con una palabra.',
      });
      return;
    }

    const wasMarked = this.state.markWordFound(match.id);

    if (!wasMarked) {
      return;
    }

    this.applyFeedback({
      cells: match.cells,
      tone: 'success',
      message: `${match.word} encontrada.`,
    });

    if (this.state.currentGame.completed) {
      this.completeCurrentGame();
      return;
    }

    this.persistAll();
    this.render();
  }

  completeCurrentGame() {
    const currentGame = this.state.currentGame;

    if (!currentGame) {
      return;
    }

    const puzzle = currentGame.puzzle;
    const elapsedMs = puzzle.timerMode === 'timed' ? this.timer.getElapsedMs() : null;

    if (puzzle.timerMode === 'timed') {
      this.timer.pause();
    }

    this.stats.recordGameComplete({
      categoryId: puzzle.categoryId,
      difficultyId: puzzle.difficultyId,
      timeMs: elapsedMs,
      timerMode: puzzle.timerMode,
    });

    if (puzzle.isRankedDaily && puzzle.dailyChallengeDateKey === this.getTodayKey()) {
      this.stats.recordDailyComplete({
        dateKey: puzzle.dailyChallengeDateKey,
        seed: puzzle.seed,
        categoryId: puzzle.categoryId,
        difficultyId: puzzle.difficultyId,
        timerMode: puzzle.timerMode,
        timeMs: elapsedMs,
      });
    }

    this.persistSettings();
    this.persistStats();
    this.storage.clearGame();
    this.render();

    const bestTimeEntry = this.stats.getBestTime(puzzle.categoryId, puzzle.difficultyId);
    const dailySummary = this.getDailySummary();
    this.renderer.showVictoryModal({
      elapsedLabel: puzzle.timerMode === 'timed' ? formatTime(elapsedMs) : 'Modo Zen',
      wordCount: puzzle.placedWords.length,
      categoryLabel: puzzle.categoryLabel,
      difficultyLabel: puzzle.difficultyLabel,
      streak: puzzle.isRankedDaily ? dailySummary.currentStreak : this.stats.get().winStreak,
      streakLabel: puzzle.isRankedDaily ? 'Racha diaria' : 'Racha actual',
      isBestTime: puzzle.timerMode === 'timed' && bestTimeEntry?.timeMs === elapsedMs,
      modeLabel: this.getModeLabel(puzzle),
      canShare: true,
    });
    this.nativeBridge.requestPlacement('victory', {
      categoryId: puzzle.categoryId,
      difficultyId: puzzle.difficultyId,
      playMode: puzzle.playMode,
      timerMode: puzzle.timerMode,
      rankedDaily: puzzle.isRankedDaily,
    });
    this.trackEvent('game_complete', {
      categoryId: puzzle.categoryId,
      difficultyId: puzzle.difficultyId,
      playMode: puzzle.playMode,
      timerMode: puzzle.timerMode,
      elapsedMs,
      rankedDaily: puzzle.isRankedDaily,
      dailyStreak: puzzle.isRankedDaily ? dailySummary.currentStreak : null,
    });
  }

  async useHint() {
    const currentGame = this.state.currentGame;

    if (!currentGame || currentGame.paused || currentGame.completed) {
      return;
    }

    if (this.state.getRemainingHints() <= 0) {
      const rewarded = await this.requestRewardedHint();

      if (!rewarded) {
        return;
      }

      this.state.grantBonusHint(1);
      this.persistGame();
      this.render();
    }

    const hint = this.engine.getHint(
      currentGame.puzzle,
      currentGame.foundWordIds,
      currentGame.hintedWordIds,
    );

    if (!hint) {
      this.renderer.showToast('No hay mas palabras para sugerir.', 'info');
      return;
    }

    this.state.registerHint(hint.wordId);
    this.applyFeedback({
      cells: hint.cells,
      tone: 'hint',
      message: `Pista: ${hint.word} empieza por aqui.`,
    });
    this.persistAll();
    this.trackEvent('hint_used', {
      categoryId: currentGame.puzzle.categoryId,
      difficultyId: currentGame.puzzle.difficultyId,
      wordId: hint.wordId,
      remainingHints: this.state.getRemainingHints(),
      rankedDaily: currentGame.puzzle.isRankedDaily,
    });
  }

  async requestRewardedHint() {
    const currentGame = this.state.currentGame;

    if (!currentGame || !this.canEarnRewardedHint()) {
      this.renderer.showToast('No hay mas pistas disponibles.', 'error');
      return false;
    }

    const shouldResumeTimer = currentGame.puzzle.timerMode === 'timed' && !currentGame.paused;

    if (shouldResumeTimer) {
      this.timer.pause();
    }

    this.trackEvent('reward_hint_requested', {
      categoryId: currentGame.puzzle.categoryId,
      difficultyId: currentGame.puzzle.difficultyId,
      rankedDaily: currentGame.puzzle.isRankedDaily,
    });

    const result = await this.nativeBridge.requestReward(REWARDED_HINT_PLACEMENT, {
      categoryId: currentGame.puzzle.categoryId,
      difficultyId: currentGame.puzzle.difficultyId,
      playMode: currentGame.puzzle.playMode,
      timerMode: currentGame.puzzle.timerMode,
      seed: currentGame.puzzle.seed,
    });

    if (shouldResumeTimer) {
      this.timer.resume();
    }

    if (!result.granted) {
      this.renderer.showToast('La recompensa no fue completada.', 'error');
      this.trackEvent('reward_hint_denied', {
        categoryId: currentGame.puzzle.categoryId,
        difficultyId: currentGame.puzzle.difficultyId,
      });
      return false;
    }

    this.renderer.showToast('Pista extra desbloqueada');
    this.trackEvent('reward_hint_granted', {
      categoryId: currentGame.puzzle.categoryId,
      difficultyId: currentGame.puzzle.difficultyId,
    });
    return true;
  }

  canEarnRewardedHint() {
    return this.nativeBridge.hasRewardedPlacement();
  }

  async shareCurrentGame() {
    const currentGame = this.state.currentGame;

    if (!currentGame) {
      return;
    }

    try {
      const sharePayload = this.buildSharePayload(currentGame);
      const result = await this.nativeBridge.share(sharePayload);

      if (result.method === 'clipboard') {
        this.renderer.showToast('Seed copiada al portapapeles');
      } else if (result.method === 'unavailable') {
        this.renderer.showToast('No se encontro un canal de share en este entorno.', 'error');
      } else {
        this.renderer.showToast('Partida preparada para compartir');
      }

      this.trackEvent('share_seed', {
        categoryId: currentGame.puzzle.categoryId,
        difficultyId: currentGame.puzzle.difficultyId,
        playMode: currentGame.puzzle.playMode,
        timerMode: currentGame.puzzle.timerMode,
        method: result.method,
      });
    } catch (error) {
      console.error(error);
      this.renderer.showToast('No se pudo compartir la seed.', 'error');
    }
  }

  handleTimerTick(elapsedMs) {
    this.renderer.updateTimer(elapsedMs);

    if (!this.state.currentGame || this.state.currentGame.paused || this.state.currentGame.completed) {
      return;
    }

    if (this.state.currentGame.puzzle.timerMode !== 'timed') {
      return;
    }

    const secondMark = Math.floor(elapsedMs / 1000);

    if (secondMark !== this.lastPersistedSecond) {
      this.lastPersistedSecond = secondMark;
      this.persistGame();
    }
  }

  applyFeedback({ cells, tone, message }) {
    this.hostWindow.clearTimeout(this.feedbackTimeoutId);
    this.state.setFeedback({ tone, message });
    this.renderer.flashSelection(cells, tone);

    if (navigator.vibrate) {
      if (tone === 'success') {
        navigator.vibrate(18);
      } else if (tone === 'hint') {
        navigator.vibrate([10, 22, 10]);
      } else {
        navigator.vibrate([12, 24, 12]);
      }
    }

    this.render();

    this.feedbackTimeoutId = this.hostWindow.setTimeout(() => {
      this.state.clearFeedback();
      this.render();
    }, FEEDBACK_DURATION_MS);
  }

  resumeSavedGame(savedGame) {
    this.state.loadGame(savedGame);
    this.state.setScreen('game');
    this.state.setSettings(this.settings.get());

    if (savedGame.puzzle?.timerMode === 'timed') {
      this.timer.start(savedGame.timer?.elapsedMs || 0);

      if (savedGame.paused || savedGame.completed || savedGame.timer?.running === false) {
        this.timer.pause();
      }
    } else {
      this.timer.reset();
    }

    this.lastPersistedSecond = Math.floor((savedGame.timer?.elapsedMs || 0) / 1000);
    this.render();
  }

  handleModalHome() {
    this.openHome();
  }

  handleModalNew() {
    this.startNewGame();
  }

  handleModalRestart() {
    this.restartGame();
  }

  async addPackSource(sourceUrl) {
    const trimmedSource = String(sourceUrl || '').trim();

    if (!trimmedSource) {
      this.renderer.showToast('Ingresa una URL o ruta JSON valida.', 'error');
      return;
    }

    await this.reloadContentSources(
      [
        ...this.settings.get().externalPackUrls,
        trimmedSource,
      ],
      this.settings.get().inactiveSourceIds,
      {
        showSuccessToast: true,
        successMessage: 'Pack cargado',
        showErrorsAsToast: true,
      },
    );
  }

  async clearPackSources() {
    const manifestInactiveIds = this.settings.get().inactiveSourceIds.filter((sourceId) => {
      const source = this.contentManager.getSources().find((candidate) => candidate.id === sourceId);
      return source?.sourceKind === 'manifest';
    });

    await this.reloadContentSources([], manifestInactiveIds, {
      showSuccessToast: true,
      successMessage: 'Fuentes remotas limpiadas',
      showErrorsAsToast: false,
    });
  }

  async toggleSource(sourceId) {
    const source = this.contentManager.getSources().find((candidate) => candidate.id === sourceId);

    if (!source?.isToggleable) {
      return;
    }

    const inactiveIds = new Set(this.settings.get().inactiveSourceIds);

    if (inactiveIds.has(sourceId)) {
      inactiveIds.delete(sourceId);
    } else {
      inactiveIds.add(sourceId);
    }

    await this.reloadContentSources(
      this.settings.get().externalPackUrls,
      [...inactiveIds],
      {
        showSuccessToast: true,
        successMessage: source.isActive ? 'Fuente pausada' : 'Fuente activada',
        showErrorsAsToast: true,
      },
    );
  }

  async removeSource(sourceId) {
    const source = this.contentManager.getSources().find((candidate) => candidate.id === sourceId);

    if (!source?.isRemovable) {
      return;
    }

    const nextUrls = this.settings.get().externalPackUrls.filter((url) => url !== source.sourceUrl);
    const nextInactiveIds = this.settings.get().inactiveSourceIds.filter((id) => id !== sourceId);

    await this.reloadContentSources(nextUrls, nextInactiveIds, {
      showSuccessToast: true,
      successMessage: 'Fuente eliminada',
      showErrorsAsToast: false,
    });
  }

  async reloadContentSources(candidateUrls, candidateInactiveIds = [], options = {}) {
    const result = await this.contentManager.loadExternalSources(candidateUrls, candidateInactiveIds);
    const validSourceIds = new Set(result.sources.filter((source) => source.isToggleable).map((source) => source.id));
    const successfulExternalUrls = uniqueStrings(candidateUrls).filter((sourceUrl) => (
      result.sources.some((source) => source.sourceUrl === sourceUrl)
    ));
    const persistedInactiveIds = uniqueStrings(candidateInactiveIds).filter((sourceId) => validSourceIds.has(sourceId));

    this.settings.update({
      externalPackUrls: successfulExternalUrls,
      inactiveSourceIds: persistedInactiveIds,
    });
    this.settings.update(this.getValidatedSettings(this.settings.get()));
    this.syncDailySeedSetting();
    this.state.setSettings(this.settings.get());
    this.persistSettings();
    this.render();

    if (options.showSuccessToast) {
      this.renderer.showToast(options.successMessage || 'Fuentes de contenido actualizadas');
    }

    if (options.showErrorsAsToast && result.errors.length > 0) {
      this.renderer.showToast(`Fallaron ${result.errors.length} fuentes de packs.`, 'error');
    }

    this.trackEvent('pack_sources_updated', {
      loadedSources: result.sources.length - 1,
      failedSources: result.errors.length,
      userSources: successfulExternalUrls.length,
      inactiveSources: persistedInactiveIds.length,
    });

    return result;
  }

  render() {
    const todayKey = this.getTodayKey();
    const settings = this.settings.get();
    const statsSnapshot = this.stats.get(todayKey);
    const dailySummary = statsSnapshot.dailySummary;
    const snapshot = {
      screen: this.state.screen,
      settingsPanelOpen: this.state.settingsPanelOpen,
      currentGame: this.state.currentGame,
      canContinue: this.state.canContinue(),
      remainingHints: this.state.getRemainingHints(),
      canEarnRewardedHint: this.canEarnRewardedHint(),
      dailyAction: this.getDailyActionState(dailySummary),
    };
    const bestTimeEntry = settings.timerMode === 'timed'
      ? this.stats.getBestTime(settings.category, settings.difficulty)
      : null;

    this.themeManager.apply(settings.theme);
    this.renderer.render({
      state: snapshot,
      settings,
      stats: statsSnapshot,
      dailySummary,
      categories: this.contentManager.getCategories(),
      sources: this.contentManager.getSources(),
      difficulties: this.engine.getDifficulties(),
      playModes: PLAY_MODE_OPTIONS,
      timerModes: TIMER_MODE_OPTIONS,
      elapsedMs: this.timer.getElapsedMs(),
      bestTimeMs: bestTimeEntry?.timeMs ?? null,
    });
  }

  getDailyActionState(dailySummary) {
    if (this.getInProgressRankedDaily()) {
      return {
        label: 'Continuar diario',
        disabled: false,
      };
    }

    if (dailySummary.completedToday) {
      return {
        label: 'Diario completado',
        disabled: true,
      };
    }

    return {
      label: 'Desafio diario',
      disabled: false,
    };
  }

  getValidatedSettings(candidateSettings) {
    const category = this.contentManager.getCategory(candidateSettings.category).id;
    const difficulty = this.contentManager.getDifficulty(candidateSettings.difficulty).id;

    return {
      ...candidateSettings,
      category,
      difficulty,
    };
  }

  getTodayKey() {
    return getDateKey(new Date());
  }

  getDailySummary() {
    return this.stats.get(this.getTodayKey()).dailySummary;
  }

  getInProgressRankedDaily() {
    return this.state.currentGame
      && !this.state.currentGame.completed
      && this.state.currentGame.puzzle?.isRankedDaily
      && this.state.currentGame.puzzle?.dailyChallengeDateKey === this.getTodayKey()
      ? this.state.currentGame
      : null;
  }

  syncDailySeedSetting() {
    const currentSettings = this.settings.get();

    if (currentSettings.playMode !== 'daily' || this.bootstrapOptions.hasExplicitShareConfig) {
      return;
    }

    this.settings.update({
      customSeed: this.contentManager.getDailySeed(
        currentSettings.category,
        currentSettings.difficulty,
      ),
    });
  }

  hasAbandonableGame() {
    return Boolean(this.state.currentGame && !this.state.currentGame.completed);
  }

  isGameSnapshotValid(snapshot) {
    return Boolean(
      snapshot
      && snapshot.puzzle
      && Array.isArray(snapshot.puzzle.grid)
      && Array.isArray(snapshot.puzzle.placedWords)
      && snapshot.puzzle.seed,
    );
  }

  shouldRestoreSavedGame(snapshot) {
    if (!this.isGameSnapshotValid(snapshot)) {
      return false;
    }

    if (snapshot.puzzle?.isRankedDaily && snapshot.puzzle?.dailyChallengeDateKey !== this.getTodayKey()) {
      return false;
    }

    return true;
  }

  buildSharePayload(currentGame) {
    const puzzle = currentGame.puzzle;
    const url = new URL(this.hostWindow.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('category', puzzle.categoryId);
    url.searchParams.set('difficulty', puzzle.difficultyId);
    url.searchParams.set('seed', puzzle.seed);
    url.searchParams.set('playMode', puzzle.playMode);
    url.searchParams.set('timerMode', puzzle.timerMode);

    this.getSharePackUrls(puzzle).forEach((packUrl) => {
      url.searchParams.append('pack', packUrl);
    });

    const elapsedLabel = puzzle.timerMode === 'timed'
      ? formatTime(this.timer.getElapsedMs())
      : 'Modo Zen';
    const title = puzzle.isRankedDaily
      ? 'Desafio diario de Sopa Infinita'
      : puzzle.playMode === 'daily'
        ? 'Seed diaria de Sopa Infinita'
        : 'Seed de Sopa Infinita';
    const textLines = [
      `${puzzle.categoryLabel} · ${puzzle.difficultyLabel}`,
      this.getModeLabel(puzzle),
      `Seed: ${puzzle.seed}`,
      currentGame.completed ? `Resultado: ${elapsedLabel}` : null,
    ].filter(Boolean);

    return {
      title,
      text: textLines.join('\n'),
      url: url.toString(),
    };
  }

  getSharePackUrls(puzzle) {
    const configuredUrls = this.settings.get().externalPackUrls;
    const puzzleSourceUrl = puzzle.categorySourceUrl ? [puzzle.categorySourceUrl] : [];
    return uniqueStrings([...configuredUrls, ...puzzleSourceUrl]);
  }

  getBootstrapOptions() {
    const url = new URL(this.hostWindow.location.href);
    const params = url.searchParams;
    const packUrls = uniqueStrings([
      ...params.getAll('pack'),
      ...String(params.get('packs') || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ]);
    const settingsPatch = {};

    if (params.get('category')) {
      settingsPatch.category = params.get('category');
    }

    if (params.get('difficulty')) {
      settingsPatch.difficulty = params.get('difficulty');
    }

    if (params.get('seed')) {
      settingsPatch.customSeed = params.get('seed');
    }

    if (params.get('playMode')) {
      settingsPatch.playMode = params.get('playMode');
    }

    if (params.get('timerMode')) {
      settingsPatch.timerMode = params.get('timerMode');
    }

    const hasExplicitShareConfig = Boolean(
      params.get('seed')
      || params.get('category')
      || params.get('difficulty')
      || params.get('playMode')
      || params.get('timerMode')
      || packUrls.length > 0,
    );

    return {
      settingsPatch,
      packUrls,
      shouldAutoStart: params.get('start') === '1',
      hasExplicitShareConfig,
    };
  }

  getModeLabel(puzzle) {
    const playLabel = puzzle.playMode === 'daily' ? 'Diaria' : 'Clasica';
    const timerLabel = puzzle.timerMode === 'zen' ? 'Zen' : 'Crono';
    return `${playLabel} · ${timerLabel}`;
  }

  trackEvent(name, payload = {}) {
    this.nativeBridge.trackEvent(name, payload);
  }

  persistSettings() {
    this.storage.saveSettings(this.settings.get());
  }

  persistStats() {
    this.storage.saveStats(this.stats.serialize());
  }

  persistGame() {
    const snapshot = this.state.serialize(this.timer.serialize());

    if (snapshot && !snapshot.completed) {
      this.storage.saveGame(snapshot);
      return;
    }

    this.storage.clearGame();
  }

  persistAll() {
    this.persistSettings();
    this.persistStats();
    this.persistGame();
  }
}

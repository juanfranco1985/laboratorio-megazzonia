import {
  ACTION_MODES,
  GAME_STATUS,
  SAVE_THROTTLE_MS,
  VIBRATION_PATTERNS,
} from "./utils/constants.js";
import {
  buildCustomHint,
  describeDifficulty,
  isSessionInProgress,
} from "./utils/helpers.js";
import { buildChallengeCode, normalizeSeedInput, parseChallengeCode } from "./core/ChallengeCodec.js";
import { MinesweeperEngine } from "./core/MinesweeperEngine.js";
import { NativeBridge } from "./core/NativeBridge.js";
import { sanitizeSettings } from "./core/Settings.js";
import {
  createEmptyStats,
  recordGameResult,
  recordGameStarted,
} from "./core/StatsTracker.js";
import { StorageManager } from "./core/Storage.js";
import { GameTimer } from "./core/Timer.js";
import { resolveDifficultyConfig, validateCustomConfig } from "./core/Validator.js";
import { BoardView } from "./ui/BoardView.js";
import { ControlsView } from "./ui/ControlsView.js";
import { HUDView } from "./ui/HUDView.js";
import { ModalView } from "./ui/ModalView.js";
import { Renderer } from "./ui/Renderer.js";
import { StatsView } from "./ui/StatsView.js";
import { ThemeManager } from "./ui/ThemeManager.js";

const storage = new StorageManager();
const nativeBridge = new NativeBridge();

let settings = storage.loadSettings();
let stats = storage.loadStats();
let lastSessionSaveAt = 0;

const engine = new MinesweeperEngine(settings.actionMode);
const modalRoot = document.getElementById("modalRoot");

const boardView = new BoardView(document.getElementById("boardContainer"));
const hudView = new HUDView({
  difficulty: document.getElementById("hudDifficulty"),
  mines: document.getElementById("hudMines"),
  auxLabel: document.getElementById("hudAuxLabel"),
  auxValue: document.getElementById("hudAuxValue"),
  sessionState: document.getElementById("hudSessionState"),
  sessionSeedValue: document.getElementById("sessionSeedValue"),
  copyChallengeButton: document.getElementById("copyChallengeBtn"),
  shareChallengeButton: document.getElementById("shareChallengeBtn"),
  pauseButton: document.getElementById("pauseBtn"),
  quickRestartButton: document.getElementById("quickRestartBtn"),
  quickNewButton: document.getElementById("quickNewBtn"),
});
const controlsView = new ControlsView({
  difficultyRoot: document.getElementById("difficultyOptions"),
  customFields: document.getElementById("customFields"),
  rowsInput: document.getElementById("customRowsInput"),
  colsInput: document.getElementById("customColsInput"),
  minesInput: document.getElementById("customMinesInput"),
  controlHint: document.getElementById("controlHint"),
  themeRoot: document.getElementById("themeOptions"),
  actionModeRoot: document.getElementById("actionModeOptions"),
  actionModeMirrorRoot: document.getElementById("actionModeMirror"),
  zenToggle: document.getElementById("zenModeToggle"),
  seedInput: document.getElementById("seedInput"),
  seedHint: document.getElementById("seedHint"),
  clearSeedButton: document.getElementById("clearSeedBtn"),
  startButton: document.getElementById("startGameBtn"),
  restartButton: document.getElementById("restartCurrentBtn"),
  continueButton: document.getElementById("continueSessionBtn"),
  resetStatsButton: document.getElementById("resetStatsBtn"),
});
const statsView = new StatsView(
  document.getElementById("statsSummary"),
  document.getElementById("statsBestTimes"),
);
const modalView = new ModalView(modalRoot);
const renderer = new Renderer({
  appRoot: document.getElementById("appRoot"),
  emptyState: document.getElementById("emptyState"),
  gameArea: document.getElementById("gameArea"),
  boardStatus: document.getElementById("boardStatus"),
  boardView,
  hudView,
  controlsView,
  statsView,
});
const themeManager = new ThemeManager(
  document.documentElement,
  document.querySelector('meta[name="theme-color"]'),
);

const timer = new GameTimer((elapsedMs) => {
  const result = engine.setElapsedMs(elapsedMs);

  if (!result.state) {
    return;
  }

  renderer.updateTimer(result.state);
  persistSession(false);
});

function emitNative(eventName, extraPayload = {}) {
  const state = engine.getState();
  const preferredSeed =
    state?.seed ?? state?.requestedSeed ?? normalizeSeedInput(settings.seedInput);

  nativeBridge.emit(eventName, {
    gameId: state?.gameId ?? null,
    difficultyId: state?.config?.id ?? settings.difficulty,
    zenMode: Boolean(state?.config?.zenMode ?? settings.zenMode),
    seed: preferredSeed || null,
    challengeCode: buildChallengeCode(state) || null,
    elapsedMs: state?.elapsedMs ?? 0,
    ...extraPayload,
  });
}

function vibrate(pattern) {
  nativeBridge.vibrate(pattern);
}

function getLaunchRequest() {
  const seedInput = normalizeSeedInput(settings.seedInput);
  const parsedChallenge = parseChallengeCode(seedInput);

  if (parsedChallenge) {
    return {
      difficultyId: parsedChallenge.difficultyId,
      customConfig: parsedChallenge.customConfig,
      actionMode: settings.actionMode,
      zenMode: parsedChallenge.zenMode,
      seedInput: parsedChallenge.seed,
      plannedOpeningCell: parsedChallenge.openingCell,
      challengeCode: seedInput,
    };
  }

  return {
    difficultyId: settings.difficulty,
    customConfig: settings.custom,
    actionMode: settings.actionMode,
    zenMode: settings.zenMode,
    seedInput,
    plannedOpeningCell: null,
    challengeCode: null,
  };
}

function getHintMessage() {
  const parsedChallenge = parseChallengeCode(settings.seedInput);

  if (parsedChallenge) {
    return `Codigo cargado: ${parsedChallenge.customConfig.rows}x${parsedChallenge.customConfig.cols} - ${parsedChallenge.customConfig.mines} minas. La apertura original se reproducira sola.`;
  }

  if (settings.difficulty === "custom") {
    const validation = validateCustomConfig(settings.custom);
    const prefix = validation.issues[0] ?? buildCustomHint(validation.normalized);
    return `${prefix} Zona segura inicial incluida.`;
  }

  const config = resolveDifficultyConfig(settings.difficulty, settings.custom);
  const zenNote = settings.zenMode ? " Modo zen activo." : "";
  return `${config.label}: ${describeDifficulty(config)}.${zenNote}`;
}

function getSeedHintMessage() {
  const seedInput = normalizeSeedInput(settings.seedInput);

  if (!seedInput) {
    return "Seed vacia: cada partida se genera de forma aleatoria.";
  }

  const parsedChallenge = parseChallengeCode(seedInput);

  if (parsedChallenge) {
    return `Codigo detectado: reproduce dificultad, seed y apertura ${parsedChallenge.openingCell.row + 1}-${parsedChallenge.openingCell.col + 1}.`;
  }

  return "Seed manual: el mismo seed reproduce el mismo tablero si se usa la misma apertura segura.";
}

function render() {
  const state = engine.getState();
  renderer.render({
    gameState: state,
    settings,
    stats,
    hasSavedSession: Boolean(storage.loadSession()),
    hintMessage: getHintMessage(),
    seedHintMessage: getSeedHintMessage(),
  });
}

function persistSession(force = true) {
  const state = engine.getState();

  if (!state || !isSessionInProgress(state)) {
    storage.clearSession();
    return;
  }

  if (!force && Date.now() - lastSessionSaveAt < SAVE_THROTTLE_MS) {
    return;
  }

  storage.saveSession(state);
  lastSessionSaveAt = Date.now();
}

function syncTimerToState() {
  const state = engine.getState();

  if (!state) {
    timer.stop(0);
    return;
  }

  if (state.config.zenMode) {
    if (timer.isRunning()) {
      timer.stop(state.elapsedMs);
    }
    return;
  }

  const shouldRun =
    state.generated && !state.isPaused && state.status === GAME_STATUS.playing;

  if (shouldRun) {
    if (!timer.isRunning()) {
      timer.start(state.elapsedMs);
    }
    return;
  }

  if (timer.isRunning()) {
    const elapsedMs = timer.pause();
    engine.setElapsedMs(elapsedMs);
  }
}

function hideModal() {
  modalView.hide();
}

function showPauseModal(autoPaused = false) {
  const state = engine.getState();
  const body = state?.config?.zenMode
    ? "Modo zen pausado. El tablero queda bloqueado, sin cronometro en marcha, hasta reanudar."
    : autoPaused
      ? "La sesion se detuvo al perder foco para evitar toques accidentales y congelar el cronometro."
      : "El tablero queda bloqueado y el cronometro se mantiene detenido hasta reanudar.";

  modalView.show({
    title: autoPaused ? "Pausa automatica" : "Partida en pausa",
    body,
    actions: [
      {
        id: "resume",
        label: "Reanudar",
        variant: "primary-button",
        handler: () => {
          hideModal();
          applyEngineResult(engine.resumeGame());
        },
      },
      {
        id: "restart",
        label: "Reiniciar",
        variant: "secondary-button",
        handler: () => {
          hideModal();
          restartCurrentGame();
        },
      },
      {
        id: "new",
        label: "Nueva partida",
        variant: "secondary-button",
        handler: () => {
          hideModal();
          startGameFromSettings();
        },
      },
    ],
  });
}

function showOutcomeModal(kind) {
  const state = engine.getState();

  if (!state) {
    return;
  }

  const didWin = kind === "won";
  const body = didWin
    ? state.config.zenMode
      ? `Resolviste ${state.config.label.toLowerCase()} en zen. Minas detectadas: ${state.zenMistakes}.`
      : `Ganaste ${state.config.label.toLowerCase()} en ${Math.floor(
          state.elapsedMs / 1000,
        )} segundos.`
    : "La jugada revelo una mina. Podes reintentar la misma configuracion o cambiar la dificultad.";

  modalView.show({
    title: didWin ? "Tablero resuelto" : "Mina detectada",
    body,
    actions: [
      {
        id: "restart",
        label: "Reintentar",
        variant: "primary-button",
        handler: () => {
          hideModal();
          restartCurrentGame();
        },
      },
      {
        id: "new",
        label: "Nueva partida",
        variant: "secondary-button",
        handler: () => {
          hideModal();
          startGameFromSettings();
        },
      },
      {
        id: "close",
        label: "Cerrar",
        variant: "ghost-button",
        handler: hideModal,
      },
    ],
  });
}

function showResetStatsModal() {
  modalView.show({
    title: "Resetear estadisticas",
    body: "Se eliminaran partidas, rachas y mejores tiempos guardados localmente.",
    actions: [
      {
        id: "confirm",
        label: "Resetear",
        variant: "primary-button",
        handler: () => {
          stats = createEmptyStats();
          storage.saveStats(stats);
          hideModal();
          emitNative("stats-reset");
          render();
        },
      },
      {
        id: "cancel",
        label: "Cancelar",
        variant: "secondary-button",
        handler: hideModal,
      },
    ],
  });
}

function showChallengeFallbackModal(code) {
  modalView.show({
    title: "Codigo de partida",
    body: code,
    actions: [
      {
        id: "close",
        label: "Cerrar",
        variant: "primary-button",
        handler: hideModal,
      },
    ],
  });
}

function handleGameEvents(events) {
  const state = engine.getState();

  for (const event of events) {
    if (event === "game-started" && state) {
      stats = recordGameStarted(stats, state.config.id);
      storage.saveStats(stats);
      emitNative("game-started", {
        openingCell: state.openingCell,
      });
      continue;
    }

    if (event === "game-won" && state) {
      stats = recordGameResult(stats, state.config.id, true, state.elapsedMs, {
        trackBestTime: !state.config.zenMode,
      });
      storage.saveStats(stats);
      storage.clearSession();
      vibrate(VIBRATION_PATTERNS.win);
      emitNative("game-won", {
        zenMistakes: state.zenMistakes,
      });
      showOutcomeModal("won");
      continue;
    }

    if (event === "game-lost" && state) {
      stats = recordGameResult(stats, state.config.id, false, state.elapsedMs);
      storage.saveStats(stats);
      storage.clearSession();
      vibrate(VIBRATION_PATTERNS.lose);
      emitNative("game-lost");
      showOutcomeModal("lost");
      continue;
    }

    if (event === "flag-toggled") {
      vibrate(VIBRATION_PATTERNS.flag);
      emitNative("flag-toggled");
      continue;
    }

    if (event === "zen-mine-resolved" && state) {
      vibrate(VIBRATION_PATTERNS.zenMine);
      emitNative("zen-mine-resolved", {
        zenMistakes: state.zenMistakes,
      });
      continue;
    }

    if (event === "chord-used") {
      emitNative("chord-used");
    }
  }
}

function applyEngineResult(result) {
  if (!result.changed && result.events.length === 0) {
    return;
  }

  syncTimerToState();
  handleGameEvents(result.events);
  persistSession(true);
  render();

  if (result.state?.isPaused) {
    showPauseModal();
  }
}

function runPlannedOpeningIfNeeded() {
  if (engine.hasPlannedOpening()) {
    applyEngineResult(engine.playPlannedOpening());
  }
}

function startGameFromSettings() {
  hideModal();

  const launchRequest = getLaunchRequest();

  applyEngineResult(engine.startNewGame(launchRequest));

  if (launchRequest.challengeCode) {
    emitNative("challenge-imported", {
      challengeCode: launchRequest.challengeCode,
      openingCell: launchRequest.plannedOpeningCell,
    });
  }

  runPlannedOpeningIfNeeded();
}

function restartCurrentGame() {
  hideModal();
  applyEngineResult(engine.restartCurrentGame(settings.actionMode));
  runPlannedOpeningIfNeeded();
}

function updateSettings(nextSettings) {
  settings = sanitizeSettings(nextSettings);
  storage.saveSettings(settings);
  themeManager.setPreference(settings.theme);
  render();
}

function handlePrimaryAction(row, col) {
  const state = engine.getState();

  if (!state) {
    return;
  }

  if (state.selectedAction === ACTION_MODES.flag) {
    applyEngineResult(engine.toggleFlag(row, col));
    return;
  }

  applyEngineResult(engine.revealCell(row, col));
}

function handleSecondaryAction(row, col) {
  applyEngineResult(engine.toggleFlag(row, col));
}

async function copyCurrentChallengeCode() {
  const code = buildChallengeCode(engine.getState());

  if (!code) {
    return "";
  }

  try {
    if (nativeBridge.copyText("Codigo de Buscaminas", code)) {
      nativeBridge.showToast("Codigo copiado");
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      nativeBridge.showToast("Codigo copiado");
    } else {
      throw new Error("Clipboard API unavailable");
    }
  } catch {
    showChallengeFallbackModal(code);
  }

  emitNative("challenge-copied", { challengeCode: code });
  return code;
}

async function shareCurrentChallengeCode() {
  const code = buildChallengeCode(engine.getState());

  if (!code) {
    return "";
  }

  const shareText = `Prueba esta partida de Buscaminas Procedural:\n${code}`;

  try {
    if (nativeBridge.shareText("Buscaminas Procedural", shareText)) {
      emitNative("challenge-shared", { challengeCode: code });
      return code;
    }

    if (navigator.share) {
      await navigator.share({
        title: "Buscaminas Procedural",
        text: shareText,
      });
      emitNative("challenge-shared", { challengeCode: code });
      return code;
    }

    throw new Error("Share API unavailable");
  } catch {
    await copyCurrentChallengeCode();
    return code;
  }
}

function importChallengeCode(seedInput) {
  updateSettings({
    ...settings,
    seedInput,
  });
  startGameFromSettings();
}

function handleBackAction() {
  if (!modalRoot.hidden) {
    hideModal();
    return "modal-closed";
  }

  const state = engine.getState();

  if (state && state.status === GAME_STATUS.playing && !state.isPaused) {
    applyEngineResult(engine.pauseGame());
    return "paused";
  }

  return "exit";
}

boardView.bind({
  onPrimaryAction: handlePrimaryAction,
  onSecondaryAction: handleSecondaryAction,
});

hudView.bind({
  onPauseToggle: () => {
    const state = engine.getState();

    if (!state) {
      return;
    }

    if (state.isPaused) {
      hideModal();
      applyEngineResult(engine.resumeGame());
      return;
    }

    applyEngineResult(engine.pauseGame());
  },
  onQuickRestart: restartCurrentGame,
  onQuickNew: startGameFromSettings,
  onCopyChallenge: () => {
    copyCurrentChallengeCode();
  },
  onShareChallenge: () => {
    shareCurrentChallengeCode();
  },
});

controlsView.bind({
  onDifficultyChange: (difficultyId) => {
    updateSettings({
      ...settings,
      difficulty: difficultyId,
    });
  },
  onCustomConfigChange: (customConfig) => {
    updateSettings({
      ...settings,
      custom: customConfig,
    });
  },
  onStartGame: startGameFromSettings,
  onRestartGame: restartCurrentGame,
  onContinueGame: () => {
    const session = storage.loadSession();

    if (!session) {
      render();
      return;
    }

    hideModal();
    applyEngineResult(engine.restoreSession(session));
  },
  onThemeChange: (theme) => {
    updateSettings({
      ...settings,
      theme,
    });
  },
  onActionModeChange: (actionMode) => {
    engine.setActionMode(actionMode);
    updateSettings({
      ...settings,
      actionMode,
    });
  },
  onZenModeToggle: () => {
    updateSettings({
      ...settings,
      zenMode: !settings.zenMode,
    });
  },
  onSeedInputChange: (seedInput) => {
    const normalized = normalizeSeedInput(seedInput);
    const parsedChallenge = parseChallengeCode(normalized);
    const nextSettings = {
      ...settings,
      seedInput: normalized,
    };

    if (parsedChallenge) {
      nextSettings.difficulty = parsedChallenge.difficultyId;
      nextSettings.custom = parsedChallenge.customConfig;
      nextSettings.zenMode = parsedChallenge.zenMode;
    }

    updateSettings(nextSettings);
  },
  onClearSeed: () => {
    updateSettings({
      ...settings,
      seedInput: "",
    });
  },
  onResetStats: showResetStatsModal,
});

document.addEventListener("visibilitychange", () => {
  const state = engine.getState();

  if (
    document.hidden &&
    state &&
    !state.isPaused &&
    state.status === GAME_STATUS.playing
  ) {
    const result = engine.pauseGame();

    if (result.changed) {
      syncTimerToState();
      persistSession(true);
      render();
      showPauseModal(true);
      emitNative("game-paused", { autoPaused: true });
    }
  }
});

window.addEventListener("beforeunload", () => {
  syncTimerToState();
  persistSession(true);
});

window.addEventListener("buscaminas:back", () => {
  handleBackAction();
});

function registerServiceWorker() {
  const canRegister =
    "serviceWorker" in navigator &&
    (window.location.protocol === "http:" || window.location.protocol === "https:");

  if (canRegister) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function bootstrap() {
  themeManager.setPreference(settings.theme);

  const restoredSession = storage.loadSession();

  if (restoredSession && isSessionInProgress(restoredSession)) {
    engine.restoreSession(restoredSession);
  }

  nativeBridge.registerPublicApi({
    getCurrentState: () => engine.getState(),
    getCurrentChallengeCode: () => buildChallengeCode(engine.getState()),
    copyCurrentChallengeCode,
    shareCurrentChallengeCode,
    importChallengeCode,
    pauseGame: () => applyEngineResult(engine.pauseGame()),
    resumeGame: () => applyEngineResult(engine.resumeGame()),
    handleBack: handleBackAction,
  });

  render();
  syncTimerToState();

  if (engine.getState()?.isPaused) {
    showPauseModal(true);
  }

  emitNative("app-ready");
  registerServiceWorker();
}

bootstrap();

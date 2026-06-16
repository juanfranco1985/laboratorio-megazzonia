import { ACTION_MODES, GAME_STATUS } from "../utils/constants.js";
import { formatTime } from "../utils/helpers.js";

function buildBoardStatus(gameState) {
  if (!gameState) {
    return "Elegi una dificultad para iniciar una partida.";
  }

  if (gameState.isPaused) {
    return gameState.config.zenMode
      ? "Partida zen en pausa. El tablero queda congelado hasta reanudar."
      : "Partida pausada. El cronometro queda congelado hasta reanudar.";
  }

  if (gameState.status === GAME_STATUS.ready) {
    if (gameState.plannedOpeningCell) {
      return "Codigo cargado. La apertura original se aplicara automaticamente al iniciar.";
    }

    return "Primer toque protegido. Manten presionado para marcar una bandera.";
  }

  if (gameState.status === GAME_STATUS.won) {
    if (gameState.config.zenMode) {
      return `Tablero zen resuelto. Minas detectadas: ${gameState.zenMistakes}.`;
    }

    return `Tablero resuelto en ${formatTime(gameState.elapsedMs)}.`;
  }

  if (gameState.status === GAME_STATUS.lost) {
    return "La mina activada fue revelada. Podes reiniciar o abrir una nueva partida.";
  }

  if (gameState.config.zenMode) {
    return `Modo zen activo. Minas tocadas se auto-marcan. Errores: ${gameState.zenMistakes}. Tap sobre un numero revelado para chord.`;
  }

  if (gameState.selectedAction === ACTION_MODES.flag) {
    return "Modo bandera activo. Tap sobre numeros revelados para chord si las banderas coinciden.";
  }

  return "Modo revelar activo. Usa pulsacion larga, click derecho o tap sobre numeros revelados para chord.";
}

export class Renderer {
  constructor({
    appRoot,
    emptyState,
    gameArea,
    boardStatus,
    boardView,
    hudView,
    controlsView,
    statsView,
  }) {
    this.appRoot = appRoot;
    this.emptyState = emptyState;
    this.gameArea = gameArea;
    this.boardStatus = boardStatus;
    this.boardView = boardView;
    this.hudView = hudView;
    this.controlsView = controlsView;
    this.statsView = statsView;
  }

  render({
    gameState,
    settings,
    stats,
    hasSavedSession,
    hintMessage,
    seedHintMessage,
  }) {
    const hasGame = Boolean(gameState);

    this.emptyState.hidden = hasGame;
    this.gameArea.hidden = !hasGame;
    this.boardStatus.textContent = buildBoardStatus(gameState);
    this.hudView.update(gameState);
    this.controlsView.update({
      settings,
      gameState,
      hasSavedSession,
      hintMessage,
      seedHintMessage,
    });
    this.statsView.render(stats);

    if (hasGame) {
      this.boardView.render(gameState);
      this.appRoot.dataset.sessionState = gameState.status;
      return;
    }

    this.boardView.clear();
    this.appRoot.dataset.sessionState = "idle";
  }

  updateTimer(gameState) {
    if (gameState) {
      this.hudView.updateTimer(gameState);
    }
  }
}

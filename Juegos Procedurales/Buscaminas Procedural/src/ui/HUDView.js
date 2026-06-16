import { formatTime, getSessionStateLabel, truncateMiddle } from "../utils/helpers.js";

export class HUDView {
  constructor(elements) {
    this.elements = elements;
  }

  bind(handlers) {
    this.elements.pauseButton.addEventListener("click", handlers.onPauseToggle);
    this.elements.quickRestartButton.addEventListener("click", handlers.onQuickRestart);
    this.elements.quickNewButton.addEventListener("click", handlers.onQuickNew);
    this.elements.copyChallengeButton.addEventListener("click", handlers.onCopyChallenge);
    this.elements.shareChallengeButton.addEventListener("click", handlers.onShareChallenge);
  }

  update(state) {
    if (!state) {
      this.elements.difficulty.textContent = "Sin partida";
      this.elements.mines.textContent = "--";
      this.elements.auxLabel.textContent = "Tiempo";
      this.elements.auxValue.textContent = "00:00";
      this.elements.sessionState.textContent = "Listo";
      this.elements.sessionSeedValue.textContent = "Aleatoria";
      this.elements.copyChallengeButton.disabled = true;
      this.elements.shareChallengeButton.disabled = true;
      this.elements.pauseButton.disabled = true;
      this.elements.quickRestartButton.disabled = true;
      return;
    }

    this.elements.difficulty.textContent = state.config.label;
    this.elements.mines.textContent = String(state.mines - state.flagsUsed);
    this.elements.auxLabel.textContent = state.config.zenMode ? "Errores zen" : "Tiempo";
    this.elements.auxValue.textContent = state.config.zenMode
      ? String(state.zenMistakes)
      : formatTime(state.elapsedMs);
    this.elements.sessionState.textContent = getSessionStateLabel(state);
    this.elements.sessionSeedValue.textContent = state.generated
      ? truncateMiddle(state.seed, 30)
      : state.requestedSeed
        ? `Pendiente: ${truncateMiddle(state.requestedSeed, 20)}`
        : "Aleatoria";
    this.elements.copyChallengeButton.disabled = !state.generated || !state.openingCell;
    this.elements.shareChallengeButton.disabled = !state.generated || !state.openingCell;
    this.elements.pauseButton.disabled = state.status === "won" || state.status === "lost";
    this.elements.pauseButton.textContent = state.isPaused ? "Reanudar" : "Pausa";
    this.elements.quickRestartButton.disabled = false;
  }

  updateTimer(state) {
    this.elements.auxLabel.textContent = state.config.zenMode ? "Errores zen" : "Tiempo";
    this.elements.auxValue.textContent = state.config.zenMode
      ? String(state.zenMistakes)
      : formatTime(state.elapsedMs);
  }
}

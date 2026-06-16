import { DIFFICULTY_CONFIG } from "../utils/constants.js";
import { formatTime } from "../utils/helpers.js";

export class ControlsView {
  constructor(container) {
    this.container = container;
  }

  render(snapshot, themeLabel) {
    const game = snapshot.game;
    if (!game) {
      this.container.innerHTML = "";
      return;
    }

    const difficulty = DIFFICULTY_CONFIG[game.difficulty];
    const canEdit = game.selectedIndex !== null && game.selectedIndex >= 0 && game.puzzle[game.selectedIndex] === 0;
    const noteLabel = game.noteMode ? "Notas activas" : "Notas";
    const errorsLabel = snapshot.settings.showErrors ? "Errores visibles" : "Errores ocultos";
    const focusLabel = snapshot.settings.focusMode ? "Vista normal" : "Sin distracciones";
    const modeLabel = game.mode === "daily" ? `Daily ${game.dailyLabel}` : difficulty.label;

    this.container.innerHTML = `
      <section class="panel hud-panel">
        <div class="hud-row">
          <button type="button" class="ghost-button" data-action="go-home">Menu</button>
          <div class="timer-block" aria-live="polite">
            <span class="timer-label">Tiempo</span>
            <strong class="timer-value">${formatTime(game.elapsedMs)}</strong>
          </div>
          <button type="button" class="ghost-button" data-action="pause-game">${game.paused ? "Pausado" : "Pausa"}</button>
        </div>
        <div class="chip-row">
          <span class="status-chip">${modeLabel}</span>
          <span class="status-chip">Pistas ${game.hintCount}</span>
          <span class="status-chip">Progreso ${game.progressPercent}%</span>
          <span class="status-chip">Undo ${game.canUndo ? "listo" : "--"}</span>
        </div>
      </section>

      <section class="panel keypad-panel">
        <div class="keypad-grid" role="group" aria-label="Teclado numerico">
          ${Array.from({ length: 9 }, (_, index) => {
            const value = index + 1;
            return `
              <button
                type="button"
                class="keypad-button ${game.selectedValue === value ? "is-active" : ""}"
                data-key="${value}"
                ${game.paused || snapshot.isGenerating || !canEdit ? "disabled" : ""}
              >
                ${value}
              </button>
            `;
          }).join("")}
        </div>
      </section>

      <section class="panel actions-panel">
        <div class="actions-grid">
          <button type="button" class="action-button" data-action="undo" ${game.canUndo ? "" : "disabled"}>Undo</button>
          <button type="button" class="action-button" data-action="redo" ${game.canRedo ? "" : "disabled"}>Redo</button>
          <button type="button" class="action-button ${game.noteMode ? "is-active" : ""}" data-action="toggle-note">${noteLabel}</button>
          <button type="button" class="action-button" data-action="erase-cell">Borrar</button>
          <button type="button" class="action-button" data-action="hint">Pista</button>
          <button type="button" class="action-button" data-action="rewarded-hint">Pista +</button>
          <button type="button" class="action-button" data-action="open-restart">Reiniciar</button>
          <button type="button" class="action-button" data-action="open-new-game">Nueva</button>
          <button type="button" class="action-button" data-action="start-daily">Daily</button>
          <button type="button" class="action-button" data-action="toggle-errors">${errorsLabel}</button>
          <button type="button" class="action-button" data-action="toggle-focus">${focusLabel}</button>
          <button type="button" class="action-button" data-action="cycle-theme">${themeLabel}</button>
          <button type="button" class="action-button is-subtle" data-action="resume-game">${game.paused ? "Continuar" : "En juego"}</button>
        </div>
      </section>
    `;
  }
}

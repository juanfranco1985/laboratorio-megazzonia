import {
  ACTION_MODE_OPTIONS,
  DIFFICULTY_ORDER,
  DIFFICULTY_PRESETS,
  THEME_OPTIONS,
} from "../utils/constants.js";
import { buildCustomHint, describeDifficulty } from "../utils/helpers.js";

function renderSegmentedButtons(rootElement, options, selectedId) {
  rootElement.innerHTML = "";

  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `segmented-button${option.id === selectedId ? " is-active" : ""}`;
    button.dataset.value = option.id;
    button.textContent = option.label;
    rootElement.appendChild(button);
  }
}

export class ControlsView {
  constructor(elements) {
    this.elements = elements;
  }

  bind(handlers) {
    this.elements.difficultyRoot.addEventListener("click", (event) => {
      const button = event.target.closest("[data-difficulty]");

      if (button) {
        handlers.onDifficultyChange(button.dataset.difficulty);
      }
    });

    this.elements.startButton.addEventListener("click", handlers.onStartGame);
    this.elements.restartButton.addEventListener("click", handlers.onRestartGame);
    this.elements.continueButton.addEventListener("click", handlers.onContinueGame);
    this.elements.resetStatsButton.addEventListener("click", handlers.onResetStats);
    this.elements.zenToggle.addEventListener("click", handlers.onZenModeToggle);
    this.elements.clearSeedButton.addEventListener("click", handlers.onClearSeed);
    this.elements.seedInput.addEventListener("input", () =>
      handlers.onSeedInputChange(this.elements.seedInput.value),
    );

    for (const input of this.#customInputs()) {
      input.addEventListener("input", () => handlers.onCustomConfigChange(this.getCustomConfig()));
    }

    for (const root of this.#segmentedRoots()) {
      root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-value]");

        if (!button) {
          return;
        }

        if (root === this.elements.themeRoot) {
          handlers.onThemeChange(button.dataset.value);
          return;
        }

        handlers.onActionModeChange(button.dataset.value);
      });
    }
  }

  update({ settings, gameState, hasSavedSession, hintMessage, seedHintMessage }) {
    this.#renderDifficultyCards(settings.difficulty);
    renderSegmentedButtons(this.elements.themeRoot, THEME_OPTIONS, settings.theme);
    renderSegmentedButtons(
      this.elements.actionModeRoot,
      ACTION_MODE_OPTIONS,
      settings.actionMode,
    );
    renderSegmentedButtons(
      this.elements.actionModeMirrorRoot,
      ACTION_MODE_OPTIONS,
      settings.actionMode,
    );

    this.elements.customFields.hidden = settings.difficulty !== "custom";
    this.elements.rowsInput.value = settings.custom.rows;
    this.elements.colsInput.value = settings.custom.cols;
    this.elements.minesInput.value = settings.custom.mines;
    this.elements.minesInput.max = String(settings.custom.rows * settings.custom.cols - 9);
    this.elements.zenToggle.classList.toggle("is-active", settings.zenMode);
    this.elements.zenToggle.setAttribute("aria-pressed", settings.zenMode ? "true" : "false");
    this.elements.zenToggle.textContent = settings.zenMode ? "Activado" : "Desactivado";
    if (this.elements.seedInput.value !== settings.seedInput) {
      this.elements.seedInput.value = settings.seedInput;
    }
    this.elements.seedHint.textContent = seedHintMessage;
    this.elements.restartButton.disabled = !gameState;
    this.elements.continueButton.hidden = !hasSavedSession || Boolean(gameState);
    this.elements.controlHint.textContent = hintMessage || buildCustomHint(settings.custom);
  }

  getCustomConfig() {
    return {
      rows: this.elements.rowsInput.value,
      cols: this.elements.colsInput.value,
      mines: this.elements.minesInput.value,
    };
  }

  #renderDifficultyCards(selectedDifficulty) {
    this.elements.difficultyRoot.innerHTML = "";

    for (const difficultyId of DIFFICULTY_ORDER) {
      const config = DIFFICULTY_PRESETS[difficultyId];
      const button = document.createElement("button");
      button.type = "button";
      button.className = `difficulty-card${difficultyId === selectedDifficulty ? " is-selected" : ""}`;
      button.dataset.difficulty = difficultyId;
      button.innerHTML = `
        <span class="difficulty-card__title">${config.label}</span>
        <span class="difficulty-card__meta">${describeDifficulty(config)}</span>
      `;
      this.elements.difficultyRoot.appendChild(button);
    }
  }

  #customInputs() {
    return [this.elements.rowsInput, this.elements.colsInput, this.elements.minesInput];
  }

  #segmentedRoots() {
    return [
      this.elements.themeRoot,
      this.elements.actionModeRoot,
      this.elements.actionModeMirrorRoot,
    ];
  }
}

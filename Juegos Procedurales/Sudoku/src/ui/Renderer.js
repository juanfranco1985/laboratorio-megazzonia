import { DIFFICULTY_CONFIG, DIFFICULTY_ORDER } from "../utils/constants.js";
import { formatTime } from "../utils/helpers.js";
import { BoardView } from "./BoardView.js";
import { ControlsView } from "./ControlsView.js";
import { ModalView } from "./ModalView.js";
import { StatsView } from "./StatsView.js";

export class Renderer {
  constructor({ root, gameState, themeManager, nativeBridge }) {
    this.root = root;
    this.gameState = gameState;
    this.themeManager = themeManager;
    this.nativeBridge = nativeBridge;
    this.latestSnapshot = null;
    this.dialog = null;
    this.boardView = null;
    this.controlsView = null;
    this.modalView = null;
    this.statsView = null;
  }

  init() {
    this.root.innerHTML = `
      <div class="app-shell">
        <section id="home-screen" class="screen"></section>
        <section id="game-screen" class="screen" hidden>
          <div class="game-layout">
            <div class="game-main">
              <section id="game-summary" class="panel game-summary"></section>
              <section class="panel board-panel">
                <div id="board-grid" class="board-grid" role="grid" aria-label="Tablero de Sudoku"></div>
              </section>
            </div>
            <aside id="controls-root" class="game-controls"></aside>
          </div>
        </section>
        <div id="modal-root" class="modal-root" hidden></div>
      </div>
    `;

    this.appShell = this.root.querySelector(".app-shell");
    this.homeScreen = this.root.querySelector("#home-screen");
    this.gameScreen = this.root.querySelector("#game-screen");
    this.gameSummary = this.root.querySelector("#game-summary");

    this.boardView = new BoardView(this.root.querySelector("#board-grid"));
    this.controlsView = new ControlsView(this.root.querySelector("#controls-root"));
    this.modalView = new ModalView(this.root.querySelector("#modal-root"));
    this.statsView = new StatsView(this.homeScreen);

    this.root.addEventListener("click", (event) => {
      this.handleClick(event);
    });

    globalThis.document.addEventListener("keydown", (event) => {
      this.handleKeydown(event);
    });

    this.gameState.subscribe((snapshot) => {
      this.render(snapshot);
    });
  }

  async handleClick(event) {
    const target = event.target.closest("[data-action], [data-cell], [data-key]");
    if (!target) {
      return;
    }

    if (target.dataset.cell) {
      this.gameState.selectCell(Number(target.dataset.cell));
      return;
    }

    if (target.dataset.key) {
      this.gameState.applyDigit(Number(target.dataset.key));
      return;
    }

    const action = target.dataset.action;
    const difficulty = target.dataset.difficulty;

    switch (action) {
      case "resume-game":
        this.dialog = null;
        this.gameState.resumeToGame();
        break;
      case "pause-game":
        this.dialog = null;
        this.gameState.pauseGame();
        break;
      case "go-home":
        this.dialog = null;
        this.gameState.openHome();
        break;
      case "toggle-note":
        this.gameState.toggleNoteMode();
        break;
      case "erase-cell":
        this.gameState.eraseSelectedCell();
        break;
      case "hint":
        this.gameState.giveHint();
        break;
      case "rewarded-hint":
        await this.gameState.requestRewardedHint();
        break;
      case "undo":
        this.gameState.undo();
        break;
      case "redo":
        this.gameState.redo();
        break;
      case "toggle-errors":
        this.gameState.toggleShowErrors();
        break;
      case "toggle-focus":
        this.gameState.toggleFocusMode();
        break;
      case "cycle-theme":
        this.gameState.cycleTheme();
        break;
      case "open-restart":
        this.dialog = "restart";
        this.render(this.latestSnapshot);
        break;
      case "confirm-restart":
        this.dialog = null;
        this.gameState.restartGame();
        break;
      case "open-new-game":
        this.dialog = "difficulty";
        this.render(this.latestSnapshot);
        break;
      case "open-discard-save":
        this.dialog = "discard-save";
        this.render(this.latestSnapshot);
        break;
      case "start-game":
        this.dialog = null;
        await this.gameState.startNewGame(difficulty);
        break;
      case "start-daily":
        this.dialog = null;
        await this.gameState.startDailyChallenge();
        break;
      case "confirm-discard-save":
        this.dialog = null;
        this.gameState.discardSavedGame();
        break;
      case "close-dialog":
        this.dialog = null;
        this.render(this.latestSnapshot);
        break;
      case "close-victory":
        this.dialog = null;
        this.gameState.openHome();
        break;
      default:
        break;
    }
  }

  handleKeydown(event) {
    const snapshot = this.latestSnapshot;
    if (!snapshot || !snapshot.game) {
      return;
    }

    const targetTag = event.target?.tagName;
    if (targetTag === "INPUT" || targetTag === "TEXTAREA" || targetTag === "SELECT") {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        this.gameState.redo();
      } else {
        this.gameState.undo();
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      this.gameState.redo();
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.handleSystemBack();
      return;
    }

    if (snapshot.screen !== "game" || snapshot.game.paused || snapshot.game.completed) {
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      this.gameState.applyDigit(Number(event.key));
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.gameState.moveSelection(-1, 0);
        break;
      case "ArrowDown":
        event.preventDefault();
        this.gameState.moveSelection(1, 0);
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.gameState.moveSelection(0, -1);
        break;
      case "ArrowRight":
        event.preventDefault();
        this.gameState.moveSelection(0, 1);
        break;
      case "Backspace":
      case "Delete":
      case "0":
        event.preventDefault();
        this.gameState.eraseSelectedCell();
        break;
      case "n":
      case "N":
        event.preventDefault();
        this.gameState.toggleNoteMode();
        break;
      case "h":
      case "H":
        event.preventDefault();
        this.gameState.giveHint();
        break;
      case "g":
      case "G":
        event.preventDefault();
        this.gameState.requestRewardedHint();
        break;
      case "p":
      case "P":
        event.preventDefault();
        this.gameState.pauseGame();
        break;
      case "r":
      case "R":
        event.preventDefault();
        this.dialog = "restart";
        this.render(snapshot);
        break;
      case "f":
      case "F":
        event.preventDefault();
        this.gameState.toggleFocusMode();
        break;
      case "u":
      case "U":
        event.preventDefault();
        this.gameState.undo();
        break;
      case "y":
      case "Y":
        event.preventDefault();
        this.gameState.redo();
        break;
      default:
        break;
    }
  }

  handleSystemBack() {
    const snapshot = this.latestSnapshot;
    if (!snapshot) {
      return false;
    }

    if (this.dialog) {
      this.dialog = null;
      this.render(snapshot);
      return true;
    }

    if (snapshot.screen === "game" && snapshot.game) {
      if (snapshot.game.completed) {
        this.gameState.openHome();
        return true;
      }

      if (!snapshot.game.paused) {
        this.gameState.pauseGame("system-back");
        return true;
      }

      this.gameState.openHome();
      return true;
    }

    return false;
  }

  render(snapshot) {
    this.latestSnapshot = snapshot;
    this.themeManager.apply(snapshot.settings.theme);
    const themeLabel = this.themeManager.getLabel(snapshot.settings.theme);

    this.appShell.classList.toggle("is-focus-mode", snapshot.settings.focusMode);
    this.homeScreen.hidden = snapshot.screen !== "home";
    this.gameScreen.hidden = snapshot.screen !== "game";

    if (snapshot.screen === "home") {
      this.statsView.render(snapshot, themeLabel);
    }

    if (snapshot.game) {
      this.renderGameSummary(snapshot);
      this.boardView.render(snapshot);
      this.controlsView.render(snapshot, themeLabel);
    }

    this.modalView.render(this.buildModal(snapshot));

    this.nativeBridge?.setBackContext({
      screen: snapshot.screen,
      hasDialog: Boolean(this.dialog),
      hasActiveGame: Boolean(snapshot.game && !snapshot.game.completed),
      gamePaused: Boolean(snapshot.game?.paused),
      gameCompleted: Boolean(snapshot.game?.completed),
    });
  }

  renderGameSummary(snapshot) {
    const game = snapshot.game;
    const config = DIFFICULTY_CONFIG[game.difficulty];
    const title = game.mode === "daily" ? `Daily ${game.dailyLabel}` : config.label;

    this.gameSummary.innerHTML = `
      <div class="game-summary-copy">
        <div class="hero-kicker">${game.mode === "daily" ? "Desafio diario" : "Partida actual"}</div>
        <h2>${title}</h2>
        <p>
          ${game.mode === "daily"
            ? "Semilla fijada por fecha para reproducibilidad y comparacion futura."
            : "Puzzle procedural con semilla reproducible. Conflictos visuales, notas tactiles y guardado local continuo."}
        </p>
      </div>
      <div class="summary-metrics">
        <div class="summary-metric">
          <span>Seed</span>
          <strong>${game.seed.slice(0, 18)}</strong>
        </div>
        <div class="summary-metric">
          <span>Errores</span>
          <strong>${game.mistakeCount}</strong>
        </div>
        <div class="summary-metric">
          <span>Tiempo</span>
          <strong>${formatTime(game.elapsedMs)}</strong>
        </div>
      </div>
    `;
  }

  buildModal(snapshot) {
    if (snapshot.isGenerating) {
      return {
        kind: "is-loading",
        title: "Generando puzzle",
        body: `
          <div class="loading-stack">
            <span class="loading-spinner" aria-hidden="true"></span>
            <p>Creando una solucion valida, removiendo pistas y verificando unicidad.</p>
          </div>
        `,
        actions: "",
      };
    }

    if (this.dialog === "difficulty") {
      return {
        kind: "is-picker",
        title: "Nueva partida",
        body: `
          <div class="difficulty-grid modal-difficulty-grid">
            <button type="button" class="difficulty-card" data-action="start-daily">
              <span class="difficulty-name">Daily</span>
              <span class="difficulty-meta">${DIFFICULTY_CONFIG[snapshot.dailyChallenge.difficulty].label} - ${snapshot.dailyChallenge.label}</span>
            </button>
            ${DIFFICULTY_ORDER.map((difficulty) => {
              const config = DIFFICULTY_CONFIG[difficulty];
              return `
                <button type="button" class="difficulty-card" data-action="start-game" data-difficulty="${difficulty}">
                  <span class="difficulty-name">${config.label}</span>
                  <span class="difficulty-meta">${config.targetClues[0]}-${config.targetClues[1]} pistas</span>
                </button>
              `;
            }).join("")}
          </div>
        `,
        actions: `
          <button type="button" class="ghost-button" data-action="close-dialog">Cancelar</button>
        `,
      };
    }

    if (this.dialog === "restart") {
      return {
        kind: "is-confirm",
        title: "Reiniciar tablero",
        body: `
          <p>Se reinicia el puzzle actual, pero se conserva la dificultad y la semilla de esta partida.</p>
        `,
        actions: `
          <button type="button" class="primary-button" data-action="confirm-restart">Reiniciar</button>
          <button type="button" class="ghost-button" data-action="close-dialog">Cancelar</button>
        `,
      };
    }

    if (this.dialog === "discard-save") {
      return {
        kind: "is-confirm",
        title: "Descartar partida guardada",
        body: `
          <p>Se elimina la sesion actual guardada y volveras a un inicio limpio.</p>
        `,
        actions: `
          <button type="button" class="primary-button" data-action="confirm-discard-save">Descartar partida</button>
          <button type="button" class="ghost-button" data-action="close-dialog">Cancelar</button>
        `,
      };
    }

    if (snapshot.screen === "game" && snapshot.game?.completed) {
      return {
        kind: "is-victory",
        title: "Victoria",
        body: `
          <div class="modal-stats">
            <div class="best-time-row"><span>Tiempo final</span><strong>${formatTime(snapshot.game.elapsedMs)}</strong></div>
            <div class="best-time-row"><span>Dificultad</span><strong>${DIFFICULTY_CONFIG[snapshot.game.difficulty].label}</strong></div>
            <div class="best-time-row"><span>Pistas usadas</span><strong>${snapshot.game.hintCount}</strong></div>
            <div class="best-time-row"><span>Racha</span><strong>${snapshot.stats.currentStreak}</strong></div>
          </div>
        `,
        actions: `
          <button type="button" class="primary-button" data-action="open-new-game">Nueva partida</button>
          <button type="button" class="ghost-button" data-action="close-victory">Volver al menu</button>
        `,
      };
    }

    if (snapshot.screen === "game" && snapshot.game?.paused) {
      return {
        kind: "is-pause",
        title: "Juego en pausa",
        body: `
          <p>La partida queda guardada. Podes continuar, reiniciar este tablero o lanzar una nueva dificultad.</p>
        `,
        actions: `
          <button type="button" class="primary-button" data-action="resume-game">Continuar</button>
          <button type="button" class="ghost-button" data-action="open-restart">Reiniciar</button>
          <button type="button" class="ghost-button" data-action="open-new-game">Nueva partida</button>
          <button type="button" class="ghost-button" data-action="go-home">Menu</button>
        `,
      };
    }

    return null;
  }
}

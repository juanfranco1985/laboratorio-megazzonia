import { DIFFICULTY_CONFIG, DIFFICULTY_ORDER } from "../utils/constants.js";
import { formatTime } from "../utils/helpers.js";

function formatBestTime(value) {
  return value === null ? "--" : formatTime(value);
}

export class StatsView {
  constructor(container) {
    this.container = container;
  }

  render(snapshot, themeLabel) {
    const game = snapshot.game;
    const errorsToggleLabel = snapshot.settings.showErrors ? "Errores visibles" : "Errores ocultos";
    const focusLabel = snapshot.settings.focusMode ? "Vista normal" : "Sin distracciones";
    const daily = snapshot.dailyChallenge;

    this.container.innerHTML = `
      <div class="home-layout">
        <section class="panel hero-panel">
          <div class="hero-kicker">Offline-first, modular y Android-ready</div>
          <h1 class="hero-title">Sudoku Procedural</h1>
          <p class="hero-copy">
            Sudoku 9x9 generado al vuelo, sin assets pesados, con guardado local, notas tactiles y base lista para WebView.
          </p>
          <div class="hero-actions hero-actions-extended">
            <button type="button" class="ghost-button" data-action="cycle-theme">${themeLabel}</button>
            <button type="button" class="ghost-button" data-action="toggle-errors">${errorsToggleLabel}</button>
            <button type="button" class="ghost-button" data-action="toggle-focus">${focusLabel}</button>
          </div>
          ${
            game && !game.completed
              ? `
                <div class="resume-card">
                  <div>
                    <strong>Partida en curso</strong>
                    <p>${DIFFICULTY_CONFIG[game.difficulty].label} - ${formatTime(game.elapsedMs)}</p>
                  </div>
                  <div class="resume-actions">
                    <button type="button" class="primary-button" data-action="resume-game">Continuar</button>
                    <button type="button" class="ghost-button" data-action="open-discard-save">Descartar</button>
                  </div>
                </div>
              `
              : ""
          }
        </section>

        <section class="panel start-panel">
          <div class="section-heading">
            <h2>Jugar ahora</h2>
            <p>Elegi dificultad o entra al desafio diario reproducible por fecha.</p>
          </div>
          <div class="daily-card">
            <div>
              <strong>Desafio diario</strong>
              <p>${DIFFICULTY_CONFIG[daily.difficulty].label} - ${daily.label}</p>
            </div>
            <button type="button" class="primary-button" data-action="start-daily">
              ${daily.activeToday ? "Retomar" : daily.completedToday ? "Rejugar" : "Jugar hoy"}
            </button>
          </div>
          <div class="difficulty-grid">
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
        </section>

        <section class="panel stats-panel">
          <div class="section-heading">
            <h2>Estadisticas</h2>
            <p>Persistencia local pensada para juego offline y puente nativo futuro.</p>
          </div>
          <div class="stats-grid stats-grid-extended">
            <article class="stat-card">
              <span class="stat-label">Jugadas</span>
              <strong class="stat-value">${snapshot.stats.played}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-label">Ganadas</span>
              <strong class="stat-value">${snapshot.stats.won}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-label">Racha</span>
              <strong class="stat-value">${snapshot.stats.currentStreak}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-label">Mejor racha</span>
              <strong class="stat-value">${snapshot.stats.bestStreak}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-label">Daily wins</span>
              <strong class="stat-value">${snapshot.stats.dailyWins}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-label">Pistas +</span>
              <strong class="stat-value">${snapshot.stats.rewardedHintsUsed}</strong>
            </article>
          </div>
          <div class="best-times">
            ${DIFFICULTY_ORDER.map((difficulty) => {
              const config = DIFFICULTY_CONFIG[difficulty];
              return `
                <div class="best-time-row">
                  <span>${config.label}</span>
                  <strong>${formatBestTime(snapshot.stats.bestTimes[difficulty])}</strong>
                </div>
              `;
            }).join("")}
          </div>
        </section>
      </div>
    `;
  }
}

export class ModalView {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.handlers = {};

    this.rootElement.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-action]');

      if (actionButton) {
        const actionName = actionButton.dataset.action;
        this.hide();
        this.handlers[actionName]?.();
        return;
      }

      if (event.target === this.rootElement) {
        this.hide();
      }
    });
  }

  bind(handlers) {
    this.handlers = handlers;
  }

  showVictory({
    elapsedLabel,
    wordCount,
    categoryLabel,
    difficultyLabel,
    streak,
    streakLabel = 'Racha actual',
    isBestTime,
    modeLabel,
    canShare,
  }) {
    this.rootElement.classList.add('is-visible');
    this.rootElement.innerHTML = `
      <div class="modal-backdrop">
        <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="victory-title">
          <p class="eyebrow">Cierre de edicion</p>
          <h2 id="victory-title">Pagina completada</h2>
          <p class="modal-card__lead">${categoryLabel} · ${difficultyLabel} · ${modeLabel}</p>
          <div class="modal-stats">
            <article class="stat-card">
              <span class="stat-card__label">Tiempo final</span>
              <strong class="stat-card__value">${elapsedLabel}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-card__label">Entradas</span>
              <strong class="stat-card__value">${wordCount}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-card__label">${streakLabel}</span>
              <strong class="stat-card__value">${streak}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-card__label">Récord</span>
              <strong class="stat-card__value">${isBestTime ? 'Nuevo' : 'Estable'}</strong>
            </article>
          </div>
          <div class="modal-actions">
            <button class="button button--ghost" data-action="modalHome">Inicio</button>
            <button class="button button--secondary" data-action="modalRestart">Repetir</button>
            ${canShare ? '<button class="button button--ghost" data-action="modalShare">Compartir</button>' : ''}
            <button class="button button--primary" data-action="modalNew">Nueva partida</button>
          </div>
        </section>
      </div>
    `;
  }

  hide() {
    this.rootElement.classList.remove('is-visible');
    this.rootElement.innerHTML = '';
  }
}

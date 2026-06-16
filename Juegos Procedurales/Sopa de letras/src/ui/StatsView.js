import { formatTime } from '../utils/helpers.js';

export class StatsView {
  constructor(...containers) {
    this.containers = containers.filter(Boolean);
  }

  render(stats, bestTimeMs, dailySummary) {
    const cardsMarkup = [
      this.createCard('Ediciones', stats.gamesPlayed),
      this.createCard('Resueltas', stats.gamesCompleted),
      this.createCard('Serie total', stats.winStreak),
      this.createCard('Mejor marca', bestTimeMs ? formatTime(bestTimeMs) : '--'),
      this.createCard('Diaria hoy', dailySummary.completedToday ? 'Hecha' : 'Pendiente'),
      this.createCard('Serie diaria', dailySummary.currentStreak),
    ].join('');

    this.containers.forEach((container) => {
      container.innerHTML = cardsMarkup;
    });
  }

  createCard(label, value) {
    return `
      <article class="stat-card">
        <span class="stat-card__label">${label}</span>
        <strong class="stat-card__value">${value}</strong>
      </article>
    `;
  }
}

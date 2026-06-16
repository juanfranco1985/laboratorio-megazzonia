import { DIFFICULTY_ORDER } from "../utils/constants.js";
import { formatPercent, formatTime, getDifficultyLabel } from "../utils/helpers.js";

export class StatsView {
  constructor(summaryRoot, bestTimesRoot) {
    this.summaryRoot = summaryRoot;
    this.bestTimesRoot = bestTimesRoot;
  }

  render(stats) {
    this.summaryRoot.innerHTML = "";
    this.bestTimesRoot.innerHTML = "";

    const summaryCards = [
      { label: "Partidas", value: stats.totals.played },
      {
        label: `Victorias - ${formatPercent(stats.totals.won, stats.totals.played)}`,
        value: stats.totals.won,
      },
      { label: "Derrotas", value: stats.totals.lost },
      { label: "Racha", value: stats.totals.bestStreak },
    ];

    for (const entry of summaryCards) {
      const card = document.createElement("article");
      card.className = "stat-card";
      card.innerHTML = `
        <span class="stat-card__label">${entry.label}</span>
        <strong class="stat-card__value">${entry.value}</strong>
      `;
      this.summaryRoot.appendChild(card);
    }

    for (const difficultyId of DIFFICULTY_ORDER) {
      const row = document.createElement("div");
      const bestTimeMs = stats.perDifficulty[difficultyId].bestTimeMs;
      row.className = "best-time-item";
      row.innerHTML = `
        <span>${getDifficultyLabel(difficultyId)}</span>
        <strong>${bestTimeMs === null ? "--:--" : formatTime(bestTimeMs)}</strong>
      `;
      this.bestTimesRoot.appendChild(row);
    }
  }
}

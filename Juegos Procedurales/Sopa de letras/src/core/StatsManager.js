import { getDateKey, isPreviousDateKey, shiftDateKey } from '../utils/helpers.js';

const DEFAULT_STATS = {
  gamesPlayed: 0,
  gamesCompleted: 0,
  winStreak: 0,
  longestStreak: 0,
  bestTimes: {},
  daily: {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    completedByDate: {},
  },
};

export class StatsManager {
  constructor(initialStats = {}) {
    this.stats = {
      ...DEFAULT_STATS,
      ...initialStats,
      bestTimes: {
        ...DEFAULT_STATS.bestTimes,
        ...(initialStats.bestTimes || {}),
      },
      daily: {
        ...DEFAULT_STATS.daily,
        ...(initialStats.daily || {}),
        completedByDate: {
          ...DEFAULT_STATS.daily.completedByDate,
          ...(initialStats.daily?.completedByDate || {}),
        },
      },
    };
  }

  get(referenceDateKey = getDateKey()) {
    const dailySummary = this.getDailySummary(referenceDateKey);

    return {
      ...this.stats,
      bestTimes: { ...this.stats.bestTimes },
      daily: {
        ...this.stats.daily,
        completedByDate: { ...this.stats.daily.completedByDate },
      },
      dailySummary,
    };
  }

  getBestTime(categoryId, difficultyId) {
    return this.stats.bestTimes[this.getBestTimeKey(categoryId, difficultyId)] ?? null;
  }

  serialize() {
    return {
      ...this.stats,
      bestTimes: { ...this.stats.bestTimes },
      daily: {
        ...this.stats.daily,
        completedByDate: { ...this.stats.daily.completedByDate },
      },
    };
  }

  recordGameStart() {
    this.stats.gamesPlayed += 1;
    return this.get();
  }

  recordAbandon() {
    this.stats.winStreak = 0;
    return this.get();
  }

  recordGameComplete({ categoryId, difficultyId, timeMs, timerMode = 'timed' }) {
    this.stats.gamesCompleted += 1;
    this.stats.winStreak += 1;
    this.stats.longestStreak = Math.max(this.stats.longestStreak, this.stats.winStreak);

    if (timerMode !== 'timed' || !Number.isFinite(timeMs) || timeMs < 0) {
      return this.get();
    }

    const bestTimeKey = this.getBestTimeKey(categoryId, difficultyId);
    const previousBest = this.stats.bestTimes[bestTimeKey];

    if (!previousBest || timeMs < previousBest.timeMs) {
      this.stats.bestTimes[bestTimeKey] = {
        categoryId,
        difficultyId,
        timeMs,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.get();
  }

  recordDailyComplete({
    dateKey,
    seed,
    categoryId,
    difficultyId,
    timeMs,
    timerMode = 'timed',
  }) {
    const resolvedDateKey = dateKey || getDateKey();

    if (this.stats.daily.completedByDate[resolvedDateKey]) {
      return this.get(resolvedDateKey);
    }

    const previousDate = this.stats.daily.lastCompletedDate;
    const nextStreak = previousDate && isPreviousDateKey(previousDate, resolvedDateKey)
      ? this.stats.daily.currentStreak + 1
      : 1;

    this.stats.daily.currentStreak = nextStreak;
    this.stats.daily.longestStreak = Math.max(this.stats.daily.longestStreak, nextStreak);
    this.stats.daily.lastCompletedDate = resolvedDateKey;
    this.stats.daily.completedByDate[resolvedDateKey] = {
      seed,
      categoryId,
      difficultyId,
      timerMode,
      timeMs: Number.isFinite(timeMs) ? timeMs : null,
      completedAt: new Date().toISOString(),
    };

    return this.get(resolvedDateKey);
  }

  getDailySummary(referenceDateKey = getDateKey()) {
    const todayEntry = this.stats.daily.completedByDate[referenceDateKey] ?? null;
    const yesterdayKey = shiftDateKey(referenceDateKey, -1);
    const effectiveCurrentStreak = (
      this.stats.daily.lastCompletedDate === referenceDateKey
      || this.stats.daily.lastCompletedDate === yesterdayKey
    )
      ? this.stats.daily.currentStreak
      : 0;

    return {
      todayKey: referenceDateKey,
      completedToday: Boolean(todayEntry),
      todayEntry,
      currentStreak: effectiveCurrentStreak,
      longestStreak: this.stats.daily.longestStreak,
      lastCompletedDate: this.stats.daily.lastCompletedDate,
      yesterdayCompleted: Boolean(this.stats.daily.completedByDate[yesterdayKey]),
    };
  }

  getBestTimeKey(categoryId, difficultyId) {
    return `${categoryId}:${difficultyId}`;
  }
}

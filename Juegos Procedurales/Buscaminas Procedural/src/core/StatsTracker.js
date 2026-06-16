import { DIFFICULTY_ORDER } from "../utils/constants.js";

function createDifficultyStats() {
  return {
    played: 0,
    won: 0,
    lost: 0,
    bestTimeMs: null,
  };
}

export function createEmptyStats() {
  return {
    totals: {
      played: 0,
      won: 0,
      lost: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
    perDifficulty: DIFFICULTY_ORDER.reduce((result, key) => {
      result[key] = createDifficultyStats();
      return result;
    }, {}),
  };
}

export function sanitizeStats(rawStats = {}) {
  const base = createEmptyStats();
  const next = {
    totals: {
      played: Number(rawStats?.totals?.played) || 0,
      won: Number(rawStats?.totals?.won) || 0,
      lost: Number(rawStats?.totals?.lost) || 0,
      currentStreak: Number(rawStats?.totals?.currentStreak) || 0,
      bestStreak: Number(rawStats?.totals?.bestStreak) || 0,
    },
    perDifficulty: { ...base.perDifficulty },
  };

  for (const difficultyId of DIFFICULTY_ORDER) {
    const current = rawStats?.perDifficulty?.[difficultyId] ?? {};
    next.perDifficulty[difficultyId] = {
      played: Number(current.played) || 0,
      won: Number(current.won) || 0,
      lost: Number(current.lost) || 0,
      bestTimeMs:
        current.bestTimeMs === null || current.bestTimeMs === undefined
          ? null
          : Number(current.bestTimeMs) || null,
    };
  }

  return next;
}

export function recordGameStarted(stats, difficultyId) {
  const next = sanitizeStats(stats);
  const key = DIFFICULTY_ORDER.includes(difficultyId) ? difficultyId : "custom";
  next.totals.played += 1;
  next.perDifficulty[key].played += 1;
  return next;
}

export function recordGameResult(
  stats,
  difficultyId,
  didWin,
  elapsedMs,
  options = {},
) {
  const next = sanitizeStats(stats);
  const key = DIFFICULTY_ORDER.includes(difficultyId) ? difficultyId : "custom";
  const difficultyStats = next.perDifficulty[key];
  const trackBestTime = options.trackBestTime !== false;

  if (didWin) {
    next.totals.won += 1;
    next.totals.currentStreak += 1;
    next.totals.bestStreak = Math.max(
      next.totals.bestStreak,
      next.totals.currentStreak,
    );
    difficultyStats.won += 1;
    if (
      trackBestTime &&
      (difficultyStats.bestTimeMs === null || elapsedMs < difficultyStats.bestTimeMs)
    ) {
      difficultyStats.bestTimeMs = elapsedMs;
    }
  } else {
    next.totals.lost += 1;
    next.totals.currentStreak = 0;
    difficultyStats.lost += 1;
  }

  return next;
}

export function createLevelMap(defs) {
  return defs.reduce((acc, def) => {
    acc[def.id] = 0;
    return acc;
  }, {});
}

export function numberOr(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function pad2(v) {
  return String(v).padStart(2, "0");
}

export function getLocalISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODateParts(iso) {
  if (typeof iso !== "string") return null;
  const p = iso.split("-");
  if (p.length !== 3) return null;
  const y = Number(p[0]);
  const m = Number(p[1]);
  const d = Number(p[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return { y, m, d };
}

export function getEpochDayFromISO(iso) {
  const parts = parseISODateParts(iso);
  if (!parts) return null;
  return Math.floor(Date.UTC(parts.y, parts.m - 1, parts.d) / 86400000);
}

export function isPreviousDay(previousISO, currentISO) {
  const previousDay = getEpochDayFromISO(previousISO);
  const currentDay = getEpochDayFromISO(currentISO);
  if (previousDay === null || currentDay === null) return false;
  return currentDay - previousDay === 1;
}

export function hashString(input) {
  let hash = 1779033703;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithRng(array, rng) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return "inf";
  const abs = Math.abs(value);
  if (abs < 1000) return value.toFixed(abs < 10 ? 2 : abs < 100 ? 1 : 0);
  const suffixes = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const exp = Math.floor(Math.log10(abs) / 3);
  if (exp >= suffixes.length) return value.toExponential(2);
  const scaled = value / Math.pow(1000, exp);
  return `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)}${suffixes[exp - 1]}`;
}

export function formatDuration(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export function safePercentage(value) {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, 0, 100);
}

export function getEconomyTierFromLifetime(lifetimeEnergy) {
  const tier = Math.floor(Math.log10(Math.max(1, lifetimeEnergy)) / 1.6) + 1;
  return clamp(tier, 1, 8);
}

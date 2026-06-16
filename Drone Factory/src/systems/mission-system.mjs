import { MISSION_TYPES } from "../constants.mjs";
import { clamp, formatNumber, hashString, mulberry32, numberOr, shuffleWithRng } from "../utils.mjs";

export function createDailyProgress() {
  return { clicks: 0, machinesBought: 0, upgradesBought: 0, energyGenerated: 0, maxEps: 0 };
}

export function normalizeDailyProgress(raw) {
  const base = createDailyProgress();
  if (!raw || typeof raw !== "object") return base;
  base.clicks = Math.max(0, Math.floor(numberOr(raw.clicks, 0)));
  base.machinesBought = Math.max(0, Math.floor(numberOr(raw.machinesBought, 0)));
  base.upgradesBought = Math.max(0, Math.floor(numberOr(raw.upgradesBought, 0)));
  base.energyGenerated = Math.max(0, numberOr(raw.energyGenerated, 0));
  base.maxEps = Math.max(0, numberOr(raw.maxEps, 0));
  return base;
}

export function getEconomyTier(lifetimeEnergy) {
  const tier = Math.floor(Math.log10(Math.max(1, lifetimeEnergy)) / 1.6) + 1;
  return clamp(tier, 1, 8);
}

export function buildMission(type, tier, streak, index, date) {
  const streakFactor = 1 + streak * 0.05;
  let title = "";
  let description = "";
  let target = 1;
  let reward = 50;

  switch (type) {
    case "clicks":
      target = Math.round((38 + tier * 24) * streakFactor);
      reward = Math.round(target * 18);
      title = "Operador activo";
      description = `Haz ${target} clicks manuales.`;
      break;
    case "machines":
      target = Math.round((6 + tier * 3) * streakFactor);
      reward = Math.round(target * 180);
      title = "Linea de montaje";
      description = `Compra ${target} maquinas.`;
      break;
    case "upgrades":
      target = Math.max(1, Math.round((2 + tier * 0.9) * streakFactor));
      reward = Math.round(target * 420);
      title = "Laboratorio tecnico";
      description = `Compra ${target} mejoras.`;
      break;
    case "energy":
      target = Math.round(1800 * Math.pow(3, tier - 1) * streakFactor);
      reward = Math.round(target * 0.24);
      title = "Acopio energetico";
      description = `Genera ${formatNumber(target)} energia hoy.`;
      break;
    case "eps":
      target = Math.round(45 * Math.pow(2.65, tier - 1) * streakFactor);
      reward = Math.round(target * 70);
      title = "Pico de eficiencia";
      description = `Alcanza ${formatNumber(target)} EPS.`;
      break;
    default:
      break;
  }

  return {
    id: `${date}_${type}_${index}`,
    type,
    title,
    description,
    target: Math.max(1, target),
    reward: Math.max(1, reward),
    claimed: false
  };
}

export function createDailyMissions(date, lifetimeEnergy, streak) {
  const tier = getEconomyTier(lifetimeEnergy);
  const rng = mulberry32(hashString(`${date}_${tier}_${streak}`));
  const selected = shuffleWithRng(MISSION_TYPES, rng).slice(0, 3);
  return selected.map((type, index) => buildMission(type, tier, streak, index, date));
}

export function normalizeMission(raw, fallbackDate, index) {
  if (!raw || typeof raw !== "object") return null;
  const type = MISSION_TYPES.includes(raw.type) ? raw.type : null;
  if (!type) return null;
  const id = typeof raw.id === "string" ? raw.id : `${fallbackDate}_${type}_${index}`;
  const title = typeof raw.title === "string" ? raw.title : "Mision";
  const description = typeof raw.description === "string" ? raw.description : "";
  const target = Math.max(1, Math.floor(numberOr(raw.target, 1)));
  const reward = Math.max(1, Math.floor(numberOr(raw.reward, 1)));
  const claimed = Boolean(raw.claimed);
  return { id, type, title, description, target, reward, claimed };
}

export function getMissionProgress(dailyProgress, mission) {
  switch (mission.type) {
    case "clicks":
      return dailyProgress.clicks;
    case "machines":
      return dailyProgress.machinesBought;
    case "upgrades":
      return dailyProgress.upgradesBought;
    case "energy":
      return dailyProgress.energyGenerated;
    case "eps":
      return dailyProgress.maxEps;
    default:
      return 0;
  }
}

export function isMissionComplete(dailyProgress, mission) {
  return getMissionProgress(dailyProgress, mission) >= mission.target;
}

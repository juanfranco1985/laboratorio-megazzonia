import { BUY_MODES, MACHINE_DEFS, MILESTONE_DEFS, UPGRADE_DEFS } from "./constants.mjs";
import { createLevelMap, getLocalISODate, numberOr, clamp } from "./utils.mjs";
import {
  createDailyMissions,
  createDailyProgress,
  normalizeDailyProgress,
  normalizeMission
} from "./systems/mission-system.mjs";
import { createFactoryState, ensureFactoryDailyState, normalizeFactoryState } from "./systems/card-factory-system.mjs";

export function createInitialState(prestigeCores = 0, lastDailyBonusDate = null) {
  const today = getLocalISODate();
  const factory = createFactoryState();
  ensureFactoryDailyState(factory, today, 0);
  return {
    version: 4,
    energy: 0,
    lifetimeEnergy: 0,
    lifetimeMaxEps: 0,
    drones: 0,
    manualPower: 1,
    clickMomentum: 0,
    machineLevels: createLevelMap(MACHINE_DEFS),
    upgradeLevels: createLevelMap(UPGRADE_DEFS),
    prestigeCores,
    lastSeen: Date.now(),
    lastDailyBonusDate,
    buyMode: "1",
    adBoostExpiresAt: 0,
    adBoostCooldownUntil: 0,
    adBonusCooldownUntil: 0,
    dailyDate: today,
    dailyStreak: 0,
    dailyLastCompletedDate: null,
    dailyMissions: createDailyMissions(today, 0, 0),
    dailyProgress: createDailyProgress(),
    claimedMilestones: {},
    onboardingCompleted: false,
    onboardingClicks: 0,
    factory
  };
}

export function normalizeState(raw) {
  const base = createInitialState();
  if (!raw || typeof raw !== "object") return base;

  base.energy = Math.max(0, numberOr(raw.energy, 0));
  base.lifetimeEnergy = Math.max(0, numberOr(raw.lifetimeEnergy, 0));
  base.lifetimeMaxEps = Math.max(0, numberOr(raw.lifetimeMaxEps, 0));
  base.manualPower = 1;
  base.clickMomentum = clamp(numberOr(raw.clickMomentum, 0), 0, 50);
  base.prestigeCores = Math.max(0, Math.floor(numberOr(raw.prestigeCores, 0)));
  base.lastSeen = numberOr(raw.lastSeen, Date.now());
  base.lastDailyBonusDate = typeof raw.lastDailyBonusDate === "string" ? raw.lastDailyBonusDate : null;

  base.buyMode = BUY_MODES.includes(raw.buyMode) ? raw.buyMode : "1";
  base.adBoostExpiresAt = Math.max(0, numberOr(raw.adBoostExpiresAt, 0));
  base.adBoostCooldownUntil = Math.max(0, numberOr(raw.adBoostCooldownUntil, 0));
  base.adBonusCooldownUntil = Math.max(0, numberOr(raw.adBonusCooldownUntil, 0));

  MACHINE_DEFS.forEach((def) => {
    const level = raw.machineLevels && raw.machineLevels[def.id];
    base.machineLevels[def.id] = Math.max(0, Math.floor(numberOr(level, 0)));
  });

  UPGRADE_DEFS.forEach((def) => {
    const level = raw.upgradeLevels && raw.upgradeLevels[def.id];
    base.upgradeLevels[def.id] = clamp(Math.floor(numberOr(level, 0)), 0, def.maxLevel);
  });

  base.drones = MACHINE_DEFS.reduce((sum, def) => sum + base.machineLevels[def.id], 0);
  if (base.lifetimeEnergy < base.energy) base.lifetimeEnergy = base.energy;

  if (raw.claimedMilestones && typeof raw.claimedMilestones === "object") {
    MILESTONE_DEFS.forEach((def) => {
      if (raw.claimedMilestones[def.id]) base.claimedMilestones[def.id] = true;
    });
  }

  base.dailyDate = typeof raw.dailyDate === "string" ? raw.dailyDate : getLocalISODate();
  base.dailyStreak = Math.max(0, Math.floor(numberOr(raw.dailyStreak, 0)));
  base.dailyLastCompletedDate = typeof raw.dailyLastCompletedDate === "string" ? raw.dailyLastCompletedDate : null;
  base.dailyProgress = normalizeDailyProgress(raw.dailyProgress);

  if (Array.isArray(raw.dailyMissions)) {
    const missions = raw.dailyMissions.map((m, i) => normalizeMission(m, base.dailyDate, i)).filter(Boolean);
    base.dailyMissions = missions.length > 0 ? missions.slice(0, 3) : createDailyMissions(base.dailyDate, base.lifetimeEnergy, base.dailyStreak);
  } else {
    base.dailyMissions = createDailyMissions(base.dailyDate, base.lifetimeEnergy, base.dailyStreak);
  }

  base.onboardingCompleted = Boolean(raw.onboardingCompleted);
  base.onboardingClicks = Math.max(0, Math.floor(numberOr(raw.onboardingClicks, 0)));
  base.factory = normalizeFactoryState(raw.factory);
  ensureFactoryDailyState(base.factory, base.dailyDate, base.lifetimeEnergy);
  return base;
}

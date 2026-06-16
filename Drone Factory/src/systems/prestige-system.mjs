import { BUY_MODES } from "../constants.mjs";
import { createInitialState } from "../state.mjs";
import { normalizeDailyProgress } from "./mission-system.mjs";
import { numberOr } from "../utils.mjs";

export class PrestigeSystem {
  constructor(state) {
    this.state = state;
  }

  getMultiplier() {
    return 1 + this.state.prestigeCores * 0.12;
  }

  getTotalCoresFromLifetime(lifetimeEnergy) {
    if (lifetimeEnergy < 500000) return 0;
    const base = Math.sqrt(lifetimeEnergy / 500000);
    const late = Math.pow(lifetimeEnergy / 500000000, 0.35);
    return Math.floor(base + Math.max(0, late));
  }

  getPotentialGain() {
    const totalCores = this.getTotalCoresFromLifetime(this.state.lifetimeEnergy);
    return Math.max(0, totalCores - this.state.prestigeCores);
  }

  doPrestige() {
    const gain = this.getPotentialGain();
    if (gain <= 0) return 0;

    const totalCores = this.state.prestigeCores + gain;
    const preserved = {
      lastDailyBonusDate: this.state.lastDailyBonusDate,
      buyMode: this.state.buyMode,
      adBoostExpiresAt: this.state.adBoostExpiresAt,
      adBoostCooldownUntil: this.state.adBoostCooldownUntil,
      adBonusCooldownUntil: this.state.adBonusCooldownUntil,
      dailyDate: this.state.dailyDate,
      dailyStreak: this.state.dailyStreak,
      dailyLastCompletedDate: this.state.dailyLastCompletedDate,
      dailyMissions: this.state.dailyMissions,
      dailyProgress: this.state.dailyProgress,
      claimedMilestones: this.state.claimedMilestones,
      onboardingCompleted: this.state.onboardingCompleted,
      onboardingClicks: this.state.onboardingClicks,
      lifetimeMaxEps: this.state.lifetimeMaxEps,
      factory: this.state.factory
    };

    const fresh = createInitialState(totalCores, preserved.lastDailyBonusDate);
    fresh.buyMode = BUY_MODES.includes(preserved.buyMode) ? preserved.buyMode : fresh.buyMode;
    fresh.adBoostExpiresAt = Math.max(0, numberOr(preserved.adBoostExpiresAt, 0));
    fresh.adBoostCooldownUntil = Math.max(0, numberOr(preserved.adBoostCooldownUntil, 0));
    fresh.adBonusCooldownUntil = Math.max(0, numberOr(preserved.adBonusCooldownUntil, 0));
    fresh.dailyDate = typeof preserved.dailyDate === "string" ? preserved.dailyDate : fresh.dailyDate;
    fresh.dailyStreak = Math.max(0, Math.floor(numberOr(preserved.dailyStreak, 0)));
    fresh.dailyLastCompletedDate = typeof preserved.dailyLastCompletedDate === "string" ? preserved.dailyLastCompletedDate : null;
    fresh.dailyMissions = Array.isArray(preserved.dailyMissions) && preserved.dailyMissions.length > 0 ? preserved.dailyMissions : fresh.dailyMissions;
    fresh.dailyProgress = normalizeDailyProgress(preserved.dailyProgress);
    fresh.onboardingCompleted = Boolean(preserved.onboardingCompleted);
    fresh.onboardingClicks = Math.max(0, Math.floor(numberOr(preserved.onboardingClicks, 0)));
    fresh.lifetimeMaxEps = Math.max(0, numberOr(preserved.lifetimeMaxEps, 0));
    if (preserved.factory && typeof preserved.factory === "object") fresh.factory = preserved.factory;
    if (preserved.claimedMilestones && typeof preserved.claimedMilestones === "object") {
      fresh.claimedMilestones = { ...preserved.claimedMilestones };
    }

    Object.keys(this.state).forEach((key) => delete this.state[key]);
    Object.assign(this.state, fresh);
    return gain;
  }
}

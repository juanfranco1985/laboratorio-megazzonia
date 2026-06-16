import { TELEMETRY_STORAGE_KEY } from "../constants.mjs";
import { clamp, numberOr } from "../utils.mjs";

const EVENT_CAP = 140;
const EARLY_CHURN_SECONDS = 120;

function createInitialTelemetry() {
  return {
    version: 1,
    firstSessionAt: null,
    sessions: 0,
    totalSessionSeconds: 0,
    shortSessions: 0,
    firstPrestigeAt: null,
    firstPrestigeSeconds: null,
    totalMissionClaims: 0,
    totalFactoryCrafts: 0,
    totalDroneAssemblies: 0,
    totalContractClaims: 0,
    totalEventDraws: 0,
    totalMissionSets: 0,
    missionSetCompletions: 0,
    issuedMissionDates: {},
    events: []
  };
}

function normalizeTelemetry(raw) {
  const base = createInitialTelemetry();
  if (!raw || typeof raw !== "object") return base;

  base.firstSessionAt = Number.isFinite(raw.firstSessionAt) ? raw.firstSessionAt : null;
  base.sessions = Math.max(0, Math.floor(numberOr(raw.sessions, 0)));
  base.totalSessionSeconds = Math.max(0, numberOr(raw.totalSessionSeconds, 0));
  base.shortSessions = Math.max(0, Math.floor(numberOr(raw.shortSessions, 0)));
  base.firstPrestigeAt = Number.isFinite(raw.firstPrestigeAt) ? raw.firstPrestigeAt : null;
  base.firstPrestigeSeconds = Number.isFinite(raw.firstPrestigeSeconds) ? Math.max(0, raw.firstPrestigeSeconds) : null;
  base.totalMissionClaims = Math.max(0, Math.floor(numberOr(raw.totalMissionClaims, 0)));
  base.totalFactoryCrafts = Math.max(0, Math.floor(numberOr(raw.totalFactoryCrafts, 0)));
  base.totalDroneAssemblies = Math.max(0, Math.floor(numberOr(raw.totalDroneAssemblies, 0)));
  base.totalContractClaims = Math.max(0, Math.floor(numberOr(raw.totalContractClaims, 0)));
  base.totalEventDraws = Math.max(0, Math.floor(numberOr(raw.totalEventDraws, 0)));
  base.totalMissionSets = Math.max(0, Math.floor(numberOr(raw.totalMissionSets, 0)));
  base.missionSetCompletions = Math.max(0, Math.floor(numberOr(raw.missionSetCompletions, 0)));
  base.issuedMissionDates = raw.issuedMissionDates && typeof raw.issuedMissionDates === "object" ? { ...raw.issuedMissionDates } : {};
  base.events = Array.isArray(raw.events) ? raw.events.slice(-EVENT_CAP) : [];
  return base;
}

export class TelemetrySystem {
  constructor(storageKey = TELEMETRY_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.data = this.load();
    this.currentSessionStartedAt = null;
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return createInitialTelemetry();
      return normalizeTelemetry(JSON.parse(raw));
    } catch (_error) {
      return createInitialTelemetry();
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  pushEvent(type, payload = {}) {
    this.data.events.push({
      type,
      payload,
      at: Date.now()
    });
    if (this.data.events.length > EVENT_CAP) this.data.events = this.data.events.slice(-EVENT_CAP);
  }

  startSession() {
    const now = Date.now();
    this.currentSessionStartedAt = now;
    if (!this.data.firstSessionAt) this.data.firstSessionAt = now;
    this.data.sessions += 1;
    this.pushEvent("session_start");
    this.save();
  }

  endSession() {
    if (!this.currentSessionStartedAt) return;
    const now = Date.now();
    const duration = Math.max(0, (now - this.currentSessionStartedAt) / 1000);
    this.data.totalSessionSeconds += duration;
    if (duration < EARLY_CHURN_SECONDS) this.data.shortSessions += 1;
    this.pushEvent("session_end", { durationSeconds: Math.floor(duration) });
    this.currentSessionStartedAt = null;
    this.save();
  }

  trackManualClick() {
    this.pushEvent("manual_click");
  }

  trackMissionClaim(missionId) {
    this.data.totalMissionClaims += 1;
    this.pushEvent("mission_claim", { missionId });
    this.save();
  }

  trackFactoryCraft(stationId, amount) {
    this.data.totalFactoryCrafts += Math.max(0, Math.floor(numberOr(amount, 1)));
    this.pushEvent("factory_craft", { stationId, amount });
    this.save();
  }

  trackDroneAssemble(recipeId, reward) {
    this.data.totalDroneAssemblies += 1;
    this.pushEvent("drone_assembled", { recipeId, reward });
    this.save();
  }

  trackContractClaim(contractId, reward) {
    this.data.totalContractClaims += 1;
    this.pushEvent("contract_claim", { contractId, reward });
    this.save();
  }

  trackEventDraw(eventId) {
    this.data.totalEventDraws += 1;
    this.pushEvent("event_draw", { eventId });
    this.save();
  }

  trackMissionSetIssued(dateKey) {
    if (!dateKey || this.data.issuedMissionDates[dateKey]) return;
    this.data.issuedMissionDates[dateKey] = true;
    this.data.totalMissionSets += 1;
    this.pushEvent("mission_set_issued", { date: dateKey });
    this.save();
  }

  trackMissionSetCompleted(dateKey) {
    this.data.missionSetCompletions += 1;
    this.pushEvent("mission_set_completed", { date: dateKey });
    this.save();
  }

  trackPrestige(totalCores) {
    const now = Date.now();
    if (!this.data.firstPrestigeAt) {
      this.data.firstPrestigeAt = now;
      if (this.data.firstSessionAt) {
        this.data.firstPrestigeSeconds = Math.max(0, (now - this.data.firstSessionAt) / 1000);
      }
    }
    this.pushEvent("prestige", { totalCores });
    this.save();
  }

  getSummary() {
    const sessions = Math.max(1, this.data.sessions);
    const avgSessionSeconds = this.data.totalSessionSeconds / sessions;
    const churnRate = this.data.shortSessions / sessions;
    const missionConversion = this.data.totalMissionSets > 0 ? this.data.missionSetCompletions / this.data.totalMissionSets : 0;
    const firstPrestigeMinutes = this.data.firstPrestigeSeconds !== null
      ? this.data.firstPrestigeSeconds / 60
      : null;

    return {
      sessions: this.data.sessions,
      avgSessionSeconds,
      churnRate: clamp(churnRate, 0, 1),
      missionConversion: clamp(missionConversion, 0, 1),
      firstPrestigeMinutes,
      totalFactoryCrafts: this.data.totalFactoryCrafts,
      totalDroneAssemblies: this.data.totalDroneAssemblies,
      totalContractClaims: this.data.totalContractClaims,
      totalEventDraws: this.data.totalEventDraws
    };
  }

  exportPrettyJson() {
    return JSON.stringify(this.data, null, 2);
  }
}

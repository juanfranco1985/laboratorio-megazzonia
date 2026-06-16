import {
  DRONE_RECIPE_DEFS,
  EVENT_DRAW_COOLDOWN_MS,
  FACTORY_EVENT_DEFS,
  FACTORY_STATION_DEFS
} from "../constants.mjs";
import { clamp, formatNumber, getEconomyTierFromLifetime, hashString, mulberry32, numberOr } from "../utils.mjs";

function createZeroMap(defs) {
  return defs.reduce((acc, def) => {
    acc[def.id] = 0;
    return acc;
  }, {});
}

function createStationLevelMap() {
  return FACTORY_STATION_DEFS.reduce((acc, def) => {
    acc[def.id] = 1;
    return acc;
  }, {});
}

function createInventoryMap() {
  return FACTORY_STATION_DEFS.reduce((acc, def) => {
    acc[def.componentId] = 0;
    return acc;
  }, {});
}

function normalizeComponentMap(raw, defaults) {
  const map = { ...defaults };
  if (!raw || typeof raw !== "object") return map;
  Object.keys(map).forEach((key) => {
    map[key] = Math.max(0, Math.floor(numberOr(raw[key], map[key])));
  });
  return map;
}

function normalizeActiveEvent(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  const expiresAt = Math.max(0, numberOr(raw.expiresAt, 0));
  if (!id || expiresAt <= 0) return null;
  return { id, expiresAt };
}

function createDefaultEventPayload() {
  return {
    activeEvent: null,
    eventCooldownUntil: 0
  };
}

function getEventDefById(eventId) {
  return FACTORY_EVENT_DEFS.find((def) => def.id === eventId) || null;
}

function getRecipeDef(recipeId) {
  return DRONE_RECIPE_DEFS.find((def) => def.id === recipeId) || null;
}

function getStationDef(stationId) {
  return FACTORY_STATION_DEFS.find((def) => def.id === stationId) || null;
}

export function createFactoryState() {
  return {
    stationLevels: createStationLevelMap(),
    stationCooldowns: createZeroMap(FACTORY_STATION_DEFS),
    inventory: createInventoryMap(),
    dronesBuilt: createZeroMap(DRONE_RECIPE_DEFS),
    dailyBuilt: createZeroMap(DRONE_RECIPE_DEFS),
    lifetimeComponentsCrafted: 0,
    lifetimeDronesBuilt: 0,
    contractsClaimed: 0,
    contracts: [],
    event: createDefaultEventPayload()
  };
}

export function normalizeFactoryState(raw) {
  const base = createFactoryState();
  if (!raw || typeof raw !== "object") return base;

  base.stationLevels = normalizeComponentMap(raw.stationLevels, base.stationLevels);
  Object.keys(base.stationLevels).forEach((stationId) => {
    base.stationLevels[stationId] = Math.max(1, base.stationLevels[stationId]);
  });

  base.stationCooldowns = normalizeComponentMap(raw.stationCooldowns, base.stationCooldowns);
  base.inventory = normalizeComponentMap(raw.inventory, base.inventory);
  base.dronesBuilt = normalizeComponentMap(raw.dronesBuilt, base.dronesBuilt);
  base.dailyBuilt = normalizeComponentMap(raw.dailyBuilt, base.dailyBuilt);
  base.lifetimeComponentsCrafted = Math.max(0, Math.floor(numberOr(raw.lifetimeComponentsCrafted, 0)));
  base.lifetimeDronesBuilt = Math.max(0, Math.floor(numberOr(raw.lifetimeDronesBuilt, 0)));
  base.contractsClaimed = Math.max(0, Math.floor(numberOr(raw.contractsClaimed, 0)));

  if (Array.isArray(raw.contracts)) {
    base.contracts = raw.contracts
      .filter((item) => item && typeof item === "object")
      .map((item, idx) => {
        const recipeId = typeof item.recipeId === "string" ? item.recipeId : "sparrow";
        return {
          id: typeof item.id === "string" ? item.id : `ct_${idx}`,
          recipeId,
          target: Math.max(1, Math.floor(numberOr(item.target, 1))),
          reward: Math.max(1, numberOr(item.reward, 1)),
          claimed: Boolean(item.claimed),
          title: typeof item.title === "string" ? item.title : "Contrato industrial"
        };
      })
      .slice(0, 3);
  }

  const eventRaw = raw.event && typeof raw.event === "object" ? raw.event : null;
  if (eventRaw) {
    base.event = {
      activeEvent: normalizeActiveEvent(eventRaw.activeEvent),
      eventCooldownUntil: Math.max(0, numberOr(eventRaw.eventCooldownUntil, 0))
    };
  }

  return base;
}

export function createDailyContracts(date, lifetimeEnergy) {
  const tier = clamp(getEconomyTierFromLifetime(lifetimeEnergy), 1, 8);
  const rng = mulberry32(hashString(`contracts_${date}_${tier}`));
  const recipes = [...DRONE_RECIPE_DEFS].filter((recipe) => lifetimeEnergy >= recipe.unlockAt || recipe.unlockAt === 0);
  const selected = recipes.sort(() => rng() - 0.5).slice(0, Math.min(2, recipes.length));

  return selected.map((recipe, idx) => {
    const baseTarget = Math.max(2, Math.floor(2 + tier * 0.9 + idx));
    const target = Math.max(1, Math.round(baseTarget * (0.95 + rng() * 0.2)));
    const reward = Math.round(recipe.saleReward * target * (0.38 + tier * 0.05));
    return {
      id: `${date}_${recipe.id}_${idx}`,
      recipeId: recipe.id,
      title: `Contrato ${recipe.name}`,
      target,
      reward,
      claimed: false
    };
  });
}

export function ensureFactoryDailyState(factoryState, dailyDate, lifetimeEnergy) {
  if (!Array.isArray(factoryState.contracts) || factoryState.contracts.length <= 0) {
    factoryState.contracts = createDailyContracts(dailyDate, lifetimeEnergy);
  }
}

export class CardFactorySystem {
  constructor(state) {
    this.state = state;
  }

  get factory() {
    return this.state.factory;
  }

  getEventDef(now = Date.now()) {
    const active = this.factory.event.activeEvent;
    if (!active) return null;
    if (now >= active.expiresAt) {
      this.factory.event.activeEvent = null;
      return null;
    }
    return getEventDefById(active.id);
  }

  getEventMultipliers(now = Date.now()) {
    const event = this.getEventDef(now);
    return {
      craftCostMultiplier: event ? event.craftCostMultiplier : 1,
      craftCooldownMultiplier: event ? event.craftCooldownMultiplier : 1,
      saleMultiplier: event ? event.saleMultiplier : 1,
      fleetEpsMultiplier: event ? event.fleetEpsMultiplier : 1,
      activeEvent: event
    };
  }

  getStationLevel(stationId) {
    return Math.max(1, Math.floor(numberOr(this.factory.stationLevels[stationId], 1)));
  }

  isStationUnlocked(stationDef) {
    return stationDef.unlockAt === 0 || this.state.lifetimeEnergy >= stationDef.unlockAt || this.getStationLevel(stationDef.id) > 1;
  }

  getStationUpgradeCost(stationDef) {
    const level = this.getStationLevel(stationDef.id);
    return stationDef.upgradeBaseCost * Math.pow(stationDef.upgradeCostGrowth, level - 1);
  }

  getStationCraftCost(stationDef, now = Date.now()) {
    const level = this.getStationLevel(stationDef.id);
    const event = this.getEventMultipliers(now);
    const base = stationDef.baseCraftCost * Math.pow(stationDef.craftCostGrowth, level - 1);
    return base * event.craftCostMultiplier;
  }

  getStationCooldownMs(stationDef, now = Date.now()) {
    const level = this.getStationLevel(stationDef.id);
    const event = this.getEventMultipliers(now);
    const seconds = stationDef.baseCooldownSec * Math.pow(stationDef.cooldownDecay, level - 1);
    return Math.max(900, seconds * 1000 * event.craftCooldownMultiplier);
  }

  getStationOutputAmount(stationDef) {
    const level = this.getStationLevel(stationDef.id);
    return Math.max(1, Math.floor(stationDef.baseCraftAmount + (level - 1) * 0.7));
  }

  canCraft(stationDef, now = Date.now()) {
    const cooldownUntil = Math.max(0, numberOr(this.factory.stationCooldowns[stationDef.id], 0));
    if (now < cooldownUntil) return { ok: false, reason: "cooldown", waitMs: cooldownUntil - now };
    const cost = this.getStationCraftCost(stationDef, now);
    if (this.state.energy + 1e-9 < cost) return { ok: false, reason: "energy", waitMs: 0 };
    return { ok: true, reason: "", waitMs: 0 };
  }

  craftComponent(stationId, resourceSystem, now = Date.now()) {
    const stationDef = getStationDef(stationId);
    if (!stationDef) return { ok: false, reason: "missing" };
    if (!this.isStationUnlocked(stationDef)) return { ok: false, reason: "locked" };

    const check = this.canCraft(stationDef, now);
    if (!check.ok) return { ok: false, reason: check.reason, waitMs: check.waitMs };

    const cost = this.getStationCraftCost(stationDef, now);
    if (!resourceSystem.spendEnergy(cost)) return { ok: false, reason: "energy" };

    const amount = this.getStationOutputAmount(stationDef);
    this.factory.inventory[stationDef.componentId] += amount;
    this.factory.lifetimeComponentsCrafted += amount;
    this.factory.stationCooldowns[stationDef.id] = now + this.getStationCooldownMs(stationDef, now);
    return { ok: true, amount, componentId: stationDef.componentId, componentName: stationDef.componentName, cost };
  }

  upgradeStation(stationId, resourceSystem) {
    const stationDef = getStationDef(stationId);
    if (!stationDef) return { ok: false, reason: "missing" };
    if (!this.isStationUnlocked(stationDef)) return { ok: false, reason: "locked" };
    const cost = this.getStationUpgradeCost(stationDef);
    if (!resourceSystem.spendEnergy(cost)) return { ok: false, reason: "energy", cost };
    this.factory.stationLevels[stationId] = this.getStationLevel(stationId) + 1;
    return { ok: true, newLevel: this.factory.stationLevels[stationId], cost };
  }

  isRecipeUnlocked(recipeDef) {
    return this.state.lifetimeEnergy >= recipeDef.unlockAt || recipeDef.unlockAt === 0;
  }

  canAssemble(recipeDef) {
    if (!this.isRecipeUnlocked(recipeDef)) return false;
    return Object.entries(recipeDef.requirements).every(([componentId, qty]) => {
      return numberOr(this.factory.inventory[componentId], 0) >= qty;
    });
  }

  getRecipeDeficit(recipeId) {
    const recipe = getRecipeDef(recipeId);
    if (!recipe) return null;
    const deficits = {};
    Object.entries(recipe.requirements).forEach(([componentId, qty]) => {
      const have = Math.max(0, numberOr(this.factory.inventory[componentId], 0));
      deficits[componentId] = Math.max(0, qty - have);
    });
    return deficits;
  }

  getRecommendedRecipeId() {
    const unclaimedContract = (this.factory.contracts || []).find((item) => !item.claimed);
    if (unclaimedContract) return unclaimedContract.recipeId;
    const unlocked = DRONE_RECIPE_DEFS.filter((recipe) => this.isRecipeUnlocked(recipe));
    if (unlocked.length <= 0) return DRONE_RECIPE_DEFS[0].id;
    return unlocked[0].id;
  }

  assembleDrone(recipeId, resourceSystem, globalMultiplier = 1, now = Date.now()) {
    const recipe = getRecipeDef(recipeId);
    if (!recipe) return { ok: false, reason: "missing" };
    if (!this.canAssemble(recipe)) return { ok: false, reason: "inventory" };

    Object.entries(recipe.requirements).forEach(([componentId, qty]) => {
      this.factory.inventory[componentId] = Math.max(0, this.factory.inventory[componentId] - qty);
    });

    const event = this.getEventMultipliers(now);
    const reward = recipe.saleReward * globalMultiplier * event.saleMultiplier;
    resourceSystem.addEnergy(reward, "droneSale");
    this.factory.dronesBuilt[recipe.id] += 1;
    this.factory.dailyBuilt[recipe.id] += 1;
    this.factory.lifetimeDronesBuilt += 1;
    return { ok: true, reward, recipe };
  }

  getFleetEPS(now = Date.now()) {
    const event = this.getEventMultipliers(now);
    const total = DRONE_RECIPE_DEFS.reduce((sum, recipe) => {
      const count = Math.max(0, numberOr(this.factory.dronesBuilt[recipe.id], 0));
      if (count <= 0) return sum;
      const scaling = count + Math.pow(count, 0.72) * 0.65;
      return sum + recipe.baseFleetEps * scaling;
    }, 0);
    return total * event.fleetEpsMultiplier;
  }

  drawEventCard(now = Date.now()) {
    if (now < this.factory.event.eventCooldownUntil) {
      return { ok: false, reason: "cooldown", waitMs: this.factory.event.eventCooldownUntil - now };
    }
    const roll = FACTORY_EVENT_DEFS[Math.floor(Math.random() * FACTORY_EVENT_DEFS.length)];
    this.factory.event.activeEvent = {
      id: roll.id,
      expiresAt: now + roll.durationSec * 1000
    };
    this.factory.event.eventCooldownUntil = now + EVENT_DRAW_COOLDOWN_MS;
    return { ok: true, event: roll, expiresAt: this.factory.event.activeEvent.expiresAt };
  }

  claimContract(contractId, resourceSystem) {
    const contract = this.factory.contracts.find((item) => item.id === contractId);
    if (!contract || contract.claimed) return { ok: false, reason: "missing" };
    const progress = Math.max(0, numberOr(this.factory.dailyBuilt[contract.recipeId], 0));
    if (progress < contract.target) return { ok: false, reason: "progress" };
    contract.claimed = true;
    this.factory.contractsClaimed += 1;
    resourceSystem.addEnergy(contract.reward, "contract");
    return { ok: true, reward: contract.reward, contract };
  }

  getContractProgress(contract) {
    return Math.max(0, numberOr(this.factory.dailyBuilt[contract.recipeId], 0));
  }

  resetDailyProduction(dailyDate, lifetimeEnergy) {
    this.factory.dailyBuilt = createZeroMap(DRONE_RECIPE_DEFS);
    this.factory.contracts = createDailyContracts(dailyDate, lifetimeEnergy);
  }

  getInventorySummaryText() {
    const chunks = FACTORY_STATION_DEFS.map((station) => {
      const count = Math.max(0, numberOr(this.factory.inventory[station.componentId], 0));
      return `${station.componentName}:${formatNumber(count)}`;
    });
    return chunks.join(" | ");
  }
}

import { MACHINE_DEFS, UPGRADE_DEFS } from "../constants.mjs";
import { numberOr } from "../utils.mjs";

export class EconomySystem {
  constructor(state) {
    this.state = state;
  }

  getMachineLevel(machineId) {
    return this.state.machineLevels[machineId] || 0;
  }

  getUpgradeLevel(upgradeId) {
    return this.state.upgradeLevels[upgradeId] || 0;
  }

  getSeriesCost(baseCost, growth, startLevel, quantity) {
    if (quantity <= 0) return 0;
    const startCost = baseCost * Math.pow(growth, startLevel);
    if (growth === 1) return startCost * quantity;
    return startCost * (Math.pow(growth, quantity) - 1) / (growth - 1);
  }

  getAffordableCount(baseCost, growth, startLevel, budget, cap = Number.POSITIVE_INFINITY) {
    const safeCap = Number.isFinite(cap) ? cap : 100000;
    if (budget <= 0 || safeCap <= 0) return 0;
    if (this.getSeriesCost(baseCost, growth, startLevel, 1) > budget) return 0;

    let low = 1;
    let high = 1;
    while (high < safeCap && this.getSeriesCost(baseCost, growth, startLevel, high) <= budget) {
      high *= 2;
      if (high > safeCap) {
        high = safeCap;
        break;
      }
    }

    if (this.getSeriesCost(baseCost, growth, startLevel, high) <= budget) return high;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const cost = this.getSeriesCost(baseCost, growth, startLevel, mid);
      if (cost <= budget) low = mid;
      else high = mid - 1;
    }
    return low;
  }

  resolveQuantity(mode, affordable, cap = Number.POSITIVE_INFINITY) {
    if (affordable <= 0 || cap <= 0) return 0;
    if (mode === "max") return Math.min(affordable, cap);
    const requested = Math.max(1, Math.floor(numberOr(mode, 1)));
    return Math.min(requested, affordable, cap);
  }

  getMachinePurchasePlan(machineId, budget, mode) {
    const def = MACHINE_DEFS.find((it) => it.id === machineId);
    if (!def) return null;
    const startLevel = this.getMachineLevel(machineId);
    const affordable = this.getAffordableCount(def.baseCost, def.costGrowth, startLevel, budget);
    const quantity = this.resolveQuantity(mode, affordable);
    const totalCost = this.getSeriesCost(def.baseCost, def.costGrowth, startLevel, quantity);
    return { def, quantity, totalCost };
  }

  getUpgradePurchasePlan(upgradeId, budget, mode) {
    const def = UPGRADE_DEFS.find((it) => it.id === upgradeId);
    if (!def) return null;
    const startLevel = this.getUpgradeLevel(upgradeId);
    const cap = Math.max(0, def.maxLevel - startLevel);
    const affordable = this.getAffordableCount(def.baseCost, def.costGrowth, startLevel, budget, cap);
    const quantity = this.resolveQuantity(mode, affordable, cap);
    const totalCost = this.getSeriesCost(def.baseCost, def.costGrowth, startLevel, quantity);
    return { def, quantity, totalCost };
  }

  buyMachine(machineId, resourceSystem, mode = "1") {
    const plan = this.getMachinePurchasePlan(machineId, this.state.energy, mode);
    if (!plan || plan.quantity <= 0) return { ok: false, quantity: 0, totalCost: 0 };
    if (!resourceSystem.spendEnergy(plan.totalCost)) return { ok: false, quantity: 0, totalCost: 0 };
    this.state.machineLevels[machineId] += plan.quantity;
    this.state.drones += plan.quantity;
    return { ok: true, quantity: plan.quantity, totalCost: plan.totalCost };
  }

  buyUpgrade(upgradeId, resourceSystem, mode = "1") {
    const plan = this.getUpgradePurchasePlan(upgradeId, this.state.energy, mode);
    if (!plan || plan.quantity <= 0) return { ok: false, quantity: 0, totalCost: 0 };
    if (!resourceSystem.spendEnergy(plan.totalCost)) return { ok: false, quantity: 0, totalCost: 0 };
    this.state.upgradeLevels[upgradeId] += plan.quantity;
    return { ok: true, quantity: plan.quantity, totalCost: plan.totalCost };
  }

  computeMachineContribution(def, count) {
    if (count <= 0) return 0;
    switch (def.curve) {
      case "linear":
        return def.baseProduction * count;
      case "quadratic":
        return def.baseProduction * (count + 0.08 * count * count);
      case "exponential":
        return def.baseProduction * ((Math.pow(1.07, count) - 1) / 0.07);
      case "hyper":
        return def.baseProduction * Math.pow(count, 1.2) * Math.pow(1.03, count);
      default:
        return def.baseProduction * count;
    }
  }

  getProgressionMultiplier() {
    const life = this.state.lifetimeEnergy;
    if (life < 50000) return 1 + (life / 50000) * 0.7;
    if (life < 5000000) {
      const t = (life - 50000) / 4950000;
      return 1.7 + 2.8 * t * t;
    }
    const t = Math.log10(life / 5000000 + 1);
    return 4.5 * Math.pow(1.22, t);
  }

  getUpgradeModifiers() {
    const m = {
      basePerDrone: 0,
      speedMultiplier: 1,
      globalMultiplier: 1,
      manualMultiplier: 1,
      droneSynergyMultiplier: 1,
      replicationMultiplier: 1
    };

    UPGRADE_DEFS.forEach((def) => {
      const level = this.getUpgradeLevel(def.id);
      if (level <= 0) return;
      switch (def.effect) {
        case "basePerDrone":
          m.basePerDrone += def.basePerLevel * level;
          break;
        case "speedMult":
          m.speedMultiplier *= Math.pow(def.multPerLevel, level);
          break;
        case "globalMult":
          m.globalMultiplier *= Math.pow(def.multPerLevel, level);
          break;
        case "manualPower":
          m.manualMultiplier *= Math.pow(def.multPerLevel, level);
          break;
        case "droneSynergy":
          m.droneSynergyMultiplier *= 1 + def.perDroneBonus * this.state.drones * level;
          break;
        case "replicationBoost":
          m.replicationMultiplier *= Math.pow(def.multPerLevel, level);
          break;
        default:
          break;
      }
    });

    return m;
  }

  getProductionBreakdown(externalMultiplier = 1) {
    const modifiers = this.getUpgradeModifiers();
    let machineBase = 0;
    MACHINE_DEFS.forEach((def) => {
      const count = this.getMachineLevel(def.id);
      machineBase += this.computeMachineContribution(def, count);
    });

    const basePerDroneAdd = this.state.drones * modifiers.basePerDrone;
    const baseOutput = machineBase + basePerDroneAdd;
    const momentumMultiplier = 1 + this.state.clickMomentum * 0.012;
    const progressionMultiplier = this.getProgressionMultiplier();
    const totalMultiplier = modifiers.speedMultiplier *
      modifiers.globalMultiplier *
      modifiers.droneSynergyMultiplier *
      modifiers.replicationMultiplier *
      momentumMultiplier *
      progressionMultiplier *
      externalMultiplier;
    const totalEps = Math.max(0, baseOutput * totalMultiplier);

    return {
      machineBase,
      basePerDroneAdd,
      baseOutput,
      speedMultiplier: modifiers.speedMultiplier,
      upgradeGlobalMultiplier: modifiers.globalMultiplier,
      droneSynergyMultiplier: modifiers.droneSynergyMultiplier,
      replicationMultiplier: modifiers.replicationMultiplier,
      momentumMultiplier,
      progressionMultiplier,
      externalMultiplier,
      totalMultiplier,
      totalEps
    };
  }

  computeEPS(externalMultiplier = 1) {
    return this.getProductionBreakdown(externalMultiplier).totalEps;
  }

  getManualClickValue(externalMultiplier = 1) {
    const modifiers = this.getUpgradeModifiers();
    const momentumBoost = 1 + this.state.clickMomentum * 0.03;
    return this.state.manualPower * modifiers.manualMultiplier * externalMultiplier * momentumBoost;
  }
}

import { createInitialState } from "../src/state.mjs";
import { ResourceSystem } from "../src/systems/resource-system.mjs";
import { EconomySystem } from "../src/systems/economy-system.mjs";
import { CardFactorySystem } from "../src/systems/card-factory-system.mjs";
import { FACTORY_STATION_DEFS } from "../src/constants.mjs";

const SIM_SECONDS = Number(process.env.SIM_SECONDS || 1800);
const CLICKS_PER_SECOND = Number(process.env.CLICKS_PER_SECOND || 2);

const state = createInitialState();
state.energy = 140;
state.lifetimeEnergy = 140;

const resourceSystem = new ResourceSystem(state);
const economySystem = new EconomySystem(state);
const cardFactorySystem = new CardFactorySystem(state);

let firstDroneAt = null;
let firstContractAt = null;
let firstEventAt = null;
let prestigeReachedAt = null;

for (let second = 0; second <= SIM_SECONDS; second += 1) {
  const now = second * 1000;

  const clickValue = economySystem.getManualClickValue(1);
  for (let i = 0; i < CLICKS_PER_SECOND; i += 1) {
    resourceSystem.manualClick(clickValue);
  }

  const totalEps = economySystem.computeEPS(1) + cardFactorySystem.getFleetEPS(now);
  resourceSystem.tick(1, totalEps);

  if (!firstEventAt && second > 0 && second % 120 === 0) {
    const event = cardFactorySystem.drawEventCard(now);
    if (event.ok) firstEventAt = second;
  }

  const focusRecipeId = cardFactorySystem.getRecommendedRecipeId();
  const deficits = cardFactorySystem.getRecipeDeficit(focusRecipeId) || {};
  const orderedNeeds = Object.entries(deficits).sort((a, b) => b[1] - a[1]);

  for (const [componentId, qty] of orderedNeeds) {
    if (qty <= 0) continue;
    const station = FACTORY_STATION_DEFS.find((def) => def.componentId === componentId);
    if (!station || !cardFactorySystem.isStationUnlocked(station)) continue;
    cardFactorySystem.craftComponent(station.id, resourceSystem, now);
  }

  let assembled = true;
  while (assembled) {
    assembled = false;
    const result = cardFactorySystem.assembleDrone(focusRecipeId, resourceSystem, 1, now);
    if (result.ok) {
      assembled = true;
      if (firstDroneAt === null) firstDroneAt = second;
    }
  }

  for (const contract of state.factory.contracts) {
    const claim = cardFactorySystem.claimContract(contract.id, resourceSystem);
    if (claim.ok && firstContractAt === null) firstContractAt = second;
  }

  for (const station of FACTORY_STATION_DEFS) {
    if (!cardFactorySystem.isStationUnlocked(station)) continue;
    const level = cardFactorySystem.getStationLevel(station.id);
    const cost = cardFactorySystem.getStationUpgradeCost(station);
    const shouldUpgrade = state.energy >= cost && level < 7 && (level < 3 || cost < Math.max(2200, state.energy * 0.15));
    if (shouldUpgrade) cardFactorySystem.upgradeStation(station.id, resourceSystem);
  }

  if (!prestigeReachedAt && state.lifetimeEnergy >= 500000) {
    prestigeReachedAt = second;
    break;
  }
}

console.log(JSON.stringify({
  simSeconds: SIM_SECONDS,
  clicksPerSecond: CLICKS_PER_SECOND,
  firstDroneAtSec: firstDroneAt,
  firstContractAtSec: firstContractAt,
  firstEventAtSec: firstEventAt,
  prestigeReachedAtSec: prestigeReachedAt,
  final: {
    energy: state.energy,
    lifetimeEnergy: state.lifetimeEnergy,
    lifetimeDronesBuilt: state.factory.lifetimeDronesBuilt,
    stationLevels: state.factory.stationLevels
  }
}, null, 2));

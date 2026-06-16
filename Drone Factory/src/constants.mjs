export const STORAGE_KEY = "drone_factory_save_v1";
export const TELEMETRY_STORAGE_KEY = "drone_factory_telemetry_v1";
export const SAVE_INTERVAL_MS = 10000;
export const UI_REFRESH_MS = 240;
export const SECONDARY_UI_REFRESH_MS = 700;
export const TELEMETRY_REFRESH_MS = 1600;
export const ONBOARDING_REFRESH_MS = 900;
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
export const AD_BOOST_DURATION_MS = 120000;
export const AD_BOOST_COOLDOWN_MS = 300000;
export const AD_BONUS_COOLDOWN_MS = 90000;
export const META_CHECK_MS = 2500;
export const BUY_MODES = ["1", "10", "max"];

export const MACHINE_DEFS = [
  { id: "mk1", name: "Drone MK-I", description: "Unidad base de produccion lineal.", baseCost: 12, costGrowth: 1.15, baseProduction: 0.35, unlockAt: 0, curve: "linear" },
  { id: "assembly", name: "Linea Auto-Assembly", description: "Escala cuadratica al acumular unidades.", baseCost: 180, costGrowth: 1.18, baseProduction: 5, unlockAt: 220, curve: "quadratic" },
  { id: "fusion", name: "Nucleo de Fusion", description: "Escala exponencial para juego medio.", baseCost: 4800, costGrowth: 1.22, baseProduction: 85, unlockAt: 18000, curve: "exponential" },
  { id: "swarm", name: "Enjambre IA", description: "Autorreplicacion masiva para late game.", baseCost: 220000, costGrowth: 1.27, baseProduction: 1800, unlockAt: 1200000, curve: "hyper" }
];

export const UPGRADE_DEFS = [
  { id: "base_amplifier", name: "Amplificador Base", description: "+EPS base por dron total.", effect: "basePerDrone", basePerLevel: 0.8, baseCost: 70, costGrowth: 1.65, maxLevel: 40, unlockAt: 50 },
  { id: "manual_rig", name: "Control Manual", description: "Aumenta energia por click.", effect: "manualPower", multPerLevel: 1.6, baseCost: 120, costGrowth: 1.9, maxLevel: 18, unlockAt: 100 },
  { id: "overclock", name: "Overclock Protocol", description: "Aumenta velocidad de produccion.", effect: "speedMult", multPerLevel: 1.12, baseCost: 350, costGrowth: 2.05, maxLevel: 30, unlockAt: 300 },
  { id: "swarm_synergy", name: "Swarm Synergy", description: "Bonus cuadratico por cantidad de drones.", effect: "droneSynergy", perDroneBonus: 0.0009, baseCost: 2200, costGrowth: 2.6, maxLevel: 20, unlockAt: 4000 },
  { id: "quantum_multiplier", name: "Multiplicador Cuantico", description: "Multiplicador global de produccion.", effect: "globalMult", multPerLevel: 1.35, baseCost: 4500, costGrowth: 3.2, maxLevel: 12, unlockAt: 8000 },
  { id: "auto_replicator", name: "Auto Replicator", description: "Acelera etapa exponencial tardia.", effect: "replicationBoost", multPerLevel: 1.2, baseCost: 25000, costGrowth: 3.1, maxLevel: 10, unlockAt: 90000 }
];

export const MILESTONE_DEFS = [
  { id: "grid_1", threshold: 25000, bonusMultiplier: 1.04, coreReward: 0, label: "Subred industrial" },
  { id: "grid_2", threshold: 250000, bonusMultiplier: 1.06, coreReward: 1, label: "Cluster autonomo" },
  { id: "grid_3", threshold: 2500000, bonusMultiplier: 1.08, coreReward: 1, label: "Fabrica orbital" },
  { id: "grid_4", threshold: 30000000, bonusMultiplier: 1.1, coreReward: 2, label: "Anillo de replicas" },
  { id: "grid_5", threshold: 450000000, bonusMultiplier: 1.12, coreReward: 2, label: "Megacolmena IA" },
  { id: "grid_6", threshold: 7000000000, bonusMultiplier: 1.15, coreReward: 3, label: "Matriz singular" }
];

export const MISSION_TYPES = ["clicks", "machines", "upgrades", "energy", "eps"];

export const FACTORY_STATION_DEFS = [
  {
    id: "frame_bay",
    name: "Frame Bay",
    description: "Corta y suelda bastidores de carbono.",
    componentId: "frame",
    componentName: "Frame",
    baseCraftCost: 18,
    craftCostGrowth: 1.12,
    baseCooldownSec: 6.2,
    cooldownDecay: 0.95,
    baseCraftAmount: 1,
    unlockAt: 0,
    upgradeBaseCost: 120,
    upgradeCostGrowth: 1.66
  },
  {
    id: "propulsion_lab",
    name: "Propulsion Lab",
    description: "Ensambla rotores y control de empuje.",
    componentId: "rotor",
    componentName: "Rotor",
    baseCraftCost: 24,
    craftCostGrowth: 1.13,
    baseCooldownSec: 6.8,
    cooldownDecay: 0.95,
    baseCraftAmount: 1,
    unlockAt: 0,
    upgradeBaseCost: 150,
    upgradeCostGrowth: 1.68
  },
  {
    id: "power_cell",
    name: "Power Cell",
    description: "Construye baterias de alta densidad.",
    componentId: "battery",
    componentName: "Battery",
    baseCraftCost: 32,
    craftCostGrowth: 1.14,
    baseCooldownSec: 7.6,
    cooldownDecay: 0.95,
    baseCraftAmount: 1,
    unlockAt: 120,
    upgradeBaseCost: 220,
    upgradeCostGrowth: 1.72
  },
  {
    id: "ai_desk",
    name: "AI Desk",
    description: "Programa avionica y navegacion autonoma.",
    componentId: "avionics",
    componentName: "Avionics",
    baseCraftCost: 40,
    craftCostGrowth: 1.14,
    baseCooldownSec: 8.2,
    cooldownDecay: 0.95,
    baseCraftAmount: 1,
    unlockAt: 260,
    upgradeBaseCost: 300,
    upgradeCostGrowth: 1.74
  },
  {
    id: "composite_mold",
    name: "Composite Mold",
    description: "Produce carcasa aerodinamica final.",
    componentId: "shell",
    componentName: "Shell",
    baseCraftCost: 52,
    craftCostGrowth: 1.15,
    baseCooldownSec: 8.8,
    cooldownDecay: 0.95,
    baseCraftAmount: 1,
    unlockAt: 480,
    upgradeBaseCost: 400,
    upgradeCostGrowth: 1.75
  }
];

export const DRONE_RECIPE_DEFS = [
  {
    id: "sparrow",
    name: "Sparrow Scout",
    description: "Reconocimiento ligero para misiones urbanas.",
    unlockAt: 0,
    requirements: { frame: 1, rotor: 1, battery: 1, avionics: 1, shell: 1 },
    saleReward: 520,
    baseFleetEps: 0.9
  },
  {
    id: "falcon",
    name: "Falcon Carrier",
    description: "Carga media con autonomia extendida.",
    unlockAt: 18000,
    requirements: { frame: 2, rotor: 4, battery: 2, avionics: 2, shell: 2 },
    saleReward: 3200,
    baseFleetEps: 3
  },
  {
    id: "atlas",
    name: "Atlas Heavy",
    description: "Unidad industrial de alto tonelaje.",
    unlockAt: 240000,
    requirements: { frame: 5, rotor: 8, battery: 6, avionics: 4, shell: 4 },
    saleReward: 34000,
    baseFleetEps: 15
  }
];

export const FACTORY_EVENT_DEFS = [
  {
    id: "supply_rush",
    name: "Supply Rush",
    description: "Coste de componentes -25% por 75s.",
    durationSec: 75,
    craftCostMultiplier: 0.75,
    craftCooldownMultiplier: 1,
    saleMultiplier: 1,
    fleetEpsMultiplier: 1
  },
  {
    id: "assembly_overdrive",
    name: "Assembly Overdrive",
    description: "Cooldown de estaciones -30% por 70s.",
    durationSec: 70,
    craftCostMultiplier: 1,
    craftCooldownMultiplier: 0.7,
    saleMultiplier: 1,
    fleetEpsMultiplier: 1
  },
  {
    id: "market_window",
    name: "Market Window",
    description: "Venta de drones +35% por 60s.",
    durationSec: 60,
    craftCostMultiplier: 1,
    craftCooldownMultiplier: 1,
    saleMultiplier: 1.35,
    fleetEpsMultiplier: 1
  },
  {
    id: "fleet_sync",
    name: "Fleet Sync",
    description: "EPS de drones finales x1.5 por 80s.",
    durationSec: 80,
    craftCostMultiplier: 1,
    craftCooldownMultiplier: 1,
    saleMultiplier: 1,
    fleetEpsMultiplier: 1.5
  }
];

export const EVENT_DRAW_COOLDOWN_MS = 90000;

export const ONBOARDING_STEPS = [
  { id: "step_components", label: "Fabrica 20 componentes", type: "componentsCrafted", target: 20 },
  { id: "step_sparrow", label: "Ensambla 3 Sparrow Scout", type: "recipeBuilt", recipeId: "sparrow", target: 3 },
  { id: "step_station", label: "Sube una estacion a nivel 2", type: "stationAny", target: 2 },
  { id: "step_contract", label: "Completa 1 contrato diario", type: "contractsClaimed", target: 1 }
];

import { PHASES, TEAM_PLAYER, WIDTH, HEIGHT } from "../core/constants.js";
import { tileCenter } from "../core/math.js";
import { getDefaultScenarioId, getScenario } from "../data/scenarios.js";
import { STRUCTURE_TYPES } from "../data/structureTypes.js";
import { UNIT_TYPES } from "../data/unitTypes.js";
import { createMapGrid } from "../map/mapGrid.js";
import { showMessage } from "./battleState.js";

let nextEntityId = 1;

function makeId(prefix) {
  const id = `${prefix}_${nextEntityId}`;
  nextEntityId += 1;
  return id;
}

function createOrder(type, x, y, targetId = null) {
  return {
    type,
    x,
    y,
    targetId,
    path: [],
    pathIndex: 0,
    pathGoalX: x,
    pathGoalY: y,
    repathMs: 0,
  };
}

function createUnit(spec) {
  const template = UNIT_TYPES[spec.type];
  const position = tileCenter(spec.gx, spec.gy);

  return {
    id: makeId("unit"),
    entityType: "unit",
    team: spec.team,
    unitType: spec.type,
    label: spec.label || template.name,
    x: position.x,
    y: position.y,
    dir: spec.dir ?? (spec.team === TEAM_PLAYER ? 0 : Math.PI),
    radius: template.radius,
    speed: template.speed,
    maxHp: template.maxHp,
    hp: template.maxHp,
    frontArmor: template.frontArmor,
    sideArmor: template.sideArmor,
    range: template.range,
    preferredRange: template.preferredRange,
    reloadMs: template.reloadMs,
    reloadLeftMs: Math.random() * template.reloadMs * 0.35,
    damage: template.damage,
    penetration: template.penetration,
    projectileSpeed: template.projectileSpeed,
    accuracy: template.accuracy,
    splashRadius: template.splashRadius,
    requiresStationary: template.requiresStationary,
    spriteKey: template.sprite,
    alive: true,
    state: "idle",
    order: createOrder("hold", position.x, position.y, null),
    queuedOrders: [],
    targetId: null,
    manualTargetId: null,
    role: spec.type,
    suppressUntilMs: 0,
    moveIntent: { x: 0, y: 0 },
  };
}

function createStructure(spec) {
  const template = STRUCTURE_TYPES[spec.type];
  const position = tileCenter(spec.gx, spec.gy);

  return {
    id: makeId("structure"),
    entityType: "structure",
    team: spec.team,
    structureType: spec.type,
    label: template.name,
    x: position.x,
    y: position.y,
    dir: spec.dir ?? 0,
    width: template.width,
    height: template.height,
    maxHp: template.maxHp,
    hp: template.maxHp,
    frontArmor: template.armorFront,
    sideArmor: template.armorSide,
    blocksMovement: template.blocksMovement,
    repairRadius: template.repairRadius || 0,
    repairPerSecond: template.repairPerSecond || 0,
    alive: true,
    state: "idle",
    targetId: null,
    moveIntent: { x: 0, y: 0 },
    ...(template.weapon || {}),
    reloadLeftMs: template.weapon ? Math.random() * template.weapon.reloadMs * 0.4 : 0,
  };
}

function assignPlayerOpeningOrders(state) {
  const defenseSlots = state.scenario.controlPoints.playerDefense.map((point) => tileCenter(point.gx, point.gy));
  const playerUnits = state.units.filter((unit) => unit.team === TEAM_PLAYER);
  playerUnits.forEach((unit, index) => {
    const slot = defenseSlots[index % defenseSlots.length];
    unit.order = createOrder("defend-area", slot.x, slot.y, null);
  });
}

export function createGameState(scenarioId = getDefaultScenarioId()) {
  const scenario = getScenario(scenarioId);
  const state = {
    scenario,
    phase: PHASES.BATTLE,
    overlayText: "",
    result: null,
    width: WIDTH,
    height: HEIGHT,
    timeMs: 0,
    map: createMapGrid(scenario),
    units: scenario.units.map(createUnit),
    structures: scenario.structures.map(createStructure),
    projectiles: [],
    effects: [],
    selection: {
      unitIds: [],
    },
    input: {
      mouseWorld: { x: 0, y: 0 },
      dragOrigin: null,
      dragCurrent: null,
      dragRect: null,
    },
    ai: {
      orderTimerMs: 0,
    },
    message: null,
    objectiveText: `Escenario ${scenario.name}: destruye el fuerte enemigo y protege el tuyo.`,
  };

  assignPlayerOpeningOrders(state);
  showMessage(state, scenario.briefing, 2600);
  return state;
}

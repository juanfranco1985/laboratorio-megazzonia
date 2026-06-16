import { COLS, TEAM_ENEMY, TEAM_PLAYER } from "../core/constants.js";

function mirroredX(gx) {
  return COLS - 1 - gx;
}

function baseStructures() {
  return [
    { team: TEAM_PLAYER, type: "fort", gx: 4, gy: 10, dir: 0 },
    { team: TEAM_PLAYER, type: "workshop", gx: 7, gy: 10, dir: 0 },
    { team: TEAM_PLAYER, type: "turret", gx: 10, gy: 6, dir: 0 },
    { team: TEAM_PLAYER, type: "turret", gx: 10, gy: 14, dir: 0 },
    { team: TEAM_ENEMY, type: "fort", gx: mirroredX(4), gy: 10, dir: Math.PI },
    { team: TEAM_ENEMY, type: "workshop", gx: mirroredX(7), gy: 10, dir: Math.PI },
    { team: TEAM_ENEMY, type: "turret", gx: mirroredX(10), gy: 6, dir: Math.PI },
    { team: TEAM_ENEMY, type: "turret", gx: mirroredX(10), gy: 14, dir: Math.PI },
  ];
}

function baseUnits() {
  return [
    { team: TEAM_PLAYER, type: "medium", gx: 13, gy: 7, dir: 0, label: "A1" },
    { team: TEAM_PLAYER, type: "medium", gx: 13, gy: 13, dir: 0, label: "A2" },
    { team: TEAM_PLAYER, type: "heavy", gx: 16, gy: 9, dir: 0, label: "H1" },
    { team: TEAM_PLAYER, type: "artillery", gx: 15, gy: 11, dir: 0, label: "S1" },
    { team: TEAM_ENEMY, type: "medium", gx: mirroredX(13), gy: 7, dir: Math.PI, label: "R1" },
    { team: TEAM_ENEMY, type: "medium", gx: mirroredX(13), gy: 13, dir: Math.PI, label: "R2" },
    { team: TEAM_ENEMY, type: "heavy", gx: mirroredX(16), gy: 9, dir: Math.PI, label: "R3" },
    { team: TEAM_ENEMY, type: "artillery", gx: mirroredX(15), gy: 11, dir: Math.PI, label: "R4" },
  ];
}

function mirroredPoints(points) {
  return points.map((point) => ({ gx: mirroredX(point.gx), gy: point.gy }));
}

function makeControlPoints(playerDefense, midfield) {
  return {
    playerDefense,
    enemyDefense: mirroredPoints(playerDefense),
    midfield,
  };
}

export const SCENARIOS = {
  ironLine: {
    id: "ironLine",
    name: "Linea Quebrada",
    briefing: "La Coalicion observa a gran distancia la linea enemiga. Mantiene el bastion occidental, aprovecha crateres, barro y escombros, y rompe la fortaleza del este con fuego de precision.",
    terrain: [
      { kind: "wall", gx: 8, gy: 5, w: 1, h: 3 },
      { kind: "wall", gx: 8, gy: 13, w: 1, h: 3 },
      { kind: "wall", gx: mirroredX(8), gy: 5, w: 1, h: 3 },
      { kind: "wall", gx: mirroredX(8), gy: 13, w: 1, h: 3 },
      { kind: "wall", gx: 25, gy: 6, w: 1, h: 4 },
      { kind: "wall", gx: 30, gy: 10, w: 1, h: 4 },
      { kind: "cover", gx: 14, gy: 4, w: 2, h: 2 },
      { kind: "cover", gx: 15, gy: 14, w: 2, h: 2 },
      { kind: "cover", gx: 20, gy: 8, w: 2, h: 2 },
      { kind: "cover", gx: 34, gy: 5, w: 2, h: 2 },
      { kind: "cover", gx: 37, gy: 13, w: 2, h: 2 },
      { kind: "cover", gx: 41, gy: 9, w: 2, h: 2 },
      { kind: "rough", gx: 18, gy: 5, w: 3, h: 3 },
      { kind: "rough", gx: 21, gy: 12, w: 3, h: 3 },
      { kind: "rough", gx: 31, gy: 5, w: 3, h: 3 },
      { kind: "rough", gx: 34, gy: 12, w: 3, h: 3 },
      { kind: "rough", gx: 26, gy: 8, w: 3, h: 3 },
      { kind: "mud", gx: 24, gy: 2, w: 4, h: 2 },
      { kind: "mud", gx: 28, gy: 15, w: 4, h: 2 },
      { kind: "mud", gx: 23, gy: 9, w: 2, h: 4 },
      { kind: "mud", gx: 31, gy: 7, w: 2, h: 4 },
      { kind: "wreck", gx: 12, gy: 8, w: 2, h: 2 },
      { kind: "wreck", gx: 16, gy: 10, w: 2, h: 2 },
      { kind: "wreck", gx: 39, gy: 8, w: 2, h: 2 },
      { kind: "wreck", gx: 35, gy: 10, w: 2, h: 2 },
      { kind: "wreck", gx: 27, gy: 5, w: 2, h: 2 },
      { kind: "wreck", gx: 26, gy: 13, w: 2, h: 2 },
    ],
    structures: baseStructures(),
    units: baseUnits(),
    controlPoints: makeControlPoints(
      [
        { gx: 15, gy: 6 },
        { gx: 17, gy: 9 },
        { gx: 17, gy: 11 },
        { gx: 15, gy: 14 },
      ],
      [
        { gx: 23, gy: 6 },
        { gx: 24, gy: 14 },
        { gx: 32, gy: 6 },
        { gx: 33, gy: 14 },
      ],
    ),
  },
  basaltPass: {
    id: "basaltPass",
    name: "Paso Basalto",
    briefing: "Dos crestas de hormigon y piedra volcanica obligan a maniobrar por pasillos estrechos. El mando que encadene mejor sus ordenes rompe primero la defensa rival.",
    terrain: [
      { kind: "wall", gx: 8, gy: 4, w: 1, h: 4 },
      { kind: "wall", gx: 8, gy: 12, w: 1, h: 4 },
      { kind: "wall", gx: mirroredX(8), gy: 4, w: 1, h: 4 },
      { kind: "wall", gx: mirroredX(8), gy: 12, w: 1, h: 4 },
      { kind: "wall", gx: 22, gy: 3, w: 1, h: 6 },
      { kind: "wall", gx: 26, gy: 11, w: 1, h: 6 },
      { kind: "wall", gx: 33, gy: 4, w: 1, h: 6 },
      { kind: "wall", gx: 29, gy: 12, w: 1, h: 5 },
      { kind: "cover", gx: 14, gy: 6, w: 2, h: 2 },
      { kind: "cover", gx: 14, gy: 12, w: 2, h: 2 },
      { kind: "cover", gx: 40, gy: 6, w: 2, h: 2 },
      { kind: "cover", gx: 40, gy: 12, w: 2, h: 2 },
      { kind: "rough", gx: 18, gy: 8, w: 3, h: 4 },
      { kind: "rough", gx: 35, gy: 8, w: 3, h: 4 },
      { kind: "mud", gx: 24, gy: 9, w: 2, h: 3 },
      { kind: "mud", gx: 30, gy: 8, w: 2, h: 3 },
      { kind: "wreck", gx: 20, gy: 5, w: 2, h: 2 },
      { kind: "wreck", gx: 34, gy: 13, w: 2, h: 2 },
      { kind: "wreck", gx: 27, gy: 5, w: 2, h: 2 },
      { kind: "wreck", gx: 27, gy: 13, w: 2, h: 2 },
    ],
    structures: baseStructures(),
    units: baseUnits(),
    controlPoints: makeControlPoints(
      [
        { gx: 15, gy: 7 },
        { gx: 17, gy: 9 },
        { gx: 17, gy: 11 },
        { gx: 15, gy: 13 },
      ],
      [
        { gx: 24, gy: 7 },
        { gx: 24, gy: 13 },
        { gx: 31, gy: 7 },
        { gx: 31, gy: 13 },
      ],
    ),
  },
  floodDelta: {
    id: "floodDelta",
    name: "Delta Seco",
    briefing: "El delta ha quedado surcado por barro, chatarra y viejos diques. Hay mas rutas, pero elegir una mala linea de avance cuesta segundos y cobertura.",
    terrain: [
      { kind: "wall", gx: 7, gy: 6, w: 1, h: 2 },
      { kind: "wall", gx: 7, gy: 12, w: 1, h: 2 },
      { kind: "wall", gx: mirroredX(7), gy: 6, w: 1, h: 2 },
      { kind: "wall", gx: mirroredX(7), gy: 12, w: 1, h: 2 },
      { kind: "mud", gx: 18, gy: 3, w: 4, h: 3 },
      { kind: "mud", gx: 20, gy: 12, w: 4, h: 4 },
      { kind: "mud", gx: 32, gy: 4, w: 4, h: 3 },
      { kind: "mud", gx: 30, gy: 13, w: 4, h: 3 },
      { kind: "mud", gx: 26, gy: 8, w: 4, h: 4 },
      { kind: "cover", gx: 13, gy: 5, w: 2, h: 2 },
      { kind: "cover", gx: 15, gy: 14, w: 2, h: 2 },
      { kind: "cover", gx: 39, gy: 5, w: 2, h: 2 },
      { kind: "cover", gx: 37, gy: 14, w: 2, h: 2 },
      { kind: "rough", gx: 23, gy: 6, w: 2, h: 2 },
      { kind: "rough", gx: 31, gy: 11, w: 2, h: 2 },
      { kind: "rough", gx: 27, gy: 3, w: 2, h: 2 },
      { kind: "rough", gx: 27, gy: 15, w: 2, h: 2 },
      { kind: "wreck", gx: 11, gy: 9, w: 2, h: 2 },
      { kind: "wreck", gx: 17, gy: 8, w: 2, h: 2 },
      { kind: "wreck", gx: 38, gy: 9, w: 2, h: 2 },
      { kind: "wreck", gx: 34, gy: 8, w: 2, h: 2 },
      { kind: "wreck", gx: 24, gy: 13, w: 2, h: 2 },
      { kind: "wreck", gx: 30, gy: 6, w: 2, h: 2 },
    ],
    structures: baseStructures(),
    units: baseUnits(),
    controlPoints: makeControlPoints(
      [
        { gx: 14, gy: 6 },
        { gx: 17, gy: 8 },
        { gx: 17, gy: 12 },
        { gx: 14, gy: 14 },
      ],
      [
        { gx: 22, gy: 5 },
        { gx: 24, gy: 14 },
        { gx: 33, gy: 5 },
        { gx: 31, gy: 14 },
      ],
    ),
  },
};

export function getScenario(id = "ironLine") {
  return SCENARIOS[id] || SCENARIOS.ironLine;
}

export function getScenarioIds() {
  return Object.keys(SCENARIOS);
}

export function getDefaultScenarioId() {
  return "ironLine";
}

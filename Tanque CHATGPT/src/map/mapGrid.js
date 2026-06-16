import { COLS, HEIGHT, ROWS, TILE, WIDTH } from "../core/constants.js";
import { circleIntersectsRect, worldToGrid } from "../core/math.js";

const TERRAIN_STATS = {
  ground: { cover: 0, speed: 1 },
  cover: { cover: 0.24, speed: 0.92 },
  rough: { cover: 0.1, speed: 0.76 },
  mud: { cover: 0.04, speed: 0.58 },
  wreck: { cover: 0.18, speed: 0.84 },
  wall: { cover: 0, speed: 0 },
};

function makeTile(kind = "ground") {
  return { kind };
}

export function createMapGrid(scenario) {
  const tiles = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => makeTile("ground")));

  for (const feature of scenario.terrain) {
    for (let gy = feature.gy; gy < feature.gy + feature.h; gy += 1) {
      for (let gx = feature.gx; gx < feature.gx + feature.w; gx += 1) {
        if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
          tiles[gy][gx] = makeTile(feature.kind);
        }
      }
    }
  }

  return {
    cols: COLS,
    rows: ROWS,
    tiles,
  };
}

export function getTile(map, gx, gy) {
  if (gx < 0 || gx >= map.cols || gy < 0 || gy >= map.rows) {
    return makeTile("wall");
  }
  return map.tiles[gy][gx];
}

export function getTileAtWorld(map, x, y) {
  const { gx, gy } = worldToGrid(x, y);
  return getTile(map, gx, gy);
}

export function getTerrainStats(kind = "ground") {
  return TERRAIN_STATS[kind] || TERRAIN_STATS.ground;
}

export function getCoverModifier(state, x, y) {
  const tile = getTileAtWorld(state.map, x, y);
  return getTerrainStats(tile.kind).cover;
}

export function getSpeedModifier(state, x, y) {
  const tile = getTileAtWorld(state.map, x, y);
  return getTerrainStats(tile.kind).speed;
}

export function isWorldInsideMap(x, y, radius = 0) {
  return x - radius >= 0 && x + radius <= WIDTH && y - radius >= 0 && y + radius <= HEIGHT;
}

function circleTouchesWallTiles(state, x, y, radius) {
  const min = worldToGrid(x - radius, y - radius);
  const max = worldToGrid(x + radius, y + radius);

  for (let gy = min.gy; gy <= max.gy; gy += 1) {
    for (let gx = min.gx; gx <= max.gx; gx += 1) {
      const tile = getTile(state.map, gx, gy);
      if (tile.kind !== "wall") {
        continue;
      }

      const rect = {
        x: gx * TILE,
        y: gy * TILE,
        w: TILE,
        h: TILE,
      };

      if (circleIntersectsRect({ x, y, radius }, rect)) {
        return true;
      }
    }
  }

  return false;
}

function circleTouchesStructure(state, x, y, radius, ignoreStructureId = null) {
  return state.structures.some((structure) => {
    if (!structure.alive || !structure.blocksMovement || structure.id === ignoreStructureId) {
      return false;
    }

    const rect = {
      x: structure.x - structure.width / 2,
      y: structure.y - structure.height / 2,
      w: structure.width,
      h: structure.height,
    };

    return circleIntersectsRect({ x, y, radius }, rect);
  });
}

export function isCircleBlocked(state, x, y, radius, ignoreStructureId = null) {
  if (!isWorldInsideMap(x, y, radius)) {
    return true;
  }

  if (circleTouchesWallTiles(state, x, y, radius)) {
    return true;
  }

  return circleTouchesStructure(state, x, y, radius, ignoreStructureId);
}

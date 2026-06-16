import { COLS, ROWS } from "../core/constants.js";
import { circleIntersectsRect, tileCenter, worldToGrid } from "../core/math.js";
import { getTerrainStats, getTile } from "./mapGrid.js";

const DIRECTIONS = [
  { x: 1, y: 0, diagonal: false },
  { x: -1, y: 0, diagonal: false },
  { x: 0, y: 1, diagonal: false },
  { x: 0, y: -1, diagonal: false },
  { x: 1, y: 1, diagonal: true },
  { x: 1, y: -1, diagonal: true },
  { x: -1, y: 1, diagonal: true },
  { x: -1, y: -1, diagonal: true },
];

function tileKey(gx, gy) {
  return `${gx},${gy}`;
}

function tileWalkable(state, gx, gy, radius) {
  if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) {
    return false;
  }

  const tile = getTile(state.map, gx, gy);
  if (tile.kind === "wall") {
    return false;
  }

  const center = tileCenter(gx, gy);
  return !state.structures.some((structure) => {
    if (!structure.alive || !structure.blocksMovement) {
      return false;
    }

    const rect = {
      x: structure.x - structure.width / 2,
      y: structure.y - structure.height / 2,
      w: structure.width,
      h: structure.height,
    };

    return circleIntersectsRect({ x: center.x, y: center.y, radius: radius + 2 }, rect);
  });
}

function nearestWalkableTile(state, gx, gy, radius) {
  if (tileWalkable(state, gx, gy, radius)) {
    return { gx, gy };
  }

  for (let ring = 1; ring <= 6; ring += 1) {
    for (let offsetY = -ring; offsetY <= ring; offsetY += 1) {
      for (let offsetX = -ring; offsetX <= ring; offsetX += 1) {
        if (Math.abs(offsetX) !== ring && Math.abs(offsetY) !== ring) {
          continue;
        }

        const nx = gx + offsetX;
        const ny = gy + offsetY;
        if (tileWalkable(state, nx, ny, radius)) {
          return { gx: nx, gy: ny };
        }
      }
    }
  }

  return null;
}

function movementCost(state, gx, gy, diagonal) {
  const tile = getTile(state.map, gx, gy);
  const speed = Math.max(0.45, getTerrainStats(tile.kind).speed || 1);
  return (diagonal ? 1.42 : 1) / speed;
}

function heuristic(a, b) {
  return Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy);
}

function simplifyPath(points) {
  if (points.length <= 2) {
    return points;
  }

  const simplified = [points[0]];
  let lastDirection = null;

  for (let index = 1; index < points.length; index += 1) {
    const previous = simplified[simplified.length - 1];
    const current = points[index];
    const direction = {
      x: Math.sign(current.x - previous.x),
      y: Math.sign(current.y - previous.y),
    };

    if (!lastDirection || direction.x !== lastDirection.x || direction.y !== lastDirection.y) {
      simplified.push(current);
      lastDirection = direction;
    } else {
      simplified[simplified.length - 1] = current;
    }
  }

  return simplified;
}

function reconstructPath(cameFrom, currentKey) {
  const path = [currentKey];
  let cursor = currentKey;
  while (cameFrom.has(cursor)) {
    cursor = cameFrom.get(cursor);
    path.unshift(cursor);
  }
  return path;
}

export function findPath(state, startX, startY, goalX, goalY, radius) {
  const startGrid = nearestWalkableTile(state, worldToGrid(startX, startY).gx, worldToGrid(startX, startY).gy, radius);
  const goalGrid = nearestWalkableTile(state, worldToGrid(goalX, goalY).gx, worldToGrid(goalX, goalY).gy, radius);

  if (!startGrid || !goalGrid) {
    return [];
  }

  if (startGrid.gx === goalGrid.gx && startGrid.gy === goalGrid.gy) {
    return [];
  }

  const startKey = tileKey(startGrid.gx, startGrid.gy);
  const goalKey = tileKey(goalGrid.gx, goalGrid.gy);
  const open = [startKey];
  const openSet = new Set([startKey]);
  const cameFrom = new Map();
  const gScore = new Map([[startKey, 0]]);
  const fScore = new Map([[startKey, heuristic(startGrid, goalGrid)]]);

  while (open.length > 0) {
    let bestIndex = 0;
    for (let index = 1; index < open.length; index += 1) {
      if ((fScore.get(open[index]) || Infinity) < (fScore.get(open[bestIndex]) || Infinity)) {
        bestIndex = index;
      }
    }

    const currentKey = open.splice(bestIndex, 1)[0];
    openSet.delete(currentKey);
    const [currentX, currentY] = currentKey.split(",").map(Number);

    if (currentKey === goalKey) {
      const points = reconstructPath(cameFrom, currentKey)
        .map((key) => {
          const [gx, gy] = key.split(",").map(Number);
          return tileCenter(gx, gy);
        })
        .slice(1);
      return simplifyPath(points);
    }

    for (const direction of DIRECTIONS) {
      const nextX = currentX + direction.x;
      const nextY = currentY + direction.y;
      if (!tileWalkable(state, nextX, nextY, radius)) {
        continue;
      }

      if (direction.diagonal) {
        if (!tileWalkable(state, currentX + direction.x, currentY, radius) || !tileWalkable(state, currentX, currentY + direction.y, radius)) {
          continue;
        }
      }

      const nextKey = tileKey(nextX, nextY);
      const tentativeG = (gScore.get(currentKey) || Infinity) + movementCost(state, nextX, nextY, direction.diagonal);
      if (tentativeG >= (gScore.get(nextKey) || Infinity)) {
        continue;
      }

      cameFrom.set(nextKey, currentKey);
      gScore.set(nextKey, tentativeG);
      fScore.set(nextKey, tentativeG + heuristic({ gx: nextX, gy: nextY }, goalGrid));
      if (!openSet.has(nextKey)) {
        open.push(nextKey);
        openSet.add(nextKey);
      }
    }
  }

  return [];
}

import { TILE } from "../core/constants.js";
import { distanceXY } from "../core/math.js";
import { getTileAtWorld } from "./mapGrid.js";

export function hasLineOfSight(state, x0, y0, x1, y1) {
  const totalDistance = distanceXY(x0, y0, x1, y1);
  const steps = Math.max(2, Math.ceil(totalDistance / (TILE * 0.35)));

  for (let step = 1; step < steps; step += 1) {
    const t = step / steps;
    const sampleX = x0 + (x1 - x0) * t;
    const sampleY = y0 + (y1 - y0) * t;
    const tile = getTileAtWorld(state.map, sampleX, sampleY);

    if (tile.kind === "wall") {
      return false;
    }
  }

  return true;
}

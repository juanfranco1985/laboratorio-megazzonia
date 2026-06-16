import { pointInCircle, pointInRect } from "../core/math.js";
import { getTileAtWorld } from "../map/mapGrid.js";
import { resolveProjectileImpact } from "./damageSystem.js";

function targetRect(structure) {
  return {
    x: structure.x - structure.width / 2,
    y: structure.y - structure.height / 2,
    w: structure.width,
    h: structure.height,
  };
}

function findDirectHit(state, projectile) {
  for (const unit of state.units) {
    if (!unit.alive || unit.team === projectile.sourceTeam) {
      continue;
    }
    if (pointInCircle(projectile.x, projectile.y, unit.x, unit.y, unit.radius + projectile.radius)) {
      return unit;
    }
  }

  for (const structure of state.structures) {
    if (!structure.alive || structure.team === projectile.sourceTeam) {
      continue;
    }
    if (pointInRect(projectile.x, projectile.y, targetRect(structure))) {
      return structure;
    }
  }

  return null;
}

export function updateProjectiles(state, dtMs) {
  const dtSeconds = dtMs / 1000;

  for (let index = state.projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = state.projectiles[index];
    projectile.x += projectile.vx * dtSeconds;
    projectile.y += projectile.vy * dtSeconds;
    projectile.ttlMs -= dtMs;

    const tile = getTileAtWorld(state.map, projectile.x, projectile.y);
    if (tile.kind === "wall") {
      resolveProjectileImpact(state, projectile, projectile.x, projectile.y, null);
      state.projectiles.splice(index, 1);
      continue;
    }

    const directHit = findDirectHit(state, projectile);
    if (directHit) {
      resolveProjectileImpact(state, projectile, directHit.x, directHit.y, directHit);
      state.projectiles.splice(index, 1);
      continue;
    }

    if (projectile.ttlMs <= 0) {
      resolveProjectileImpact(state, projectile, projectile.x, projectile.y, null);
      state.projectiles.splice(index, 1);
    }
  }
}

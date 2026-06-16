import { angleDelta, distanceXY } from "../core/math.js";
import { pruneSelection, showMessage } from "../game/battleState.js";

function effectiveArmor(target, projectile) {
  if (target.entityType === "structure") {
    return target.frontArmor || 0;
  }

  const incoming = Math.atan2(projectile.vy, projectile.vx);
  const delta = Math.abs(angleDelta(incoming, target.dir));
  return delta < 0.95 ? target.frontArmor : target.sideArmor;
}

function applyDamage(state, target, projectile, factor = 1) {
  const armor = effectiveArmor(target, projectile);
  const penetrationMultiplier = projectile.penetration >= armor ? 1 : 0.62;
  const amount = Math.max(6, (projectile.damage - armor * 0.35) * penetrationMultiplier) * factor;
  target.hp = Math.max(0, target.hp - amount);

  if (target.entityType === "unit") {
    target.suppressUntilMs = state.timeMs + 800;
  }

  state.effects.push({
    type: "spark",
    x: target.x,
    y: target.y,
    ageMs: 0,
    durationMs: 160,
    size: 12,
    team: target.team,
  });

  if (target.hp > 0) {
    return;
  }

  target.alive = false;
  target.hp = 0;
  pruneSelection(state);
  state.effects.push({
    type: "explosion",
    x: target.x,
    y: target.y,
    ageMs: 0,
    durationMs: target.entityType === "structure" ? 720 : 520,
    size: target.entityType === "structure" ? 46 : 30,
    team: target.team,
  });

  if (target.entityType === "structure") {
    showMessage(state, `${target.label} destruido`, 1500);
  }
}

export function resolveProjectileImpact(state, projectile, impactX, impactY, directTarget = null) {
  state.effects.push({
    type: "explosion",
    x: impactX,
    y: impactY,
    ageMs: 0,
    durationMs: projectile.splashRadius > 0 ? 460 : 260,
    size: projectile.splashRadius > 0 ? 36 : 18,
    team: projectile.sourceTeam,
  });

  if (directTarget) {
    applyDamage(state, directTarget, projectile, 1);
  }

  if (projectile.splashRadius <= 0) {
    return;
  }

  const radius = projectile.splashRadius;
  const targets = [...state.units, ...state.structures].filter((target) => target.alive && target.team !== projectile.sourceTeam);
  targets.forEach((target) => {
    if (directTarget && target.id === directTarget.id) {
      return;
    }

    const edge = target.entityType === "unit" ? target.radius : Math.max(target.width, target.height) * 0.35;
    const d = distanceXY(impactX, impactY, target.x, target.y);
    const influence = radius + edge;
    if (d > influence) {
      return;
    }

    const factor = Math.max(0.3, 1 - d / influence);
    applyDamage(state, target, projectile, factor);
  });
}

export function updateRepairs(state, dtMs) {
  const dtSeconds = dtMs / 1000;
  const workshops = state.structures.filter((structure) => structure.alive && structure.structureType === "workshop");

  workshops.forEach((workshop) => {
    state.units.forEach((unit) => {
      if (!unit.alive || unit.team !== workshop.team || unit.hp >= unit.maxHp) {
        return;
      }

      const distance = distanceXY(workshop.x, workshop.y, unit.x, unit.y);
      if (distance <= workshop.repairRadius) {
        unit.hp = Math.min(unit.maxHp, unit.hp + workshop.repairPerSecond * dtSeconds);
      }
    });
  });
}

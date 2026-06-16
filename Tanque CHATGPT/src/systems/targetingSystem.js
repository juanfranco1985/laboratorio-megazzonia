import { angleBetween, distance, randomBetween } from "../core/math.js";
import { getCoverModifier } from "../map/mapGrid.js";
import { hasLineOfSight } from "../map/los.js";
import { otherTeam } from "../game/teams.js";
import { findEntityById, getLivingStructures, getLivingUnits, getTeamFort } from "../game/battleState.js";

function weaponActors(state) {
  return [
    ...state.units.filter((unit) => unit.alive),
    ...state.structures.filter((structure) => structure.alive && typeof structure.range === "number"),
  ];
}

function candidateTargets(state, team) {
  return [
    ...getLivingUnits(state, otherTeam(team)),
    ...getLivingStructures(state, otherTeam(team)),
  ];
}

function hasWeapon(actor) {
  return typeof actor.range === "number" && typeof actor.reloadMs === "number";
}

function canActorFire(actor, target, state) {
  if (!target || !target.alive || !hasWeapon(actor)) {
    return false;
  }

  if (distance(actor, target) > actor.range) {
    return false;
  }

  if (!hasLineOfSight(state, actor.x, actor.y, target.x, target.y)) {
    return false;
  }

  if (actor.entityType === "unit" && actor.requiresStationary && actor.state === "moving") {
    return false;
  }

  return actor.reloadLeftMs <= 0;
}

function scoreTarget(state, actor, target) {
  const rangeLeft = actor.range - distance(actor, target);
  let score = rangeLeft * 0.07;

  if (target.entityType === "structure" && target.structureType === "fort") {
    score += 30;
  }
  if (target.entityType === "structure" && target.structureType === "turret") {
    score += 18;
  }
  if (target.entityType === "unit" && target.unitType === "artillery") {
    score += 14;
  }
  if (target.entityType === "unit" && target.hp < target.maxHp * 0.5) {
    score += 10;
  }

  const alliedFort = getTeamFort(state, actor.team);
  if (alliedFort && target.order && target.order.targetId === alliedFort.id) {
    score += 12;
  }

  return score;
}

function chooseTarget(state, actor) {
  const explicitTarget = actor.entityType === "unit" && actor.order.targetId ? findEntityById(state, actor.order.targetId) : null;
  if (explicitTarget && explicitTarget.alive && distance(actor, explicitTarget) <= actor.range && hasLineOfSight(state, actor.x, actor.y, explicitTarget.x, explicitTarget.y)) {
    return explicitTarget;
  }

  let bestTarget = null;
  let bestScore = -Infinity;

  candidateTargets(state, actor.team).forEach((target) => {
    if (distance(actor, target) > actor.range) {
      return;
    }
    if (!hasLineOfSight(state, actor.x, actor.y, target.x, target.y)) {
      return;
    }

    const score = scoreTarget(state, actor, target);
    if (score > bestScore) {
      bestScore = score;
      bestTarget = target;
    }
  });

  return bestTarget;
}

function createProjectile(state, actor, target) {
  const coverPenalty = getCoverModifier(state, target.x, target.y);
  const movementPenalty = target.entityType === "unit" && target.state === "moving" ? 0.08 : 0;
  const effectiveAccuracy = Math.max(0.42, actor.accuracy - coverPenalty - movementPenalty);
  const scatter = (1 - effectiveAccuracy) * (target.entityType === "structure" ? 18 : 34);
  const aimX = target.x + randomBetween(-scatter, scatter);
  const aimY = target.y + randomBetween(-scatter, scatter);
  const direction = angleBetween(actor.x, actor.y, aimX, aimY);

  state.projectiles.push({
    id: `shot_${state.timeMs}_${Math.random().toString(36).slice(2, 7)}`,
    sourceId: actor.id,
    sourceTeam: actor.team,
    x: actor.x,
    y: actor.y,
    vx: Math.cos(direction) * actor.projectileSpeed,
    vy: Math.sin(direction) * actor.projectileSpeed,
    damage: actor.damage,
    penetration: actor.penetration,
    splashRadius: actor.splashRadius || 0,
    radius: actor.splashRadius > 0 ? 4 : 3,
    ttlMs: 1800,
  });

  state.effects.push({
    type: "muzzle",
    x: actor.x,
    y: actor.y,
    ageMs: 0,
    durationMs: 120,
    size: actor.splashRadius > 0 ? 16 : 12,
    team: actor.team,
  });

  actor.reloadLeftMs = actor.reloadMs;
  actor.dir = direction;
}

export function updateTargetingAndWeapons(state, dtMs) {
  weaponActors(state).forEach((actor) => {
    actor.reloadLeftMs = Math.max(0, actor.reloadLeftMs - dtMs);
    if (!hasWeapon(actor)) {
      return;
    }

    const target = chooseTarget(state, actor);
    actor.targetId = target ? target.id : null;

    if (target) {
      actor.dir = angleBetween(actor.x, actor.y, target.x, target.y);
    }

    if (target && canActorFire(actor, target, state)) {
      createProjectile(state, actor, target);
    }
  });
}

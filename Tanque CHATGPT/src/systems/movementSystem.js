import { angleBetween, distanceXY, normalize } from "../core/math.js";
import { findEntityById } from "../game/battleState.js";
import { findPath } from "../map/pathing.js";
import { getSpeedModifier, isCircleBlocked } from "../map/mapGrid.js";

function holdOrder(unit) {
  return {
    type: "hold",
    x: unit.x,
    y: unit.y,
    targetId: null,
    path: [],
    pathIndex: 0,
    pathGoalX: unit.x,
    pathGoalY: unit.y,
    repathMs: 0,
  };
}

function collidesWithUnit(state, self, x, y) {
  return state.units.some((other) => {
    if (!other.alive || other.id === self.id) {
      return false;
    }
    const minDistance = self.radius + other.radius + 3;
    return distanceXY(x, y, other.x, other.y) < minDistance;
  });
}

function moveAllowed(state, unit, x, y) {
  return !isCircleBlocked(state, x, y, unit.radius) && !collidesWithUnit(state, unit, x, y);
}

function advanceOrderQueue(unit) {
  if (unit.queuedOrders.length > 0) {
    unit.order = unit.queuedOrders.shift();
  } else {
    unit.order = holdOrder(unit);
  }
}

function moveDestinationForUnit(state, unit) {
  const order = unit.order;
  if (!order) {
    return null;
  }

  if (order.type === "hold") {
    return null;
  }

  if (order.type === "move" || order.type === "defend-area" || order.type === "retreat") {
    return { x: order.x, y: order.y };
  }

  if (order.type === "attack-target" && order.targetId) {
    const target = findEntityById(state, order.targetId);
    if (!target || !target.alive) {
      return null;
    }

    order.x = target.x;
    order.y = target.y;
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance <= unit.preferredRange * 0.92) {
      return null;
    }

    return {
      x: target.x - (dx / distance) * unit.preferredRange * 0.88,
      y: target.y - (dy / distance) * unit.preferredRange * 0.88,
    };
  }

  return null;
}

function refreshOrderPath(state, unit, destination, dtMs) {
  const order = unit.order;
  order.repathMs = Math.max(0, (order.repathMs || 0) - dtMs);
  const goalChanged = distanceXY(order.pathGoalX || destination.x, order.pathGoalY || destination.y, destination.x, destination.y) > 10;

  if (!order.path || order.repathMs <= 0 || goalChanged) {
    order.path = findPath(state, unit.x, unit.y, destination.x, destination.y, unit.radius);
    order.pathIndex = 0;
    order.pathGoalX = destination.x;
    order.pathGoalY = destination.y;
    order.repathMs = order.type === "attack-target" ? 260 : 900;
  }
}

function activeWaypoint(unit, destination) {
  const order = unit.order;
  if (!order.path || order.path.length === 0) {
    return destination;
  }

  while (order.pathIndex < order.path.length && distanceXY(unit.x, unit.y, order.path[order.pathIndex].x, order.path[order.pathIndex].y) <= unit.radius + 4) {
    order.pathIndex += 1;
  }

  return order.path[order.pathIndex] || destination;
}

export function updateMovement(state, dtMs) {
  const dtSeconds = dtMs / 1000;

  state.units.forEach((unit) => {
    if (!unit.alive) {
      return;
    }

    const destination = moveDestinationForUnit(state, unit);
    if (!destination) {
      if (unit.order.type === "move" || unit.order.type === "retreat") {
        advanceOrderQueue(unit);
      }
      unit.state = "idle";
      unit.moveIntent = { x: 0, y: 0 };
      return;
    }

    const distanceToDestination = distanceXY(unit.x, unit.y, destination.x, destination.y);
    const stopDistance = unit.order.type === "attack-target" ? 14 : 5;
    if (distanceToDestination <= stopDistance) {
      if (unit.order.type === "move" || unit.order.type === "retreat" || (unit.order.type === "defend-area" && unit.queuedOrders.length > 0)) {
        advanceOrderQueue(unit);
      }
      unit.state = "idle";
      unit.moveIntent = { x: 0, y: 0 };
      return;
    }

    refreshOrderPath(state, unit, destination, dtMs);
    const waypoint = activeWaypoint(unit, destination);
    const dx = waypoint.x - unit.x;
    const dy = waypoint.y - unit.y;

    let steerX = dx;
    let steerY = dy;

    state.units.forEach((other) => {
      if (!other.alive || other.id === unit.id || other.team !== unit.team) {
        return;
      }

      const currentDistance = distanceXY(unit.x, unit.y, other.x, other.y);
      const desired = unit.radius + other.radius + 10;
      if (currentDistance > 0 && currentDistance < desired) {
        const push = (desired - currentDistance) / desired;
        steerX += ((unit.x - other.x) / currentDistance) * push * 140;
        steerY += ((unit.y - other.y) / currentDistance) * push * 140;
      }
    });

    const steer = normalize(steerX, steerY);
    const terrainModifier = Math.min(
      getSpeedModifier(state, unit.x, unit.y),
      getSpeedModifier(state, unit.x + steer.x * unit.radius * 4, unit.y + steer.y * unit.radius * 4),
    );
    const healthModifier = unit.hp < unit.maxHp * 0.35 ? 0.9 : 1;
    const speed = unit.speed * terrainModifier * healthModifier;
    const stepX = steer.x * speed * dtSeconds;
    const stepY = steer.y * speed * dtSeconds;

    let moved = false;
    if (moveAllowed(state, unit, unit.x + stepX, unit.y + stepY)) {
      unit.x += stepX;
      unit.y += stepY;
      moved = true;
    } else if (moveAllowed(state, unit, unit.x + stepX, unit.y)) {
      unit.x += stepX;
      moved = true;
    } else if (moveAllowed(state, unit, unit.x, unit.y + stepY)) {
      unit.y += stepY;
      moved = true;
    }

    unit.moveIntent = { x: stepX, y: stepY };
    unit.state = moved ? "moving" : "idle";
    if (moved) {
      unit.dir = angleBetween(0, 0, stepX, stepY);
    }
  });
}

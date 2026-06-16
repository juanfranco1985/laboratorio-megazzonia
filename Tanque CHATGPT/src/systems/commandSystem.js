import { TEAM_PLAYER } from "../core/constants.js";
import { pointInCircle, pointInRect, rectFromPoints, tileCenter } from "../core/math.js";
import { clearSelection, findEntityById, getSelectedUnits, getTeamFort, getTeamWorkshop, setSelection, showMessage } from "../game/battleState.js";

function formationOffsets(count) {
  const offsets = [];
  const cols = Math.ceil(Math.sqrt(count));
  const spacingX = 18;
  const spacingY = 15;
  const rows = Math.ceil(count / cols);
  const startX = -((cols - 1) * spacingX) / 2;
  const startY = -((rows - 1) * spacingY) / 2;

  for (let index = 0; index < count; index += 1) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    offsets.push({ x: startX + col * spacingX, y: startY + row * spacingY });
  }

  return offsets;
}

function makeOrder(type, x, y, targetId = null) {
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

function canAppend(unit) {
  return unit.queuedOrders.length > 0 || unit.state === "moving" || ["move", "retreat", "attack-target"].includes(unit.order?.type);
}

function assignOrder(unit, order, append = false) {
  if (append && canAppend(unit)) {
    unit.queuedOrders.push(order);
    return;
  }

  unit.order = order;
  if (!append) {
    unit.queuedOrders = [];
  }
}

function getPlayerUnitsUnderPoint(state, x, y) {
  return state.units.filter((unit) => unit.alive && unit.team === TEAM_PLAYER && pointInCircle(x, y, unit.x, unit.y, unit.radius + 6));
}

function getEntityUnderPoint(state, x, y) {
  for (let index = state.units.length - 1; index >= 0; index -= 1) {
    const unit = state.units[index];
    if (unit.alive && pointInCircle(x, y, unit.x, unit.y, unit.radius + 6)) {
      return unit;
    }
  }

  for (let index = state.structures.length - 1; index >= 0; index -= 1) {
    const structure = state.structures[index];
    const rect = {
      x: structure.x - structure.width / 2,
      y: structure.y - structure.height / 2,
      w: structure.width,
      h: structure.height,
    };
    if (structure.alive && pointInRect(x, y, rect)) {
      return structure;
    }
  }

  return null;
}

export function selectUnitsAtPoint(state, x, y) {
  const units = getPlayerUnitsUnderPoint(state, x, y);
  if (units.length === 0) {
    clearSelection(state);
    return;
  }

  setSelection(state, [units[0].id]);
}

export function selectUnitsInRect(state, from, to) {
  const rect = rectFromPoints(from, to);
  const ids = state.units
    .filter((unit) => unit.alive && unit.team === TEAM_PLAYER)
    .filter((unit) => pointInRect(unit.x, unit.y, rect))
    .map((unit) => unit.id);

  setSelection(state, ids);
}

export function applyMoveOrder(units, x, y, append = false) {
  const offsets = formationOffsets(units.length);
  units.forEach((unit, index) => {
    const offset = offsets[index] || { x: 0, y: 0 };
    assignOrder(unit, makeOrder("move", x + offset.x, y + offset.y, null), append);
    unit.manualTargetId = null;
  });
}

export function applyAttackOrder(units, targetId, targetX, targetY, append = false) {
  units.forEach((unit) => {
    assignOrder(unit, makeOrder("attack-target", targetX ?? unit.x, targetY ?? unit.y, targetId), append);
    unit.manualTargetId = targetId;
  });
}

export function applyHoldOrder(units) {
  units.forEach((unit) => {
    assignOrder(unit, makeOrder("hold", unit.x, unit.y, null), false);
    unit.manualTargetId = null;
  });
}

export function applyDefendOrder(state, units, team = TEAM_PLAYER, append = false) {
  const controlKey = team === TEAM_PLAYER ? "playerDefense" : "enemyDefense";
  const slots = state.scenario.controlPoints[controlKey].map((point) => tileCenter(point.gx, point.gy));

  units.forEach((unit, index) => {
    const slot = slots[index % slots.length];
    assignOrder(unit, makeOrder("defend-area", slot.x, slot.y, null), append);
    unit.manualTargetId = null;
  });
}

export function applyRetreatOrder(state, units, team = TEAM_PLAYER, append = false) {
  const workshop = getTeamWorkshop(state, team);
  const fallback = workshop || getTeamFort(state, team);
  if (!fallback) {
    return;
  }

  const offsets = formationOffsets(units.length);
  units.forEach((unit, index) => {
    const offset = offsets[index] || { x: 0, y: 0 };
    assignOrder(unit, makeOrder("retreat", fallback.x + offset.x, fallback.y + offset.y, null), append);
    unit.manualTargetId = null;
  });
}

export function issueContextOrder(state, x, y, append = false) {
  const selected = getSelectedUnits(state);
  if (selected.length === 0) {
    return;
  }

  const entity = getEntityUnderPoint(state, x, y);
  if (entity && entity.team !== TEAM_PLAYER) {
    applyAttackOrder(selected, entity.id, entity.x, entity.y, append);
    showMessage(state, append ? `Objetivo agregado a la cola: ${entity.label}` : `Objetivo marcado: ${entity.label}`, 1400);
    return;
  }

  applyMoveOrder(selected, x, y, append);
  showMessage(state, append ? `Nueva orden agregada a la cola` : `Repliegue de formacion a ${Math.round(x)}, ${Math.round(y)}`, 1100);
}

export function issueHoldOrder(state) {
  const selected = getSelectedUnits(state);
  if (selected.length === 0) {
    return;
  }
  applyHoldOrder(selected);
  showMessage(state, "Mantener posicion", 1000);
}

export function issueDefendOrder(state) {
  const selected = getSelectedUnits(state);
  if (selected.length === 0) {
    return;
  }
  applyDefendOrder(state, selected, TEAM_PLAYER, false);
  showMessage(state, "La seccion vuelve a la linea defensiva", 1200);
}

export function issueRetreatOrder(state) {
  const selected = getSelectedUnits(state);
  if (selected.length === 0) {
    return;
  }
  applyRetreatOrder(state, selected, TEAM_PLAYER, false);
  showMessage(state, "Retirada ordenada al taller", 1200);
}

export function cleanupOrders(state) {
  state.units.forEach((unit) => {
    if (!unit.alive) {
      return;
    }

    unit.queuedOrders = unit.queuedOrders.filter((order) => {
      if (order.targetId && order.type === "attack-target") {
        const target = findEntityById(state, order.targetId);
        return target && target.alive;
      }
      return true;
    });

    if (unit.order.targetId) {
      const target = findEntityById(state, unit.order.targetId);
      if (!target || !target.alive) {
        if (unit.queuedOrders.length > 0) {
          unit.order = unit.queuedOrders.shift();
        } else {
          unit.order = makeOrder("hold", unit.x, unit.y, null);
          unit.manualTargetId = null;
        }
      }
    }
  });
}

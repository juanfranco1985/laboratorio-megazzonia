import { TEAM_ENEMY } from "../core/constants.js";
import { distance, tileCenter } from "../core/math.js";
import { getLivingUnits, getTeamFort } from "../game/battleState.js";
import { applyAttackOrder, applyRetreatOrder } from "./commandSystem.js";

export function updateAI(state, dtMs) {
  state.ai.orderTimerMs -= dtMs;
  if (state.ai.orderTimerMs > 0) {
    return;
  }

  state.ai.orderTimerMs = 780;

  const enemyUnits = getLivingUnits(state, TEAM_ENEMY);
  const playerUnits = getLivingUnits(state, "player");
  const enemyFort = getTeamFort(state, TEAM_ENEMY);
  const playerFort = getTeamFort(state, "player");

  enemyUnits.forEach((unit, index) => {
    if (unit.hp < unit.maxHp * 0.28) {
      applyRetreatOrder(state, [unit], TEAM_ENEMY);
      return;
    }

    let priorityTarget = null;
    let bestScore = Infinity;

    playerUnits.forEach((candidate) => {
      const score = distance(unit, candidate) - (candidate.order.targetId === enemyFort?.id ? 90 : 0);
      if (score < bestScore) {
        bestScore = score;
        priorityTarget = candidate;
      }
    });

    if (priorityTarget && distance(unit, priorityTarget) < unit.range * 1.25) {
      applyAttackOrder([unit], priorityTarget.id, priorityTarget.x, priorityTarget.y, false);
      return;
    }

    if (playerFort && distance(unit, playerFort) <= unit.range * 1.15) {
      applyAttackOrder([unit], playerFort.id, playerFort.x, playerFort.y, false);
      return;
    }

    const enemySlots = state.scenario.controlPoints.enemyDefense;
    const slot = enemySlots[index % enemySlots.length];
    if (unit.unitType === "artillery" && state.scenario.controlPoints.midfield[index % state.scenario.controlPoints.midfield.length]) {
      const mid = state.scenario.controlPoints.midfield[index % state.scenario.controlPoints.midfield.length];
      unit.order = {
        type: "defend-area",
        x: tileCenter(mid.gx, mid.gy).x,
        y: tileCenter(mid.gx, mid.gy).y,
        targetId: null,
        path: [],
        pathIndex: 0,
        pathGoalX: tileCenter(mid.gx, mid.gy).x,
        pathGoalY: tileCenter(mid.gx, mid.gy).y,
        repathMs: 0,
      };
      unit.manualTargetId = null;
      return;
    }

    unit.order = {
      type: "defend-area",
      x: tileCenter(slot.gx, slot.gy).x,
      y: tileCenter(slot.gx, slot.gy).y,
      targetId: null,
      path: [],
      pathIndex: 0,
      pathGoalX: tileCenter(slot.gx, slot.gy).x,
      pathGoalY: tileCenter(slot.gx, slot.gy).y,
      repathMs: 0,
    };
    unit.manualTargetId = null;
  });
}

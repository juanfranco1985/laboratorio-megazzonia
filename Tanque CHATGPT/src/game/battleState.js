import { PHASES } from "../core/constants.js";

export function findUnitById(state, id) {
  return state.units.find((unit) => unit.id === id) || null;
}

export function findStructureById(state, id) {
  return state.structures.find((structure) => structure.id === id) || null;
}

export function findEntityById(state, id) {
  return findUnitById(state, id) || findStructureById(state, id);
}

export function getLivingUnits(state, team = null) {
  return state.units.filter((unit) => unit.alive && (!team || unit.team === team));
}

export function getLivingStructures(state, team = null) {
  return state.structures.filter((structure) => structure.alive && (!team || structure.team === team));
}

export function getSelectedUnits(state) {
  return state.selection.unitIds
    .map((id) => findUnitById(state, id))
    .filter(Boolean)
    .filter((unit) => unit.alive);
}

export function clearSelection(state) {
  state.selection.unitIds = [];
}

export function setSelection(state, ids) {
  state.selection.unitIds = [...new Set(ids)];
}

export function pruneSelection(state) {
  state.selection.unitIds = state.selection.unitIds.filter((id) => {
    const unit = findUnitById(state, id);
    return unit && unit.alive;
  });
}

export function getTeamFort(state, team) {
  return state.structures.find((structure) => structure.alive && structure.team === team && structure.structureType === "fort") || null;
}

export function getTeamWorkshop(state, team) {
  return state.structures.find((structure) => structure.alive && structure.team === team && structure.structureType === "workshop") || null;
}

export function setPhase(state, phase, overlay = "") {
  state.phase = phase;
  state.overlayText = overlay;
}

export function togglePause(state) {
  if (state.phase === PHASES.BATTLE) {
    setPhase(state, PHASES.PAUSED, "Pausa tactica");
  } else if (state.phase === PHASES.PAUSED) {
    setPhase(state, PHASES.BATTLE, "");
  }
}

export function showMessage(state, text, durationMs = 1800) {
  state.message = {
    text,
    ttlMs: durationMs,
  };
}

export function updateTransientState(state, dtMs) {
  if (state.message && state.message.ttlMs > 0) {
    state.message.ttlMs = Math.max(0, state.message.ttlMs - dtMs);
    if (state.message.ttlMs === 0) {
      state.message = null;
    }
  }

  for (let index = state.effects.length - 1; index >= 0; index -= 1) {
    const effect = state.effects[index];
    effect.ageMs += dtMs;
    if (effect.ageMs >= effect.durationMs) {
      state.effects.splice(index, 1);
    }
  }
}

export function isInteractivePhase(state) {
  return state.phase === PHASES.BATTLE || state.phase === PHASES.PAUSED;
}

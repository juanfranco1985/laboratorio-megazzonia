import { getSelectedUnits } from "../game/battleState.js";

export function describeSelection(state) {
  const selected = getSelectedUnits(state);
  if (selected.length === 0) {
    return "Sin unidades seleccionadas. Selecciona un peloton y usa click derecho para ordenar. Shift + click derecho agrega ordenes a la cola.";
  }

  if (selected.length === 1) {
    const unit = selected[0];
    return `${unit.label} | ${unit.unitType} | HP ${Math.round(unit.hp)}/${unit.maxHp} | orden: ${unit.order.type} | cola: ${unit.queuedOrders.length}`;
  }

  const avgHp = selected.reduce((sum, unit) => sum + unit.hp / unit.maxHp, 0) / selected.length;
  const queued = selected.reduce((sum, unit) => sum + unit.queuedOrders.length, 0);
  return `${selected.length} tanques seleccionados | integridad media ${Math.round(avgHp * 100)}% | ordenes en cola ${queued}`;
}

import { PHASES } from "../core/constants.js";
import { getScenarioIds } from "../data/scenarios.js";
import { togglePause } from "../game/battleState.js";
import { issueDefendOrder, issueHoldOrder, issueRetreatOrder } from "../systems/commandSystem.js";

function cycleScenario(currentScenarioId) {
  const ids = getScenarioIds();
  const currentIndex = Math.max(0, ids.indexOf(currentScenarioId));
  const nextId = ids[(currentIndex + 1) % ids.length];
  const params = new URLSearchParams(window.location.search);
  params.set("scenario", nextId);
  window.location.search = params.toString();
}

export function bindOrderButtons(state, refs) {
  refs.btnPause.addEventListener("click", () => togglePause(state));
  refs.btnHold.addEventListener("click", () => issueHoldOrder(state));
  refs.btnDefend.addEventListener("click", () => issueDefendOrder(state));
  refs.btnRetreat.addEventListener("click", () => issueRetreatOrder(state));
  refs.btnScenario.addEventListener("click", () => cycleScenario(state.scenario.id));
  refs.btnReset.addEventListener("click", () => window.location.reload());
}

export function refreshButtons(state, refs) {
  refs.btnPause.textContent = state.phase === PHASES.PAUSED ? "Reanudar" : "Pausa tactica";
  refs.btnScenario.textContent = `Escenario: ${state.scenario.name}`;
}

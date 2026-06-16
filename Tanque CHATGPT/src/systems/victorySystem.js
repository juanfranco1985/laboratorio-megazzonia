import { PHASES } from "../core/constants.js";
import { getLivingUnits, getTeamFort, setPhase, showMessage } from "../game/battleState.js";

export function updateVictoryConditions(state) {
  if (state.result) {
    return;
  }

  const playerFort = getTeamFort(state, "player");
  const enemyFort = getTeamFort(state, "enemy");

  if (!playerFort || !playerFort.alive) {
    state.result = "defeat";
    setPhase(state, PHASES.DEFEAT, "Derrota");
    showMessage(state, "El fuerte aliado ha caido", 4000);
    return;
  }

  if (!enemyFort || !enemyFort.alive) {
    state.result = "victory";
    setPhase(state, PHASES.VICTORY, "Victoria");
    showMessage(state, "La fortaleza enemiga fue destruida", 4000);
    return;
  }

  if (getLivingUnits(state, "player").length === 0) {
    state.result = "defeat";
    setPhase(state, PHASES.DEFEAT, "Derrota");
    showMessage(state, "Tu peloton fue neutralizado", 4000);
  }
}

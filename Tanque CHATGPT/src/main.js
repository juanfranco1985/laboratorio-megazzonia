import { PHASES, WIDTH, HEIGHT } from "./core/constants.js";
import { createFixedStepLoop } from "./core/loop.js";
import { getDefaultScenarioId, getScenarioIds } from "./data/scenarios.js";
import { updateTransientState } from "./game/battleState.js";
import { createGameState } from "./game/createGameState.js";
import { createCamera } from "./render/camera.js";
import { renderEffects } from "./render/renderFx.js";
import { renderHud } from "./render/renderHud.js";
import { renderMap } from "./render/renderMap.js";
import { renderProjectiles } from "./render/renderProjectiles.js";
import { createSpriteBank } from "./render/spriteFactory.js";
import { renderUnits } from "./render/renderUnits.js";
import { bindOrderButtons, refreshButtons } from "./ui/orderButtons.js";
import { updateAI } from "./systems/aiSystem.js";
import { cleanupOrders } from "./systems/commandSystem.js";
import { updateRepairs } from "./systems/damageSystem.js";
import { setupInputSystem } from "./systems/inputSystem.js";
import { updateMovement } from "./systems/movementSystem.js";
import { updateProjectiles } from "./systems/projectileSystem.js";
import { updateTargetingAndWeapons } from "./systems/targetingSystem.js";
import { updateVictoryConditions } from "./systems/victorySystem.js";

const canvas = document.getElementById("battlefield");
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext("2d");

const refs = {
  btnPause: document.getElementById("btnPause"),
  btnHold: document.getElementById("btnHold"),
  btnDefend: document.getElementById("btnDefend"),
  btnRetreat: document.getElementById("btnRetreat"),
  btnScenario: document.getElementById("btnScenario"),
  btnReset: document.getElementById("btnReset"),
  statusLine: document.getElementById("statusLine"),
  selectionLine: document.getElementById("selectionLine"),
};

const params = new URLSearchParams(window.location.search);
const requestedScenario = params.get("scenario");
const scenarioId = getScenarioIds().includes(requestedScenario) ? requestedScenario : getDefaultScenarioId();
const state = createGameState(scenarioId);
const camera = createCamera();
const sprites = createSpriteBank();

bindOrderButtons(state, refs);
setupInputSystem(state, canvas, camera);

function update(dtMs) {
  state.timeMs += dtMs;
  updateTransientState(state, dtMs);
  cleanupOrders(state);

  if (state.phase === PHASES.PAUSED || state.phase === PHASES.VICTORY || state.phase === PHASES.DEFEAT) {
    return;
  }

  updateAI(state, dtMs);
  updateMovement(state, dtMs);
  updateTargetingAndWeapons(state, dtMs);
  updateProjectiles(state, dtMs);
  updateRepairs(state, dtMs);
  updateVictoryConditions(state);
}

function render() {
  renderMap(ctx, state);
  renderProjectiles(ctx, state);
  renderUnits(ctx, state, sprites);
  renderEffects(ctx, state);
  renderHud(ctx, state, refs);
  refreshButtons(state, refs);
}

createFixedStepLoop(update, render).start();

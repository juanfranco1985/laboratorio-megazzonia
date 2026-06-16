import { rectFromPoints } from "../core/math.js";
import { isInteractivePhase, togglePause } from "../game/battleState.js";
import { screenToWorld } from "../render/camera.js";
import { issueContextOrder, issueDefendOrder, issueHoldOrder, issueRetreatOrder, selectUnitsAtPoint, selectUnitsInRect } from "./commandSystem.js";

export function setupInputSystem(state, canvas, camera) {
  function pointerWorld(event) {
    return screenToWorld(canvas, camera, event.clientX, event.clientY);
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!isInteractivePhase(state)) {
      return;
    }

    const point = pointerWorld(event);
    state.input.mouseWorld = point;

    if (event.button === 0) {
      state.input.dragOrigin = point;
      state.input.dragCurrent = point;
      state.input.dragRect = null;
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    const point = pointerWorld(event);
    state.input.mouseWorld = point;

    if (state.input.dragOrigin) {
      state.input.dragCurrent = point;
      state.input.dragRect = rectFromPoints(state.input.dragOrigin, state.input.dragCurrent);
    }
  });

  window.addEventListener("pointerup", (event) => {
    if (event.button !== 0 || !state.input.dragOrigin) {
      return;
    }

    const origin = state.input.dragOrigin;
    const current = state.input.dragCurrent || origin;
    const dragRect = rectFromPoints(origin, current);

    if (dragRect.w < 8 && dragRect.h < 8) {
      selectUnitsAtPoint(state, current.x, current.y);
    } else {
      selectUnitsInRect(state, origin, current);
    }

    state.input.dragOrigin = null;
    state.input.dragCurrent = null;
    state.input.dragRect = null;
  });

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (!isInteractivePhase(state)) {
      return;
    }

    const point = pointerWorld(event);
    issueContextOrder(state, point.x, point.y, event.shiftKey);
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      togglePause(state);
      return;
    }

    if (!isInteractivePhase(state)) {
      return;
    }

    if (event.code === "KeyH") {
      issueHoldOrder(state);
    } else if (event.code === "KeyD") {
      issueDefendOrder(state);
    } else if (event.code === "KeyR") {
      issueRetreatOrder(state);
    }
  });
}

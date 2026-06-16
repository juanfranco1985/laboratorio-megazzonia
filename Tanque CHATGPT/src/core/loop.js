import { FIXED_DT_MS } from "./constants.js";

export function createFixedStepLoop(update, render) {
  let lastTime = 0;
  let accumulator = 0;

  function frame(now) {
    if (!lastTime) {
      lastTime = now;
    }

    const delta = Math.min(50, now - lastTime);
    lastTime = now;
    accumulator += delta;

    while (accumulator >= FIXED_DT_MS) {
      update(FIXED_DT_MS);
      accumulator -= FIXED_DT_MS;
    }

    render(accumulator / FIXED_DT_MS);
    requestAnimationFrame(frame);
  }

  return {
    start() {
      requestAnimationFrame(frame);
    },
  };
}

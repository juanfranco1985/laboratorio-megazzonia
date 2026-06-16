import { TIMER_TICK_MS } from "../utils/constants.js";

export class GameTimer {
  constructor(onTick) {
    this.onTick = onTick;
    this.intervalId = null;
    this.elapsedMs = 0;
    this.startedAt = 0;
  }

  start(initialElapsedMs = 0) {
    this.stop(initialElapsedMs);
    this.elapsedMs = initialElapsedMs;
    this.startedAt = Date.now() - this.elapsedMs;
    this.intervalId = window.setInterval(() => {
      this.elapsedMs = Date.now() - this.startedAt;
      this.onTick?.(this.elapsedMs);
    }, TIMER_TICK_MS);
  }

  pause() {
    if (!this.intervalId) {
      return this.elapsedMs;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.elapsedMs = Date.now() - this.startedAt;
    return this.elapsedMs;
  }

  stop(finalElapsedMs = 0) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.elapsedMs = finalElapsedMs;
    this.startedAt = 0;
  }

  isRunning() {
    return this.intervalId !== null;
  }
}

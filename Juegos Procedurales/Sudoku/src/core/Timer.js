export class Timer {
  constructor(onTick = () => {}) {
    this.onTick = onTick;
    this.intervalId = null;
    this.elapsedMs = 0;
    this.startedAt = 0;
    this.running = false;
  }

  start(initialElapsedMs = 0) {
    this.stop();
    this.elapsedMs = initialElapsedMs;
    this.startedAt = Date.now();
    this.running = true;
    this.intervalId = globalThis.setInterval(() => {
      this.onTick(this.getElapsedMs());
    }, 1000);
    this.onTick(this.getElapsedMs());
  }

  pause() {
    if (!this.running) {
      return this.elapsedMs;
    }

    this.elapsedMs = this.getElapsedMs();
    this.running = false;
    this.clearInterval();
    this.onTick(this.elapsedMs);
    return this.elapsedMs;
  }

  resume() {
    if (this.running) {
      return;
    }

    this.startedAt = Date.now();
    this.running = true;
    this.intervalId = globalThis.setInterval(() => {
      this.onTick(this.getElapsedMs());
    }, 1000);
    this.onTick(this.getElapsedMs());
  }

  stop() {
    this.elapsedMs = this.getElapsedMs();
    this.running = false;
    this.clearInterval();
    return this.elapsedMs;
  }

  clearInterval() {
    if (this.intervalId !== null) {
      globalThis.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getElapsedMs() {
    if (!this.running) {
      return this.elapsedMs;
    }

    return this.elapsedMs + (Date.now() - this.startedAt);
  }
}

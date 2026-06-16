export class Timer {
  constructor({ onTick = () => {} } = {}) {
    this.onTick = onTick;
    this.elapsedMs = 0;
    this.startedAt = 0;
    this.running = false;
    this.intervalId = null;
  }

  start(initialElapsedMs = 0) {
    this.elapsedMs = initialElapsedMs;
    this.startedAt = performance.now();
    this.running = true;
    this.startTicker();
    this.emit();
  }

  resume() {
    if (this.running) {
      return;
    }

    this.startedAt = performance.now();
    this.running = true;
    this.startTicker();
    this.emit();
  }

  pause() {
    if (!this.running) {
      return;
    }

    this.elapsedMs = this.getElapsedMs();
    this.running = false;
    this.stopTicker();
    this.emit();
  }

  reset() {
    this.elapsedMs = 0;
    this.startedAt = 0;
    this.running = false;
    this.stopTicker();
    this.emit();
  }

  getElapsedMs() {
    if (!this.running) {
      return Math.floor(this.elapsedMs);
    }

    return Math.floor(this.elapsedMs + (performance.now() - this.startedAt));
  }

  serialize() {
    return {
      elapsedMs: this.getElapsedMs(),
      running: this.running,
    };
  }

  emit() {
    this.onTick(this.getElapsedMs());
  }

  startTicker() {
    this.stopTicker();
    this.intervalId = window.setInterval(() => this.emit(), 250);
  }

  stopTicker() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

import { ANALYTICS_QUEUE_LIMIT, APP_VERSION } from "../utils/constants.js";

export class Analytics {
  constructor({ storage, nativeBridge }) {
    this.storage = storage;
    this.nativeBridge = nativeBridge;
    this.queue = storage.loadAnalyticsQueue();
  }

  track(name, payload = {}) {
    const event = {
      name,
      payload,
      timestamp: new Date().toISOString(),
      appVersion: APP_VERSION,
    };

    this.queue.push(event);
    if (this.queue.length > ANALYTICS_QUEUE_LIMIT) {
      this.queue = this.queue.slice(-ANALYTICS_QUEUE_LIMIT);
    }
    this.persist();
    this.flush();
  }

  flush() {
    if (!this.nativeBridge.isAvailable()) {
      return;
    }

    const pending = [];
    for (const event of this.queue) {
      try {
        this.nativeBridge.trackEvent(event.name, event);
      } catch (_error) {
        pending.push(event);
      }
    }

    this.queue = pending;
    this.persist();
  }

  persist() {
    this.storage.saveAnalyticsQueue(this.queue);
  }
}

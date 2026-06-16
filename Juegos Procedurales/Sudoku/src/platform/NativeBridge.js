import { tryVibrate } from "../utils/helpers.js";

function resolveAndroidBridge() {
  if (globalThis.AndroidBridge) {
    return globalThis.AndroidBridge;
  }
  if (globalThis.webkit?.messageHandlers?.androidBridge) {
    return globalThis.webkit.messageHandlers.androidBridge;
  }
  return null;
}

function ensureResolverRegistry() {
  if (!globalThis.__sudokuAndroidBridge) {
    const rewardedHintResolvers = new Map();
    globalThis.__sudokuAndroidBridge = {
      resolveRewardedHint(requestId, granted) {
        const resolver = rewardedHintResolvers.get(requestId);
        if (!resolver) {
          return;
        }
        rewardedHintResolvers.delete(requestId);
        resolver(Boolean(granted));
      },
      registerRewardedHint(requestId, resolver) {
        rewardedHintResolvers.set(requestId, resolver);
      },
    };
  }

  return globalThis.__sudokuAndroidBridge;
}

export class NativeBridge {
  constructor() {
    this.bridge = resolveAndroidBridge();
    this.requestCounter = 0;
    ensureResolverRegistry();
  }

  refresh() {
    this.bridge = resolveAndroidBridge();
    return this.bridge;
  }

  isAvailable() {
    return Boolean(this.bridge || this.refresh());
  }

  call(method, payload = null) {
    const bridge = this.bridge || this.refresh();
    if (!bridge) {
      return null;
    }

    if (typeof bridge[method] === "function") {
      try {
        return bridge[method](JSON.stringify(payload ?? {}));
      } catch (_error) {
        return null;
      }
    }

    if (typeof bridge.postMessage === "function") {
      try {
        bridge.postMessage({
          method,
          payload: payload ?? {},
        });
        return true;
      } catch (_error) {
        return null;
      }
    }

    return null;
  }

  vibrate(pattern) {
    const handled = this.call("vibrate", { pattern });
    if (handled === null) {
      tryVibrate(pattern);
    }
  }

  trackEvent(name, payload = {}) {
    this.call("trackEvent", {
      name,
      payload,
    });
  }

  setBackContext(context) {
    this.call("setBackContext", context);
  }

  storageGetItem(key) {
    const bridge = this.bridge || this.refresh();
    if (!bridge || typeof bridge.storageGetItem !== "function") {
      return null;
    }

    try {
      const result = bridge.storageGetItem(JSON.stringify({ key }));
      return typeof result === "string" ? result : null;
    } catch (_error) {
      return null;
    }
  }

  storageSetItem(key, value) {
    const bridge = this.bridge || this.refresh();
    if (!bridge || typeof bridge.storageSetItem !== "function") {
      return false;
    }

    try {
      bridge.storageSetItem(
        JSON.stringify({
          key,
          value,
        })
      );
      return true;
    } catch (_error) {
      return false;
    }
  }

  storageRemoveItem(key) {
    const bridge = this.bridge || this.refresh();
    if (!bridge || typeof bridge.storageRemoveItem !== "function") {
      return false;
    }

    try {
      bridge.storageRemoveItem(JSON.stringify({ key }));
      return true;
    } catch (_error) {
      return false;
    }
  }

  requestRewardedHint() {
    const bridge = this.bridge || this.refresh();
    if (!bridge) {
      return Promise.resolve(true);
    }

    const requestId = `reward-${Date.now()}-${this.requestCounter++}`;
    const registry = ensureResolverRegistry();

    return new Promise((resolve) => {
      registry.registerRewardedHint(requestId, resolve);

      try {
        if (typeof bridge.requestRewardedHint === "function") {
          bridge.requestRewardedHint(JSON.stringify({ requestId }));
          return;
        }
      } catch (_error) {
        registry.resolveRewardedHint(requestId, false);
        return;
      }

      registry.resolveRewardedHint(requestId, false);
    });
  }
}

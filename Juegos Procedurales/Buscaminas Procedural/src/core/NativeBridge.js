const FALLBACK_EVENT_NAME = "buscaminas:native";

function callIfFunction(target, methodName, ...args) {
  const method = target?.[methodName];

  if (typeof method === "function") {
    try {
      method.apply(target, args);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export class NativeBridge {
  constructor() {
    this.publicApiRegistered = false;
  }

  emit(eventName, payload = {}) {
    const serialized = JSON.stringify({ event: eventName, payload });

    callIfFunction(window.BuscaminasNative, "postEvent", eventName, serialized);
    callIfFunction(window.BuscaminasNative, "postMessage", serialized);
    callIfFunction(window.AndroidBridge, "postEvent", eventName, serialized);
    callIfFunction(window.AndroidBridge, "postMessage", serialized);
    callIfFunction(window.webkit?.messageHandlers?.buscaminas, "postMessage", {
      event: eventName,
      payload,
    });

    window.dispatchEvent(
      new CustomEvent(FALLBACK_EVENT_NAME, {
        detail: {
          event: eventName,
          payload,
        },
      }),
    );
  }

  vibrate(pattern) {
    if (callIfFunction(window.BuscaminasNative, "vibrate", JSON.stringify(pattern))) {
      return;
    }

    if (callIfFunction(window.AndroidBridge, "vibrate", JSON.stringify(pattern))) {
      return;
    }

    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  copyText(label, text) {
    return (
      callIfFunction(window.BuscaminasNative, "copyText", label, text) ||
      callIfFunction(window.AndroidBridge, "copyText", label, text)
    );
  }

  shareText(title, text) {
    return (
      callIfFunction(window.BuscaminasNative, "shareText", title, text) ||
      callIfFunction(window.AndroidBridge, "shareText", title, text)
    );
  }

  showToast(message) {
    return (
      callIfFunction(window.BuscaminasNative, "showToast", message) ||
      callIfFunction(window.AndroidBridge, "showToast", message)
    );
  }

  registerPublicApi(api) {
    window.BuscaminasApp = api;
    this.publicApiRegistered = true;
  }
}

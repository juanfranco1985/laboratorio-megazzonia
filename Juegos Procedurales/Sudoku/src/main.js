import { GameState } from "./core/GameState.js";
import { Settings } from "./core/Settings.js";
import { Storage } from "./core/Storage.js";
import { SudokuEngine } from "./core/SudokuEngine.js";
import { Timer } from "./core/Timer.js";
import { Analytics } from "./platform/Analytics.js";
import { NativeBridge } from "./platform/NativeBridge.js";
import { Renderer } from "./ui/Renderer.js";
import { ThemeManager } from "./ui/ThemeManager.js";

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (location.protocol === "file:") {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (_error) {
    // Service worker is optional in local dev.
  }
}

async function bootstrap() {
  const root = document.querySelector("#app");
  const nativeBridge = new NativeBridge();
  const storage = new Storage("sudoku-procedural", nativeBridge);
  const settings = new Settings(storage);
  const timer = new Timer();
  const engine = new SudokuEngine();
  const analytics = new Analytics({
    storage,
    nativeBridge,
  });
  const themeManager = new ThemeManager();
  const gameState = new GameState({
    engine,
    storage,
    settings,
    timer,
    nativeBridge,
    analytics,
  });
  const renderer = new Renderer({
    root,
    gameState,
    themeManager,
    nativeBridge,
  });

  themeManager.init(settings.get().theme);
  renderer.init();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      gameState.handleAppHidden();
    }
  });

  window.addEventListener("beforeunload", () => {
    gameState.persistGame();
    gameState.persistStats();
    analytics.flush();
  });

  window.addEventListener("pagehide", () => {
    gameState.persistGame();
    gameState.persistStats();
    analytics.flush();
  });

  window.SudokuApp = {
    handleSystemBack() {
      return renderer.handleSystemBack();
    },
    onHostPause() {
      gameState.handleHostPause();
      return true;
    },
    onHostResume() {
      gameState.handleHostResume();
      return true;
    },
  };

  await registerServiceWorker();
  await gameState.init();
}

bootstrap();

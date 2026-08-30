import Phaser from "phaser";
import "./styles.css";
import { VIEW_WIDTH, VIEW_HEIGHT, worlds } from "./game-data.js";
import { bindTouchControls } from "./input.js";
import { MenuScene } from "./scenes/menu-scene.js";
import { AdventureScene } from "./scenes/adventure-scene.js";
import { VictoryScene } from "./scenes/victory-scene.js";
import { runtimeAssetCount } from "./assets.js";

bindTouchControls();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: VIEW_WIDTH,
  height: VIEW_HEIGHT,
  backgroundColor: "#050b12",
  pixelArt: false,
  physics: { default: "arcade", arcade: { gravity: { y: 1550 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, AdventureScene, VictoryScene],
});

window.__DELFI_GAME__ = game;
window.__DELFI_DIAGNOSTICS__ = { version:"0.9.0", runtimeAssetCount, players:1, worlds:worlds.length, bosses:worlds.filter(world=>world.boss).length };

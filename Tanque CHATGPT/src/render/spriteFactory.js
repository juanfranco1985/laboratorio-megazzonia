import { TEAM_CONFIG } from "../game/teams.js";

function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawTankSprite(role, colors) {
  const canvas = makeCanvas(52, 52);
  const ctx = canvas.getContext("2d");
  const bodyInset = role === "heavy" ? 8 : 10;
  const bodyHeight = role === "artillery" ? 24 : 28;
  const barrelLength = role === "artillery" ? 22 : role === "heavy" ? 18 : 14;
  const treadInset = role === "scout" ? 6 : 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.line;
  ctx.fillRect(8, treadInset, 8, 52 - treadInset * 2);
  ctx.fillRect(36, treadInset, 8, 52 - treadInset * 2);

  ctx.fillStyle = colors.body;
  ctx.fillRect(bodyInset, 12, 52 - bodyInset * 2, bodyHeight);

  ctx.fillStyle = colors.accent;
  ctx.fillRect(bodyInset + 3, 16, 52 - bodyInset * 2 - 6, 6);

  ctx.fillStyle = colors.turret;
  if (role === "artillery") {
    ctx.fillRect(18, 18, 16, 18);
    ctx.fillRect(23, 0, 6, barrelLength);
  } else if (role === "heavy") {
    ctx.fillRect(17, 16, 18, 18);
    ctx.fillRect(23, 0, 6, barrelLength);
  } else {
    ctx.fillRect(18, 18, 16, 16);
    ctx.fillRect(23, 2, 6, barrelLength);
  }

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(bodyInset + 4, 13, 52 - bodyInset * 2 - 8, 4);
  return canvas;
}

function drawFortSprite(colors) {
  const canvas = makeCanvas(96, 120);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#2a241d";
  ctx.fillRect(10, 14, 76, 92);
  ctx.fillStyle = colors.body;
  ctx.fillRect(14, 18, 68, 84);
  ctx.fillStyle = colors.line;
  ctx.fillRect(14, 18, 68, 10);
  ctx.fillRect(14, 92, 68, 10);
  ctx.fillStyle = colors.turret;
  ctx.fillRect(18, 30, 16, 50);
  ctx.fillRect(62, 30, 16, 50);
  ctx.fillRect(39, 40, 18, 40);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(43, 10, 10, 18);
  ctx.fillRect(44, 2, 8, 10);
  return canvas;
}

function drawTurretSprite(colors) {
  const canvas = makeCanvas(52, 52);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1a1814";
  ctx.beginPath();
  ctx.arc(26, 26, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.arc(26, 26, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.turret;
  ctx.fillRect(22, 6, 8, 20);
  ctx.fillRect(20, 18, 12, 14);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(23, 11, 6, 8);
  return canvas;
}

function drawWorkshopSprite(colors) {
  const canvas = makeCanvas(68, 68);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#201f1b";
  ctx.fillRect(8, 14, 52, 42);
  ctx.fillStyle = colors.body;
  ctx.fillRect(10, 16, 48, 38);
  ctx.fillStyle = colors.turret;
  ctx.fillRect(16, 22, 36, 8);
  ctx.fillRect(20, 34, 28, 6);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(30, 10, 8, 10);
  return canvas;
}

export function createSpriteBank() {
  const sprites = {
    units: { player: {}, enemy: {} },
    structures: { player: {}, enemy: {} },
  };

  Object.entries(TEAM_CONFIG).forEach(([team, config]) => {
    sprites.units[team].scout = drawTankSprite("scout", config.colors);
    sprites.units[team].medium = drawTankSprite("medium", config.colors);
    sprites.units[team].heavy = drawTankSprite("heavy", config.colors);
    sprites.units[team].artillery = drawTankSprite("artillery", config.colors);
    sprites.structures[team].fort = drawFortSprite(config.colors);
    sprites.structures[team].turret = drawTurretSprite(config.colors);
    sprites.structures[team].workshop = drawWorkshopSprite(config.colors);
  });

  return sprites;
}

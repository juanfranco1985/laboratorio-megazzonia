import { COLS, HEIGHT, ROWS, TILE, WIDTH } from "../core/constants.js";

function drawGroundTile(ctx, gx, gy) {
  const x = gx * TILE;
  const y = gy * TILE;
  const even = (gx + gy) % 2 === 0;
  ctx.fillStyle = even ? "#182321" : "#14201d";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(x, y, TILE, 1);
}

function drawCoverTile(ctx, gx, gy) {
  const x = gx * TILE;
  const y = gy * TILE;
  drawGroundTile(ctx, gx, gy);
  ctx.fillStyle = "#657245";
  ctx.fillRect(x + 3, y + 7, TILE - 6, 4);
  ctx.fillRect(x + 2, y + 13, TILE - 4, 3);
  ctx.fillStyle = "#41492d";
  ctx.fillRect(x + 5, y + 9, TILE - 10, 2);
}

function drawRoughTile(ctx, gx, gy) {
  const x = gx * TILE;
  const y = gy * TILE;
  drawGroundTile(ctx, gx, gy);
  ctx.fillStyle = "#43382f";
  ctx.beginPath();
  ctx.arc(x + 7, y + 8, 4, 0, Math.PI * 2);
  ctx.arc(x + 15, y + 14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(100, 82, 63, 0.65)";
  ctx.beginPath();
  ctx.arc(x + 7, y + 8, 2, 0, Math.PI * 2);
  ctx.arc(x + 15, y + 14, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawMudTile(ctx, gx, gy) {
  const x = gx * TILE;
  const y = gy * TILE;
  drawGroundTile(ctx, gx, gy);
  ctx.fillStyle = "#2d3223";
  ctx.fillRect(x + 2, y + 4, TILE - 4, TILE - 8);
  ctx.fillStyle = "rgba(118, 128, 86, 0.2)";
  ctx.fillRect(x + 5, y + 6, TILE - 10, TILE - 12);
}

function drawWreckTile(ctx, gx, gy) {
  const x = gx * TILE;
  const y = gy * TILE;
  drawGroundTile(ctx, gx, gy);
  ctx.fillStyle = "#52483a";
  ctx.fillRect(x + 4, y + 5, 5, 10);
  ctx.fillRect(x + 11, y + 10, 7, 4);
  ctx.fillRect(x + 14, y + 4, 4, 9);
  ctx.strokeStyle = "#8c775e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 16);
  ctx.lineTo(x + 9, y + 11);
  ctx.moveTo(x + 12, y + 8);
  ctx.lineTo(x + 18, y + 16);
  ctx.stroke();
}

function drawWallTile(ctx, gx, gy) {
  const x = gx * TILE;
  const y = gy * TILE;
  ctx.fillStyle = "#4b4a45";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#5f5d57";
  ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = "#3c3a35";
  for (let row = 0; row < 3; row += 1) {
    const yOffset = y + 4 + row * 6;
    ctx.fillRect(x + 3 + (row % 2 === 0 ? 0 : 4), yOffset, 7, 4);
    ctx.fillRect(x + 12 + (row % 2 === 0 ? 0 : 4), yOffset, 7, 4);
  }
}

function drawTile(ctx, gx, gy, kind) {
  if (kind === "cover") {
    drawCoverTile(ctx, gx, gy);
  } else if (kind === "rough") {
    drawRoughTile(ctx, gx, gy);
  } else if (kind === "mud") {
    drawMudTile(ctx, gx, gy);
  } else if (kind === "wreck") {
    drawWreckTile(ctx, gx, gy);
  } else if (kind === "wall") {
    drawWallTile(ctx, gx, gy);
  } else {
    drawGroundTile(ctx, gx, gy);
  }
}

export function renderMap(ctx, state) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (let gy = 0; gy < ROWS; gy += 1) {
    for (let gx = 0; gx < COLS; gx += 1) {
      drawTile(ctx, gx, gy, state.map.tiles[gy][gx].kind);
    }
  }

  ctx.strokeStyle = "rgba(219, 197, 134, 0.08)";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.strokeStyle = "rgba(230, 214, 160, 0.06)";
  ctx.setLineDash([10, 12]);
  ctx.stroke();
  ctx.setLineDash([]);
}

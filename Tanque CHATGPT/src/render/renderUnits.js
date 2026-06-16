import { TEAM_CONFIG } from "../game/teams.js";

function drawRotated(ctx, image, x, y, dir, width, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir + Math.PI / 2);
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawHealthBar(ctx, x, y, width, current, max, color) {
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(x - width / 2, y, width, 3);
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2 + 1, y + 1, (width - 2) * Math.max(0, current / max), 1);
}

function drawOrderChain(ctx, unit) {
  const steps = [unit.order, ...unit.queuedOrders].filter(Boolean).filter((order) => order.type !== "hold");
  if (steps.length === 0) {
    return;
  }

  let fromX = unit.x;
  let fromY = unit.y;

  steps.forEach((order, index) => {
    ctx.strokeStyle = index === 0 ? "rgba(255, 235, 178, 0.26)" : "rgba(255, 235, 178, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(order.x, order.y);
    ctx.stroke();

    ctx.fillStyle = index === 0 ? "rgba(255, 235, 178, 0.72)" : "rgba(255, 235, 178, 0.36)";
    ctx.beginPath();
    ctx.arc(order.x, order.y, 3, 0, Math.PI * 2);
    ctx.fill();

    fromX = order.x;
    fromY = order.y;
  });
}

function drawStructure(ctx, structure, sprites) {
  const image = sprites.structures[structure.team][structure.structureType];
  if (!image) {
    return;
  }

  drawRotated(ctx, image, structure.x, structure.y, structure.dir - Math.PI / 2, structure.width, structure.height);
  drawHealthBar(ctx, structure.x, structure.y - structure.height / 2 - 8, 42, structure.hp, structure.maxHp, TEAM_CONFIG[structure.team].colors.body);

  if (structure.structureType === "workshop" && structure.alive) {
    ctx.strokeStyle = "rgba(150, 205, 189, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(structure.x, structure.y, structure.repairRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawUnit(ctx, unit, sprites, selected) {
  const image = sprites.units[unit.team][unit.spriteKey];
  const drawSize = unit.radius * 2.05;
  drawRotated(ctx, image, unit.x, unit.y, unit.dir - Math.PI / 2, drawSize, drawSize);

  if (unit.hp < unit.maxHp * 0.45) {
    ctx.fillStyle = "rgba(70, 70, 70, 0.24)";
    ctx.beginPath();
    ctx.arc(unit.x, unit.y - unit.radius - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHealthBar(ctx, unit.x, unit.y - unit.radius - 8, 18, unit.hp, unit.maxHp, TEAM_CONFIG[unit.team].colors.body);

  if (selected) {
    drawOrderChain(ctx, unit);

    ctx.strokeStyle = TEAM_CONFIG[unit.team].colors.text;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, unit.radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = TEAM_CONFIG[unit.team].colors.range;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, unit.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function renderUnits(ctx, state, sprites) {
  state.structures.forEach((structure) => {
    if (structure.alive) {
      drawStructure(ctx, structure, sprites);
    }
  });

  state.units.forEach((unit) => {
    if (!unit.alive) {
      return;
    }
    const selected = state.selection.unitIds.includes(unit.id);
    drawUnit(ctx, unit, sprites, selected);
  });
}

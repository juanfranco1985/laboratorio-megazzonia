import { TILE } from "./constants.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function distanceXY(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function angleBetween(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDelta(a, b) {
  let delta = a - b;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length, length };
}

export function tileCenter(gx, gy) {
  return {
    x: gx * TILE + TILE / 2,
    y: gy * TILE + TILE / 2,
  };
}

export function worldToGrid(x, y) {
  return {
    gx: Math.floor(x / TILE),
    gy: Math.floor(y / TILE),
  };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function pointInCircle(x, y, cx, cy, radius) {
  return distanceXY(x, y, cx, cy) <= radius;
}

export function rectFromPoints(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

export function circleIntersectsRect(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
  return distanceXY(circle.x, circle.y, nearestX, nearestY) <= circle.radius;
}

export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

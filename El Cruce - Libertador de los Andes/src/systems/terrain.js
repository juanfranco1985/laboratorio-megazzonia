import { clamp, lerp } from "../core/math.js";
import { TERRAIN_POINTS } from "../data/expedition.js";

export function terrainHeightAt(x) {
  const safeX = clamp(x, TERRAIN_POINTS[0][0], TERRAIN_POINTS.at(-1)[0]);
  let index = 0;
  while (index < TERRAIN_POINTS.length - 2 && safeX > TERRAIN_POINTS[index + 1][0]) index += 1;
  const [x1, y1] = TERRAIN_POINTS[index];
  const [x2, y2] = TERRAIN_POINTS[index + 1];
  const progress = clamp((safeX - x1) / Math.max(1, x2 - x1), 0, 1);
  const smooth = progress * progress * (3 - 2 * progress);
  const base = lerp(y1, y2, smooth);
  const detailStrength = safeX < 2400 ? 5 : safeX < 7200 ? 10 : 14;
  const detail = Math.sin(safeX * .0081) * detailStrength + Math.sin(safeX * .021) * detailStrength * .28;
  return base + detail;
}

export function chapterAt(x, chapters) {
  const index = chapters.findIndex((chapter) => x < chapter.end);
  return index < 0 ? chapters.length - 1 : index;
}

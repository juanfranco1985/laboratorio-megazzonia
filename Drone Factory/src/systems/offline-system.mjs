import { clamp, numberOr } from "../utils.mjs";

export function computeOfflineGain(eps, awaySeconds, capSeconds, efficiency = 0.8) {
  const safeEps = Math.max(0, numberOr(eps, 0));
  const safeAway = Math.max(0, numberOr(awaySeconds, 0));
  const safeCap = Math.max(0, numberOr(capSeconds, 0));
  const safeEfficiency = clamp(numberOr(efficiency, 0), 0, 1);
  const appliedSeconds = Math.min(safeAway, safeCap);
  const gain = safeEps * appliedSeconds * safeEfficiency;
  return { appliedSeconds, gain };
}

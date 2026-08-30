export const JUMP_TUNING = Object.freeze({
  bufferMs: 160,
  coyoteMs: 120,
  releaseVelocity: -280,
});

export function shouldStartJump(now, lastGroundedAt, bufferedUntil) {
  return now <= bufferedUntil && now - lastGroundedAt <= JUMP_TUNING.coyoteMs;
}

export function shortenReleasedJump(velocityY, wasHeld, isHeld) {
  return wasHeld && !isHeld && velocityY < JUMP_TUNING.releaseVelocity
    ? JUMP_TUNING.releaseVelocity
    : velocityY;
}

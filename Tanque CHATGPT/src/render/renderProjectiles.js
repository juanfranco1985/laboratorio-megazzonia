export function renderProjectiles(ctx, state) {
  state.projectiles.forEach((projectile) => {
    ctx.strokeStyle = projectile.splashRadius > 0 ? "rgba(255, 183, 102, 0.8)" : "rgba(255, 245, 165, 0.8)";
    ctx.lineWidth = projectile.splashRadius > 0 ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(projectile.x - projectile.vx * 0.02, projectile.y - projectile.vy * 0.02);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();

    ctx.fillStyle = projectile.splashRadius > 0 ? "#ffbf6a" : "#fff4a3";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

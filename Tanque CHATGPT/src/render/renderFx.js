export function renderEffects(ctx, state) {
  state.effects.forEach((effect) => {
    const progress = effect.ageMs / effect.durationMs;

    if (effect.type === "explosion") {
      const radius = effect.size * (0.3 + progress * 0.8);
      const alpha = Math.max(0, 1 - progress * 1.2);
      const gradient = ctx.createRadialGradient(effect.x, effect.y, 2, effect.x, effect.y, radius);
      gradient.addColorStop(0, `rgba(255, 233, 162, ${alpha})`);
      gradient.addColorStop(0.45, `rgba(255, 138, 72, ${alpha * 0.9})`);
      gradient.addColorStop(1, `rgba(65, 34, 18, ${alpha * 0.1})`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (effect.type === "muzzle") {
      const alpha = Math.max(0, 1 - progress * 1.4);
      ctx.fillStyle = `rgba(255, 223, 130, ${alpha})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    if (effect.type === "spark") {
      const alpha = Math.max(0, 1 - progress * 1.8);
      ctx.strokeStyle = `rgba(255, 250, 220, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(effect.x - 5, effect.y - 5);
      ctx.lineTo(effect.x + 5, effect.y + 5);
      ctx.moveTo(effect.x + 5, effect.y - 5);
      ctx.lineTo(effect.x - 5, effect.y + 5);
      ctx.stroke();
    }
  });
}

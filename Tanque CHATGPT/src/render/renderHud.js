import { HEIGHT, PHASES, WIDTH } from "../core/constants.js";
import { getTeamFort } from "../game/battleState.js";
import { TEAM_CONFIG } from "../game/teams.js";
import { describeSelection } from "../ui/selectionPanel.js";

function fortStatus(fort, teamConfig) {
  if (!fort) {
    return `${teamConfig.label}: destruido`;
  }
  return `${teamConfig.label} fuerte ${Math.round((fort.hp / fort.maxHp) * 100)}%`;
}

export function renderHud(ctx, state, refs) {
  const playerFort = getTeamFort(state, "player");
  const enemyFort = getTeamFort(state, "enemy");
  refs.statusLine.textContent = `Escenario ${state.scenario.name} | ${fortStatus(playerFort, TEAM_CONFIG.player)} | ${fortStatus(enemyFort, TEAM_CONFIG.enemy)} | objetivo: ${state.objectiveText}`;
  refs.selectionLine.textContent = describeSelection(state);

  if (state.message) {
    ctx.fillStyle = "rgba(7, 12, 12, 0.6)";
    ctx.fillRect(WIDTH / 2 - 250, 10, 500, 32);
    ctx.strokeStyle = "rgba(214, 178, 94, 0.35)";
    ctx.strokeRect(WIDTH / 2 - 250, 10, 500, 32);
    ctx.fillStyle = "#ecf1e8";
    ctx.font = "16px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(state.message.text, WIDTH / 2, 31);
  }

  if (state.input.dragRect) {
    const rect = state.input.dragRect;
    ctx.fillStyle = "rgba(159, 207, 135, 0.16)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "rgba(215, 239, 180, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  if (state.phase === PHASES.PAUSED || state.phase === PHASES.VICTORY || state.phase === PHASES.DEFEAT) {
    ctx.fillStyle = "rgba(5, 8, 8, 0.45)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#f5f0e6";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Trebuchet MS";
    ctx.fillText(state.overlayText || "Pausa tactica", WIDTH / 2, HEIGHT / 2 - 12);
    ctx.font = "18px Trebuchet MS";
    if (state.phase === PHASES.PAUSED) {
      ctx.fillText("Puedes encadenar ordenes con Shift + click derecho antes de reanudar.", WIDTH / 2, HEIGHT / 2 + 24);
    } else {
      ctx.fillText("Pulsa Reiniciar escenario para jugar otra vez.", WIDTH / 2, HEIGHT / 2 + 24);
    }
  }
}

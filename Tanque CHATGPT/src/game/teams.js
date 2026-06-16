import { TEAM_COLORS } from "../core/constants.js";

export const TEAM_CONFIG = {
  player: {
    id: "player",
    label: "Coalicion",
    colors: TEAM_COLORS.player,
  },
  enemy: {
    id: "enemy",
    label: "Legion Roja",
    colors: TEAM_COLORS.enemy,
  },
};

export function otherTeam(team) {
  return team === "player" ? "enemy" : "player";
}

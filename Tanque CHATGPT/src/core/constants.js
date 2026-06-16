export const TILE = 22;
export const COLS = 56;
export const ROWS = 20;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;
export const FIXED_DT_MS = 1000 / 60;

export const TEAM_PLAYER = "player";
export const TEAM_ENEMY = "enemy";

export const PHASES = {
  BATTLE: "battle",
  PAUSED: "paused",
  VICTORY: "victory",
  DEFEAT: "defeat",
};

export const TEAM_COLORS = {
  player: {
    body: "#93c07b",
    turret: "#5f8a4f",
    accent: "#d7efb4",
    line: "#243322",
    range: "rgba(165, 214, 127, 0.18)",
    text: "#d7f0c6",
  },
  enemy: {
    body: "#d26a60",
    turret: "#8d3f38",
    accent: "#f2b2a8",
    line: "#3d1b18",
    range: "rgba(226, 110, 98, 0.16)",
    text: "#f2c5be",
  },
};

export const GAME_TITLE = "Linea de Acero";

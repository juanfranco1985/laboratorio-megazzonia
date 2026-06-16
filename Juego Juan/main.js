const {
  tracks: TRACKS,
  weather: WEATHER,
  upgrades: UPGRADE_CATALOG,
  drivers: DRIVER_CONFIGS,
} = window.GAME_DATA;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const shell = document.querySelector(".shell");
const hudPanel = document.querySelector(".hud-panel");

const hud = {
  lap: document.getElementById("lapValue"),
  place: document.getElementById("placeValue"),
  speed: document.getElementById("speedValue"),
  integrity: document.getElementById("integrityValue"),
  credits: document.getElementById("creditsValue"),
  bestLap: document.getElementById("bestLapValue"),
  boost: document.getElementById("boostBar"),
  shield: document.getElementById("shieldBar"),
  energy: document.getElementById("energyBar"),
  message: document.getElementById("messageValue"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText"),
};

const ui = {
  trackName: document.getElementById("trackName"),
  trackDescription: document.getElementById("trackDescription"),
  trackStats: document.getElementById("trackStats"),
  trackGrid: document.getElementById("trackGrid"),
  trackSearchInput: document.getElementById("trackSearchInput"),
  weatherButtons: document.getElementById("weatherButtons"),
  driverGrid: document.getElementById("driverGrid"),
  upgradeGrid: document.getElementById("upgradeGrid"),
  garageTabs: document.getElementById("garageTabs"),
  sessionDriverValue: document.getElementById("sessionDriverValue"),
  sessionDriverMeta: document.getElementById("sessionDriverMeta"),
  sessionTrackValue: document.getElementById("sessionTrackValue"),
  sessionTrackMeta: document.getElementById("sessionTrackMeta"),
  sessionSetupValue: document.getElementById("sessionSetupValue"),
  sessionSetupMeta: document.getElementById("sessionSetupMeta"),
  sessionGarageValue: document.getElementById("sessionGarageValue"),
  sessionGarageMeta: document.getElementById("sessionGarageMeta"),
  gameModeButtons: document.getElementById("gameModeButtons"),
  sessionTypeButtons: document.getElementById("sessionTypeButtons"),
  compoundButtons: document.getElementById("compoundButtons"),
  weekendSummary: document.getElementById("weekendSummary"),
  opponentCountInput: document.getElementById("opponentCountInput"),
  opponentCountValue: document.getElementById("opponentCountValue"),
  startRaceBtn: document.getElementById("startRaceBtn"),
  trackScaleInput: document.getElementById("trackScaleInput"),
  trackScaleValue: document.getElementById("trackScaleValue"),
  physicsScaleInput: document.getElementById("physicsScaleInput"),
  physicsScaleValue: document.getElementById("physicsScaleValue"),
  cameraZoomInput: document.getElementById("cameraZoomInput"),
  cameraZoomValue: document.getElementById("cameraZoomValue"),
  resetScaleBtn: document.getElementById("resetScaleBtn"),
  menuPanels: Array.from(document.querySelectorAll("[data-menu-panel]")),
  sessionChips: Array.from(document.querySelectorAll(".session-chip[data-garage-tab]")),
};

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const STORAGE_KEY = "formula-apex-save-v3";
const keys = Object.create(null);

const DEFAULT_SETTINGS = {
  trackScale: 10,
  physicsScale: 8,
  cameraZoom: 0.13,
};

const SVG_NS = "http://www.w3.org/2000/svg";
const REAL_LENGTH_WORLD_FACTOR = 0.6;
const REAL_PHYSICS_FACTOR = 0.16;
const REAL_CAMERA_FACTOR = 5.2;

const visuals = {
  asphalt: "#40464d",
  edge: "#c94d2b",
  line: "rgba(255,255,255,0.28)",
  boost: "#ff6b35",
  shield: "#11d7ff",
  repair: "#9cf06b",
  energy: "#ffd166",
  debris: "#ff7a59",
};

const ABILITY_COSTS = {
  boost: 24,
  shield: 30,
  magnet: 18,
  repair: 34,
};

const SESSION_TYPES = Object.freeze({
  race: {
    label: "Carrera",
    description: "Sesion completa con parrilla, boxes y puntos de llegada.",
  },
  qualifying: {
    label: "Qualy",
    description: "Sesion cronometrada para definir la parrilla del fin de semana.",
  },
});

const GAME_MODES = Object.freeze({
  training: {
    label: "Entreno",
    description: "Sesion libre, sin recompensas y centrada en ritmo y setup.",
  },
  single_race: {
    label: "1 Carrera",
    description: "Evento individual con recompensa inmediata.",
  },
  versus: {
    label: "VS",
    description: "Duelo configurable contra una parrilla reducida.",
  },
  championship: {
    label: "Campeonato",
    description: "Serie de varias rondas con puntos acumulados.",
  },
});

const TIRE_COMPOUNDS = Object.freeze({
  soft: {
    label: "Soft",
    short: "S",
    color: "#ff6b6b",
    grip: 1.045,
    speed: 1.018,
    brake: 1.02,
    wear: 1.42,
    wet: 0.74,
  },
  medium: {
    label: "Medium",
    short: "M",
    color: "#ffd166",
    grip: 1,
    speed: 1,
    brake: 1,
    wear: 1,
    wet: 0.82,
  },
  hard: {
    label: "Hard",
    short: "H",
    color: "#f5f7fb",
    grip: 0.972,
    speed: 0.988,
    brake: 0.99,
    wear: 0.72,
    wet: 0.86,
  },
  intermediate: {
    label: "Inter",
    short: "I",
    color: "#5ee27a",
    grip: 0.954,
    speed: 0.964,
    brake: 0.97,
    wear: 0.88,
    wet: 1.08,
  },
  wet: {
    label: "Wet",
    short: "W",
    color: "#3da2ff",
    grip: 0.92,
    speed: 0.94,
    brake: 0.95,
    wear: 0.78,
    wet: 1.18,
  },
});

const QUALIFYING_SESSION_SECONDS = 105;
const SECTOR_RATIOS = Object.freeze([1 / 3, 2 / 3, 1]);
const CHAMPIONSHIP_POINTS = Object.freeze([25, 18, 15, 12, 10, 8, 6, 4, 2, 1]);
const CHAMPIONSHIP_ROUNDS = 5;

const rainParticles = Array.from({ length: 90 }, () => ({
  x: Math.random() * WIDTH,
  y: Math.random() * HEIGHT,
  speed: 440 + (Math.random() * 220),
  length: 10 + (Math.random() * 18),
}));

const svgMeasureRoot = document.createElementNS(SVG_NS, "svg");
svgMeasureRoot.setAttribute("width", "0");
svgMeasureRoot.setAttribute("height", "0");
svgMeasureRoot.style.position = "absolute";
svgMeasureRoot.style.width = "0";
svgMeasureRoot.style.height = "0";
svgMeasureRoot.style.opacity = "0";
svgMeasureRoot.style.pointerEvents = "none";
document.body.appendChild(svgMeasureRoot);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + ((b - a) * t);
}

function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function normalizeSettings(settings = {}) {
  return {
    trackScale: clamp(Number(settings.trackScale ?? DEFAULT_SETTINGS.trackScale), 4, 20),
    physicsScale: clamp(Number(settings.physicsScale ?? DEFAULT_SETTINGS.physicsScale), 4, 16),
    cameraZoom: clamp(Number(settings.cameraZoom ?? DEFAULT_SETTINGS.cameraZoom), 0.06, 0.28),
  };
}

function trackScale() {
  return state.save.settings.trackScale;
}

function usesRealTrackGeometry(config = state.trackConfig) {
  return Boolean(config?.svgPath);
}

function trackSpaceScale(config = state.trackConfig) {
  return usesRealTrackGeometry(config) ? trackScale() * REAL_LENGTH_WORLD_FACTOR : trackScale();
}

function physicsScale() {
  return usesRealTrackGeometry() ? state.save.settings.physicsScale * REAL_PHYSICS_FACTOR : state.save.settings.physicsScale;
}

function vehicleScale() {
  return usesRealTrackGeometry() ? trackSpaceScale() * 0.16 : trackScale() * 0.8;
}

function cameraZoom() {
  return usesRealTrackGeometry() ? state.save.settings.cameraZoom * REAL_CAMERA_FACTOR : state.save.settings.cameraZoom;
}

function formatPhysicsScaleValue(value = state.save.settings.physicsScale, config = state.trackConfig) {
  const effective = usesRealTrackGeometry(config) ? value * REAL_PHYSICS_FACTOR : value;
  return usesRealTrackGeometry(config) ? `${effective.toFixed(2)}x real` : `${effective.toFixed(1)}x`;
}

function formatCameraZoomValue(value = state.save.settings.cameraZoom, config = state.trackConfig) {
  const effective = usesRealTrackGeometry(config) ? value * REAL_CAMERA_FACTOR : value;
  return effective.toFixed(2);
}

function speedDisplayKph(driver) {
  if (usesRealTrackGeometry()) {
    return Math.round((driver.speed / trackSpaceScale()) * 3.6);
  }
  return Math.round(driver.speed * 1.15);
}

function targetTrackLength(config) {
  return config.referenceLengthKm * 1000 * trackSpaceScale(config);
}

function pickupRadius() {
  return 20 * vehicleScale();
}

function hazardRadius() {
  return 20 * vehicleScale();
}

function collisionDistance() {
  return 26 * vehicleScale();
}

function velocityOf(driver) {
  return {
    x: Math.cos(driver.angle) * driver.speed,
    y: Math.sin(driver.angle) * driver.speed,
  };
}

function applyVelocity(driver, vx, vy, maxClamp = driver.baseMax * 1.4) {
  const speed = Math.hypot(vx, vy);
  driver.speed = clamp(speed, 0, maxClamp);
  if (driver.speed > 1) {
    driver.angle = Math.atan2(vy, vx);
  }
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawUnionJack(x, y, w, h) {
  drawRect(x, y, w, h, "#0b2d82");
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = h * 0.22;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.strokeStyle = "#c8102e";
  ctx.lineWidth = h * 0.1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
  drawRect(x + (w * 0.4), y, w * 0.2, h, "#ffffff");
  drawRect(x, y + (h * 0.38), w, h * 0.24, "#ffffff");
  drawRect(x + (w * 0.445), y, w * 0.11, h, "#c8102e");
  drawRect(x, y + (h * 0.43), w, h * 0.14, "#c8102e");
}

function drawCircle(cx, cy, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlag(flag, x, y, w = 18, h = 12) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (flag === "gbr") {
    drawUnionJack(x, y, w, h);
  } else if (flag === "ned") {
    drawRect(x, y, w, h / 3, "#ae1c28");
    drawRect(x, y + (h / 3), w, h / 3, "#ffffff");
    drawRect(x, y + ((h / 3) * 2), w, h / 3, "#21468b");
  } else if (flag === "mon") {
    drawRect(x, y, w, h / 2, "#ce1126");
    drawRect(x, y + (h / 2), w, h / 2, "#ffffff");
  } else if (flag === "ita") {
    drawRect(x, y, w / 3, h, "#009246");
    drawRect(x + (w / 3), y, w / 3, h, "#ffffff");
    drawRect(x + ((w / 3) * 2), y, w / 3, h, "#ce2b37");
  } else if (flag === "fra") {
    drawRect(x, y, w / 3, h, "#0055a4");
    drawRect(x + (w / 3), y, w / 3, h, "#ffffff");
    drawRect(x + ((w / 3) * 2), y, w / 3, h, "#ef4135");
  } else if (flag === "esp") {
    drawRect(x, y, w, h * 0.25, "#aa151b");
    drawRect(x, y + (h * 0.25), w, h * 0.5, "#f1bf00");
    drawRect(x, y + (h * 0.75), w, h * 0.25, "#aa151b");
  } else if (flag === "aus") {
    drawRect(x, y, w, h, "#012169");
    drawUnionJack(x, y, w * 0.52, h * 0.58);
    drawCircle(x + (w * 0.76), y + (h * 0.32), h * 0.12, "#ffffff");
    drawCircle(x + (w * 0.62), y + (h * 0.72), h * 0.1, "#ffffff");
    drawCircle(x + (w * 0.82), y + (h * 0.74), h * 0.13, "#ffffff");
  } else if (flag === "nzl") {
    drawRect(x, y, w, h, "#012169");
    drawUnionJack(x, y, w * 0.52, h * 0.58);
    drawCircle(x + (w * 0.74), y + (h * 0.34), h * 0.11, "#ff4b55");
    drawCircle(x + (w * 0.62), y + (h * 0.68), h * 0.1, "#ff4b55");
    drawCircle(x + (w * 0.82), y + (h * 0.7), h * 0.12, "#ff4b55");
  } else if (flag === "ger") {
    drawRect(x, y, w, h / 3, "#000000");
    drawRect(x, y + (h / 3), w, h / 3, "#dd0000");
    drawRect(x, y + ((h / 3) * 2), w, h / 3, "#ffce00");
  } else if (flag === "bra") {
    drawRect(x, y, w, h, "#009b3a");
    ctx.fillStyle = "#ffdf00";
    ctx.beginPath();
    ctx.moveTo(x + (w * 0.5), y + (h * 0.12));
    ctx.lineTo(x + (w * 0.86), y + (h * 0.5));
    ctx.lineTo(x + (w * 0.5), y + (h * 0.88));
    ctx.lineTo(x + (w * 0.14), y + (h * 0.5));
    ctx.closePath();
    ctx.fill();
    drawCircle(x + (w * 0.5), y + (h * 0.5), h * 0.2, "#002776");
  } else if (flag === "arg") {
    drawRect(x, y, w, h / 3, "#74acdf");
    drawRect(x, y + (h / 3), w, h / 3, "#ffffff");
    drawRect(x, y + ((h / 3) * 2), w, h / 3, "#74acdf");
    drawCircle(x + (w * 0.5), y + (h * 0.5), h * 0.12, "#f6b40e");
  } else if (flag === "tha") {
    drawRect(x, y, w, h * 0.18, "#da291c");
    drawRect(x, y + (h * 0.18), w, h * 0.16, "#ffffff");
    drawRect(x, y + (h * 0.34), w, h * 0.32, "#2d2a4a");
    drawRect(x, y + (h * 0.66), w, h * 0.16, "#ffffff");
    drawRect(x, y + (h * 0.82), w, h * 0.18, "#da291c");
  } else if (flag === "can") {
    drawRect(x, y, w * 0.25, h, "#d52b1e");
    drawRect(x + (w * 0.25), y, w * 0.5, h, "#ffffff");
    drawRect(x + (w * 0.75), y, w * 0.25, h, "#d52b1e");
    drawCircle(x + (w * 0.5), y + (h * 0.5), h * 0.14, "#d52b1e");
  } else if (flag === "mex") {
    drawRect(x, y, w / 3, h, "#006847");
    drawRect(x + (w / 3), y, w / 3, h, "#ffffff");
    drawRect(x + ((w / 3) * 2), y, w / 3, h, "#ce1126");
    drawCircle(x + (w * 0.5), y + (h * 0.5), h * 0.08, "#9c7a3c");
  } else if (flag === "fin") {
    drawRect(x, y, w, h, "#ffffff");
    drawRect(x + (w * 0.28), y, w * 0.16, h, "#003580");
    drawRect(x, y + (h * 0.38), w, h * 0.22, "#003580");
  } else {
    drawRect(x, y, w, h, "#ffffff");
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function roundCost(value) {
  return Math.ceil(value / 5) * 5;
}

function hashSeed(input) {
  let hash = 2166136261;
  const text = String(input || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let stateSeed = seed >>> 0;
  return () => {
    stateSeed = (stateSeed + 0x6D2B79F5) >>> 0;
    let t = Math.imul(stateSeed ^ (stateSeed >>> 15), 1 | stateSeed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatTime(ms) {
  if (!ms) return "--:--.---";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(3).padStart(6, "0");
  return `${minutes}:${seconds}`;
}

function formatDelta(ms) {
  if (!Number.isFinite(ms) || ms === 0) return "+0.000";
  return `${ms > 0 ? "+" : "-"}${Math.abs(ms / 1000).toFixed(3)}`;
}

function createDefaultUpgrades() {
  return Object.fromEntries(Object.keys(UPGRADE_CATALOG).map((key) => [key, 0]));
}

function defaultDriverId() {
  return DRIVER_CONFIGS[0].id;
}

function driverConfigById(id) {
  return DRIVER_CONFIGS.find((driver) => driver.id === id) || null;
}

function garageTabs() {
  return ["track", "driver", "setup", "garage"];
}

function isGarageTab(tab) {
  return garageTabs().includes(tab);
}

function gameModeKeys() {
  return Object.keys(GAME_MODES);
}

function isGameMode(mode) {
  return gameModeKeys().includes(mode);
}

function normalizeOpponentCount(value, mode = state?.gameMode || "single_race") {
  const max = Math.max(0, DRIVER_CONFIGS.length - 1);
  const min = mode === "versus" ? 1 : 0;
  return clamp(Number(value), min, max);
}

function sessionTypeKeys() {
  return Object.keys(SESSION_TYPES);
}

function isSessionType(type) {
  return sessionTypeKeys().includes(type);
}

function compoundKeys() {
  return Object.keys(TIRE_COMPOUNDS);
}

function isCompoundKey(key) {
  return compoundKeys().includes(key);
}

function defaultCompoundForWeather(weatherKey = "clear") {
  return weatherKey === "rain" ? "intermediate" : "soft";
}

function createEmptyWeekend() {
  return {
    qualifyingOrder: [],
    qualifyingTimes: {},
    bestSectors: [0, 0, 0],
    poleDriverId: "",
    poleTime: 0,
    status: "Sin clasificacion",
  };
}

function createEmptyChampionship() {
  return {
    active: false,
    roundIndex: 0,
    rounds: [],
    participantIds: [],
    standings: {},
    results: [],
    championId: "",
  };
}

function loadSave() {
  const defaults = {
    credits: 320,
    selectedTrack: 0,
    selectedWeather: "clear",
    selectedGameMode: "single_race",
    opponentCount: DRIVER_CONFIGS.length - 1,
    selectedSession: "race",
    selectedCompound: defaultCompoundForWeather("clear"),
    selectedDriverId: defaultDriverId(),
    upgrades: createDefaultUpgrades(),
    bestLaps: {},
    weekends: {},
    championship: createEmptyChampionship(),
    settings: normalizeSettings(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      credits: Number.isFinite(parsed.credits) ? parsed.credits : defaults.credits,
      selectedTrack: Number.isInteger(parsed.selectedTrack) ? parsed.selectedTrack : defaults.selectedTrack,
      selectedWeather: WEATHER[parsed.selectedWeather] ? parsed.selectedWeather : defaults.selectedWeather,
      selectedGameMode: isGameMode(parsed.selectedGameMode) ? parsed.selectedGameMode : defaults.selectedGameMode,
      opponentCount: normalizeOpponentCount(parsed.opponentCount, parsed.selectedGameMode),
      selectedSession: isSessionType(parsed.selectedSession) ? parsed.selectedSession : defaults.selectedSession,
      selectedCompound: isCompoundKey(parsed.selectedCompound) ? parsed.selectedCompound : defaultCompoundForWeather(parsed.selectedWeather),
      selectedDriverId: driverConfigById(parsed.selectedDriverId) ? parsed.selectedDriverId : defaults.selectedDriverId,
      upgrades: { ...defaults.upgrades, ...(parsed.upgrades || {}) },
      bestLaps: { ...(parsed.bestLaps || {}) },
      weekends: { ...(parsed.weekends || {}) },
      championship: {
        ...createEmptyChampionship(),
        ...(parsed.championship || {}),
        standings: { ...((parsed.championship || {}).standings || {}) },
        results: Array.isArray((parsed.championship || {}).results) ? [...parsed.championship.results] : [],
        rounds: Array.isArray((parsed.championship || {}).rounds) ? [...parsed.championship.rounds] : [],
        participantIds: Array.isArray((parsed.championship || {}).participantIds) ? [...parsed.championship.participantIds] : [],
      },
      settings: normalizeSettings(parsed.settings),
    };
  } catch (error) {
    return defaults;
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
  } catch (error) {
    return;
  }
}

function catmullClosed(points, detail) {
  const out = [];
  for (let i = 0; i < points.length; i += 1) {
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];
    for (let step = 0; step < detail; step += 1) {
      const t = step / detail;
      const tt = t * t;
      const ttt = tt * t;
      out.push({
        x: 0.5 * ((2 * p1.x) + ((-p0.x + p2.x) * t) + ((2 * p0.x - (5 * p1.x) + (4 * p2.x) - p3.x) * tt) + ((-p0.x + (3 * p1.x) - (3 * p2.x) + p3.x) * ttt)),
        y: 0.5 * ((2 * p1.y) + ((-p0.y + p2.y) * t) + ((2 * p0.y - (5 * p1.y) + (4 * p2.y) - p3.y) * tt) + ((-p0.y + (3 * p1.y) - (3 * p2.y) + p3.y) * ttt)),
      });
    }
  }
  return out;
}

function buildSvgTrack(config) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", config.svgPath);
  svgMeasureRoot.appendChild(path);

  const svgLength = path.getTotalLength();
  const sampleCount = clamp(Math.round((config.referenceTurns || 14) * 36), 420, 720);
  const rawPoints = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const point = path.getPointAtLength((index / sampleCount) * svgLength);
    rawPoints.push({ x: point.x, y: point.y });
  }
  svgMeasureRoot.removeChild(path);

  const minX = Math.min(...rawPoints.map((point) => point.x));
  const maxX = Math.max(...rawPoints.map((point) => point.x));
  const minY = Math.min(...rawPoints.map((point) => point.y));
  const maxY = Math.max(...rawPoints.map((point) => point.y));
  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const scale = targetTrackLength(config) / svgLength;
  const points = rawPoints.map((point) => ({
    x: (point.x - centerX) * scale,
    y: (point.y - centerY) * scale,
  }));
  const minPointX = Math.min(...points.map((point) => point.x));
  const maxPointX = Math.max(...points.map((point) => point.x));
  const minPointY = Math.min(...points.map((point) => point.y));
  const maxPointY = Math.max(...points.map((point) => point.y));

  const lengths = [0];
  let total = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
    lengths.push(total);
  }
  return {
    points,
    lengths,
    total,
    width: config.width * trackSpaceScale(config),
    bounds: {
      minX: minPointX,
      maxX: maxPointX,
      minY: minPointY,
      maxY: maxPointY,
    },
  };
}

function buildTrack(config) {
  if (config.svgPath) {
    return buildSvgTrack(config);
  }
  const scaledControlPoints = config.controlPoints.map((point) => ({
    x: point.x * trackScale(),
    y: point.y * trackScale(),
  }));
  const points = catmullClosed(scaledControlPoints, 18);
  const minPointX = Math.min(...points.map((point) => point.x));
  const maxPointX = Math.max(...points.map((point) => point.x));
  const minPointY = Math.min(...points.map((point) => point.y));
  const maxPointY = Math.max(...points.map((point) => point.y));
  const lengths = [0];
  let total = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
    lengths.push(total);
  }
  return {
    points,
    lengths,
    total,
    width: config.width * trackScale(),
    bounds: {
      minX: minPointX,
      maxX: maxPointX,
      minY: minPointY,
      maxY: maxPointY,
    },
  };
}

const state = {
  save: loadSave(),
  trackIndex: 0,
  weatherKey: "clear",
  gameMode: "single_race",
  sessionType: "race",
  trackConfig: null,
  track: null,
  totalLaps: 3,
  mode: "garage",
  last: performance.now(),
  countdown: 0,
  shake: 0,
  finishCount: 0,
  raceTime: 0,
  qualifyingClock: QUALIFYING_SESSION_SECONDS,
  ambient: 0,
  rewardPaid: false,
  draftBonus: 0,
  drsActive: false,
  trackFilter: "",
  garageTab: "track",
  weekend: createEmptyWeekend(),
  championship: createEmptyChampionship(),
  sectorFlash: { index: -1, ttl: 0, delta: 0 },
  lastCompletedSession: "",
  camera: { x: WIDTH / 2, y: HEIGHT / 2, zoom: DEFAULT_SETTINGS.cameraZoom },
  cars: [],
  pickups: [],
  hazards: [],
  trackside: null,
  message: { text: "", ttl: 0 },
};

state.trackIndex = clamp(state.save.selectedTrack, 0, TRACKS.length - 1);
state.weatherKey = WEATHER[state.save.selectedWeather] ? state.save.selectedWeather : "clear";
state.gameMode = isGameMode(state.save.selectedGameMode) ? state.save.selectedGameMode : "single_race";
state.sessionType = isSessionType(state.save.selectedSession) ? state.save.selectedSession : "race";
state.championship = {
  ...createEmptyChampionship(),
  ...(state.save.championship || {}),
  standings: { ...((state.save.championship || {}).standings || {}) },
  results: Array.isArray((state.save.championship || {}).results) ? [...state.save.championship.results] : [],
  rounds: Array.isArray((state.save.championship || {}).rounds) ? [...state.save.championship.rounds] : [],
  participantIds: Array.isArray((state.save.championship || {}).participantIds) ? [...state.save.championship.participantIds] : [],
};

function selectedDriverConfig() {
  return driverConfigById(state.save.selectedDriverId) || DRIVER_CONFIGS[0];
}

function selectedCompoundKey() {
  return isCompoundKey(state.save.selectedCompound) ? state.save.selectedCompound : defaultCompoundForWeather(state.weatherKey);
}

function compoundData(key) {
  return TIRE_COMPOUNDS[isCompoundKey(key) ? key : defaultCompoundForWeather(state.weatherKey)];
}

function getWeekendRecord(trackId = state.trackConfig?.id) {
  const saved = state.save.weekends?.[trackId];
  if (!saved) return createEmptyWeekend();
  return {
    ...createEmptyWeekend(),
    ...saved,
    qualifyingTimes: { ...(saved.qualifyingTimes || {}) },
    qualifyingOrder: Array.isArray(saved.qualifyingOrder) ? [...saved.qualifyingOrder] : [],
    bestSectors: Array.isArray(saved.bestSectors) ? [...saved.bestSectors] : [0, 0, 0],
  };
}

function setWeekendRecord(trackId, record) {
  state.save.weekends[trackId] = {
    ...createEmptyWeekend(),
    ...record,
    qualifyingTimes: { ...(record.qualifyingTimes || {}) },
    qualifyingOrder: Array.isArray(record.qualifyingOrder) ? [...record.qualifyingOrder] : [],
    bestSectors: Array.isArray(record.bestSectors) ? [...record.bestSectors] : [0, 0, 0],
  };
  state.weekend = getWeekendRecord(trackId);
}

function selectedOpponentCount() {
  if (state.gameMode === "championship" && state.championship.active && state.championship.participantIds.length) {
    return Math.max(0, state.championship.participantIds.length - 1);
  }
  return normalizeOpponentCount(state.save.opponentCount, state.gameMode);
}

function syncChampionshipSave() {
  state.save.championship = {
    ...createEmptyChampionship(),
    ...state.championship,
    standings: { ...(state.championship.standings || {}) },
    results: Array.isArray(state.championship.results) ? [...state.championship.results] : [],
    rounds: Array.isArray(state.championship.rounds) ? [...state.championship.rounds] : [],
    participantIds: Array.isArray(state.championship.participantIds) ? [...state.championship.participantIds] : [],
  };
}

function resetChampionship() {
  state.championship = createEmptyChampionship();
  syncChampionshipSave();
}

function rewardFieldFactor(fieldSize = state.cars.length) {
  const fullField = Math.max(1, DRIVER_CONFIGS.length - 1);
  return clamp((Math.max(1, fieldSize) - 1) / fullField, 0.35, 1);
}

function championshipPointsForPlace(place) {
  return CHAMPIONSHIP_POINTS[place - 1] || 0;
}

function invalidateChampionship(reason) {
  if (!state.championship.active) return false;
  resetChampionship();
  if (reason) {
    setMessage(reason, 2.4);
  }
  return true;
}

function buildOpponentPool(count, seed = `${state.trackConfig?.id || state.trackIndex}-${state.save.selectedDriverId}`) {
  const selectedId = state.save.selectedDriverId;
  const others = DRIVER_CONFIGS
    .filter((driver) => driver.id !== selectedId)
    .map((driver) => ({
      driver,
      score: hashSeed(`${seed}-${driver.id}`),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((entry) => entry.driver.id);
  return [selectedId, ...others];
}

function activeParticipantIds() {
  if (state.gameMode === "championship" && state.championship.active && state.championship.participantIds.length) {
    return [...state.championship.participantIds];
  }
  const count = selectedOpponentCount();
  if (state.gameMode === "versus") {
    return buildOpponentPool(Math.max(1, count), `vs-${state.trackIndex}`);
  }
  if (state.gameMode === "training") {
    return buildOpponentPool(count, `training-${state.trackIndex}`);
  }
  return buildOpponentPool(count, `single-${state.trackIndex}`);
}

function activeEntrantCount() {
  return activeParticipantIds().length;
}

function championshipRoundTrackId(index = state.championship.roundIndex) {
  const trackId = state.championship.rounds[index];
  return trackId || TRACKS[state.trackIndex]?.id;
}

function championshipStandingsSorted() {
  const points = state.championship.standings || {};
  return Object.entries(points)
    .map(([id, score]) => ({ id, score, driver: driverConfigById(id) }))
    .filter((entry) => entry.driver)
    .sort((a, b) => b.score - a.score || a.driver.name.localeCompare(b.driver.name));
}

function championshipSummaryLine() {
  if (!state.championship.active) return "Sin campeonato activo.";
  const sorted = championshipStandingsSorted();
  const top = sorted.slice(0, 3).map((entry) => `${entry.driver.shortName} ${entry.score}`).join(" | ");
  if (state.championship.roundIndex >= state.championship.rounds.length) {
    const champion = driverConfigById(state.championship.championId || sorted[0]?.id);
    return `Temporada cerrada. Campeon: ${champion ? champion.name : "por definir"}. ${top || "Sin puntos"}.`;
  }
  return `Ronda ${state.championship.roundIndex + 1}/${state.championship.rounds.length}. ${top || "Sin puntos"}.`;
}

function ensureChampionshipInitialized() {
  if (state.gameMode !== "championship" || state.championship.active) return;
  const participantIds = buildOpponentPool(Math.max(3, selectedOpponentCount()), `championship-${state.trackIndex}`);
  const rounds = Array.from({ length: Math.min(CHAMPIONSHIP_ROUNDS, TRACKS.length) }, (_, index) => TRACKS[(state.trackIndex + index) % TRACKS.length].id);
  const standings = Object.fromEntries(participantIds.map((id) => [id, 0]));
  state.championship = {
    active: true,
    roundIndex: 0,
    rounds,
    participantIds,
    standings,
    results: [],
    championId: "",
  };
  syncChampionshipSave();
}

function syncTrackToChampionshipRound() {
  if (state.gameMode !== "championship" || !state.championship.active) return;
  if (state.championship.roundIndex >= state.championship.rounds.length) return;
  const targetTrackId = championshipRoundTrackId();
  const index = TRACKS.findIndex((track) => track.id === targetTrackId);
  if (index >= 0) {
    state.trackIndex = index;
  }
}

function advanceChampionshipAfterRace(abandoned) {
  if (state.gameMode !== "championship" || !state.championship.active) return null;
  const selectedId = state.save.selectedDriverId;
  const updatedStandings = { ...(state.championship.standings || {}) };
  const classification = standings().map((driver, index) => {
    const rawPoints = championshipPointsForPlace(index + 1);
    const points = abandoned && driver.id === selectedId ? 0 : rawPoints;
    updatedStandings[driver.id] = (updatedStandings[driver.id] || 0) + points;
    return {
      id: driver.id,
      place: index + 1,
      points,
    };
  });

  const playerResult = classification.find((entry) => entry.id === selectedId) || {
    id: selectedId,
    place: state.cars.length,
    points: 0,
  };
  const nextRoundIndex = state.championship.roundIndex + 1;
  const seasonComplete = nextRoundIndex >= state.championship.rounds.length;
  const finalStandings = Object.entries(updatedStandings)
    .map(([id, score]) => ({ id, score, driver: driverConfigById(id) }))
    .filter((entry) => entry.driver)
    .sort((a, b) => b.score - a.score || a.driver.name.localeCompare(b.driver.name));

  state.championship = {
    ...state.championship,
    roundIndex: nextRoundIndex,
    standings: updatedStandings,
    results: [
      ...state.championship.results,
      {
        round: state.championship.roundIndex + 1,
        trackId: state.trackConfig.id,
        place: playerResult.place,
        points: playerResult.points,
        abandoned,
        winnerId: classification[0]?.id || "",
      },
    ],
    championId: seasonComplete ? finalStandings[0]?.id || "" : "",
  };
  syncChampionshipSave();

  const nextTrackId = seasonComplete ? "" : championshipRoundTrackId(nextRoundIndex);
  const nextTrack = TRACKS.find((track) => track.id === nextTrackId);
  return {
    playerPlace: playerResult.place,
    playerPoints: playerResult.points,
    seasonComplete,
    nextTrackName: nextTrack?.name || "",
    champion: driverConfigById(state.championship.championId),
  };
}

function gridSlot(index) {
  const row = Math.floor(index / 2);
  const side = index % 2 === 0 ? -1 : 1;
  if (usesRealTrackGeometry()) {
    return {
      start: -((row * 11.5) + (side > 0 ? 4 : 0)),
      lane: side * (4.2 + ((row % 3) * 0.5)),
    };
  }
  return {
    start: -((row * 56) + (side > 0 ? 18 : 0)),
    lane: side * (24 + ((row % 3) * 4)),
  };
}

function currentWeather() {
  return WEATHER[state.weatherKey];
}

function pointAt(distance, line = state.track) {
  let d = distance % line.total;
  if (d < 0) d += line.total;
  let index = 0;
  while (index < line.lengths.length - 1 && line.lengths[index + 1] < d) {
    index += 1;
  }
  const a = line.points[index % line.points.length];
  const b = line.points[(index + 1) % line.points.length];
  const start = line.lengths[index];
  const end = line.lengths[index + 1];
  const t = (d - start) / Math.max(1, end - start);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    angle,
    nx: -Math.sin(angle),
    ny: Math.cos(angle),
  };
}

function buildOffsetPolyline(startRatio, endRatio, side, baseOffset, samples = 24, taper = 0) {
  const points = [];
  for (let step = 0; step <= samples; step += 1) {
    const t = step / samples;
    const ratio = lerp(startRatio, endRatio, t);
    const anchor = pointAt(ratio * state.track.total);
    const offset = baseOffset + (taper * t);
    points.push({
      x: anchor.x + (anchor.nx * side * offset),
      y: anchor.y + (anchor.ny * side * offset),
      angle: anchor.angle,
      nx: anchor.nx,
      ny: anchor.ny,
    });
  }
  return points;
}

function measureOpenLine(points) {
  const lengths = [0];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    total += Math.hypot(b.x - a.x, b.y - a.y);
    lengths.push(total);
  }
  return { points, lengths, total };
}

function pointAlongLine(line, distance) {
  const d = clamp(distance, 0, line.total);
  let index = 0;
  while (index < line.lengths.length - 1 && line.lengths[index + 1] < d) {
    index += 1;
  }
  const a = line.points[index];
  const b = line.points[Math.min(index + 1, line.points.length - 1)];
  const start = line.lengths[index];
  const end = line.lengths[Math.min(index + 1, line.lengths.length - 1)];
  const t = (d - start) / Math.max(1, end - start);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    angle,
    nx: -Math.sin(angle),
    ny: Math.cos(angle),
  };
}

function project(x, y, line = state.track) {
  let best = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < line.points.length; i += 1) {
    const a = line.points[i];
    const b = line.points[(i + 1) % line.points.length];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lenSq = (abx * abx) + (aby * aby);
    const t = clamp((((x - a.x) * abx) + ((y - a.y) * aby)) / lenSq, 0, 1);
    const px = a.x + (abx * t);
    const py = a.y + (aby * t);
    const dx = x - px;
    const dy = y - py;
    const distSq = (dx * dx) + (dy * dy);
    if (distSq < bestDist) {
      bestDist = distSq;
      best = {
        x: px,
        y: py,
        dist: Math.sqrt(distSq),
        progress: line.lengths[i] + (Math.sqrt(lenSq) * t),
        angle: Math.atan2(aby, abx),
      };
    }
  }
  return best;
}

function buildTracksideDecor() {
  const profile = trackSceneProfile(state.trackConfig);
  const scale = trackSpaceScale();
  const rng = createRng(hashSeed(state.trackConfig.id));
  const sponsorTags = ["APEX", "DRS", "GRID", "ERS", "RACE", "POLE"];
  const boards = [];
  const props = [];
  const pointsCount = state.track.points.length;
  const stride = clamp(Math.round(pointsCount / 22), 16, 30);
  const curbZones = [];
  const runoffZones = [];

  const pushZone = (collection, startIndex, endIndex, payload) => {
    if (startIndex < 0) startIndex += pointsCount;
    if (endIndex < 0) endIndex += pointsCount;
    if (startIndex <= endIndex) {
      collection.push({
        ...payload,
        startRatio: startIndex / pointsCount,
        endRatio: endIndex / pointsCount,
      });
      return;
    }
    collection.push({
      ...payload,
      startRatio: startIndex / pointsCount,
      endRatio: 1,
    });
    collection.push({
      ...payload,
      startRatio: 0,
      endRatio: endIndex / pointsCount,
    });
  };

  for (let index = Math.floor(stride * 0.5); index < pointsCount; index += stride) {
    const point = state.track.points[index];
    const next = state.track.points[(index + 4) % pointsCount];
    const angle = Math.atan2(next.y - point.y, next.x - point.x);
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const side = rng() > 0.48 ? 1 : -1;
    const nearRoad = state.track.width * (profile.kind === "street" ? 0.95 : 1.18);
    const outerOffset = nearRoad + ((10 + (rng() * 18)) * scale);
    const x = point.x + (nx * side * outerOffset);
    const y = point.y + (ny * side * outerOffset);
    const width = (28 + (rng() * 16)) * scale;
    const height = (7 + (rng() * 3)) * scale;
    boards.push({
      x,
      y,
      angle: angle + (side < 0 ? Math.PI : 0),
      width,
      height,
      color: profile.sponsorPalette[Math.floor(rng() * profile.sponsorPalette.length)],
      text: sponsorTags[Math.floor(rng() * sponsorTags.length)],
    });

    const propDistance = outerOffset + ((14 + (rng() * 20)) * scale);
    props.push({
      type: profile.propKind,
      x: point.x + (nx * side * propDistance),
      y: point.y + (ny * side * propDistance),
      angle,
      scale: 0.8 + (rng() * 0.5),
      color: profile.buildingColor,
      accent: profile.supportColor,
    });
  }

  let lastZoneIndex = -999;
  const zoneStride = clamp(Math.round(pointsCount / 80), 4, 9);
  const zoneGap = clamp(Math.round(pointsCount / 14), 18, 40);
  for (let index = 0; index < pointsCount; index += zoneStride) {
    const prev = state.track.points[(index - 8 + pointsCount) % pointsCount];
    const current = state.track.points[index];
    const next = state.track.points[(index + 8) % pointsCount];
    const angleA = Math.atan2(current.y - prev.y, current.x - prev.x);
    const angleB = Math.atan2(next.y - current.y, next.x - current.x);
    const turn = wrapAngle(angleB - angleA);
    const intensity = Math.abs(turn);
    if (intensity < 0.14 || index - lastZoneIndex < zoneGap) continue;

    const side = turn > 0 ? 1 : -1;
    const zoneLength = clamp(Math.round((10 + (intensity * 22)) * (usesRealTrackGeometry() ? 1 : 0.82)), 10, 24);
    pushZone(curbZones, index - zoneLength, index + zoneLength, {
      side,
      intensity: clamp(intensity / 0.42, 0.45, 1.2),
    });
    pushZone(runoffZones, index - Math.round(zoneLength * 1.2), index + Math.round(zoneLength * 1.3), {
      side,
      extra: (14 + (intensity * 32)) * scale * (profile.kind === "street" ? 0.5 : 1),
      color: intensity > 0.24 ? profile.runoffColor : "rgba(255,255,255,0.04)",
    });
    lastZoneIndex = index;
  }

  const pitSide = rng() > 0.5 ? 1 : -1;
  const pitStart = usesRealTrackGeometry(state.trackConfig) ? 0.014 : 0.02;
  const pitEnd = usesRealTrackGeometry(state.trackConfig) ? 0.105 : 0.135;
  const pitLanePoints = buildOffsetPolyline(pitStart, pitEnd, pitSide, state.track.width * 0.88, 26, state.track.width * 0.16);
  const pitDivider = buildOffsetPolyline(pitStart, pitEnd, pitSide, state.track.width * 0.64, 26, state.track.width * 0.1);
  const pitLane = measureOpenLine(pitLanePoints);
  const pitBuildings = pitLane.points
    .filter((_, index) => index % 4 === 1)
    .map((point, index) => ({
      x: point.x + (point.nx * pitSide * (state.track.width * 0.4 + (16 * scale))),
      y: point.y + (point.ny * pitSide * (state.track.width * 0.4 + (16 * scale))),
      angle: point.angle,
      width: (24 + ((index % 3) * 6)) * scale,
      depth: (12 + ((index % 2) * 4)) * scale,
    }));

  return {
    profile,
    boards,
    props,
    pitLane,
    pitDivider,
    pitBuildings,
    pitSide,
    pitStartRatio: pitStart,
    pitEndRatio: pitEnd,
    pitServiceDistance: pitLane.total * 0.5,
    pitReleaseDistance: pitLane.total * 0.62,
    pitTrackStart: pitStart * state.track.total,
    pitTrackEnd: pitEnd * state.track.total,
    curbZones,
    runoffZones,
  };
}

function player() {
  return state.cars[0];
}

function rivals() {
  return state.cars.slice(1);
}

function garageLocked() {
  return state.mode === "countdown" || state.mode === "racing";
}

function standings() {
  if (state.sessionType === "qualifying" && raceViewActive()) {
    return [...state.cars].sort((a, b) => {
      if (a.bestLapMs && b.bestLapMs) return a.bestLapMs - b.bestLapMs;
      if (a.bestLapMs) return -1;
      if (b.bestLapMs) return 1;
      return b.totalProgress - a.totalProgress;
    });
  }
  return [...state.cars].sort((a, b) => {
    if (a.finished && b.finished) return a.finishOrder - b.finishOrder;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.totalProgress - a.totalProgress;
  });
}

function raceViewActive() {
  return state.mode === "countdown" || state.mode === "racing";
}

function recordSector(driver, sectorIndex, elapsedMs) {
  driver.lastSectorTimes[sectorIndex] = elapsedMs;
  const currentBest = state.weekend.bestSectors[sectorIndex] || 0;
  if (!currentBest || elapsedMs < currentBest) {
    state.weekend.bestSectors[sectorIndex] = elapsedMs;
  }
  if (driver.player) {
    const reference = currentBest || elapsedMs;
    state.sectorFlash = {
      index: sectorIndex,
      ttl: 2.2,
      delta: elapsedMs - reference,
    };
  }
}

function syncShellMode() {
  shell.classList.toggle("race-mode", raceViewActive());
}

function setOverlay(title, text, visible) {
  hud.overlayTitle.textContent = title;
  hud.overlayText.textContent = text;
  hud.overlay.classList.toggle("visible", visible);
}

function setMessage(text, ttl = 2.5) {
  state.message.text = text;
  state.message.ttl = ttl;
  hud.message.textContent = text;
}

function defaultMessage() {
  const selected = selectedDriverConfig();
  if (state.mode === "racing") {
    if (state.sessionType === "qualifying") {
      return `Qualy en marcha. Tiempo restante ${Math.max(0, Math.ceil(state.qualifyingClock))} s.`;
    }
    if (state.drsActive) return "DRS activo. Aprovecha la recta principal.";
    if (player().magnetTimer > 0) return "Iman activo. Recoge recursos sin romper la trazada.";
    if (currentWeather().rain) return "Pista humeda. Frena antes y usa mas apoyo aerodinamico.";
    return `Clima ${currentWeather().label}. Energia ${(Math.round(player().energy))}/${player().maxEnergy}.`;
  }
  if (state.mode === "finished") {
    if (state.gameMode === "championship" && state.championship.active && state.championship.roundIndex >= state.championship.rounds.length) {
      return "Temporada cerrada. Revisa la tabla y arranca un campeonato nuevo.";
    }
    return "Reclama la recompensa, reajusta el coche y prepara otra salida.";
  }
  const mode = GAME_MODES[state.gameMode];
  const sessionText = state.gameMode === "training" ? "entreno" : SESSION_TYPES[state.sessionType].label.toLowerCase();
  return `${selected.name} listo en el garaje. Configura ${mode.label.toLowerCase()}, ${sessionText}, neumaticos y upgrades antes de largar.`;
}

function countdownLabel() {
  if (state.countdown > 2) return "3";
  if (state.countdown > 1) return "2";
  if (state.countdown > 0.35) return "1";
  return "GO";
}

function upgradeCost(key) {
  const level = state.save.upgrades[key];
  return roundCost(UPGRADE_CATALOG[key].baseCost * (1 + (level * 0.62)));
}

function trackReferenceSummary(track = state.trackConfig) {
  const length = Number(track.referenceLengthKm).toFixed(3);
  const source = track.layoutId ? ` Layout ${track.layoutId} importado desde SVG.` : "";
  return `Inspirado en ${track.inspiredBy}. Ref ${length} km | ${track.referenceTurns} curvas.${source} ${track.signature}`;
}

function trackSceneProfile(track = state.trackConfig) {
  const id = String(track.circuitId || track.id || "").toLowerCase();
  const label = `${track.name || ""} ${track.inspiredBy || ""}`.toLowerCase();
  const hasToken = (tokens) => tokens.some((token) => id.includes(token) || label.includes(token));

  if (hasToken(["monaco", "baku", "singapore", "las-vegas", "jeddah", "miami", "madring"])) {
    return {
      kind: "street",
      runoffColor: "rgba(164, 171, 182, 0.82)",
      shoulderColor: "rgba(118, 124, 134, 0.94)",
      barrierColor: "#eef3fb",
      fenceColor: "rgba(220,228,236,0.55)",
      buildingColor: "#c8d0da",
      supportColor: "#8c98a5",
      propKind: "light",
      sponsorPalette: ["#ff6b35", "#11d7ff", "#f5f7fb", "#ffd166"],
    };
  }

  if (hasToken(["bahrain", "lusail", "yas-marina"])) {
    return {
      kind: "desert",
      runoffColor: "rgba(161, 126, 78, 0.9)",
      shoulderColor: "rgba(96, 84, 63, 0.96)",
      barrierColor: "#f7e7be",
      fenceColor: "rgba(241,225,190,0.46)",
      buildingColor: "#d7c3a2",
      supportColor: "#907b5d",
      propKind: "tower",
      sponsorPalette: ["#ffb35c", "#f5f7fb", "#1d2530", "#ffd166"],
    };
  }

  if (hasToken(["suzuka", "spa", "spielberg", "interlagos", "monza", "zandvoort", "hungaroring", "silverstone", "catalunya"])) {
    return {
      kind: "park",
      runoffColor: "rgba(170, 150, 97, 0.8)",
      shoulderColor: "rgba(88, 94, 100, 0.94)",
      barrierColor: "#eceff4",
      fenceColor: "rgba(207,216,224,0.4)",
      buildingColor: "#d6dadf",
      supportColor: "#7a848d",
      propKind: "tree",
      sponsorPalette: ["#ff6b35", "#11d7ff", "#9cf06b", "#f5f7fb"],
    };
  }

  return {
    kind: "classic",
    runoffColor: "rgba(151, 141, 118, 0.78)",
    shoulderColor: "rgba(84, 90, 97, 0.95)",
    barrierColor: "#ecf0f6",
    fenceColor: "rgba(210,218,226,0.36)",
    buildingColor: "#cfd6de",
    supportColor: "#79838d",
    propKind: "tent",
    sponsorPalette: ["#ff6b35", "#11d7ff", "#f5f7fb", "#ffd166"],
  };
}

function trackSearchValue() {
  return state.trackFilter.trim().toLowerCase();
}

function trackMatchesFilter(track) {
  const query = trackSearchValue();
  if (!query) return true;
  return [
    track.name,
    track.inspiredBy,
    track.layoutId,
    track.circuitId,
    track.signature,
  ].some((value) => String(value || "").toLowerCase().includes(query));
}

function trackSummaryPills(track = state.trackConfig) {
  return [
    `${track.referenceLengthKm.toFixed(3)} km`,
    `${track.referenceTurns} curvas`,
    `${track.drsZones.length} DRS`,
    track.layoutId,
  ];
}

function nextPitCompoundKey(currentKey, weatherKey = state.weatherKey) {
  if (weatherKey === "rain") {
    if (currentKey === "wet") return "intermediate";
    return "wet";
  }
  if (currentKey === "soft") return "medium";
  if (currentKey === "medium") return "hard";
  if (currentKey === "intermediate" || currentKey === "wet") return "medium";
  return "hard";
}

function compoundGripFactor(driver) {
  const tire = compoundData(driver.compound);
  const wearFactor = clamp(driver.tireWear / 100, 0.4, 1);
  const wearGrip = 0.8 + (wearFactor * 0.2);
  const wetFactor = state.weatherKey === "rain" ? tire.wet : 1;
  return tire.grip * wearGrip * wetFactor;
}

function compoundSpeedFactor(driver) {
  const tire = compoundData(driver.compound);
  const wearFactor = clamp(driver.tireWear / 100, 0.45, 1);
  const wearSpeed = 0.9 + (wearFactor * 0.1);
  const wetFactor = state.weatherKey === "rain" ? lerp(0.9, 1.03, tire.wet / 1.18) : 1;
  return tire.speed * wearSpeed * wetFactor;
}

function compoundBrakeFactor(driver) {
  const tire = compoundData(driver.compound);
  const wearFactor = clamp(driver.tireWear / 100, 0.4, 1);
  return tire.brake * (0.82 + (wearFactor * 0.18));
}

function pitSpeedLimit() {
  return (85 / 3.6) * trackSpaceScale();
}

function playerTuning(config) {
  const upgrades = state.save.upgrades;
  const wetBonus = state.weatherKey === "rain" ? upgrades.tires * 0.012 : 0;
  return {
    ...config,
    max: config.max + (upgrades.engine * 12),
    accel: config.accel + (upgrades.engine * 10) + (upgrades.battery * 2) + (upgrades.ers * 3),
    brake: config.brake + (upgrades.aero * 2) + (upgrades.brakes * 12),
    steer: config.steer + (upgrades.aero * 0.05) + (upgrades.brakes * 0.018),
    grip: (config.grip || 0.92) + (upgrades.aero * 0.045) + (upgrades.tires * 0.024) + wetBonus,
    maxIntegrity: 100 + (upgrades.armor * 14),
    damageReduction: upgrades.armor * 0.08,
    maxEnergy: 100 + (upgrades.battery * 18) + (upgrades.ers * 14),
    energyRegen: 10 + (upgrades.battery * 1.8) + (upgrades.ers * 2.4),
    boostCapacity: 1.6 + (upgrades.engine * 0.1) + (upgrades.ers * 0.08),
    shieldCapacity: 3.4 + (upgrades.armor * 0.18),
    magnetRange: 28 + (upgrades.magnet * 18),
    magnetCapacity: 3.2 + (upgrades.magnet * 0.55),
    repairAmount: 18 + (upgrades.armor * 5),
    wetGripBonus: upgrades.tires * 0.024,
    offTrackGrip: 1 + (upgrades.tires * 0.06) + (upgrades.suspension * 0.1),
    offTrackDamageScale: clamp(1 - (upgrades.suspension * 0.08), 0.56, 1),
    stability: 1 + (upgrades.brakes * 0.05) + (upgrades.suspension * 0.08),
    energyCostScale: clamp(1 - (upgrades.ers * 0.05), 0.72, 1),
    draftEfficiency: 1 + (upgrades.drs * 0.09),
    drsPower: 1 + (upgrades.drs * 0.14),
    player: true,
  };
}

function createCar(config) {
  const startDistance = config.start * trackSpaceScale();
  const startPoint = pointAt(startDistance);
  const wrappedStart = ((startDistance % state.track.total) + state.track.total) % state.track.total;
  const progressOffset = startDistance < 0 ? -state.track.total : 0;
  const compound = isCompoundKey(config.compound) ? config.compound : defaultCompoundForWeather(state.weatherKey);
  return {
    name: config.name,
    shortName: config.shortName || config.name,
    team: config.team || "",
    country: config.country || "",
    flag: config.flag || "",
    number: config.number || "",
    id: config.id || "",
    color: config.color,
    accent: config.accent,
    x: startPoint.x + (startPoint.nx * config.lane * trackSpaceScale()),
    y: startPoint.y + (startPoint.ny * config.lane * trackSpaceScale()),
    angle: startPoint.angle,
    speed: 0,
    accel: config.accel * physicsScale(),
    brake: config.brake * physicsScale(),
    steer: config.steer,
    baseMax: config.max * physicsScale(),
    grip: config.grip || 0.92,
    maxIntegrity: config.maxIntegrity || 100,
    integrity: config.maxIntegrity || 100,
    damageReduction: config.damageReduction || 0,
    maxEnergy: config.maxEnergy || 0,
    energy: config.maxEnergy || 0,
    energyRegen: config.energyRegen || 0,
    boostCapacity: config.boostCapacity || 1.8,
    shieldCapacity: config.shieldCapacity || 3.4,
    magnetRange: (config.magnetRange || 0) * vehicleScale(),
    magnetCapacity: config.magnetCapacity || 0,
    repairAmount: config.repairAmount || 0,
    wetGripBonus: config.wetGripBonus || 0,
    offTrackGrip: config.offTrackGrip || 1,
    offTrackDamageScale: config.offTrackDamageScale || 1,
    stability: config.stability || 1,
    energyCostScale: config.energyCostScale || 1,
    draftEfficiency: config.draftEfficiency || 1,
    drsPower: config.drsPower || 1,
    compound,
    plannedCompound: config.plannedCompound || nextPitCompoundKey(compound, state.weatherKey),
    tireWear: 100,
    tireAge: 0,
    boostTimer: 0,
    shieldTimer: 0,
    magnetTimer: 0,
    controlLock: 0,
    edgeRecover: 0,
    lap: 0,
    minLap: 0,
    progressOffset,
    trackProgress: wrappedStart,
    totalProgress: progressOffset + wrappedStart,
    finished: false,
    finishOrder: 0,
    player: Boolean(config.player),
    lookAhead: (config.lookAhead || 115) * trackSpaceScale(),
    risk: config.risk || 0.5,
    lastLapMs: 0,
    bestLapMs: config.player ? (state.save.bestLaps[state.trackConfig.id] || 0) : 0,
    lapAnchor: 0,
    pickupsCollected: 0,
    sectorIndex: 0,
    sectorAnchor: 0,
    lastSectorTimes: [0, 0, 0],
    pitRequested: false,
    pitCommitted: false,
    inPitLane: false,
    pitProgress: 0,
    pitStopTimer: 0,
    pitState: "track",
    pitServiceDone: false,
  };
}

function seededCompoundForIndex(index) {
  if (state.weatherKey === "rain") {
    return index % 3 === 0 ? "wet" : "intermediate";
  }
  return ["soft", "medium", "hard"][index % 3];
}

function seededGridOrder() {
  const activeIds = new Set(activeParticipantIds());
  if (state.sessionType === "race") {
    const filteredQualy = state.weekend.qualifyingOrder
      .map((id) => driverConfigById(id))
      .filter((driver) => driver && activeIds.has(driver.id));
    if (filteredQualy.length === activeIds.size) {
      return filteredQualy;
    }
  }
  return DRIVER_CONFIGS.filter((driver) => activeIds.has(driver.id));
}

function createRoster() {
  const selected = selectedDriverConfig();
  const seededGrid = seededGridOrder().map((entry, index) => ({
    ...entry,
    ...gridSlot(index),
    compound: entry.id === selected.id ? selectedCompoundKey() : seededCompoundForIndex(index),
    plannedCompound: nextPitCompoundKey(entry.id === selected.id ? selectedCompoundKey() : seededCompoundForIndex(index), state.weatherKey),
  }));
  const me = seededGrid.find((entry) => entry.id === selected.id) || seededGrid[0];
  return [
    createCar(playerTuning(me)),
    ...seededGrid
      .filter((entry) => entry.id !== me.id)
      .map((entry) => createCar(entry)),
  ];
}

function createPickups() {
  return state.trackConfig.pickupPlan.map((item) => ({
    type: item.type,
    lane: item.lane * trackSpaceScale(),
    distance: item.ratio * state.track.total,
    active: true,
    respawn: 0,
    pulse: Math.random() * Math.PI * 2,
  }));
}

function createHazards() {
  return state.trackConfig.hazardPlan.map((item) => ({
    type: item.type,
    lane: item.lane * trackSpaceScale(),
    distance: item.ratio * state.track.total,
    active: true,
    respawn: 0,
    pulse: Math.random() * Math.PI * 2,
  }));
}

function showGarageOverlay() {
  const reward = currentWeather().reward.toFixed(2);
  const selected = selectedDriverConfig();
  const session = SESSION_TYPES[state.sessionType];
  const tire = compoundData(selectedCompoundKey());
  const mode = GAME_MODES[state.gameMode];
  const championshipLine = state.gameMode === "championship" ? ` ${championshipSummaryLine()}` : "";
  const rewardLine = state.gameMode === "training" ? "Sin creditos." : `Recompensa x${reward}.`;
  setOverlay(
    state.trackConfig.name,
    `${selected.name} | ${selected.team}. ${mode.label} ${state.gameMode === "training" ? "" : `${session.label} `}con ${tire.label}. ${activeEntrantCount()} entrantes. ${state.trackConfig.description} ${trackReferenceSummary()} Clima ${currentWeather().label}. ${rewardLine}${championshipLine}`,
    true,
  );
}

function totalUpgradeLevels() {
  return Object.values(state.save.upgrades).reduce((sum, level) => sum + level, 0);
}

function maxUpgradeLevels() {
  return Object.values(UPGRADE_CATALOG).reduce((sum, info) => sum + info.maxLevel, 0);
}

function refreshGarageNavigation() {
  if (hudPanel) {
    hudPanel.dataset.garageTab = state.garageTab;
  }

  ui.garageTabs.querySelectorAll("[data-garage-tab]").forEach((button) => {
    const active = button.dataset.garageTab === state.garageTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  ui.sessionChips.forEach((button) => {
    button.classList.toggle("active", button.dataset.garageTab === state.garageTab);
  });

  ui.menuPanels.forEach((panel) => {
    panel.hidden = panel.dataset.menuPanel !== state.garageTab;
  });
}

function refreshSessionSummary() {
  const driver = selectedDriverConfig();
  const track = state.trackConfig;
  const settings = state.save.settings;
  const unlockedSystems = Object.values(state.save.upgrades).filter((level) => level > 0).length;
  const compound = compoundData(selectedCompoundKey());
  const session = SESSION_TYPES[state.sessionType];
  const mode = GAME_MODES[state.gameMode];
  const activeIds = new Set(activeParticipantIds());
  const filteredQualyOrder = state.weekend.qualifyingOrder.filter((id) => activeIds.has(id));
  const gridIndex = filteredQualyOrder.findIndex((id) => id === driver.id);

  ui.sessionDriverValue.textContent = driver.name;
  ui.sessionDriverMeta.textContent = `${driver.team} | #${driver.number} | ${driver.country}`;

  ui.sessionTrackValue.textContent = `${track.name} | ${currentWeather().label}`;
  ui.sessionTrackMeta.textContent = `${track.referenceLengthKm.toFixed(3)} km | ${track.referenceTurns} curvas | ${activeEntrantCount()} coches`;

  ui.sessionSetupValue.textContent = `${mode.label} | ${state.gameMode === "training" ? compound.label : `${session.label} | ${compound.label}`}`;
  ui.sessionSetupMeta.textContent = `${settings.trackScale.toFixed(0)}x mundo | ${formatCameraZoomValue(settings.cameraZoom, track)} zoom | ${state.gameMode === "championship" && state.championship.active ? `R${Math.min(state.championship.roundIndex + 1, state.championship.rounds.length)}` : "Evento"} | Parrilla ${gridIndex >= 0 ? `P${gridIndex + 1}` : "base"}`;

  ui.sessionGarageValue.textContent = `${totalUpgradeLevels()} / ${maxUpgradeLevels()} niveles`;
  ui.sessionGarageMeta.textContent = `${state.save.credits} cr | ${unlockedSystems} sistemas mejorados | ${selectedOpponentCount()} rivales`;
}

function setGarageTab(tab) {
  if (!isGarageTab(tab) || state.garageTab === tab) return;
  state.garageTab = tab;
  refreshGarageNavigation();
}

function refreshDriverSelector() {
  const locked = garageLocked();
  ui.driverGrid.innerHTML = DRIVER_CONFIGS.map((driver) => `
    <button
      type="button"
      class="driver-chip${state.save.selectedDriverId === driver.id ? " active" : ""}"
      data-driver="${driver.id}"
      style="--driver-color:${driver.color};"
      ${locked ? "disabled" : ""}
    >
      <div class="driver-chip-head">
        <span class="driver-number">#${driver.number}</span>
        <span>${driver.shortName}</span>
      </div>
      <strong class="driver-name">${driver.name}</strong>
      <span class="driver-meta">${driver.team} | ${driver.country}</span>
    </button>
  `).join("");
}

function refreshWeatherButtons() {
  const locked = garageLocked();
  ui.weatherButtons.innerHTML = Object.entries(WEATHER).map(([key, info]) => `
    <button type="button" class="chip${state.weatherKey === key ? " active" : ""}" data-weather="${key}" ${locked ? "disabled" : ""}>
      ${info.label}
    </button>
  `).join("");
}

function refreshGameModeButtons() {
  const locked = garageLocked();
  ui.gameModeButtons.innerHTML = Object.entries(GAME_MODES).map(([key, info]) => `
    <button type="button" class="chip${state.gameMode === key ? " active" : ""}" data-game-mode="${key}" ${locked ? "disabled" : ""}>
      ${info.label}
    </button>
  `).join("");
}

function refreshSessionButtons() {
  const locked = garageLocked();
  const disabled = locked || state.gameMode === "training";
  ui.sessionTypeButtons.innerHTML = Object.entries(SESSION_TYPES).map(([key, info]) => `
    <button type="button" class="chip${state.sessionType === key ? " active" : ""}" data-session-type="${key}" ${disabled ? "disabled" : ""}>
      ${info.label}
    </button>
  `).join("");
}

function refreshCompoundButtons() {
  const locked = garageLocked();
  ui.compoundButtons.innerHTML = Object.entries(TIRE_COMPOUNDS).map(([key, tire]) => `
    <button type="button" class="chip${selectedCompoundKey() === key ? " active" : ""}" data-compound="${key}" ${locked ? "disabled" : ""} style="border-color:${selectedCompoundKey() === key ? tire.color : "rgba(255,255,255,0.08)"};">
      ${tire.label}
    </button>
  `).join("");
}

function refreshWeekendSummary() {
  const weekend = state.weekend;
  const activeIds = new Set(activeParticipantIds());
  const filteredQualyOrder = weekend.qualifyingOrder.filter((id) => activeIds.has(id));
  const poleDriver = driverConfigById(filteredQualyOrder[0] || weekend.poleDriverId);
  const poleLabel = poleDriver ? `${poleDriver.name} ${formatTime(weekend.poleTime)}` : "Sin pole registrada";
  const playerQualy = weekend.qualifyingTimes[state.save.selectedDriverId];
  const playerGridIndex = filteredQualyOrder.findIndex((id) => id === state.save.selectedDriverId);
  const gridText = playerGridIndex >= 0 ? `P${playerGridIndex + 1}` : "Sin tiempo";
  const sessionText = state.gameMode === "training"
    ? "Entrenamiento libre"
    : state.sessionType === "qualifying" ? `${GAME_MODES[state.gameMode].label} | Clasificacion` : `${GAME_MODES[state.gameMode].label} | Carrera`;
  const championshipText = state.gameMode === "championship" ? `<br>${championshipSummaryLine()}` : "";
  ui.weekendSummary.innerHTML = `
    <strong>Fin de semana</strong><br>
    ${sessionText}. Estado: ${weekend.status}.<br>
    Pole: ${poleLabel}.<br>
    Tu mejor qualy: ${formatTime(playerQualy)} | Parrilla actual: ${gridText}.<br>
    Entrantes activos: ${activeEntrantCount()}.${championshipText}
  `;
}

function refreshUpgradeButtons() {
  const locked = garageLocked();
  ui.upgradeGrid.innerHTML = Object.entries(UPGRADE_CATALOG).map(([key, info]) => {
    const level = state.save.upgrades[key];
    const cost = upgradeCost(key);
    const maxed = level >= info.maxLevel;
    const disabled = locked || maxed || state.save.credits < cost;
    return `
      <button type="button" class="upgrade-item${maxed ? " maxed" : ""}" data-upgrade="${key}" ${disabled ? "disabled" : ""}>
        <div class="upgrade-title">
          <span>${info.label}</span>
          <span>Nivel ${level}/${info.maxLevel}</span>
        </div>
        <div class="upgrade-desc">${info.description}</div>
        <div class="upgrade-meta">
          <span>${maxed ? "Maximo" : `${cost} creditos`}</span>
          <span>${locked ? "bloqueado" : "comprar"}</span>
        </div>
      </button>
    `;
  }).join("");
}

function refreshTrackSelector() {
  const locked = garageLocked();
  const filteredTracks = TRACKS.filter(trackMatchesFilter);
  ui.trackSearchInput.value = state.trackFilter;
  ui.trackStats.innerHTML = [
    ...trackSummaryPills(),
    `${filteredTracks.length}/${TRACKS.length} pistas`,
  ].map((item) => `<span class="track-pill">${item}</span>`).join("");

  if (filteredTracks.length === 0) {
    ui.trackGrid.innerHTML = '<div class="track-empty">No hay circuitos que coincidan con la busqueda.</div>';
    return;
  }

  ui.trackGrid.innerHTML = filteredTracks.map((track) => {
    const index = TRACKS.findIndex((entry) => entry.id === track.id);
    const active = index === state.trackIndex;
    return `
      <button
        type="button"
        class="track-chip${active ? " active" : ""}"
        data-track-index="${index}"
        ${locked ? "disabled" : ""}
      >
        <div class="track-chip-head">
          <span>${track.layoutId}</span>
          <span>${track.referenceLengthKm.toFixed(3)} km</span>
        </div>
        <strong class="track-chip-title">${track.name}</strong>
        <span class="track-chip-meta">${track.referenceTurns} curvas | ${track.drsZones.length} DRS | ${track.inspiredBy}</span>
      </button>
    `;
  }).join("");
}

function refreshButtons() {
  const locked = garageLocked();
  const championshipGridLocked = state.gameMode === "championship" && state.championship.active && state.championship.roundIndex < state.championship.rounds.length;
  ui.startRaceBtn.disabled = locked;
  ui.trackSearchInput.disabled = locked;
  ui.trackScaleInput.disabled = locked;
  ui.physicsScaleInput.disabled = locked;
  ui.cameraZoomInput.disabled = locked;
  ui.resetScaleBtn.disabled = locked;
  ui.opponentCountInput.disabled = locked || championshipGridLocked;
  if (state.mode === "finished") {
    if (state.lastCompletedSession === "qualifying") {
      ui.startRaceBtn.textContent = "Ir a carrera";
      return;
    }
    if (state.gameMode === "training") {
      ui.startRaceBtn.textContent = "Repetir entreno";
    } else if (state.gameMode === "championship" && state.championship.active) {
      ui.startRaceBtn.textContent = state.championship.roundIndex < state.championship.rounds.length ? "Siguiente ronda" : "Nuevo campeonato";
    } else if (state.gameMode === "versus") {
      ui.startRaceBtn.textContent = "Revancha VS";
    } else {
      ui.startRaceBtn.textContent = state.sessionType === "qualifying" ? "Repetir qualy" : "Correr otra vez";
    }
  } else {
    if (state.gameMode === "training") {
      ui.startRaceBtn.textContent = "Comenzar entreno";
    } else if (state.gameMode === "championship") {
      ui.startRaceBtn.textContent = state.championship.active ? "Continuar campeonato" : "Iniciar campeonato";
    } else if (state.gameMode === "versus") {
      ui.startRaceBtn.textContent = "Comenzar VS";
    } else {
      ui.startRaceBtn.textContent = state.sessionType === "qualifying" ? "Comenzar qualy" : "Comenzar carrera";
    }
  }
}

function refreshScaleUI() {
  const settings = state.save.settings;
  ui.trackScaleInput.value = `${settings.trackScale}`;
  ui.physicsScaleInput.value = `${settings.physicsScale}`;
  ui.cameraZoomInput.value = `${settings.cameraZoom}`;
  ui.opponentCountInput.min = state.gameMode === "versus" ? "1" : "0";
  ui.opponentCountInput.max = `${DRIVER_CONFIGS.length - 1}`;
  ui.opponentCountInput.value = `${selectedOpponentCount()}`;
  ui.opponentCountValue.textContent = `${selectedOpponentCount()} rivales`;
  ui.trackScaleValue.textContent = `${settings.trackScale.toFixed(0)}x`;
  ui.physicsScaleValue.textContent = formatPhysicsScaleValue(settings.physicsScale);
  ui.cameraZoomValue.textContent = formatCameraZoomValue(settings.cameraZoom);
}

function refreshSetupUI() {
  ui.trackName.textContent = state.trackConfig.name;
  ui.trackDescription.textContent = `${state.trackConfig.description} ${trackReferenceSummary()} DRS: ${state.trackConfig.drsZones.length} zonas. Clima actual: ${currentWeather().description}`;
  refreshTrackSelector();
  refreshDriverSelector();
  refreshWeatherButtons();
  refreshGameModeButtons();
  refreshSessionButtons();
  refreshCompoundButtons();
  refreshUpgradeButtons();
  refreshScaleUI();
  refreshWeekendSummary();
  refreshSessionSummary();
  refreshGarageNavigation();
  refreshButtons();
}

function configureEnvironment(resetCars) {
  state.gameMode = isGameMode(state.save.selectedGameMode) ? state.save.selectedGameMode : state.gameMode;
  state.save.opponentCount = normalizeOpponentCount(state.save.opponentCount, state.gameMode);
  if (state.gameMode === "championship" && state.championship.active) {
    syncTrackToChampionshipRound();
  }
  state.trackConfig = TRACKS[state.trackIndex];
  state.sessionType = state.gameMode === "training"
    ? "race"
    : (isSessionType(state.save.selectedSession) ? state.save.selectedSession : "race");
  state.weekend = getWeekendRecord(state.trackConfig.id);
  state.track = buildTrack(state.trackConfig);
  state.trackside = buildTracksideDecor();
  state.totalLaps = state.gameMode === "training" ? Math.max(6, state.trackConfig.laps + 2) : state.trackConfig.laps;
  state.pickups = createPickups();
  state.hazards = createHazards();
  if (resetCars) {
    state.cars = createRoster();
    state.cars.forEach((driver) => syncProgress(driver));
  }
  state.save.selectedTrack = state.trackIndex;
  state.save.selectedWeather = state.weatherKey;
  state.save.selectedGameMode = state.gameMode;
  state.save.selectedDriverId = selectedDriverConfig().id;
  saveProgress();
  refreshSetupUI();
  updateHud();
}

function changeTrack(direction) {
  if (garageLocked()) return;
  state.mode = "garage";
  state.trackIndex = (state.trackIndex + direction + TRACKS.length) % TRACKS.length;
  configureEnvironment(true);
  showGarageOverlay();
}

function selectTrack(index) {
  if (garageLocked()) return;
  const nextIndex = clamp(Number(index), 0, TRACKS.length - 1);
  if (!Number.isInteger(nextIndex) || nextIndex === state.trackIndex) return;
  state.mode = "garage";
  invalidateChampionship("Campeonato reiniciado por cambio de circuito base.");
  state.trackIndex = nextIndex;
  configureEnvironment(true);
  setMessage(`${state.trackConfig.name} seleccionado.`, 1.8);
  showGarageOverlay();
}

function selectGameMode(mode) {
  if (garageLocked() || !isGameMode(mode) || mode === state.gameMode) return;
  state.mode = "garage";
  state.gameMode = mode;
  state.save.selectedGameMode = mode;
  state.save.opponentCount = normalizeOpponentCount(state.save.opponentCount, mode);
  configureEnvironment(true);
  setMessage(`${GAME_MODES[mode].label} preparado.`, 1.8);
  showGarageOverlay();
}

function selectWeather(key) {
  if (garageLocked() || !WEATHER[key]) return;
  state.mode = "garage";
  state.weatherKey = key;
  if (!isCompoundKey(state.save.selectedCompound)) {
    state.save.selectedCompound = defaultCompoundForWeather(key);
  }
  configureEnvironment(true);
  showGarageOverlay();
}

function selectSessionType(type) {
  if (garageLocked() || !isSessionType(type)) return;
  state.mode = "garage";
  state.save.selectedSession = type;
  configureEnvironment(true);
  setMessage(`${SESSION_TYPES[type].label} seleccionada.`, 1.8);
  showGarageOverlay();
}

function selectCompound(key) {
  if (garageLocked() || !isCompoundKey(key)) return;
  state.mode = "garage";
  state.save.selectedCompound = key;
  configureEnvironment(true);
  setMessage(`Neumatico ${compoundData(key).label} preparado.`, 1.8);
  showGarageOverlay();
}

function selectDriver(id) {
  if (garageLocked() || !driverConfigById(id)) return;
  state.mode = "garage";
  invalidateChampionship("Campeonato reiniciado por cambio de piloto.");
  state.save.selectedDriverId = id;
  configureEnvironment(true);
  setMessage(`${selectedDriverConfig().name} seleccionado.`, 1.8);
  showGarageOverlay();
}

function selectOpponentCount(value) {
  if (garageLocked()) return;
  if (state.gameMode === "championship" && state.championship.active && state.championship.roundIndex < state.championship.rounds.length) {
    refreshScaleUI();
    setMessage("La parrilla del campeonato queda fija hasta cerrar la temporada.", 2.1);
    return;
  }
  const nextCount = normalizeOpponentCount(value, state.gameMode);
  if (nextCount === normalizeOpponentCount(state.save.opponentCount, state.gameMode)) {
    refreshScaleUI();
    return;
  }
  state.mode = "garage";
  invalidateChampionship("Campeonato reiniciado por cambio de parrilla.");
  state.save.opponentCount = nextCount;
  configureEnvironment(true);
  setMessage(`Parrilla ajustada a ${nextCount} rivales.`, 1.8);
  showGarageOverlay();
}

function buyUpgrade(key) {
  if (garageLocked() || !UPGRADE_CATALOG[key]) return;
  const level = state.save.upgrades[key];
  if (level >= UPGRADE_CATALOG[key].maxLevel) return;
  const cost = upgradeCost(key);
  if (state.save.credits < cost) {
    setMessage("No hay creditos suficientes para esa mejora.", 1.8);
    return;
  }
  state.mode = "garage";
  state.save.credits -= cost;
  state.save.upgrades[key] += 1;
  saveProgress();
  configureEnvironment(true);
  setMessage(`${UPGRADE_CATALOG[key].label} mejorado al nivel ${state.save.upgrades[key]}.`, 2.2);
  showGarageOverlay();
}

function updateScalePreview(name, value) {
  if (name === "trackScale") ui.trackScaleValue.textContent = `${Number(value).toFixed(0)}x`;
  if (name === "physicsScale") ui.physicsScaleValue.textContent = formatPhysicsScaleValue(Number(value));
  if (name === "cameraZoom") ui.cameraZoomValue.textContent = formatCameraZoomValue(Number(value));
}

function applyScaleSetting(name, value) {
  if (garageLocked()) return;
  const nextSettings = normalizeSettings({ ...state.save.settings, [name]: value });
  const previous = state.save.settings;
  const trackChanged = nextSettings.trackScale !== previous.trackScale;
  const physicsChanged = nextSettings.physicsScale !== previous.physicsScale;
  const zoomChanged = nextSettings.cameraZoom !== previous.cameraZoom;
  if (!trackChanged && !physicsChanged && !zoomChanged) return;

  state.save.settings = nextSettings;
  saveProgress();

  if (trackChanged || physicsChanged) {
    state.mode = "garage";
    configureEnvironment(true);
    setMessage(`Escala aplicada: circuito ${nextSettings.trackScale.toFixed(0)}x, fisica ${nextSettings.physicsScale.toFixed(1)}x.`, 2.4);
    showGarageOverlay();
  } else {
    refreshScaleUI();
    updateHud();
    setMessage(`Zoom ajustado a ${nextSettings.cameraZoom.toFixed(2)}.`, 1.6);
  }
}

function resetScaleSettings() {
  if (garageLocked()) return;
  state.save.settings = normalizeSettings(DEFAULT_SETTINGS);
  saveProgress();
  configureEnvironment(true);
  setMessage("Escalas restauradas al preset base.", 2.2);
  showGarageOverlay();
}

function syncProgress(driver) {
  const previousProgress = driver.trackProgress;
  const snap = project(driver.x, driver.y);
  const previousLap = driver.lap;
  const delta = snap.progress - driver.trackProgress;
  if (delta < -(state.track.total * 0.5)) {
    driver.lap += 1;
  } else if (delta > (state.track.total * 0.5)) {
    driver.lap = Math.max(driver.minLap, driver.lap - 1);
  }
  driver.trackProgress = snap.progress;
  driver.totalProgress = driver.progressOffset + (driver.lap * state.track.total) + snap.progress;

  if (driver.lap > previousLap) {
    if (driver.sectorIndex === 2) {
      const finalSectorMs = Math.round((state.raceTime - driver.sectorAnchor) * 1000);
      recordSector(driver, 2, finalSectorMs);
    }
    const lapMs = Math.round((state.raceTime - driver.lapAnchor) * 1000);
    driver.lastLapMs = lapMs;
    if (!driver.bestLapMs || lapMs < driver.bestLapMs) {
      driver.bestLapMs = lapMs;
      if (driver.player) {
        setMessage(`Nueva mejor vuelta: ${formatTime(lapMs)}.`, 2.1);
      }
    }
    driver.lapAnchor = state.raceTime;
    driver.sectorAnchor = state.raceTime;
    driver.sectorIndex = 0;
  }

  if (driver.lap === previousLap) {
    const lapRatio = snap.progress / state.track.total;
    if (driver.sectorIndex < 2 && previousProgress / state.track.total < SECTOR_RATIOS[driver.sectorIndex] && lapRatio >= SECTOR_RATIOS[driver.sectorIndex]) {
      const sectorMs = Math.round((state.raceTime - driver.sectorAnchor) * 1000);
      recordSector(driver, driver.sectorIndex, sectorMs);
      driver.sectorAnchor = state.raceTime;
      driver.sectorIndex += 1;
    }
  }

  if (!driver.finished && state.sessionType === "race" && driver.lap >= state.totalLaps) {
    state.finishCount += 1;
    driver.finished = true;
    driver.finishOrder = state.finishCount;
  }
  return snap;
}

function rewardForPlace(place, abandoned) {
  if (abandoned) return 40;
  const table = [0, 320, 250, 210, 180, 160, 145, 132, 120, 110, 100, 92, 84, 76, 70, 64, 58, 52, 46, 42, 38, 34, 30];
  return table[Math.min(place, table.length - 1)] || 30;
}

function persistBestLap(driver) {
  if (!driver.bestLapMs) return false;
  const previous = state.save.bestLaps[state.trackConfig.id];
  if (!previous || driver.bestLapMs < previous) {
    state.save.bestLaps[state.trackConfig.id] = driver.bestLapMs;
    return true;
  }
  return false;
}

function estimatedQualifyingTime(driver) {
  const compoundBias = driver.player ? compoundData(selectedCompoundKey()) : compoundData(driver.compound);
  const baseSeconds = state.trackConfig.referenceLengthKm * 52;
  const paceFactor = 1 - (((driver.baseMax / Math.max(1, physicsScale())) - 285) * 0.0019);
  const gripFactor = 1 - (((driver.grip || 0.92) - 0.9) * 0.11);
  const compoundFactor = 1 - ((compoundBias.grip - 1) * 0.42);
  const weatherFactor = state.weatherKey === "rain" ? 1.12 : state.weatherKey === "night" ? 1.015 : 1;
  return Math.round(baseSeconds * 1000 * paceFactor * gripFactor * compoundFactor * weatherFactor);
}

function finalizeQualifyingResults() {
  const grid = [...state.cars].map((driver) => ({
    id: driver.id,
    name: driver.name,
    time: driver.bestLapMs || estimatedQualifyingTime(driver),
  })).sort((a, b) => a.time - b.time);

  const weekend = {
    ...state.weekend,
    qualifyingOrder: grid.map((entry) => entry.id),
    qualifyingTimes: Object.fromEntries(grid.map((entry) => [entry.id, entry.time])),
    poleDriverId: grid[0]?.id || "",
    poleTime: grid[0]?.time || 0,
    status: "Clasificacion completada",
    bestSectors: [...state.weekend.bestSectors],
  };
  setWeekendRecord(state.trackConfig.id, weekend);
  state.save.selectedSession = "race";
  state.sessionType = "race";
  saveProgress();
  refreshSetupUI();
  return grid;
}

function finishQualifying() {
  if (state.rewardPaid) return;
  state.mode = "finished";
  state.lastCompletedSession = "qualifying";
  syncShellMode();
  state.rewardPaid = true;
  const grid = finalizeQualifyingResults();
  const playerRow = grid.findIndex((entry) => entry.id === state.save.selectedDriverId);
  const poleDriver = driverConfigById(grid[0]?.id);
  const me = player();
  const reward = Math.round((40 + Math.max(0, 18 - (playerRow * 2))) * rewardFieldFactor(grid.length));
  state.save.credits += reward;
  saveProgress();
  const championshipNote = state.gameMode === "championship" && state.championship.active
    ? ` Ronda ${state.championship.roundIndex + 1}/${state.championship.rounds.length}.`
    : "";
  setOverlay(
    "Clasificacion cerrada",
    `Saldras P${playerRow + 1}. Pole para ${poleDriver ? poleDriver.name : "la parrilla"} con ${formatTime(grid[0]?.time || 0)}. Cobras ${reward} creditos.${championshipNote} Pulsa Enter para ir a la carrera.`,
    true,
  );
  setMessage(`Qualy finalizada. Mejor vuelta ${formatTime(me.bestLapMs)}.`, 3);
  updateHud();
}

function finishRace(abandoned) {
  if (state.rewardPaid) return;
  state.mode = "finished";
  state.lastCompletedSession = "race";
  syncShellMode();
  state.rewardPaid = true;
  const me = player();
  const place = standings().findIndex((driver) => driver.player) + 1;
  const bestLapStored = persistBestLap(me);
  const championshipOutcome = advanceChampionshipAfterRace(abandoned);
  const reward = state.gameMode === "training"
    ? 0
    : Math.round((rewardForPlace(place, abandoned) + (me.pickupsCollected * 12)) * currentWeather().reward * rewardFieldFactor());
  state.save.credits += reward;
  setWeekendRecord(state.trackConfig.id, {
    ...state.weekend,
    status: state.gameMode === "training"
      ? (abandoned ? "Entrenamiento abortado" : `Entrenamiento completado P${place}`)
      : abandoned ? "Carrera abandonada" : `Carrera completada P${place}`,
  });
  saveProgress();
  refreshSetupUI();

  if (state.gameMode === "training") {
    setOverlay(
      abandoned ? "Entrenamiento interrumpido" : "Stint completado",
      `${abandoned ? `Terminaste el stint en posicion ${place}.` : `Cerraste el entrenamiento en P${place}.`} Mejor vuelta ${formatTime(me.bestLapMs || state.save.bestLaps[state.trackConfig.id] || 0)}. Sin creditos ni puntos, enfoque total en ritmo y setup.`,
      true,
    );
  } else if (state.gameMode === "championship" && championshipOutcome) {
    if (championshipOutcome.seasonComplete) {
      setOverlay(
        "Campeonato cerrado",
        `${abandoned ? `Abandonaste en P${place}.` : place === 1 ? "Ganaste la ronda final." : `Terminaste la ronda final en P${place}.`} Sumaste ${championshipOutcome.playerPoints} pts y ${reward} creditos. Campeon: ${championshipOutcome.champion ? championshipOutcome.champion.name : "por definir"}. ${championshipSummaryLine()} Pulsa Enter para iniciar una temporada nueva.`,
        true,
      );
    } else {
      setOverlay(
        "Ronda completada",
        `${abandoned ? `Abandonaste en P${place}.` : place === 1 ? "Ganaste la ronda." : `Terminaste en P${place}.`} Sumaste ${championshipOutcome.playerPoints} pts y ${reward} creditos. Siguiente circuito: ${championshipOutcome.nextTrackName}. ${championshipSummaryLine()} Pulsa Enter para seguir.`,
        true,
      );
    }
  } else if (abandoned) {
    setOverlay(
      "Monoplaza fuera de combate",
      `Abandonaste en posicion ${place}. Cobras ${reward} creditos. Pulsa Enter o usa el garaje para ajustar el coche.`,
      true,
    );
  } else {
    const resultText = place === 1 ? "Ganaste la carrera." : `Terminaste en la posicion ${place}.`;
    const extra = bestLapStored ? ` Nuevo record: ${formatTime(me.bestLapMs)}.` : "";
    setOverlay(
      "Bandera a cuadros",
      `${resultText} Cobras ${reward} creditos.${extra} Pulsa Enter para repetir o cambia el setup.`,
      true,
    );
  }

  if (state.gameMode === "training") {
    setMessage(`Entrenamiento cerrado. Mejor vuelta ${formatTime(me.bestLapMs)}.`, 3.2);
  } else if (state.gameMode === "championship" && championshipOutcome) {
    setMessage(`Temporada: ${championshipOutcome.playerPoints} pts en esta ronda y ${reward} creditos.`, 3.2);
  } else {
    setMessage(`Recompensa aplicada: ${reward} creditos.`, 3.2);
  }
  updateHud();
}

function startRace() {
  if (garageLocked()) return;
  if (state.gameMode === "championship" && state.championship.active && state.championship.roundIndex >= state.championship.rounds.length) {
    resetChampionship();
  }
  ensureChampionshipInitialized();
  state.mode = "countdown";
  state.lastCompletedSession = "";
  syncShellMode();
  state.countdown = 3.6;
  state.finishCount = 0;
  state.shake = 0;
  state.raceTime = 0;
  state.qualifyingClock = QUALIFYING_SESSION_SECONDS;
  state.rewardPaid = false;
  state.sectorFlash = { index: -1, ttl: 0, delta: 0 };
  configureEnvironment(true);
  state.cars.forEach((driver) => {
    driver.lapAnchor = 0;
    driver.sectorAnchor = 0;
    driver.sectorIndex = 0;
  });
  const countdownText = state.sessionType === "qualifying"
    ? "Sesion de qualy. Busca espacio, marca vuelta y define la parrilla."
    : state.gameMode === "training"
      ? "Sesion libre. Busca ritmo, prueba frenadas y trabaja el setup."
      : state.gameMode === "championship"
        ? `Ronda ${state.championship.roundIndex + 1}/${state.championship.rounds.length}. Gestiona neumaticos, energia y trafico.`
        : "Semaforo activo. Gestiona energia, usa DRS y evita debris en la trazada.";
  setOverlay("3", countdownText, true);
}

function togglePitRequest() {
  if (state.mode !== "racing" || state.sessionType !== "race") return;
  const me = player();
  if (me.inPitLane) return;
  me.pitRequested = !me.pitRequested;
  me.plannedCompound = nextPitCompoundKey(me.compound, state.weatherKey);
  setMessage(me.pitRequested ? `Boxes confirmados. Monta ${compoundData(me.plannedCompound).label}.` : "Entrada a boxes cancelada.", 1.8);
}

function shouldEnterPit(driver) {
  if (!driver.pitRequested || driver.inPitLane || state.sessionType !== "race") return false;
  const ratio = driver.trackProgress / state.track.total;
  return ratio >= Math.max(0, state.trackside.pitStartRatio - 0.015) && ratio <= state.trackside.pitStartRatio + 0.02;
}

function beginPitLane(driver) {
  driver.inPitLane = true;
  driver.pitCommitted = true;
  driver.pitState = "entry";
  driver.pitProgress = 0;
  driver.pitStopTimer = 0;
  driver.pitServiceDone = false;
  driver.speed = Math.min(driver.speed, pitSpeedLimit());
  const slot = pointAlongLine(state.trackside.pitLane, 0);
  driver.x = slot.x;
  driver.y = slot.y;
  driver.angle = slot.angle;
  driver.trackProgress = state.trackside.pitTrackStart;
  driver.totalProgress = driver.progressOffset + (driver.lap * state.track.total) + driver.trackProgress;
}

function servicePitStop(driver) {
  driver.compound = driver.plannedCompound;
  driver.plannedCompound = nextPitCompoundKey(driver.compound, state.weatherKey);
  driver.tireWear = 100;
  driver.tireAge = 0;
  driver.integrity = Math.min(driver.maxIntegrity, driver.integrity + 20);
  driver.energy = Math.min(driver.maxEnergy, driver.energy + 26);
  driver.boostTimer = 0;
  driver.shieldTimer = 0;
  driver.pitServiceDone = true;
  if (driver.player) {
    setMessage(`Servicio completo. Sales con ${compoundData(driver.compound).label}.`, 1.8);
  }
}

function updatePitDriver(driver, dt) {
  const line = state.trackside.pitLane;
  const speedLimit = pitSpeedLimit();
  if (driver.pitState === "service") {
    driver.speed = 0;
    driver.pitStopTimer -= dt;
    if (driver.pitStopTimer <= 0) {
      servicePitStop(driver);
      driver.pitState = "exit";
    }
  } else {
    driver.speed = lerp(driver.speed, speedLimit, clamp(dt * 4.5, 0, 1));
    driver.pitProgress = Math.min(line.total, driver.pitProgress + Math.max(speedLimit * 0.7, driver.speed) * dt);
    if (driver.pitState === "entry" && driver.pitProgress >= state.trackside.pitServiceDistance) {
      driver.pitProgress = state.trackside.pitServiceDistance;
      driver.pitState = "service";
      driver.pitStopTimer = driver.player ? 2.7 : 2.2 + (Math.random() * 0.9);
      driver.speed = 0;
    }
  }

  const marker = pointAlongLine(line, driver.pitProgress);
  const pitRatio = clamp(driver.pitProgress / Math.max(1, line.total), 0, 1);
  driver.x = marker.x;
  driver.y = marker.y;
  driver.angle = marker.angle;
  driver.trackProgress = lerp(state.trackside.pitTrackStart, state.trackside.pitTrackEnd, pitRatio);
  driver.totalProgress = driver.progressOffset + (driver.lap * state.track.total) + driver.trackProgress;

  if (driver.pitState === "exit" && driver.pitProgress >= line.total - 1) {
    const release = pointAt(state.trackside.pitTrackEnd);
    driver.inPitLane = false;
    driver.pitRequested = false;
    driver.pitCommitted = false;
    driver.pitState = "track";
    driver.x = release.x;
    driver.y = release.y;
    driver.angle = release.angle;
    driver.speed = Math.max(driver.speed, speedLimit * 0.85);
  }
}

function updateTireWear(driver, dt, steerLoad, offTrack) {
  const tire = compoundData(driver.compound);
  const speedLoad = clamp(driver.speed / Math.max(1, driver.baseMax), 0.2, 1.2);
  const wetMismatch = state.weatherKey === "rain" ? (tire.wet < 1 ? 1.24 : 0.86) : (tire.wet > 1 ? 1.14 : 1);
  const degradation = (0.24 + (speedLoad * 0.42) + (Math.abs(steerLoad) * 0.46) + (offTrack ? 0.52 : 0)) * tire.wear * wetMismatch * dt;
  driver.tireWear = clamp(driver.tireWear - degradation, 0, 100);
  driver.tireAge += dt;
}

function isInDrsZone(progress) {
  const ratio = progress / state.track.total;
  return state.trackConfig.drsZones.some(([start, end]) => ratio >= start && ratio <= end);
}

function computePlayerDraft(driver) {
  let draft = 0;
  const spacing = trackSpaceScale();
  for (const rival of rivals()) {
    const gap = rival.totalProgress - driver.totalProgress;
    if (gap <= 12 * spacing || gap >= 180 * spacing) continue;
    const targetAngle = Math.atan2(rival.y - driver.y, rival.x - driver.x);
    const facingDelta = Math.abs(wrapAngle(targetAngle - driver.angle));
    const dist = Math.hypot(rival.x - driver.x, rival.y - driver.y);
    if (dist < 110 * spacing && facingDelta < 0.55) {
      draft = Math.max(draft, ((180 * spacing) - gap) * 0.016 * driver.draftEfficiency);
    }
  }
  const drs = draft > 6 * physicsScale() && isInDrsZone(driver.trackProgress) ? 26 * physicsScale() * driver.drsPower : 0;
  state.draftBonus = draft;
  state.drsActive = drs > 0;
  return draft + drs;
}

function spendEnergy(cost) {
  const me = player();
  const actualCost = Math.max(4, Math.round(cost * me.energyCostScale));
  if (me.energy < actualCost) {
    setMessage("Energia insuficiente.", 1.2);
    return false;
  }
  me.energy -= actualCost;
  return true;
}

function activateBoost() {
  if (state.mode !== "racing" || !spendEnergy(ABILITY_COSTS.boost)) return;
  const me = player();
  me.boostTimer = Math.max(me.boostTimer, me.boostCapacity);
  me.speed = Math.min(me.speed + (70 * physicsScale()), me.baseMax + (100 * physicsScale()));
  setMessage("ERS desplegado.", 1.4);
}

function activateShield() {
  if (state.mode !== "racing" || !spendEnergy(ABILITY_COSTS.shield)) return;
  const me = player();
  me.shieldTimer = Math.max(me.shieldTimer, me.shieldCapacity);
  setMessage("Escudo desplegado.", 1.4);
}

function activateMagnet() {
  if (state.mode !== "racing" || !spendEnergy(ABILITY_COSTS.magnet)) return;
  const me = player();
  me.magnetTimer = Math.max(me.magnetTimer, me.magnetCapacity);
  setMessage("Iman tactico activado.", 1.4);
}

function activateRepair() {
  const me = player();
  if (state.mode !== "racing") return;
  if (me.integrity >= me.maxIntegrity - 4) {
    setMessage("La integridad ya esta casi al maximo.", 1.2);
    return;
  }
  if (!spendEnergy(ABILITY_COSTS.repair)) return;
  me.integrity = Math.min(me.maxIntegrity, me.integrity + me.repairAmount);
  setMessage("Reparacion rapida ejecutada.", 1.4);
}

function applyPickup(item) {
  const me = player();
  if (item.type === "boost") {
    me.boostTimer = Math.max(me.boostTimer, me.boostCapacity + 0.6);
    me.speed = Math.min(me.speed + (85 * physicsScale()), me.baseMax + (110 * physicsScale()));
    setMessage("Turbo recogido.", 1.6);
  } else if (item.type === "shield") {
    me.shieldTimer = Math.max(me.shieldTimer, me.shieldCapacity + 1.4);
    setMessage("Escudo recargado.", 1.6);
  } else if (item.type === "repair") {
    me.integrity = Math.min(me.maxIntegrity, me.integrity + 28);
    setMessage("Kit de reparacion recogido.", 1.6);
  } else {
    me.energy = Math.min(me.maxEnergy, me.energy + 34);
    setMessage("Celda de energia absorbida.", 1.6);
  }
  me.pickupsCollected += 1;
  item.active = false;
  item.respawn = 6.4;
}

function triggerHazard(hazard) {
  const me = player();
  if (hazard.type === "oil") {
    me.controlLock = Math.max(me.controlLock, 1.05 / me.stability);
    me.speed *= 0.9;
    setMessage("Aceite en pista. Coche descolocado.", 1.7);
  } else {
    if (me.shieldTimer <= 0) {
      me.integrity -= 16 * me.offTrackDamageScale * (1 - me.damageReduction);
    }
    me.speed *= 0.84;
    setMessage("Debris impactado.", 1.7);
  }
  hazard.active = false;
  hazard.respawn = 8.5;
  state.shake = Math.min(state.shake + 6, 14);
}

function updatePickups(dt) {
  const me = player();
  for (const item of state.pickups) {
    item.pulse += dt * 2;
    if (!item.active) {
      item.respawn -= dt;
      if (item.respawn <= 0) item.active = true;
      continue;
    }
    const slot = pointAt(item.distance);
    const x = slot.x + (slot.nx * item.lane);
    const y = slot.y + (slot.ny * item.lane);
    const bonusRadius = me.magnetTimer > 0 ? me.magnetRange : 0;
    if (Math.hypot(me.x - x, me.y - y) < pickupRadius() + (12 * vehicleScale()) + bonusRadius) {
      applyPickup(item);
    }
  }
}

function updateHazards(dt) {
  const me = player();
  for (const hazard of state.hazards) {
    hazard.pulse += dt * 1.6;
    if (!hazard.active) {
      hazard.respawn -= dt;
      if (hazard.respawn <= 0) hazard.active = true;
      continue;
    }
    const slot = pointAt(hazard.distance);
    const x = slot.x + (slot.nx * hazard.lane);
    const y = slot.y + (slot.ny * hazard.lane);
    if (Math.hypot(me.x - x, me.y - y) < hazardRadius() + (10 * vehicleScale())) {
      triggerHazard(hazard);
    }
  }
}

function applyTrackBoundaryPhysics(driver, snap, dt) {
  const weather = currentWeather();
  const safeLimit = state.track.width * 0.46;
  const curbLimit = state.track.width * 0.4;
  const overflow = snap.dist - safeLimit;
  const relX = driver.x - snap.x;
  const relY = driver.y - snap.y;
  const relLen = Math.hypot(relX, relY) || 1;
  const normalX = relX / relLen;
  const normalY = relY / relLen;
  const tangentX = Math.cos(snap.angle);
  const tangentY = Math.sin(snap.angle);

  if (snap.dist > curbLimit && snap.dist <= safeLimit) {
    driver.speed *= 1 - (0.22 * dt * weather.offTrack);
    driver.angle += wrapAngle(snap.angle - driver.angle) * 0.12 * dt;
  }

  if (overflow <= 0) {
    return false;
  }

  driver.x = snap.x + (normalX * safeLimit);
  driver.y = snap.y + (normalY * safeLimit);

  const velocity = velocityOf(driver);
  const tangentSpeed = (velocity.x * tangentX) + (velocity.y * tangentY);
  const normalSpeed = (velocity.x * normalX) + (velocity.y * normalY);
  const reflectedNormal = normalSpeed > 0 ? -normalSpeed * (0.86 + (0.03 * driver.stability)) : -Math.abs(normalSpeed) * 0.5;
  const dampedTangent = tangentSpeed * (0.91 + (0.02 * driver.stability));
  const bumperKick = 26 + (overflow * 2.6);
  const vx = (tangentX * dampedTangent) + (normalX * (reflectedNormal - bumperKick));
  const vy = (tangentY * dampedTangent) + (normalY * (reflectedNormal - bumperKick));
  applyVelocity(driver, vx, vy, driver.baseMax * 1.35);

  driver.angle += wrapAngle(snap.angle - driver.angle) * (0.15 + (0.02 * driver.stability));
  driver.edgeRecover = 0.1;
  driver.controlLock = Math.max(driver.controlLock, 0.08 / driver.stability);

  const wallImpact = Math.abs(normalSpeed) + (overflow * 1.8) + (driver.speed * 0.12);
  if (driver.shieldTimer <= 0) {
    driver.integrity -= wallImpact * 0.004 * weather.offTrack * driver.offTrackDamageScale * (1 - driver.damageReduction);
  }
  if (driver.player) {
    state.shake = Math.min(state.shake + 6, 16);
  }
  return true;
}

function trafficResponse(driver) {
  let steerBias = 0;
  let brakeBias = 0;
  for (const other of state.cars) {
    if (other === driver || other.finished) continue;
    const dx = other.x - driver.x;
    const dy = other.y - driver.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 96 * vehicleScale()) continue;
    const heading = Math.atan2(dy, dx);
    const angleDelta = wrapAngle(heading - driver.angle);
    if (Math.abs(angleDelta) < 0.55) {
      brakeBias = Math.max(brakeBias, ((96 * vehicleScale()) - dist) * 0.3);
      steerBias += angleDelta > 0 ? -0.22 : 0.22;
    }
  }
  return { steerBias, brakeBias };
}

function updatePlayer(driver, dt) {
  if (driver.inPitLane) {
    updatePitDriver(driver, dt);
    return;
  }
  if (shouldEnterPit(driver)) {
    beginPitLane(driver);
    updatePitDriver(driver, dt);
    return;
  }
  const weather = currentWeather();
  const accelerate = keys.KeyW || keys.ArrowUp;
  const brake = keys.KeyS || keys.ArrowDown;
  const steerInput = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const draftBonus = computePlayerDraft(driver);
  const tireSpeed = compoundSpeedFactor(driver);
  const tireBrake = compoundBrakeFactor(driver);
  const tireGrip = compoundGripFactor(driver);
  const boostFactor = driver.boostTimer > 0 ? 1.28 : 1;
  const speedCap = (driver.baseMax + draftBonus) * weather.speed * tireSpeed * boostFactor;
  const accel = driver.accel * tireSpeed * (driver.boostTimer > 0 ? 1.18 : 1) * (state.weatherKey === "night" ? 1.03 : 1);

  driver.controlLock = Math.max(0, driver.controlLock - dt);
  driver.edgeRecover = Math.max(0, driver.edgeRecover - dt);
  if (accelerate) driver.speed += accel * dt;
  else driver.speed -= (42 * physicsScale()) * dt;
  if (brake) driver.speed -= driver.brake * tireBrake * dt;

  driver.speed -= driver.speed * 0.64 * dt;
  driver.speed = clamp(driver.speed, 0, speedCap);

  const weatherGrip = weather.grip + (state.weatherKey === "rain" ? driver.wetGripBonus : 0);
  const grip = driver.grip * weatherGrip * tireGrip * (driver.controlLock > 0 ? 0.34 : 1) * (driver.edgeRecover > 0 ? 0.72 : 1);
  driver.angle += steerInput * driver.steer * clamp(driver.speed / (180 * physicsScale()), 0.35, 1.12) * grip * dt;
  if (driver.controlLock > 0) {
    driver.angle += Math.sin(state.raceTime * 18) * 0.95 * dt;
  }

  driver.x += Math.cos(driver.angle) * driver.speed * dt;
  driver.y += Math.sin(driver.angle) * driver.speed * dt;

  const snap = syncProgress(driver);
  const hitEdge = applyTrackBoundaryPhysics(driver, snap, dt);
  const offTrack = snap.dist > state.track.width * 0.4;
  const tangentDelta = wrapAngle(snap.angle - driver.angle);

  if (!hitEdge && offTrack) {
    driver.speed *= 1 - ((0.95 * weather.offTrack * dt) / driver.offTrackGrip);
    driver.angle += tangentDelta * 0.72 * dt * driver.stability;
    if (driver.shieldTimer <= 0) {
      driver.integrity -= 8 * weather.offTrack * driver.offTrackDamageScale * (1 - driver.damageReduction) * dt;
    }
  } else if (!hitEdge) {
    driver.angle += tangentDelta * (0.42 + (0.28 * grip * driver.stability)) * dt;
  }

  const aligned = Math.abs(tangentDelta) < 0.22 && !offTrack;
  const regen = driver.energyRegen + (aligned ? 5 : 0) + (state.weatherKey === "night" ? 1.5 : 0);
  driver.energy = clamp(driver.energy + (regen * dt), 0, driver.maxEnergy);
  driver.integrity = clamp(driver.integrity, 0, driver.maxIntegrity);
  updateTireWear(driver, dt, steerInput, offTrack);
}

function updateAi(driver, dt) {
  if (state.sessionType === "race" && !driver.inPitLane && !driver.pitRequested && !driver.finished && driver.lap >= 1 && driver.lap < state.totalLaps - 1) {
    const needsPit = driver.tireWear < 46 || driver.integrity < driver.maxIntegrity * 0.58;
    if (needsPit) {
      driver.pitRequested = true;
      driver.plannedCompound = nextPitCompoundKey(driver.compound, state.weatherKey);
    }
  }
  if (driver.inPitLane) {
    updatePitDriver(driver, dt);
    return;
  }
  if (shouldEnterPit(driver)) {
    beginPitLane(driver);
    updatePitDriver(driver, dt);
    return;
  }
  const weather = currentWeather();
  driver.boostTimer = Math.max(0, driver.boostTimer - dt);
  driver.edgeRecover = Math.max(0, driver.edgeRecover - dt);
  const snap = syncProgress(driver);
  const aim = pointAt(snap.progress + driver.lookAhead);
  const traffic = trafficResponse(driver);
  const desiredAngle = Math.atan2(aim.y - driver.y, aim.x - driver.x);
  const delta = wrapAngle(desiredAngle - driver.angle) + traffic.steerBias;
  const boostBonus = driver.boostTimer > 0 ? 24 * physicsScale() : 0;
  const tireSpeed = compoundSpeedFactor(driver);
  const tireGrip = compoundGripFactor(driver);
  const tireBrake = compoundBrakeFactor(driver);
  const desiredSpeed = clamp((((driver.baseMax + (driver.risk * 8 * physicsScale())) - (Math.abs(delta) * 82 * physicsScale())) * weather.speed * tireSpeed + boostBonus) - traffic.brakeBias, 155 * physicsScale(), driver.baseMax * weather.speed * tireSpeed + boostBonus);

  if (Math.abs(delta) < 0.08 && driver.speed > 215 * physicsScale() && Math.random() < dt * (0.18 + (driver.risk * 0.2))) {
    driver.boostTimer = Math.max(driver.boostTimer, 0.9 + (driver.risk * 0.5));
  }

  if (driver.speed < desiredSpeed) driver.speed += driver.accel * tireSpeed * dt;
  else driver.speed -= driver.brake * tireBrake * 0.72 * dt;

  driver.speed -= driver.speed * 0.56 * dt;
  driver.speed = clamp(driver.speed, 0, driver.baseMax * weather.speed * tireSpeed + boostBonus);
  driver.angle += clamp(delta, -1, 1) * driver.steer * driver.grip * weather.grip * tireGrip * (driver.edgeRecover > 0 ? 0.74 : 1) * dt;
  driver.x += Math.cos(driver.angle) * driver.speed * dt;
  driver.y += Math.sin(driver.angle) * driver.speed * dt;

  const refined = syncProgress(driver);
  const hitEdge = applyTrackBoundaryPhysics(driver, refined, dt);
  const offTrack = refined.dist > state.track.width * 0.42;
  if (!hitEdge && offTrack) {
    driver.speed *= 1 - ((0.85 * weather.offTrack * dt) / driver.offTrackGrip);
    driver.angle += wrapAngle(refined.angle - driver.angle) * dt;
  }
  updateTireWear(driver, dt, delta, offTrack);
}

function resolveCollisions(dt) {
  for (let i = 0; i < state.cars.length; i += 1) {
    for (let j = i + 1; j < state.cars.length; j += 1) {
      const a = state.cars[i];
      const b = state.cars[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < collisionDistance()) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (collisionDistance() - dist) * 0.5;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const av = velocityOf(a);
        const bv = velocityOf(b);
        const relVx = bv.x - av.x;
        const relVy = bv.y - av.y;
        const normalSpeed = (relVx * nx) + (relVy * ny);
        const tx = -ny;
        const ty = nx;
        const restitution = 0.82;
        const closingImpulse = normalSpeed < 0 ? -((1 + restitution) * normalSpeed) / 2 : 0;
        const separationKick = overlap * 8.5;
        const impulse = closingImpulse + separationKick;
        av.x -= nx * impulse;
        av.y -= ny * impulse;
        bv.x += nx * impulse;
        bv.y += ny * impulse;

        const tangentSpeed = (relVx * tx) + (relVy * ty);
        const slipImpulse = clamp(-tangentSpeed * 0.05, -6 * physicsScale(), 6 * physicsScale());
        av.x -= tx * slipImpulse;
        av.y -= ty * slipImpulse;
        bv.x += tx * slipImpulse;
        bv.y += ty * slipImpulse;

        applyVelocity(a, av.x, av.y, a.baseMax * 1.35);
        applyVelocity(b, bv.x, bv.y, b.baseMax * 1.35);
        a.controlLock = Math.max(a.controlLock, 0.04);
        b.controlLock = Math.max(b.controlLock, 0.04);

        const impact = Math.max(0, -normalSpeed) + (overlap * 2.4);
        if (a.player && a.shieldTimer <= 0) {
          a.integrity = clamp(a.integrity - (impact * 0.012 * (1 - a.damageReduction)), 0, a.maxIntegrity);
          state.shake = Math.min(state.shake + 4, 16);
        }
        if (b.player && b.shieldTimer <= 0) {
          b.integrity = clamp(b.integrity - (impact * 0.012 * (1 - b.damageReduction)), 0, b.maxIntegrity);
          state.shake = Math.min(state.shake + 4, 16);
        }
      }
    }
  }
}

function updateRain(dt) {
  if (!currentWeather().rain) return;
  for (const drop of rainParticles) {
    drop.x -= drop.speed * 0.18 * dt;
    drop.y += drop.speed * dt;
    if (drop.y > HEIGHT + 20 || drop.x < -20) {
      drop.x = Math.random() * WIDTH;
      drop.y = -20;
    }
  }
}

function updateCamera(dt) {
  const focus = player();
  if (!focus) return;
  const smoothing = clamp(dt * 6.5, 0, 1);
  state.camera.x = lerp(state.camera.x, focus.x, smoothing);
  state.camera.y = lerp(state.camera.y, focus.y, smoothing);
  state.camera.zoom = cameraZoom();
}

function updateHud() {
  const me = player();
  const place = standings().findIndex((driver) => driver.player) + 1;
  const savedBest = state.save.bestLaps[state.trackConfig.id] || 0;
  const bestLap = me.bestLapMs || savedBest;

  hud.lap.textContent = state.sessionType === "qualifying"
    ? `${Math.max(0, Math.ceil(state.qualifyingClock))} s`
    : `${Math.min(Math.max(me.lap, 0), state.totalLaps)} / ${state.totalLaps}`;
  hud.place.textContent = `${place} / ${state.cars.length}`;
  hud.speed.textContent = `${speedDisplayKph(me)} km/h`;
  hud.integrity.textContent = `${Math.round(me.integrity)} / ${me.maxIntegrity} | ${compoundData(me.compound).short}${Math.round(me.tireWear)}`;
  hud.credits.textContent = `${state.save.credits} cr`;
  hud.bestLap.textContent = formatTime(bestLap);
  hud.boost.style.width = `${clamp((me.boostTimer / (me.boostCapacity + 0.6)) * 100, 0, 100)}%`;
  hud.shield.style.width = `${clamp((me.shieldTimer / (me.shieldCapacity + 1.4)) * 100, 0, 100)}%`;
  hud.energy.style.width = `${clamp((me.energy / me.maxEnergy) * 100, 0, 100)}%`;
  hud.message.textContent = state.message.ttl > 0 ? state.message.text : defaultMessage();
}

function strokeTrack(width, color, dash = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(dash);
  ctx.beginPath();
  state.track.points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function strokePolyline(points, width, color, dash = []) {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(dash);
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawBackground() {
  const palette = state.trackConfig.palette;
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH * 0.2, HEIGHT * 0.18, 40, WIDTH * 0.2, HEIGHT * 0.18, WIDTH * 0.8);
  glow.addColorStop(0, `${palette.accent}2d`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const field = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  field.addColorStop(0, palette.grassA);
  field.addColorStop(1, palette.grassB);
  ctx.fillStyle = field;
  ctx.globalAlpha = 0.95;
  ctx.fillRect(0, HEIGHT * 0.2, WIDTH, HEIGHT * 0.8);
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "#d7fff4";
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTracksideBase() {
  const profile = state.trackside?.profile || trackSceneProfile(state.trackConfig);
  const scale = trackSpaceScale();
  const fencePad = (profile.kind === "street" ? 28 : 38) * scale;
  const runoffPad = (profile.kind === "street" ? 8 : profile.kind === "desert" ? 18 : 14) * scale;
  const shoulderPad = (profile.kind === "street" ? 6 : 10) * scale;

  strokeTrack(state.track.width + fencePad, "rgba(0,0,0,0.08)");
  strokeTrack(state.track.width + runoffPad, profile.runoffColor);
  strokeTrack(state.track.width + shoulderPad, profile.shoulderColor);
  if (profile.kind === "street") {
    strokeTrack(state.track.width + (4 * scale), "rgba(255,255,255,0.08)");
  }
  strokeTrack(state.track.width + (runoffPad + (4 * scale)), profile.fenceColor, [14 * scale, 12 * scale]);
}

function drawRunoffZones() {
  const scale = trackSpaceScale();
  const profile = state.trackside.profile;
  for (const zone of state.trackside.runoffZones) {
    const points = buildOffsetPolyline(zone.startRatio, zone.endRatio, zone.side, state.track.width * 0.76, 18, zone.extra);
    strokePolyline(points, Math.max(10 * scale, zone.extra * 0.95), zone.color);
    strokePolyline(points, Math.max(2 * scale, zone.extra * 0.12), "rgba(255,255,255,0.14)", [10 * scale, 10 * scale]);
    if (profile.kind !== "street") {
      strokePolyline(points, Math.max(2 * scale, zone.extra * 0.08), "rgba(0,0,0,0.12)", [4 * scale, 12 * scale]);
    }
  }
}

function drawPitLane() {
  if (!state.trackside?.pitLane?.points?.length) return;
  const profile = state.trackside.profile;
  const scale = trackSpaceScale();
  strokePolyline(state.trackside.pitLane.points, (state.track.width * 0.44) + (10 * scale), "rgba(0,0,0,0.18)");
  strokePolyline(state.trackside.pitLane.points, (state.track.width * 0.44) + (4 * scale), profile.shoulderColor);
  strokePolyline(state.trackside.pitLane.points, state.track.width * 0.42, "#4a5058");
  strokePolyline(state.trackside.pitDivider, Math.max(2 * scale, state.track.width * 0.03), "rgba(248,249,251,0.85)", [16 * scale, 12 * scale]);
}

function drawTracksideProps() {
  if (!state.trackside) return;
  const profile = state.trackside.profile;
  const scale = trackSpaceScale();

  ctx.save();
  for (const building of state.trackside.pitBuildings) {
    ctx.save();
    ctx.translate(building.x, building.y);
    ctx.rotate(building.angle);
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect((-building.width * 0.5) + (3 * scale), (-building.depth * 0.5) + (3 * scale), building.width, building.depth);
    ctx.fillStyle = profile.buildingColor;
    ctx.fillRect(-building.width * 0.5, -building.depth * 0.5, building.width, building.depth);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(-building.width * 0.5, -building.depth * 0.5, building.width, Math.max(2 * scale, building.depth * 0.16));
    ctx.restore();
  }

  for (const board of state.trackside.boards) {
    ctx.save();
    ctx.translate(board.x, board.y);
    ctx.rotate(board.angle);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect((-board.width * 0.5) + (2 * scale), (-board.height * 0.5) + (2 * scale), board.width, board.height);
    ctx.fillStyle = board.color;
    ctx.fillRect(-board.width * 0.5, -board.height * 0.5, board.width, board.height);
    ctx.fillStyle = "#0d1116";
    ctx.font = `${Math.max(8, 3.4 * scale)}px Bahnschrift`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(board.text, 0, 0);
    ctx.restore();
  }

  for (const prop of state.trackside.props) {
    ctx.save();
    ctx.translate(prop.x, prop.y);
    ctx.rotate(prop.angle);
    ctx.scale(prop.scale, prop.scale);
    if (prop.type === "tree") {
      ctx.fillStyle = "#3c2e1e";
      ctx.fillRect(-2 * scale, 0, 4 * scale, 12 * scale);
      ctx.fillStyle = "#2a6b3d";
      ctx.beginPath();
      ctx.arc(0, -4 * scale, 9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#47985d";
      ctx.beginPath();
      ctx.arc(6 * scale, -8 * scale, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === "light") {
      ctx.fillStyle = profile.supportColor;
      ctx.fillRect(-1.2 * scale, -12 * scale, 2.4 * scale, 24 * scale);
      ctx.fillStyle = "#f5f7fb";
      ctx.fillRect(-5 * scale, -14 * scale, 10 * scale, 3.2 * scale);
    } else if (prop.type === "tower") {
      ctx.fillStyle = profile.supportColor;
      ctx.fillRect(-4 * scale, -16 * scale, 8 * scale, 28 * scale);
      ctx.fillStyle = profile.buildingColor;
      ctx.fillRect(-8 * scale, -24 * scale, 16 * scale, 10 * scale);
    } else {
      ctx.fillStyle = profile.supportColor;
      ctx.beginPath();
      ctx.moveTo(-10 * scale, 8 * scale);
      ctx.lineTo(0, -8 * scale);
      ctx.lineTo(10 * scale, 8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = profile.buildingColor;
      ctx.fillRect(-8 * scale, 8 * scale, 16 * scale, 4 * scale);
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawStartGantry() {
  const start = pointAt(0);
  const scale = trackSpaceScale();
  const span = state.track.width * 0.68;
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(start.angle);
  ctx.fillStyle = "rgba(18,22,27,0.94)";
  ctx.fillRect(-2 * scale, -span, 4 * scale, span * 2);
  ctx.fillRect(-2 * scale, -span, 26 * scale, 4 * scale);
  ctx.fillRect(-2 * scale, span - (4 * scale), 26 * scale, 4 * scale);
  for (let index = 0; index < 5; index += 1) {
    ctx.fillStyle = index < 2 && state.mode === "countdown" ? "#ff6b35" : "#f3f5f9";
    ctx.beginPath();
    ctx.arc(12 * scale, ((index - 2) * 10 * scale), 2.6 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDrsMarkers() {
  ctx.save();
  ctx.lineWidth = 6;
  for (const [startRatio, endRatio] of state.trackConfig.drsZones) {
    for (const ratio of [startRatio, endRatio]) {
      const point = pointAt(ratio * state.track.total);
      ctx.strokeStyle = "rgba(17,215,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(point.x + (point.nx * state.track.width * 0.52), point.y + (point.ny * state.track.width * 0.52));
      ctx.lineTo(point.x - (point.nx * state.track.width * 0.52), point.y - (point.ny * state.track.width * 0.52));
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSectorMarkers() {
  ctx.save();
  ctx.lineWidth = Math.max(3, state.track.width * 0.03);
  SECTOR_RATIOS.slice(0, 2).forEach((ratio, index) => {
    const point = pointAt(ratio * state.track.total);
    ctx.strokeStyle = index === 0 ? "rgba(255,209,102,0.6)" : "rgba(94,226,122,0.6)";
    ctx.beginPath();
    ctx.moveTo(point.x + (point.nx * state.track.width * 0.5), point.y + (point.ny * state.track.width * 0.5));
    ctx.lineTo(point.x - (point.nx * state.track.width * 0.5), point.y - (point.ny * state.track.width * 0.5));
    ctx.stroke();
  });
  ctx.restore();
}

function drawCurbBands() {
  const scale = trackSpaceScale();
  for (const zone of state.trackside.curbZones) {
    const outer = buildOffsetPolyline(zone.startRatio, zone.endRatio, zone.side, state.track.width * 0.56, 18);
    const lineWidth = Math.max(8 * scale, state.track.width * 0.07 * zone.intensity);
    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "butt";
    for (let i = 0; i < outer.length - 1; i += 1) {
      const a = outer[i];
      const b = outer[i + 1];
      const even = i % 2 === 0;
      ctx.strokeStyle = even ? "#f7f9fd" : "#ff5f3a";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawStartGridSlots() {
  const slotCount = Math.min(state.cars.length, 12);
  const slotLength = collisionDistance() * 0.7;
  const slotWidth = collisionDistance() * 0.18;

  ctx.save();
  ctx.fillStyle = "rgba(248, 249, 251, 0.82)";
  for (let index = 0; index < slotCount; index += 1) {
    const slot = gridSlot(index);
    const marker = pointAt(slot.start);
    const x = marker.x + (marker.nx * slot.lane);
    const y = marker.y + (marker.ny * slot.lane);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(marker.angle);
    ctx.fillRect(-(slotLength * 0.5), -(slotWidth * 0.5), slotLength, slotWidth);
    ctx.restore();
  }
  ctx.restore();
}

function drawTrack() {
  drawTracksideBase();
  drawRunoffZones();
  drawPitLane();
  if (usesRealTrackGeometry()) {
    strokeTrack(state.track.width + 28, "rgba(0,0,0,0.24)");
    strokeTrack(state.track.width + 18, "rgba(255,255,255,0.08)");
    strokeTrack(state.track.width + 10, visuals.edge);
    strokeTrack(state.track.width + 3, "#f8f9fb");
    strokeTrack(state.track.width, "#40464d");
    strokeTrack(Math.max(6, state.track.width * 0.05), "rgba(255,255,255,0.08)", [26, 22]);
    drawCurbBands();
  } else {
    strokeTrack(state.track.width + 34, "rgba(0,0,0,0.24)");
    strokeTrack(state.track.width + 22, visuals.edge);
    strokeTrack(state.track.width + 8, "#f8f9fb");
    strokeTrack(state.track.width, "#40464d");
    strokeTrack(16, visuals.line, [16, 14]);
    drawCurbBands();
  }
  drawDrsMarkers();
  drawSectorMarkers();
  drawStartGridSlots();
  drawStartGantry();
  drawTracksideProps();

  const start = pointAt(0);
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(start.angle);
  const markerScale = usesRealTrackGeometry() ? trackSpaceScale() * 0.3 : 1;
  for (let i = -2; i <= 2; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "#f7f9fd" : "#16181c";
    ctx.fillRect(-8 * markerScale, i * 18 * markerScale, 38 * markerScale, 18 * markerScale);
  }
  ctx.restore();
}

function drawPickup(item) {
  if (!item.active) return;
  const slot = pointAt(item.distance);
  const x = slot.x + (slot.nx * item.lane);
  const y = slot.y + (slot.ny * item.lane) + (Math.sin(item.pulse) * 4);
  const size = 11 + (Math.sin(item.pulse * 1.7) * 1.8);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(vehicleScale(), vehicleScale());
  ctx.shadowBlur = 18;

  if (item.type === "boost") {
    ctx.fillStyle = visuals.boost;
    ctx.shadowColor = visuals.boost;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI / 4) * i;
      const radius = i % 2 === 0 ? size + 7 : size - 1;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (item.type === "shield") {
    ctx.fillStyle = visuals.shield;
    ctx.shadowColor = visuals.shield;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i - (Math.PI / 6);
      const px = Math.cos(angle) * (size + 5);
      const py = Math.sin(angle) * (size + 5);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (item.type === "repair") {
    ctx.fillStyle = visuals.repair;
    ctx.shadowColor = visuals.repair;
    ctx.fillRect(-5, -14, 10, 28);
    ctx.fillRect(-14, -5, 28, 10);
  } else {
    ctx.fillStyle = visuals.energy;
    ctx.shadowColor = visuals.energy;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 15);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawHazard(hazard) {
  if (!hazard.active) return;
  const slot = pointAt(hazard.distance);
  const x = slot.x + (slot.nx * hazard.lane);
  const y = slot.y + (slot.ny * hazard.lane);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(vehicleScale(), vehicleScale());
  if (hazard.type === "oil") {
    ctx.fillStyle = "rgba(12,14,18,0.88)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10 + (Math.sin(hazard.pulse) * 2), 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = visuals.debris;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-8 + (i * 6), -6 + (Math.sin(hazard.pulse + i) * 2));
      ctx.lineTo(-2 + (i * 7), 7);
      ctx.lineTo(6 + (i * 5), -4);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCar(driver) {
  ctx.save();
  ctx.translate(driver.x, driver.y);
  ctx.rotate(driver.angle);
  ctx.scale(vehicleScale(), vehicleScale());

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(-3, 0, 30, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  if (driver.shieldTimer > 0) {
    ctx.strokeStyle = "rgba(17,215,255,0.74)";
    ctx.lineWidth = 5;
    ctx.shadowBlur = 20;
    ctx.shadowColor = visuals.shield;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (driver.player && driver.magnetTimer > 0) {
    ctx.strokeStyle = "rgba(255,209,102,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 28 + (Math.sin(state.ambient * 8) * 2), 0, Math.PI * 2);
    ctx.stroke();
  }

  if (driver.boostTimer > 0) {
    const flame = ctx.createLinearGradient(-46, 0, -18, 0);
    flame.addColorStop(0, "rgba(255,120,54,0.1)");
    flame.addColorStop(0.55, "rgba(255,183,71,0.92)");
    flame.addColorStop(1, "rgba(255,241,179,0.98)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-22, -6);
    ctx.lineTo(-42 - (Math.random() * 12), 0);
    ctx.lineTo(-22, 6);
    ctx.fill();
  }

  if (driver.player) {
    ctx.strokeStyle = "rgba(255,226,122,0.42)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-24, -14, 48, 28);
  }

  ctx.fillStyle = "#0a0f14";
  ctx.fillRect(-24, -15, 7, 30);
  ctx.fillRect(18, -12, 8, 24);
  ctx.fillRect(-12, -18, 22, 6);
  ctx.fillRect(-12, 12, 22, 6);
  ctx.fillRect(7, -14, 16, 5);
  ctx.fillRect(7, 9, 16, 5);

  ctx.fillStyle = "#11161d";
  ctx.beginPath();
  ctx.moveTo(-21, -9);
  ctx.lineTo(7, -10);
  ctx.lineTo(20, -5);
  ctx.lineTo(24, 0);
  ctx.lineTo(20, 5);
  ctx.lineTo(7, 10);
  ctx.lineTo(-21, 9);
  ctx.closePath();
  ctx.fill();

  const bodyGradient = ctx.createLinearGradient(-20, 0, 22, 0);
  bodyGradient.addColorStop(0, driver.color);
  bodyGradient.addColorStop(0.58, driver.accent);
  bodyGradient.addColorStop(1, driver.color);
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(-19, -8);
  ctx.lineTo(8, -9);
  ctx.lineTo(18, -5);
  ctx.lineTo(22, 0);
  ctx.lineTo(18, 5);
  ctx.lineTo(8, 9);
  ctx.lineTo(-19, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(-14, -4);
  ctx.lineTo(10, -6);
  ctx.lineTo(14, -3);
  ctx.lineTo(-10, -1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0d131a";
  ctx.fillRect(-3, -11, 8, 22);
  ctx.fillRect(9, -4, 12, 8);
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(248,249,251,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-1, -9);
  ctx.lineTo(5, -5);
  ctx.lineTo(5, 5);
  ctx.lineTo(-1, 9);
  ctx.stroke();

  ctx.fillStyle = driver.accent;
  ctx.fillRect(-1.5, -14, 4, 28);
  ctx.fillStyle = "#f8f9fb";
  ctx.fillRect(14, -3, 5, 6);

  drawFlag(driver.flag, -2, -8, 12, 8);

  ctx.fillStyle = "#0b1015";
  ctx.font = "700 9px Bahnschrift";
  ctx.textAlign = "center";
  ctx.fillText(driver.number, 2, 4);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawMagnetLinks() {
  const me = player();
  if (me.magnetTimer <= 0) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255,209,102,0.3)";
  for (const item of state.pickups) {
    if (!item.active) continue;
    const slot = pointAt(item.distance);
    const x = slot.x + (slot.nx * item.lane);
    const y = slot.y + (slot.ny * item.lane);
    if (Math.hypot(me.x - x, me.y - y) < me.magnetRange + (70 * vehicleScale())) {
      ctx.beginPath();
      ctx.moveTo(me.x, me.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawRain() {
  if (!currentWeather().rain) return;
  ctx.save();
  ctx.strokeStyle = "rgba(180,220,255,0.5)";
  ctx.lineWidth = 2;
  for (const drop of rainParticles) {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - (drop.length * 0.22), drop.y + drop.length);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRadar() {
  const bounds = state.track.bounds;
  const radarSize = 184;
  const padding = 16;
  const outerX = WIDTH - radarSize - 26;
  const outerY = HEIGHT - radarSize - 26;
  const innerX = outerX + padding;
  const innerY = outerY + padding;
  const innerSize = radarSize - (padding * 2);
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const fitScale = Math.min(innerSize / spanX, innerSize / spanY);
  const offsetX = innerX + ((innerSize - (spanX * fitScale)) * 0.5);
  const offsetY = innerY + ((innerSize - (spanY * fitScale)) * 0.5);
  const projectPoint = (x, y) => ({
    x: offsetX + ((x - bounds.minX) * fitScale),
    y: offsetY + ((y - bounds.minY) * fitScale),
  });

  ctx.fillStyle = "rgba(7,20,29,0.84)";
  ctx.fillRect(outerX, outerY, radarSize, radarSize);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.strokeRect(outerX, outerY, radarSize, radarSize);
  ctx.fillStyle = "#f5f7fb";
  ctx.font = "700 14px Bahnschrift";
  ctx.fillText("Radar", outerX + 16, outerY + 22);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  state.track.points.forEach((point, index) => {
    const projected = projectPoint(point.x, point.y);
    if (index === 0) ctx.moveTo(projected.x, projected.y);
    else ctx.lineTo(projected.x, projected.y);
  });
  ctx.closePath();
  ctx.stroke();

  if (state.trackside?.pitLane?.points?.length) {
    ctx.strokeStyle = "rgba(17,215,255,0.44)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    state.trackside.pitLane.points.forEach((point, index) => {
      const projected = projectPoint(point.x, point.y);
      if (index === 0) ctx.moveTo(projected.x, projected.y);
      else ctx.lineTo(projected.x, projected.y);
    });
    ctx.stroke();
  }

  const start = projectPoint(state.track.points[0].x, state.track.points[0].y);
  ctx.fillStyle = "#ff6b35";
  ctx.fillRect(start.x - 3, start.y - 3, 6, 6);

  SECTOR_RATIOS.slice(0, 2).forEach((ratio, index) => {
    const point = pointAt(ratio * state.track.total);
    const projected = projectPoint(point.x, point.y);
    ctx.fillStyle = index === 0 ? "#ffd166" : "#5ee27a";
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  for (const car of state.cars) {
    const projected = projectPoint(car.x, car.y);
    ctx.fillStyle = car.player ? "#ffe27a" : "rgba(245,247,251,0.74)";
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, car.player ? 4.2 : 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCanvasHud() {
  if (!raceViewActive()) return;
  const me = player();
  const rank = standings();
  const playerIndex = rank.findIndex((driver) => driver.player);
  const sessionLabel = state.gameMode === "training"
    ? "Entreno"
    : state.sessionType === "qualifying"
      ? "Qualy"
      : state.gameMode === "championship"
        ? "Campeonato"
        : state.gameMode === "versus"
          ? "VS"
          : "Carrera";
  const rows = rank.slice(0, 5).map((driver, index) => ({
    driver,
    place: index + 1,
    separator: false,
  }));
  if (playerIndex >= 5) {
    rows.push({ separator: true });
    rows.push({ driver: me, place: playerIndex + 1, separator: false });
  }

  ctx.fillStyle = "rgba(7,20,29,0.82)";
  ctx.fillRect(22, 20, 280, 56 + (rows.length * 18));
  ctx.fillStyle = "#f5f7fb";
  ctx.font = "700 18px Bahnschrift";
  ctx.fillText(sessionLabel, 38, 46);
  ctx.font = "13px Bahnschrift";
  rows.forEach((entry, index) => {
    const rowY = 72 + (index * 18);
    if (entry.separator) {
      ctx.fillStyle = "rgba(245,247,251,0.4)";
      ctx.fillText("...", 38, rowY);
      return;
    }
    drawFlag(entry.driver.flag, 62, rowY - 10, 16, 10);
    ctx.fillStyle = entry.driver.player ? "#ffe27a" : "rgba(245,247,251,0.84)";
    const suffix = state.sessionType === "qualifying" ? ` ${formatTime(entry.driver.bestLapMs)}` : `${entry.driver.finished ? " META" : ""}`;
    ctx.fillText(`${entry.place}. ${entry.driver.name}${suffix}`, 38, rowY);
  });

  ctx.fillStyle = "rgba(7,20,29,0.82)";
  ctx.fillRect(WIDTH - 310, 20, 272, 136);
  ctx.fillStyle = "#f5f7fb";
  ctx.fillText(`${me.name} | ${state.trackConfig.name}`, WIDTH - 288, 46);
  ctx.fillStyle = "rgba(245,247,251,0.78)";
  ctx.fillText(`${SESSION_TYPES[state.sessionType].label} | ${currentWeather().label}`, WIDTH - 288, 68);
  ctx.fillText(`Comp ${compoundData(me.compound).label} | desgaste ${Math.round(me.tireWear)}%`, WIDTH - 288, 90);
  if (state.sessionType === "qualifying") {
    ctx.fillText(`Mejor ${formatTime(me.bestLapMs)} | reloj ${Math.ceil(state.qualifyingClock)} s`, WIDTH - 288, 112);
  } else {
    ctx.fillText(`Ultima ${formatTime(me.lastLapMs)} | DRS ${state.drsActive ? "ABIERTO" : "cerrado"}`, WIDTH - 288, 112);
  }
  const pitLabel = me.inPitLane ? "En boxes" : me.pitRequested ? `Pit ${compoundData(me.plannedCompound).label}` : "P sin boxes";
  ctx.fillText(`${pitLabel} | #${me.number}`, WIDTH - 288, 134);
  drawFlag(me.flag, WIDTH - 74, 34, 22, 14);
  drawRadar();

  ctx.fillStyle = "rgba(7,20,29,0.82)";
  ctx.fillRect(22, HEIGHT - 142, 320, 120);
  ctx.fillStyle = "#f5f7fb";
  ctx.fillText("Neumaticos y Sectores", 38, HEIGHT - 112);
  ctx.fillStyle = "rgba(245,247,251,0.78)";
  ctx.fillText(`Compuesto ${compoundData(me.compound).label} | Edad ${Math.round(me.tireAge)} s`, 38, HEIGHT - 88);
  ctx.fillText(`Grip ${compoundGripFactor(me).toFixed(2)} | Vel ${compoundSpeedFactor(me).toFixed(2)}`, 38, HEIGHT - 68);
  ctx.fillText(`S1 ${formatTime(me.lastSectorTimes[0])}  S2 ${formatTime(me.lastSectorTimes[1])}  S3 ${formatTime(me.lastSectorTimes[2])}`, 38, HEIGHT - 46);
  if (state.sectorFlash.ttl > 0) {
    const sectorColor = state.sectorFlash.delta <= 0 ? "#5ee27a" : "#ffd166";
    ctx.fillStyle = sectorColor;
    ctx.fillText(`Sector ${state.sectorFlash.index + 1} ${formatDelta(state.sectorFlash.delta)}`, 38, HEIGHT - 26);
  } else {
    ctx.fillText(`Mejor vuelta ${formatTime(me.bestLapMs || state.save.bestLaps[state.trackConfig.id] || 0)}`, 38, HEIGHT - 26);
  }

  if (state.mode === "countdown") {
    ctx.font = "900 86px Impact";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.textAlign = "center";
    ctx.fillText(countdownLabel(), WIDTH / 2, 110);
    ctx.textAlign = "left";
  }
}

function drawScene() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();

  const shakeX = (Math.random() - 0.5) * state.shake;
  const shakeY = (Math.random() - 0.5) * state.shake;
  ctx.save();
  ctx.translate((WIDTH / 2) + shakeX, (HEIGHT / 2) + shakeY);
  ctx.scale(state.camera.zoom, state.camera.zoom);
  ctx.translate(-state.camera.x, -state.camera.y);
  drawTrack();
  state.hazards.forEach(drawHazard);
  state.pickups.forEach(drawPickup);
  drawMagnetLinks();
  [...state.cars].sort((a, b) => a.player - b.player).forEach(drawCar);
  ctx.restore();
  if (currentWeather().tint) {
    ctx.fillStyle = currentWeather().tint;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  drawRain();
  drawCanvasHud();
}

function update(dt) {
  syncShellMode();
  state.ambient += dt;
  state.shake = Math.max(0, state.shake - (18 * dt));
  updateRain(dt);
  updateCamera(dt);

  for (const item of state.pickups) item.pulse += dt * 0.4;
  for (const hazard of state.hazards) hazard.pulse += dt * 0.4;

  if (state.message.ttl > 0) {
    state.message.ttl -= dt;
  }
  if (state.sectorFlash.ttl > 0) {
    state.sectorFlash.ttl -= dt;
  }

  if (state.mode === "garage" || state.mode === "finished") {
    updateHud();
    return;
  }

  const me = player();
  me.boostTimer = Math.max(0, me.boostTimer - dt);
  me.shieldTimer = Math.max(0, me.shieldTimer - dt);
  me.magnetTimer = Math.max(0, me.magnetTimer - dt);

  if (state.mode === "countdown") {
    state.countdown -= dt;
    setOverlay(countdownLabel(), state.sessionType === "qualifying" ? "Lanza la vuelta y construye temperatura en los neumaticos." : "Gestiona energia, usa DRS en recta y evita hazards al salir de curva.", true);
    if (state.countdown <= -0.35) {
      state.mode = "racing";
      setOverlay("", "", false);
      setMessage(state.sessionType === "qualifying" ? "Qualy lanzada." : "Carrera lanzada.", 1.8);
    }
    updateHud();
    return;
  }

  state.raceTime += dt;
  if (state.sessionType === "qualifying") {
    state.qualifyingClock = Math.max(0, state.qualifyingClock - dt);
  }
  updatePlayer(me, dt);
  rivals().forEach((driver) => updateAi(driver, dt));
  updatePickups(dt);
  updateHazards(dt);
  resolveCollisions(dt);

  if (me.integrity <= 0) {
    if (state.sessionType === "qualifying") finishQualifying();
    else finishRace(true);
  } else if (state.sessionType === "qualifying" && state.qualifyingClock <= 0) {
    finishQualifying();
  } else if (me.finished) {
    finishRace(false);
  }

  updateHud();
}

function frame(now) {
  const dt = Math.min((now - state.last) / 1000, 0.033);
  state.last = now;
  update(dt);
  drawScene();
  requestAnimationFrame(frame);
}

function isControlKey(code) {
  return [
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "KeyW", "KeyA", "KeyS", "KeyD",
    "Space", "ShiftLeft", "ShiftRight", "KeyQ", "KeyE", "KeyP",
  ].includes(code);
}

window.addEventListener("keydown", (event) => {
  keys[event.code] = true;
  if (isControlKey(event.code) || event.code === "Enter") {
    event.preventDefault();
  }

  if (event.code === "Enter" && !event.repeat && (state.mode === "garage" || state.mode === "finished")) {
    startRace();
    return;
  }

  if (state.mode !== "racing" || event.repeat) return;

  if (event.code === "Space") activateBoost();
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") activateShield();
  if (event.code === "KeyQ") activateMagnet();
  if (event.code === "KeyE") activateRepair();
  if (event.code === "KeyP") togglePitRequest();
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

ui.startRaceBtn.addEventListener("click", () => startRace());

ui.garageTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-garage-tab]");
  if (!button) return;
  setGarageTab(button.dataset.garageTab);
});

ui.sessionChips.forEach((button) => {
  button.addEventListener("click", () => {
    setGarageTab(button.dataset.garageTab);
  });
});

ui.trackSearchInput.addEventListener("input", (event) => {
  state.trackFilter = event.target.value;
  refreshTrackSelector();
});

ui.trackGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-track-index]");
  if (!button) return;
  selectTrack(button.dataset.trackIndex);
});

ui.weatherButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-weather]");
  if (!button) return;
  selectWeather(button.dataset.weather);
});

ui.gameModeButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-game-mode]");
  if (!button) return;
  selectGameMode(button.dataset.gameMode);
});

ui.sessionTypeButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-session-type]");
  if (!button) return;
  selectSessionType(button.dataset.sessionType);
});

ui.compoundButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-compound]");
  if (!button) return;
  selectCompound(button.dataset.compound);
});

ui.driverGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-driver]");
  if (!button) return;
  selectDriver(button.dataset.driver);
});

ui.upgradeGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-upgrade]");
  if (!button) return;
  buyUpgrade(button.dataset.upgrade);
});

ui.trackScaleInput.addEventListener("input", (event) => {
  updateScalePreview("trackScale", event.target.value);
});

ui.physicsScaleInput.addEventListener("input", (event) => {
  updateScalePreview("physicsScale", event.target.value);
});

ui.cameraZoomInput.addEventListener("input", (event) => {
  updateScalePreview("cameraZoom", event.target.value);
});

ui.opponentCountInput.addEventListener("input", (event) => {
  const nextCount = normalizeOpponentCount(event.target.value, state.gameMode);
  ui.opponentCountValue.textContent = `${nextCount} rivales`;
});

ui.trackScaleInput.addEventListener("change", (event) => {
  applyScaleSetting("trackScale", event.target.value);
});

ui.physicsScaleInput.addEventListener("change", (event) => {
  applyScaleSetting("physicsScale", event.target.value);
});

ui.cameraZoomInput.addEventListener("change", (event) => {
  applyScaleSetting("cameraZoom", event.target.value);
});

ui.opponentCountInput.addEventListener("change", (event) => {
  selectOpponentCount(event.target.value);
});

ui.resetScaleBtn.addEventListener("click", () => resetScaleSettings());

configureEnvironment(true);
syncShellMode();
setMessage(defaultMessage(), 0);
showGarageOverlay();
requestAnimationFrame(frame);

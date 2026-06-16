import fs from "node:fs";
import path from "node:path";

const SOURCE_ROOT = process.env.F1_CIRCUITS_SVG_ROOT || "c:/Users/juanf/Downloads/f1-circuits-svg-main/f1-circuits-svg-main";
const CIRCUITS_JSON = path.join(SOURCE_ROOT, "circuits.json");
const SVG_DIR = path.join(SOURCE_ROOT, "circuits", "white-outline");

const TRACK_ORDER = [
  "melbourne",
  "shanghai",
  "suzuka",
  "bahrain",
  "jeddah",
  "miami",
  "monaco",
  "catalunya",
  "madring",
  "montreal",
  "spielberg",
  "silverstone",
  "spa-francorchamps",
  "hungaroring",
  "zandvoort",
  "monza",
  "baku",
  "marina-bay",
  "austin",
  "mexico-city",
  "interlagos",
  "las-vegas",
  "lusail",
  "yas-marina",
];

const PALETTES = {
  park: { grassA: "#1d442c", grassB: "#4a8a58", skyTop: "#121c28", skyBottom: "#40627a", accent: "#ffd166" },
  forest: { grassA: "#133826", grassB: "#2f6d53", skyTop: "#0e1724", skyBottom: "#25516b", accent: "#5ae3ff" },
  desert: { grassA: "#4a3820", grassB: "#8d6c3d", skyTop: "#16161d", skyBottom: "#5c4530", accent: "#ffb35c" },
  coastal: { grassA: "#12354a", grassB: "#23708a", skyTop: "#081521", skyBottom: "#1b4764", accent: "#6ef3ff" },
  street: { grassA: "#20242c", grassB: "#39424f", skyTop: "#0b0f15", skyBottom: "#2a3345", accent: "#ffd24d" },
  night: { grassA: "#10243a", grassB: "#1b4760", skyTop: "#07111e", skyBottom: "#13405d", accent: "#11d7ff" },
  tropic: { grassA: "#21472a", grassB: "#568e3f", skyTop: "#131823", skyBottom: "#42536b", accent: "#ffd24d" },
  europe: { grassA: "#20492e", grassB: "#3f7042", skyTop: "#121f2c", skyBottom: "#38586e", accent: "#ff6740" },
  neon: { grassA: "#1c2131", grassB: "#313d63", skyTop: "#090d18", skyBottom: "#202f58", accent: "#ff6be3" },
};

const PROFILES = {
  power: {
    description: "Layout real importado desde SVG vectorial. Rectas largas, frenadas fuertes y aceleracion clave a la salida de curva lenta.",
    signature: "Pista de potencia con grandes ventanas de adelantamiento.",
    pickupPlan: [
      { ratio: 0.07, type: "boost", lane: -5 },
      { ratio: 0.2, type: "energy", lane: 9 },
      { ratio: 0.34, type: "shield", lane: -8 },
      { ratio: 0.51, type: "boost", lane: 6 },
      { ratio: 0.68, type: "repair", lane: -7 },
      { ratio: 0.85, type: "energy", lane: 9 },
    ],
    hazardPlan: [
      { ratio: 0.28, type: "debris", lane: 6 },
      { ratio: 0.63, type: "oil", lane: -4 },
      { ratio: 0.81, type: "debris", lane: 7 },
    ],
  },
  balanced: {
    description: "Layout real importado desde SVG vectorial. Mezcla de rectas medias, apoyos enlazados y varias trazadas de compromiso.",
    signature: "Setup equilibrado y ritmo constante en todo el giro.",
    pickupPlan: [
      { ratio: 0.09, type: "energy", lane: -7 },
      { ratio: 0.22, type: "boost", lane: 8 },
      { ratio: 0.38, type: "shield", lane: -9 },
      { ratio: 0.55, type: "repair", lane: 6 },
      { ratio: 0.71, type: "boost", lane: -7 },
      { ratio: 0.88, type: "energy", lane: 9 },
    ],
    hazardPlan: [
      { ratio: 0.26, type: "oil", lane: -4 },
      { ratio: 0.57, type: "debris", lane: 7 },
      { ratio: 0.79, type: "oil", lane: -6 },
    ],
  },
  technical: {
    description: "Layout real importado desde SVG vectorial. Sector tecnico, cambios de apoyo y curvas de paciencia donde importa mucho el coche completo.",
    signature: "Mas grip mecanico, menos errores y mucha precision de volante.",
    pickupPlan: [
      { ratio: 0.08, type: "energy", lane: -6 },
      { ratio: 0.24, type: "shield", lane: 7 },
      { ratio: 0.41, type: "boost", lane: -8 },
      { ratio: 0.58, type: "repair", lane: 6 },
      { ratio: 0.74, type: "energy", lane: -7 },
      { ratio: 0.9, type: "shield", lane: 8 },
    ],
    hazardPlan: [
      { ratio: 0.19, type: "oil", lane: -5 },
      { ratio: 0.49, type: "debris", lane: 7 },
      { ratio: 0.77, type: "oil", lane: -6 },
    ],
  },
  street: {
    description: "Layout real importado desde SVG vectorial. Muros cerca, secciones lentas y rectas cortadas por grandes frenadas.",
    signature: "Trazado urbano donde el margen de error es minimo.",
    pickupPlan: [
      { ratio: 0.1, type: "shield", lane: -5 },
      { ratio: 0.27, type: "energy", lane: 6 },
      { ratio: 0.45, type: "boost", lane: -6 },
      { ratio: 0.63, type: "repair", lane: 5 },
      { ratio: 0.82, type: "shield", lane: -6 },
    ],
    hazardPlan: [
      { ratio: 0.22, type: "debris", lane: 5 },
      { ratio: 0.52, type: "oil", lane: -4 },
      { ratio: 0.78, type: "debris", lane: 6 },
    ],
  },
  hybrid: {
    description: "Layout real importado desde SVG vectorial. Mezcla de secciones urbanas y zonas permanentes con curvas de radio cambiante.",
    signature: "Compromiso entre velocidad punta, traccion y apoyo sostenido.",
    pickupPlan: [
      { ratio: 0.08, type: "boost", lane: -6 },
      { ratio: 0.23, type: "energy", lane: 7 },
      { ratio: 0.4, type: "shield", lane: -8 },
      { ratio: 0.56, type: "repair", lane: 6 },
      { ratio: 0.72, type: "boost", lane: -7 },
      { ratio: 0.89, type: "energy", lane: 8 },
    ],
    hazardPlan: [
      { ratio: 0.18, type: "oil", lane: -4 },
      { ratio: 0.46, type: "debris", lane: 7 },
      { ratio: 0.76, type: "debris", lane: 6 },
    ],
  },
  endurance: {
    description: "Layout real importado desde SVG vectorial. Vuelta larga, velocidad alta y sectores muy distintos que exigen buena gestion del ritmo.",
    signature: "Circuito extenso con cambios grandes de energia y compromiso aerodinamico.",
    pickupPlan: [
      { ratio: 0.06, type: "boost", lane: -7 },
      { ratio: 0.19, type: "energy", lane: 9 },
      { ratio: 0.33, type: "shield", lane: -8 },
      { ratio: 0.5, type: "boost", lane: 7 },
      { ratio: 0.66, type: "repair", lane: -8 },
      { ratio: 0.81, type: "energy", lane: 8 },
      { ratio: 0.93, type: "shield", lane: -9 },
    ],
    hazardPlan: [
      { ratio: 0.22, type: "debris", lane: 6 },
      { ratio: 0.47, type: "oil", lane: -5 },
      { ratio: 0.73, type: "debris", lane: 7 },
    ],
  },
};

const META = {
  melbourne: { name: "Melbourne", inspiredBy: "Melbourne Grand Prix Circuit", referenceLengthKm: 5.278, referenceTurns: 14, width: 15, palette: "park", profile: "balanced", drsZones: [[0.1, 0.18], [0.64, 0.76]] },
  shanghai: { name: "Shanghai", inspiredBy: "Shanghai International Circuit", referenceLengthKm: 5.451, referenceTurns: 16, width: 16, palette: "park", profile: "power", drsZones: [[0.03, 0.16], [0.53, 0.65]] },
  suzuka: { name: "Suzuka", inspiredBy: "Suzuka Circuit", referenceLengthKm: 5.807, referenceTurns: 18, width: 16, palette: "forest", profile: "technical", drsZones: [[0.79, 0.91]] },
  bahrain: { name: "Bahrain", inspiredBy: "Bahrain International Circuit", referenceLengthKm: 5.412, referenceTurns: 15, width: 15, palette: "desert", profile: "power", drsZones: [[0.04, 0.15], [0.19, 0.28], [0.55, 0.67]] },
  jeddah: { name: "Jeddah", inspiredBy: "Jeddah Corniche Circuit", referenceLengthKm: 6.174, referenceTurns: 27, width: 15, palette: "coastal", profile: "endurance", drsZones: [[0.05, 0.15], [0.31, 0.41], [0.7, 0.81]] },
  miami: { name: "Miami", inspiredBy: "Miami International Autodrome", referenceLengthKm: 5.412, referenceTurns: 19, width: 15, palette: "coastal", profile: "hybrid", drsZones: [[0.08, 0.2], [0.56, 0.68], [0.82, 0.92]] },
  monaco: { name: "Monaco", inspiredBy: "Circuit de Monaco", referenceLengthKm: 3.337, referenceTurns: 19, width: 12, palette: "street", profile: "street", drsZones: [[0.58, 0.7]] },
  catalunya: { name: "Barcelona", inspiredBy: "Circuit de Barcelona-Catalunya", referenceLengthKm: 4.657, referenceTurns: 14, width: 15, palette: "europe", profile: "balanced", drsZones: [[0.07, 0.18], [0.55, 0.69]] },
  madring: { name: "Madrid", inspiredBy: "Madring", referenceLengthKm: 5.416, referenceTurns: 22, width: 12, palette: "neon", profile: "hybrid", drsZones: [[0.06, 0.16], [0.58, 0.69], [0.86, 0.95]] },
  montreal: { name: "Montreal", inspiredBy: "Circuit Gilles Villeneuve", referenceLengthKm: 4.361, referenceTurns: 14, width: 15, palette: "park", profile: "power", drsZones: [[0.09, 0.2], [0.44, 0.56], [0.82, 0.93]] },
  spielberg: { name: "Red Bull Ring", inspiredBy: "Red Bull Ring", referenceLengthKm: 4.318, referenceTurns: 10, width: 15, palette: "europe", profile: "power", drsZones: [[0.02, 0.15], [0.24, 0.34], [0.62, 0.74]] },
  silverstone: { name: "Silverstone", inspiredBy: "Silverstone Circuit", referenceLengthKm: 5.891, referenceTurns: 18, width: 15, palette: "park", profile: "endurance", drsZones: [[0.11, 0.22], [0.57, 0.69]] },
  "spa-francorchamps": { name: "Spa", inspiredBy: "Circuit de Spa-Francorchamps", referenceLengthKm: 7.004, referenceTurns: 19, width: 15, palette: "forest", profile: "endurance", drsZones: [[0.04, 0.16], [0.47, 0.59]] },
  hungaroring: { name: "Hungaroring", inspiredBy: "Hungaroring", referenceLengthKm: 4.381, referenceTurns: 14, width: 14, palette: "park", profile: "technical", drsZones: [[0.04, 0.15]] },
  zandvoort: { name: "Zandvoort", inspiredBy: "Circuit Park Zandvoort", referenceLengthKm: 4.259, referenceTurns: 14, width: 14, palette: "coastal", profile: "technical", drsZones: [[0.05, 0.17], [0.78, 0.89]] },
  monza: { name: "Monza", inspiredBy: "Autodromo Nazionale Monza", referenceLengthKm: 5.793, referenceTurns: 11, width: 14, palette: "europe", profile: "power", drsZones: [[0.03, 0.16], [0.57, 0.7]] },
  baku: { name: "Baku", inspiredBy: "Baku City Circuit", referenceLengthKm: 6.003, referenceTurns: 20, width: 15, palette: "street", profile: "street", drsZones: [[0.03, 0.15], [0.47, 0.59]] },
  "marina-bay": { name: "Singapore", inspiredBy: "Marina Bay Street Circuit", referenceLengthKm: 4.928, referenceTurns: 19, width: 13, palette: "night", profile: "street", drsZones: [[0.08, 0.18], [0.51, 0.62], [0.84, 0.93]] },
  austin: { name: "Austin", inspiredBy: "Circuit of the Americas", referenceLengthKm: 5.513, referenceTurns: 20, width: 16, palette: "park", profile: "hybrid", drsZones: [[0.1, 0.22], [0.5, 0.62]] },
  "mexico-city": { name: "Mexico City", inspiredBy: "Autodromo Hermanos Rodriguez", referenceLengthKm: 4.304, referenceTurns: 17, width: 15, palette: "tropic", profile: "power", drsZones: [[0.04, 0.18], [0.5, 0.63], [0.85, 0.95]] },
  interlagos: { name: "Interlagos", inspiredBy: "Autodromo Jose Carlos Pace", referenceLengthKm: 4.309, referenceTurns: 15, width: 15, palette: "tropic", profile: "balanced", drsZones: [[0.02, 0.12], [0.83, 0.94]] },
  "las-vegas": { name: "Las Vegas", inspiredBy: "Las Vegas Street Circuit", referenceLengthKm: 6.201, referenceTurns: 17, width: 15, palette: "neon", profile: "power", drsZones: [[0.1, 0.21], [0.38, 0.53], [0.74, 0.88]] },
  lusail: { name: "Lusail", inspiredBy: "Lusail International Circuit", referenceLengthKm: 5.419, referenceTurns: 16, width: 16, palette: "desert", profile: "balanced", drsZones: [[0.08, 0.19], [0.55, 0.67]] },
  "yas-marina": { name: "Yas Marina", inspiredBy: "Yas Marina Circuit", referenceLengthKm: 5.281, referenceTurns: 16, width: 15, palette: "night", profile: "hybrid", drsZones: [[0.04, 0.17], [0.43, 0.56]] },
};

function loadRepoCircuits() {
  return JSON.parse(fs.readFileSync(CIRCUITS_JSON, "utf8"));
}

function currentLayoutFor(circuitId, circuits) {
  const circuit = circuits.find((entry) => entry.id === circuitId);
  if (!circuit) throw new Error(`Circuit ${circuitId} not found in circuits.json`);
  const layout = circuit.layouts.find((entry) => /2026/.test(entry.seasons));
  if (!layout) throw new Error(`No 2026 layout found for ${circuitId}`);
  return { circuit, layout };
}

function extractPath(layoutId) {
  const svgPath = path.join(SVG_DIR, `${layoutId}.svg`);
  const svg = fs.readFileSync(svgPath, "utf8");
  const match = svg.match(/d="([^"]+)"/);
  if (!match) throw new Error(`No path found in ${svgPath}`);
  return match[1];
}

function layoutKey(layoutId) {
  return layoutId;
}

function buildTrackCatalog(circuits) {
  return TRACK_ORDER.map((circuitId) => {
    const { circuit, layout } = currentLayoutFor(circuitId, circuits);
    const meta = META[circuitId];
    if (!meta) throw new Error(`Missing metadata for ${circuitId}`);
    const palette = PALETTES[meta.palette];
    const profile = PROFILES[meta.profile];
    return {
      id: layout.layoutId,
      circuitId,
      name: meta.name,
      description: profile.description,
      inspiredBy: meta.inspiredBy || circuit.name,
      referenceLengthKm: meta.referenceLengthKm,
      referenceTurns: meta.referenceTurns,
      signature: `Layout ${layout.layoutId}. ${profile.signature}`,
      layoutId: layout.layoutId,
      seasons: layout.seasons,
      license: "CC-BY-4.0",
      width: meta.width,
      palette,
      pickupPlan: profile.pickupPlan,
      hazardPlan: profile.hazardPlan,
      drsZones: meta.drsZones,
      laps: 3,
    };
  });
}

function buildLayoutMap(circuits) {
  const entries = TRACK_ORDER.map((circuitId) => {
    const { layout } = currentLayoutFor(circuitId, circuits);
    const key = layoutKey(layout.layoutId);
    return [key, {
      layoutId: layout.layoutId,
      source: "julesr0y/f1-circuits-svg",
      license: "CC-BY-4.0",
      path: extractPath(layout.layoutId),
    }];
  });
  return Object.fromEntries(entries);
}

function emitRealTrackData(layoutMap) {
  const lines = [];
  lines.push("window.REAL_TRACK_LAYOUTS = Object.freeze({");
  for (const [key, value] of Object.entries(layoutMap)) {
    lines.push(`  ${JSON.stringify(key)}: {`);
    lines.push(`    layoutId: ${JSON.stringify(value.layoutId)},`);
    lines.push(`    source: ${JSON.stringify(value.source)},`);
    lines.push(`    license: ${JSON.stringify(value.license)},`);
    lines.push(`    path: ${JSON.stringify(value.path)},`);
    lines.push("  },");
  }
  lines.push("});");
  lines.push("");
  return lines.join("\n");
}

function emitTrackCatalog(catalog) {
  return `window.REAL_TRACK_CATALOG = Object.freeze(${JSON.stringify(catalog, null, 2)});\n`;
}

function main() {
  const circuits = loadRepoCircuits();
  const catalog = buildTrackCatalog(circuits);
  const layoutMap = buildLayoutMap(circuits);
  fs.writeFileSync(path.resolve("real-track-data.js"), emitRealTrackData(layoutMap));
  fs.writeFileSync(path.resolve("generated-track-catalog.js"), emitTrackCatalog(catalog));
  console.log(`Generated ${catalog.length} current-season tracks.`);
}

main();

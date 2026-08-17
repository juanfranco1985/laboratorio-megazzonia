export const LEVEL_LENGTH = 17200;

export const ART = Object.freeze({
  backgrounds: Object.freeze({
    plumerillo: "assets/art/plumerillo_camp_v1.png",
    quebrada: "assets/art/los_patos_quebrada_v1.png",
    andes: "assets/art/andes_dawn_v1.png",
  }),
  sanMartin: "assets/art/san_martin_v1.png",
  sanMartinAtlas: "assets/art/san_martin_states_atlas_v4.png",
  sanMartinWalkAtlas: "assets/art/san_martin_walk_atlas_v3.png",
  expeditionAtlas: "assets/art/expedition_sprite_atlas_v1.png",
  propsAtlas: "assets/art/mountain_props_atlas_v1.png",
  logisticsAtlas: "assets/art/expedition_logistics_atlas_v1.png",
});

export const CHAPTERS = Object.freeze([
  { name: "El Plumerillo", short: "PREPARACIÓN", start: 0, end: 2400, objective: "Prepara provisiones, equipo y carga antes de partir", background: "plumerillo", tint: "rgba(214,164,91,0.035)", cold: .55, terrain: ["#7b644b", "#342c25"] },
  { name: "Salida de Mendoza", short: "LA PARTIDA", start: 2400, end: 4700, objective: "Conduce el convoy hacia la precordillera", background: "quebrada", tint: "rgba(156,177,188,0.035)", cold: .72, terrain: ["#705d48", "#302b27"] },
  { name: "Quebrada del río", short: "EL PUENTE", start: 4700, end: 7200, objective: "Organiza a la columna y despliega el puente portátil", background: "quebrada", tint: "rgba(83,128,151,0.055)", cold: .88, terrain: ["#625848", "#292827"] },
  { name: "Cuesta del Espinacito", short: "EL ASCENSO", start: 7200, end: 10000, objective: "Supera las pendientes sin perder la carga", background: "andes", tint: "rgba(86,126,159,0.07)", cold: 1.08, terrain: ["#55504a", "#242628"] },
  { name: "Noche en la cordillera", short: "LA NOCHE", start: 10000, end: 12300, objective: "Alcanza el vivac y conserva el abrigo", background: "andes", tint: "rgba(8,26,60,0.36)", cold: 1.3, terrain: ["#414852", "#20252c"] },
  { name: "Paso de alta montaña", short: "ALTA MONTAÑA", start: 12300, end: 14800, objective: "Avanza en fila y resiste el viento de la cumbre", background: "andes", tint: "rgba(207,230,241,0.15)", cold: 1.68, terrain: ["#48515a", "#22282f"] },
  { name: "Descenso al Aconcagua", short: "EL DESCENSO", start: 14800, end: 17200, objective: "Reúne la columna y desciende hacia el valle", background: "quebrada", tint: "rgba(226,174,92,0.065)", cold: .94, terrain: ["#695846", "#302a26"] },
]);

export const TERRAIN_POINTS = Object.freeze([
  [0, 566], [700, 560], [1400, 552], [2000, 540], [2400, 526],
  [3000, 500], [3800, 466], [4700, 438], [5300, 402], [5680, 382],
  [6140, 348], [6600, 330], [7200, 292], [7800, 220], [8400, 126],
  [9000, 28], [9600, -62], [10000, -118], [10800, -146], [11600, -186],
  [12300, -232], [13200, -318], [14000, -382], [14800, -420],
  [15400, -344], [16000, -226], [16600, -78], [17200, 96],
]);

export const WORLD_LAYOUT = Object.freeze({
  preparationGate: 2220,
  preparationStations: Object.freeze([
    { id: "rations", x: 520, frame: 3, label: "CARGAR RACIONES" },
    { id: "equipment", x: 1040, frame: 1, label: "REVISAR EQUIPO" },
    { id: "bridgeKit", x: 1580, frame: 6, label: "EMBALAR PUENTE PORTÁTIL" },
  ]),
  bridge: Object.freeze({ start: 5680, end: 6140, siteX: 5530 }),
  pits: Object.freeze([{ start: 5680, end: 6140, kind: "bridge" }]),
  rocks: Object.freeze([3180, 4100, 7560, 8420, 9360, 12880, 13920, 16040]),
  branches: Object.freeze([3640]),
  iceRidges: Object.freeze([12640, 13480, 14320]),
  supplies: Object.freeze([4320, 10720, 15180]),
  rescues: Object.freeze([8120, 13180, 15840]),
  camps: Object.freeze([11180, 14120]),
  checkpoints: Object.freeze([2320, 4620, 7120, 9920, 12220, 14720]),
});

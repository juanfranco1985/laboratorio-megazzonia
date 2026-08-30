export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const WORLD_WIDTH = 4600;
export const SAVE_KEY = "juego-delfi-2-save-v2";

const p = (x, y, key, width, height) => ({ x, y, key, width, height });
const e = (type, x, y, minX, maxX) => ({ type, x, y, minX, maxX });

export const praderaFlow = Object.freeze({
  boats:[
    {id:"ida",fromX:430,toX:920,requiresCrystal:null,label:"Bote hacia la Estructura del Tronco"},
    {id:"regreso",fromX:2140,toX:2550,requiresCrystal:0,label:"Bote de regreso al Molino"},
  ],
  gates:[
    {id:"henal",x:3415,requiresCrystal:1,label:"La energía de la gema del Molino abre el Henal"},
    {id:"jardin",x:4200,requiresCrystal:2,label:"La gema del Henal abre el Jardín del Portal"},
  ],
  zones:[
    {id:"llegada",from:0,to:500},
    {id:"tronco",from:850,to:2230},
    {id:"molino",from:2500,to:3415},
    {id:"henal",from:3415,to:4200},
    {id:"portal",from:4200,to:4600},
  ],
});

export const worlds = [
  {
    id: "pradera", name: "PRADERA", tint: 0xa8e46a, ground: "ground-platform", ledge: "flower-ledge", bridge: "wooden-bridge",
    bounce: "hay-bounce-pad", hazard: "slime-slow-zone", portal: "portal-frame", power: "fire",
    lesson: "Viaja en bote, explora el Tronco, corona el Molino y atraviesa el Henal.",
    platforms:[
      p(230,665,"ground-platform",460,120),p(430,620,"wooden-bridge",150,60),
      p(980,665,"ground-platform",260,120),p(1130,610,"flower-ledge",150,65),p(1270,535,"flower-ledge",150,65),p(1110,455,"flower-ledge",170,65),p(1280,375,"flower-ledge",170,65),p(1480,295,"flower-ledge",220,65),p(1690,295,"wooden-bridge",200,65),p(1860,320,"flower-ledge",180,70),p(1970,435,"flower-ledge",150,65),p(2070,545,"flower-ledge",150,65),p(2140,620,"wooden-bridge",180,60),
      p(2700,665,"ground-platform",400,120),p(3220,665,"ground-platform",360,120),p(2660,590,"flower-ledge",160,65),p(2780,515,"flower-ledge",160,65),p(2650,440,"flower-ledge",160,65),p(2790,365,"flower-ledge",160,65),p(3060,600,"wooden-bridge",140,65),p(3180,525,"flower-ledge",140,65),p(3070,450,"wooden-bridge",140,65),p(3210,375,"flower-ledge",140,65),p(2940,295,"wooden-bridge",300,65),p(3000,235,"flower-ledge",180,60),p(3260,420,"wooden-bridge",220,65),p(3360,540,"wooden-bridge",180,65),
      p(3560,665,"ground-platform",280,120),p(3890,665,"ground-platform",360,120),p(4140,665,"ground-platform",120,120),p(3500,565,"flower-ledge",160,65),p(3650,490,"flower-ledge",170,65),p(3800,420,"flower-ledge",170,65),p(3980,370,"flower-ledge",190,70),p(4080,490,"flower-ledge",150,65),
      p(4400,665,"ground-platform",400,120)
    ],
    bounceAt:[3650,585], checkpointAt:[2580,535], portalAt:[4450,530],
    hazards:[{x:3780,y:610,kind:"slow"},{x:4050,y:610,kind:"damage"}],
    crystals:[[1860,185],[3000,110],[3980,255]],
    enemies:[e("snail",1060,520,970,1150),e("crab",2700,500,2580,2820),e("hopper",3890,250,3780,4010)],
  },
  {
    id:"desierto", name:"DESIERTO", tint:0xf4c36a, ground:"ground-platform", ledge:"short-ledge", bridge:"awning-bridge", bounce:"palm-bounce-pad", hazard:"cactus-hazard", portal:"portal-frame", power:"water",
    lesson:"Usa las plataformas altas y evita los cactus.",
    platforms:[p(250,665,"ground-platform",480,120),p(710,610,"awning-bridge",300,90),p(1080,525,"short-ledge",250,90),p(1450,665,"ground-platform",420,120),p(1840,575,"short-ledge",250,90),p(2220,490,"awning-bridge",330,90),p(2640,665,"ground-platform",470,120),p(3080,570,"short-ledge",260,90),p(3490,665,"ground-platform",460,120),p(3950,575,"awning-bridge",320,90),p(4380,665,"ground-platform",500,120)],
    bounceAt:[2860,585], checkpointAt:[2310,405], portalAt:[4420,530], hazards:[{x:1570,y:600,kind:"damage"},{x:3600,y:600,kind:"damage"}], crystals:[[1060,400],[2240,365],[3940,455]], enemies:[e("crab",1340,585,1250,1510),e("hopper",3270,500,3140,3400)],
  },
  {
    id:"oceano", name:"OCÉANO", tint:0x6ee6ed, ground:"ground-platform", ledge:"shell-ledge", bridge:"dock-bridge", bounce:"pearl-bounce-pad", hazard:"water-spout", portal:"portal-frame", power:"ice",
    lesson:"Sincroniza los saltos con los surtidores de agua.",
    platforms:[p(260,665,"ground-platform",500,120),p(760,560,"shell-ledge",280,95),p(1160,665,"ground-platform",430,120),p(1540,530,"dock-bridge",320,90),p(1940,665,"ground-platform",420,120),p(2320,555,"shell-ledge",260,95),p(2700,470,"dock-bridge",300,90),p(3090,665,"ground-platform",440,120),p(3490,545,"shell-ledge",260,95),p(3880,665,"ground-platform",440,120),p(4320,665,"ground-platform",520,120)],
    bounceAt:[2110,585], checkpointAt:[2760,385], portalAt:[4380,530], hazards:[{x:1260,y:600,kind:"damage"},{x:3970,y:600,kind:"damage"}], crystals:[[760,430],[2700,345],[3490,420]], enemies:[e("hopper",1750,585,1640,1870),e("snail",3700,585,3600,3820)],
  },
  {
    id:"fantasia", name:"FANTASÍA", tint:0xf2d9ff, ground:"ground-platform", ledge:"cloud-ledge", bridge:"magic-bridge", bounce:"mushroom-bounce-pad", hazard:"rune-block", portal:"portal-frame", power:"lightning",
    lesson:"Combina rebotes y plataformas suspendidas.",
    platforms:[p(260,665,"ground-platform",500,120),p(720,590,"cloud-ledge",270,90),p(1080,500,"magic-bridge",300,85),p(1460,410,"cloud-ledge",260,90),p(1840,560,"magic-bridge",310,85),p(2240,665,"ground-platform",430,120),p(2630,550,"cloud-ledge",270,90),p(3010,460,"magic-bridge",300,85),p(3400,570,"cloud-ledge",270,90),p(3810,665,"ground-platform",430,120),p(4300,665,"ground-platform",560,120)],
    bounceAt:[2050,585], checkpointAt:[2290,535], portalAt:[4390,530], hazards:[{x:3180,y:395,kind:"damage"}], crystals:[[1080,375],[1460,285],[3010,335]], enemies:[e("hopper",2460,585,2350,2550),e("crab",3690,585,3560,3800)],
    boss:{type:"rune-guardian",x:4070,y:560,minX:3890,maxX:4230,hp:8},
  },
  {
    id:"oscuridad", name:"OSCURIDAD", tint:0x9aa9ff, ground:"ground-platform", ledge:"short-ledge", bridge:"branch-bridge", bounce:"mist-bounce-pad", hazard:"false-bush", portal:"portal-frame", power:"fire",
    lesson:"Reconoce trampas falsas y conserva tus corazones.",
    platforms:[p(280,665,"ground-platform",520,120),p(790,665,"ground-platform",380,120),p(1130,560,"branch-bridge",300,85),p(1510,665,"ground-platform",400,120),p(1870,545,"short-ledge",250,90),p(2240,445,"branch-bridge",300,85),p(2620,555,"short-ledge",250,90),p(3000,665,"ground-platform",420,120),p(3390,540,"branch-bridge",300,85),p(3780,665,"ground-platform",420,120),p(4300,665,"ground-platform",570,120)],
    bounceAt:[2810,585], checkpointAt:[2290,360], portalAt:[4390,530], hazards:[{x:840,y:600,kind:"damage"},{x:3090,y:600,kind:"damage"}], crystals:[[1130,435],[2240,320],[3390,415]], enemies:[e("snail",1640,585,1530,1750),e("hopper",3650,585,3520,3740)],
  },
  {
    id:"lava", name:"LAVA", tint:0xff875f, ground:"ground-platform", ledge:"short-ledge", bridge:"bridge", bounce:"bounce-vent", hazard:"lava-geyser", portal:"portal-frame", power:"ice",
    lesson:"Avanza con precisión entre géiseres y puentes estrechos.",
    platforms:[p(250,665,"ground-platform",470,120),p(690,545,"bridge",290,85),p(1060,665,"ground-platform",390,120),p(1420,555,"short-ledge",240,90),p(1780,460,"bridge",300,85),p(2160,665,"ground-platform",400,120),p(2540,545,"short-ledge",250,90),p(2920,455,"bridge",300,85),p(3300,665,"ground-platform",400,120),p(3680,535,"short-ledge",250,90),p(4070,665,"ground-platform",420,120),p(4420,665,"ground-platform",300,120)],
    bounceAt:[2360,585], checkpointAt:[2200,535], portalAt:[4410,530], hazards:[{x:1130,y:600,kind:"damage"},{x:3370,y:600,kind:"damage"}], crystals:[[690,420],[1780,335],[2920,330]], enemies:[e("crab",2050,585,1940,2150),e("hopper",3970,585,3860,4060)],
  },
  {
    id:"galaxia", name:"GALAXIA", tint:0x8ee9ff, ground:"ground-platform", ledge:"short-ledge", bridge:"bridge", bounce:"bounce-pad", hazard:"black-hole-hazard", portal:"portal-frame", power:"lightning",
    lesson:"Supera la prueba final y alcanza la baliza de reencuentro.",
    platforms:[p(260,665,"ground-platform",500,120),p(720,570,"short-ledge",250,90),p(1080,475,"bridge",300,85),p(1460,575,"short-ledge",250,90),p(1830,665,"ground-platform",390,120),p(2200,540,"bridge",300,85),p(2580,435,"short-ledge",250,90),p(2960,540,"bridge",300,85),p(3340,665,"ground-platform",400,120),p(3720,525,"short-ledge",250,90),p(4100,665,"ground-platform",420,120),p(4430,665,"ground-platform",280,120)],
    bounceAt:[1990,585], checkpointAt:[2620,350], portalAt:[4420,530], hazards:[{x:1900,y:600,kind:"damage"},{x:3440,y:600,kind:"damage"}], crystals:[[1080,350],[2580,310],[3720,400]], enemies:[e("hopper",1550,500,1430,1660),e("crab",3200,585,3070,3300),e("snail",3740,585,3630,3840)],
    boss:{type:"cosmic-sentinel",x:4080,y:545,minX:3900,maxX:4250,hp:12},
  },
];

export const movementStates = ["idle","walk-contact","walk-passing","run","jump-takeoff","jump-airborne","fall","reunion"];
export const powers = ["fire","water","ice","lightning"];
export const enemyVisuals = {
  snail:{name:"Caracol",frames:3},
  crab:{name:"Cangrejo",frames:3},
  hopper:{name:"Pinkegg",frames:3},
};

export function platformSurfaceAt(world,x) {
  const surfaces=world.platforms
    .filter(platform=>x>=platform.x-platform.width/2&&x<=platform.x+platform.width/2)
    .map(platform=>platform.y-platform.height);
  return surfaces.length?Math.min(...surfaces):null;
}
export function freshRun(worldIndex=0) { return { worldIndex, checkpoint:null, collected:[], hearts:3, bossDefeated:false }; }
export function freshSave() { return { version:3, worldIndex:0, hero:"boy", unlockedPowers:["fire"], activePower:"fire", crystals:0, completed:false, currentRun:freshRun(0) }; }
export function normalizeSave(value) {
  const base = freshSave();
  if (!value || typeof value !== "object") return base;
  const unlocked = powers.filter((power) => Array.isArray(value.unlockedPowers) && value.unlockedPowers.includes(power));
  if (!unlocked.includes("fire")) unlocked.unshift("fire");
  const worldIndex=Math.max(0,Math.min(worlds.length-1,Number(value.worldIndex)||0));
  const rawRun=value.currentRun?.worldIndex===worldIndex?value.currentRun:freshRun(worldIndex);
  const collected=[...new Set((Array.isArray(rawRun.collected)?rawRun.collected:[]).map(Number).filter(index=>Number.isInteger(index)&&index>=0&&index<worlds[worldIndex].crystals.length))];
  const checkpoint=rawRun.checkpoint&&Number.isFinite(Number(rawRun.checkpoint.x))&&Number.isFinite(Number(rawRun.checkpoint.y))
    ? {x:Math.max(0,Math.min(WORLD_WIDTH,Number(rawRun.checkpoint.x))),y:Math.max(0,Math.min(VIEW_HEIGHT,Number(rawRun.checkpoint.y)))}
    : null;
  const currentRun={worldIndex,checkpoint,collected,hearts:Math.max(1,Math.min(3,Number(rawRun.hearts)||3)),bossDefeated:Boolean(rawRun.bossDefeated)};
  const crystals=Boolean(value.completed)?21:Math.max(worldIndex*3+collected.length,Math.min(worldIndex*3,Number(value.crystals)||0));
  return { ...base, version:3, worldIndex, hero:value.hero==="girl"?"girl":"boy", unlockedPowers:unlocked, activePower:unlocked.includes(value.activePower)?value.activePower:unlocked[0], crystals, completed:Boolean(value.completed), currentRun };
}

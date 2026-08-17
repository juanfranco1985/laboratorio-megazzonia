import { clamp, distance, lerp } from "./core/math.js";
import { ART, CHAPTERS, LEVEL_LENGTH, WORLD_LAYOUT } from "./data/expedition.js";
import { chapterAt, terrainHeightAt } from "./systems/terrain.js";

const VIEW = { width: 1280, height: 720 };
const STORAGE_KEY = "megazzonia_el_cruce_progress_v2";
const LEGACY_STORAGE_KEY = "megazzonia_el_cruce_progress_v1";

// Puntos de contacto medidos sobre los atlas transparentes.
const SAN_MARTIN_FEET = Object.freeze([.994, .994, .989, .967, .972, .994, .939, .994, .928, .956, .928, .928]);
const SAN_MARTIN_CENTER = Object.freeze([.5, .467, .459, .494, .536, .53, .494, .478, .506, .561, .514, .464]);
const SAN_MARTIN_WALK_FEET = Object.freeze([.898, .906, .906, .91, .91, .914, .922, .922]);
const SAN_MARTIN_WALK_CENTER = Object.freeze([.63, .529, .417, .417, .628, .43, .398, .396]);
const EXPEDITION_FEET = Object.freeze([.945, .945, .945, .949, .883, .879, .883, .898]);
const PROP_CONTACT = Object.freeze([.836, .832, .816, .84, .703, .754, .785, .758]);
const LOGISTICS_CONTACT = Object.freeze([.848, .867, .863, .848, .742, .664, .734, .535]);

function loadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  return image;
}

class WebAudio {
  constructor() {
    this.context = null;
    this.muted = false;
    this.wind = null;
  }

  unlock() {
    if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
    if (this.context.state === "suspended") this.context.resume().catch(() => {});
    this.startWind();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.wind) this.wind.gain.value = muted ? 0 : 0.035;
  }

  setWindStrength(strength) {
    if (!this.wind || this.muted || !this.context) return;
    const target = 0.018 + clamp(strength, 0, 1.4) * 0.032;
    this.wind.gain.setTargetAtTime(target, this.context.currentTime, 0.18);
  }

  tone(frequency, duration = 0.12, type = "sine", volume = 0.05, delay = 0) {
    if (this.muted) return;
    this.unlock();
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  play(name) {
    const patterns = {
      jump: [[260, .12, "triangle", .04]],
      land: [[110, .08, "sine", .03]],
      landHeavy: [[92, .11, "sine", .038], [58, .08, "triangle", .02, .035]],
      stepRock: [[86, .045, "triangle", .009]],
      stepSnow: [[148, .055, "sine", .008], [74, .04, "triangle", .006, .018]],
      command: [[330, .1, "triangle", .035], [440, .16, "triangle", .04, .08]],
      help: [[392, .12, "sine", .05], [523, .2, "sine", .045, .11]],
      supply: [[520, .08, "triangle", .04], [660, .13, "triangle", .035, .06]],
      danger: [[92, .24, "sawtooth", .04]],
      checkpoint: [[294, .12, "triangle", .035], [440, .18, "triangle", .04, .09], [587, .25, "sine", .035, .22]],
      chapter: [[220, .16, "sine", .03], [330, .24, "triangle", .04, .12]],
      finish: [[262, .2, "triangle", .04], [392, .25, "triangle", .045, .16], [523, .4, "sine", .05, .34]],
    };
    for (const [frequency, duration, type, volume, delay] of patterns[name] || []) {
      this.tone(frequency, duration, type, volume, delay || 0);
    }
  }

  startWind() {
    if (this.wind || !this.context) return;
    const bufferSize = this.context.sampleRate * 2;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < bufferSize; index += 1) {
      last = last * 0.985 + (Math.random() * 2 - 1) * 0.015;
      data[index] = last;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "bandpass";
    filter.frequency.value = 620;
    filter.Q.value = 0.45;
    gain.gain.value = this.muted ? 0 : 0.035;
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start();
    this.wind = gain;
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.width = 58;
    this.height = 122;
    this.reset();
  }

  reset() {
    this.x = 170;
    this.y = 430;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.jumpsUsed = 0;
    this.invulnerable = 0;
    this.step = 0;
    this.lastStepMark = 0;
    this.actionPose = "";
    this.actionTimer = 0;
    this.landingTimer = 0;
    this.turnTimer = 0;
    this.airTime = 0;
  }

  requestJump() {
    this.jumpBuffer = 0.16;
  }

  setAction(pose, duration = 0.5) {
    this.actionPose = pose;
    this.actionTimer = duration;
  }

  update(delta) {
    const game = this.game;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);
    this.coyote = this.onGround ? 0.12 : Math.max(0, this.coyote - delta);
    this.invulnerable = Math.max(0, this.invulnerable - delta);
    this.actionTimer = Math.max(0, this.actionTimer - delta);
    this.landingTimer = Math.max(0, this.landingTimer - delta);
    this.turnTimer = Math.max(0, this.turnTimer - delta);
    if (!this.onGround) this.airTime += delta;
    if (this.actionTimer <= 0) this.actionPose = "";

    const direction = Number(game.input.right) - Number(game.input.left);
    const resting = game.command === "rest" && game.commandTimer > 0;
    const baseSpeed = game.command === "advance" ? 258 : game.command === "regroup" ? 164 : 210;
    const targetVelocity = resting ? 0 : direction * baseSpeed * (0.72 + game.stamina / 360);
    this.vx = lerp(this.vx, targetVelocity, 1 - Math.pow(0.0001, delta));
    if (direction && direction !== this.facing && this.onGround) this.turnTimer = .16;
    if (direction) this.facing = direction;

    const canGroundJump = this.coyote > 0;
    const canDoubleJump = !this.onGround && this.coyote <= 0 && this.jumpsUsed < 2;
    if (this.jumpBuffer > 0 && (canGroundJump || canDoubleJump) && !resting) {
      const isDoubleJump = !canGroundJump;
      this.vy = isDoubleJump ? -430 : -455;
      this.onGround = false;
      this.coyote = 0;
      this.jumpsUsed = isDoubleJump ? 2 : 1;
      this.airTime = 0;
      this.landingTimer = 0;
      this.jumpBuffer = 0;
      game.audio.play("jump");
      game.emit(this.x, this.y + this.height / 2, isDoubleJump ? 13 : 9, isDoubleJump ? "#b9dceb" : "#d9c49e");
    }

    this.vy += 1120 * delta;
    const previousX = this.x;
    this.x = clamp(this.x + this.vx * delta, 40, LEVEL_LENGTH + 80);
    if (!game.preparation.complete && this.x > WORLD_LAYOUT.preparationGate) {
      this.x = WORLD_LAYOUT.preparationGate;
      this.vx = Math.min(0, this.vx);
      if (game.taskToastCooldown <= 0) {
        game.showToast("La expedicion no parte sin viveres, equipo y materiales de puente.");
        game.taskToastCooldown = 2.2;
      }
    }
    if (!game.bridge.complete && previousX <= game.bridge.start - 22 && this.x > game.bridge.start - 22) {
      this.x = game.bridge.start - 22;
      this.vx = Math.min(0, this.vx);
      if (game.taskToastCooldown <= 0) {
        game.showToast("La quebrada no se salta: reuni a la columna y construyan el puente.");
        game.taskToastCooldown = 2.2;
      }
    }
    this.y += this.vy * delta;
    this.step += Math.abs(this.vx) * delta * 0.06;

    const ground = game.groundAt(this.x);
    const feet = this.y + this.height / 2;
    if (ground !== null && feet >= ground && this.vy >= 0 && feet < ground + 62) {
      const wasAirborne = !this.onGround;
      const landingSpeed = this.vy;
      this.y = ground - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      this.jumpsUsed = 0;
      this.airTime = 0;
      if (wasAirborne) {
        this.landingTimer = landingSpeed > 260 ? .22 : .12;
        game.audio.play(landingSpeed > 620 ? "landHeavy" : "land");
        game.emit(this.x, ground - 3, landingSpeed > 620 ? 12 : 6, "#e8dfca");
      }
    } else {
      this.onGround = false;
    }

    const stepMark = Math.floor(this.step / 3.8);
    if (this.onGround && Math.abs(this.vx) > 80 && stepMark !== this.lastStepMark) {
      this.lastStepMark = stepMark;
      game.audio.play(game.chapterIndex >= 2 ? "stepSnow" : "stepRock");
      game.emit(this.x - this.facing * 12, this.y + this.height / 2, 2, "#e5ddcb");
    }

    if (this.y - game.cameraY > VIEW.height + 180) game.setback("Una grieta separó a la vanguardia de la columna.");
  }

  getFrame() {
    if (this.invulnerable > 0) return 11;
    if (this.actionPose === "command") return 9;
    if (this.actionPose === "help") return 10;
    if (this.actionPose === "rest" || (this.game.command === "rest" && this.game.commandTimer > 0)) return 11;
    if (this.landingTimer > 0) return this.landingTimer > .1 ? 7 : 8;
    if (this.turnTimer > 0) return 2;
    if (!this.onGround) {
      if (this.vy < -150) return this.airTime < .09 ? 3 : 4;
      if (this.vy < 170) return 5;
      return 6;
    }
    return Math.floor(this.game.elapsed * 1.25) % 2;
  }

  render(ctx, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    const ground = this.game.groundAt(this.x);
    const feet = this.y + this.height / 2;
    if (ground !== null) {
      const altitude = Math.max(0, ground - feet);
      const shadowScale = clamp(1 - altitude / 240, .28, 1);
      ctx.save();
      ctx.globalAlpha = .26 * shadowScale;
      ctx.fillStyle = "#050709";
      ctx.beginPath();
      ctx.ellipse(screenX, ground - cameraY + 2, 30 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(screenX, screenY);
    if (this.facing < 0) ctx.scale(-1, 1);
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 12) % 2 === 0) ctx.globalAlpha = .44;
    const atlas = this.game.assets.sanMartinAtlas;
    const walkAtlas = this.game.assets.sanMartinWalkAtlas;
    const walking = this.onGround && Math.abs(this.vx) > 35 && !this.actionPose
      && this.landingTimer <= 0 && this.turnTimer <= 0
      && !(this.game.command === "rest" && this.game.commandTimer > 0) && this.invulnerable <= 0;
    if (walking && walkAtlas.complete && walkAtlas.naturalWidth) {
      const frame = Math.floor(this.step * .62) % 8;
      const width = 110;
      const height = 146;
      this.game.drawAtlasCell(ctx, walkAtlas, frame, 4, 2,
        -width * SAN_MARTIN_WALK_CENTER[frame],
        this.height / 2 - height * SAN_MARTIN_WALK_FEET[frame], width, height);
    } else if (atlas.complete && atlas.naturalWidth) {
      const frame = this.getFrame();
      const width = 146;
      const height = 146;
      this.game.drawAtlasCell(ctx, atlas, frame, 4, 3,
        -width * SAN_MARTIN_CENTER[frame],
        this.onGround ? this.height / 2 - height * SAN_MARTIN_FEET[frame] : -height / 2,
        width, height);
    } else {
      const image = this.game.assets.sanMartin;
      if (image.complete && image.naturalWidth) ctx.drawImage(image, -43, -64, 86, 129);
    }
    ctx.restore();
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resizeCanvas();
    this.assets = {
      backgrounds: Object.fromEntries(Object.entries(ART.backgrounds).map(([key, src]) => [key, loadImage(src)])),
      sanMartin: loadImage(ART.sanMartin),
      sanMartinAtlas: loadImage(ART.sanMartinAtlas),
      sanMartinWalkAtlas: loadImage(ART.sanMartinWalkAtlas),
      expeditionAtlas: loadImage(ART.expeditionAtlas),
      propsAtlas: loadImage(ART.propsAtlas),
      logisticsAtlas: loadImage(ART.logisticsAtlas),
    };
    this.audio = new WebAudio();
    this.input = { left: false, right: false };
    this.state = "intro";
    this.elapsed = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.shake = 0;
    this.flash = 0;
    this.command = "advance";
    this.commandTimer = 0;
    this.commandCooldown = 0;
    this.toastTimer = 0;
    this.actionRequested = false;
    this.particles = [];
    this.progress = this.loadProgress();
    this.reducedMotion = typeof this.progress.reducedMotion === "boolean"
      ? this.progress.reducedMotion
      : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
    this.soundMuted = Boolean(this.progress.soundMuted);
    this.player = new Player(this);
    this.createWorld();
    this.cacheUI();
    this.bindEvents();
    window.addEventListener("resize", () => this.resizeCanvas());
    document.body.classList.toggle("reduced-motion", this.reducedMotion);
    this.updatePreferenceButtons();
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.frame(time));
  }

  resizeCanvas() {
    const aspect = Math.max(0.35, window.innerWidth / Math.max(1, window.innerHeight));
    if (aspect >= 1) {
      VIEW.width = 1280;
      VIEW.height = clamp(Math.round(1280 / aspect), 640, 900);
    } else {
      VIEW.width = 720;
      VIEW.height = clamp(Math.round(720 / aspect), 1080, 1560);
    }
    this.canvas.width = VIEW.width;
    this.canvas.height = VIEW.height;
  }

  createWorld() {
    this.morale = 100;
    this.warmth = 100;
    this.stamina = 100;
    this.supplies = 6;
    this.columnSize = 8;
    this.rescues = 0;
    this.cohesion = 92;
    this.lastSafeX = 170;
    this.hazardCooldown = 0;
    this.setbacks = 0;
    this.storyIndex = 0;
    this.chapterIndex = 0;
    this.chapterRevealTimer = 2.8;
    this.breathTimer = .5;
    this.commandPulse = 0;
    this.checkpointCount = 0;
    this.runTime = 0;
    this.windStrength = .2;
    this.command = "advance";
    this.commandTimer = 0;
    this.taskToastCooldown = 0;
    this.preparation = { rations: false, equipment: false, bridgeKit: false, complete: false };
    this.bridge = {
      ...WORLD_LAYOUT.bridge,
      stage: 0,
      progress: 0,
      complete: false,
    };
    this.pits = WORLD_LAYOUT.pits.map((pit) => ({ ...pit }));
    this.rocks = WORLD_LAYOUT.rocks.map((x, index) => ({ x, hit: false, size: 28 + index % 3 * 7, type: "rock" }));
    this.branches = WORLD_LAYOUT.branches.map((x) => ({ x, hit: false, size: 30, type: "branch" }));
    this.iceRidges = WORLD_LAYOUT.iceRidges.map((x) => ({ x, hit: false, size: 34, type: "ice" }));
    this.suppliesWorld = WORLD_LAYOUT.supplies.map((x) => ({ x, taken: false }));
    this.rescuePoints = WORLD_LAYOUT.rescues.map((x, index) => ({ x, rescued: false, label: ["Soldado exhausto", "Arriero herido", "Granadero rezagado"][index] }));
    this.camps = WORLD_LAYOUT.camps.map((x) => ({ x, used: false }));
    this.checkpoints = WORLD_LAYOUT.checkpoints.map((x, index) => ({ x, index, activated: false }));
    this.storyMarkers = [
      { x: 260, text: "EL PLUMERILLO · Antes de marchar, la columna debe quedar equipada." },
      { x: 2450, text: "LA PARTIDA · El terreno comienza a elevarse hacia la precordillera." },
      { x: 4880, text: "INGENIERÍA · Nadie saltará esta quebrada: el paso se construye entre todos." },
      { x: 7350, text: "ESPINACITO · La pendiente exige un ritmo sostenido y la carga bien sujeta." },
      { x: 10120, text: "LA NOCHE · La altura castiga el esfuerzo. Busca el próximo vivac." },
      { x: 12500, text: "ALTA MONTAÑA · Avanza en fila y protege a los animales del viento." },
      { x: 15020, text: "EL DESCENSO · El valle de Aconcagua aparece al otro lado de la cumbre." },
    ];
    this.followers = Array.from({ length: 8 }, (_, index) => ({
      offset: 72 + index * 47,
      phase: index * .8,
      active: true,
      role: "march",
      type: index % 3 === 0 ? "arriero" : "grenadier",
    }));
    const resumed = this.progress.completed ? 0 : clamp(Number(this.progress.checkpoint) || 0, 0, this.checkpoints.length);
    for (let index = 0; index < resumed; index += 1) this.checkpoints[index].activated = true;
    this.checkpointCount = resumed;
  }

  cacheUI() {
    const byId = (id) => document.getElementById(id);
    this.ui = {
      overlay: byId("overlay"), panelKicker: byId("panelKicker"), panelTitle: byId("panelTitle"), panelSubtitle: byId("panelSubtitle"),
      panelText: byId("panelText"), panelQuote: byId("panelQuote"), startBtn: byId("startBtn"), resumeBtn: byId("resumeBtn"),
      resultGrid: byId("resultGrid"), resultDistance: byId("resultDistance"), resultRescues: byId("resultRescues"), resultColumn: byId("resultColumn"), resultMedal: byId("resultMedal"), resultTime: byId("resultTime"), resultLeadership: byId("resultLeadership"),
      moraleBar: byId("moraleBar"), warmthBar: byId("warmthBar"), staminaBar: byId("staminaBar"), moraleValue: byId("moraleValue"), warmthValue: byId("warmthValue"), staminaValue: byId("staminaValue"),
      supplyValue: byId("supplyValue"), columnValue: byId("columnValue"), progressLabel: byId("progressLabel"), objectiveLabel: byId("objectiveLabel"), chapterLabel: byId("chapterLabel"), chapterRail: byId("chapterRail"),
      toast: byId("toast"), interaction: byId("interaction"), interactionText: byId("interactionText"), soundBtn: byId("soundBtn"), motionBtn: byId("motionBtn"), pauseBtn: byId("pauseBtn"),
    };
  }

  bindEvents() {
    const setKey = (key, value) => {
      if (["ArrowLeft", "a", "A"].includes(key)) this.input.left = value;
      if (["ArrowRight", "d", "D"].includes(key)) this.input.right = value;
    };
    window.addEventListener("keydown", (event) => {
      this.audio.unlock();
      setKey(event.key, true);
      if (["ArrowUp", "w", "W", " "].includes(event.key)) {
        event.preventDefault();
        if (!event.repeat) this.player.requestJump();
      }
      if (["e", "E"].includes(event.key)) this.actionRequested = true;
      if (event.key === "1") this.issueCommand("advance");
      if (event.key === "2") this.issueCommand("regroup");
      if (event.key === "3") this.issueCommand("rest");
      if (["p", "P", "Escape"].includes(event.key)) this.togglePause();
    });
    window.addEventListener("keyup", (event) => setKey(event.key, false));
    window.addEventListener("blur", () => { this.input.left = false; this.input.right = false; });
    this.ui.startBtn.addEventListener("click", () => this.start());
    this.ui.resumeBtn.addEventListener("click", () => this.togglePause());
    this.ui.pauseBtn.addEventListener("click", () => this.togglePause());
    this.ui.soundBtn.addEventListener("click", () => { this.soundMuted = !this.soundMuted; this.audio.setMuted(this.soundMuted); this.saveProgress(); this.updatePreferenceButtons(); });
    this.ui.motionBtn.addEventListener("click", () => { this.reducedMotion = !this.reducedMotion; document.body.classList.toggle("reduced-motion", this.reducedMotion); if (this.reducedMotion) this.particles.length = 0; this.saveProgress(); this.updatePreferenceButtons(); });
    document.querySelectorAll("[data-command]").forEach((button) => button.addEventListener("click", () => this.issueCommand(button.dataset.command)));
    this.bindHoldButton("leftBtn", "left");
    this.bindHoldButton("rightBtn", "right");
    document.getElementById("jumpBtn").addEventListener("pointerdown", (event) => { event.preventDefault(); this.audio.unlock(); this.player.requestJump(); });
    document.getElementById("actionBtn").addEventListener("pointerdown", (event) => { event.preventDefault(); this.actionRequested = true; });
  }

  bindHoldButton(id, direction) {
    const button = document.getElementById(id);
    const start = (event) => { event.preventDefault(); this.audio.unlock(); this.input[direction] = true; };
    const stop = (event) => { event.preventDefault(); this.input[direction] = false; };
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  }

  loadProgress() {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (current) return current;
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "{}");
      return { ...legacy, checkpoint: 0, run: null, migratedFromV1: true };
    } catch { return {}; }
  }

  saveProgress() {
    this.progress.soundMuted = this.soundMuted;
    this.progress.reducedMotion = this.reducedMotion;
    this.progress.schema = 2;
    this.progress.run = {
      morale: this.morale, warmth: this.warmth, stamina: this.stamina, supplies: this.supplies,
      columnSize: this.columnSize, rescues: this.rescues, cohesion: this.cohesion,
      preparation: { ...this.preparation },
      bridge: { stage: this.bridge.stage, progress: this.bridge.progress, complete: this.bridge.complete },
      suppliesWorld: this.suppliesWorld.map((item) => item.taken),
      rescuePoints: this.rescuePoints.map((item) => item.rescued),
      camps: this.camps.map((item) => item.used),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  restoreRunState(run) {
    if (!run) return;
    for (const key of ["morale", "warmth", "stamina", "supplies", "columnSize", "rescues", "cohesion"]) {
      if (Number.isFinite(run[key])) this[key] = run[key];
    }
    Object.assign(this.preparation, run.preparation || {});
    Object.assign(this.bridge, run.bridge || {});
    (run.suppliesWorld || []).forEach((taken, index) => { if (this.suppliesWorld[index]) this.suppliesWorld[index].taken = Boolean(taken); });
    (run.rescuePoints || []).forEach((rescued, index) => { if (this.rescuePoints[index]) this.rescuePoints[index].rescued = Boolean(rescued); });
    (run.camps || []).forEach((used, index) => { if (this.camps[index]) this.camps[index].used = Boolean(used); });
  }

  start() {
    this.audio.unlock();
    this.player.reset();
    this.createWorld();
    const resumeIndex = this.progress.completed ? 0 : clamp(Number(this.progress.checkpoint) || 0, 0, this.checkpoints.length);
    if (resumeIndex > 0) {
      this.restoreRunState(this.progress.run);
      this.player.x = this.checkpoints[resumeIndex - 1].x + 45;
      this.lastSafeX = this.player.x;
      this.chapterIndex = chapterAt(this.player.x, CHAPTERS);
    }
    const ground = this.groundAt(this.player.x) ?? 560;
    this.player.y = ground - this.player.height / 2;
    this.player.onGround = true;
    this.cameraX = clamp(this.player.x - 260, 0, Math.max(0, LEVEL_LENGTH - VIEW.width + 120));
    this.cameraY = this.player.y - VIEW.height * .62;
    this.state = "running";
    this.ui.overlay.classList.remove("visible");
    this.ui.resultGrid.hidden = true;
    this.ui.startBtn.textContent = "REINICIAR LA EXPEDICIÓN";
    this.showToast(resumeIndex > 0
      ? "Retomamos desde el puesto " + resumeIndex + ". La columna conserva su estado."
      : "Primera misión: prepara la columna en El Plumerillo.", 3400);
  }

  togglePause() {
    if (this.state === "running") {
      this.state = "paused";
      this.ui.panelKicker.textContent = "ALTO EN LA MARCHA";
      this.ui.panelTitle.textContent = "Pausa";
      this.ui.panelSubtitle.textContent = "LA COLUMNA ESPERA TU ORDEN";
      this.ui.panelText.textContent = "Observa los indicadores y decide el próximo movimiento. Reagrupar puede ser más importante que ganar distancia.";
      this.ui.panelQuote.textContent = "El liderazgo también consiste en saber cuándo detenerse.";
      this.ui.startBtn.hidden = true;
      this.ui.resumeBtn.hidden = false;
      this.ui.overlay.classList.add("visible");
    } else if (this.state === "paused") {
      this.state = "running";
      this.ui.overlay.classList.remove("visible");
      this.ui.resumeBtn.hidden = true;
      this.ui.startBtn.hidden = false;
    }
  }

  issueCommand(command) {
    if (this.state !== "running" || this.commandCooldown > 0) return;
    this.audio.unlock();
    if (command === "rest") {
      if (this.supplies <= 0) { this.showToast("No quedan provisiones para detener la marcha."); return; }
      this.supplies -= 1;
      this.commandTimer = 3.2;
      this.showToast("DESCANSAR · La columna recupera abrigo y resistencia.");
    } else if (command === "regroup") {
      this.commandTimer = 4.5;
      this.showToast("REAGRUPAR · Nadie debe quedar atrás.");
    } else {
      this.commandTimer = 5;
      this.showToast("AVANZAR · Mantén un ritmo que la columna pueda sostener.");
    }
    this.command = command;
    this.commandPulse = this.reducedMotion ? 0 : 1;
    this.emit(this.player.x, this.player.y - 20, command === "rest" ? 8 : 14, command === "regroup" ? "#8fd0ed" : "#e4c17e");
    this.player.setAction(command === "rest" ? "rest" : "command", command === "rest" ? 2.4 : 0.72);
    this.commandCooldown = .4;
    this.audio.play("command");
    document.querySelectorAll("[data-command]").forEach((button) => button.classList.toggle("active", button.dataset.command === command));
  }

  drawAtlasCell(ctx, image, frame, columns, rows, x, y, width, height, alpha = 1) {
    if (!image?.complete || !image.naturalWidth) return false;
    const cellWidth = image.naturalWidth / columns;
    const cellHeight = image.naturalHeight / rows;
    const safeFrame = clamp(frame, 0, columns * rows - 1);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(
      image,
      (safeFrame % columns) * cellWidth,
      Math.floor(safeFrame / columns) * cellHeight,
      cellWidth,
      cellHeight,
      x,
      y,
      width,
      height
    );
    ctx.restore();
    return true;
  }

  drawProp(ctx, frame, worldX, width = 128, height = 170, contactOffset = 0, alpha = 1) {
    const x = worldX - this.cameraX;
    if (x < -width || x > VIEW.width + width) return;
    const ground = this.groundAt(worldX);
    if (ground === null) return;
    const contactRatio = PROP_CONTACT[frame] ?? 1;
    const y = ground - height * contactRatio + contactOffset;
    this.drawAtlasCell(ctx, this.assets.propsAtlas, frame, 4, 2, x - width / 2, y, width, height, alpha);
  }

  updateChapter() {
    const safeIndex = chapterAt(this.player.x, CHAPTERS);
    if (safeIndex !== this.chapterIndex) {
      this.chapterIndex = safeIndex;
      this.chapterRevealTimer = 3;
      this.audio.play("command");
      this.emit(this.player.x, (this.groundAt(this.player.x) ?? this.player.y) - 70, 20, "#8fd0ed");
    }
  }

  processHazards() {
    const hazards = [...this.rocks, ...this.branches, ...this.iceRidges];
    for (const hazard of hazards) {
      if (hazard.hit || this.player.invulnerable > 0) continue;
      const threshold = hazard.type === "branch" ? 58 : hazard.size + 22;
      if (distance(this.player.x, hazard.x) >= threshold) continue;
      const playerFeet = this.player.y + this.player.height / 2;
      const ground = this.groundAt(hazard.x) || playerFeet;
      const clearsHazard = !this.player.onGround && playerFeet < ground - (hazard.type === "ice" ? 52 : 38);
      if (clearsHazard) continue;
      hazard.hit = true;
      const messages = {
        rock: "Una roca cerró el paso. La columna perdió moral.",
        branch: "Un tronco helado quebró el ritmo de marcha.",
        ice: "La arista de hielo obligó a retroceder.",
      };
      this.setback(messages[hazard.type], hazard.type === "ice" ? 165 : 120);
      break;
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remaining}`;
  }
  bridgeDeckAt(x) {
    const progress = clamp((x - this.bridge.start) / (this.bridge.end - this.bridge.start), 0, 1);
    const left = terrainHeightAt(this.bridge.start - 2);
    const right = terrainHeightAt(this.bridge.end + 2);
    return lerp(left, right, progress) + Math.sin(progress * Math.PI) * 20;
  }

  groundAt(x) {
    let edgeDrop = 0;
    for (const pit of this.pits) {
      if (x > pit.start && x < pit.end) {
        if (pit.kind === "bridge" && this.bridge.complete) return this.bridgeDeckAt(x);
        return null;
      }
      const distanceToEdge = x <= pit.start ? pit.start - x : x - pit.end;
      if (distanceToEdge < 76) edgeDrop = Math.max(edgeDrop, (76 - distanceToEdge) * .32);
    }
    return terrainHeightAt(x) + edgeDrop;
  }

  followerPoseAt(x, index) {
    for (const pit of this.pits) {
      if (x < pit.start || x > pit.end) continue;
      const progress = clamp((x - pit.start) / (pit.end - pit.start), 0, 1);
      if (pit.kind === "bridge" && this.bridge.complete) return { y: this.bridgeDeckAt(x), airborne: false, progress, cause: "bridge" };
      const leftGround = this.groundAt(pit.start - 2);
      const rightGround = this.groundAt(pit.end + 2);
      if (leftGround === null || rightGround === null) return null;
      const baseline = lerp(leftGround, rightGround, progress);
      const jumpHeight = 112 + (index % 3) * 7;
      return {
        y: baseline - Math.sin(progress * Math.PI) * jumpHeight,
        airborne: progress > 0 && progress < 1,
        progress,
      };
    }
    const ground = this.groundAt(x);
    if (ground === null) return null;
    for (const hazard of [...this.rocks, ...this.branches, ...this.iceRidges]) {
      const clearance = hazard.type === "branch" ? 76 : hazard.type === "ice" ? 62 : 54;
      if (Math.abs(x - hazard.x) > clearance) continue;
      const progress = clamp((x - (hazard.x - clearance)) / (clearance * 2), 0, 1);
      const jumpHeight = hazard.type === "branch" ? 76 : hazard.type === "ice" ? 64 : 52;
      return {
        y: ground - Math.sin(progress * Math.PI) * jumpHeight,
        airborne: progress > 0 && progress < 1,
        progress,
        cause: "obstacle",
      };
    }
    return { y: ground, airborne: false, progress: 0, cause: "ground" };
  }

  update(delta) {
    if (this.state !== "running") return;
    this.elapsed += delta;
    this.runTime += delta;
    this.chapterRevealTimer = Math.max(0, this.chapterRevealTimer - delta);
    this.updateChapter();
    this.commandTimer = Math.max(0, this.commandTimer - delta);
    this.commandCooldown = Math.max(0, this.commandCooldown - delta);
    this.hazardCooldown = Math.max(0, this.hazardCooldown - delta);
    this.flash = Math.max(0, this.flash - delta);
    this.shake = Math.max(0, this.shake - 30 * delta);
    this.commandPulse = Math.max(0, this.commandPulse - delta * 1.4);
    this.taskToastCooldown = Math.max(0, this.taskToastCooldown - delta);
    this.toastTimer = Math.max(0, this.toastTimer - delta);
    if (this.toastTimer === 0) this.ui.toast.classList.remove("visible");

    this.player.update(delta);
    const cameraFocus = VIEW.width < 900 ? 190 : 300;
    const lookAhead = clamp(this.player.vx * .42, -82, 128);
    const cameraTarget = clamp(this.player.x - cameraFocus + lookAhead, 0, Math.max(0, LEVEL_LENGTH - VIEW.width + 120));
    this.cameraX = lerp(this.cameraX, cameraTarget, 1 - Math.pow(.002, delta));
    const verticalTarget = this.player.y - VIEW.height * .62;
    this.cameraY = lerp(this.cameraY, verticalTarget, 1 - Math.pow(.004, delta));
    if (this.player.onGround) this.lastSafeX = Math.max(this.lastSafeX, this.player.x - 20);

    const moving = Math.abs(this.player.vx) > 45;
    const altitude = clamp(this.player.x / LEVEL_LENGTH, 0, 1);
    const storm = this.chapterIndex === 3 ? 1 : 0;
    const chapter = CHAPTERS[this.chapterIndex];
    this.windStrength = lerp(this.windStrength, .25 + altitude * .5 + storm * .55, delta * .6);
    this.audio.setWindStrength(this.windStrength);
    this.warmth -= delta * (.34 + altitude * .45 + storm * .7) * chapter.cold * (this.command === "rest" ? .25 : 1);
    if (storm && this.command !== "regroup" && this.player.onGround) this.player.x = Math.max(40, this.player.x - this.windStrength * 9 * delta);
    this.stamina += delta * (moving ? -(this.command === "advance" ? 1.8 : .85) : 3.1);

    if (this.command === "regroup" && this.commandTimer > 0) {
      this.cohesion += delta * 8;
      this.morale += delta * 1.4;
    } else if (this.command === "rest" && this.commandTimer > 0) {
      this.stamina += delta * 12;
      this.warmth += delta * 8;
      this.morale += delta * 1.1;
    } else if (moving) {
      this.cohesion -= delta * (this.command === "advance" ? 1.25 : .6) * (1 + storm * .6);
    }
    if (this.cohesion < 48) this.morale -= delta * .7;
    this.morale = clamp(this.morale, 0, 100);
    this.warmth = clamp(this.warmth, 0, 100);
    this.stamina = clamp(this.stamina, 4, 100);
    this.cohesion = clamp(this.cohesion, 20, 100);

    this.updateExpeditionTasks(delta);
    this.processWorldInteractions();
    this.updateFollowers(delta);
    this.updateParticles(delta);
    this.updateUI();
    this.actionRequested = false;

    if (this.morale <= 0 || this.warmth <= 0) this.fail(this.warmth <= 0 ? "El frío detuvo la expedición." : "La columna perdió la voluntad de continuar.");
    else if (this.player.x >= LEVEL_LENGTH - 130) this.complete();
  }

  updatePreparationState() {
    this.preparation.complete = WORLD_LAYOUT.preparationStations.every((station) => this.preparation[station.id]);
  }

  assignBridgeRoles() {
    const roles = ["anchor-left", "rope-left", "deck-left", "anchor-right", "rope-right", "deck-right", "support", "support"];
    this.followers.forEach((follower, index) => { follower.role = roles[index] || "support"; });
  }

  clearBridgeRoles() {
    this.followers.forEach((follower) => { follower.role = "march"; });
  }

  updateExpeditionTasks(delta) {
    this.updatePreparationState();
    if (this.bridge.stage !== 2 || this.bridge.complete) return;
    if (distance(this.player.x, this.bridge.siteX) > 310 || this.command !== "regroup") return;
    const workers = this.followers.filter((follower) => follower.active).length;
    const rate = (.055 + this.cohesion * .00055) * (workers / 8);
    this.bridge.progress = clamp(this.bridge.progress + delta * rate, 0, 1);
    this.stamina = clamp(this.stamina - delta * .45, 4, 100);
    if (this.bridge.progress >= 1) {
      this.bridge.stage = 3;
      this.audio.play("checkpoint");
      this.showToast("ESTRUCTURA LISTA · Revisa y asegura el paso con E.", 3600);
    }
  }

  missionInteraction() {
    if (!this.preparation.complete) {
      const station = WORLD_LAYOUT.preparationStations.find((item) => !this.preparation[item.id] && distance(this.player.x, item.x) < 92);
      if (station) return {
        text: station.label,
        action: () => {
          this.preparation[station.id] = true;
          this.updatePreparationState();
          this.audio.play("supply");
          this.player.setAction("help", .65);
          this.emit(station.x, (this.groundAt(station.x) ?? this.player.y) - 55, 15, "#f4d698");
          this.showToast(this.preparation.complete ? "COLUMNA PREPARADA · La expedición puede partir." : "Tarea completada · Continúa preparando la columna.", 3000);
        },
      };
    }
    if (distance(this.player.x, this.bridge.siteX) < 150 && !this.bridge.complete) {
      if (this.bridge.stage === 0) return { text: "EXAMINAR LA QUEBRADA", action: () => { this.bridge.stage = 1; this.showToast("Se necesita el puente portátil. Asigna los equipos con E.", 3200); } };
      if (this.bridge.stage === 1) return { text: "ASIGNAR EQUIPOS DE PUENTE", action: () => { this.bridge.stage = 2; this.assignBridgeRoles(); this.issueCommand("regroup"); this.showToast("CONSTRUCCIÓN · Mantén REAGRUPAR y protege el área.", 3600); } };
      if (this.bridge.stage === 2) return { text: "CONSTRUYENDO · " + Math.round(this.bridge.progress * 100) + "% · REAGRUPAR", action: () => {} };
      if (this.bridge.stage === 3) return { text: "PROBAR Y ASEGURAR EL PUENTE", action: () => { this.bridge.complete = true; this.bridge.stage = 4; this.clearBridgeRoles(); this.morale = clamp(this.morale + 12, 0, 100); this.cohesion = clamp(this.cohesion + 10, 0, 100); this.audio.play("checkpoint"); this.saveProgress(); this.showToast("PUENTE ASEGURADO · La columna puede cruzar unida.", 4200); } };
    }
    return null;
  }

  processWorldInteractions() {
    while (this.storyIndex < this.storyMarkers.length && this.player.x >= this.storyMarkers[this.storyIndex].x) {
      this.showToast(this.storyMarkers[this.storyIndex].text, 4200);
      this.storyIndex += 1;
    }

    this.processHazards();
    for (const checkpoint of this.checkpoints) {
      if (!checkpoint.activated && this.player.x >= checkpoint.x) {
        checkpoint.activated = true;
        this.checkpointCount = Math.max(this.checkpointCount, checkpoint.index + 1);
        this.lastSafeX = checkpoint.x + 25;
        this.progress.checkpoint = this.checkpointCount;
        this.progress.completed = false;
        this.saveProgress();
        this.audio.play("checkpoint");
        this.emit(checkpoint.x, (this.groundAt(checkpoint.x) ?? this.player.y) - 55, 24, "#8fd0ed");
        this.showToast("PUESTO " + (checkpoint.index + 1) + " ASEGURADO · Estado completo guardado", 3600);
      }
    }

    let nearby = this.missionInteraction();
    for (const cache of this.suppliesWorld) {
      if (!nearby && !cache.taken && distance(this.player.x, cache.x) < 72) nearby = { text: "RECOGER PROVISIONES", action: () => { cache.taken = true; this.supplies += 2; this.audio.play("supply"); this.showToast("Provisiones recuperadas · +2"); } };
    }
    for (const rescue of this.rescuePoints) {
      if (!nearby && !rescue.rescued && distance(this.player.x, rescue.x) < 78) nearby = { text: "AYUDAR · " + rescue.label.toUpperCase(), action: () => { rescue.rescued = true; this.rescues += 1; this.morale = clamp(this.morale + 12, 0, 100); this.cohesion = clamp(this.cohesion + 10, 0, 100); this.audio.play("help"); this.player.setAction("help", .82); this.emit(rescue.x, (this.groundAt(rescue.x) ?? this.player.y) - 45, 18, "#f4d698"); this.showToast("Nadie queda atrás · Moral recuperada"); } };
    }
    for (const camp of this.camps) {
      if (!nearby && !camp.used && distance(this.player.x, camp.x) < 85) nearby = { text: "ENCENDER VIVAC", action: () => { camp.used = true; this.warmth = clamp(this.warmth + 28, 0, 100); this.stamina = clamp(this.stamina + 20, 0, 100); this.audio.play("supply"); this.showToast("Vivac asegurado · La columna recupera abrigo"); } };
    }
    this.ui.interaction.hidden = !nearby;
    if (nearby) this.ui.interactionText.textContent = nearby.text;
    if (nearby && this.actionRequested) nearby.action();
  }

  updateFollowers(delta) {
    const commandSpacing = this.command === "regroup" ? 34 : this.command === "advance" ? 52 : 43;
    for (let index = 0; index < this.followers.length; index += 1) {
      const follower = this.followers[index];
      const target = 74 + index * commandSpacing;
      follower.offset = lerp(follower.offset, target, delta * (this.command === "regroup" ? 2.5 : 1.25));
      follower.phase += delta * (2.8 + Math.abs(this.player.vx) * .012);
    }
  }

  setback(message, push = 190) {
    if (this.hazardCooldown > 0) return;
    this.hazardCooldown = 1.4;
    this.setbacks += 1;
    if (this.setbacks % 3 === 0 && this.columnSize > 5) {
      this.columnSize -= 1;
      const lostFollower = [...this.followers].reverse().find((follower) => follower.active);
      if (lostFollower) lostFollower.active = false;
      message += " Un integrante debió regresar al último puesto.";
    }
    this.player.x = Math.max(80, this.lastSafeX - push);
    const ground = this.groundAt(this.player.x) || 520;
    this.player.y = ground - this.player.height / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnerable = 1.5;
    this.morale = clamp(this.morale - 10, 0, 100);
    this.stamina = clamp(this.stamina - 12, 0, 100);
    this.shake = this.reducedMotion ? 0 : 15;
    this.flash = .32;
    this.audio.play("danger");
    this.showToast(message, 3200);
  }

  fail(message) {
    if (this.state !== "running") return;
    this.state = "failed";
    this.showResult("LA MONTAÑA DETUVO LA MARCHA", "La expedición necesita otra estrategia.", message, "Sin medalla");
  }

  complete() {
    if (this.state !== "running") return;
    this.state = "complete";
    const leadership = Math.round(this.morale * 0.55 + this.cohesion * 0.25 + (this.columnSize / 8) * 20);
    const medal = this.rescues === 3 && this.columnSize === 8 && this.morale >= 65 && this.setbacks <= 2 ? "ORO" : this.rescues >= 2 && this.columnSize >= 7 ? "PLATA" : "BRONCE";
    const values = { BRONCE: 1, PLATA: 2, ORO: 3 };
    if ((values[medal] || 0) > (values[this.progress.medal] || 0)) this.progress.medal = medal;
    this.progress.completed = true;
    this.progress.checkpoint = 0;
    this.progress.bestLeadership = Math.max(Number(this.progress.bestLeadership) || 0, leadership);
    if (!this.progress.bestTime || this.runTime < this.progress.bestTime) this.progress.bestTime = this.runTime;
    this.saveProgress();
    this.audio.play("finish");
    this.showResult("TRAVESÍA COMPLETADA", "La columna alcanzó el valle de Aconcagua", "Liderar fue sostener el ritmo, proteger a los rezagados y atravesar juntos los siete capítulos.", medal);
  }

  showResult(kicker, title, text, medal) {
    this.ui.panelKicker.textContent = kicker;
    this.ui.panelTitle.textContent = title;
    this.ui.panelSubtitle.textContent = `CAPÍTULO ${this.chapterIndex + 1} · ${CHAPTERS[this.chapterIndex].short}`;
    this.ui.panelText.textContent = text;
    this.ui.panelQuote.textContent = "En memoria del General José de San Martín y de quienes hicieron posible la travesía.";
    this.ui.resultDistance.textContent = `${Math.min(100, Math.floor(this.player.x / (LEVEL_LENGTH - 130) * 100))}%`;
    this.ui.resultRescues.textContent = `${this.rescues}/3`;
    this.ui.resultColumn.textContent = `${this.columnSize}/8`;
    const leadership = Math.round(this.morale * 0.55 + this.cohesion * 0.25 + (this.columnSize / 8) * 20);
    this.ui.resultMedal.textContent = medal;
    if (this.ui.resultTime) this.ui.resultTime.textContent = this.formatTime(this.runTime);
    if (this.ui.resultLeadership) this.ui.resultLeadership.textContent = `${leadership}/100`;
    this.ui.resultGrid.hidden = false;
    this.ui.startBtn.hidden = false;
    this.ui.startBtn.textContent = "REINTENTAR LA EXPEDICIÓN";
    this.ui.resumeBtn.hidden = true;
    this.ui.overlay.classList.add("visible");
  }

  showToast(message, duration = 2400) {
    this.ui.toast.textContent = message;
    this.ui.toast.classList.add("visible");
    this.toastTimer = duration / 1000;
  }

  updatePreferenceButtons() {
    this.audio.setMuted(this.soundMuted);
    this.ui.soundBtn.textContent = this.soundMuted ? "SILENCIO" : "SONIDO";
    this.ui.soundBtn.classList.toggle("active", !this.soundMuted);
    this.ui.soundBtn.setAttribute("aria-pressed", String(!this.soundMuted));
    this.ui.motionBtn.textContent = this.reducedMotion ? "CALMA" : "MOVIMIENTO";
    this.ui.motionBtn.classList.toggle("active", !this.reducedMotion);
    this.ui.motionBtn.setAttribute("aria-pressed", String(!this.reducedMotion));
  }

  updateUI() {
    const setMeter = (bar, label, value) => { bar.style.width = value + "%"; label.textContent = String(Math.round(value)); };
    setMeter(this.ui.moraleBar, this.ui.moraleValue, this.morale);
    setMeter(this.ui.warmthBar, this.ui.warmthValue, this.warmth);
    setMeter(this.ui.staminaBar, this.ui.staminaValue, this.stamina);
    this.ui.supplyValue.textContent = String(this.supplies);
    this.ui.columnValue.textContent = this.columnSize + "/8";
    this.ui.progressLabel.textContent = Math.min(100, Math.floor(this.player.x / (LEVEL_LENGTH - 130) * 100)) + "%";
    const chapter = CHAPTERS[this.chapterIndex];
    if (this.ui.chapterLabel) this.ui.chapterLabel.textContent = "CAPÍTULO " + (this.chapterIndex + 1) + " · " + chapter.short;
    let objective = chapter.objective;
    if (!this.preparation.complete) {
      const pending = Object.entries(this.preparation).filter(([key, value]) => key !== "complete" && !value).map(([key]) => ({ rations: "víveres", equipment: "equipo", bridgeKit: "materiales del puente" })[key]);
      objective = "PREPARACIÓN · Reúne " + pending.join(", ");
    } else if (!this.bridge.complete && this.player.x > this.bridge.siteX - 520) {
      objective = this.bridge.stage < 2 ? "INGENIERÍA · Acércate y pulsa E para reunir a la columna" : "CONSTRUCCIÓN · " + Math.round(this.bridge.progress * 100) + "% · Mantén a la columna agrupada";
    } else if (this.warmth < 28) objective = "El frío es crítico · busca un vivac o descansa";
    else if (this.cohesion < 45) objective = "La columna se dispersa · ordena REAGRUPAR";
    this.ui.objectiveLabel.textContent = objective;
    if (this.ui.chapterRail) {
      [...this.ui.chapterRail.children].forEach((item, index) => {
        item.classList.toggle("complete", index < this.chapterIndex);
        item.classList.toggle("current", index === this.chapterIndex);
        item.classList.toggle("active", index === 0 && this.chapterIndex === 0);
      });
    }
  }

  emit(x, y, count, color) {
    if (this.reducedMotion) return;
    for (let index = 0; index < count; index += 1) {
      this.particles.push({ x, y, vx: (Math.random() - .5) * 120, vy: -30 - Math.random() * 100, life: .5 + Math.random() * .5, max: 1, color, size: 2 + Math.random() * 3 });
    }
  }

  updateParticles(delta) {
    this.breathTimer -= delta;
    if (!this.reducedMotion && this.chapterIndex >= 2 && this.breathTimer <= 0) {
      this.breathTimer = 0.75 + Math.random() * 0.5;
      this.particles.push({
        x: this.player.x + this.player.facing * 25,
        y: this.player.y - 42,
        vx: this.player.facing * (18 + Math.random() * 14),
        vy: -8 - Math.random() * 10,
        life: 0.9,
        max: 0.9,
        color: "rgba(238,247,250,0.76)",
        size: 4 + Math.random() * 3,
      });
    }
    if (!this.reducedMotion && Math.random() < delta * (10 + this.windStrength * 24)) {
      this.particles.push({ x: this.cameraX + VIEW.width + 20, y: Math.random() * 520, vx: -150 - this.windStrength * 220, vy: 15 + Math.random() * 25, life: 3, max: 3, color: "#eef7ff", size: 1 + Math.random() * 2 });
    }
    for (const particle of this.particles) {
      particle.x += particle.vx * delta; particle.y += particle.vy * delta; particle.vy += 80 * delta; particle.life -= delta;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  drawBackground(ctx) {
    const chapter = CHAPTERS[this.chapterIndex];
    const image = this.assets.backgrounds[chapter.background] || this.assets.backgrounds.andes;
    if (image && image.complete && image.naturalWidth) {
      const scale = Math.max(VIEW.width / image.naturalWidth, VIEW.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const local = clamp((this.player.x - chapter.start) / Math.max(1, chapter.end - chapter.start), 0, 1);
      const parallaxX = local * Math.max(0, width - VIEW.width) * .72;
      const parallaxY = clamp(this.cameraY * .075, -64, 64);
      ctx.drawImage(image, -parallaxX, (VIEW.height - height) * .5 - parallaxY, width, height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
      gradient.addColorStop(0, "#26486a"); gradient.addColorStop(1, "#d5b27a");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }
    ctx.fillStyle = "rgba(8,18,30," + (.04 + this.player.x / LEVEL_LENGTH * .12) + ")";
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  drawTerrain(ctx) {
    const start = Math.floor(this.cameraX / 18) * 18;
    const end = this.cameraX + VIEW.width + 36;
    const segments = [];
    let points = [];
    for (let x = start; x <= end; x += 18) {
      const inPit = this.pits.some((pit) => x > pit.start && x < pit.end);
      if (inPit) {
        if (points.length > 1) segments.push(points);
        points = [];
      } else points.push({ x: x - this.cameraX, y: terrainHeightAt(x) - this.cameraY });
    }
    if (points.length > 1) segments.push(points);
    const terrain = CHAPTERS[this.chapterIndex].terrain;
    const gradient = ctx.createLinearGradient(0, Math.max(0, VIEW.height - 320), 0, VIEW.height);
    gradient.addColorStop(0, terrain[0]); gradient.addColorStop(1, terrain[1]);
    for (const segment of segments) {
      ctx.beginPath(); ctx.moveTo(segment[0].x, VIEW.height + 40); ctx.lineTo(segment[0].x, segment[0].y);
      for (const point of segment.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.lineTo(segment.at(-1).x, VIEW.height + 40); ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();
      ctx.beginPath(); ctx.moveTo(segment[0].x, segment[0].y);
      for (const point of segment.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = this.chapterIndex >= 3 ? "rgba(239,247,250,0.76)" : "rgba(218,207,183,0.68)";
      ctx.lineWidth = this.chapterIndex >= 3 ? 7 : 4; ctx.stroke();
      ctx.strokeStyle = "rgba(39,35,32,0.55)"; ctx.lineWidth = 2; ctx.stroke();
    }
    for (const pit of this.pits) {
      const left = pit.start - this.cameraX; const right = pit.end - this.cameraX;
      if (right < -80 || left > VIEW.width + 80) continue;
      const lipY = Math.min(terrainHeightAt(pit.start - 2), terrainHeightAt(pit.end + 2)) - this.cameraY;
      const chasm = ctx.createLinearGradient(0, lipY, 0, VIEW.height);
      chasm.addColorStop(0, "rgba(7,18,25,.82)"); chasm.addColorStop(.48, "rgba(3,10,16,.96)"); chasm.addColorStop(1, "#010407");
      ctx.fillStyle = chasm; ctx.beginPath(); ctx.moveTo(left - 6, lipY - 2);
      ctx.bezierCurveTo(left + 32, lipY + 38, right - 34, lipY + 42, right + 6, lipY - 2);
      ctx.lineTo(right + 58, VIEW.height + 30); ctx.lineTo(left - 58, VIEW.height + 30); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(148,205,225,.62)"; ctx.lineWidth = 6; ctx.beginPath();
      ctx.moveTo(left + 22, lipY + 118); ctx.bezierCurveTo((left + right) / 2, lipY + 95, (left + right) / 2, lipY + 145, right - 20, lipY + 116); ctx.stroke();
    }
    for (let x = start; x < end; x += 74) {
      if (this.pits.some((pit) => x > pit.start && x < pit.end)) continue;
      const ground = terrainHeightAt(x) - this.cameraY; const seed = Math.abs(Math.sin(x * 12.9898));
      ctx.fillStyle = seed > .55 ? "rgba(230,237,238,.22)" : "rgba(25,24,23,.28)";
      ctx.beginPath(); ctx.ellipse(x - this.cameraX, ground + 13 + seed * 14, 8 + seed * 15, 3 + seed * 4, seed - .5, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawWorldObjects(ctx) {
    this.drawPreparationStations(ctx);
    this.drawBridge(ctx);
    for (const hazard of [...this.rocks, ...this.branches, ...this.iceRidges]) {
      const frame = hazard.type === "rock" ? 0 : hazard.type === "branch" ? 4 : 7;
      const dimensions = hazard.type === "branch" ? [150, 200] : hazard.type === "ice" ? [118, 157] : [112 + hazard.size, 149 + hazard.size];
      this.drawProp(ctx, frame, hazard.x, dimensions[0], dimensions[1], 0, hazard.hit ? .46 : 1);
    }
    for (const cache of this.suppliesWorld) if (!cache.taken) this.drawSupply(ctx, cache.x);
    for (let index = 0; index < this.rescuePoints.length; index += 1) {
      const rescue = this.rescuePoints[index]; if (!rescue.rescued) this.drawRescue(ctx, rescue.x, index);
    }
    for (const camp of this.camps) this.drawCamp(ctx, camp);
    for (const checkpoint of this.checkpoints) this.drawCheckpoint(ctx, checkpoint);
    this.drawGoal(ctx);
  }

  drawLogisticsProp(ctx, frame, worldX, width = 150, height = 150, alpha = 1) {
    const x = worldX - this.cameraX; const ground = this.groundAt(worldX);
    if (ground === null || x < -width || x > VIEW.width + width) return;
    ctx.save(); ctx.translate(x, ground - this.cameraY); ctx.globalAlpha = alpha;
    this.drawAtlasCell(ctx, this.assets.logisticsAtlas, frame, 4, 2, -width / 2, -height * LOGISTICS_CONTACT[frame], width, height);
    ctx.restore();
  }

  drawPreparationStations(ctx) {
    for (const station of WORLD_LAYOUT.preparationStations) {
      const complete = this.preparation[station.id];
      this.drawLogisticsProp(ctx, station.frame, station.x, station.id === "rations" ? 142 : 164, 142, complete ? .48 : 1);
      const x = station.x - this.cameraX; const y = terrainHeightAt(station.x) - this.cameraY - 136;
      if (x < -100 || x > VIEW.width + 100) continue;
      ctx.save(); ctx.textAlign = "center"; ctx.font = "800 13px sans-serif";
      ctx.fillStyle = complete ? "#98d7b4" : "#f2d18e"; ctx.fillText((complete ? "✓ " : "E · ") + station.label, x, y); ctx.restore();
    }
  }

  drawBridge(ctx) {
    const bridge = this.bridge; const left = bridge.start - this.cameraX; const right = bridge.end - this.cameraX;
    if (right < -180 || left > VIEW.width + 180) return;
    const leftY = terrainHeightAt(bridge.start) - this.cameraY; const rightY = terrainHeightAt(bridge.end) - this.cameraY;
    if (bridge.stage < 2) this.drawLogisticsProp(ctx, 6, bridge.siteX, 162, 162, 1);
    const progress = bridge.complete ? 1 : bridge.progress;
    if (progress <= 0) return;
    ctx.save(); ctx.lineCap = "round";
    ctx.strokeStyle = "#5d3d24"; ctx.lineWidth = 8;
    for (const [x, y] of [[left, leftY], [right, rightY]]) { ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x, y - 70); ctx.stroke(); }
    ctx.strokeStyle = "#b69762"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(left, leftY - 58); ctx.bezierCurveTo(lerp(left, right, .33), leftY + 18, lerp(left, right, .66), rightY + 18, right, rightY - 58); ctx.stroke();
    const plankCount = Math.floor(24 * progress);
    for (let index = 0; index < plankCount; index += 1) {
      const t = index / 23; const x = lerp(left + 5, right - 5, t); const y = lerp(leftY, rightY, t) + Math.sin(t * Math.PI) * 20;
      ctx.strokeStyle = index % 2 ? "#8c6538" : "#a57b45"; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(223,192,130,.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(left, leftY - 54); ctx.bezierCurveTo(lerp(left, right, .33), leftY + 10, lerp(left, right, .66), rightY + 10, right, rightY - 54); ctx.stroke();
    ctx.restore();
  }

  drawSupply(ctx, worldX) {
    this.drawProp(ctx, 1, worldX, 112, 149);
  }

  drawRescue(ctx, worldX, index = 0) {
    const x = worldX - this.cameraX;
    if (x < -80 || x > VIEW.width + 80) return;
    const ground = this.groundAt(worldX);
    if (ground === null) return;
    const frame = index % 2 === 0 ? 3 : 7;
    ctx.save();
    ctx.translate(x, ground - this.cameraY);
    this.drawAtlasCell(ctx, this.assets.expeditionAtlas, frame, 4, 2, -54, -144 * EXPEDITION_FEET[frame], 108, 144);
    ctx.fillStyle = "#f4d699";
    ctx.font = "900 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", 0, -136);
    ctx.restore();
  }

  drawCamp(ctx, camp) {
    this.drawProp(ctx, 2, camp.x, 182, 243);
    if (camp.used) this.drawProp(ctx, 3, camp.x + 72, 84, 112);
  }

  drawCheckpoint(ctx, checkpoint) {
    this.drawProp(ctx, 6, checkpoint.x, 98, 131, 0, checkpoint.activated ? 1 : 0.55);
    if (checkpoint.activated) {
      const x = checkpoint.x - this.cameraX;
      const y = this.groundAt(checkpoint.x);
      ctx.save();
      ctx.fillStyle = "rgba(143,208,237,0.16)";
      ctx.beginPath();
      ctx.arc(x, y - this.cameraY - 47, 31 + Math.sin(this.elapsed * 2) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawGoal(ctx) {
    const goalX = LEVEL_LENGTH - 95;
    this.drawProp(ctx, 2, goalX, 210, 280);
    this.drawProp(ctx, 3, goalX + 88, 96, 128);
  }
  drawFollowers(ctx) {
    const atlas = this.assets.expeditionAtlas;
    const building = !this.bridge.complete && this.bridge.stage >= 2;
    for (let index = this.followers.length - 1; index >= 0; index -= 1) {
      const follower = this.followers[index]; if (!follower.active) continue;
      let x; let pose;
      if (building) {
        const side = index % 2 === 0 ? -1 : 1;
        x = side < 0 ? this.bridge.start - 34 - Math.floor(index / 2) * 34 : this.bridge.end + 34 + Math.floor(index / 2) * 34;
        pose = { y: terrainHeightAt(x), airborne: false, progress: 0 };
      } else {
        x = this.player.x - follower.offset; pose = this.followerPoseAt(x, index);
      }
      if (!pose) continue;
      const screenX = x - this.cameraX; const resting = this.command === "rest" && this.commandTimer > 0; const fatigued = this.cohesion < 38;
      let frame;
      if (building) frame = follower.type === "arriero" ? 7 : 3;
      else if (pose.airborne) frame = follower.type === "arriero" ? 5 : 2;
      else if (follower.type === "arriero") frame = resting || fatigued ? 7 : 4 + (Math.floor(follower.phase) % 2);
      else frame = resting || fatigued ? 3 : Math.floor(follower.phase) % 3;
      ctx.save(); ctx.translate(screenX, pose.y - this.cameraY); ctx.globalAlpha = .82 + index * .018;
      if (!pose.airborne) { ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.beginPath(); ctx.ellipse(0, 0, 23, 6, 0, 0, Math.PI * 2); ctx.fill(); }
      else ctx.rotate((.5 - pose.progress) * .1);
      this.drawAtlasCell(ctx, atlas, frame, 4, 2, -49, -131 * EXPEDITION_FEET[frame], 98, 131); ctx.restore();
    }
  }

  drawParticles(ctx) {
    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(particle.life / particle.max, 0, 1); ctx.fillStyle = particle.color; ctx.beginPath();
      ctx.arc(particle.x - this.cameraX, particle.y - this.cameraY, particle.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawForegroundAtmosphere(ctx) {
    const chapter = CHAPTERS[this.chapterIndex];
    ctx.save();
    ctx.fillStyle = chapter.tint;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    if (this.chapterIndex === 2) {
      const vignette = ctx.createRadialGradient(VIEW.width * 0.5, VIEW.height * 0.58, 80, VIEW.width * 0.5, VIEW.height * 0.55, VIEW.width * 0.7);
      vignette.addColorStop(0, "rgba(4,14,34,0.02)");
      vignette.addColorStop(1, "rgba(2,8,23,0.5)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      ctx.fillStyle = "rgba(232,242,255,0.64)";
      for (let index = 0; index < 34; index += 1) {
        const x = (index * 197 + 43) % VIEW.width;
        const y = 34 + ((index * 83) % Math.max(80, VIEW.height * 0.42));
        ctx.fillRect(x, y, index % 5 === 0 ? 2 : 1, index % 5 === 0 ? 2 : 1);
      }
    }
    if (this.chapterIndex === 3) {
      const fog = ctx.createLinearGradient(0, VIEW.height * 0.24, 0, VIEW.height);
      fog.addColorStop(0, "rgba(226,239,244,0.03)");
      fog.addColorStop(0.65, "rgba(222,235,240,0.12)");
      fog.addColorStop(1, "rgba(210,224,230,0.2)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }
    ctx.restore();
  }

  drawChapterCard(ctx) {
    if (this.chapterRevealTimer <= 0 || this.state !== "running") return;
    const chapter = CHAPTERS[this.chapterIndex];
    const opacity = Math.min(1, this.chapterRevealTimer / 0.45, (3 - this.chapterRevealTimer) / 0.4 + 0.2);
    const width = Math.min(470, VIEW.width - 40);
    const height = 104;
    const x = (VIEW.width - width) / 2;
    const y = VIEW.height * 0.26;
    ctx.save();
    ctx.globalAlpha = clamp(opacity, 0, 1);
    ctx.fillStyle = "rgba(7,15,24,0.84)";
    ctx.strokeStyle = "rgba(228,193,126,0.72)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 16);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#e4c17e";
    ctx.font = "900 11px sans-serif";
    ctx.fillText(`CAPÍTULO ${this.chapterIndex + 1} DE ${CHAPTERS.length}`, VIEW.width / 2, y + 24);
    ctx.fillStyle = "#fff7e8";
    ctx.font = "700 28px Georgia, serif";
    ctx.fillText(chapter.name, VIEW.width / 2, y + 57);
    ctx.fillStyle = "#c7d0d8";
    ctx.font = "600 12px sans-serif";
    ctx.fillText(chapter.objective, VIEW.width / 2, y + 82);
    ctx.restore();
  }
  render() {

    const ctx = this.ctx;
    ctx.clearRect(0,0,VIEW.width,VIEW.height);
    const shakeX = this.reducedMotion ? 0 : (Math.random()-.5)*this.shake;
    const shakeY = this.reducedMotion ? 0 : (Math.random()-.5)*this.shake*.5;
    ctx.save(); ctx.translate(shakeX,shakeY);
    this.drawBackground(ctx);
    this.drawTerrain(ctx);
    this.drawWorldObjects(ctx);
    this.drawFollowers(ctx);
    this.player.render(ctx, this.cameraX, this.cameraY);
    this.drawParticles(ctx);
    if (this.commandPulse > 0) {
      const pulseX = this.player.x - this.cameraX;
      const pulseY = this.player.y - this.cameraY + 8;
      ctx.save();
      ctx.strokeStyle = `rgba(228,193,126,${this.commandPulse * 0.55})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 34 + (1 - this.commandPulse) * 92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    this.drawForegroundAtmosphere(ctx);
    ctx.restore();
    this.drawChapterCard(ctx);
    if (this.flash>0) { ctx.fillStyle=`rgba(214,117,93,${this.flash*.7})`; ctx.fillRect(0,0,VIEW.width,VIEW.height); }
    if (this.player.x>3750&&this.player.x<4550) { ctx.fillStyle="rgba(216,232,240,.09)"; ctx.fillRect(0,0,VIEW.width,VIEW.height); }
  }

  frame(time) {
    const delta = Math.min(.034,(time-this.lastTime)/1000||0); this.lastTime=time;
    this.update(delta); this.render(); requestAnimationFrame((next)=>this.frame(next));
  }
}

const canvas = document.getElementById("gameCanvas");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("No se encontró #gameCanvas");
window.__elCruceGame = new Game(canvas);

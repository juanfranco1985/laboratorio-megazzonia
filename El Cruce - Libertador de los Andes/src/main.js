const VIEW = { width: 1280, height: 720 };
const LEVEL_LENGTH = 11200;
const STORAGE_KEY = "megazzonia_el_cruce_progress_v1";
const ART = Object.freeze({
  background: "assets/art/andes_dawn_v1.png",
  sanMartin: "assets/art/san_martin_v1.png",
  sanMartinAtlas: "assets/art/san_martin_states_atlas_v4.png",
  sanMartinWalkAtlas: "assets/art/san_martin_walk_atlas_v3.png",
  expeditionAtlas: "assets/art/expedition_sprite_atlas_v1.png",
  propsAtlas: "assets/art/mountain_props_atlas_v1.png",
});

// Punto de contacto inferior de cada celda. Los atlas incluyen margen transparente
// y no todos los dibujos terminan en el borde de su fotograma.
const SAN_MARTIN_FEET = Object.freeze([.994, .994, .989, .967, .972, .994, .939, .994, .928, .956, .928, .928]);
const SAN_MARTIN_CENTER = Object.freeze([.5, .467, .459, .494, .536, .53, .494, .478, .506, .561, .514, .464]);
const SAN_MARTIN_WALK_FEET = Object.freeze([.898, .906, .906, .91, .91, .914, .922, .922]);
const SAN_MARTIN_WALK_CENTER = Object.freeze([.63, .529, .417, .417, .628, .43, .398, .396]);
const EXPEDITION_FEET = Object.freeze([.945, .945, .945, .949, .883, .879, .883, .898]);
const PROP_CONTACT = Object.freeze([.836, .832, .816, .84, .703, .754, .785, .758]);

const CHAPTERS = Object.freeze([
  { name: "El Plumerillo", short: "PLUMERILLO", start: 0, end: 1800, objective: "Organiza la columna y alcanza el primer puesto", tint: "rgba(214,164,91,0.04)", cold: 0.72 },
  { name: "Primer ascenso", short: "EL ASCENSO", start: 1800, end: 4200, objective: "Supera las primeras quebradas sin dispersarte", tint: "rgba(86,126,159,0.05)", cold: 0.92 },
  { name: "Noche en la cordillera", short: "LA NOCHE", start: 4200, end: 6600, objective: "Encuentra el vivac antes de perder abrigo", tint: "rgba(8,26,60,0.34)", cold: 1.2 },
  { name: "Paso de alta montaña", short: "ALTA MONTAÑA", start: 6600, end: 9200, objective: "Resiste el viento y mantén unida la columna", tint: "rgba(207,230,241,0.13)", cold: 1.62 },
  { name: "Descenso hacia Chile", short: "EL DESCENSO", start: 9200, end: 11200, objective: "Conduce a todos hasta el refugio final", tint: "rgba(226,174,92,0.06)", cold: 1.02 },
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const distance = (a, b) => Math.abs(a - b);

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
    this.x = clamp(this.x + this.vx * delta, 40, LEVEL_LENGTH + 80);
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

    if (this.y > VIEW.height + 180) game.setback("Una grieta separó a la vanguardia de la columna.");
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

  render(ctx, cameraX) {
    const screenX = this.x - cameraX;
    const ground = this.game.groundAt(this.x);
    const feet = this.y + this.height / 2;
    if (ground !== null) {
      const altitude = Math.max(0, ground - feet);
      const shadowScale = clamp(1 - altitude / 240, .28, 1);
      ctx.save();
      ctx.globalAlpha = .26 * shadowScale;
      ctx.fillStyle = "#050709";
      ctx.beginPath();
      ctx.ellipse(screenX, ground + 2, 30 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(screenX, this.y);
    if (this.facing < 0) ctx.scale(-1, 1);
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 12) % 2 === 0) ctx.globalAlpha = 0.44;

    const atlas = this.game.assets.sanMartinAtlas;
    const walkAtlas = this.game.assets.sanMartinWalkAtlas;
    const walking = this.onGround
      && Math.abs(this.vx) > 35
      && !this.actionPose
      && this.landingTimer <= 0
      && this.turnTimer <= 0
      && !(this.game.command === "rest" && this.game.commandTimer > 0)
      && this.invulnerable <= 0;
    if (walking && walkAtlas.complete && walkAtlas.naturalWidth) {
      const frame = Math.floor(this.step * .62) % 8;
      const width = 110;
      const height = 146;
      const spriteX = -width * SAN_MARTIN_WALK_CENTER[frame];
      const spriteY = this.height / 2 - height * SAN_MARTIN_WALK_FEET[frame];
      this.game.drawAtlasCell(ctx, walkAtlas, frame, 4, 2, spriteX, spriteY, width, height);
    } else if (atlas.complete && atlas.naturalWidth) {
      const frame = this.getFrame();
      const width = 146;
      const height = 146;
      const spriteX = -width * SAN_MARTIN_CENTER[frame];
      const spriteY = this.onGround ? this.height / 2 - height * SAN_MARTIN_FEET[frame] : -height / 2;
      this.game.drawAtlasCell(ctx, atlas, frame, 4, 3, spriteX, spriteY, width, height);
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
      background: loadImage(ART.background),
      sanMartin: loadImage(ART.sanMartin),
      sanMartinAtlas: loadImage(ART.sanMartinAtlas),
      sanMartinWalkAtlas: loadImage(ART.sanMartinWalkAtlas),
      expeditionAtlas: loadImage(ART.expeditionAtlas),
      propsAtlas: loadImage(ART.propsAtlas),
    };
    this.audio = new WebAudio();
    this.input = { left: false, right: false };
    this.state = "intro";
    this.elapsed = 0;
    this.cameraX = 0;
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
    this.breathTimer = 0.5;
    this.commandPulse = 0;
    this.checkpointCount = 0;
    this.runTime = 0;
    this.windStrength = .35;
    this.command = "advance";
    this.commandTimer = 0;
    this.pits = [
      { start: 1960, end: 2200 }, { start: 3760, end: 4040 }, { start: 6240, end: 6520 }, { start: 8760, end: 9050 },
    ];
    this.rocks = [1440, 2860, 4720, 5560, 7320, 8140, 9880].map((x, index) => ({ x, hit: false, size: 27 + (index % 3) * 8, type: "rock" }));
    this.branches = [3480, 6020, 9380].map((x) => ({ x, hit: false, size: 30, type: "branch" }));
    this.iceRidges = [6860, 7860, 8620].map((x) => ({ x, hit: false, size: 34, type: "ice" }));
    this.suppliesWorld = [2500, 5860, 9400].map((x) => ({ x, taken: false }));
    this.rescuePoints = [3300, 7040, 9720].map((x, index) => ({ x, rescued: false, label: ["Soldado exhausto", "Arriero herido", "Granadero rezagado"][index] }));
    this.camps = [5100, 8300].map((x) => ({ x, used: false }));
    this.checkpoints = [1760, 4160, 6560, 9160].map((x, index) => ({ x, index, activated: false }));
    this.storyMarkers = [
      { x: 280, text: "TUTORIAL · Muévete con A/D o flechas. Pulsa dos veces W, ↑ o Espacio para el doble salto." },
      { x: 720, text: "LIDERAZGO · Usa 1 para avanzar, 2 para reagrupar y 3 para descansar." },
      { x: 1040, text: "La montaña exige ritmo, no prisa. Mantén unida la columna." },
      { x: 4300, text: "La altura castiga el esfuerzo. Reagrupar también es avanzar." },
      { x: 7800, text: "El viento arrecia. Busca el abrigo del próximo vivac." },
      { x: 10400, text: "La cumbre queda atrás. Nadie se libera solo." },
    ];
    this.followers = Array.from({ length: 8 }, (_, index) => ({ offset: 72 + index * 47, phase: index * .8, active: true, type: index % 3 === 0 ? "arriero" : "grenadier" }));
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
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; }
  }

  saveProgress() {
    this.progress.soundMuted = this.soundMuted;
    this.progress.reducedMotion = this.reducedMotion;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  start() {
    this.audio.unlock();
    this.player.reset();
    this.createWorld();
    const resumeIndex = this.progress.completed ? 0 : clamp(Number(this.progress.checkpoint) || 0, 0, this.checkpoints.length);
    if (resumeIndex > 0) {
      this.player.x = this.checkpoints[resumeIndex - 1].x + 45;
      this.lastSafeX = this.player.x;
      this.chapterIndex = Math.min(resumeIndex, CHAPTERS.length - 1);
    }
    this.state = "running";
    this.ui.overlay.classList.remove("visible");
    this.ui.resultGrid.hidden = true;
    this.ui.startBtn.textContent = "REINICIAR EL ASCENSO";
    this.showToast(resumeIndex > 0
      ? `Retomamos desde el puesto ${resumeIndex}. La columna vuelve a marchar.`
      : "Orden inicial: AVANZAR. La columna seguirá tu ritmo.", 3200);
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
    const nextIndex = CHAPTERS.findIndex((chapter) => this.player.x < chapter.end);
    const safeIndex = nextIndex < 0 ? CHAPTERS.length - 1 : nextIndex;
    if (safeIndex !== this.chapterIndex) {
      this.chapterIndex = safeIndex;
      this.chapterRevealTimer = 3;
      this.audio.play("command");
      this.emit(this.player.x, this.groundAt(this.player.x) - 70, 20, "#8fd0ed");
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
  groundAt(x) {
    let edgeDrop = 0;
    for (const pit of this.pits) {
      if (x > pit.start && x < pit.end) return null;
      const distanceToEdge = x <= pit.start ? pit.start - x : x - pit.end;
      if (distanceToEdge < 76) edgeDrop = Math.max(edgeDrop, (76 - distanceToEdge) * 0.46);
    }
    return VIEW.height - 172 + Math.sin(x * 0.0032) * 32 + Math.sin(x * 0.009) * 11 - clamp(x / LEVEL_LENGTH, 0, 1) * 34 + edgeDrop;
  }

  followerPoseAt(x, index) {
    for (const pit of this.pits) {
      if (x < pit.start || x > pit.end) continue;
      const progress = clamp((x - pit.start) / (pit.end - pit.start), 0, 1);
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
    this.toastTimer = Math.max(0, this.toastTimer - delta);
    if (this.toastTimer === 0) this.ui.toast.classList.remove("visible");

    this.player.update(delta);
    const cameraFocus = VIEW.width < 900 ? 190 : 300;
    const lookAhead = clamp(this.player.vx * .42, -82, 128);
    const cameraTarget = clamp(this.player.x - cameraFocus + lookAhead, 0, Math.max(0, LEVEL_LENGTH - VIEW.width + 120));
    this.cameraX = lerp(this.cameraX, cameraTarget, 1 - Math.pow(.002, delta));
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

    this.processWorldInteractions();
    this.updateFollowers(delta);
    this.updateParticles(delta);
    this.updateUI();
    this.actionRequested = false;

    if (this.morale <= 0 || this.warmth <= 0) this.fail(this.warmth <= 0 ? "El frío detuvo la expedición." : "La columna perdió la voluntad de continuar.");
    else if (this.player.x >= LEVEL_LENGTH - 130) this.complete();
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
        this.emit(checkpoint.x, this.groundAt(checkpoint.x) - 55, 24, "#8fd0ed");
        this.showToast(`PUESTO ${checkpoint.index + 1} ASEGURADO · El progreso queda guardado`, 3600);
      }
    }

    let nearby = null;
    for (const cache of this.suppliesWorld) {
      if (!cache.taken && distance(this.player.x, cache.x) < 72) {
        nearby = { text: "RECOGER PROVISIONES", action: () => { cache.taken = true; this.supplies += 2; this.audio.play("supply"); this.showToast("Provisiones recuperadas · +2"); } };
      }
    }
    for (const rescue of this.rescuePoints) {
      if (!rescue.rescued && distance(this.player.x, rescue.x) < 78) {
        nearby = { text: `AYUDAR · ${rescue.label.toUpperCase()}`, action: () => { rescue.rescued = true; this.rescues += 1; this.morale = clamp(this.morale + 12, 0, 100); this.cohesion = clamp(this.cohesion + 10, 0, 100); this.audio.play("help"); this.player.setAction("help", 0.82); this.emit(rescue.x, this.groundAt(rescue.x) - 45, 18, "#f4d698"); this.showToast("Nadie queda atrás · Moral recuperada"); } };
      }
    }
    for (const camp of this.camps) {
      if (!camp.used && distance(this.player.x, camp.x) < 85) {
        nearby = { text: "ENCENDER VIVAC", action: () => { camp.used = true; this.warmth = clamp(this.warmth + 28, 0, 100); this.stamina = clamp(this.stamina + 20, 0, 100); this.audio.play("supply"); this.showToast("Vivac asegurado · La columna recupera abrigo"); } };
      }
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
    this.showResult("TRAVESÍA COMPLETADA", "La columna alcanzó el refugio", "Liderar fue sostener el ritmo, proteger a los rezagados y atravesar juntos los cinco capítulos.", medal);
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
    this.ui.startBtn.textContent = "REINTENTAR EL ASCENSO";
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
    const setMeter = (bar, label, value) => { bar.style.width = `${value}%`; label.textContent = String(Math.round(value)); };
    setMeter(this.ui.moraleBar, this.ui.moraleValue, this.morale);
    setMeter(this.ui.warmthBar, this.ui.warmthValue, this.warmth);
    setMeter(this.ui.staminaBar, this.ui.staminaValue, this.stamina);
    this.ui.supplyValue.textContent = String(this.supplies);
    this.ui.columnValue.textContent = `${this.columnSize}/8`;
    this.ui.progressLabel.textContent = `${Math.min(100, Math.floor(this.player.x / (LEVEL_LENGTH - 130) * 100))}%`;
    const chapter = CHAPTERS[this.chapterIndex];
    if (this.ui.chapterLabel) this.ui.chapterLabel.textContent = `CAPÍTULO ${this.chapterIndex + 1} · ${chapter.short}`;
    if (this.warmth < 28) this.ui.objectiveLabel.textContent = "El frío es crítico · busca un vivac o descansa";
    else if (this.cohesion < 45) this.ui.objectiveLabel.textContent = "La columna se dispersa · ordena REAGRUPAR";
    else this.ui.objectiveLabel.textContent = chapter.objective;
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
    const image = this.assets.background;
    if (image.complete && image.naturalWidth) {
      const scale = Math.max(VIEW.width / image.naturalWidth, VIEW.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const parallax = (this.cameraX / LEVEL_LENGTH) * Math.max(0, width - VIEW.width) * .8;
      ctx.drawImage(image, -parallax, (VIEW.height - height) * .5, width, height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
      gradient.addColorStop(0, "#26486a"); gradient.addColorStop(1, "#d5b27a"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }
    ctx.fillStyle = `rgba(8,18,30,${.05 + this.player.x / LEVEL_LENGTH * .12})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  drawTerrain(ctx) {
    const start = Math.floor(this.cameraX / 18) * 18;
    const end = this.cameraX + VIEW.width + 36;
    const segments = [];
    let points = [];
    for (let x = start; x <= end; x += 18) {
      const ground = this.groundAt(x);
      if (ground === null) {
        if (points.length > 1) segments.push(points);
        points = [];
      } else {
        points.push({ x: x - this.cameraX, y: ground, worldX: x });
      }
    }
    if (points.length > 1) segments.push(points);

    const chapterColors = [
      ["#6d5b49", "#302c2a"], ["#5b544b", "#292827"], ["#414852", "#20252c"], ["#48515a", "#22282f"], ["#695846", "#302a26"],
    ][this.chapterIndex];
    const gradient = ctx.createLinearGradient(0, VIEW.height - 250, 0, VIEW.height);
    gradient.addColorStop(0, chapterColors[0]);
    gradient.addColorStop(1, chapterColors[1]);

    for (const segment of segments) {
      ctx.beginPath();
      ctx.moveTo(segment[0].x, VIEW.height + 35);
      ctx.lineTo(segment[0].x, segment[0].y);
      for (const point of segment.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.lineTo(segment.at(-1).x, VIEW.height + 35);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(segment[0].x, segment[0].y);
      for (const point of segment.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = this.chapterIndex >= 2 ? "rgba(239,247,250,0.74)" : "rgba(218,207,183,0.68)";
      ctx.lineWidth = this.chapterIndex >= 2 ? 7 : 4;
      ctx.stroke();
      ctx.strokeStyle = "rgba(39,35,32,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const pit of this.pits) {
      const left = pit.start - this.cameraX;
      const right = pit.end - this.cameraX;
      if (right < -80 || left > VIEW.width + 80) continue;
      const lipY = Math.min(this.groundAt(pit.start - 2) || VIEW.height - 120, this.groundAt(pit.end + 2) || VIEW.height - 120);
      const chasm = ctx.createLinearGradient(0, lipY, 0, VIEW.height);
      chasm.addColorStop(0, "rgba(8,16,23,0.84)");
      chasm.addColorStop(.42, "rgba(4,9,14,0.94)");
      chasm.addColorStop(1, "rgba(1,4,7,0.99)");
      ctx.fillStyle = chasm;
      ctx.beginPath();
      ctx.moveTo(left - 5, lipY - 2);
      ctx.bezierCurveTo(left + 30, lipY + 38, right - 34, lipY + 42, right + 5, lipY - 2);
      ctx.lineTo(right + 52, VIEW.height + 20);
      ctx.lineTo(left - 52, VIEW.height + 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(183,211,223,0.08)";
      ctx.beginPath();
      ctx.ellipse((left + right) / 2, lipY + 82, Math.max(60, (right - left) * .62), 55, 0, 0, Math.PI * 2);
      ctx.fill();

      for (const [edge, direction] of [[left, -1], [right, 1]]) {
        ctx.strokeStyle = "rgba(220,235,240,0.38)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(edge, lipY - 8);
        ctx.lineTo(edge + direction * 17, lipY + 33);
        ctx.lineTo(edge + direction * 8, lipY + 84);
        ctx.stroke();
        ctx.strokeStyle = "rgba(121,151,166,0.22)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(edge + direction * 6, lipY + 4);
        ctx.lineTo(edge + direction * 31, lipY + 56);
        ctx.stroke();
      }

      const markerWorldX = pit.start - 66;
      const markerGround = this.groundAt(markerWorldX);
      if (markerGround !== null) {
        const markerX = markerWorldX - this.cameraX;
        ctx.strokeStyle = "rgba(74,52,35,0.9)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(markerX, markerGround);
        ctx.lineTo(markerX, markerGround - 49);
        ctx.stroke();
        ctx.fillStyle = "rgba(180,71,54,0.9)";
        ctx.beginPath();
        ctx.moveTo(markerX + 2, markerGround - 47);
        ctx.lineTo(markerX + 27, markerGround - 38);
        ctx.lineTo(markerX + 2, markerGround - 29);
        ctx.closePath();
        ctx.fill();
      }

      for (let index = 0; index < 7; index += 1) {
        const fall = (this.elapsed * (.22 + index * .012) + index * .137) % 1;
        ctx.globalAlpha = .34 * (1 - fall);
        ctx.fillStyle = "#dceaf0";
        ctx.beginPath();
        ctx.arc(lerp(left + 18, right - 18, (index * .37) % 1), lipY + 12 + fall * 150, 1.2 + index % 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    for (let x = start; x < end; x += 74) {
      const ground = this.groundAt(x);
      if (ground === null) continue;
      const seed = Math.abs(Math.sin(x * 12.9898));
      ctx.fillStyle = seed > 0.55 ? "rgba(230,237,238,0.22)" : "rgba(25,24,23,0.28)";
      ctx.beginPath();
      ctx.ellipse(x - this.cameraX, ground + 13 + seed * 14, 8 + seed * 15, 3 + seed * 4, seed - 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawWorldObjects(ctx) {
    for (const hazard of [...this.rocks, ...this.branches, ...this.iceRidges]) {
      const frame = hazard.type === "rock" ? 0 : hazard.type === "branch" ? 4 : 7;
      const dimensions = hazard.type === "branch" ? [150, 200] : hazard.type === "ice" ? [118, 157] : [112 + hazard.size, 149 + hazard.size];
      this.drawProp(ctx, frame, hazard.x, dimensions[0], dimensions[1], 0, hazard.hit ? 0.46 : 1);
    }
    for (const cache of this.suppliesWorld) if (!cache.taken) this.drawSupply(ctx, cache.x);
    for (let index = 0; index < this.rescuePoints.length; index += 1) {
      const rescue = this.rescuePoints[index];
      if (!rescue.rescued) this.drawRescue(ctx, rescue.x, index);
    }
    for (const camp of this.camps) this.drawCamp(ctx, camp);
    for (const checkpoint of this.checkpoints) this.drawCheckpoint(ctx, checkpoint);
    this.drawGoal(ctx);
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
    ctx.translate(x, ground);
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
      ctx.arc(x, y - 47, 31 + Math.sin(this.elapsed * 2) * 4, 0, Math.PI * 2);
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
    for (let index = this.followers.length - 1; index >= 0; index -= 1) {
      const follower = this.followers[index];
      if (!follower.active) continue;
      const x = this.player.x - follower.offset;
      const pose = this.followerPoseAt(x, index);
      if (!pose) continue;
      const screenX = x - this.cameraX;
      const resting = this.command === "rest" && this.commandTimer > 0;
      const fatigued = this.cohesion < 38;
      let frame;
      if (pose.airborne) frame = follower.type === "arriero" ? 5 : 2;
      else if (follower.type === "arriero") frame = resting || fatigued ? 7 : 4 + (Math.floor(follower.phase) % 2);
      else frame = resting || fatigued ? 3 : Math.floor(follower.phase) % 3;

      ctx.save();
      ctx.translate(screenX, pose.y);
      ctx.globalAlpha = 0.82 + index * 0.018;
      if (!pose.airborne) {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 23, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.rotate((.5 - pose.progress) * .1);
      }
      this.drawAtlasCell(ctx, atlas, frame, 4, 2, -49, -131 * EXPEDITION_FEET[frame], 98, 131);
      ctx.restore();
    }
  }

  drawParticles(ctx) {
    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(particle.life / particle.max,0,1); ctx.fillStyle=particle.color; ctx.beginPath(); ctx.arc(particle.x-this.cameraX,particle.y,particle.size,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
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
    this.player.render(ctx,this.cameraX);
    this.drawParticles(ctx);
    if (this.commandPulse > 0) {
      const pulseX = this.player.x - this.cameraX;
      const pulseY = this.player.y + 8;
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

(() => {
  "use strict";

  const W = 960;
  const H = 540;
  const TAU = Math.PI * 2;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
  const rectsHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0 || 1;
  }

  class RNG {
    constructor(seed) {
      this.state = hashSeed(String(seed));
    }

    next() {
      this.state = (this.state + 0x6d2b79f5) | 0;
      let t = this.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    }

    float(min, max) {
      return this.next() * (max - min) + min;
    }

    chance(p) {
      return this.next() < p;
    }

    pick(list) {
      return list[this.int(0, list.length - 1)];
    }

    shuffle(list) {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = this.int(0, i);
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    }
  }

  function colorWithAlpha(hex, alpha) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function drawText(ctx, text, x, y, size = 18, color = "#f3f6f8", align = "left", weight = 700) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px Inter, Segoe UI, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function drawBar(ctx, x, y, w, h, pct, fill, back = "rgba(255,255,255,0.14)") {
    ctx.fillStyle = back;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w * clamp(pct, 0, 1), h);
  }

  function drawDiamond(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawStarfield(ctx, rng, accent, density = 70) {
    const savedState = typeof rng?.state === "number" ? rng.state : null;
    ctx.fillStyle = "#07090f";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < density; i += 1) {
      const x = (rng.int(0, W * 10) % W);
      const y = (rng.int(0, H * 10) % H);
      const r = rng.float(0.5, 1.8);
      ctx.globalAlpha = rng.float(0.35, 0.9);
      ctx.fillStyle = i % 9 === 0 ? accent : "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (savedState !== null) rng.state = savedState;
  }

  class Input {
    constructor() {
      this.down = Object.create(null);
      this.pressed = Object.create(null);
      this.released = Object.create(null);
      this.keyMap = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        " ": "action",
        Enter: "action",
        Shift: "alt",
        Control: "alt",
        r: "restart",
        p: "start",
        Escape: "start"
      };
      window.addEventListener("keydown", (event) => this.onKey(event, true));
      window.addEventListener("keyup", (event) => this.onKey(event, false));
      window.addEventListener("blur", () => this.reset());
    }

    onKey(event, isDown) {
      const id = this.keyMap[event.key] || this.keyMap[event.key.toLowerCase()];
      if (!id) return;
      event.preventDefault();
      this.set(id, isDown);
    }

    set(id, isDown) {
      if (isDown && !this.down[id]) this.pressed[id] = true;
      if (!isDown && this.down[id]) this.released[id] = true;
      this.down[id] = isDown;
    }

    consume(id) {
      if (!this.pressed[id]) return false;
      delete this.pressed[id];
      return true;
    }

    axis() {
      return {
        x: (this.down.right ? 1 : 0) - (this.down.left ? 1 : 0),
        y: (this.down.down ? 1 : 0) - (this.down.up ? 1 : 0)
      };
    }

    dirPressed() {
      const dirs = [
        ["up", 0, -1],
        ["down", 0, 1],
        ["left", -1, 0],
        ["right", 1, 0]
      ];
      for (const [id, x, y] of dirs) {
        if (this.consume(id)) return { x, y, id };
      }
      return null;
    }

    clearFrame() {
      this.pressed = Object.create(null);
      this.released = Object.create(null);
    }

    reset() {
      this.down = Object.create(null);
      this.clearFrame();
    }
  }

  class AudioEngine {
    constructor() {
      this.settings = readJson(localStorage.getItem("playworks.audio.v1"), { muted: false, volume: 0.65 });
      this.ctx = null;
      this.master = null;
      this.unlocked = false;
      this.musicTimer = 0;
      this.musicStep = 0;
      this.category = "Arcade";
    }

    save() {
      localStorage.setItem("playworks.audio.v1", JSON.stringify(this.settings));
    }

    ensureContext() {
      if (this.ctx) return true;
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return false;
      this.ctx = new AudioCtor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.settings.muted ? 0 : this.settings.volume;
      this.master.connect(this.ctx.destination);
      return true;
    }

    unlock() {
      if (!this.ensureContext()) return;
      if (this.ctx.state === "suspended") this.ctx.resume();
      if (!this.unlocked) {
        this.unlocked = true;
        this.play("start");
        this.startMusic(this.category);
      }
    }

    setMuted(muted) {
      this.settings.muted = muted;
      if (this.master) this.master.gain.value = muted ? 0 : this.settings.volume;
      if (muted) this.stopMusic();
      else if (this.unlocked) this.startMusic(this.category);
      this.save();
    }

    setVolume(value) {
      this.settings.volume = clamp(Number(value), 0, 1);
      if (this.master && !this.settings.muted) this.master.gain.value = this.settings.volume;
      this.save();
    }

    tone(freq, duration = 0.12, type = "sine", gain = 0.12, delay = 0) {
      if (!this.unlocked || this.settings.muted || !this.ensureContext()) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(gain, t + 0.015);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(amp);
      amp.connect(this.master);
      osc.start(t);
      osc.stop(t + duration + 0.03);
    }

    play(name) {
      const patterns = {
        select: [[520, 0.06, "triangle", 0.08, 0]],
        start: [[330, 0.08, "sine", 0.08, 0], [495, 0.09, "sine", 0.07, 0.06]],
        collect: [[660, 0.07, "triangle", 0.08, 0], [880, 0.09, "triangle", 0.07, 0.055]],
        damage: [[150, 0.13, "sawtooth", 0.11, 0], [95, 0.18, "square", 0.06, 0.03]],
        win: [[392, 0.12, "sine", 0.08, 0], [523, 0.12, "sine", 0.08, 0.09], [784, 0.2, "triangle", 0.09, 0.18]],
        loss: [[330, 0.13, "sawtooth", 0.08, 0], [220, 0.16, "sawtooth", 0.08, 0.12], [146, 0.22, "sine", 0.08, 0.24]],
        unlock: [[587, 0.1, "triangle", 0.08, 0], [740, 0.12, "triangle", 0.08, 0.08], [988, 0.18, "sine", 0.08, 0.16]],
        achievement: [[523, 0.09, "triangle", 0.08, 0], [659, 0.09, "triangle", 0.08, 0.07], [1046, 0.18, "sine", 0.08, 0.14]]
      };
      for (const note of patterns[name] || patterns.select) this.tone(...note);
    }

    startMusic(category) {
      this.category = category || this.category;
      this.stopMusic();
      if (!this.unlocked || this.settings.muted || !this.ensureContext()) return;
      const scales = {
        Accion: [196, 247, 294, 330],
        Arcade: [220, 330, 440, 660],
        Estrategia: [165, 220, 247, 330],
        Exploracion: [174, 220, 261, 349],
        Puzzle: [196, 261, 329, 392]
      };
      const scale = scales[this.category] || scales.Arcade;
      this.musicStep = 0;
      this.musicTimer = window.setInterval(() => {
        if (!this.unlocked || this.settings.muted) return;
        const note = scale[this.musicStep % scale.length] * (this.musicStep % 8 === 7 ? 1.5 : 1);
        this.tone(note, 0.08, "sine", 0.025, 0);
        if (this.musicStep % 4 === 0) this.tone(note / 2, 0.16, "triangle", 0.018, 0);
        this.musicStep += 1;
      }, 420);
    }

    stopMusic() {
      if (this.musicTimer) window.clearInterval(this.musicTimer);
      this.musicTimer = 0;
    }
  }

  class FeedbackSystem {
    constructor() {
      this.particles = [];
      this.texts = [];
      this.flash = null;
      this.shakeTime = 0;
      this.shakePower = 0;
      this.rng = new RNG("feedback");
    }

    burst(x, y, color, count = 18, speed = 150) {
      for (let i = 0; i < count; i += 1) {
        const a = this.rng.float(0, TAU);
        const s = this.rng.float(speed * 0.25, speed);
        this.particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          r: this.rng.float(2, 5),
          life: this.rng.float(0.35, 0.8),
          max: 0.8,
          color
        });
      }
    }

    floatText(text, x, y, color = "#f3f6f8") {
      this.texts.push({ text, x, y, vy: -38, life: 1.1, max: 1.1, color });
    }

    addFlash(color, alpha = 0.24, time = 0.22) {
      this.flash = { color, alpha, time, max: time };
    }

    shake(power = 5, time = 0.18) {
      this.shakePower = Math.max(this.shakePower, power);
      this.shakeTime = Math.max(this.shakeTime, time);
    }

    event(name, data = {}) {
      const x = data.x ?? W / 2 + this.rng.float(-90, 90);
      const y = data.y ?? H / 2 + this.rng.float(-70, 70);
      if (name === "collect") {
        this.burst(x, y, data.color || "#f4b860", 12, 120);
        if (data.text) this.floatText(data.text, x, y, data.color || "#f4b860");
      } else if (name === "damage") {
        this.burst(x, y, "#ff5d73", 20, 190);
        this.addFlash("rgba(255,93,115,1)", 0.24, 0.18);
        this.shake(7, 0.2);
      } else if (name === "win") {
        this.burst(W / 2, H / 2, "#55d6be", 56, 240);
        this.addFlash("rgba(85,214,190,1)", 0.22, 0.35);
        this.shake(4, 0.24);
      } else if (name === "loss") {
        this.burst(W / 2, H / 2, "#ff5d73", 36, 180);
        this.addFlash("rgba(255,93,115,1)", 0.28, 0.32);
        this.shake(9, 0.3);
      } else if (name === "unlock") {
        this.burst(W * 0.74, H * 0.22, "#f4b860", 30, 180);
        this.floatText(data.text || "Desbloqueado", W * 0.74, H * 0.22, "#f4b860");
      } else if (name === "select") {
        this.burst(W * 0.5, H * 0.5, data.color || "#55d6be", 8, 70);
      }
    }

    update(dt) {
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
      for (const text of this.texts) {
        text.y += text.vy * dt;
        text.life -= dt;
      }
      this.texts = this.texts.filter((text) => text.life > 0);
      if (this.flash) {
        this.flash.time -= dt;
        if (this.flash.time <= 0) this.flash = null;
      }
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }

    offset() {
      if (this.shakeTime <= 0) return { x: 0, y: 0 };
      const p = this.shakePower * (this.shakeTime / 0.3);
      return { x: this.rng.float(-p, p), y: this.rng.float(-p, p) };
    }

    render(ctx) {
      for (const p of this.particles) {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const text of this.texts) {
        ctx.globalAlpha = clamp(text.life / text.max, 0, 1);
        drawText(ctx, text.text, text.x, text.y, 18, text.color, "center", 900);
      }
      ctx.globalAlpha = 1;
      if (this.flash) {
        ctx.globalAlpha = this.flash.alpha * clamp(this.flash.time / this.flash.max, 0, 1);
        ctx.fillStyle = this.flash.color;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }
  }

  class BaseGame {
    constructor(app, def, seed) {
      this.app = app;
      this.def = def;
      this.seed = seed;
      this.rng = new RNG(`${seed}:${def.id}`);
      this.visualRng = new RNG(`${seed}:${def.id}:visual`);
      this.run = app.currentRun || { campaign: false, level: 0, seed };
      this.campaignLevel = this.run.level || 0;
      this.difficultyScale = this.run.difficultyScale || 1;
      this.score = 0;
      this.time = 0;
      this.health = 3;
      this.goal = def.objective;
      this.done = false;
      this.message = "";
    }

    tick(dt) {
      this.time += dt;
    }

    finish(won, message) {
      if (this.done) return;
      this.done = true;
      this.message = message;
      this.app.completeGame(this, won, message);
    }

    drawBackdrop(ctx, a = "#10131a", b = "#1f232d") {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, a);
      g.addColorStop(1, b);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    drawVignette(ctx) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 150, W / 2, H / 2, 640);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(0,0,0,0.36)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  class DungeonRelicGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.cols = 24;
      this.rows = 15;
      this.size = 32;
      this.ox = 96;
      this.oy = 38;
      this.map = Array.from({ length: this.rows }, () => Array(this.cols).fill(1));
      this.rooms = [];
      this.relics = [];
      this.enemies = [];
      this.health = 5;
      this.makeMap();
    }

    carveRoom(room) {
      for (let y = room.y; y < room.y + room.h; y += 1) {
        for (let x = room.x; x < room.x + room.w; x += 1) this.map[y][x] = 0;
      }
    }

    carveLine(x1, y1, x2, y2) {
      let x = x1;
      let y = y1;
      while (x !== x2) {
        this.map[y][x] = 0;
        x += Math.sign(x2 - x);
      }
      while (y !== y2) {
        this.map[y][x] = 0;
        y += Math.sign(y2 - y);
      }
      this.map[y][x] = 0;
    }

    makeMap() {
      for (let i = 0; i < 9; i += 1) {
        const room = {
          x: this.rng.int(1, this.cols - 7),
          y: this.rng.int(1, this.rows - 5),
          w: this.rng.int(4, 7),
          h: this.rng.int(3, 5)
        };
        this.rooms.push(room);
        this.carveRoom(room);
        if (i > 0) {
          const a = this.rooms[i - 1];
          const b = room;
          this.carveLine(a.x + Math.floor(a.w / 2), a.y + Math.floor(a.h / 2), b.x + Math.floor(b.w / 2), b.y + Math.floor(b.h / 2));
        }
      }
      const start = this.rooms[0];
      this.player = { x: start.x + 1, y: start.y + 1 };
      const last = this.rooms[this.rooms.length - 1];
      this.exit = { x: last.x + last.w - 2, y: last.y + last.h - 2 };
      for (let i = 1; i < this.rooms.length - 1; i += 2) {
        const room = this.rooms[i];
        this.relics.push({ x: room.x + this.rng.int(1, room.w - 2), y: room.y + this.rng.int(1, room.h - 2), taken: false });
      }
      for (let i = 2; i < this.rooms.length; i += 2) {
        const room = this.rooms[i];
        this.enemies.push({ x: room.x + this.rng.int(1, room.w - 2), y: room.y + this.rng.int(1, room.h - 2), wait: 0 });
      }
    }

    isOpen(x, y) {
      return x >= 0 && y >= 0 && x < this.cols && y < this.rows && this.map[y][x] === 0;
    }

    update(dt, input) {
      this.tick(dt);
      const dir = input.dirPressed();
      if (!dir) return;
      const nx = this.player.x + dir.x;
      const ny = this.player.y + dir.y;
      if (this.isOpen(nx, ny)) {
        this.player.x = nx;
        this.player.y = ny;
        this.score += 2;
        for (const relic of this.relics) {
          if (!relic.taken && relic.x === nx && relic.y === ny) {
            relic.taken = true;
            this.score += 180;
          }
        }
        this.moveEnemies();
      }
      for (const enemy of this.enemies) {
        if (enemy.x === this.player.x && enemy.y === this.player.y) {
          this.health -= 1;
          enemy.x = this.exit.x;
          enemy.y = this.exit.y;
          if (this.health <= 0) this.finish(false, "La cripta reclamo la expedicion.");
        }
      }
      if (this.player.x === this.exit.x && this.player.y === this.exit.y && this.relics.every((r) => r.taken)) {
        this.finish(true, "Camara sellada con todos los relicarios.");
      }
    }

    moveEnemies() {
      for (const enemy of this.enemies) {
        const options = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 }
        ].filter((d) => this.isOpen(enemy.x + d.x, enemy.y + d.y));
        options.sort((a, b) => {
          const da = Math.abs(enemy.x + a.x - this.player.x) + Math.abs(enemy.y + a.y - this.player.y);
          const db = Math.abs(enemy.x + b.x - this.player.x) + Math.abs(enemy.y + b.y - this.player.y);
          return da - db;
        });
        const chosen = this.rng.chance(0.72) ? options[0] : this.rng.pick(options);
        enemy.x += chosen.x;
        enemy.y += chosen.y;
      }
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#151017", "#272231");
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const px = this.ox + x * this.size;
          const py = this.oy + y * this.size;
          ctx.fillStyle = this.map[y][x] ? "#272036" : "#121621";
          ctx.fillRect(px, py, this.size - 1, this.size - 1);
          if (!this.map[y][x]) {
            ctx.fillStyle = "rgba(255,255,255,0.04)";
            ctx.fillRect(px + 4, py + 4, this.size - 8, 2);
          }
        }
      }
      ctx.fillStyle = "#55d6be";
      ctx.fillRect(this.ox + this.exit.x * this.size + 7, this.oy + this.exit.y * this.size + 7, 18, 18);
      for (const relic of this.relics) {
        if (!relic.taken) drawDiamond(ctx, this.ox + relic.x * this.size + 16, this.oy + relic.y * this.size + 16, 9, "#f4b860");
      }
      for (const enemy of this.enemies) {
        ctx.fillStyle = "#ff5d73";
        ctx.beginPath();
        ctx.arc(this.ox + enemy.x * this.size + 16, this.oy + enemy.y * this.size + 16, 11, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = "#e9edf4";
      ctx.fillRect(this.ox + this.player.x * this.size + 8, this.oy + this.player.y * this.size + 8, 16, 16);
      drawBar(ctx, 96, 512, 180, 10, this.health / 5, "#89e07f");
      drawText(ctx, `Relicarios ${this.relics.filter((r) => r.taken).length}/${this.relics.length}`, 306, 518, 16, "#cbd3df");
      this.drawVignette(ctx);
    }
  }

  class SpaceMinerGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.player = { x: W / 2, y: H / 2, r: 14, vx: 0, vy: 0 };
      this.bullets = [];
      this.asteroids = [];
      this.drones = [];
      this.ore = 0;
      this.target = 26;
      this.cool = 0;
      this.health = 4;
      for (let i = 0; i < 18; i += 1) this.spawnAsteroid();
      for (let i = 0; i < 4; i += 1) this.drones.push({ x: this.rng.int(60, W - 60), y: this.rng.int(60, H - 60), vx: this.rng.float(-28, 28), vy: this.rng.float(-28, 28) });
    }

    spawnAsteroid() {
      const r = this.rng.int(16, 36);
      this.asteroids.push({
        x: this.rng.int(20, W - 20),
        y: this.rng.int(20, H - 20),
        r,
        hp: Math.ceil(r / 13),
        vx: this.rng.float(-42, 42),
        vy: this.rng.float(-42, 42)
      });
    }

    wrap(obj) {
      if (obj.x < -40) obj.x = W + 40;
      if (obj.x > W + 40) obj.x = -40;
      if (obj.y < -40) obj.y = H + 40;
      if (obj.y > H + 40) obj.y = -40;
    }

    update(dt, input) {
      this.tick(dt);
      const axis = input.axis();
      this.player.vx += axis.x * 320 * dt;
      this.player.vy += axis.y * 320 * dt;
      this.player.vx *= 0.985;
      this.player.vy *= 0.985;
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;
      this.wrap(this.player);
      this.cool -= dt;
      if ((input.down.action || input.consume("action")) && this.cool <= 0) {
        const ang = Math.atan2(axis.y || -1, axis.x || 0);
        this.bullets.push({ x: this.player.x, y: this.player.y, vx: Math.cos(ang) * 430, vy: Math.sin(ang) * 430, life: 1.1 });
        this.cool = 0.14;
      }
      for (const bullet of this.bullets) {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;
      }
      this.bullets = this.bullets.filter((b) => b.life > 0 && b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30);
      for (const asteroid of this.asteroids) {
        asteroid.x += asteroid.vx * dt;
        asteroid.y += asteroid.vy * dt;
        this.wrap(asteroid);
        if (dist(asteroid.x, asteroid.y, this.player.x, this.player.y) < asteroid.r + this.player.r) {
          this.health -= 1;
          asteroid.x = -100;
          this.player.vx *= -0.55;
          this.player.vy *= -0.55;
          if (this.health <= 0) this.finish(false, "El campo de asteroides rompio el casco.");
        }
      }
      for (const drone of this.drones) {
        const a = Math.atan2(this.player.y - drone.y, this.player.x - drone.x);
        drone.vx += Math.cos(a) * 18 * dt;
        drone.vy += Math.sin(a) * 18 * dt;
        drone.x += drone.vx * dt;
        drone.y += drone.vy * dt;
        this.wrap(drone);
        if (dist(drone.x, drone.y, this.player.x, this.player.y) < 24) {
          this.health -= 1;
          drone.x = this.rng.int(40, W - 40);
          drone.y = this.rng.int(40, H - 40);
          if (this.health <= 0) this.finish(false, "Los drones tomaron la fragua orbital.");
        }
      }
      for (const bullet of this.bullets) {
        for (const asteroid of this.asteroids) {
          if (dist(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.r) {
            bullet.life = 0;
            asteroid.hp -= 1;
            if (asteroid.hp <= 0) {
              this.ore += Math.ceil(asteroid.r / 12);
              this.score += Math.ceil(asteroid.r) * 8;
              asteroid.x = -999;
            }
          }
        }
      }
      this.asteroids = this.asteroids.filter((a) => a.x > -500);
      while (this.asteroids.length < 18) this.spawnAsteroid();
      if (this.ore >= this.target) this.finish(true, "Nucleo forjado con mineral limpio.");
    }

    render(ctx) {
      drawStarfield(ctx, this.visualRng, "#7aa7ff", 92);
      for (const asteroid of this.asteroids) {
        ctx.fillStyle = "#766c7a";
        ctx.beginPath();
        ctx.arc(asteroid.x, asteroid.y, asteroid.r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#b7a58c";
        ctx.stroke();
      }
      ctx.fillStyle = "#ff5d73";
      for (const drone of this.drones) drawDiamond(ctx, drone.x, drone.y, 13, "#ff5d73");
      ctx.fillStyle = "#f4b860";
      for (const bullet of this.bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, TAU);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(Math.atan2(this.player.vy, this.player.vx || -1));
      ctx.fillStyle = "#e9edf4";
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      drawBar(ctx, 42, 500, 170, 10, this.ore / this.target, "#f4b860");
      drawText(ctx, `Mineral ${this.ore}/${this.target}`, 226, 506, 16, "#cbd3df");
      drawBar(ctx, 42, 518, 120, 8, this.health / 4, "#89e07f");
    }
  }

  class CoralRescueGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.sub = { x: 90, y: 270, r: 13 };
      this.fish = [];
      this.mines = [];
      this.rocks = [];
      this.ping = 0;
      this.saved = 0;
      this.health = 4;
      for (let i = 0; i < 22; i += 1) this.rocks.push({ x: this.rng.int(120, 900), y: this.rng.int(55, 485), r: this.rng.int(18, 42) });
      for (let i = 0; i < 10; i += 1) this.fish.push({ x: this.rng.int(160, 900), y: this.rng.int(70, 470), saved: false, wiggle: this.rng.float(0, TAU) });
      for (let i = 0; i < 9; i += 1) this.mines.push({ x: this.rng.int(160, 900), y: this.rng.int(70, 470), r: 13, pulse: this.rng.float(0, TAU) });
    }

    update(dt, input) {
      this.tick(dt);
      const axis = input.axis();
      this.sub.x = clamp(this.sub.x + axis.x * 170 * dt, 25, W - 25);
      this.sub.y = clamp(this.sub.y + axis.y * 170 * dt, 35, H - 35);
      if (input.consume("action")) this.ping = 1;
      this.ping = Math.max(0, this.ping - dt * 0.55);
      for (const rock of this.rocks) {
        const d = dist(this.sub.x, this.sub.y, rock.x, rock.y);
        if (d < this.sub.r + rock.r) {
          const a = Math.atan2(this.sub.y - rock.y, this.sub.x - rock.x);
          this.sub.x = rock.x + Math.cos(a) * (this.sub.r + rock.r);
          this.sub.y = rock.y + Math.sin(a) * (this.sub.r + rock.r);
        }
      }
      for (const mine of this.mines) {
        mine.pulse += dt * 4;
        if (dist(this.sub.x, this.sub.y, mine.x, mine.y) < this.sub.r + mine.r) {
          this.health -= 1;
          mine.x = this.rng.int(160, 900);
          mine.y = this.rng.int(70, 470);
          if (this.health <= 0) this.finish(false, "La mision quedo bajo la corriente.");
        }
      }
      for (const fish of this.fish) {
        fish.wiggle += dt * 2.8;
        if (!fish.saved && dist(this.sub.x, this.sub.y, fish.x, fish.y) < 30) {
          fish.saved = true;
          this.saved += 1;
          this.score += 120;
        }
      }
      this.score += dt * 2;
      if (this.saved >= this.fish.length) this.finish(true, "Arrecife evacuado con el sonar activo.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#05202a", "#0d4451");
      ctx.fillStyle = "rgba(85,214,190,0.08)";
      for (let i = 0; i < 9; i += 1) ctx.fillRect(0, i * 64 + Math.sin(this.time + i) * 6, W, 2);
      for (const rock of this.rocks) {
        ctx.fillStyle = "#2d5260";
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.r, 0, TAU);
        ctx.fill();
      }
      for (const fish of this.fish) {
        if (fish.saved) continue;
        ctx.fillStyle = "#f4b860";
        ctx.beginPath();
        ctx.ellipse(fish.x, fish.y + Math.sin(fish.wiggle) * 4, 10, 6, 0, 0, TAU);
        ctx.fill();
      }
      for (const mine of this.mines) {
        const visible = this.ping > 0 || Math.sin(mine.pulse) > 0.8;
        ctx.fillStyle = visible ? "#ff5d73" : "rgba(255,93,115,0.16)";
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, mine.r, 0, TAU);
        ctx.fill();
      }
      if (this.ping > 0) {
        ctx.strokeStyle = colorWithAlpha("#55d6be", this.ping);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.sub.x, this.sub.y, (1 - this.ping) * 360 + 30, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = "#e9edf4";
      ctx.beginPath();
      ctx.ellipse(this.sub.x, this.sub.y, 22, 12, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#55d6be";
      ctx.fillRect(this.sub.x + 12, this.sub.y - 4, 12, 8);
      drawBar(ctx, 44, 508, 160, 10, this.saved / this.fish.length, "#f4b860");
      drawText(ctx, `Rescate ${this.saved}/${this.fish.length}`, 224, 514, 16, "#cbd3df");
      drawBar(ctx, 44, 526, 110, 8, this.health / 4, "#89e07f");
    }
  }

  class RailWeaverGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.cols = 12;
      this.rows = 8;
      this.size = 52;
      this.ox = 168;
      this.oy = 62;
      this.cursor = { x: 0, y: 0 };
      this.grid = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => ({ type: "empty", rot: 0, path: false })));
      this.train = { index: 0, timer: 0.8, x: 0, y: 0 };
      this.path = [];
      this.makePath();
    }

    makePath() {
      let y = this.rng.int(1, this.rows - 2);
      this.path.push({ x: 0, y });
      for (let x = 1; x < this.cols; x += 1) {
        if (this.rng.chance(0.48)) y = clamp(y + this.rng.pick([-1, 1]), 0, this.rows - 1);
        this.path.push({ x, y });
      }
      for (let i = 0; i < this.path.length; i += 1) {
        const p = this.path[i];
        const prev = this.path[i - 1] || { x: p.x - 1, y: p.y };
        const next = this.path[i + 1] || { x: p.x + 1, y: p.y };
        const dirs = [
          { x: prev.x - p.x, y: prev.y - p.y },
          { x: next.x - p.x, y: next.y - p.y }
        ];
        const horizontal = dirs.every((d) => d.y === 0);
        const vertical = dirs.every((d) => d.x === 0);
        const type = horizontal ? "straightH" : vertical ? "straightV" : "corner";
        const correct = this.rotationFor(type, dirs);
        this.grid[p.y][p.x] = { type, rot: (correct + this.rng.int(0, 3)) % 4, correct, path: true };
      }
      for (let y2 = 0; y2 < this.rows; y2 += 1) {
        for (let x2 = 0; x2 < this.cols; x2 += 1) {
          if (!this.grid[y2][x2].path && this.rng.chance(0.28)) this.grid[y2][x2] = { type: this.rng.pick(["straightH", "straightV", "corner"]), rot: this.rng.int(0, 3), path: false };
        }
      }
    }

    rotationFor(type, dirs) {
      if (type === "straightH") return 0;
      if (type === "straightV") return 1;
      const key = dirs.map((d) => `${d.x},${d.y}`).sort().join("|");
      const map = {
        "-1,0|0,-1": 0,
        "0,-1|1,0": 1,
        "0,1|1,0": 2,
        "-1,0|0,1": 3
      };
      return map[key] || 0;
    }

    update(dt, input) {
      this.tick(dt);
      const dir = input.dirPressed();
      if (dir) {
        this.cursor.x = clamp(this.cursor.x + dir.x, 0, this.cols - 1);
        this.cursor.y = clamp(this.cursor.y + dir.y, 0, this.rows - 1);
      }
      if (input.consume("action")) {
        const tile = this.grid[this.cursor.y][this.cursor.x];
        if (tile.type !== "empty") tile.rot = (tile.rot + 1) % 4;
      }
      this.train.timer -= dt;
      if (this.train.timer <= 0) {
        this.train.timer = 0.64;
        const p = this.path[this.train.index];
        const tile = this.grid[p.y][p.x];
        if (tile.rot !== tile.correct) {
          this.finish(false, "El convoy salto de una via torcida.");
          return;
        }
        this.train.index += 1;
        this.score += 25;
        if (this.train.index >= this.path.length) this.finish(true, "El tren llego al puerto celeste.");
      }
    }

    drawTrack(ctx, x, y, tile) {
      const cx = x + this.size / 2;
      const cy = y + this.size / 2;
      ctx.strokeStyle = tile.path ? "#f4b860" : "rgba(255,255,255,0.18)";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tile.rot * Math.PI / 2);
      ctx.beginPath();
      if (tile.type === "straightH") {
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
      } else if (tile.type === "straightV") {
        ctx.moveTo(0, -20);
        ctx.lineTo(0, 20);
      } else if (tile.type === "corner") {
        ctx.moveTo(-20, 0);
        ctx.quadraticCurveTo(0, 0, 0, -20);
      }
      ctx.stroke();
      ctx.restore();
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#111823", "#273849");
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const px = this.ox + x * this.size;
          const py = this.oy + y * this.size;
          ctx.fillStyle = (x + y) % 2 ? "#1a2733" : "#15212c";
          ctx.fillRect(px, py, this.size - 2, this.size - 2);
          const tile = this.grid[y][x];
          if (tile.type !== "empty") this.drawTrack(ctx, px, py, tile);
        }
      }
      const cp = this.path[Math.min(this.train.index, this.path.length - 1)];
      ctx.fillStyle = "#55d6be";
      ctx.fillRect(this.ox + cp.x * this.size + 15, this.oy + cp.y * this.size + 17, 22, 18);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.ox + this.cursor.x * this.size + 3, this.oy + this.cursor.y * this.size + 3, this.size - 8, this.size - 8);
      drawBar(ctx, 206, 504, 548, 12, this.train.index / this.path.length, "#55d6be");
    }
  }

  class NeonSnakeGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.cols = 30;
      this.rows = 16;
      this.size = 28;
      this.ox = 60;
      this.oy = 52;
      this.snake = [{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }];
      this.dir = { x: 1, y: 0 };
      this.nextDir = { x: 1, y: 0 };
      this.timer = 0;
      this.speed = 0.13;
      this.target = 21;
      this.portals = [];
      this.blocks = [];
      this.food = this.freeCell();
      this.portals.push(this.freeCell(), this.freeCell());
      for (let i = 0; i < 24; i += 1) this.blocks.push(this.freeCell());
    }

    occupied(x, y) {
      return this.snake.some((p) => p.x === x && p.y === y)
        || (this.blocks || []).some((p) => p.x === x && p.y === y)
        || (this.portals || []).some((p) => p.x === x && p.y === y)
        || (this.food && this.food.x === x && this.food.y === y);
    }

    freeCell() {
      let p;
      let guard = 0;
      do {
        p = { x: this.rng.int(1, this.cols - 2), y: this.rng.int(1, this.rows - 2) };
        guard += 1;
      } while (this.snake && this.occupied(p.x, p.y) && guard < 400);
      if (this.occupied(p.x, p.y)) {
        for (let y = 1; y < this.rows - 1; y += 1) {
          for (let x = 1; x < this.cols - 1; x += 1) {
            if (!this.occupied(x, y)) return { x, y };
          }
        }
      }
      return p;
    }

    update(dt, input) {
      this.tick(dt);
      const dir = input.dirPressed();
      if (dir && (dir.x !== -this.dir.x || dir.y !== -this.dir.y)) this.nextDir = { x: dir.x, y: dir.y };
      this.timer += dt;
      if (this.timer < this.speed) return;
      this.timer = 0;
      this.dir = this.nextDir;
      let head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
      head.x = (head.x + this.cols) % this.cols;
      head.y = (head.y + this.rows) % this.rows;
      if (head.x === this.portals[0].x && head.y === this.portals[0].y) head = { ...this.portals[1] };
      else if (head.x === this.portals[1].x && head.y === this.portals[1].y) head = { ...this.portals[0] };
      if (this.snake.some((p) => p.x === head.x && p.y === head.y) || this.blocks.some((p) => p.x === head.x && p.y === head.y)) {
        this.finish(false, "La serpiente corto su propio circuito.");
        return;
      }
      this.snake.unshift(head);
      if (head.x === this.food.x && head.y === this.food.y) {
        this.score += 100;
        this.speed = Math.max(0.075, this.speed - 0.006);
        this.food = this.freeCell();
      } else {
        this.snake.pop();
      }
      if (this.snake.length >= this.target) this.finish(true, "Circuito completo sin romper la secuencia.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#090d13", "#151b28");
      ctx.strokeStyle = "rgba(85,214,190,0.13)";
      for (let x = 0; x <= this.cols; x += 1) {
        ctx.beginPath();
        ctx.moveTo(this.ox + x * this.size, this.oy);
        ctx.lineTo(this.ox + x * this.size, this.oy + this.rows * this.size);
        ctx.stroke();
      }
      for (let y = 0; y <= this.rows; y += 1) {
        ctx.beginPath();
        ctx.moveTo(this.ox, this.oy + y * this.size);
        ctx.lineTo(this.ox + this.cols * this.size, this.oy + y * this.size);
        ctx.stroke();
      }
      for (const b of this.blocks) {
        ctx.fillStyle = "#303640";
        ctx.fillRect(this.ox + b.x * this.size + 4, this.oy + b.y * this.size + 4, this.size - 8, this.size - 8);
      }
      for (const p of this.portals) drawDiamond(ctx, this.ox + p.x * this.size + 14, this.oy + p.y * this.size + 14, 12, "#7aa7ff");
      drawDiamond(ctx, this.ox + this.food.x * this.size + 14, this.oy + this.food.y * this.size + 14, 11, "#f4b860");
      this.snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? "#ffffff" : `rgba(85,214,190,${0.95 - i * 0.025})`;
        ctx.fillRect(this.ox + p.x * this.size + 3, this.oy + p.y * this.size + 3, this.size - 6, this.size - 6);
      });
      drawBar(ctx, 60, 512, 840, 10, this.snake.length / this.target, "#55d6be");
    }
  }

  class MeteorRunnerGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.player = { x: 130, y: 390, w: 28, h: 42, vy: 0, grounded: false, inv: 0 };
      this.floor = 444;
      this.distance = 0;
      this.speed = 225;
      this.health = 3;
      this.items = [];
      this.nextSpawn = 350;
      this.target = 2600;
    }

    spawnUntil() {
      while (this.nextSpawn < this.distance + W + 260) {
        const kind = this.rng.pick(["rock", "crystal", "gate", "pit"]);
        this.items.push({ kind, x: this.nextSpawn, y: kind === "crystal" ? this.rng.int(250, 350) : this.floor - 32, hit: false });
        this.nextSpawn += this.rng.int(120, 230);
      }
    }

    update(dt, input) {
      this.tick(dt);
      this.spawnUntil();
      this.distance += this.speed * dt;
      this.speed += dt * 6;
      if ((input.consume("action") || input.down.up) && this.player.grounded) {
        this.player.vy = -520;
        this.player.grounded = false;
      }
      if (input.consume("alt")) this.player.inv = Math.max(this.player.inv, 0.45);
      this.player.inv = Math.max(0, this.player.inv - dt);
      this.player.vy += 1100 * dt;
      this.player.y += this.player.vy * dt;
      if (this.player.y + this.player.h >= this.floor) {
        this.player.y = this.floor - this.player.h;
        this.player.vy = 0;
        this.player.grounded = true;
      }
      const playerRect = { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h };
      for (const item of this.items) {
        const sx = item.x - this.distance;
        if (item.hit || sx < -80 || sx > W + 80) continue;
        if (item.kind === "crystal" && rectsHit(playerRect, { x: sx - 12, y: item.y - 12, w: 24, h: 24 })) {
          item.hit = true;
          this.score += 90;
        }
        if ((item.kind === "rock" || item.kind === "gate") && rectsHit(playerRect, { x: sx, y: item.y, w: 34, h: 34 }) && this.player.inv <= 0) {
          item.hit = true;
          this.health -= 1;
          this.player.inv = 0.7;
          if (this.health <= 0) this.finish(false, "La lluvia de meteoros cerro la ruta.");
        }
        if (item.kind === "pit" && this.player.x > sx && this.player.x < sx + 66 && this.player.y + this.player.h >= this.floor - 2 && this.player.inv <= 0) {
          item.hit = true;
          this.health -= 1;
          this.player.inv = 0.7;
        }
      }
      this.items = this.items.filter((item) => item.x - this.distance > -140);
      this.score = Math.max(this.score, Math.floor(this.distance / 5));
      if (this.distance >= this.target) this.finish(true, "Refugio alcanzado antes del impacto mayor.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#20151a", "#4b2633");
      ctx.fillStyle = "#1b1014";
      ctx.fillRect(0, this.floor, W, H - this.floor);
      for (let i = 0; i < 12; i += 1) {
        ctx.fillStyle = i % 2 ? "rgba(244,184,96,0.22)" : "rgba(255,93,115,0.18)";
        ctx.fillRect((i * 118 - this.distance * 0.35) % 1100 - 80, 70 + (i % 5) * 35, 80, 5);
      }
      for (const item of this.items) {
        if (item.hit) continue;
        const sx = item.x - this.distance;
        if (item.kind === "crystal") drawDiamond(ctx, sx, item.y, 13, "#55d6be");
        if (item.kind === "rock") {
          ctx.fillStyle = "#6e5964";
          ctx.fillRect(sx, item.y, 34, 34);
        }
        if (item.kind === "gate") {
          ctx.strokeStyle = "#ff5d73";
          ctx.lineWidth = 5;
          ctx.strokeRect(sx, item.y - 42, 34, 76);
        }
        if (item.kind === "pit") {
          ctx.fillStyle = "#07090f";
          ctx.fillRect(sx, this.floor - 8, 70, 18);
        }
      }
      ctx.fillStyle = this.player.inv > 0 ? "#f4b860" : "#e9edf4";
      ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
      drawBar(ctx, 44, 504, 640, 12, this.distance / this.target, "#f4b860");
      drawBar(ctx, 44, 524, 120, 8, this.health / 3, "#89e07f");
    }
  }

  class GlyphAlchemyGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.cols = 8;
      this.rows = 8;
      this.size = 52;
      this.ox = 272;
      this.oy = 58;
      this.cursor = { x: 0, y: 0 };
      this.selected = null;
      this.palette = ["#55d6be", "#f4b860", "#ff5d73", "#7aa7ff", "#c58cff", "#89e07f"];
      this.grid = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => this.rng.int(0, this.palette.length - 1)));
      this.combo = 0;
      this.goalScore = 3400;
      this.resolveAll();
      this.ensurePlayableBoard();
    }

    swap(a, b) {
      [this.grid[a.y][a.x], this.grid[b.y][b.x]] = [this.grid[b.y][b.x], this.grid[a.y][a.x]];
    }

    matches() {
      const mark = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
      let count = 0;
      for (let y = 0; y < this.rows; y += 1) {
        let run = 1;
        for (let x = 1; x <= this.cols; x += 1) {
          if (x < this.cols && this.grid[y][x] === this.grid[y][x - 1]) run += 1;
          else {
            if (run >= 3) for (let k = 0; k < run; k += 1) mark[y][x - 1 - k] = true;
            run = 1;
          }
        }
      }
      for (let x = 0; x < this.cols; x += 1) {
        let run = 1;
        for (let y = 1; y <= this.rows; y += 1) {
          if (y < this.rows && this.grid[y][x] === this.grid[y - 1][x]) run += 1;
          else {
            if (run >= 3) for (let k = 0; k < run; k += 1) mark[y - 1 - k][x] = true;
            run = 1;
          }
        }
      }
      for (const row of mark) for (const m of row) if (m) count += 1;
      return { mark, count };
    }

    collapse(mark) {
      for (let x = 0; x < this.cols; x += 1) {
        const col = [];
        for (let y = this.rows - 1; y >= 0; y -= 1) if (!mark[y][x]) col.push(this.grid[y][x]);
        while (col.length < this.rows) col.push(this.rng.int(0, this.palette.length - 1));
        for (let y = this.rows - 1; y >= 0; y -= 1) this.grid[y][x] = col[this.rows - 1 - y];
      }
    }

    resolveAll(score = false) {
      let rounds = 0;
      while (rounds < 8) {
        const found = this.matches();
        if (!found.count) break;
        rounds += 1;
        if (score) {
          this.combo += 1;
          this.score += found.count * 55 * this.combo;
        }
        this.collapse(found.mark);
      }
      if (!score) this.combo = 0;
    }

    hasMove() {
      const dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          for (const dir of dirs) {
            const b = { x: x + dir.x, y: y + dir.y };
            if (b.x >= this.cols || b.y >= this.rows) continue;
            const a = { x, y };
            this.swap(a, b);
            const works = this.matches().count > 0;
            this.swap(a, b);
            if (works) return true;
          }
        }
      }
      return false;
    }

    ensurePlayableBoard() {
      let attempts = 0;
      while (!this.hasMove() && attempts < 40) {
        attempts += 1;
        for (let y = 0; y < this.rows; y += 1) {
          for (let x = 0; x < this.cols; x += 1) this.grid[y][x] = this.rng.int(0, this.palette.length - 1);
        }
        this.resolveAll(false);
      }
    }

    update(dt, input) {
      this.tick(dt);
      const dir = input.dirPressed();
      if (dir) {
        this.cursor.x = clamp(this.cursor.x + dir.x, 0, this.cols - 1);
        this.cursor.y = clamp(this.cursor.y + dir.y, 0, this.rows - 1);
      }
      if (input.consume("action")) {
        const cur = { x: this.cursor.x, y: this.cursor.y };
        if (!this.selected) this.selected = cur;
        else {
          const adjacent = Math.abs(this.selected.x - cur.x) + Math.abs(this.selected.y - cur.y) === 1;
          if (adjacent) {
            this.swap(this.selected, cur);
            const found = this.matches();
            if (found.count) {
              this.combo = 0;
              this.resolveAll(true);
              this.ensurePlayableBoard();
            } else {
              this.swap(this.selected, cur);
            }
          }
          this.selected = null;
        }
      }
      if (this.score >= this.goalScore) this.finish(true, "Transmutacion estable.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#15111d", "#2f2345");
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const px = this.ox + x * this.size;
          const py = this.oy + y * this.size;
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.fillRect(px + 2, py + 2, this.size - 4, this.size - 4);
          drawDiamond(ctx, px + this.size / 2, py + this.size / 2, 18, this.palette[this.grid[y][x]]);
          drawText(ctx, String.fromCharCode(65 + this.grid[y][x]), px + this.size / 2, py + this.size / 2 + 1, 16, "#111318", "center", 900);
        }
      }
      if (this.selected) {
        ctx.strokeStyle = "#f4b860";
        ctx.lineWidth = 4;
        ctx.strokeRect(this.ox + this.selected.x * this.size + 4, this.oy + this.selected.y * this.size + 4, this.size - 8, this.size - 8);
      }
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.ox + this.cursor.x * this.size + 7, this.oy + this.cursor.y * this.size + 7, this.size - 14, this.size - 14);
      drawBar(ctx, 272, 500, 416, 12, this.score / this.goalScore, "#c58cff");
    }
  }

  class TowerGardenGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.cols = 16;
      this.rows = 9;
      this.size = 48;
      this.ox = 96;
      this.oy = 54;
      this.path = [];
      this.pathCells = new Set();
      this.towers = [];
      this.enemies = [];
      this.shots = [];
      this.cursor = { x: 2, y: 2 };
      this.energy = 90;
      this.wave = 1;
      this.maxWave = 6;
      this.spawnTimer = 0.5;
      this.toSpawn = 8;
      this.health = 10;
      this.makePath();
    }

    makePath() {
      let y = this.rng.int(2, this.rows - 3);
      for (let x = 0; x < this.cols; x += 1) {
        this.path.push({ x, y });
        this.pathCells.add(`${x},${y}`);
        if (this.rng.chance(0.5)) y = clamp(y + this.rng.pick([-1, 1]), 1, this.rows - 2);
      }
    }

    update(dt, input) {
      this.tick(dt);
      const dir = input.dirPressed();
      if (dir) {
        this.cursor.x = clamp(this.cursor.x + dir.x, 0, this.cols - 1);
        this.cursor.y = clamp(this.cursor.y + dir.y, 0, this.rows - 1);
      }
      if (input.consume("action")) {
        const key = `${this.cursor.x},${this.cursor.y}`;
        const existing = this.towers.find((t) => t.x === this.cursor.x && t.y === this.cursor.y);
        if (existing && this.energy >= 60) {
          existing.level += 1;
          this.energy -= 60;
        } else if (!existing && !this.pathCells.has(key) && this.energy >= 45) {
          this.towers.push({ x: this.cursor.x, y: this.cursor.y, level: 1, cool: 0 });
          this.energy -= 45;
        }
      }
      this.energy = Math.min(180, this.energy + dt * 7);
      this.spawnTimer -= dt;
      if (this.toSpawn > 0 && this.spawnTimer <= 0) {
        this.spawnTimer = Math.max(0.28, 0.9 - this.wave * 0.07);
        this.toSpawn -= 1;
        this.enemies.push({ pos: 0, hp: 34 + this.wave * 13, max: 34 + this.wave * 13, speed: 1.2 + this.wave * 0.15 });
      }
      if (this.toSpawn <= 0 && this.enemies.length === 0) {
        if (this.wave >= this.maxWave) {
          this.finish(true, "Jardin defendido hasta la floracion.");
          return;
        }
        this.wave += 1;
        this.toSpawn = 7 + this.wave * 2;
        this.spawnTimer = 1.2;
        this.energy += 70;
      }
      for (const enemy of this.enemies) {
        enemy.pos += enemy.speed * dt;
        if (enemy.pos >= this.path.length - 1) {
          enemy.dead = true;
          this.health -= 1;
          if (this.health <= 0) this.finish(false, "Las esporas cruzaron el vivero.");
        }
      }
      for (const tower of this.towers) {
        tower.cool -= dt;
        if (tower.cool <= 0) {
          const tx = this.ox + tower.x * this.size + 24;
          const ty = this.oy + tower.y * this.size + 24;
          let target = null;
          let best = 150 + tower.level * 22;
          for (const enemy of this.enemies) {
            const p = this.enemyPoint(enemy);
            const d = dist(tx, ty, p.x, p.y);
            if (d < best) {
              best = d;
              target = enemy;
            }
          }
          if (target) {
            target.hp -= 15 + tower.level * 9;
            tower.cool = Math.max(0.24, 0.78 - tower.level * 0.08);
            this.shots.push({ x: tx, y: ty, tx: this.enemyPoint(target).x, ty: this.enemyPoint(target).y, life: 0.16 });
            if (target.hp <= 0) {
              target.dead = true;
              this.energy += 20;
              this.score += 70;
            }
          }
        }
      }
      this.enemies = this.enemies.filter((e) => !e.dead);
      for (const shot of this.shots) shot.life -= dt;
      this.shots = this.shots.filter((s) => s.life > 0);
    }

    enemyPoint(enemy) {
      const i = Math.floor(enemy.pos);
      const t = enemy.pos - i;
      const a = this.path[clamp(i, 0, this.path.length - 1)];
      const b = this.path[clamp(i + 1, 0, this.path.length - 1)];
      return {
        x: this.ox + lerp(a.x, b.x, t) * this.size + 24,
        y: this.oy + lerp(a.y, b.y, t) * this.size + 24
      };
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#10180f", "#273722");
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const key = `${x},${y}`;
          ctx.fillStyle = this.pathCells.has(key) ? "#594733" : (x + y) % 2 ? "#172719" : "#132116";
          ctx.fillRect(this.ox + x * this.size, this.oy + y * this.size, this.size - 1, this.size - 1);
        }
      }
      for (const tower of this.towers) {
        const x = this.ox + tower.x * this.size + 24;
        const y = this.oy + tower.y * this.size + 24;
        ctx.fillStyle = tower.level > 1 ? "#f4b860" : "#55d6be";
        ctx.beginPath();
        ctx.arc(x, y, 13 + tower.level * 2, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = "#f4b860";
      ctx.lineWidth = 3;
      for (const shot of this.shots) {
        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.lineTo(shot.tx, shot.ty);
        ctx.stroke();
      }
      for (const enemy of this.enemies) {
        const p = this.enemyPoint(enemy);
        ctx.fillStyle = "#ff5d73";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, TAU);
        ctx.fill();
        drawBar(ctx, p.x - 15, p.y - 22, 30, 4, enemy.hp / enemy.max, "#89e07f");
      }
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.ox + this.cursor.x * this.size + 4, this.oy + this.cursor.y * this.size + 4, this.size - 8, this.size - 8);
      drawText(ctx, `Energia ${Math.floor(this.energy)}   Ola ${this.wave}/${this.maxWave}   Base ${this.health}`, 96, 514, 17, "#cbd3df");
    }
  }

  class CityPulseGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.roadsX = [120, 250, 380, 520, 660, 805];
      this.roadsY = [82, 178, 270, 365, 458];
      this.car = { x: this.roadsX[0], y: this.roadsY[2], targetX: this.roadsX[0], targetY: this.roadsY[2], cargo: false };
      this.passengers = [];
      this.traffic = [];
      this.delivered = 0;
      this.target = 8;
      this.timer = 100;
      for (let i = 0; i < 8; i += 1) this.spawnPassenger();
      for (let i = 0; i < 13; i += 1) this.spawnTraffic();
    }

    node() {
      return { x: this.rng.pick(this.roadsX), y: this.rng.pick(this.roadsY) };
    }

    spawnPassenger() {
      const a = this.node();
      let b = this.node();
      while (b.x === a.x && b.y === a.y) b = this.node();
      this.passengers.push({ x: a.x, y: a.y, dx: b.x, dy: b.y, picked: false });
    }

    spawnTraffic() {
      const n = this.node();
      const horizontal = this.rng.chance(0.5);
      this.traffic.push({ x: n.x, y: n.y, horizontal, speed: this.rng.float(46, 92) * (this.rng.chance(0.5) ? 1 : -1) });
    }

    nearestRoad(value, list, dir) {
      const current = list.indexOf(value);
      return list[clamp(current + dir, 0, list.length - 1)];
    }

    update(dt, input) {
      this.tick(dt);
      this.timer -= dt;
      if (this.timer <= 0) this.finish(false, "La ciudad entro en bloqueo total.");
      const dir = input.dirPressed();
      if (dir && Math.abs(this.car.x - this.car.targetX) < 2 && Math.abs(this.car.y - this.car.targetY) < 2) {
        if (dir.x) this.car.targetX = this.nearestRoad(this.car.targetX, this.roadsX, dir.x);
        if (dir.y) this.car.targetY = this.nearestRoad(this.car.targetY, this.roadsY, dir.y);
      }
      const a = Math.atan2(this.car.targetY - this.car.y, this.car.targetX - this.car.x);
      const d = dist(this.car.x, this.car.y, this.car.targetX, this.car.targetY);
      const step = Math.min(d, 190 * dt);
      this.car.x += Math.cos(a) * step;
      this.car.y += Math.sin(a) * step;
      for (const t of this.traffic) {
        if (t.horizontal) {
          t.x += t.speed * dt;
          if (t.x < 80 || t.x > 860) t.speed *= -1;
        } else {
          t.y += t.speed * dt;
          if (t.y < 52 || t.y > 488) t.speed *= -1;
        }
        if (dist(t.x, t.y, this.car.x, this.car.y) < 24) {
          this.timer -= 6;
          t.speed *= -1;
        }
      }
      for (const p of this.passengers) {
        if (!p.picked && !this.car.cargo && dist(p.x, p.y, this.car.x, this.car.y) < 24) {
          p.picked = true;
          this.car.cargo = p;
        }
      }
      if (this.car.cargo && dist(this.car.cargo.dx, this.car.cargo.dy, this.car.x, this.car.y) < 24) {
        this.score += 160 + Math.floor(this.timer);
        this.delivered += 1;
        this.passengers = this.passengers.filter((p) => p !== this.car.cargo);
        this.car.cargo = false;
        this.spawnPassenger();
      }
      if (this.delivered >= this.target) this.finish(true, "Red urbana sincronizada.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#111318", "#202a34");
      ctx.strokeStyle = "#313b47";
      ctx.lineWidth = 24;
      ctx.lineCap = "round";
      for (const x of this.roadsX) {
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, 490);
        ctx.stroke();
      }
      for (const y of this.roadsY) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(870, y);
        ctx.stroke();
      }
      for (const p of this.passengers) {
        if (!p.picked) drawDiamond(ctx, p.x, p.y, 11, "#f4b860");
        ctx.strokeStyle = "rgba(85,214,190,0.35)";
        ctx.strokeRect(p.dx - 10, p.dy - 10, 20, 20);
      }
      ctx.fillStyle = "#ff5d73";
      for (const t of this.traffic) ctx.fillRect(t.x - 12, t.y - 8, 24, 16);
      ctx.fillStyle = this.car.cargo ? "#f4b860" : "#55d6be";
      ctx.fillRect(this.car.x - 15, this.car.y - 10, 30, 20);
      drawBar(ctx, 74, 510, 230, 10, this.delivered / this.target, "#55d6be");
      drawText(ctx, `Entregas ${this.delivered}/${this.target}   Red ${Math.ceil(this.timer)}`, 326, 516, 16, "#cbd3df");
    }
  }

  class DesertCaravanGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.nodes = [];
      this.edges = new Map();
      this.current = 0;
      this.selected = 0;
      this.supplies = 100;
      this.water = 90;
      this.goalIndex = 11;
      this.makeGraph();
    }

    makeGraph() {
      for (let i = 0; i < 12; i += 1) {
        this.nodes.push({
          x: 90 + (i % 4) * 245 + this.rng.int(-28, 28),
          y: 90 + Math.floor(i / 4) * 160 + this.rng.int(-26, 26),
          kind: i === 11 ? "citadel" : this.rng.pick(["oasis", "market", "ruin", "dune"])
        });
        this.edges.set(i, []);
      }
      for (let i = 0; i < 12; i += 1) {
        for (let j = i + 1; j < 12; j += 1) {
          if (dist(this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y) < 300 && this.rng.chance(0.52)) {
            const cost = this.rng.int(9, 24);
            this.edges.get(i).push({ to: j, cost });
            this.edges.get(j).push({ to: i, cost });
          }
        }
      }
      for (let i = 0; i < 11; i += 1) {
        if (!this.edges.get(i).some((e) => e.to === i + 1)) {
          const cost = this.rng.int(10, 20);
          this.edges.get(i).push({ to: i + 1, cost });
          this.edges.get(i + 1).push({ to: i, cost });
        }
      }
    }

    currentEdges() {
      return this.edges.get(this.current);
    }

    update(dt, input) {
      this.tick(dt);
      if (input.consume("left") || input.consume("up")) this.selected = (this.selected + this.currentEdges().length - 1) % this.currentEdges().length;
      if (input.consume("right") || input.consume("down")) this.selected = (this.selected + 1) % this.currentEdges().length;
      if (input.consume("action")) {
        const edge = this.currentEdges()[this.selected];
        this.current = edge.to;
        this.selected = 0;
        this.supplies -= edge.cost + this.rng.int(0, 9);
        this.water -= Math.ceil(edge.cost * 0.8) + this.rng.int(0, 8);
        const node = this.nodes[this.current];
        if (node.kind === "oasis") this.water = Math.min(110, this.water + 45);
        if (node.kind === "market") this.supplies = Math.min(120, this.supplies + 35);
        if (node.kind === "ruin") this.score += 180;
        if (this.supplies <= 0 || this.water <= 0) this.finish(false, "La caravana quedo sin reservas.");
        if (this.current === this.goalIndex) this.finish(true, "La ruta encontro la ciudad de sal.");
      }
      this.score += dt;
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#261d16", "#5b4930");
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 3;
      for (const [i, list] of this.edges) {
        for (const edge of list) {
          if (edge.to < i) continue;
          ctx.beginPath();
          ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
          ctx.lineTo(this.nodes[edge.to].x, this.nodes[edge.to].y);
          ctx.stroke();
        }
      }
      const edge = this.currentEdges()[this.selected];
      ctx.strokeStyle = "#f4b860";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(this.nodes[this.current].x, this.nodes[this.current].y);
      ctx.lineTo(this.nodes[edge.to].x, this.nodes[edge.to].y);
      ctx.stroke();
      this.nodes.forEach((node, i) => {
        const colors = { oasis: "#55d6be", market: "#f4b860", ruin: "#c58cff", dune: "#d6b47b", citadel: "#ffffff" };
        ctx.fillStyle = colors[node.kind];
        ctx.beginPath();
        ctx.arc(node.x, node.y, i === this.current ? 17 : 12, 0, TAU);
        ctx.fill();
      });
      drawBar(ctx, 60, 502, 180, 10, this.supplies / 120, "#f4b860");
      drawBar(ctx, 60, 522, 180, 10, this.water / 110, "#55d6be");
      drawText(ctx, `Provisiones ${Math.ceil(this.supplies)}   Agua ${Math.ceil(this.water)}`, 262, 516, 16, "#f8ead5");
    }
  }

  class OrbitHarvestGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.ship = { x: 120, y: 270, vx: 0, vy: -90 };
      this.planets = [];
      this.pods = [];
      this.debris = [];
      this.fuel = 100;
      for (let i = 0; i < 4; i += 1) this.planets.push({ x: this.rng.int(210, 820), y: this.rng.int(100, 440), r: this.rng.int(28, 54), mass: this.rng.float(5000, 8500), color: this.rng.pick(["#7aa7ff", "#55d6be", "#f4b860", "#c58cff"]) });
      for (let i = 0; i < 11; i += 1) this.pods.push({ x: this.rng.int(100, 880), y: this.rng.int(70, 470), taken: false });
      for (let i = 0; i < 10; i += 1) this.debris.push({ x: this.rng.int(120, 880), y: this.rng.int(80, 460), vx: this.rng.float(-45, 45), vy: this.rng.float(-45, 45) });
    }

    update(dt, input) {
      this.tick(dt);
      const axis = input.axis();
      if ((axis.x || axis.y) && this.fuel > 0) {
        this.ship.vx += axis.x * 130 * dt;
        this.ship.vy += axis.y * 130 * dt;
        this.fuel -= dt * 8;
      }
      for (const p of this.planets) {
        const dx = p.x - this.ship.x;
        const dy = p.y - this.ship.y;
        const d2 = Math.max(1400, dx * dx + dy * dy);
        const force = p.mass / d2;
        this.ship.vx += dx * force * dt;
        this.ship.vy += dy * force * dt;
        if (Math.sqrt(d2) < p.r + 10) this.finish(false, "La orbita termino contra un mundo granja.");
      }
      this.ship.x += this.ship.vx * dt;
      this.ship.y += this.ship.vy * dt;
      if (this.ship.x < 0 || this.ship.x > W || this.ship.y < 0 || this.ship.y > H) this.finish(false, "La nave salio del mapa orbital.");
      for (const d of this.debris) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.x < 20 || d.x > W - 20) d.vx *= -1;
        if (d.y < 20 || d.y > H - 20) d.vy *= -1;
        if (dist(d.x, d.y, this.ship.x, this.ship.y) < 16) this.finish(false, "Los restos orbitales abrieron el casco.");
      }
      for (const pod of this.pods) {
        if (!pod.taken && dist(pod.x, pod.y, this.ship.x, this.ship.y) < 20) {
          pod.taken = true;
          this.score += 140;
          this.fuel = Math.min(100, this.fuel + 8);
        }
      }
      if (this.pods.every((p) => p.taken)) this.finish(true, "Cosecha orbital recuperada.");
    }

    render(ctx) {
      drawStarfield(ctx, this.visualRng, "#55d6be", 80);
      for (const p of this.planets) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = colorWithAlpha(p.color, 0.22);
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 18, 0, TAU);
        ctx.stroke();
      }
      for (const pod of this.pods) if (!pod.taken) drawDiamond(ctx, pod.x, pod.y, 10, "#f4b860");
      ctx.fillStyle = "#ff5d73";
      for (const d of this.debris) ctx.fillRect(d.x - 6, d.y - 6, 12, 12);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.ship.x, this.ship.y, 9, 0, TAU);
      ctx.fill();
      drawBar(ctx, 42, 514, 170, 10, this.fuel / 100, "#55d6be");
      drawText(ctx, `Capsulas ${this.pods.filter((p) => p.taken).length}/${this.pods.length}`, 232, 520, 16, "#cbd3df");
    }
  }

  class IceCourierGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.cols = 13;
      this.rows = 9;
      this.size = 46;
      this.ox = 181;
      this.oy = 58;
      this.player = { x: 1, y: 1 };
      this.walls = new Set();
      this.crates = [];
      this.docks = [];
      this.moves = 0;
      this.makePuzzle();
    }

    makePuzzle() {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        this.generatePuzzleLayout();
        if (this.hasSolution()) return;
      }
      this.makeFallbackPuzzle();
    }

    generatePuzzleLayout() {
      this.walls = new Set();
      this.crates = [];
      this.docks = [];
      for (let x = 0; x < this.cols; x += 1) {
        this.walls.add(`${x},0`);
        this.walls.add(`${x},${this.rows - 1}`);
      }
      for (let y = 0; y < this.rows; y += 1) {
        this.walls.add(`0,${y}`);
        this.walls.add(`${this.cols - 1},${y}`);
      }
      for (let i = 0; i < 14; i += 1) this.walls.add(`${this.rng.int(2, this.cols - 3)},${this.rng.int(2, this.rows - 3)}`);
      const spots = [];
      for (let y = 1; y < this.rows - 1; y += 1) for (let x = 1; x < this.cols - 1; x += 1) if (!this.walls.has(`${x},${y}`)) spots.push({ x, y });
      this.rng.shuffle(spots);
      this.player = spots.pop();
      for (let i = 0; i < 4; i += 1) this.crates.push(spots.pop());
      for (let i = 0; i < 4; i += 1) this.docks.push(spots.pop());
    }

    makeFallbackPuzzle() {
      this.walls = new Set();
      for (let x = 0; x < this.cols; x += 1) {
        this.walls.add(`${x},0`);
        this.walls.add(`${x},${this.rows - 1}`);
      }
      for (let y = 0; y < this.rows; y += 1) {
        this.walls.add(`0,${y}`);
        this.walls.add(`${this.cols - 1},${y}`);
      }
      this.player = { x: 1, y: 1 };
      this.crates = [{ x: 2, y: 1 }];
      this.docks = [{ x: this.cols - 2, y: 1 }];
    }

    crateAt(x, y) {
      return this.crates.find((c) => c.x === x && c.y === y);
    }

    blocked(x, y) {
      return this.walls.has(`${x},${y}`) || this.crateAt(x, y);
    }

    crateAtIn(crates, x, y) {
      return crates.findIndex((c) => c.x === x && c.y === y);
    }

    stateKey(player, crates) {
      return `${player.x},${player.y}|${crates.map((c) => `${c.x},${c.y}`).sort().join(";")}`;
    }

    solved(crates) {
      return crates.every((c) => this.docks.some((d) => d.x === c.x && d.y === c.y));
    }

    slideCrateState(crates, index, dir) {
      const moved = crates.map((c) => ({ ...c }));
      let x = moved[index].x;
      let y = moved[index].y;
      while (true) {
        const nx = x + dir.x;
        const ny = y + dir.y;
        if (this.walls.has(`${nx},${ny}`)) break;
        const hit = moved.findIndex((c, i) => i !== index && c.x === nx && c.y === ny);
        if (hit >= 0) break;
        x = nx;
        y = ny;
      }
      moved[index] = { x, y };
      return moved;
    }

    slideState(player, crates, dir) {
      let x = player.x;
      let y = player.y;
      let moved = crates.map((c) => ({ ...c }));
      while (true) {
        const nx = x + dir.x;
        const ny = y + dir.y;
        if (this.walls.has(`${nx},${ny}`)) break;
        const crateIndex = this.crateAtIn(moved, nx, ny);
        if (crateIndex >= 0) {
          moved = this.slideCrateState(moved, crateIndex, dir);
          break;
        }
        x = nx;
        y = ny;
      }
      return { player: { x, y }, crates: moved };
    }

    hasSolution(maxStates = 12000) {
      const start = { player: { ...this.player }, crates: this.crates.map((c) => ({ ...c })) };
      const queue = [start];
      const seen = new Set([this.stateKey(start.player, start.crates)]);
      const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      for (let head = 0; head < queue.length && seen.size < maxStates; head += 1) {
        const state = queue[head];
        if (this.solved(state.crates)) return true;
        for (const dir of dirs) {
          const next = this.slideState(state.player, state.crates, dir);
          const key = this.stateKey(next.player, next.crates);
          if (seen.has(key)) continue;
          seen.add(key);
          queue.push(next);
        }
      }
      return false;
    }

    slide(pos, dir, isCrate = false) {
      let x = pos.x;
      let y = pos.y;
      while (true) {
        const nx = x + dir.x;
        const ny = y + dir.y;
        if (this.walls.has(`${nx},${ny}`)) break;
        if (!isCrate && this.crateAt(nx, ny)) {
          const crate = this.crateAt(nx, ny);
          const end = this.slide(crate, dir, true);
          crate.x = end.x;
          crate.y = end.y;
          break;
        }
        if (isCrate && this.crateAt(nx, ny)) break;
        x = nx;
        y = ny;
      }
      return { x, y };
    }

    update(dt, input) {
      this.tick(dt);
      const dir = input.dirPressed();
      if (dir) {
        const end = this.slide(this.player, dir, false);
        if (end.x !== this.player.x || end.y !== this.player.y) {
          this.player = end;
          this.moves += 1;
          this.score = Math.max(0, 1200 - this.moves * 8);
        }
      }
      const done = this.crates.every((c) => this.docks.some((d) => d.x === c.x && d.y === c.y));
      if (done) this.finish(true, "Paquetes entregados sobre hielo limpio.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#d8f3ff", "#8abbd0");
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const px = this.ox + x * this.size;
          const py = this.oy + y * this.size;
          ctx.fillStyle = this.walls.has(`${x},${y}`) ? "#4d6b76" : "#c8eef7";
          ctx.fillRect(px, py, this.size - 2, this.size - 2);
        }
      }
      for (const dock of this.docks) {
        ctx.strokeStyle = "#55d6be";
        ctx.lineWidth = 4;
        ctx.strokeRect(this.ox + dock.x * this.size + 10, this.oy + dock.y * this.size + 10, 26, 26);
      }
      for (const crate of this.crates) {
        ctx.fillStyle = "#f4b860";
        ctx.fillRect(this.ox + crate.x * this.size + 9, this.oy + crate.y * this.size + 9, 28, 28);
      }
      ctx.fillStyle = "#111318";
      ctx.beginPath();
      ctx.arc(this.ox + this.player.x * this.size + 23, this.oy + this.player.y * this.size + 23, 14, 0, TAU);
      ctx.fill();
      drawText(ctx, `Movimientos ${this.moves}`, 392, 512, 17, "#111318");
    }
  }

  class RhythmKeeperGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.lanes = ["left", "down", "up", "right"];
      this.notes = [];
      this.beat = 0;
      this.song = 42;
      this.health = 100;
      for (let t = 1; t < this.song; t += this.rng.pick([0.45, 0.6, 0.75])) this.notes.push({ lane: this.rng.int(0, 3), t, hit: false, missed: false });
    }

    update(dt, input) {
      this.tick(dt);
      this.beat += dt;
      for (let lane = 0; lane < 4; lane += 1) {
        if (input.consume(this.lanes[lane])) {
          let best = null;
          let bd = 0.2;
          for (const note of this.notes) {
            const diff = Math.abs(note.t - this.beat);
            if (!note.hit && !note.missed && note.lane === lane && diff < bd) {
              best = note;
              bd = diff;
            }
          }
          if (best) {
            best.hit = true;
            this.score += Math.floor(120 * (1 - bd / 0.2));
            this.health = Math.min(100, this.health + 2);
          } else {
            this.health -= 5;
          }
        }
      }
      for (const note of this.notes) {
        if (!note.hit && !note.missed && note.t < this.beat - 0.22) {
          note.missed = true;
          this.health -= 6;
        }
      }
      if (this.health <= 0) this.finish(false, "El escudo perdio el pulso.");
      if (this.beat >= this.song && this.health > 0) this.finish(true, "Secuencia protegida hasta el ultimo compas.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#101018", "#281c3a");
      const laneW = 120;
      const ox = 240;
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.075)";
        ctx.fillRect(ox + i * laneW, 50, laneW - 4, 420);
        drawText(ctx, ["<", "v", "^", ">"][i], ox + i * laneW + 58, 438, 24, "#cbd3df", "center");
      }
      ctx.fillStyle = "#55d6be";
      ctx.fillRect(ox, 404, laneW * 4 - 4, 5);
      for (const note of this.notes) {
        if (note.hit || note.missed) continue;
        const y = 404 - (note.t - this.beat) * 280;
        if (y < 40 || y > 460) continue;
        drawDiamond(ctx, ox + note.lane * laneW + 58, y, 20, ["#55d6be", "#f4b860", "#ff5d73", "#7aa7ff"][note.lane]);
      }
      drawBar(ctx, 240, 504, 480, 12, this.beat / this.song, "#c58cff");
      drawBar(ctx, 240, 524, 480, 8, this.health / 100, "#89e07f");
    }
  }

  class VolcanoForgeGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.heat = 0.35;
      this.dir = 1;
      this.parts = 0;
      this.target = 6;
      this.zones = [];
      this.coolant = 3;
      this.makeZone();
    }

    makeZone() {
      const center = this.rng.float(0.22, 0.82);
      const width = this.rng.float(0.08, 0.16);
      this.zones = [{ a: center - width / 2, b: center + width / 2 }];
    }

    update(dt, input) {
      this.tick(dt);
      this.heat += this.dir * dt * (0.34 + this.parts * 0.045);
      if (this.heat >= 1 || this.heat <= 0) {
        this.dir *= -1;
        this.heat = clamp(this.heat, 0, 1);
      }
      if (input.consume("alt") && this.coolant > 0) {
        this.coolant -= 1;
        this.heat = clamp(this.heat - 0.22, 0, 1);
      }
      if (input.consume("action")) {
        const ok = this.zones.some((z) => this.heat >= z.a && this.heat <= z.b);
        if (ok) {
          this.parts += 1;
          this.score += 240 + Math.floor(80 * (1 - Math.abs(this.heat - (this.zones[0].a + this.zones[0].b) / 2)));
          this.makeZone();
        } else {
          this.score = Math.max(0, this.score - 100);
          this.heat = clamp(this.heat + 0.12, 0, 1);
        }
      }
      if (this.heat > 0.97) this.finish(false, "El molde se fundio sobre el yunque.");
      if (this.parts >= this.target) this.finish(true, "Artefacto volcanico templado.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#1e1010", "#56251f");
      ctx.fillStyle = "#111318";
      ctx.fillRect(210, 390, 540, 46);
      for (const zone of this.zones) {
        ctx.fillStyle = "#55d6be";
        ctx.fillRect(210 + zone.a * 540, 390, (zone.b - zone.a) * 540, 46);
      }
      ctx.fillStyle = "#f4b860";
      ctx.fillRect(210 + this.heat * 540 - 6, 374, 12, 78);
      ctx.fillStyle = "rgba(255,93,115,0.18)";
      ctx.beginPath();
      ctx.arc(480, 260, 125 + Math.sin(this.time * 7) * 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ff5d73";
      ctx.beginPath();
      ctx.arc(480, 260, 84, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#f4b860";
      ctx.fillRect(368, 250, 224, 46);
      drawText(ctx, `${this.parts}/${this.target}`, 480, 262, 42, "#111318", "center", 900);
      drawText(ctx, `Refrigerante ${this.coolant}`, 480, 510, 17, "#f8d6c4", "center");
    }
  }

  class MemoryMazeGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.cols = 19;
      this.rows = 11;
      this.size = 40;
      this.ox = 100;
      this.oy = 50;
      this.map = Array.from({ length: this.rows }, () => Array(this.cols).fill(1));
      this.player = { x: 1, y: 1 };
      this.exit = { x: this.cols - 2, y: this.rows - 2 };
      this.runes = [];
      this.lantern = 6;
      this.reveal = 5;
      this.makeMaze();
    }

    makeMaze() {
      const carve = (x, y) => {
        this.map[y][x] = 0;
        const dirs = this.rng.shuffle([[2, 0], [-2, 0], [0, 2], [0, -2]]);
        for (const [dx, dy] of dirs) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx > 0 && ny > 0 && nx < this.cols - 1 && ny < this.rows - 1 && this.map[ny][nx]) {
            this.map[y + dy / 2][x + dx / 2] = 0;
            carve(nx, ny);
          }
        }
      };
      carve(1, 1);
      for (let i = 0; i < 5; i += 1) {
        let p;
        do p = { x: this.rng.int(1, this.cols - 2), y: this.rng.int(1, this.rows - 2), taken: false };
        while (this.map[p.y][p.x]);
        this.runes.push(p);
      }
    }

    update(dt, input) {
      this.tick(dt);
      this.reveal = Math.max(0, this.reveal - dt);
      if (input.consume("action") && this.lantern > 0) {
        this.lantern -= 1;
        this.reveal = 2.5;
      }
      const dir = input.dirPressed();
      if (dir) {
        const nx = this.player.x + dir.x;
        const ny = this.player.y + dir.y;
        if (!this.map[ny][nx]) {
          this.player.x = nx;
          this.player.y = ny;
          this.score += 4;
        }
      }
      for (const rune of this.runes) {
        if (!rune.taken && rune.x === this.player.x && rune.y === this.player.y) {
          rune.taken = true;
          this.score += 140;
        }
      }
      if (this.player.x === this.exit.x && this.player.y === this.exit.y && this.runes.every((r) => r.taken)) this.finish(true, "Archivo fantasma catalogado.");
    }

    visible(x, y) {
      if (this.reveal > 0) return true;
      return Math.abs(x - this.player.x) + Math.abs(y - this.player.y) < 3;
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#0d0c12", "#201a2a");
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const px = this.ox + x * this.size;
          const py = this.oy + y * this.size;
          if (!this.visible(x, y)) {
            ctx.fillStyle = "#050607";
          } else {
            ctx.fillStyle = this.map[y][x] ? "#2a2335" : "#151723";
          }
          ctx.fillRect(px, py, this.size - 1, this.size - 1);
        }
      }
      for (const rune of this.runes) if (!rune.taken && this.visible(rune.x, rune.y)) drawDiamond(ctx, this.ox + rune.x * this.size + 20, this.oy + rune.y * this.size + 20, 10, "#c58cff");
      if (this.visible(this.exit.x, this.exit.y)) {
        ctx.fillStyle = "#55d6be";
        ctx.fillRect(this.ox + this.exit.x * this.size + 10, this.oy + this.exit.y * this.size + 10, 20, 20);
      }
      ctx.fillStyle = "#f4b860";
      ctx.beginPath();
      ctx.arc(this.ox + this.player.x * this.size + 20, this.oy + this.player.y * this.size + 20, 12, 0, TAU);
      ctx.fill();
      drawText(ctx, `Linternas ${this.lantern}   Runas ${this.runes.filter((r) => r.taken).length}/${this.runes.length}`, 330, 510, 17, "#cbd3df");
    }
  }

  class BioDefenseGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.bot = { x: W / 2, y: H / 2 };
      this.viruses = [];
      this.bolts = [];
      this.cells = [];
      this.cool = 0;
      this.health = 5;
      this.spawn = 0;
      this.cleaned = 0;
      for (let i = 0; i < 9; i += 1) this.cells.push({ x: this.rng.int(70, 890), y: this.rng.int(70, 470), clean: false });
    }

    update(dt, input) {
      this.tick(dt);
      const axis = input.axis();
      this.bot.x = clamp(this.bot.x + axis.x * 210 * dt, 25, W - 25);
      this.bot.y = clamp(this.bot.y + axis.y * 210 * dt, 25, H - 25);
      this.cool -= dt;
      if ((input.down.action || input.consume("action")) && this.cool <= 0) {
        const a = Math.atan2(axis.y || -1, axis.x || 0);
        this.bolts.push({ x: this.bot.x, y: this.bot.y, vx: Math.cos(a) * 390, vy: Math.sin(a) * 390, life: 0.9 });
        this.cool = 0.18;
      }
      this.spawn -= dt;
      if (this.spawn <= 0) {
        this.spawn = Math.max(0.35, 1.3 - this.time * 0.02);
        const side = this.rng.int(0, 3);
        this.viruses.push({ x: side === 0 ? -20 : side === 1 ? W + 20 : this.rng.int(0, W), y: side === 2 ? -20 : side === 3 ? H + 20 : this.rng.int(0, H), hp: 2 });
      }
      for (const v of this.viruses) {
        const a = Math.atan2(this.bot.y - v.y, this.bot.x - v.x);
        v.x += Math.cos(a) * (72 + this.time * 1.2) * dt;
        v.y += Math.sin(a) * (72 + this.time * 1.2) * dt;
        if (dist(v.x, v.y, this.bot.x, this.bot.y) < 21) {
          v.dead = true;
          this.health -= 1;
          if (this.health <= 0) this.finish(false, "La colonia viral supero la defensa.");
        }
      }
      for (const bolt of this.bolts) {
        bolt.x += bolt.vx * dt;
        bolt.y += bolt.vy * dt;
        bolt.life -= dt;
        for (const v of this.viruses) {
          if (!v.dead && dist(bolt.x, bolt.y, v.x, v.y) < 15) {
            bolt.life = 0;
            v.hp -= 1;
            if (v.hp <= 0) {
              v.dead = true;
              this.score += 65;
            }
          }
        }
      }
      for (const c of this.cells) {
        if (!c.clean && dist(c.x, c.y, this.bot.x, this.bot.y) < 24) {
          c.clean = true;
          this.cleaned += 1;
          this.score += 150;
        }
      }
      this.viruses = this.viruses.filter((v) => !v.dead);
      this.bolts = this.bolts.filter((b) => b.life > 0);
      if (this.cleaned >= this.cells.length) this.finish(true, "Tejido depurado por nanobots.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#180f16", "#2d1b26");
      for (const c of this.cells) {
        ctx.fillStyle = c.clean ? "#55d6be" : "#7a405a";
        ctx.beginPath();
        ctx.arc(c.x, c.y, 19, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = "#ff5d73";
      for (const v of this.viruses) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 14, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = "#f4b860";
      for (const b of this.bolts) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.bot.x, this.bot.y, 13, 0, TAU);
      ctx.fill();
      drawBar(ctx, 44, 506, 190, 10, this.cleaned / this.cells.length, "#55d6be");
      drawBar(ctx, 44, 524, 130, 8, this.health / 5, "#89e07f");
    }
  }

  class SignalMinesGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.cols = 12;
      this.rows = 10;
      this.size = 44;
      this.ox = 216;
      this.oy = 50;
      this.cursor = { x: 0, y: 0 };
      this.mines = new Set();
      this.revealed = new Set();
      this.flags = new Set();
      this.beacons = [];
      const safe = new Set();
      for (let y = 0; y <= 1; y += 1) for (let x = 0; x <= 1; x += 1) safe.add(`${x},${y}`);
      while (this.mines.size < 18) {
        const key = `${this.rng.int(0, this.cols - 1)},${this.rng.int(0, this.rows - 1)}`;
        if (!safe.has(key)) this.mines.add(key);
      }
      while (this.beacons.length < 5) {
        const p = { x: this.rng.int(0, this.cols - 1), y: this.rng.int(0, this.rows - 1) };
        if (!this.mines.has(`${p.x},${p.y}`) && !this.beacons.some((b) => b.x === p.x && b.y === p.y)) this.beacons.push(p);
      }
    }

    count(x, y) {
      let n = 0;
      for (let yy = -1; yy <= 1; yy += 1) for (let xx = -1; xx <= 1; xx += 1) if (this.mines.has(`${x + xx},${y + yy}`)) n += 1;
      return n;
    }

    flood(x, y) {
      const key = `${x},${y}`;
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows || this.revealed.has(key) || this.flags.has(key)) return;
      this.revealed.add(key);
      if (this.count(x, y) === 0) for (let yy = -1; yy <= 1; yy += 1) for (let xx = -1; xx <= 1; xx += 1) if (xx || yy) this.flood(x + xx, y + yy);
    }

    update(dt, input) {
      this.tick(dt);
      const dir = input.dirPressed();
      if (dir) {
        this.cursor.x = clamp(this.cursor.x + dir.x, 0, this.cols - 1);
        this.cursor.y = clamp(this.cursor.y + dir.y, 0, this.rows - 1);
      }
      const key = `${this.cursor.x},${this.cursor.y}`;
      if (input.consume("alt")) {
        if (this.flags.has(key)) this.flags.delete(key);
        else this.flags.add(key);
      }
      if (input.consume("action") && !this.flags.has(key)) {
        if (this.mines.has(key)) {
          this.revealed.add(key);
          this.finish(false, "La senal activo una mina dormida.");
          return;
        }
        this.flood(this.cursor.x, this.cursor.y);
        this.score += 20;
      }
      const found = this.beacons.filter((b) => this.revealed.has(`${b.x},${b.y}`)).length;
      if (found === this.beacons.length) this.finish(true, "Balizas trianguladas.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#101318", "#242b34");
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const key = `${x},${y}`;
          const px = this.ox + x * this.size;
          const py = this.oy + y * this.size;
          ctx.fillStyle = this.revealed.has(key) ? "#2e3941" : "#151a20";
          ctx.fillRect(px, py, this.size - 2, this.size - 2);
          if (this.flags.has(key)) drawDiamond(ctx, px + 22, py + 22, 10, "#f4b860");
          if (this.revealed.has(key)) {
            if (this.mines.has(key)) drawDiamond(ctx, px + 22, py + 22, 12, "#ff5d73");
            else {
              const n = this.count(x, y);
              if (n) drawText(ctx, String(n), px + 22, py + 23, 18, "#cbd3df", "center");
            }
          }
          if (this.beacons.some((b) => b.x === x && b.y === y) && this.revealed.has(key)) drawDiamond(ctx, px + 22, py + 22, 13, "#55d6be");
        }
      }
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.ox + this.cursor.x * this.size + 4, this.oy + this.cursor.y * this.size + 4, this.size - 10, this.size - 10);
      drawText(ctx, `Balizas ${this.beacons.filter((b) => this.revealed.has(`${b.x},${b.y}`)).length}/${this.beacons.length}`, 386, 512, 17, "#cbd3df");
    }
  }

  class CloudPlatformerGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.player = { x: 60, y: 330, vx: 0, vy: 0, w: 24, h: 34, grounded: false };
      this.cam = 0;
      this.platforms = [];
      this.crystals = [];
      this.goalX = 2500;
      this.health = 3;
      this.makeLevel();
    }

    makeLevel() {
      let x = 0;
      let y = 430;
      while (x < this.goalX + 300) {
        const w = this.rng.int(100, 190);
        this.platforms.push({ x, y, w, h: 18 });
        if (this.rng.chance(0.7)) this.crystals.push({ x: x + this.rng.int(30, w - 20), y: y - 28, taken: false });
        x += this.rng.int(150, 250);
        y = clamp(y + this.rng.int(-80, 70), 180, 450);
      }
    }

    update(dt, input) {
      this.tick(dt);
      const axis = input.axis();
      this.player.vx = axis.x * 220;
      if ((input.consume("action") || input.down.up) && this.player.grounded) {
        this.player.vy = -510;
        this.player.grounded = false;
      }
      this.player.vy += 1040 * dt;
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;
      this.player.grounded = false;
      const pr = { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h };
      for (const p of this.platforms) {
        const wasAbove = this.player.y + this.player.h - this.player.vy * dt <= p.y;
        if (wasAbove && rectsHit(pr, p)) {
          this.player.y = p.y - this.player.h;
          this.player.vy = 0;
          this.player.grounded = true;
        }
      }
      if (this.player.y > H + 80) {
        this.health -= 1;
        this.player.x = Math.max(50, this.player.x - 220);
        this.player.y = 120;
        this.player.vy = 0;
        if (this.health <= 0) this.finish(false, "El archipielago quedo fuera de alcance.");
      }
      for (const c of this.crystals) {
        if (!c.taken && rectsHit({ x: c.x - 10, y: c.y - 10, w: 20, h: 20 }, pr)) {
          c.taken = true;
          this.score += 100;
        }
      }
      this.cam = clamp(this.player.x - 260, 0, this.goalX);
      if (this.player.x >= this.goalX) this.finish(true, "Faro de nubes encendido.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#9dd7ee", "#d9f2ff");
      ctx.save();
      ctx.translate(-this.cam, 0);
      ctx.fillStyle = "#ffffff";
      for (const p of this.platforms) {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#b8e1ef";
        ctx.fillRect(p.x, p.y + p.h, p.w, 6);
        ctx.fillStyle = "#ffffff";
      }
      for (const c of this.crystals) if (!c.taken) drawDiamond(ctx, c.x, c.y, 12, "#7aa7ff");
      ctx.fillStyle = "#55d6be";
      ctx.fillRect(this.goalX, 130, 22, 320);
      ctx.fillStyle = "#111318";
      ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
      ctx.restore();
      drawBar(ctx, 44, 512, 660, 10, this.player.x / this.goalX, "#55d6be");
      drawBar(ctx, 44, 528, 120, 7, this.health / 3, "#89e07f");
    }
  }

  class StarCartographerGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.stars = [];
      this.path = [];
      this.cursor = 0;
      this.fuel = 100;
      this.maxFuel = 100;
      for (let i = 0; i < 13; i += 1) this.stars.push({ x: this.rng.int(80, 880), y: this.rng.int(60, 480), visited: false });
      this.stars[0].visited = true;
      this.path.push(0);
      this.maxFuel = this.routeBudgetEstimate();
      this.fuel = this.maxFuel;
    }

    current() {
      return this.path[this.path.length - 1];
    }

    segmentCrossesPath(a, b, path) {
      for (let i = 0; i < path.length - 2; i += 1) {
        const c = this.stars[path[i]];
        const d = this.stars[path[i + 1]];
        if (segmentsIntersect(a, b, c, d)) return true;
      }
      return false;
    }

    routeBudgetEstimate() {
      const visited = new Set([0]);
      const path = [0];
      let budget = 0;
      while (visited.size < this.stars.length) {
        const current = this.stars[path[path.length - 1]];
        let best = null;
        for (let i = 0; i < this.stars.length; i += 1) {
          if (visited.has(i)) continue;
          const candidate = this.stars[i];
          const cost = dist(current.x, current.y, candidate.x, candidate.y) / 34 + (this.segmentCrossesPath(current, candidate, path) ? 18 : 0);
          if (!best || cost < best.cost) best = { index: i, cost };
        }
        budget += best.cost;
        visited.add(best.index);
        path.push(best.index);
      }
      return Math.ceil(Math.max(100, budget * 1.35 + 20));
    }

    update(dt, input) {
      this.tick(dt);
      const unvisited = this.stars.map((s, i) => ({ s, i })).filter((o) => !o.s.visited);
      if (!unvisited.length) {
        this.finish(true, "Constelacion cerrada sin cruces.");
        return;
      }
      if (input.consume("left") || input.consume("up")) this.cursor = (this.cursor + unvisited.length - 1) % unvisited.length;
      if (input.consume("right") || input.consume("down")) this.cursor = (this.cursor + 1) % unvisited.length;
      if (input.consume("action")) {
        const next = unvisited[this.cursor % unvisited.length].i;
        const a = this.stars[this.current()];
        const b = this.stars[next];
        const cost = dist(a.x, a.y, b.x, b.y) / 34;
        this.fuel -= cost;
        if (this.crosses(a, b)) this.fuel -= 18;
        if (this.fuel <= 0) {
          this.finish(false, "El mapa estelar agoto la reserva.");
          return;
        }
        this.path.push(next);
        this.stars[next].visited = true;
        this.score += Math.floor(180 - cost * 2);
        this.cursor = 0;
      }
    }

    crosses(a, b) {
      for (let i = 0; i < this.path.length - 2; i += 1) {
        const c = this.stars[this.path[i]];
        const d = this.stars[this.path[i + 1]];
        if (segmentsIntersect(a, b, c, d)) return true;
      }
      return false;
    }

    render(ctx) {
      drawStarfield(ctx, this.visualRng, "#f4b860", 100);
      ctx.strokeStyle = "#55d6be";
      ctx.lineWidth = 3;
      for (let i = 0; i < this.path.length - 1; i += 1) {
        const a = this.stars[this.path[i]];
        const b = this.stars[this.path[i + 1]];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const unvisited = this.stars.map((s, i) => ({ s, i })).filter((o) => !o.s.visited);
      if (unvisited.length) {
        const next = unvisited[this.cursor % unvisited.length].s;
        const cur = this.stars[this.current()];
        ctx.strokeStyle = "rgba(244,184,96,0.8)";
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(cur.x, cur.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      this.stars.forEach((s, i) => {
        ctx.fillStyle = s.visited ? "#55d6be" : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, i === this.current() ? 9 : 6, 0, TAU);
        ctx.fill();
      });
      drawBar(ctx, 44, 514, 180, 10, this.fuel / this.maxFuel, "#f4b860");
      drawText(ctx, `Estrellas ${this.path.length}/${this.stars.length}`, 244, 520, 16, "#cbd3df");
    }
  }

  function orient(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function segmentsIntersect(a, b, c, d) {
    return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
  }

  class CrystalPinballGame extends BaseGame {
    constructor(app, def, seed) {
      super(app, def, seed);
      this.ball = { x: 480, y: 120, vx: 120, vy: 0, r: 10 };
      this.pegs = [];
      this.crystals = [];
      this.lives = 3;
      this.goal = 2600;
      for (let i = 0; i < 24; i += 1) this.pegs.push({ x: this.rng.int(90, 870), y: this.rng.int(80, 380), r: this.rng.int(10, 18) });
      for (let i = 0; i < 12; i += 1) this.crystals.push({ x: this.rng.int(100, 860), y: this.rng.int(80, 360), taken: false });
    }

    resetBall() {
      this.ball.x = 480;
      this.ball.y = 120;
      this.ball.vx = this.rng.float(-130, 130);
      this.ball.vy = 0;
    }

    bounceCircle(c, power = 1) {
      const d = dist(this.ball.x, this.ball.y, c.x, c.y);
      if (d < this.ball.r + c.r) {
        const a = Math.atan2(this.ball.y - c.y, this.ball.x - c.x);
        const speed = Math.max(180, Math.hypot(this.ball.vx, this.ball.vy) * power);
        this.ball.vx = Math.cos(a) * speed;
        this.ball.vy = Math.sin(a) * speed;
        this.ball.x = c.x + Math.cos(a) * (this.ball.r + c.r + 1);
        this.ball.y = c.y + Math.sin(a) * (this.ball.r + c.r + 1);
        return true;
      }
      return false;
    }

    update(dt, input) {
      this.tick(dt);
      this.ball.vy += 430 * dt;
      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;
      if (this.ball.x < 40 || this.ball.x > W - 40) {
        this.ball.vx *= -0.9;
        this.ball.x = clamp(this.ball.x, 40, W - 40);
      }
      if (this.ball.y < 40) {
        this.ball.vy *= -0.9;
        this.ball.y = 40;
      }
      for (const p of this.pegs) if (this.bounceCircle(p, 1.05)) this.score += 12;
      const leftFlip = { x: 365, y: 450, w: 130, h: 16 };
      const rightFlip = { x: 465, y: 450, w: 130, h: 16 };
      if ((input.down.left || input.down.alt) && rectsHit({ x: this.ball.x - 10, y: this.ball.y - 10, w: 20, h: 20 }, leftFlip)) {
        this.ball.vx = -240;
        this.ball.vy = -430;
      }
      if ((input.down.right || input.down.action) && rectsHit({ x: this.ball.x - 10, y: this.ball.y - 10, w: 20, h: 20 }, rightFlip)) {
        this.ball.vx = 240;
        this.ball.vy = -430;
      }
      for (const c of this.crystals) {
        if (!c.taken && this.bounceCircle({ x: c.x, y: c.y, r: 12 }, 1.1)) {
          c.taken = true;
          this.score += 180;
        }
      }
      if (this.ball.y > H + 30) {
        this.lives -= 1;
        if (this.lives <= 0) this.finish(false, "La mesa perdio todas las bolas.");
        else this.resetBall();
      }
      if (this.score >= this.goal || this.crystals.every((c) => c.taken)) this.finish(true, "Cristales cargados en la mesa.");
    }

    render(ctx) {
      this.drawBackdrop(ctx, "#14151d", "#25243b");
      ctx.strokeStyle = "#3b4050";
      ctx.lineWidth = 8;
      ctx.strokeRect(38, 36, W - 76, H - 52);
      for (const p of this.pegs) {
        ctx.fillStyle = "#7aa7ff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      for (const c of this.crystals) if (!c.taken) drawDiamond(ctx, c.x, c.y, 12, "#f4b860");
      ctx.fillStyle = inputDownColor(this.app.input, "left", "#55d6be");
      ctx.fillRect(365, 450, 130, 16);
      ctx.fillStyle = inputDownColor(this.app.input, "right", "#55d6be");
      ctx.fillRect(465, 450, 130, 16);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, TAU);
      ctx.fill();
      drawBar(ctx, 44, 514, 220, 10, this.score / this.goal, "#f4b860");
      drawText(ctx, `Bolas ${this.lives}`, 286, 520, 16, "#cbd3df");
    }
  }

  function inputDownColor(input, id, color) {
    return input.down[id] ? "#f4b860" : color;
  }

  const GAMES = [
    { id: "dungeon-relic", title: "Cripta de Relicarios", genre: "Roguelite tactico", category: "Estrategia", difficulty: "Alta", duration: "Media", objective: "Recupera todos los relicarios y sal por la camara verde.", accent: "#c58cff", factory: DungeonRelicGame },
    { id: "space-miner", title: "Fragua de Asteroides", genre: "Shooter de mineria", category: "Accion", difficulty: "Media", duration: "Media", objective: "Extrae mineral suficiente mientras esquivas drones y rocas.", accent: "#7aa7ff", factory: SpaceMinerGame },
    { id: "coral-rescue", title: "Rescate Coralino", genre: "Exploracion sonar", category: "Exploracion", difficulty: "Media", duration: "Media", objective: "Evacua peces del arrecife sin tocar minas.", accent: "#55d6be", factory: CoralRescueGame },
    { id: "rail-weaver", title: "Rieles del Cielo", genre: "Puzzle ferroviario", category: "Puzzle", difficulty: "Media", duration: "Corta", objective: "Rota vias para sostener el convoy hasta la salida.", accent: "#f4b860", factory: RailWeaverGame },
    { id: "neon-snake", title: "Serpiente de Neon", genre: "Arcade de circuito", category: "Arcade", difficulty: "Media", duration: "Corta", objective: "Crece hasta completar el circuito evitando bloques y cola.", accent: "#55d6be", factory: NeonSnakeGame },
    { id: "meteor-runner", title: "Carrera de Meteoros", genre: "Runner de supervivencia", category: "Arcade", difficulty: "Media", duration: "Corta", objective: "Cruza el crater, recoge cristales y conserva escudos.", accent: "#ff5d73", factory: MeteorRunnerGame },
    { id: "glyph-alchemy", title: "Alquimia de Glifos", genre: "Match puzzle", category: "Puzzle", difficulty: "Inicial", duration: "Media", objective: "Transmuta cadenas de glifos hasta estabilizar el laboratorio.", accent: "#c58cff", factory: GlyphAlchemyGame },
    { id: "tower-garden", title: "Jardin Centinela", genre: "Defensa con torres", category: "Estrategia", difficulty: "Alta", duration: "Larga", objective: "Cultiva torres y aguanta todas las oleadas de esporas.", accent: "#89e07f", factory: TowerGardenGame },
    { id: "city-pulse", title: "Pulso de Ciudad", genre: "Logistica urbana", category: "Estrategia", difficulty: "Media", duration: "Media", objective: "Entrega pasajeros antes de que la red colapse.", accent: "#55d6be", factory: CityPulseGame },
    { id: "desert-caravan", title: "Caravana de Sal", genre: "Ruta estrategica", category: "Estrategia", difficulty: "Alta", duration: "Media", objective: "Administra agua y provisiones hasta la ciudad final.", accent: "#d6b47b", factory: DesertCaravanGame },
    { id: "orbit-harvest", title: "Cosecha Orbital", genre: "Fisica espacial", category: "Exploracion", difficulty: "Experta", duration: "Media", objective: "Recolecta capsulas usando gravedad y combustible limitado.", accent: "#7aa7ff", factory: OrbitHarvestGame },
    { id: "ice-courier", title: "Mensajeria Polar", genre: "Sokoban sobre hielo", category: "Puzzle", difficulty: "Alta", duration: "Media", objective: "Desliza paquetes hasta todos los muelles.", accent: "#8abbd0", factory: IceCourierGame },
    { id: "rhythm-keeper", title: "Guardian del Ritmo", genre: "Ritmo defensivo", category: "Arcade", difficulty: "Alta", duration: "Larga", objective: "Sincroniza notas para sostener el escudo.", accent: "#f4b860", factory: RhythmKeeperGame },
    { id: "volcano-forge", title: "Forja Volcanica", genre: "Precision y riesgo", category: "Arcade", difficulty: "Media", duration: "Corta", objective: "Templa piezas en la zona correcta sin fundir el molde.", accent: "#ff5d73", factory: VolcanoForgeGame },
    { id: "memory-maze", title: "Biblioteca Fantasma", genre: "Memoria y laberinto", category: "Exploracion", difficulty: "Media", duration: "Media", objective: "Encuentra runas y salida en pasillos que se apagan.", accent: "#c58cff", factory: MemoryMazeGame },
    { id: "bio-defense", title: "Nanobots Inmunes", genre: "Arena biologica", category: "Accion", difficulty: "Alta", duration: "Media", objective: "Limpia celulas mientras repeles virus.", accent: "#89e07f", factory: BioDefenseGame },
    { id: "signal-mines", title: "Minas de Senal", genre: "Deduccion de campo", category: "Puzzle", difficulty: "Alta", duration: "Media", objective: "Revela balizas evitando minas ocultas.", accent: "#f4b860", factory: SignalMinesGame },
    { id: "cloud-platformer", title: "Archipielago Nuboso", genre: "Plataformas", category: "Accion", difficulty: "Media", duration: "Media", objective: "Salta entre islas y llega al faro final.", accent: "#7aa7ff", factory: CloudPlatformerGame },
    { id: "star-cartographer", title: "Cartografo Estelar", genre: "Ruta sin cruces", category: "Puzzle", difficulty: "Media", duration: "Corta", objective: "Traza la constelacion con combustible limitado.", accent: "#55d6be", factory: StarCartographerGame },
    { id: "crystal-pinball", title: "Pinball de Cristal", genre: "Fisica arcade", category: "Arcade", difficulty: "Inicial", duration: "Corta", objective: "Carga cristales con rebotes y flippers.", accent: "#f4b860", factory: CrystalPinballGame }
  ];

  const PROFILE_KEY = "playworks.profile.v1";
  const CAMPAIGN_LEVELS = 8;

  const TUTORIAL_NOTES = {
    "dungeon-relic": { controls: ["Flechas/WASD: mover"], danger: "Los guardianes se mueven despues de cada paso. No entres a la salida sin todos los relicarios.", win: "Toma todos los relicarios amarillos y llega a la camara verde.", hint: { shape: "rect", x: 96, y: 38, w: 768, h: 480 } },
    "space-miner": { controls: ["Flechas/WASD: empuje", "A/Espacio: disparar"], danger: "Los asteroides y drones danan el casco. El disparo va hacia la direccion que mantienes.", win: "Rompe asteroides hasta reunir el mineral objetivo.", hint: { shape: "circle", x: W / 2, y: H / 2, r: 84 } },
    "coral-rescue": { controls: ["Flechas/WASD: navegar", "A/Espacio: sonar"], danger: "Las minas pueden quedar ocultas si no usas sonar. Las rocas empujan el submarino.", win: "Acercate a todos los peces amarillos para evacuarlos.", hint: { shape: "circle", x: 90, y: 270, r: 90 } },
    "rail-weaver": { controls: ["Flechas/WASD: cursor", "A/Espacio: rotar via"], danger: "El convoy avanza con reloj propio. Una via mal orientada termina la partida.", win: "Alinea cada pieza del recorrido antes de que llegue el tren.", hint: { shape: "rect", x: 168, y: 62, w: 624, h: 416 } },
    "neon-snake": { controls: ["Flechas/WASD: girar"], danger: "Bloques, cola y portales mal usados cortan el circuito.", win: "Come el nucleo amarillo hasta alcanzar la longitud objetivo.", hint: { shape: "rect", x: 60, y: 52, w: 840, h: 448 } },
    "meteor-runner": { controls: ["A/Espacio: salto", "B/Shift: escudo"], danger: "Rocas, compuertas y pozos reducen salud. El nivel acelera con el tiempo.", win: "Corre hasta el refugio y recoge cristales cuando sea seguro.", hint: { shape: "rect", x: 90, y: 240, w: 360, h: 230 } },
    "glyph-alchemy": { controls: ["Flechas/WASD: cursor", "A/Espacio: seleccionar"], danger: "Solo puedes intercambiar glifos adyacentes. Si no hay combinacion, se revierte.", win: "Haz cadenas de 3 o mas hasta llegar al puntaje de estabilidad.", hint: { shape: "rect", x: 272, y: 58, w: 416, h: 416 } },
    "tower-garden": { controls: ["Flechas/WASD: cursor", "A/Espacio: plantar/mejorar"], danger: "No puedes plantar sobre el camino. La energia se recupera lentamente.", win: "Sobrevive todas las oleadas de esporas.", hint: { shape: "rect", x: 96, y: 54, w: 768, h: 432 } },
    "city-pulse": { controls: ["Flechas/WASD: elegir calle"], danger: "El trafico penaliza tiempo. Recoge un pasajero antes de ir a su destino.", win: "Completa las entregas antes de que la red llegue a cero.", hint: { shape: "rect", x: 80, y: 50, w: 790, h: 440 } },
    "desert-caravan": { controls: ["Izq/Der/Arr/Ab: elegir ruta", "A/Espacio: viajar"], danger: "Cada tramo consume agua y provisiones. Mercados y oasis reponen recursos.", win: "Llega a la ciudad final sin agotar reservas.", hint: { shape: "circle", x: 480, y: 270, r: 210 } },
    "orbit-harvest": { controls: ["Flechas/WASD: impulso"], danger: "La gravedad atrae la nave. El combustible es limitado y los restos orbitan.", win: "Recolecta todas las capsulas sin salir del mapa.", hint: { shape: "circle", x: 480, y: 270, r: 180 } },
    "ice-courier": { controls: ["Flechas/WASD: deslizar"], danger: "Sobre hielo te deslizas hasta chocar. Empuja paquetes con espacio calculado.", win: "Deja cada paquete sobre un muelle marcado.", hint: { shape: "rect", x: 181, y: 58, w: 598, h: 414 } },
    "rhythm-keeper": { controls: ["Flechas/WASD: tocar carril"], danger: "Tocar tarde o sin nota baja el escudo. Mira la linea de impacto.", win: "Mantente sincronizado hasta que termine la secuencia.", hint: { shape: "rect", x: 240, y: 50, w: 480, h: 420 } },
    "volcano-forge": { controls: ["A/Espacio: templar", "B/Shift: refrigerar"], danger: "Si el calor llega al extremo, el molde se funde. El refrigerante es limitado.", win: "Templa piezas cuando la aguja este dentro de la zona verde.", hint: { shape: "rect", x: 210, y: 374, w: 540, h: 78 } },
    "memory-maze": { controls: ["Flechas/WASD: mover", "A/Espacio: linterna"], danger: "El mapa se apaga. Guarda linternas para zonas de duda.", win: "Encuentra todas las runas y luego la salida.", hint: { shape: "rect", x: 100, y: 50, w: 760, h: 440 } },
    "bio-defense": { controls: ["Flechas/WASD: mover", "A/Espacio: disparar"], danger: "Los virus persiguen al nanobot. Limpia celulas sin quedar rodeado.", win: "Purifica todas las celulas del tejido.", hint: { shape: "circle", x: W / 2, y: H / 2, r: 150 } },
    "signal-mines": { controls: ["Flechas/WASD: cursor", "A/Espacio: revelar", "B/Shift: marcar"], danger: "Revelar una mina termina la partida. Usa los numeros como pistas.", win: "Revela todas las balizas de senal.", hint: { shape: "rect", x: 216, y: 50, w: 528, h: 440 } },
    "cloud-platformer": { controls: ["Izq/Der: correr", "A/Espacio: saltar"], danger: "Caer cuesta salud. El salto debe prepararse antes de los huecos.", win: "Cruza las islas hasta encender el faro.", hint: { shape: "rect", x: 70, y: 170, w: 520, h: 300 } },
    "star-cartographer": { controls: ["Flechas/WASD: elegir estrella", "A/Espacio: trazar"], danger: "Los cruces y rutas largas gastan combustible.", win: "Visita todas las estrellas con una constelacion eficiente.", hint: { shape: "circle", x: 480, y: 270, r: 220 } },
    "crystal-pinball": { controls: ["Izq/B: flipper izquierdo", "Der/A: flipper derecho"], danger: "Dejar caer la bola consume vidas. Rebota sobre cristales y pegs.", win: "Carga cristales o alcanza el puntaje objetivo.", hint: { shape: "rect", x: 38, y: 36, w: 884, h: 452 } }
  };

  function readJson(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function makeGameStats() {
    return {
      plays: 0,
      wins: 0,
      losses: 0,
      bestScore: 0,
      bestTime: null,
      totalScore: 0,
      totalTime: 0,
      lastSeed: "",
      lastResult: "",
      lastPlayedAt: 0
    };
  }

  function makeCampaignLevelRecord() {
    return {
      plays: 0,
      wins: 0,
      completed: false,
      bestScore: 0,
      bestTime: null,
      lastSeed: "",
      lastPlayedAt: 0
    };
  }

  function makeCampaignGameState() {
    return {
      unlocked: 1,
      selected: 1,
      levels: {}
    };
  }

  function makeCampaignState() {
    return {
      mode: "free",
      games: {}
    };
  }

  function makeTutorialState() {
    return {
      showNew: true,
      hubSeen: false,
      seen: {}
    };
  }

  function makeProfile(slot) {
    return {
      slot,
      name: `Jugador ${slot}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      games: {},
      achievements: {},
      favorites: {},
      library: makeLibraryFilters(),
      campaign: makeCampaignState(),
      tutorials: makeTutorialState()
    };
  }

  function makeLibraryFilters() {
    return {
      search: "",
      category: "Todos",
      difficulty: "Todos",
      duration: "Todos",
      favoritesOnly: false
    };
  }

  function ensureGameStats(profile, gameId) {
    if (!profile.games[gameId]) profile.games[gameId] = makeGameStats();
    return profile.games[gameId];
  }

  function ensureCampaignGame(profile, gameId) {
    profile.campaign = { ...makeCampaignState(), ...(profile.campaign || {}) };
    profile.campaign.games = profile.campaign.games || {};
    if (!profile.campaign.games[gameId]) profile.campaign.games[gameId] = makeCampaignGameState();
    const state = profile.campaign.games[gameId];
    state.levels = state.levels || {};
    state.unlocked = clamp(state.unlocked || 1, 1, CAMPAIGN_LEVELS);
    state.selected = clamp(state.selected || 1, 1, state.unlocked);
    return state;
  }

  function ensureCampaignLevel(profile, gameId, level) {
    const gameState = ensureCampaignGame(profile, gameId);
    const key = String(level);
    gameState.levels[key] = { ...makeCampaignLevelRecord(), ...(gameState.levels[key] || {}) };
    return gameState.levels[key];
  }

  function totalPlays(profile) {
    return GAMES.reduce((sum, game) => sum + (profile.games[game.id]?.plays || 0), 0);
  }

  function totalWins(profile) {
    return GAMES.reduce((sum, game) => sum + (profile.games[game.id]?.wins || 0), 0);
  }

  function campaignClears(profile) {
    return GAMES.reduce((sum, game) => {
      const campaign = profile.campaign?.games?.[game.id];
      if (!campaign) return sum;
      return sum + Object.values(campaign.levels || {}).filter((level) => level.completed).length;
    }, 0);
  }

  function campaignClearsForGame(profile, gameId) {
    const campaign = profile.campaign?.games?.[gameId];
    if (!campaign) return 0;
    return Object.values(campaign.levels || {}).filter((level) => level.completed).length;
  }

  function tutorialSeenCount(profile) {
    return GAMES.filter((game) => profile.tutorials?.seen?.[game.id]).length;
  }

  function uniquePlayed(profile) {
    return GAMES.filter((game) => (profile.games[game.id]?.plays || 0) > 0).length;
  }

  function uniqueWon(profile) {
    return GAMES.filter((game) => (profile.games[game.id]?.wins || 0) > 0).length;
  }

  function totalScoreBank(profile) {
    return GAMES.reduce((sum, game) => sum + (profile.games[game.id]?.totalScore || 0), 0);
  }

  function hasFastWin(profile) {
    return GAMES.some((game) => {
      const bestTime = profile.games[game.id]?.bestTime;
      return typeof bestTime === "number" && bestTime <= 60;
    });
  }

  function achievementDefs() {
    return [
      { id: "first-run", title: "Primera partida", desc: "Juega cualquier modo", test: (profile) => totalPlays(profile) >= 1 },
      { id: "first-win", title: "Primera victoria", desc: "Completa un juego", test: (profile) => totalWins(profile) >= 1 },
      { id: "five-games", title: "Catador procedural", desc: "Prueba 5 juegos", test: (profile) => uniquePlayed(profile) >= 5 },
      { id: "all-games-played", title: "Biblioteca abierta", desc: "Prueba los 20 juegos", test: (profile) => uniquePlayed(profile) >= GAMES.length },
      { id: "five-wins", title: "Especialista", desc: "Gana 5 juegos distintos", test: (profile) => uniqueWon(profile) >= 5 },
      { id: "full-clear", title: "Dominio total", desc: "Gana los 20 juegos", test: (profile) => uniqueWon(profile) >= GAMES.length },
      { id: "score-bank", title: "Marcador oro", desc: "Acumula 10000 puntos", test: (profile) => totalScoreBank(profile) >= 10000 },
      { id: "fast-win", title: "Victoria relampago", desc: "Gana en menos de 1 minuto", test: (profile) => hasFastWin(profile) },
      { id: "first-campaign-clear", title: "Primer capitulo", desc: "Completa un nivel de campana", test: (profile) => campaignClears(profile) >= 1 },
      { id: "campaign-scout", title: "Ruta de campana", desc: "Completa 10 niveles de campana", test: (profile) => campaignClears(profile) >= 10 },
      { id: "campaign-master", title: "Campana total", desc: "Completa todos los niveles", test: (profile) => campaignClears(profile) >= GAMES.length * CAMPAIGN_LEVELS },
      { id: "tutorial-start", title: "Primer briefing", desc: "Completa un tutorial", test: (profile) => tutorialSeenCount(profile) >= 1 || Boolean(profile.tutorials?.hubSeen) },
      { id: "tutorial-scholar", title: "Manual de campo", desc: "Completa 10 tutoriales", test: (profile) => tutorialSeenCount(profile) >= 10 },
      { id: "tutorial-master", title: "Biblioteca aprendida", desc: "Completa los 20 tutoriales", test: (profile) => tutorialSeenCount(profile) >= GAMES.length },
      ...GAMES.map((game) => ({
        id: `win-${game.id}`,
        gameId: game.id,
        title: `Dominio: ${game.title}`,
        desc: "Victoria registrada",
        test: (profile) => (profile.games[game.id]?.wins || 0) > 0
      }))
    ];
  }

  function uniqueValues(field) {
    return [...new Set(GAMES.map((game) => game[field]))].sort((a, b) => a.localeCompare(b));
  }

  function campaignDifficulty(level) {
    return {
      level,
      scale: 1 + (level - 1) * 0.13,
      pressure: 1 + (level - 1) * 0.09,
      resource: Math.max(0.58, 1 - (level - 1) * 0.055)
    };
  }

  function addRandomGridEnemy(game, count) {
    if (!game.rooms || !game.enemies) return;
    for (let i = 0; i < count; i += 1) {
      const room = game.rng.pick(game.rooms.slice(1));
      if (!room) return;
      game.enemies.push({
        x: room.x + game.rng.int(1, Math.max(1, room.w - 2)),
        y: room.y + game.rng.int(1, Math.max(1, room.h - 2)),
        wait: 0
      });
    }
  }

  function addSignalMines(game, count) {
    if (!game.mines) return;
    let attempts = 0;
    let added = 0;
    while (added < count && attempts < 200) {
      attempts += 1;
      const x = game.rng.int(0, game.cols - 1);
      const y = game.rng.int(0, game.rows - 1);
      const key = `${x},${y}`;
      const beacon = game.beacons?.some((b) => b.x === x && b.y === y);
      if (!beacon && !game.mines.has(key)) {
        game.mines.add(key);
        added += 1;
      }
    }
  }

  function applyCampaignDifficulty(game, run) {
    if (!run.campaign) return;
    const tuning = campaignDifficulty(run.level);
    game.campaignTuning = tuning;
    game.difficultyScale = tuning.scale;
    switch (game.def.id) {
      case "dungeon-relic":
        game.health = Math.max(2, game.health - Math.floor((run.level - 1) / 3));
        addRandomGridEnemy(game, Math.floor(run.level / 2));
        break;
      case "space-miner":
        game.target += run.level * 3;
        game.health = Math.max(2, game.health - Math.floor((run.level - 1) / 4));
        for (let i = 0; i < Math.floor(run.level / 3); i += 1) game.drones.push({ x: game.rng.int(60, W - 60), y: game.rng.int(60, H - 60), vx: game.rng.float(-34, 34), vy: game.rng.float(-34, 34) });
        break;
      case "coral-rescue":
        game.health = Math.max(2, game.health - Math.floor((run.level - 1) / 4));
        for (let i = 0; i < run.level; i += 1) game.mines.push({ x: game.rng.int(160, 900), y: game.rng.int(70, 470), r: 13, pulse: game.rng.float(0, TAU) });
        break;
      case "rail-weaver":
        game.train.timer = Math.max(0.34, game.train.timer - run.level * 0.035);
        break;
      case "neon-snake":
        game.target += run.level * 2;
        game.speed = Math.max(0.065, game.speed - run.level * 0.004);
        for (let i = 0; i < run.level; i += 1) game.blocks.push(game.freeCell());
        break;
      case "meteor-runner":
        game.target += run.level * 220;
        game.speed += run.level * 14;
        game.health = Math.max(2, game.health - Math.floor((run.level - 1) / 4));
        break;
      case "glyph-alchemy":
        game.goalScore += run.level * 420;
        break;
      case "tower-garden":
        game.maxWave += Math.floor(run.level / 2);
        game.health = Math.max(6, game.health - Math.floor(run.level / 2));
        break;
      case "city-pulse":
        game.target += Math.floor(run.level / 2);
        game.timer = Math.max(56, game.timer - run.level * 4);
        break;
      case "desert-caravan":
        game.supplies = Math.floor(game.supplies * tuning.resource);
        game.water = Math.floor(game.water * tuning.resource);
        break;
      case "orbit-harvest":
        game.fuel = Math.floor(game.fuel * tuning.resource);
        for (let i = 0; i < run.level; i += 1) game.debris.push({ x: game.rng.int(120, 880), y: game.rng.int(80, 460), vx: game.rng.float(-58, 58), vy: game.rng.float(-58, 58) });
        break;
      case "rhythm-keeper":
        game.health = Math.max(62, game.health - run.level * 4);
        break;
      case "volcano-forge":
        game.target += Math.floor(run.level / 2);
        game.coolant = Math.max(1, game.coolant - Math.floor(run.level / 3));
        break;
      case "memory-maze":
        game.lantern = Math.max(2, game.lantern - Math.floor(run.level / 2));
        game.reveal = Math.max(2.5, game.reveal - run.level * 0.25);
        break;
      case "bio-defense":
        game.health = Math.max(3, game.health - Math.floor(run.level / 3));
        game.spawn = Math.min(game.spawn, Math.max(0.25, 0.95 - run.level * 0.05));
        break;
      case "signal-mines":
        addSignalMines(game, run.level);
        break;
      case "cloud-platformer":
        game.health = Math.max(2, game.health - Math.floor((run.level - 1) / 4));
        break;
      case "star-cartographer":
        game.fuel = Math.max(58, game.fuel - run.level * 4);
        game.maxFuel = game.fuel;
        break;
      case "crystal-pinball":
        game.goal += run.level * 320;
        game.lives = Math.max(2, game.lives - Math.floor((run.level - 1) / 4));
        break;
      default:
        break;
    }
  }

  function hubTutorialSteps() {
    return [
      {
        title: "Biblioteca procedural",
        text: "El panel izquierdo agrupa los 20 juegos. Usa busqueda, genero, dificultad, duracion y favoritos para encontrar el modo que quieres jugar.",
        controls: ["Buscar", "Filtros", "Favoritos"]
      },
      {
        title: "Perfil y progreso",
        text: "Cada perfil guarda mejores marcas, logros, favoritos, tutoriales vistos y progreso de campana. El boton numerado cambia entre tres perfiles locales.",
        controls: ["Perfil 01-03", "Progreso", "Logros"]
      },
      {
        title: "Libre y Campana",
        text: "Libre usa la semilla que escribas. Campana crea 8 niveles por juego con semillas derivadas, dificultad progresiva y desbloqueo por victoria.",
        controls: ["Libre", "Campana", "Niveles"]
      },
      {
        title: "Controles base",
        text: "En teclado usa flechas o WASD. En movil usa la cruceta y los botones A/B. Cada juego te mostrara sus acciones particulares.",
        controls: ["Flechas/WASD", "A", "B"]
      }
    ];
  }

  function gameTutorialSteps(game) {
    const note = TUTORIAL_NOTES[game.id] || {
      controls: ["Flechas/WASD", "A/Espacio"],
      danger: "Observa el objetivo y evita los elementos hostiles.",
      win: game.objective,
      hint: { shape: "circle", x: W / 2, y: H / 2, r: 170 }
    };
    return [
      {
        title: game.title,
        text: game.objective,
        controls: [game.genre, game.category],
        hint: note.hint
      },
      {
        title: "Controles",
        text: "Estos son los comandos principales para este modo.",
        controls: note.controls,
        hint: note.hint
      },
      {
        title: "Riesgo principal",
        text: note.danger,
        controls: [game.difficulty, game.duration],
        hint: note.hint
      },
      {
        title: "Condicion de victoria",
        text: note.win,
        controls: ["Puntos", "Tiempo", "Mejor marca"],
        hint: note.hint
      },
      {
        title: "Consejo de campana",
        text: "En campana cada nivel sube la presion: puede haber mas objetivos, menos recursos, mas velocidad o mas amenazas. Si un nivel se complica, cambia la semilla libre para practicar el sistema.",
        controls: ["Campana", "Semilla", "Reintentar"],
        hint: note.hint
      }
    ];
  }

  class App {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.appShell = document.querySelector ? document.querySelector(".app-shell") : null;
      this.canvasWrap = document.querySelector ? document.querySelector(".canvas-wrap") : null;
      this.ctx = this.canvas.getContext("2d");
      this.input = new Input();
      this.gameList = document.getElementById("gameList");
      this.seedInput = document.getElementById("seedInput");
      this.gameSearchInput = document.getElementById("gameSearchInput");
      this.genreFilter = document.getElementById("genreFilter");
      this.difficultyFilter = document.getElementById("difficultyFilter");
      this.durationFilter = document.getElementById("durationFilter");
      this.favoritesOnlyToggle = document.getElementById("favoritesOnlyToggle");
      this.libraryCount = document.getElementById("libraryCount");
      this.profileNameInput = document.getElementById("profileNameInput");
      this.profileSlotBtn = document.getElementById("profileSlotBtn");
      this.profileProgressValue = document.getElementById("profileProgressValue");
      this.profileAchievementValue = document.getElementById("profileAchievementValue");
      this.profileProgressBar = document.getElementById("profileProgressBar");
      this.scoreValue = document.getElementById("scoreValue");
      this.bestValue = document.getElementById("bestValue");
      this.timeValue = document.getElementById("timeValue");
      this.titleEl = document.getElementById("gameTitle");
      this.genreEl = document.getElementById("gameGenre");
      this.objectiveEl = document.getElementById("objectiveText");
      this.gameRecordText = document.getElementById("gameRecordText");
      this.achievementList = document.getElementById("achievementList");
      this.overlay = document.getElementById("overlay");
      this.overlayTitle = document.getElementById("overlayTitle");
      this.overlayText = document.getElementById("overlayText");
      this.overlayKicker = document.getElementById("overlayKicker");
      this.overlayActions = document.getElementById("overlayActions");
      this.tutorialPanel = document.getElementById("tutorialPanel");
      this.tutorialKicker = document.getElementById("tutorialKicker");
      this.tutorialTitle = document.getElementById("tutorialTitle");
      this.tutorialText = document.getElementById("tutorialText");
      this.tutorialControls = document.getElementById("tutorialControls");
      this.tutorialProgressBar = document.getElementById("tutorialProgressBar");
      this.tutorialBackBtn = document.getElementById("tutorialBackBtn");
      this.tutorialSkipBtn = document.getElementById("tutorialSkipBtn");
      this.tutorialNextBtn = document.getElementById("tutorialNextBtn");
      this.tutorialAutoToggle = document.getElementById("tutorialAutoToggle");
      this.favoriteBtn = document.getElementById("favoriteBtn");
      this.tutorialBtn = document.getElementById("tutorialBtn");
      this.muteBtn = document.getElementById("muteBtn");
      this.volumeSlider = document.getElementById("volumeSlider");
      this.freeModeBtn = document.getElementById("freeModeBtn");
      this.campaignModeBtn = document.getElementById("campaignModeBtn");
      this.campaignSummary = document.getElementById("campaignSummary");
      this.campaignLevelList = document.getElementById("campaignLevelList");
      this.toastStack = document.getElementById("toastStack");
      this.restartBtn = document.getElementById("restartBtn");
      this.pauseBtn = document.getElementById("pauseBtn");
      this.playBtn = document.getElementById("playBtn");
      this.currentDef = GAMES[0];
      this.currentGame = null;
      this.currentRun = { campaign: false, level: 0, seed: "" };
      this.tutorial = { active: false, id: "", gameId: "", hub: false, steps: [], index: 0, manual: false };
      this.paused = false;
      this.playing = false;
      this.last = performance.now();
      this.audio = new AudioEngine();
      this.feedback = new FeedbackSystem();
      this.scoreFeedbackCarry = 0;
      this.achievementDefs = achievementDefs();
      this.profileStore = this.loadProfileStore();
      this.seedInput.value = localStorage.getItem("playworks.seed") || this.randomSeed();
      this.syncAudioUI();
      this.bind();
      this.populateLibraryFilters();
      this.syncLibraryFilterInputs();
      this.buildList();
      this.selectGame(this.filteredGames()[0] || GAMES[0], { countRun: false });
      requestAnimationFrame((t) => this.loop(t));
      if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
    }

    get profile() {
      return this.profileStore.profiles[this.profileStore.activeSlot];
    }

    loadProfileStore() {
      const store = readJson(localStorage.getItem(PROFILE_KEY), null) || { activeSlot: "1", profiles: {} };
      store.activeSlot = String(store.activeSlot || "1");
      store.profiles = store.profiles || {};
      for (let slot = 1; slot <= 3; slot += 1) {
        const key = String(slot);
        store.profiles[key] = { ...makeProfile(key), ...(store.profiles[key] || {}) };
        store.profiles[key].games = store.profiles[key].games || {};
        store.profiles[key].achievements = store.profiles[key].achievements || {};
        store.profiles[key].favorites = store.profiles[key].favorites || {};
        store.profiles[key].library = { ...makeLibraryFilters(), ...(store.profiles[key].library || {}) };
        store.profiles[key].campaign = { ...makeCampaignState(), ...(store.profiles[key].campaign || {}) };
        store.profiles[key].campaign.games = store.profiles[key].campaign.games || {};
        store.profiles[key].tutorials = { ...makeTutorialState(), ...(store.profiles[key].tutorials || {}) };
        store.profiles[key].tutorials.seen = store.profiles[key].tutorials.seen || {};
      }
      if (!store.profiles[store.activeSlot]) store.activeSlot = "1";
      if (!store.migratedLegacyBest) {
        const legacyBest = readJson(localStorage.getItem("playworks.best"), {});
        for (const [gameId, score] of Object.entries(legacyBest)) {
          if (!GAMES.some((game) => game.id === gameId)) continue;
          const stats = ensureGameStats(store.profiles[store.activeSlot], gameId);
          stats.bestScore = Math.max(stats.bestScore || 0, Number(score) || 0);
        }
        store.migratedLegacyBest = true;
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(store));
      return store;
    }

    saveProfileStore() {
      this.profile.updatedAt = Date.now();
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profileStore));
    }

    randomSeed() {
      return `seed-${Math.floor(Math.random() * 999999).toString(36)}`;
    }

    syncAudioUI() {
      this.muteBtn.classList.toggle("active", !this.audio.settings.muted);
      this.muteBtn.textContent = this.audio.settings.muted ? "M" : "S";
      this.volumeSlider.value = String(Math.round(this.audio.settings.volume * 100));
    }

    emit(name, data = {}) {
      const soundMap = {
        select: "select",
        collect: "collect",
        damage: "damage",
        win: "win",
        loss: "loss",
        unlock: "unlock",
        achievement: "achievement"
      };
      this.feedback.event(name, data);
      this.audio.play(soundMap[name] || "select");
    }

    notify(title, text = "") {
      if (!this.toastStack) return;
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
      this.toastStack.appendChild(toast);
      const timer = window.setTimeout || setTimeout;
      timer(() => {
        if (toast.remove) toast.remove();
      }, 3600);
    }

    maybeStartHubTutorial() {
      const tutorials = this.profile.tutorials;
      if (tutorials.showNew && !tutorials.hubSeen) this.startHubTutorial(false);
    }

    maybeStartGameTutorial() {
      const tutorials = this.profile.tutorials;
      if (!this.tutorial.active && tutorials.showNew && !tutorials.seen[this.currentDef.id]) this.startGameTutorial(false);
    }

    startHubTutorial(manual = true) {
      this.startTutorial({
        id: "hub",
        hub: true,
        manual,
        kicker: "Primer arranque",
        steps: hubTutorialSteps()
      });
    }

    startGameTutorial(manual = true) {
      this.startTutorial({
        id: this.currentDef.id,
        gameId: this.currentDef.id,
        hub: false,
        manual,
        kicker: this.currentDef.title,
        steps: gameTutorialSteps(this.currentDef)
      });
    }

    startTutorial(config) {
      this.emit("select", { color: this.currentDef.accent });
      this.tutorial = {
        active: true,
        id: config.id,
        gameId: config.gameId || "",
        hub: Boolean(config.hub),
        manual: Boolean(config.manual),
        kicker: config.kicker || "Tutorial",
        accent: config.accent || this.currentDef.accent,
        steps: config.steps,
        index: 0
      };
      this.tutorialAutoToggle.checked = this.profile.tutorials.showNew;
      this.updateTutorialUI();
      this.tutorialPanel.classList.remove("hidden");
    }

    updateTutorialUI() {
      if (!this.tutorial.active) return;
      const step = this.tutorial.steps[this.tutorial.index];
      const total = this.tutorial.steps.length;
      this.tutorialKicker.textContent = `${this.tutorial.kicker} | Paso ${this.tutorial.index + 1}/${total}`;
      this.tutorialTitle.textContent = step.title;
      this.tutorialText.textContent = step.text;
      this.tutorialControls.innerHTML = (step.controls || []).map((control) => `<span>${control}</span>`).join("");
      this.tutorialProgressBar.style.width = `${Math.round(((this.tutorial.index + 1) / total) * 100)}%`;
      this.tutorialBackBtn.disabled = this.tutorial.index === 0;
      this.tutorialNextBtn.textContent = this.tutorial.index === total - 1 ? "Finalizar" : "Siguiente";
    }

    prevTutorialStep() {
      if (!this.tutorial.active) return;
      this.tutorial.index = Math.max(0, this.tutorial.index - 1);
      this.emit("select", { color: this.tutorial.accent || this.currentDef.accent });
      this.updateTutorialUI();
    }

    nextTutorialStep() {
      if (!this.tutorial.active) return;
      if (this.tutorial.index >= this.tutorial.steps.length - 1) {
        this.endTutorial(false);
        return;
      }
      this.tutorial.index += 1;
      this.emit("select", { color: this.tutorial.accent || this.currentDef.accent });
      this.updateTutorialUI();
    }

    endTutorial(skipped) {
      if (!this.tutorial.active) return;
      const finished = this.tutorial;
      this.tutorial.active = false;
      this.tutorialPanel.classList.add("hidden");
      this.markTutorialSeen(finished, skipped);
    }

    cancelTutorial() {
      if (!this.tutorial.active) return;
      this.tutorial.active = false;
      this.tutorialPanel.classList.add("hidden");
    }

    markTutorialSeen(tutorial, skipped) {
      if (tutorial.hub) this.profile.tutorials.hubSeen = true;
      else if (tutorial.gameId) this.profile.tutorials.seen[tutorial.gameId] = true;
      const unlocked = this.evaluateAchievements();
      this.saveProfileStore();
      this.updateProfileUI();
      if (!skipped) this.emit("achievement");
      if (!skipped) this.notify("Tutorial completado", tutorial.hub ? "Hub principal" : tutorial.kicker || this.currentDef.title);
      for (const achievement of unlocked.slice(0, 2)) this.notify("Logro desbloqueado", achievement.title);
    }

    renderTutorialGuide() {
      if (!this.tutorial.active) return;
      const step = this.tutorial.steps[this.tutorial.index];
      const hint = step?.hint;
      if (!hint) return;
      const ctx = this.ctx;
      const accent = this.tutorial.accent || this.currentDef.accent;
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = accent;
      ctx.fillStyle = colorWithAlpha(accent, 0.11);
      ctx.setLineDash([10, 8]);
      if (hint.shape === "rect") {
        ctx.fillRect(hint.x, hint.y, hint.w, hint.h);
        ctx.strokeRect(hint.x, hint.y, hint.w, hint.h);
      } else {
        ctx.beginPath();
        ctx.arc(hint.x, hint.y, hint.r || 80, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      ctx.setLineDash([]);
      const tx = hint.shape === "rect" ? hint.x + hint.w / 2 : hint.x;
      const ty = hint.shape === "rect" ? hint.y - 18 : hint.y - (hint.r || 80) - 18;
      drawText(ctx, "Zona clave", clamp(tx, 80, W - 80), clamp(ty, 28, H - 28), 15, "#ffffff", "center", 900);
      ctx.restore();
    }

    bind() {
      const unlockAudio = () => this.audio.unlock();
      window.addEventListener("pointerdown", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });
      document.getElementById("randomSeedBtn").addEventListener("click", () => {
        this.emit("select");
        this.seedInput.value = this.randomSeed();
        localStorage.setItem("playworks.seed", this.seedInput.value);
        this.restart({ countRun: this.playing, skipTutorial: !this.playing });
      });
      this.seedInput.addEventListener("change", () => {
        localStorage.setItem("playworks.seed", this.seedInput.value || "seed");
        this.restart({ countRun: this.playing, skipTutorial: !this.playing });
      });
      this.restartBtn.addEventListener("click", () => {
        this.emit("select", { color: this.currentDef.accent });
        this.restart({ countRun: this.playing, skipTutorial: !this.playing });
      });
      this.pauseBtn.addEventListener("click", () => this.togglePause());
      this.playBtn.addEventListener("click", () => this.startPlay());
      this.favoriteBtn.addEventListener("click", () => this.toggleFavorite(this.currentDef.id));
      this.tutorialBtn.addEventListener("click", () => this.startGameTutorial(true));
      this.tutorialBackBtn.addEventListener("click", () => this.prevTutorialStep());
      this.tutorialNextBtn.addEventListener("click", () => this.nextTutorialStep());
      this.tutorialSkipBtn.addEventListener("click", () => this.endTutorial(true));
      this.tutorialAutoToggle.addEventListener("change", () => {
        this.profile.tutorials.showNew = this.tutorialAutoToggle.checked;
        this.saveProfileStore();
      });
      window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && this.playing) {
          event.preventDefault();
          this.returnToSetup();
          return;
        }
        if (event.key.toLowerCase() !== "r" || event.repeat) return;
        if (!this.playing) return;
        event.preventDefault();
        this.emit("select", { color: this.currentDef.accent });
        this.restart({ countRun: true, skipTutorial: true });
        this.input.down.restart = true;
      });
      this.muteBtn.addEventListener("click", () => {
        this.audio.unlock();
        this.audio.setMuted(!this.audio.settings.muted);
        this.syncAudioUI();
        this.notify(this.audio.settings.muted ? "Audio silenciado" : "Audio activo", "Preferencia guardada");
      });
      this.volumeSlider.addEventListener("input", () => {
        this.audio.unlock();
        this.audio.setVolume(Number(this.volumeSlider.value) / 100);
        if (this.audio.settings.muted && Number(this.volumeSlider.value) > 0) this.audio.setMuted(false);
        this.syncAudioUI();
      });
      this.freeModeBtn.addEventListener("click", () => this.setPlayMode("free"));
      this.campaignModeBtn.addEventListener("click", () => this.setPlayMode("campaign"));
      this.profileSlotBtn.addEventListener("click", () => {
        this.cancelTutorial();
        const next = Number(this.profileStore.activeSlot) % 3 + 1;
        this.profileStore.activeSlot = String(next);
        this.saveProfileStore();
        this.syncLibraryFilterInputs();
        this.applyLibraryFilters();
        this.restart({ countRun: false });
        this.showOverlay("Perfil activo", this.profile.name, this.currentDef.title);
      });
      this.profileNameInput.addEventListener("input", () => {
        const fallback = `Jugador ${this.profileStore.activeSlot}`;
        this.profile.name = this.profileNameInput.value.trim().slice(0, 18) || fallback;
        this.saveProfileStore();
        this.updateProfileUI();
      });
      this.gameSearchInput.addEventListener("input", () => this.updateLibraryFiltersFromInputs());
      this.genreFilter.addEventListener("change", () => this.updateLibraryFiltersFromInputs());
      this.difficultyFilter.addEventListener("change", () => this.updateLibraryFiltersFromInputs());
      this.durationFilter.addEventListener("change", () => this.updateLibraryFiltersFromInputs());
      this.favoritesOnlyToggle.addEventListener("change", () => this.updateLibraryFiltersFromInputs());
      document.querySelectorAll("[data-control]").forEach((btn) => {
        const id = btn.getAttribute("data-control");
        const on = (event) => {
          event.preventDefault();
          btn.setPointerCapture?.(event.pointerId);
          this.input.set(id, true);
        };
        const off = (event) => {
          event.preventDefault();
          this.input.set(id, false);
        };
        btn.addEventListener("pointerdown", on);
        btn.addEventListener("pointerup", off);
        btn.addEventListener("pointercancel", off);
        btn.addEventListener("pointerleave", off);
      });
    }

    startPlay() {
      this.audio.unlock();
      this.cancelTutorial();
      this.playing = true;
      this.paused = false;
      document.body?.classList.add("is-playing");
      this.restart({ countRun: true, skipTutorial: true });
      const target = this.appShell || document.documentElement;
      if (target.requestFullscreen && !document.fullscreenElement) {
        target.requestFullscreen().catch(() => {});
      }
    }

    returnToSetup() {
      if (!this.playing) return;
      this.playing = false;
      this.paused = false;
      this.cancelTutorial();
      document.body?.classList.remove("is-playing");
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      this.restart({ countRun: false, skipTutorial: true });
      this.input.reset();
    }

    populateLibraryFilters() {
      const fill = (select, values) => {
        select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
      };
      fill(this.genreFilter, ["Todos", ...uniqueValues("category")]);
      fill(this.difficultyFilter, ["Todos", "Inicial", "Media", "Alta", "Experta"]);
      fill(this.durationFilter, ["Todos", "Corta", "Media", "Larga"]);
    }

    syncLibraryFilterInputs() {
      const library = this.profile.library || makeLibraryFilters();
      this.gameSearchInput.value = library.search || "";
      this.genreFilter.value = library.category || "Todos";
      this.difficultyFilter.value = library.difficulty || "Todos";
      this.durationFilter.value = library.duration || "Todos";
      this.favoritesOnlyToggle.checked = Boolean(library.favoritesOnly);
    }

    updateLibraryFiltersFromInputs() {
      this.profile.library = {
        search: this.gameSearchInput.value.trim(),
        category: this.genreFilter.value,
        difficulty: this.difficultyFilter.value,
        duration: this.durationFilter.value,
        favoritesOnly: this.favoritesOnlyToggle.checked
      };
      this.saveProfileStore();
      this.applyLibraryFilters();
    }

    filteredGames() {
      const library = this.profile.library || makeLibraryFilters();
      const query = (library.search || "").toLowerCase();
      return GAMES.filter((game) => {
        if (library.category !== "Todos" && game.category !== library.category) return false;
        if (library.difficulty !== "Todos" && game.difficulty !== library.difficulty) return false;
        if (library.duration !== "Todos" && game.duration !== library.duration) return false;
        if (library.favoritesOnly && !this.profile.favorites[game.id]) return false;
        if (!query) return true;
        return [game.title, game.genre, game.category, game.difficulty, game.duration].some((text) => text.toLowerCase().includes(query));
      });
    }

    applyLibraryFilters() {
      const visible = this.buildList();
      if (visible.length && !visible.includes(this.currentDef)) {
        this.selectGame(visible[0], { countRun: false });
        return;
      }
      for (const game of GAMES) if (game.button) game.button.classList.toggle("active", game === this.currentDef);
      this.updateProfileUI();
    }

    toggleFavorite(gameId) {
      this.profile.favorites[gameId] = !this.profile.favorites[gameId];
      if (!this.profile.favorites[gameId]) delete this.profile.favorites[gameId];
      this.saveProfileStore();
      this.emit("select", { color: this.currentDef.accent });
      this.applyLibraryFilters();
    }

    isCampaignMode() {
      return this.profile.campaign?.mode === "campaign";
    }

    campaignGame(gameId = this.currentDef.id) {
      return ensureCampaignGame(this.profile, gameId);
    }

    selectedCampaignLevel(gameId = this.currentDef.id) {
      const campaign = this.campaignGame(gameId);
      campaign.selected = clamp(campaign.selected || 1, 1, campaign.unlocked || 1);
      return campaign.selected;
    }

    setPlayMode(mode) {
      this.emit("select", { color: this.currentDef.accent });
      this.profile.campaign = { ...makeCampaignState(), ...(this.profile.campaign || {}) };
      this.profile.campaign.mode = mode;
      if (mode === "campaign") this.selectedCampaignLevel(this.currentDef.id);
      this.saveProfileStore();
      this.updateCampaignUI();
      this.restart({ countRun: this.playing, skipTutorial: !this.playing });
    }

    selectCampaignLevel(level) {
      const campaign = this.campaignGame(this.currentDef.id);
      if (level > campaign.unlocked) return;
      this.emit("select", { color: this.currentDef.accent });
      campaign.selected = level;
      this.profile.campaign.mode = "campaign";
      this.saveProfileStore();
      this.updateCampaignUI();
      this.restart({ countRun: this.playing, skipTutorial: !this.playing });
    }

    startCampaignLevel(level) {
      const campaign = this.campaignGame(this.currentDef.id);
      if (level < 1 || level > campaign.unlocked) return;
      this.emit("select", { color: this.currentDef.accent });
      campaign.selected = level;
      this.profile.campaign.mode = "campaign";
      this.saveProfileStore();
      this.updateCampaignUI();
      if (!this.playing) {
        this.playing = true;
        document.body?.classList.add("is-playing");
        const target = this.appShell || document.documentElement;
        if (target.requestFullscreen && !document.fullscreenElement) target.requestFullscreen().catch(() => {});
      }
      this.restart({ countRun: true, skipTutorial: true });
    }

    createRunContext() {
      const baseSeed = this.seedInput.value || "seed";
      if (!this.isCampaignMode()) {
        return { campaign: false, level: 0, seed: baseSeed, difficultyScale: 1 };
      }
      const level = this.selectedCampaignLevel(this.currentDef.id);
      const tuning = campaignDifficulty(level);
      return {
        campaign: true,
        level,
        seed: `${baseSeed}:${this.currentDef.id}:camp-${level}`,
        difficultyScale: tuning.scale
      };
    }

    campaignLevelRecord(gameId = this.currentDef.id, level = this.selectedCampaignLevel(gameId)) {
      return ensureCampaignLevel(this.profile, gameId, level);
    }

    updateCampaignUI() {
      const campaignMode = this.isCampaignMode();
      const gameCampaign = this.campaignGame(this.currentDef.id);
      const selected = this.selectedCampaignLevel(this.currentDef.id);
      const completed = campaignClearsForGame(this.profile, this.currentDef.id);
      this.freeModeBtn.classList.toggle("active", !campaignMode);
      this.campaignModeBtn.classList.toggle("active", campaignMode);
      this.campaignSummary.textContent = campaignMode
        ? `Nivel ${selected}/${CAMPAIGN_LEVELS} | Completados ${completed}/${CAMPAIGN_LEVELS} | Escala ${campaignDifficulty(selected).scale.toFixed(2)}x`
        : `Libre | Campana ${completed}/${CAMPAIGN_LEVELS} en este juego`;
      this.campaignLevelList.innerHTML = "";
      for (let level = 1; level <= CAMPAIGN_LEVELS; level += 1) {
        const record = gameCampaign.levels[String(level)] || makeCampaignLevelRecord();
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = record.completed ? `${level}C` : String(level);
        button.disabled = level > gameCampaign.unlocked;
        button.className = `${level === selected && campaignMode ? "active" : ""}${record.completed ? " completed" : ""}`;
        button.addEventListener("click", () => this.selectCampaignLevel(level));
        this.campaignLevelList.appendChild(button);
      }
    }

    buildList() {
      this.gameList.innerHTML = "";
      for (const game of GAMES) game.button = null;
      const visible = this.filteredGames();
      visible.forEach((game) => {
        const index = GAMES.indexOf(game);
        const stats = this.profile.games[game.id] || makeGameStats();
        const won = stats.wins > 0;
        const favorite = Boolean(this.profile.favorites[game.id]);
        const campaignDone = campaignClearsForGame(this.profile, game.id);
        const pct = this.isCampaignMode() ? Math.round((campaignDone / CAMPAIGN_LEVELS) * 100) : won ? 100 : stats.plays > 0 ? 35 : 0;
        const button = document.createElement("button");
        button.className = `game-card${won ? " won" : ""}${favorite ? " favorite" : ""}`;
        button.type = "button";
        button.style.setProperty("--game-accent", game.accent);
        button.innerHTML = `<span class="game-thumb" aria-hidden="true"><i></i></span><span class="game-stripe"></span><span class="game-copy"><strong>${game.title}</strong><span>${game.genre}</span><span class="game-meta"><b>${game.category}</b><b>${game.difficulty}</b><b>${game.duration}</b>${this.isCampaignMode() ? `<b>${campaignDone}/${CAMPAIGN_LEVELS}</b>` : ""}</span><small><span style="width:${pct}%"></span></small></span><span class="favorite-mark">${favorite ? "*" : String(index + 1).padStart(2, "0")}</span>`;
        button.addEventListener("click", () => this.selectGame(game, { countRun: false, skipTutorial: true }));
        game.button = button;
        this.gameList.appendChild(button);
      });
      if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "empty-library";
        empty.textContent = "No hay juegos con esos filtros.";
        this.gameList.appendChild(empty);
      }
      this.libraryCount.textContent = `${visible.length} de ${GAMES.length} juegos visibles`;
      return visible;
    }

    selectGame(def, options = { countRun: false, skipTutorial: true }) {
      if (this.currentDef?.id !== def.id && this.tutorial.active && this.tutorial.gameId) this.cancelTutorial();
      this.currentDef = def;
      if (this.isCampaignMode()) this.selectedCampaignLevel(def.id);
      for (const game of GAMES) if (game.button) game.button.classList.toggle("active", game === def);
      document.documentElement.style.setProperty("--accent", def.accent);
      this.titleEl.textContent = def.title;
      this.genreEl.textContent = `${def.genre} | ${def.category} | ${def.difficulty} | ${def.duration}`;
      this.objectiveEl.textContent = def.objective;
      this.audio.startMusic(def.category);
      this.emit("select", { color: def.accent });
      this.restart(options);
    }

    restart(options = { countRun: true, skipTutorial: false }) {
      const countRun = options.countRun !== false;
      this.paused = false;
      this.scoreFeedbackCarry = 0;
      this.currentRun = this.createRunContext();
      this.currentGame = new this.currentDef.factory(this, this.currentDef, this.currentRun.seed);
      applyCampaignDifficulty(this.currentGame, this.currentRun);
      if (countRun) this.recordRunStart(this.currentDef);
      this.hideOverlay();
      this.input.reset();
      this.updateProfileUI();
      if (countRun && !options.skipTutorial) this.maybeStartGameTutorial();
    }

    togglePause() {
      if (!this.currentGame || this.currentGame.done) return;
      this.paused = !this.paused;
      if (this.paused) this.showOverlay("Pausa", this.currentDef.title, "Juego detenido");
      else this.hideOverlay();
    }

    completeGame(game, won, message) {
      this.emit(won ? "win" : "loss");
      const key = game.def.id;
      const stats = ensureGameStats(this.profile, key);
      const score = Math.floor(game.score);
      stats.bestScore = Math.max(stats.bestScore || 0, score);
      stats.totalScore += score;
      stats.totalTime += game.time;
      stats.lastSeed = this.currentRun.seed || game.seed;
      stats.lastResult = won ? "Victoria" : "Derrota";
      stats.lastPlayedAt = Date.now();
      if (won) {
        stats.wins += 1;
        stats.bestTime = typeof stats.bestTime === "number" ? Math.min(stats.bestTime, game.time) : game.time;
      } else {
        stats.losses += 1;
      }
      let campaignText = "";
      let unlockedLevel = 0;
      let nextCampaignLevel = 0;
      if (this.currentRun.campaign) {
        const campaign = this.campaignGame(key);
        const record = this.campaignLevelRecord(key, this.currentRun.level);
        record.bestScore = Math.max(record.bestScore || 0, score);
        record.lastSeed = this.currentRun.seed;
        record.lastPlayedAt = Date.now();
        if (won) {
          record.wins += 1;
          record.completed = true;
          record.bestTime = typeof record.bestTime === "number" ? Math.min(record.bestTime, game.time) : game.time;
          const before = campaign.unlocked;
          campaign.unlocked = Math.max(campaign.unlocked, Math.min(CAMPAIGN_LEVELS, this.currentRun.level + 1));
          campaign.selected = Math.min(CAMPAIGN_LEVELS, Math.max(campaign.selected, this.currentRun.level));
          unlockedLevel = campaign.unlocked > before ? campaign.unlocked : 0;
          campaignText = unlockedLevel ? ` Nivel ${unlockedLevel} desbloqueado.` : "";
          const candidate = this.currentRun.level + 1;
          if (candidate <= campaign.unlocked && candidate <= CAMPAIGN_LEVELS) nextCampaignLevel = candidate;
        }
      }
      const unlocked = this.evaluateAchievements();
      this.saveProfileStore();
      this.buildList();
      for (const listed of GAMES) if (listed.button) listed.button.classList.toggle("active", listed === this.currentDef);
      this.updateProfileUI();
      if (unlockedLevel) {
        this.emit("unlock", { text: `Nivel ${unlockedLevel}` });
        this.notify("Nivel desbloqueado", `${game.def.title} nivel ${unlockedLevel}`);
      }
      for (const achievement of unlocked.slice(0, 3)) {
        this.emit("achievement");
        this.notify("Logro desbloqueado", achievement.title);
      }
      const achievementText = unlocked.length ? ` Logros nuevos: ${unlocked.length}.` : "";
      const overlayActions = nextCampaignLevel
        ? [{ label: "Siguiente nivel", action: () => this.startCampaignLevel(nextCampaignLevel), primary: true }]
        : [];
      this.showOverlay(
        won ? "Completado" : "Fin de partida",
        `${message}${campaignText}${achievementText}`,
        game.def.title,
        [
          ["Puntos", String(score)],
          ["Mejor", this.bestValue.textContent],
          ["Tiempo", formatTime(game.time)]
        ],
        overlayActions
      );
    }

    recordRunStart(def) {
      const stats = ensureGameStats(this.profile, def.id);
      stats.plays += 1;
      stats.lastSeed = this.currentRun.seed || this.seedInput.value || "seed";
      stats.lastResult = "En curso";
      stats.lastPlayedAt = Date.now();
      if (this.currentRun.campaign) {
        const record = this.campaignLevelRecord(def.id, this.currentRun.level);
        record.plays += 1;
        record.lastSeed = this.currentRun.seed;
        record.lastPlayedAt = Date.now();
      }
      this.evaluateAchievements();
      this.saveProfileStore();
      this.buildList();
      for (const game of GAMES) if (game.button) game.button.classList.toggle("active", game === this.currentDef);
    }

    evaluateAchievements() {
      const unlocked = [];
      for (const achievement of this.achievementDefs) {
        if (this.profile.achievements[achievement.id]) continue;
        if (!achievement.test(this.profile)) continue;
        this.profile.achievements[achievement.id] = {
          unlockedAt: Date.now(),
          gameId: achievement.gameId || null
        };
        unlocked.push(achievement);
      }
      return unlocked;
    }

    updateProfileUI() {
      const profile = this.profile;
      const wonCount = uniqueWon(profile);
      const unlockedCount = Object.keys(profile.achievements).length;
      const totalAchievements = this.achievementDefs.length;
      if (document.activeElement !== this.profileNameInput) this.profileNameInput.value = profile.name;
      this.tutorialAutoToggle.checked = Boolean(profile.tutorials.showNew);
      this.profileSlotBtn.textContent = String(profile.slot).padStart(2, "0");
      this.profileProgressValue.textContent = `${wonCount}/${GAMES.length}`;
      this.profileAchievementValue.textContent = `${unlockedCount}/${totalAchievements}`;
      this.profileProgressBar.style.width = `${Math.round((wonCount / GAMES.length) * 100)}%`;

      const stats = profile.games[this.currentDef.id] || makeGameStats();
      this.favoriteBtn.classList.toggle("active", Boolean(profile.favorites[this.currentDef.id]));
      this.favoriteBtn.textContent = profile.favorites[this.currentDef.id] ? "*" : "+";
      if (this.isCampaignMode()) {
        const level = this.selectedCampaignLevel(this.currentDef.id);
        const record = this.campaignLevelRecord(this.currentDef.id, level);
        this.bestValue.textContent = String(record.bestScore || 0);
        const bestTime = typeof record.bestTime === "number" ? formatTime(record.bestTime) : "--:--";
        this.gameRecordText.textContent = `Campana nivel ${level} | Partidas ${record.plays} | Victorias ${record.wins} | Mejor tiempo ${bestTime}`;
      } else if (stats.plays > 0) {
        this.bestValue.textContent = String(stats.bestScore || 0);
        const bestTime = typeof stats.bestTime === "number" ? formatTime(stats.bestTime) : "--:--";
        this.gameRecordText.textContent = `Partidas ${stats.plays} | Victorias ${stats.wins} | Derrotas ${stats.losses} | Mejor tiempo ${bestTime}`;
      } else {
        this.bestValue.textContent = String(stats.bestScore || 0);
        this.gameRecordText.textContent = "Sin partidas registradas";
      }
      this.updateCampaignUI();
      this.renderAchievements();
    }

    renderAchievements() {
      const unlocked = this.profile.achievements;
      const currentGameAchievement = this.achievementDefs.find((achievement) => achievement.id === `win-${this.currentDef.id}`);
      const globalDefs = this.achievementDefs.filter((achievement) => !achievement.gameId);
      const recentUnlocked = globalDefs.filter((achievement) => unlocked[achievement.id]).slice(-2);
      const nextLocked = globalDefs.filter((achievement) => !unlocked[achievement.id]).slice(0, 2);
      const display = [currentGameAchievement, ...recentUnlocked, ...nextLocked].filter(Boolean);
      const unique = [];
      for (const achievement of display) {
        if (!unique.some((item) => item.id === achievement.id)) unique.push(achievement);
        if (unique.length >= 3) break;
      }
      this.achievementList.innerHTML = unique.map((achievement) => {
        const isUnlocked = Boolean(unlocked[achievement.id]);
        return `<div class="achievement-chip ${isUnlocked ? "unlocked" : "locked"}"><strong>${achievement.title}</strong><span>${isUnlocked ? "Desbloqueado" : achievement.desc}</span></div>`;
      }).join("");
    }

    showOverlay(title, text, kicker, details = null, actions = []) {
      this.overlayTitle.textContent = title;
      if (details?.length) {
        this.overlayText.innerHTML = `${text}<span class="overlay-result">${details.map(([label, value]) => `<span>${label}<strong>${value}</strong></span>`).join("")}</span>`;
      } else {
        this.overlayText.textContent = text;
      }
      this.overlayKicker.textContent = kicker;
      if (this.overlayActions) {
        this.overlayActions.innerHTML = "";
        for (const action of actions) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = action.label;
          button.className = action.primary ? "primary" : "";
          button.addEventListener("click", action.action);
          this.overlayActions.appendChild(button);
        }
      }
      this.overlay.classList.remove("hidden");
    }

    hideOverlay() {
      this.overlay.classList.add("hidden");
      if (this.overlayActions) this.overlayActions.innerHTML = "";
    }

    loop(now) {
      const dt = Math.min(0.033, (now - this.last) / 1000 || 0);
      this.last = now;
      if (this.playing && this.input.consume("restart")) {
        this.emit("select", { color: this.currentDef.accent });
        this.restart({ countRun: true, skipTutorial: true });
        this.input.down.restart = true;
      }
      if (this.playing && this.input.consume("start")) this.togglePause();
      if (this.playing && this.currentGame && !this.paused && !this.currentGame.done && !this.tutorial.active) {
        const beforeScore = this.currentGame.score || 0;
        const beforeHealth = typeof this.currentGame.health === "number" ? this.currentGame.health : null;
        this.currentGame.update(dt, this.input);
        const scoreDelta = (this.currentGame.score || 0) - beforeScore;
        if (scoreDelta > 0) {
          this.scoreFeedbackCarry += scoreDelta;
          if (this.scoreFeedbackCarry >= 60) {
            this.emit("collect", {
              text: `+${Math.floor(this.scoreFeedbackCarry)}`,
              color: this.currentDef.accent
            });
            this.scoreFeedbackCarry = 0;
          }
        }
        if (beforeHealth !== null && typeof this.currentGame.health === "number" && this.currentGame.health < beforeHealth) {
          this.emit("damage");
        }
      }
      this.feedback.update(dt);
      this.render();
      this.input.clearFrame();
      requestAnimationFrame((t) => this.loop(t));
    }

    render() {
      this.ctx.clearRect(0, 0, W, H);
      const offset = this.feedback.offset();
      this.ctx.save();
      this.ctx.translate(offset.x, offset.y);
      if (this.currentGame) this.currentGame.render(this.ctx);
      if (this.currentRun?.campaign) this.renderCampaignBadge();
      this.renderTutorialGuide();
      this.ctx.restore();
      this.feedback.render(this.ctx);
      this.scoreValue.textContent = String(Math.floor(this.currentGame?.score || 0));
      this.timeValue.textContent = formatTime(this.currentGame?.time || 0);
    }

    renderCampaignBadge() {
      const ctx = this.ctx;
      const text = `Campana N${this.currentRun.level}  ${this.currentRun.difficultyScale.toFixed(2)}x`;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = "rgba(10,12,16,0.72)";
      ctx.fillRect(W - 210, 18, 190, 34);
      ctx.strokeStyle = this.currentDef.accent;
      ctx.strokeRect(W - 210, 18, 190, 34);
      drawText(ctx, text, W - 115, 36, 14, "#f3f6f8", "center", 800);
      ctx.restore();
    }
  }

  function formatTime(seconds) {
    const s = Math.floor(seconds);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  window.addEventListener("DOMContentLoaded", () => new App());
})();

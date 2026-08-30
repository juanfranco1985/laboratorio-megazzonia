import test from "node:test";
import assert from "node:assert/strict";
import { worlds, freshSave, normalizeSave, powers, enemyVisuals, praderaFlow, platformSurfaceAt } from "../src/game-data.js";
import { JUMP_TUNING, shouldStartJump, shortenReleasedJump } from "../src/jump.js";

test("la campaña contiene siete mundos únicos",()=>{
  assert.equal(worlds.length,7);
  assert.equal(new Set(worlds.map(world=>world.id)).size,7);
  assert.equal(new Set(worlds.map(world=>JSON.stringify(world.platforms))).size,7);
});

test("cada mundo tiene objetivo, checkpoint, peligro y enemigos",()=>{
  for(const world of worlds){
    assert.equal(world.crystals.length,3,world.id);
    assert.ok(world.platforms.length>=10,world.id);
    assert.ok(world.enemies.length>=2,world.id);
    assert.ok(world.hazards.length>=1,world.id);
    assert.equal(world.checkpointAt.length,2,world.id);
    assert.ok(powers.includes(world.power),world.id);
  }
});

test("los mundos 4 y 7 contienen jefes con resistencia propia",()=>{
  assert.equal(worlds[3].boss.type,"rune-guardian");
  assert.ok(worlds[3].boss.hp>=8);
  assert.equal(worlds[6].boss.type,"cosmic-sentinel");
  assert.ok(worlds[6].boss.hp>=10);
  assert.equal(worlds.filter(world=>world.boss).length,2);
});

test("todos los enemigos comunes poseen identidad visual animada",()=>{
  assert.deepEqual(Object.keys(enemyVisuals).sort(),["crab","hopper","snail"]);
  for(const visual of Object.values(enemyVisuals)){
    assert.ok(visual.name.length>0);
    assert.ok(visual.frames>=3);
  }
  for(const world of worlds)for(const enemy of world.enemies)assert.ok(enemyVisuals[enemy.type],`${world.id}:${enemy.type}`);
});

test("el guardado siempre conserva una campaña válida de un jugador",()=>{
  const save=normalizeSave({worldIndex:99,hero:"invalid",unlockedPowers:["ice"],activePower:"void",crystals:-3});
  assert.equal(save.worldIndex,6);
  assert.equal(save.hero,"boy");
  assert.deepEqual(save.unlockedPowers,["fire","ice"]);
  assert.equal(save.activePower,"fire");
  assert.equal(save.crystals,18);
  assert.equal(save.version,3);
  assert.equal(save.currentRun.worldIndex,6);
  assert.deepEqual(freshSave().unlockedPowers,["fire"]);
  assert.equal("secondPlayer" in save,false);
});

test("el guardado conserva y sanea el progreso dentro del mundo",()=>{
  const save=normalizeSave({
    worldIndex:3,
    unlockedPowers:["fire","water"],
    currentRun:{worldIndex:3,checkpoint:{x:2290,y:435},collected:[0,2,2,99],hearts:2,bossDefeated:true},
  });
  assert.deepEqual(save.currentRun.checkpoint,{x:2290,y:435});
  assert.deepEqual(save.currentRun.collected,[0,2]);
  assert.equal(save.currentRun.hearts,2);
  assert.equal(save.currentRun.bossDefeated,true);
  assert.equal(save.crystals,11);
});

test("el salto tolera bordes, recuerda la pulsación y permite regular la altura",()=>{
  assert.equal(shouldStartJump(1080,1000,1200),true,"acepta el salto poco después de abandonar el borde");
  assert.equal(shouldStartJump(1201,1000,1200),false,"descarta una pulsación vencida");
  assert.equal(shouldStartJump(1300,1000,1400),false,"no concede saltos aéreos fuera de la tolerancia");
  assert.equal(shortenReleasedJump(-500,true,false),JUMP_TUNING.releaseVelocity);
  assert.equal(shortenReleasedJump(-200,true,false),-200);
  assert.equal(JUMP_TUNING.bufferMs,160);
});

test("cada portal descansa sobre una plataforma física",()=>{
  for(const world of worlds){
    const surface=platformSurfaceAt(world,world.portalAt[0]);
    assert.notEqual(surface,null,`${world.id}: el portal debe tener piso`);
    assert.ok(surface<world.portalAt[1]+40,`${world.id}: la entrada debe quedar cerca de la superficie`);
  }
});

test("la Pradera implementa el recorrido Tronco, Molino, Henal y Portal",()=>{
  const pradera=worlds[0];
  assert.equal(pradera.id,"pradera");
  assert.ok(pradera.platforms.length>=30);
  assert.deepEqual(pradera.crystals.map((_crystal,index)=>index),[0,1,2]);
  assert.deepEqual(praderaFlow.boats.map(boat=>boat.id),["ida","regreso"]);
  assert.deepEqual(praderaFlow.gates.map(gate=>gate.requiresCrystal),[1,2]);
  assert.equal(praderaFlow.boats[1].requiresCrystal,0);
  for(const gate of praderaFlow.gates)assert.ok(gate.requiresCrystal>=0&&gate.requiresCrystal<pradera.crystals.length);
});

test("los ríos de la Pradera requieren bote y cada gema posee una superficie",()=>{
  const pradera=worlds[0];
  for(const boat of praderaFlow.boats)assert.ok(Math.abs(boat.toX-boat.fromX)>350,boat.id);
  for(const [x,y] of pradera.crystals){
    const surface=platformSurfaceAt(pradera,x);
    assert.notEqual(surface,null,`gema en x=${x}`);
    assert.ok(y<surface,`gema en x=${x}: debe quedar sobre su plataforma`);
    assert.ok(surface-y<=90,`gema en x=${x}: debe poder recogerse desde la plataforma`);
  }
});

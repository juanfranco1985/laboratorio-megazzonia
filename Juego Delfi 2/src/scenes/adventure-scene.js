import Phaser from "phaser";
import { asset } from "../assets.js";
import { VIEW_WIDTH,VIEW_HEIGHT,WORLD_WIDTH,worlds,movementStates,powers,enemyVisuals,praderaFlow,platformSurfaceAt,normalizeSave,freshRun } from "../game-data.js";
import { touchState,firstGamepad } from "../input.js";
import { audio } from "../audio.js";
import { readSave,writeSave } from "../storage.js";
import { JUMP_TUNING,shouldStartJump,shortenReleasedJump } from "../jump.js";

const COLORS={fire:0xff6b35,water:0x35baf6,ice:0xb9f4ff,lightning:0xffed61};
const HEROES={boy:"Delfi",girl:"Nova"};

export class AdventureScene extends Phaser.Scene {
  constructor(){super("adventure");}
  init(data){
    this.saveData=normalizeSave(data.save||readSave());
    this.worldIndex=Phaser.Math.Clamp(Number(data.worldIndex??this.saveData.worldIndex),0,worlds.length-1);
    this.worldData=worlds[this.worldIndex]; this.hero=this.saveData.hero;
    this.powerIndex=Math.max(0,this.saveData.unlockedPowers.indexOf(this.saveData.activePower));
    this.runData=this.saveData.currentRun?.worldIndex===this.worldIndex?this.saveData.currentRun:freshRun(this.worldIndex);
    this.collectedIds=new Set(this.runData.collected); this.collected=this.collectedIds.size;
    this.hearts=this.runData.hearts; this.respawnPoint=this.runData.checkpoint?{...this.runData.checkpoint}:{x:160,y:480}; this.invulnerableUntil=0;
    this.bossDefeated=!this.worldData.boss||this.runData.bossDefeated;
    this.nextShotAt=0; this.paused=false; this.transitioning=false; this.portalReminder=0; this.padPrevious=new Set(); this.touchPrevious={};
    this.lastGroundedAt=-Infinity; this.jumpBufferedUntil=-Infinity; this.wasJumpHeld=false;
    this.praderaMode=this.worldIndex===0;this.ridingBoat=false;this.praderaBoatCooldown=0;this.safeFallCooldown=0;
  }
  preload(){
    movementStates.forEach(state=>["boy","girl"].forEach(hero=>this.load.image(`${hero}-${state}`,asset(`characters/${hero}/${state}-v1.png`))));
    ["boy","girl"].forEach(hero=>powers.forEach(power=>this.load.image(`${hero}-${power}`,asset(`characters/powers/${hero}-${power}-v1.png`))));
    ["universe-crystal","heart","checkpoint","portal-active","portal-dormant","reunion-beacon"].forEach(key=>this.load.image(key.replace("universe-",""),asset(`shared/${key}-v1.png`)));
    worlds.forEach(world=>{
      this.load.image(`bg-${world.id}`,asset(`worlds/${world.id}/background.png`));
      new Set([world.ground,world.ledge,world.bridge,world.bounce,world.hazard,world.portal,"checkpoint"]).forEach(key=>this.load.image(`${world.id}-${key}`,asset(`worlds/${world.id}/sprites/${key}-v1.png`)));
    });
    this.load.on("loaderror",file=>console.error("No se pudo cargar",file.key,file.src));
  }
  create(){
    this.makeTextures(); this.physics.world.setBounds(0,0,WORLD_WIDTH,VIEW_HEIGHT+220);
    this.add.tileSprite(WORLD_WIDTH/2,VIEW_HEIGHT/2,WORLD_WIDTH,VIEW_HEIGHT,`bg-${this.worldData.id}`).setScrollFactor(.18).setTint(this.worldData.tint);
    const floorTop=665;
    this.add.rectangle(WORLD_WIDTH/2,(floorTop+VIEW_HEIGHT+220)/2,WORLD_WIDTH,VIEW_HEIGHT+220-floorTop,0x050b10);
    if(this.praderaMode)this.createPraderaGrayboxBackdrop();
    this.platforms=this.physics.add.staticGroup();
    this.worldData.platforms.forEach(s=>this.addPlatform(s));
    this.bouncePad=this.physics.add.staticImage(...this.worldData.bounceAt,`${this.worldData.id}-${this.worldData.bounce}`).setDisplaySize(120,70).setDepth(5).refreshBody();
    this.checkpoint=this.physics.add.staticImage(...this.worldData.checkpointAt,`${this.worldData.id}-checkpoint`).setDisplaySize(82,112).setDepth(5).refreshBody();
    const portalX=this.worldData.portalAt[0],portalSurfaceY=platformSurfaceAt(this.worldData,portalX)??545;
    this.add.image(portalX,portalSurfaceY,`${this.worldData.id}-${this.worldData.portal}`).setOrigin(.5,1).setDisplaySize(170,190).setDepth(5);
    this.portalVisual=this.add.image(portalX,portalSurfaceY,"portal-dormant").setOrigin(.5,1).setDisplaySize(105,140).setDepth(6);
    this.portal=this.add.zone(portalX,portalSurfaceY-75,130,150);this.physics.add.existing(this.portal,true);
    this.portalSafety=this.add.rectangle(portalX,portalSurfaceY+7,310,18,0xffffff,0);this.physics.add.existing(this.portalSafety,true);
    this.hazards=this.physics.add.staticGroup();
    this.worldData.hazards.forEach(h=>{const item=this.hazards.create(h.x,h.y,`${this.worldData.id}-${this.worldData.hazard}`).setDisplaySize(105,90).setDepth(5).refreshBody();item.hazardKind=h.kind;});
    this.crystals=this.physics.add.staticGroup();
    this.worldData.crystals.forEach(([x,y],index)=>{
      if(this.collectedIds.has(index))return;
      const crystal=this.crystals.create(x,y,"crystal").setDisplaySize(54,54).setDepth(7).refreshBody();
      crystal.crystalId=index;
    });
    this.projectiles=this.physics.add.group({allowGravity:false}); this.enemies=this.physics.add.group();
    this.worldData.enemies.forEach(spec=>this.spawnEnemy(spec));
    if(this.worldData.boss&&!this.bossDefeated)this.spawnEnemy({...this.worldData.boss,isBoss:true});
    this.player=this.physics.add.sprite(this.respawnPoint.x,this.respawnPoint.y,`${this.hero}-idle`).setOrigin(.5,1).setCollideWorldBounds(true).setBounce(0).setDepth(8);this.setHeroState("idle");
    this.physics.add.collider(this.player,this.platforms);this.physics.add.collider(this.player,this.portalSafety);this.physics.add.collider(this.enemies,this.platforms);
    this.physics.add.collider(this.projectiles,this.platforms,shot=>shot.destroy());
    this.physics.add.overlap(this.player,this.crystals,this.collectCrystal,undefined,this);
    this.physics.add.overlap(this.player,this.checkpoint,this.activateCheckpoint,undefined,this);
    this.physics.add.overlap(this.player,this.bouncePad,this.useBounce,undefined,this);
    this.physics.add.overlap(this.player,this.hazards,this.touchHazard,undefined,this);
    this.physics.add.overlap(this.player,this.enemies,this.touchEnemy,undefined,this);
    this.physics.add.overlap(this.projectiles,this.enemies,this.hitEnemy,undefined,this);
    this.physics.add.overlap(this.player,this.portal,this.enterPortal,undefined,this);
    if(this.praderaMode)this.createPraderaSystems();
    this.cameras.main.setBounds(0,0,WORLD_WIDTH,VIEW_HEIGHT).startFollow(this.player,true,.09,.09,-220,60); this.cameras.main.setDeadzone(260,150);
    this.keys=this.input.keyboard.addKeys({left:"LEFT",right:"RIGHT",up:"UP",a:"A",d:"D",w:"W",jump:"SPACE",power:"X",powerAlt:"K",cycle:"F",cycleAlt:"L",change:"C",pause:"ESC",pauseAlt:"P",respawn:"R",mute:"M"});
    this.createHud(); this.showMessage(`${this.worldData.name}\n${this.worldData.lesson}`,3300);
    if(this.collected===3&&this.bossDefeated)this.portalVisual.setTexture("portal-active");
    this.events.once("shutdown",()=>Object.keys(touchState).forEach(key=>touchState[key]=false));
  }
  addPlatform(spec){
    const sprite=this.platforms.create(spec.x,spec.y,`${this.worldData.id}-${spec.key}`).setOrigin(.5,1).setDisplaySize(spec.width,spec.height).setDepth(4);
    sprite.body.setSize(sprite.width*.96,Math.max(8,sprite.height*.24));sprite.body.setOffset(sprite.width*.02,2);sprite.refreshBody();return sprite;
  }
  setHeroState(state){
    const key=`${this.hero}-${state}`;if(this.player.texture.key!==key)this.player.setTexture(key);
    const width=this.hero==="boy"?78:74;this.player.setDisplaySize(width,108);
    this.player.body.setSize(this.player.width*.52,this.player.height*.82);this.player.body.setOffset(this.player.width*.24,this.player.height*.18);
  }
  createPraderaGrayboxBackdrop(){
    const labelStyle={fontFamily:"Arial Black, sans-serif",fontSize:"17px",color:"#fff4c7",stroke:"#213628",strokeThickness:4,align:"center"};
    this.add.rectangle(655,735,390,170,0x4cbbd7,.82).setDepth(1);
    this.add.rectangle(2355,735,290,170,0x4cbbd7,.82).setDepth(1);
    this.add.rectangle(1480,410,1020,470,0x75451f,.18).setStrokeStyle(5,0x8e592d,.75).setDepth(2);
    this.add.rectangle(1110,515,105,220,0x25180f,.72).setStrokeStyle(5,0xc38b4c).setDepth(3);
    this.add.rectangle(1860,238,130,90,0x7c4c29,.75).setStrokeStyle(4,0xf0c071).setDepth(3);
    this.add.text(1480,145,["ESTRUCTURA DEL TRONCO","ascenso vertical + balcón"].join(String.fromCharCode(10)),labelStyle).setOrigin(.5).setDepth(3);
    this.add.text(1110,515,["ENTRADA","TRONCO"].join(String.fromCharCode(10)),{...labelStyle,fontSize:"13px"}).setOrigin(.5).setDepth(3);
    this.add.text(1860,238,"BALCÓN",{...labelStyle,fontSize:"13px"}).setOrigin(.5).setDepth(3);
    this.add.rectangle(2940,440,760,500,0x9c6a33,.16).setStrokeStyle(5,0xd6a14c,.8).setDepth(2);
    this.add.rectangle(2940,355,210,245,0x5b3921,.7).setStrokeStyle(5,0xe1b462).setDepth(3);
    this.add.text(2940,145,["MOLINO","interior seguro / escalera exterior"].join(String.fromCharCode(10)),labelStyle).setOrigin(.5).setDepth(3);
    this.add.text(2940,355,["BASE","INTERIOR"].join(String.fromCharCode(10)),{...labelStyle,fontSize:"13px"}).setOrigin(.5).setDepth(3);
    this.add.rectangle(3800,465,700,390,0xb78a38,.17).setStrokeStyle(5,0xe8c96a,.8).setDepth(2);
    [3540,3690,3840,3990].forEach((x,index)=>this.add.rectangle(x,570-index*55,135,115,0xb6883f,.62).setStrokeStyle(3,0xf0d27a).setDepth(3));
    this.add.text(3800,205,["HENAL","laberinto + gema final"].join(String.fromCharCode(10)),labelStyle).setOrigin(.5).setDepth(3);
    this.add.text(430,555,"MUELLE DE IDA",{...labelStyle,fontSize:"13px"}).setOrigin(.5).setDepth(3);
    this.add.text(2355,555,"REGRESO AL MOLINO",{...labelStyle,fontSize:"13px"}).setOrigin(.5).setDepth(3);
  }
  createPraderaSystems(){
    this.praderaGates=new Map();this.praderaFerries=[];
    praderaFlow.gates.forEach(spec=>{if(!this.collectedIds.has(spec.requiresCrystal))this.createPraderaGate(spec);});
    praderaFlow.boats.forEach(spec=>this.createPraderaFerry(spec));
    this.praderaWater=this.physics.add.staticGroup();
    [{x:655,width:390},{x:2355,width:290}].forEach(spec=>{
      const zone=this.add.zone(spec.x,765,spec.width,260);this.physics.add.existing(zone,true);this.praderaWater.add(zone);
    });
    this.physics.add.overlap(this.player,this.praderaWater,this.safePraderaFall,undefined,this);
  }
  createPraderaGate(spec){
    const gate=this.add.rectangle(spec.x,397,34,296,0x7552a8,.92).setStrokeStyle(4,0xffdf78).setDepth(7);
    this.physics.add.existing(gate,true);this.physics.add.collider(this.player,gate);
    const label=this.add.text(spec.x,235,`SELLO ${spec.requiresCrystal+1}`,{fontFamily:"Arial Black, sans-serif",fontSize:"13px",color:"#fff3a9",backgroundColor:"#2b164ddd",padding:{x:7,y:5}}).setOrigin(.5).setDepth(8);
    this.praderaGates.set(spec.id,{gate,label,spec});
  }
  createPraderaFerry(spec){
    const boat=this.add.container(spec.fromX,596).setDepth(7);
    const hull=this.add.ellipse(0,22,132,43,0x7a4723).setStrokeStyle(4,0x3b2418);
    const rim=this.add.rectangle(0,3,112,15,0xd49348).setStrokeStyle(3,0x56331d);
    const sign=this.add.text(0,-24,"BOTE",{fontFamily:"Arial Black, sans-serif",fontSize:"13px",color:"#fff3b5",stroke:"#3a2416",strokeThickness:3}).setOrigin(.5);
    boat.add([hull,rim,sign]);
    const trigger=this.add.zone(spec.fromX,500,138,195);this.physics.add.existing(trigger,true);
    this.physics.add.overlap(this.player,trigger,()=>this.tryPraderaFerry(spec,boat));
    this.praderaFerries.push({spec,boat,trigger});
  }
  tryPraderaFerry(spec,boat){
    if(this.ridingBoat||this.time.now<this.praderaBoatCooldown)return;
    if(spec.requiresCrystal!==null&&!this.collectedIds.has(spec.requiresCrystal)){
      this.praderaBoatCooldown=this.time.now+1500;this.showMessage("Primero consigue la gema del balcón para regresar al Molino.",1450);return;
    }
    this.ridePraderaFerry(spec,boat);
  }
  ridePraderaFerry(spec,boat){
    this.ridingBoat=true;this.praderaBoatCooldown=this.time.now+2600;this.player.disableBody(false,false);this.player.setPosition(spec.fromX,555);
    this.tweens.add({targets:[boat,this.player],x:spec.toX,duration:1750,ease:"Sine.InOut",onComplete:()=>{
      this.player.enableBody(true,spec.toX,475,true,true).setVelocity(0,0);this.ridingBoat=false;this.showMessage(spec.id==="ida"?"Entra por el tronco y busca la salida del balcón.":"Checkpoint del Molino: explora dentro o sube por fuera.",2100);
      this.time.delayedCall(550,()=>this.tweens.add({targets:boat,x:spec.fromX,duration:950,ease:"Sine.InOut"}));
    }});
  }
  safePraderaFall(){
    if(this.ridingBoat||this.time.now<this.safeFallCooldown)return;
    this.safeFallCooldown=this.time.now+900;
    const shores=[360,920,2140,2550],x=shores.reduce((best,next)=>Math.abs(next-this.player.x)<Math.abs(best-this.player.x)?next:best);
    this.player.enableBody(true,x,475,true,true).setVelocity(0,0);this.invulnerableUntil=this.time.now+900;this.showMessage("La corriente te devolvió al último muelle.",1250);
  }
  refreshPraderaProgress(crystalId){
    [...this.praderaGates.entries()].forEach(([id,entry])=>{
      if(!this.collectedIds.has(entry.spec.requiresCrystal))return;
      entry.gate.destroy();entry.label.destroy();this.praderaGates.delete(id);
    });
    if(crystalId===0)this.showMessage("Gema del Tronco obtenida · el bote de regreso ya puede partir.",2300);
    if(crystalId===1)this.showMessage("Gema del Molino obtenida · el sello del Henal se abrió.",2300);
    if(crystalId===2)this.showMessage("Gema del Henal obtenida · el Jardín del Portal está abierto.",2300);
  }
  makeTextures(){
    if(this.textures.exists("enemy-snail-0"))return;
    const g=this.make.graphics({x:0,y:0,add:false});
    const eye=(x,y,pupilX=0)=>g.fillStyle(0xffffff).fillCircle(x,y,6).fillStyle(0x152230).fillCircle(x+pupilX,y,3).fillStyle(0xffffff).fillCircle(x+pupilX-1,y-1,1);
    for(let frame=0;frame<3;frame++){
      const bob=frame===1?2:0,blink=frame===2;
      g.clear().fillStyle(0x10212b).fillRoundedRect(8,45+bob,80,24-bob,12).fillCircle(43,35+bob,27).fillStyle(0xf29945).fillCircle(42,34+bob,24).lineStyle(4,0xffd37b).strokeCircle(42,34+bob,16).lineStyle(3,0xb95c37).strokeCircle(42,34+bob,9).fillStyle(0x82dc63).fillRoundedRect(12,43+bob,75,21-bob,10).fillCircle(72,43+bob,15).lineStyle(4,0x10212b).lineBetween(73,36+bob,76,21+bob).lineBetween(83,36+bob,87,23+bob);
      if(blink){g.lineStyle(3,0x152230).lineBetween(72,22+bob,80,22+bob).lineBetween(83,24+bob,91,24+bob);}else{eye(76,20+bob,2);eye(87,22+bob,2);}
      g.fillStyle(0x375d35).fillCircle(68,49+bob,3).fillCircle(78,52+bob,2).generateTexture(`enemy-snail-${frame}`,96,76);

      const clawLift=frame===1?5:0,legShift=frame===2?3:0;
      g.clear().lineStyle(7,0x172432).lineBetween(31,53,18-legShift,68).lineBetween(43,55,34+legShift,72).lineBetween(57,55,65-legShift,72).lineBetween(68,53,82+legShift,68).fillStyle(0x172432).fillCircle(48,43,28).fillCircle(18,32-clawLift,16).fillCircle(78,32+clawLift,16).fillStyle(0xf26d5b).fillEllipse(48,43,51,43).fillCircle(18,32-clawLift,12).fillCircle(78,32+clawLift,12).fillStyle(0xffa06f).fillTriangle(7,24-clawLift,26,28-clawLift,16,38-clawLift).fillTriangle(89,24+clawLift,70,28+clawLift,80,38+clawLift);
      if(blink){g.lineStyle(3,0x172432).lineBetween(35,37,45,37).lineBetween(52,37,62,37);}else{eye(40,36,frame-1);eye(57,36,frame-1);}
      g.lineStyle(3,0xb93d3d).strokeEllipse(48,47,34,18).generateTexture(`enemy-crab-${frame}`,96,76);

      const squash=frame===1?5:0,hop=frame===2?-3:0;
      g.clear().fillStyle(0x172035).fillEllipse(48,39+hop,58+squash,62-squash).fillStyle(0xee7db5).fillEllipse(48,39+hop,52+squash,56-squash).fillStyle(0xffb9dc).fillTriangle(25,22+hop,34,9+hop,42,20+hop).fillTriangle(39,19+hop,49,7+hop,56,20+hop).fillTriangle(53,20+hop,64,10+hop,70,24+hop).lineStyle(3,0xa6437d).lineBetween(34,24+hop,43,31+hop).lineBetween(43,31+hop,50,23+hop).lineBetween(50,23+hop,60,31+hop);
      if(blink){g.lineStyle(3,0x172035).lineBetween(34,38+hop,44,38+hop).lineBetween(52,38+hop,62,38+hop);}else{eye(40,37+hop,frame-1);eye(57,37+hop,frame-1);}
      g.fillStyle(0x5f234e).fillRoundedRect(38,48+hop,21,10,5).fillStyle(0xffffff).fillTriangle(42,48+hop,46,54+hop,49,48+hop).fillTriangle(51,48+hop,55,54+hop,57,48+hop).fillStyle(0x172035).fillEllipse(31,69+hop,20,7).fillEllipse(65,69+hop,20,7).generateTexture(`enemy-hopper-${frame}`,96,76);
    }
    g.clear().fillStyle(0x211344).fillRoundedRect(5,12,110,82,22).lineStyle(6,0xffd76a).strokeRoundedRect(5,12,110,82,22).fillStyle(0xb77cff).fillCircle(60,50,28).fillStyle(0xffffff).fillCircle(49,44,7).fillCircle(72,44,7).fillStyle(0x221433).fillCircle(50,45,3).fillCircle(71,45,3).lineStyle(4,0x7ff5e8).strokeCircle(60,51,39).generateTexture("enemy-rune-guardian",120,104);
    g.clear().fillStyle(0x101834).fillCircle(64,55,48).lineStyle(7,0x65e8ff).strokeCircle(64,55,48).fillStyle(0x874cff).fillTriangle(13,55,45,22,45,88).fillTriangle(115,55,83,22,83,88).fillStyle(0xffffff).fillCircle(52,48,8).fillCircle(77,48,8).fillStyle(0x142044).fillCircle(53,49,4).fillCircle(76,49,4).lineStyle(4,0xffea72).strokeCircle(64,55,31).generateTexture("enemy-cosmic-sentinel",128,110);
    Object.entries(COLORS).forEach(([power,color])=>{g.clear().fillStyle(color).fillCircle(14,14,11).lineStyle(3,0xffffff,.8).strokeCircle(14,14,11).generateTexture(`shot-${power}`,28,28);}); g.destroy();
  }
  createHud(){
    this.add.rectangle(18,16,620,102,0x080d29,.9).setOrigin(0).setScrollFactor(0).setDepth(50).setStrokeStyle(2,0x8eefff);
    this.hud=this.add.text(36,28,"",{fontFamily:"Arial, sans-serif",fontSize:"20px",color:"#fff",lineSpacing:8}).setScrollFactor(0).setDepth(51);
    this.padStatus=this.add.text(VIEW_WIDTH-28,28,"",{fontFamily:"Arial, sans-serif",fontSize:"17px",color:"#b5d1df",align:"right"}).setOrigin(1,0).setScrollFactor(0).setDepth(51);
    this.message=this.add.text(VIEW_WIDTH/2,165,"",{fontFamily:"Arial Black, sans-serif",fontSize:"25px",color:"#fff",stroke:"#191047",strokeThickness:4,align:"center",backgroundColor:"#0b1238ee",padding:{x:22,y:14},wordWrap:{width:760}}).setOrigin(.5).setScrollFactor(0).setDepth(60).setVisible(false);
    this.pausePanel=this.add.container(VIEW_WIDTH/2,VIEW_HEIGHT/2).setScrollFactor(0).setDepth(100).setVisible(false);
    const pauseLines=["Esc / Start · continuar","R / Back · volver al checkpoint","M · activar o silenciar sonido"];
    this.pausePanel.add([this.add.rectangle(0,0,650,340,0x0b1030,.97).setStrokeStyle(4,0x8eefff),this.add.rectangle(0,0,620,310,0x241453,.32).setStrokeStyle(1,0x947dff),this.add.text(0,-110,"PAUSA DEL NEXO",{fontFamily:"Georgia, serif",fontStyle:"bold",fontSize:"42px",color:"#ffe29a",stroke:"#321866",strokeThickness:6}).setOrigin(.5),this.add.text(0,8,pauseLines.join(String.fromCharCode(10)),{fontFamily:"Arial, sans-serif",fontSize:"22px",color:"#d9e8ff",align:"center",lineSpacing:14}).setOrigin(.5)]);
    this.updateHud();
  }
  updateHud(){const ready=this.collected===3&&this.bossDefeated;const bossStatus=this.worldData.boss&&!this.bossDefeated?` · Jefe: ${Math.max(0,this.boss?.hp??this.worldData.boss.hp)}/${this.worldData.boss.hp}`:"";this.hud.setText([`${this.worldIndex+1}/7 · ${this.worldData.name}     Héroe: ${HEROES[this.hero]}     Poder: ${this.activePower().toUpperCase()}`,`Cristales: ${this.collected}/3     Vidas: ${"♥".repeat(this.hearts)}${"♡".repeat(3-this.hearts)}     Portal: ${ready?"ACTIVO":"INACTIVO"}${bossStatus}`]);}
  showMessage(text,duration=1800){this.message.setText(text).setVisible(true);this.messageTimer?.remove(false);this.messageTimer=this.time.delayedCall(duration,()=>this.message.setVisible(false));}
  activePower(){const unlocked=this.saveData.unlockedPowers.length?this.saveData.unlockedPowers:["fire"];this.powerIndex=Phaser.Math.Wrap(this.powerIndex,0,unlocked.length);return unlocked[this.powerIndex];}
  persistRun(){this.saveData.currentRun={worldIndex:this.worldIndex,checkpoint:{...this.respawnPoint},collected:[...this.collectedIds],hearts:this.hearts,bossDefeated:this.bossDefeated};this.saveData.crystals=this.worldIndex*3+this.collected;Object.assign(this.saveData,{worldIndex:this.worldIndex,hero:this.hero,activePower:this.activePower()});writeSave(this.saveData);}
  spawnEnemy(s){const isBoss=Boolean(s.isBoss);const speed=isBoss?48:65,texture=isBoss?`enemy-${s.type}`:`enemy-${s.type}-0`;const e=this.enemies.create(s.x,s.y,texture).setDisplaySize(isBoss?138:72,isBoss?120:57).setCollideWorldBounds(true).setVelocityX(speed);Object.assign(e,{enemyType:s.type,minX:s.minX,maxX:s.maxX,hp:s.hp??(s.type==="crab"?2:1),maxHp:s.hp??(s.type==="crab"?2:1),frozenUntil:0,isBoss,speed,animFrame:0,nextAnimAt:this.time.now+Phaser.Math.Between(0,160)});if(isBoss)this.boss=e;}
  collectCrystal(_p,c){const crystalId=c.crystalId;this.collectedIds.add(crystalId);c.destroy();this.collected=this.collectedIds.size;audio.play("crystal");this.persistRun();if(this.praderaMode)this.refreshPraderaProgress(crystalId);if(this.collected===3){if(this.bossDefeated)this.portalVisual.setTexture("portal-active");this.showMessage(this.bossDefeated?"¡Portal activado! Llega al final del mundo.":"Cristales completos · derrota al jefe para abrir el portal.",2400);}this.updateHud();}
  activateCheckpoint(){const next={x:this.checkpoint.x,y:this.checkpoint.y-100};if(this.respawnPoint.x===next.x)return;this.respawnPoint=next;this.checkpoint.setTint(0x6effa8);this.persistRun();audio.play("checkpoint");this.showMessage("Checkpoint y progreso guardados",1500);}
  useBounce(player){if(player.body.velocity.y>=0){player.setVelocityY(-850);audio.play("jump");}}
  touchHazard(_p,h){if(h.hazardKind==="slow")this.player.setVelocityX(this.player.body.velocity.x*.38);else this.damagePlayer(h.x);}
  touchEnemy(player,enemy){if(player.body.velocity.y>130&&player.y<enemy.y-15){this.damageEnemy(enemy,enemy.isBoss?1:enemy.hp,"ice");player.setVelocityY(-430);}else this.damagePlayer(enemy.x);}
  damagePlayer(sourceX){if(this.time.now<this.invulnerableUntil)return;this.invulnerableUntil=this.time.now+1300;this.hearts--;this.player.setTint(0xff6b6b).setVelocity(sourceX<this.player.x?360:-360,-420);this.time.delayedCall(350,()=>this.player?.clearTint());audio.play("hit");this.updateHud();if(this.hearts<=0)this.time.delayedCall(450,()=>this.respawn(true));else this.persistRun();}
  damageEnemy(enemy,amount,power){if(!enemy.active)return;enemy.hp-=amount;enemy.setTint(COLORS[power]);this.time.delayedCall(140,()=>enemy.active&&enemy.clearTint());this.updateHud();if(enemy.hp>0)return;if(enemy.isBoss){this.bossDefeated=true;this.showMessage("¡Jefe derrotado! El portal dimensional responde.",2400);if(this.collected===3)this.portalVisual.setTexture("portal-active");this.persistRun();this.updateHud();}enemy.destroy();audio.play("enemy");}
  hitEnemy(shot,enemy){const power=shot.power;shot.destroy();if(power==="ice")enemy.frozenUntil=this.time.now+(enemy.isBoss?900:2200);if(power==="water")enemy.setVelocityX((enemy.x>this.player.x?1:-1)*(enemy.isBoss?120:300));this.damageEnemy(enemy,power==="fire"||power==="lightning"?2:1,power);if(power==="lightning")this.enemies.getChildren().filter(other=>other.active&&other!==enemy&&Phaser.Math.Distance.Between(enemy.x,enemy.y,other.x,other.y)<230).slice(0,1).forEach(other=>this.damageEnemy(other,1,"lightning"));}
  enterPortal(){
    if(this.collected<3){if(!this.portalReminder||this.time.now>this.portalReminder){this.portalReminder=this.time.now+1800;this.showMessage(`Faltan ${3-this.collected} cristales para abrir el portal.`,1400);}return;}
    if(!this.bossDefeated){if(!this.portalReminder||this.time.now>this.portalReminder){this.portalReminder=this.time.now+1800;this.showMessage("Derrota al jefe de este mundo para abrir el portal.",1400);}return;}
    if(this.transitioning)return;this.transitioning=true;const reward=this.worldData.power;if(!this.saveData.unlockedPowers.includes(reward))this.saveData.unlockedPowers.push(reward);audio.play("portal");
    if(this.worldIndex===worlds.length-1){this.saveData.completed=true;this.saveData.crystals=21;writeSave(this.saveData);this.scene.start("victory",{save:this.saveData});return;}
    Object.assign(this.saveData,{worldIndex:this.worldIndex+1,hero:this.hero,crystals:(this.worldIndex+1)*3,currentRun:freshRun(this.worldIndex+1)});writeSave(this.saveData);this.scene.restart({worldIndex:this.worldIndex+1,save:this.saveData});
  }
  respawn(fullHeal=false){if(fullHeal)this.hearts=3;this.player.enableBody(true,this.respawnPoint.x,this.respawnPoint.y,true,true).setVelocity(0,0).clearTint();this.invulnerableUntil=this.time.now+900;this.persistRun();this.updateHud();}
  switchHero(){this.hero=this.hero==="boy"?"girl":"boy";this.saveData.hero=this.hero;this.setHeroState("idle");writeSave(this.saveData);this.showMessage(`${HEROES[this.hero]} toma el relevo · sigue siendo 1 jugador`,1700);this.updateHud();}
  cyclePower(direction=1){this.powerIndex=Phaser.Math.Wrap(this.powerIndex+direction,0,this.saveData.unlockedPowers.length||1);this.saveData.activePower=this.activePower();writeSave(this.saveData);this.updateHud();}
  shoot(){if(this.time.now<this.nextShotAt)return;this.nextShotAt=this.time.now+330;const power=this.activePower(),direction=this.player.flipX?-1:1;const shot=this.projectiles.create(this.player.x+direction*44,this.player.y-10,`shot-${power}`);shot.power=power;shot.setVelocityX(direction*(power==="lightning"?720:560));shot.body.setAllowGravity(power==="fire");if(power==="fire")shot.setVelocityY(-80);this.time.delayedCall(1800,()=>shot.active&&shot.destroy());audio.play("shoot");}
  readControls(){
    const pad=firstGamepad(),pressed=new Set();pad?.buttons.forEach((b,i)=>b.pressed&&pressed.add(i));const edge=i=>pressed.has(i)&&!this.padPrevious.has(i),touchEdge=k=>touchState[k]&&!this.touchPrevious[k],axis=Math.abs(pad?.axes?.[0]||0)>.2?pad.axes[0]:0;
    const jumpHeld=this.keys.jump.isDown||this.keys.up.isDown||this.keys.w.isDown||pressed.has(0)||touchState.jump;
    const c={left:this.keys.left.isDown||this.keys.a.isDown||touchState.left||axis<-.2||pressed.has(14),right:this.keys.right.isDown||this.keys.d.isDown||touchState.right||axis>.2||pressed.has(15),jump:Phaser.Input.Keyboard.JustDown(this.keys.jump)||Phaser.Input.Keyboard.JustDown(this.keys.up)||Phaser.Input.Keyboard.JustDown(this.keys.w)||edge(0)||touchEdge("jump"),jumpHeld,power:Phaser.Input.Keyboard.JustDown(this.keys.power)||Phaser.Input.Keyboard.JustDown(this.keys.powerAlt)||edge(2)||edge(1)||touchEdge("power"),change:Phaser.Input.Keyboard.JustDown(this.keys.change)||edge(3)||touchEdge("switch"),cycleNext:Phaser.Input.Keyboard.JustDown(this.keys.cycle)||Phaser.Input.Keyboard.JustDown(this.keys.cycleAlt)||edge(5),cyclePrev:edge(4),pause:Phaser.Input.Keyboard.JustDown(this.keys.pause)||Phaser.Input.Keyboard.JustDown(this.keys.pauseAlt)||edge(9)||touchEdge("pause"),respawn:Phaser.Input.Keyboard.JustDown(this.keys.respawn)||edge(8),mute:Phaser.Input.Keyboard.JustDown(this.keys.mute)};
    this.padPrevious=pressed;this.touchPrevious={...touchState};this.padStatus.setText(pad?`Joystick conectado\n${HEROES[this.hero]} · 1 jugador`:"Joystick no conectado\nTeclado · 1 jugador");return c;
  }
  togglePause(){this.paused=!this.paused;this.pausePanel.setVisible(this.paused);if(this.paused)this.physics.world.pause();else this.physics.world.resume();}
  update(){
    const input=this.readControls();if(input.pause&&!this.ridingBoat)this.togglePause();if(input.mute)this.showMessage(audio.toggle()?"Sonido silenciado":"Sonido activado",1000);if(this.paused){if(input.respawn){this.togglePause();this.respawn(true);}return;}if(this.ridingBoat){this.setHeroState("idle");return;}
    if(input.respawn)this.respawn();if(input.change)this.switchHero();if(input.cycleNext)this.cyclePower(1);if(input.cyclePrev)this.cyclePower(-1);if(input.power)this.shoot();
    let grounded=this.player.body.onFloor()||this.player.body.blocked.down||this.player.body.touching.down;const speed=this.hero==="boy"?305:330,jump=this.hero==="girl"?-650:-610,now=this.time.now;
    if(grounded)this.lastGroundedAt=now;if(input.jump)this.jumpBufferedUntil=now+JUMP_TUNING.bufferMs;
    if(input.left)this.player.setVelocityX(-speed).setFlipX(true);else if(input.right)this.player.setVelocityX(speed).setFlipX(false);else this.player.setVelocityX(this.player.body.velocity.x*.72);
    if(shouldStartJump(now,this.lastGroundedAt,this.jumpBufferedUntil)){this.player.setVelocityY(jump);this.jumpBufferedUntil=-Infinity;this.lastGroundedAt=-Infinity;grounded=false;audio.play("jump");}
    const adjustedJumpVelocity=shortenReleasedJump(this.player.body.velocity.y,this.wasJumpHeld,input.jumpHeld);if(adjustedJumpVelocity!==this.player.body.velocity.y)this.player.setVelocityY(adjustedJumpVelocity);this.wasJumpHeld=input.jumpHeld;
    let state="idle";if(!grounded)state=this.player.body.velocity.y<-40?"jump-airborne":"fall";else if(input.left||input.right)state=Math.abs(this.player.body.velocity.x)>250?"run":"walk-contact";this.setHeroState(state);
    this.enemies.getChildren().forEach(enemy=>{if(!enemy.active)return;if(this.time.now<enemy.frozenUntil){enemy.setVelocityX(0).setTint(0x9fefff);return;}enemy.clearTint();const direction=enemy.body.velocity.x>=0?1:-1;if(enemy.x>=enemy.maxX)enemy.setVelocityX(-enemy.speed);else if(enemy.x<=enemy.minX)enemy.setVelocityX(enemy.speed);else if(Math.abs(enemy.body.velocity.x)<15)enemy.setVelocityX(direction*enemy.speed);enemy.setFlipX(enemy.body.velocity.x<0);if(enemy.isBoss){enemy.setAngle(Math.sin((this.time.now+enemy.x)/260)*2);}else if(this.time.now>=enemy.nextAnimAt){enemy.animFrame=(enemy.animFrame+1)%enemyVisuals[enemy.enemyType].frames;enemy.nextAnimAt=this.time.now+160;enemy.setTexture(`enemy-${enemy.enemyType}-${enemy.animFrame}`).setDisplaySize(72,57);}if(enemy.enemyType==="hopper"&&enemy.body.blocked.down&&Phaser.Math.Between(0,100)<2)enemy.setVelocityY(-430);});
    if(this.player.y>VIEW_HEIGHT+140){this.damagePlayer(this.player.x);this.respawn();}
  }
}

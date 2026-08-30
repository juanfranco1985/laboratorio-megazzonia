import Phaser from "phaser";
import { VIEW_WIDTH, VIEW_HEIGHT, worlds, freshSave } from "../game-data.js";
import { asset, runtimeAssetCount } from "../assets.js";
import { firstGamepad } from "../input.js";
import { audio } from "../audio.js";
import { readSave, clearSave, hasSave } from "../storage.js";

const BUTTON_COLORS=[0x087fa1,0x673daf,0x087d78];

export class MenuScene extends Phaser.Scene {
  constructor(){super("menu");}
  preload(){this.load.image("menu-nexus",asset("ui/menu-nexus-v1.png"));}
  create(){
    this.cameras.main.setBackgroundColor("#070b22");
    this.add.image(VIEW_WIDTH/2,VIEW_HEIGHT/2,"menu-nexus").setDisplaySize(VIEW_WIDTH,VIEW_HEIGHT);
    this.add.rectangle(VIEW_WIDTH/2,73,VIEW_WIDTH,146,0x05091d,.7);
    this.add.rectangle(VIEW_WIDTH/2,VIEW_HEIGHT-135,VIEW_WIDTH,270,0x080b23,.42);
    this.add.text(VIEW_WIDTH/2,62,"JUEGO DELFI 2",{fontFamily:"Georgia, serif",fontStyle:"bold",fontSize:"62px",color:"#ffe29a",stroke:"#321866",strokeThickness:10,shadow:{offsetY:5,color:"#020513",blur:8,fill:true}}).setOrigin(.5);
    this.add.text(VIEW_WIDTH/2,126,"LOS SIETE PORTALES DIMENSIONALES",{fontFamily:"Arial, sans-serif",fontStyle:"bold",fontSize:"18px",letterSpacing:5,color:"#8ff5ff",stroke:"#071126",strokeThickness:4}).setOrigin(.5);
    this.add.rectangle(VIEW_WIDTH/2,174,220,36,0x171442,.86).setStrokeStyle(2,0x9c86ff);
    this.add.text(VIEW_WIDTH/2,174,"✦  1 JUGADOR  ✦",{fontFamily:"Arial, sans-serif",fontStyle:"bold",fontSize:"16px",color:"#ffffff"}).setOrigin(.5);

    const save=readSave(),canContinue=hasSave();this.menuButtons=[];this.selectedIndex=0;
    const startY=canContinue?404:446;
    this.addMenuButton(startY,"NUEVA PARTIDA",()=>{clearSave();this.scene.start("adventure",{worldIndex:0,save:freshSave()});});
    if(canContinue)this.addMenuButton(startY+76,`CONTINUAR · ${worlds[save.worldIndex].name}`,()=>this.scene.start("adventure",{worldIndex:save.worldIndex,save}));
    this.addMenuButton(startY+(canContinue?152:76),"OPCIONES",()=>this.openOptions());
    this.add.text(VIEW_WIDTH/2,680,"↑ ↓ ELEGIR     ENTER / A CONFIRMAR     MOUSE Y PANTALLA TÁCTIL",{fontFamily:"Arial, sans-serif",fontStyle:"bold",fontSize:"15px",color:"#c7d9ff",stroke:"#050719",strokeThickness:4}).setOrigin(.5);
    this.add.text(24,690,`${runtimeAssetCount} recursos`,{fontFamily:"Arial, sans-serif",fontSize:"13px",color:"#8897bd"}).setOrigin(0,.5);
    this.createOptionsPanel();this.selectButton(0);
    this.keys=this.input.keyboard.addKeys({up:"UP",down:"DOWN",w:"W",s:"S",enter:"ENTER",space:"SPACE",escape:"ESC"});
    this.padPrevious=new Set();this.padVertical=0;
  }
  addMenuButton(y,label,action){
    const index=this.menuButtons.length,color=BUTTON_COLORS[index%BUTTON_COLORS.length];
    const container=this.add.container(VIEW_WIDTH/2,y).setDepth(20).setSize(520,66).setInteractive({useHandCursor:true});
    const shadow=this.add.rectangle(0,6,510,64,0x020516,.68).setStrokeStyle(2,0x141b42);
    const box=this.add.rectangle(0,0,500,60,color,.94).setStrokeStyle(3,0x8ef5ff);
    const left=this.add.rectangle(-238,0,17,17,0xffd875).setAngle(45).setStrokeStyle(2,0xffffff);
    const right=this.add.rectangle(238,0,17,17,0xffd875).setAngle(45).setStrokeStyle(2,0xffffff);
    const text=this.add.text(0,0,label,{fontFamily:"Arial Black, sans-serif",fontSize:"22px",color:"#ffffff",stroke:"#071126",strokeThickness:4}).setOrigin(.5);
    container.add([shadow,box,left,right,text]);
    const item={container,box,text,left,right,color,action};this.menuButtons.push(item);
    container.on("pointerover",()=>this.selectButton(index)).on("pointerdown",()=>action());
  }
  selectButton(index){
    this.selectedIndex=Phaser.Math.Wrap(index,0,this.menuButtons.length);
    this.menuButtons.forEach((item,i)=>{const selected=i===this.selectedIndex;item.box.setFillStyle(selected?0x176fb1:item.color,selected?1:.94).setStrokeStyle(selected?4:3,selected?0xffdf83:0x8ef5ff);item.text.setScale(selected?1.06:1);item.left.setFillStyle(selected?0xffffff:0xffd875);item.right.setFillStyle(selected?0xffffff:0xffd875);});
  }
  createOptionsPanel(){
    this.optionsOpen=false;this.optionsPanel=this.add.container(VIEW_WIDTH/2,VIEW_HEIGHT/2).setDepth(80).setVisible(false);
    const shade=this.add.rectangle(0,0,VIEW_WIDTH,VIEW_HEIGHT,0x020515,.82);
    const panel=this.add.rectangle(0,0,720,430,0x0c1234,.98).setStrokeStyle(4,0x8eefff);
    const inner=this.add.rectangle(0,0,690,400,0x171044,.45).setStrokeStyle(1,0x8f76ff);
    const title=this.add.text(0,-156,"OPCIONES DEL NEXO",{fontFamily:"Georgia, serif",fontStyle:"bold",fontSize:"34px",color:"#ffe29a",stroke:"#321866",strokeThickness:6}).setOrigin(.5);
    const controlLines=["TECLADO","WASD / Flechas · mover     Espacio · saltar","X · poder     F · cambiar poder     C · cambiar héroe","","JOYSTICK","Stick / Cruceta · mover     A · saltar","X / B · poder     Y · cambiar héroe     Start · pausa"];
    const controls=this.add.text(0,-36,controlLines.join(String.fromCharCode(10)),{fontFamily:"Arial, sans-serif",fontSize:"19px",color:"#d9e8ff",align:"center",lineSpacing:8}).setOrigin(.5);
    this.soundText=this.add.text(-135,132,audio.muted?"SONIDO: SILENCIADO":"SONIDO: ACTIVO",{fontFamily:"Arial Black, sans-serif",fontSize:"18px",color:"#ffffff",backgroundColor:"#087d78",padding:{x:20,y:13}}).setOrigin(.5).setInteractive({useHandCursor:true});
    const back=this.add.text(170,132,"VOLVER",{fontFamily:"Arial Black, sans-serif",fontSize:"18px",color:"#ffffff",backgroundColor:"#673daf",padding:{x:38,y:13}}).setOrigin(.5).setInteractive({useHandCursor:true});
    this.soundText.on("pointerdown",()=>{const muted=audio.toggle();this.soundText.setText(muted?"SONIDO: SILENCIADO":"SONIDO: ACTIVO");});
    back.on("pointerdown",()=>this.closeOptions());this.optionsPanel.add([shade,panel,inner,title,controls,this.soundText,back]);
  }
  openOptions(){this.optionsOpen=true;this.optionsPanel.setVisible(true);}
  closeOptions(){this.optionsOpen=false;this.optionsPanel.setVisible(false);}
  update(){
    const pad=firstGamepad(),pressed=new Set();pad?.buttons.forEach((button,index)=>button.pressed&&pressed.add(index));const edge=index=>pressed.has(index)&&!this.padPrevious.has(index);
    const axis=pad?.axes?.[1]||0,vertical=axis>.55?1:axis<-.55?-1:0;
    if(this.optionsOpen){if(Phaser.Input.Keyboard.JustDown(this.keys.escape)||edge(0)||edge(1)||edge(9))this.closeOptions();this.padPrevious=pressed;this.padVertical=vertical;return;}
    const up=Phaser.Input.Keyboard.JustDown(this.keys.up)||Phaser.Input.Keyboard.JustDown(this.keys.w)||edge(12)||(vertical<0&&this.padVertical>=0);
    const down=Phaser.Input.Keyboard.JustDown(this.keys.down)||Phaser.Input.Keyboard.JustDown(this.keys.s)||edge(13)||(vertical>0&&this.padVertical<=0);
    if(up)this.selectButton(this.selectedIndex-1);if(down)this.selectButton(this.selectedIndex+1);
    if(Phaser.Input.Keyboard.JustDown(this.keys.enter)||Phaser.Input.Keyboard.JustDown(this.keys.space)||edge(0))this.menuButtons[this.selectedIndex].action();
    this.padPrevious=pressed;this.padVertical=vertical;
  }
}

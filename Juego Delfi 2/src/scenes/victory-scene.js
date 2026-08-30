import Phaser from "phaser";
import { VIEW_WIDTH, VIEW_HEIGHT } from "../game-data.js";
import { asset } from "../assets.js";

export class VictoryScene extends Phaser.Scene {
  constructor(){super("victory");}
  preload(){this.load.image("menu-nexus",asset("ui/menu-nexus-v1.png"));}
  create(){
    this.cameras.main.setBackgroundColor("#070b22");
    this.add.image(VIEW_WIDTH/2,VIEW_HEIGHT/2,"menu-nexus").setDisplaySize(VIEW_WIDTH,VIEW_HEIGHT).setTint(0xb7c9ff);
    this.add.rectangle(VIEW_WIDTH/2,VIEW_HEIGHT/2,VIEW_WIDTH,VIEW_HEIGHT,0x050819,.42);
    this.add.rectangle(VIEW_WIDTH/2,390,920,500,0x0b1030,.88).setStrokeStyle(4,0x8eefff);
    this.add.image(VIEW_WIDTH/2,215,"reunion-beacon").setDisplaySize(150,178);
    this.add.text(VIEW_WIDTH/2,342,"¡LOS SIETE PORTALES ESTÁN A SALVO!",{fontFamily:"Georgia, serif",fontStyle:"bold",fontSize:"38px",color:"#ffe29a",stroke:"#321866",strokeThickness:8,align:"center",wordWrap:{width:850}}).setOrigin(.5);
    this.add.text(VIEW_WIDTH/2,430,"Completaste la aventura y reuniste los 21 cristales del Nexo.",{fontFamily:"Arial, sans-serif",fontSize:"23px",color:"#b8f6ff"}).setOrigin(.5);
    const box=this.add.rectangle(VIEW_WIDTH/2,550,390,62,0x673daf,.96).setStrokeStyle(3,0xffdf83).setInteractive({useHandCursor:true});
    this.add.text(VIEW_WIDTH/2,550,"VOLVER AL MENÚ",{fontFamily:"Arial Black, sans-serif",fontSize:"22px",color:"#fff",stroke:"#071126",strokeThickness:4}).setOrigin(.5);
    const go=()=>this.scene.start("menu");box.on("pointerover",()=>box.setFillStyle(0x176fb1)).on("pointerout",()=>box.setFillStyle(0x673daf)).on("pointerdown",go);this.input.keyboard.once("keydown-ENTER",go);
  }
}

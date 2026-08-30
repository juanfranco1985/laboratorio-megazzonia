import { access, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { worlds, movementStates, powers } from "../src/game-data.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../assets/runtime");
const expected=[];
expected.push("ui/menu-nexus-v1.png");
for(const hero of ["boy","girl"]){
  for(const state of movementStates)expected.push(`characters/${hero}/${state}-v1.png`);
  for(const power of powers)expected.push(`characters/powers/${hero}-${power}-v1.png`);
}
for(const name of ["universe-crystal","heart","checkpoint","portal-active","portal-dormant","reunion-beacon"])expected.push(`shared/${name}-v1.png`);
for(const world of worlds){
  expected.push(`worlds/${world.id}/background.png`);
  for(const key of new Set([world.ground,world.ledge,world.bridge,world.bounce,world.hazard,world.portal,"checkpoint"]))expected.push(`worlds/${world.id}/sprites/${key}-v1.png`);
}
const missing=[];
for(const relative of expected){try{await access(path.join(root,relative));}catch{missing.push(relative);}}
async function countPng(directory){let count=0;for(const item of await readdir(directory,{withFileTypes:true})){const full=path.join(directory,item.name);count+=item.isDirectory()?await countPng(full):Number(item.name.endsWith(".png"));}return count;}
if(missing.length)throw new Error(`Faltan recursos:\n${missing.join("\n")}`);
const count=await countPng(root);
if(count<90)throw new Error(`Se esperaban al menos 90 PNG y se encontraron ${count}`);
console.log(`Recursos verificados: ${expected.length} referencias, ${count} PNG disponibles.`);

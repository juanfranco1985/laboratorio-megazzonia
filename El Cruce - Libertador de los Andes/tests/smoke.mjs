import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ART, CHAPTERS, LEVEL_LENGTH, WORLD_LAYOUT } from "../src/data/expedition.js";
import { terrainHeightAt } from "../src/systems/terrain.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/main.js"), "utf8");
assert.equal(CHAPTERS.length, 7, "La expedición debe tener siete capítulos");
assert.equal(LEVEL_LENGTH, 17200, "La travesía debe tener la extensión de Expedición");
assert.ok(terrainHeightAt(0) - terrainHeightAt(14800) > 850, "El ascenso debe superar 850 px");
assert.ok(terrainHeightAt(17200) - terrainHeightAt(14800) > 450, "Debe existir un descenso perceptible");
assert.equal(WORLD_LAYOUT.preparationStations.length, 3, "Plumerillo necesita tres tareas");
assert.ok(WORLD_LAYOUT.bridge.end - WORLD_LAYOUT.bridge.start >= 400, "El puente debe cruzar una quebrada real");
assert.match(source, /cameraY/, "La cámara debe seguir altura y distancia");
assert.ok(source.includes("drawBridge(ctx)"), "Debe representarse el puente colectivo");
assert.ok(source.includes("this.preparation.complete"), "Debe bloquearse la salida hasta preparar la columna");
for (const asset of [...Object.values(ART.backgrounds), ART.sanMartin, ART.sanMartinAtlas, ART.sanMartinWalkAtlas, ART.expeditionAtlas, ART.propsAtlas, ART.logisticsAtlas]) {
  assert.ok(fs.existsSync(path.join(root, asset.startsWith("./") ? asset.slice(2) : asset)), "Falta el recurso " + asset);
}
console.log("Smoke v0.5.0 OK · 7 capítulos · ascenso, preparación y puente verificados");

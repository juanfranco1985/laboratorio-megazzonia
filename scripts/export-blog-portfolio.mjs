import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
const profile = profileArg?.split("=")[1] === "hosting" || process.argv.includes("--hosting")
  ? "hosting"
  : "complete";
const isHostingProfile = profile === "hosting";
const outputDirName = isHostingProfile ? "blog-portafolio-hosting" : "blog-portafolio-export";
const outputDir = path.join(workspaceRoot, outputDirName);
const exportVersion = "megazzonia-20260513a";
const servePort = isHostingProfile ? "8092" : "8091";
const exportLabel = isHostingProfile ? "version para hosting" : "paquete completo";

const globalSkipNames = new Set([
  ".git",
  ".gradle",
  ".gradle-local",
  ".pytest_cache",
  ".vite",
  "__pycache__",
  "build",
  "coverage",
  "node_modules",
  "tests"
]);

const globalSkipFiles = new Set([
  "stdout",
  "server-8080.err",
  "server-8080.log",
  "server-8090.err",
  "server-8090.log"
]);

const globalSkipExtensions = new Set([
  ".err",
  ".log",
  ".pyc",
  ".tmp",
  ".zip"
]);

const copiedEntries = [];

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function ensureInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function shouldCopy(sourcePath, localSkipNames = new Set()) {
  const baseName = path.basename(sourcePath);
  const extension = path.extname(baseName).toLowerCase();
  if (localSkipNames.has(baseName)) {
    return false;
  }
  if (globalSkipNames.has(baseName) || globalSkipFiles.has(baseName)) {
    return false;
  }
  return !globalSkipExtensions.has(extension);
}

async function assertExists(relativePath) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`No existe el origen requerido: ${relativePath}`);
  }
  return absolutePath;
}

async function copyEntry(sourceRelativePath, targetRelativePath = sourceRelativePath, options = {}) {
  const sourcePath = await assertExists(sourceRelativePath);
  const targetPath = path.join(outputDir, targetRelativePath);
  const localSkipNames = new Set(options.skipNames ?? []);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, {
    recursive: true,
    filter: (source) => shouldCopy(source, localSkipNames)
  });

  copiedEntries.push({
    source: normalizePath(sourceRelativePath),
    target: normalizePath(targetRelativePath)
  });
}

async function copyDirectoryContents(sourceRelativePath, targetRelativePath = ".") {
  const sourcePath = await assertExists(sourceRelativePath);
  const entries = await readdir(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    const sourceEntry = path.join(sourceRelativePath, entry.name);
    const targetEntry = targetRelativePath === "." ? entry.name : path.join(targetRelativePath, entry.name);
    await copyEntry(sourceEntry, targetEntry);
  }
}

async function replaceInExport(relativePath, replacements) {
  const targetPath = path.join(outputDir, relativePath);
  let content = await readFile(targetPath, "utf8");
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  await writeFile(targetPath, content, "utf8");
}

async function writeExportReadme() {
  const readme = `# Laboratorio Megazzonia - ${isHostingProfile ? "version hosting" : "paquete exportable"}

Generado como ${exportLabel} del blog-portafolio.

## Como probar

\`\`\`powershell
cd "${outputDirName}"
python -m http.server ${servePort} --bind 127.0.0.1
\`\`\`

Luego abrir:

- http://127.0.0.1:${servePort}/

Tambien se puede servir desde cualquier hosting estatico. La carpeta fue
preparada para funcionar con rutas relativas.

## Contenido incluido

- Hub web del portfolio en la raiz del paquete.
- Simulador laboral interno y assets locales necesarios.
- Fichas de caso en \`portfolio/projects/\`.
- Capturas reales en \`portfolio/assets/screenshots/\`.
- Builds estaticos ya generados para proyectos Vite principales.
- Demos web estaticas seleccionadas sin \`node_modules\`, zips, logs ni builds nativos.
- READMEs tecnicos para proyectos que quedan como articulo o evidencia.
${isHostingProfile ? "- Fichas y capturas para demos pesadas que se conservan en el paquete completo/local.\n" : ""}

## Contenido no incluido

- Dependencias de desarrollo.
- Carpetas Android nativas de proyectos secundarios.
- Backends, entornos Streamlit, bases de datos privadas o servicios externos.
- Archivos de salida temporales, logs y paquetes zip.
${isHostingProfile ? "- Demos pesadas con audio/imagenes grandes: South American Runner, Cronicas del ultimo piloto, World Pong 2026, Real Turn Pong y Gato & Humano.\n" : ""}

## Nota de publicacion

Antes de subir a hosting publico, ejecutar una prueba HTTP local y revisar
\`EXPORT_MANIFEST.json\` para confirmar el alcance del paquete. La version
hosting no borra ni modifica las demos completas; solo no las copia a este
artefacto.
`;

  await writeFile(path.join(outputDir, "README_EXPORTABLE.md"), readme, "utf8");
}

async function writeExportManifest() {
  const manifest = {
    name: "Laboratorio Megazzonia blog-portafolio",
    version: exportVersion,
    profile,
    generatedAt: new Date().toISOString(),
    root: outputDirName,
    entry: "index.html",
    serveCommand: `python -m http.server ${servePort} --bind 127.0.0.1`,
    notes: [
      "El catalogo exportado usa WORKSPACE_ROOT_PREFIX='.' para resolver rutas internas.",
      "El paquete excluye node_modules, tests, logs, zips y carpetas Android nativas secundarias.",
      "Los proyectos con backend, Streamlit o Android quedan como README/caso, no como demo ejecutable.",
      ...(isHostingProfile
        ? ["El perfil hosting no copia demos pesadas; las tarjetas quedan como ficha/captura y la demo completa permanece en el paquete completo/local."]
        : ["El perfil completo conserva demos pesadas para uso local o backup navegable."])
    ],
    copiedEntries
  };

  await writeFile(
    path.join(outputDir, "EXPORT_MANIFEST.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
}

async function writeServeScript() {
  const batch = `@echo off
cd /d "%~dp0"
python -m http.server ${servePort} --bind 127.0.0.1
`;
  await writeFile(path.join(outputDir, isHostingProfile ? "abrir-hosting.bat" : "abrir-export.bat"), batch, "utf8");
}

async function main() {
  if (!ensureInside(workspaceRoot, outputDir)) {
    throw new Error(`Salida fuera del workspace: ${outputDir}`);
  }

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  await copyDirectoryContents(
    "LABORATORIO MEGAZZONIA estructura blog/android/app/src/main/assets"
  );
  await copyEntry("portfolio");

  await copyEntry("LABORATORIO MEGAZZONIA estructura blog/README.md");
  await copyEntry("LABORATORIO MEGAZZONIA estructura blog/docs");
  await copyEntry("LABORATORIO MEGAZZONIA estructura blog/docs", "docs");

  await copyEntry("Drone Factory");
  await copyEntry("Juego Juan");
  await copyEntry("Tanque CHATGPT", "Tanque CHATGPT", {
    skipNames: ["legacy", "Tanque CHATGPT (codigo no funcional)"]
  });
  await copyEntry("Juegos Procedurales/Buscaminas Procedural", "Juegos Procedurales/Buscaminas Procedural", {
    skipNames: ["android"]
  });
  await copyEntry("Juegos Procedurales/Sopa de letras", "Juegos Procedurales/Sopa de letras", {
    skipNames: ["android"]
  });
  await copyEntry("Juegos Procedurales/Sudoku", "Juegos Procedurales/Sudoku", {
    skipNames: ["android"]
  });
  await copyEntry("Sistema de juegos procedurales 2", "Sistema de juegos procedurales 2", {
    skipNames: ["android", "tests"]
  });
  await copyEntry("Simulador de consumo electrico");

  if (isHostingProfile) {
    await copyEntry("Endless Runner/README.md");
    await copyEntry("Endless Runner/docs");
    await copyEntry("Gato & Humano Ascenso al Rascacielos Celestial/README.md");
  } else {
    await copyEntry("Champions Pong - copia - copia/mundial-de-pong");
    await copyEntry("Cronicas del ultimo piloto");
    await copyEntry("Endless Runner");
    await copyEntry("Gato & Humano Ascenso al Rascacielos Celestial");
    await copyEntry("Real Turn Pong");
  }

  await copyEntry("FlightSimulatorClaude2/dist");
  await copyEntry("FlightSimulatorClaude2/README.md");
  await copyEntry("Motorcraft CODEX 2/dist");
  await copyEntry("Motorcraft CODEX 2/README.md");
  await copyEntry("Simulador de transferencia de calor en disipadores/dist");
  await copyEntry("Simulador de transferencia de calor en disipadores/README.md");
  await copyEntry("Software de Analisis estructural - copia/dist");
  await copyEntry("Software de Analisis estructural - copia/README.md");
  await copyEntry("Software de Analisis estructural - copia/imagen 1.png");
  await copyEntry("Software de Analisis estructural - copia/imagen 2.png");
  await copyEntry("Software de Analisis estructural - copia/imagen 3.png");

  await copyEntry("10 - SOLAR YEAR HISTORICAL DATABASE & ANALYSIS TOOL/README.md");
  await copyEntry("5 - Solar Agriculture Planning System/README.md");
  await copyEntry("9 - Solar Climate Dashboard/README.md");
  await copyEntry("9 - Solar Climate Dashboard/data/madrid_climate_sample.csv");
  await copyEntry("9 - Solar Climate Dashboard/Imagen 1.jpg");
  await copyEntry("9 - Solar Climate Dashboard/Imagen 2.jpg");
  await copyEntry("9 - Solar Climate Dashboard/Imagen 3.jpg");
  await copyEntry("9 - Solar Climate Dashboard/Imagen 4.jpg");
  await copyEntry("ai-product-research/README.md");
  await copyEntry("Proyecto Cuaderno digital inteligente para m\u00fasicos/README.md");
  await copyEntry("RoiAnalyticsAndroid_v3/README.md");

  await replaceInExport("js/portfolioApp.js", [
    ["megazzonia-20260502a", exportVersion]
  ]);
  await replaceInExport("js/data/projectCatalog.js", [
    ['const WORKSPACE_ROOT_PREFIX = "../../../../../../";', 'const WORKSPACE_ROOT_PREFIX = ".";'],
    [
      'readmePath: `${WORKSPACE_ROOT_PREFIX}/LABORATORIO MEGAZZONIA estructura blog/docs/ESTADO_ACTUAL_PROYECTO.md`,',
      'readmePath: `${WORKSPACE_ROOT_PREFIX}/docs/ESTADO_ACTUAL_PROYECTO.md`,'
    ]
  ]);
  await replaceInExport("index.html", [
    [
      'const app = document.getElementById("app");',
      `const app = document.getElementById("app");\n      window.__MEGAZZONIA_PUBLICATION_PROFILE__ = "${profile}";`
    ],
    [
      "Ejecuta abrir-laboratorio.bat o levanta el servidor con cmd /c npm.cmd run dev.",
      `Ejecuta ${isHostingProfile ? "abrir-hosting.bat" : "abrir-export.bat"} o levanta un servidor local con python -m http.server ${servePort} --bind 127.0.0.1.`
    ],
    ["http://127.0.0.1:8090/", `http://127.0.0.1:${servePort}/`]
  ]);
  for (const projectDir of await readdir(path.join(outputDir, "portfolio", "projects"))) {
    const caseIndex = path.join("portfolio", "projects", projectDir, "index.html");
    if (!existsSync(path.join(outputDir, caseIndex))) {
      continue;
    }
    await replaceInExport(caseIndex, [
      [
        "../../../LABORATORIO%20MEGAZZONIA%20estructura%20blog/android/app/src/main/assets/index.html?portfolio=20260513a#projects",
        "../../../index.html?portfolio=20260513a#projects"
      ],
      ["portfolio=20260507a#projects", "portfolio=20260513a#projects"],
      [
        "../../../LABORATORIO%20MEGAZZONIA%20estructura%20blog/android/app/src/main/assets/simulator.html?v=dacs-20260429b#home",
        "../../../simulator.html?v=dacs-20260429b#home"
      ],
      [
        "../../../LABORATORIO%20MEGAZZONIA%20estructura%20blog/docs/ESTADO_ACTUAL_PROYECTO.md",
        "../../../docs/ESTADO_ACTUAL_PROYECTO.md"
      ],
      ["portfolio=20260502a#projects", "portfolio=20260513a#projects"]
    ]);
  }
  if (isHostingProfile) {
    await replaceInExport("portfolio/projects/south-american-runner/index.html", [
      [
        '<a class="case-button" href="../../../Endless%20Runner/index.html">Jugar demo</a>',
        '<span class="case-link">Demo completa local</span>'
      ],
      [
        '<span class="case-pill">Demo web directa</span>',
        '<span class="case-pill">Ficha hosting</span>'
      ],
      [
        `<div class="case-preview">
          <iframe title="South American Runner" src="../../../Endless%20Runner/index.html"></iframe>
        </div>`,
        `<div class="case-preview case-preview--static">
          <img src="../../assets/screenshots/demos/south-american-runner.png" alt="Captura de South American Runner" />
          <p class="case-static-note">La demo interactiva completa queda preservada en el paquete completo/local. Esta version para hosting muestra la ficha y captura para mantener una carga publica liviana.</p>
        </div>`
      ]
    ]);
  }

  await writeExportReadme();
  await writeServeScript();
  await writeExportManifest();

  const outputStats = await stat(outputDir);
  if (!outputStats.isDirectory()) {
    throw new Error("La salida de exportacion no es un directorio.");
  }

  console.log(`Exportacion lista: ${normalizePath(path.relative(workspaceRoot, outputDir))}`);
  console.log(`Entradas copiadas: ${copiedEntries.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


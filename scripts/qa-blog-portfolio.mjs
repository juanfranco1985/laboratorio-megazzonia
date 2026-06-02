import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");

const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
const requestedProfile = profileArg?.split("=")[1] || "all";

const profiles = [
  {
    name: "complete",
    dir: "blog-portafolio-export",
    maxMiB: 420,
    skipHiddenEntries: false
  },
  {
    name: "hosting",
    dir: "blog-portafolio-hosting",
    maxMiB: 25,
    skipHiddenEntries: true
  }
].filter((profile) => requestedProfile === "all" || profile.name === requestedProfile);

if (!profiles.length) {
  console.error(`Perfil no reconocido: ${requestedProfile}`);
  process.exit(1);
}

const localUrlPattern = /\b(?:href|src)=["']([^"']+)["']/gi;
const skippedUrlProtocols = [
  "data:",
  "http:",
  "https:",
  "mailto:",
  "tel:",
  "javascript:"
];

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function cleanUrlPath(value) {
  return value.split("#")[0].split("?")[0].trim();
}

function decodeUrlPath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function shouldCheckUrl(value) {
  const clean = value.trim();
  return clean
    && !clean.includes("${")
    && !clean.startsWith("#")
    && !skippedUrlProtocols.some((protocol) => clean.startsWith(protocol));
}

async function listFiles(root, extensions) {
  const results = [];

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      if (extensions.has(path.extname(entry.name).toLowerCase())) {
        results.push(absolutePath);
      }
    }
  }

  await walk(root);
  return results;
}

async function getDirectorySize(root) {
  let total = 0;

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else {
        total += (await stat(absolutePath)).size;
      }
    }
  }

  await walk(root);
  return total;
}

function existsAsRoute(absolutePath) {
  if (existsSync(absolutePath)) {
    return true;
  }
  return existsSync(`${absolutePath}.html`);
}

function resolveLocalUrl(root, htmlFile, value) {
  const clean = cleanUrlPath(value);
  if (!clean) {
    return null;
  }
  const decoded = decodeUrlPath(clean);
  if (decoded.startsWith("/")) {
    return path.join(root, decoded.slice(1));
  }
  return path.resolve(path.dirname(htmlFile), decoded);
}

async function checkHtmlLinks(root) {
  const htmlFiles = await listFiles(root, new Set([".html"]));
  const missing = [];

  for (const htmlFile of htmlFiles) {
    const content = await import("node:fs/promises").then((fs) => fs.readFile(htmlFile, "utf8"));
    for (const match of content.matchAll(localUrlPattern)) {
      const url = match[1];
      if (!shouldCheckUrl(url)) {
        continue;
      }
      const absolutePath = resolveLocalUrl(root, htmlFile, url);
      if (!absolutePath || existsAsRoute(absolutePath)) {
        continue;
      }
      missing.push({
        file: toPosixPath(path.relative(root, htmlFile)),
        url
      });
    }
  }

  return missing;
}

async function loadCatalog(root) {
  const catalogPath = path.join(root, "js", "data", "projectCatalog.js");
  const moduleUrl = `${pathToFileURL(catalogPath).href}?qa=${Date.now()}`;
  return import(moduleUrl);
}

function checkCatalogPaths(root, projectCatalog, profile) {
  const fields = ["casePath", "readmePath", "screenshotPath"];
  const missing = [];

  for (const project of projectCatalog) {
    const shouldCheckEntry = Boolean(project.entryPath) && !(profile.skipHiddenEntries && project.hosting?.hideEntry);
    if (shouldCheckEntry) {
      fields.unshift("entryPath");
    }

    const uniqueFields = [...new Set(fields)];
    for (const field of uniqueFields) {
      if (!project[field]) {
        continue;
      }
      if (field === "entryPath" && !shouldCheckEntry) {
        continue;
      }
      const clean = decodeUrlPath(cleanUrlPath(project[field])).replace(/\/$/, "");
      const absolutePath = path.resolve(root, clean);
      if (!existsAsRoute(absolutePath)) {
        missing.push({
          id: project.id,
          field,
          path: project[field]
        });
      }
    }
  }

  return missing;
}

async function qaProfile(profile) {
  const root = path.join(workspaceRoot, profile.dir);
  if (!existsSync(root)) {
    return {
      profile: profile.name,
      ok: false,
      error: `No existe ${profile.dir}`
    };
  }

  const sizeBytes = await getDirectorySize(root);
  const sizeMiB = sizeBytes / 1024 / 1024;
  const { projectCatalog } = await loadCatalog(root);
  const catalogMissing = checkCatalogPaths(root, projectCatalog, profile);
  const htmlMissing = await checkHtmlLinks(root);
  const sizeExceeded = sizeMiB > profile.maxMiB;

  return {
    profile: profile.name,
    dir: profile.dir,
    projects: projectCatalog.length,
    sizeMiB: Number(sizeMiB.toFixed(2)),
    maxMiB: profile.maxMiB,
    catalogMissing,
    htmlMissing,
    sizeExceeded,
    ok: !catalogMissing.length && !htmlMissing.length && !sizeExceeded
  };
}

const results = [];
for (const profile of profiles) {
  results.push(await qaProfile(profile));
}

for (const result of results) {
  console.log(`\n[${result.profile}] ${result.ok ? "OK" : "ERROR"}`);
  if (result.error) {
    console.log(result.error);
    continue;
  }
  console.log(`dir: ${result.dir}`);
  console.log(`proyectos: ${result.projects}`);
  console.log(`peso: ${result.sizeMiB} MiB / limite ${result.maxMiB} MiB`);
  console.log(`faltantes catalogo: ${result.catalogMissing.length}`);
  console.log(`faltantes html: ${result.htmlMissing.length}`);
  if (result.catalogMissing.length) {
    console.log(JSON.stringify(result.catalogMissing, null, 2));
  }
  if (result.htmlMissing.length) {
    console.log(JSON.stringify(result.htmlMissing.slice(0, 50), null, 2));
  }
}

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}

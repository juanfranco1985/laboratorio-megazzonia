import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const port = Number(process.env.PORT || 8092);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png" };

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(root, requested);
  if (!target.startsWith(`${root}${path.sep}`) || !existsSync(target) || statSync(target).isDirectory()) {
    response.writeHead(404).end("No encontrado"); return;
  }
  response.setHeader("Content-Type", types[path.extname(target).toLowerCase()] || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");
  createReadStream(target).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`El Cruce disponible en http://127.0.0.1:${port}`));

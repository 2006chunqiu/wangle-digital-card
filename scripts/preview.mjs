import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.join(projectRoot, "dist");
const port = Number(process.env.PORT) || 4173;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json"
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    let pathname = decodeURIComponent(requestUrl.pathname);

    if (pathname.endsWith("/")) pathname += "index.html";

    const absolute = path.resolve(root, "." + pathname);
    if (absolute !== root && !absolute.startsWith(root + path.sep)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    let filePath = absolute;
    let info;

    try {
      info = await stat(filePath);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    if (info.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      info = await stat(filePath);
    }

    response.writeHead(200, {
      "Content-Type": mime[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
    console.error(error);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log("Preview running at http://127.0.0.1:" + port);
  console.log("Serving " + root);
});

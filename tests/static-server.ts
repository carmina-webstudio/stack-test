// Tiny static server for the browser tests: serves the pre-rendered site in .output/public the
// way Netlify does (/quote → quote/index.html; unknown addresses → the 404 page with status 404;
// POSTs to the form endpoint answer 200 like Netlify Forms). Node built-ins only.
//
// Run: node --experimental-strip-types tests/static-server.ts  (PORT env, default 4173)

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../.output/public", import.meta.url));
const PORT = Number(process.env["PORT"] ?? 4173);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

/** The file for a URL path, or undefined. Never leaves ROOT. */
function resolve(urlPath: string) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  for (const candidate of [
    join(ROOT, safe),
    join(ROOT, safe, "index.html"),
    join(ROOT, `${safe}.html`),
  ]) {
    if (candidate.startsWith(ROOT) && existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return undefined;
}

if (!existsSync(ROOT)) {
  console.error("No .output/public: run `npm run build` first.");
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "POST") {
    // Netlify Forms accepts the POST and answers 200; the tests intercept it before it gets here.
    req.resume();
    req.on("end", () => res.writeHead(200, { "Content-Type": "text/plain" }).end("OK"));
    return;
  }
  const file = resolve(url.pathname);
  const status = file ? 200 : 404;
  const body = file ?? join(ROOT, "404", "index.html");
  res.writeHead(status, {
    "Content-Type": TYPES[extname(body).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(body).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Serving .output/public on http://127.0.0.1:${PORT}`);
});

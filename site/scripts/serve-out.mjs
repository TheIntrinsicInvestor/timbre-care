import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

/**
 * Static server for `out/`, used to run the Playwright tests against the built
 * export rather than against `next dev`. Resolves a bare `/demo` the way a
 * static host does: the file, then the directory index. No dependency to
 * install, so it cannot fail halfway through a deadline.
 */
const ROOT = "out";
const PORT = Number(process.env.PORT ?? 3100);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const resolve = (urlPath) => {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0]))
    .replace(/^(\.\.[/\\])+/, "");
  for (const c of [join(ROOT, clean), join(ROOT, clean, "index.html"), join(ROOT, `${clean}.html`)]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
};

createServer((req, res) => {
  const file = resolve(req.url ?? "/");
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("404");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));

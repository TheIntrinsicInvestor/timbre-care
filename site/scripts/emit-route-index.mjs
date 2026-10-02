import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Next 16 writes an exported route to `out/demo.html`, not `out/demo/index.html`.
 * Whether a given static host resolves a bare `/demo` to `demo.html` is host
 * behaviour, not something the build guarantees, and three of the four routes
 * being a 404 is the whole submission link. Mirroring each into a directory
 * index makes `/demo` and `/demo/` both work anywhere, and costs a few KB.
 */
const OUT = "out";
// `_not-found` and `404` are the host's own error pages; giving them directory
// indexes would make /404 a real route.
const SKIP = new Set(["index.html", "404.html", "_not-found.html"]);

const made = [];
for (const f of readdirSync(OUT)) {
  if (!f.endsWith(".html") || SKIP.has(f)) continue;
  const name = f.slice(0, -".html".length);
  const dir = join(OUT, name);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  copyFileSync(join(OUT, f), join(dir, "index.html"));
  made.push(`${name}/index.html`);
}

console.log("route indexes:", made.length ? made.join(", ") : "none");

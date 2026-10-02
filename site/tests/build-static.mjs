import { existsSync } from "node:fs";

const required = [
  "out/index.html",
  "out/demo/index.html",
  "out/agent/index.html",
  "out/record/index.html",
];
const missing = required.filter((p) => !existsSync(p));
if (missing.length) {
  console.error("MISSING:", missing.join(", "));
  process.exit(1);
}
console.log("static export ok:", required.length, "routes");

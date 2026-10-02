import { readFileSync } from "node:fs";

/**
 * Contrast is a property of the token, not of any one use of it. --muted was
 * shipped at #898781 (3.50:1) and had to be changed globally; this test is so
 * that never happens silently again, and so the inverted tokens added for the
 * dark acts are held to the same AAA bar copy-audit.mjs enforces at runtime.
 *
 * Read as text, not through getComputedStyle: this must be runnable before a
 * dev server exists, and a token that is never used on a page would escape a
 * DOM sweep entirely.
 */
const css = readFileSync("src/app/globals.css", "utf8");
const fail = [];

const tok = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) { fail.push(`token --${name} not found in globals.css`); return null; }
  return m[1];
};

const lum = (h) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const surface = tok("surface"), ink = tok("ink");

// Body text is held to AAA on the page ground. copy-audit samples
// p/li/dd/figcaption at runtime and fails below 7; --body is what those
// elements resolve to.
{
  const v = tok("body");
  if (v) {
    const r = ratio(v, surface);
    if (r < 7)
      fail.push(`--body ${v} on --surface is ${r.toFixed(2)}:1, must be >= 7 (AAA)`);
  }
}

// The mono field label is not sampled by copy-audit (it is a <div>), so it is
// held to AA rather than AAA. --muted is 5.03:1 on --surface by decision.
{
  const v = tok("muted");
  if (v) {
    const r = ratio(v, surface);
    if (r < 4.5)
      fail.push(`--muted ${v} on --surface is ${r.toFixed(2)}:1, must be >= 4.5 (AA)`);
  }
}

// The site is bright throughout, by decision. An inverted text token only
// exists to make a dark section readable, so its reappearance means a dark
// ground has come back with it. --ink stays, as a foreground and as the device
// chrome; what is banned is a light-on-dark TEXT token.
for (const dead of ["body-inv", "muted-inv", "rule-inv"])
  if (new RegExp(`--${dead}:`).test(css))
    fail.push(`--${dead} is back in globals.css; the site is bright throughout and has no dark sections`);
if (!ink) fail.push("--ink is missing; it is still the foreground and the device chrome");

if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log("tokens ok");

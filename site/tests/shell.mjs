import { chromium } from "playwright";

const base = process.env.BASE ?? "http://127.0.0.1:3000";
const b = await chromium.launch();
const p = await b.newPage();

// Next 16 refuses /_next/* asset requests from a dev origin it does not
// recognise, so hitting the dev server on 127.0.0.1 while it binds localhost
// returns 403 for the client chunks: CSS still lands, the page still looks
// right, and nothing hydrates. Fail loudly instead of testing a dead page.
const blocked = [];
p.on("response", (r) => {
  if (r.status() === 403 && r.url().includes("/_next/")) blocked.push(r.url());
});

await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base, { waitUntil: "networkidle" });

const fail = [];
if (blocked.length)
  fail.push(`${blocked.length} /_next/ assets returned 403 from ${base}. ` +
            `Use localhost rather than 127.0.0.1 against next dev.`);

// Another Next project may already hold port 3000, in which case `next dev`
// silently moves to 3001 and a test pointed at the default passes or fails
// against somebody else's site. Confirm we are on ours before asserting.
const title = await p.title();
if (title !== "Timbre Care")
  fail.push(`${base} served "${title}", not Timbre Care. Wrong port?`);

// The nav's accent CTA to the live console was removed on 2026-08-09: the
// console is embedded on /record at every width, so a second door to it was
// noise. This asserted the CTA was not dimmed by .cc-nav a { opacity: .6 }.
// tests/nav.mjs now asserts the opposite, that no route links to the console
// outside that embed, so nothing is lost by dropping it here.
if (await p.locator("a.cc-cta").count() > 0)
  fail.push("the nav CTA is back; the console is reached from /record's embed only");

// Switzer must actually load, not silently fall back. document.fonts.check()
// cannot resolve a CSS custom property, so read the resolved family off the
// headline and confirm a face with that name reached status "loaded". Checking
// the family string alone would pass while rendering in system-ui.
const font = await p.evaluate(async () => {
  await document.fonts.ready;
  const strip = (s) => s.trim().replace(/^["']|["']$/g, "");
  const fam = strip(getComputedStyle(document.querySelector("h1")).fontFamily.split(",")[0]);
  const loaded = [...document.fonts].filter(
    (f) => strip(f.family) === fam && f.status === "loaded");
  return { fam, loaded: loaded.length };
});
if (!font.fam.toLowerCase().includes("switzer"))
  fail.push(`headline resolves to "${font.fam}", expected a Switzer face`);
if (font.loaded === 0)
  fail.push(`no loaded font face named "${font.fam}"; it fell back`);

// Nav must be one line.
const h = await p.locator("nav.cc-nav").evaluate((el) => el.getBoundingClientRect().height);
if (h > 80) fail.push(`nav is ${h}px tall, expected <= 80`);

// The tool-call log is the 40-point criterion made visible and was a panel
// inside a light column. It is the act now: full width, on --ink, with the page
// ground returning underneath it.
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base + "/agent", { waitUntil: "networkidle" });
const logAct = await p.evaluate(() => {
  const a = document.querySelector(".cc-agent-act");
  if (!a) return null;
  return {
    w: a.getBoundingClientRect().width,
    hasLog: !!a.querySelector(".cc-log"),
  };
});
if (!logAct) fail.push("/agent: no full-bleed act around the tool-call log");
else {
  if (logAct.w < 1400)
    fail.push(`/agent: the log act is ${Math.round(logAct.w)}px wide at 1440, expected full bleed`);
  if (!logAct.hasLog) fail.push("/agent: the log is not inside its act");
}

// The console iframe is cross-origin and follows the visitor's own OS theme, so
// a dark section around it would put a light panel inside black for one visitor
// and a dark panel inside black for another. It stays on the page ground, and
// this asserts nobody "improves" it later for consistency with /agent.
await p.goto(base + "/record", { waitUntil: "networkidle" });
const embedGround = await p.evaluate(() => {
  const e = document.querySelector(".cc-embed");
  if (!e) return null;
  for (let n = e; n; n = n.parentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    const m = bg.match(/[\d.]+/g);
    if (m && (m.length < 4 || Number(m[3]) === 1)) return bg;
  }
  return getComputedStyle(document.body).backgroundColor;
});
if (embedGround === "rgb(11, 11, 11)")
  fail.push("/record: the console embed is on --ink; it is a cross-origin light iframe and must stay on the page ground");

// The interior routes opened on a bare h1 with no field label, which is the
// site's signature and the reason it does not read as templated.
for (const r of ["/record", "/agent"]) {
  await p.goto(base + r, { waitUntil: "networkidle" });
  const n = await p.locator(".cc-hero-left .cc-label").count();
  if (!n) fail.push(`${r}: the header has no field label`);
}

// The interstitial stays a full-bleed act, which is what makes the turn between
// the two acts deliberate rather than a second pin glitching. Its ground is the
// page's; copy-audit's sweep is what holds that.
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base + "/demo", { waitUntil: "networkidle" });
const turn = await p.evaluate(() => {
  const t = document.querySelector(".cc-turn.cc-act");
  return t ? t.getBoundingClientRect().width : null;
});
if (turn === null) fail.push("/demo: the act interstitial is not the full-bleed turn");
else if (turn < 1400)
  fail.push(`/demo: the act interstitial is ${Math.round(turn)}px wide at 1440, expected full bleed`);

// The nav is pinned on every route and must stay legible and on top: it sits
// over footage on /, over a pinned scrub on / and /demo, and over an iframe on
// /record. Opaque ground and a z-index above the pinned sections.
for (const r of ["/", "/demo", "/agent", "/record"]) {
  await p.goto(base + r, { waitUntil: "networkidle" });
  await p.evaluate(() => window.scrollTo(0, 1400));
  await p.waitForTimeout(350);
  const nav = await p.evaluate(() => {
    const n = document.querySelector("nav.cc-nav");
    if (!n) return null;
    const b = n.getBoundingClientRect();
    const st = getComputedStyle(n);
    const m = st.backgroundColor.match(/[\d.]+/g);
    return {
      top: Math.round(b.top),
      opaque: !!m && (m.length < 4 || Number(m[3]) === 1),
      position: st.position,
      z: st.zIndex,
    };
  });
  if (!nav) { fail.push(`${r}: no nav`); continue; }
  if (nav.top !== 0)
    fail.push(`${r}: nav is at ${nav.top}px after scrolling 1400; it must stay pinned to the top`);
  if (!nav.opaque)
    fail.push(`${r}: the pinned nav's ground is not opaque; it sits over footage and a scrub`);
  if (nav.position !== "sticky" && nav.position !== "fixed")
    fail.push(`${r}: nav position is ${nav.position}, expected sticky`);
  if (!nav.z || Number(nav.z) < 10)
    fail.push(`${r}: nav z-index is ${nav.z}; it must sit above the pinned sections`);
}

await b.close();
if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log("shell ok:", font.loaded, "Switzer faces loaded");

import { chromium } from "playwright";

/**
 * Clicks every nav link from every route. This exists because every other test
 * navigates by URL, and a routing defect that only appears when a human clicks
 * shipped to the live site undetected: Next's client router 404'd on the
 * exported payload path and eventually replaced the whole page, nav included,
 * with an error screen.
 */
const base = process.env.BASE ?? "http://127.0.0.1:3000";
const LABELS = ["Home", "How it works", "Behind the scenes", "The record"];

const b = await chromium.launch();
const p = await b.newPage();
const notFound = [];
p.on("response", (r) => {
  if (r.status() >= 400) notFound.push(`${r.status()} ${r.url().replace(base, "")}`);
});
await p.setViewportSize({ width: 1440, height: 900 });

const fail = [];
await p.goto(base, { waitUntil: "networkidle" });

// Two full passes: the failure only appeared on the second visit to a route.
// These are plain anchors, so every click is a full document load. `noWaitAfter`
// plus an explicit wait is required: Playwright's default post-click actionability
// check races the navigation that the click itself started, and a fixed timeout
// is not a load event over a real network.
for (let pass = 0; pass < 2; pass++) {
  for (const label of LABELS) {
    await p.locator(`nav.cc-nav a:text-is("${label}")`)
      .click({ timeout: 8000, noWaitAfter: true })
      .catch((e) => fail.push(`pass ${pass}: could not click "${label}": ${e.message.split("\n")[0]}`));
    await p.waitForLoadState("domcontentloaded").catch(() => {});
    const ok = await p.waitForSelector("nav.cc-nav", { timeout: 8000 }).then(() => true, () => false);
    if (!ok) {
      const h1 = await p.locator("h1").first().innerText().catch(() => "?");
      fail.push(`pass ${pass}: after "${label}" there is no nav, page reads "${h1}"`);
      break;
    }
  }
}

if (notFound.length) fail.push(`HTTP errors: ${[...new Set(notFound)].join(", ")}`);

// The brand mark, on every route, in the accent. DESIGN.md names this as accent
// home 5 and scopes it to the nav and the favicon; asserting the colour here is
// what stops "the mark is in the nav" quietly becoming a grey mark, and what
// stops a sixth home appearing by way of the logo being recoloured to taste.
for (const r of ["/", "/demo", "/agent", "/record"]) {
  await p.goto(base + r, { waitUntil: "networkidle" });
  const m = await p.locator("nav.cc-nav a.cc-mark svg.cc-logo").count();
  if (m !== 1) fail.push(`${r}: ${m} brand marks in the nav, expected 1`);
  // The name stays in Switzer beside it: the supplied logo sets its wordmark in
  // Newsreader, and that lockup would put a third type voice in the nav.
  const word = await p.locator("nav.cc-nav a.cc-mark span").innerText().catch(() => "");
  if (word.trim() !== "Timbre Care")
    fail.push(`${r}: nav wordmark reads "${word}", expected "Timbre Care"`);
  const col = await p.locator("svg.cc-logo").first()
    .evaluate((el) => getComputedStyle(el).color);
  if (col !== "rgb(207, 48, 22)")
    fail.push(`${r}: the mark is ${col}, expected the accent rgb(207, 48, 22)`);
  const box = await p.locator("svg.cc-logo").first()
    .evaluate((el) => el.getBoundingClientRect().width);
  if (box < 20) fail.push(`${r}: the mark is ${Math.round(box)}px wide, too small to read`);
}

// The console is reachable from /record's embed and from nowhere else. Brian's
// call on 2026-08-09: the embed IS the console, at every viewport width, so a
// second door to it is noise.
const CONSOLE = "https://care-companion-sg.edgeone.dev";
for (const r of ["/", "/demo", "/agent", "/record"]) {
  await p.goto(base + r, { waitUntil: "networkidle" });
  const anchors = await p.locator(`a[href^="${CONSOLE}"]`).count();
  if (anchors) fail.push(`${r}: ${anchors} anchor(s) link to the console; only /record's iframe may reach it`);
}

// The iframe is not hidden on a phone any more. It was display:none below
// 767px with a paragraph standing in for it; the paragraph is gone, so hiding
// the iframe would leave the route empty.
await p.goto(base + "/record", { waitUntil: "networkidle" });
for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  await p.setViewportSize({ width: w, height: h });
  await p.waitForTimeout(400);
  const box = await p.locator(".cc-embed iframe").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { d: getComputedStyle(el).display, w: r.width, h: r.height };
  });
  if (box.d === "none") fail.push(`/record: the console iframe is display:none at ${w}px`);
  if (box.w < 200 || box.h < 300) fail.push(`/record: the console iframe is ${Math.round(box.w)}x${Math.round(box.h)} at ${w}px`);
}
await p.setViewportSize({ width: 1440, height: 900 });

await b.close();
if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log("nav ok: 8 clicks, no errors");

import { chromium } from "playwright";

/**
 * /agent is the route a judge scoring "Use of AI Tools" will dwell on, so it
 * has to explain the system and not only exhibit it. This covers the three
 * sections added on 2026-08-09 and, more importantly, that the live evidence
 * survived them: a redesign that drops the tool-call log, the quoted refusals
 * or the recordings defeats the page.
 */
const base = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 1440, height: 900 });
const fail = [];

await p.goto(base + "/agent", { waitUntil: "networkidle" });
const txt = await p.locator("body").innerText();

// The four layers, top to bottom. The property this shape buys is the one the
// page exists to argue: the console is rendered from the same file the tools
// write, so it cannot display something the agent did not do.
const layers = await p.locator(".cc-arch-l .cc-arch-n").allInnerTexts();
if (layers.length !== 4)
  fail.push(`architecture has ${layers.length} layers, expected 4`);

// Both skills, named, each with what triggers it and what it leaves behind.
const skills = await p.locator(".cc-skill").count();
if (skills !== 2) fail.push(`expected 2 skill cards, found ${skills}`);
for (const s of ["Appointment Companion", "Daily Check-In"])
  if (!txt.includes(s)) fail.push(`/agent does not name the ${s} skill`);

// Seventeen tools. The count is the claim, so it is counted, not stated.
const tools = await p.locator(".cc-tool").count();
if (tools !== 17) fail.push(`tool surface lists ${tools} tools, expected 17`);

// The argument the whole page is for.
if (!/tool layer/i.test(txt))
  fail.push("/agent never says the rules live in the tool layer");

// The live evidence survives the rebuild. It is the only part a judge can
// actually verify, so a redesign that drops it defeats the page.
const rows = await p.locator(".cc-log ol li").count();
if (rows !== 9) fail.push(`the tool-call log shows ${rows} rows, expected 9`);
if (await p.locator(".cc-refusal").count() < 3)
  fail.push("fewer than 3 rule refusals on /agent");
if (await p.locator(".cc-clips figure").count() !== 8)
  fail.push("the eight recordings are not all on /agent");

// Nothing on this page may say how the code was authored. The product agent is
// the subject; the toolchain that built the server is not on the page at all.
for (const t of ["claude", "cursor", "copilot", "codex"])
  if (txt.toLowerCase().includes(t))
    fail.push(`/agent names a development tool: "${t}"`);

// Readable on a phone. The diagram degrades to a stack rather than scrolling.
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(400);
const over = await p.evaluate(() =>
  document.documentElement.scrollWidth > window.innerWidth);
if (over) fail.push("/agent overflows horizontally at 390px");

await b.close();
if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log("agent ok");

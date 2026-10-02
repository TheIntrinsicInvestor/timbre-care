import { chromium } from "playwright";
const base = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage();
const fail = [];

for (const [w, h] of [[1440, 900], [390, 844]]) {
  await p.setViewportSize({ width: w, height: h });
  await p.goto(base, { waitUntil: "networkidle" });
  const over = await p.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth);
  if (over) fail.push(`horizontal overflow at ${w}px`);
}

await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base, { waitUntil: "networkidle" });

// The above-the-fold contract. This replaces the old ".cc-routed above 900px"
// assertion, which the new spine deliberately makes unsatisfiable: the worked
// example is now evidence two thirds down the page, not the opening.
for (const sel of [".cc-hero-k", ".cc-hero-h1", ".cc-cta-block"]) {
  const n = await p.locator(sel).count();
  if (!n) { fail.push(`missing above the fold: ${sel}`); continue; }
  const y = await p.locator(sel).first().evaluate((el) =>
    el.getBoundingClientRect().bottom);
  if (y > 900) fail.push(`${sel} bottom is ${Math.round(y)}px, must be <= 900`);
}

// The action must be INSIDE the hero, not in a band below it. With a
// full-viewport hero these are the same requirement, but stating it separately
// means a later edit that shortens the hero to get the CTA above the fold fails
// here rather than quietly undoing the direction.
const inHero = await p.locator(".cc-hero--show .cc-cta-block").count();
if (!inHero) fail.push(".cc-cta-block is not inside .cc-hero--show");

// The hero is the first screen, by Brian's call on 2026-08-09. It was a 55dvh
// film band before that, and the band's own assertion (<= 560px, with the lede
// below it above the fold) is deliberately gone rather than loosened: the two
// directions are not compatible and a range wide enough for both would assert
// nothing. What survives is that it fills the screen and does not exceed it,
// measured against the space under the sticky nav rather than a magic number.
const heroBox = await p.evaluate(() => {
  const el = document.querySelector(".cc-hero--show");
  const nav = document.querySelector(".cc-nav");
  if (!el) return null;
  return {
    h: Math.round(el.getBoundingClientRect().height),
    room: Math.round(window.innerHeight - (nav?.getBoundingClientRect().height ?? 0)),
  };
});
if (!heroBox) fail.push("no .cc-hero--show on /; the hero is not the product showcase");
else {
  if (heroBox.h > heroBox.room + 8)
    fail.push(`the hero is ${heroBox.h}px against ${heroBox.room}px of first screen; it must not push past the fold`);
  if (heroBox.h < heroBox.room - 90)
    fail.push(`the hero is ${heroBox.h}px against ${heroBox.room}px of first screen; it is meant to hold the screen`);
}

// The hero PRESENTS the product: no footage in it, and the thing itself on
// screen. The consultation clip moved out because room 1 below is the same
// room, and a showcase that only describes the product is a document.
const heroVid = await p.locator(".cc-hero--show video, .cc-hero--show img.cc-clip").count();
if (heroVid) fail.push(`${heroVid} clip elements are still in the hero; it is a showcase, not footage`);
const heroDev = await p.locator(".cc-hero--show .cc-dev").count();
if (heroDev !== 1) fail.push(`${heroDev} devices in the hero, expected exactly 1`);

// The short description of what it does and what it solves lives in the hero,
// not in a band underneath it.
const heroLede = await p.locator(".cc-hero--show .cc-lede").count();
if (heroLede !== 1) fail.push("the hero has no description of what the product does");

// Same contract on a phone. PRODUCT.md puts the caregiver on a phone as often
// as a laptop, and the primary action cleared the 844px fold by a few pixels
// until the film band was shortened at this width.
await p.setViewportSize({ width: 390, height: 844 });
await p.goto(base, { waitUntil: "networkidle" });
const mob = await p.locator(".cc-cta-block").first().evaluate((el) =>
  el.getBoundingClientRect().bottom);
if (mob > 844)
  fail.push(`.cc-cta-block bottom is ${Math.round(mob)}px at 390x844, must be <= 844`);
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base, { waitUntil: "networkidle" });

// Exactly three figures, each with a value and a non-empty source.
const figs = await p.locator(".cc-fig").count();
if (figs !== 3) fail.push(`expected 3 figures, found ${figs}`);
// textContent, not innerText. The three figures co-mount inside the pinned
// rooms and the timeline holds two of them at visibility:hidden, so innerText
// returns "" for whichever two are not the current beat. That is the same trap
// DESIGN.md records for /demo's co-mounted screens. Presence is a DOM question;
// visibility is asserted separately, in the scrub scan further down.
for (let i = 0; i < figs; i++) {
  const f = p.locator(".cc-fig").nth(i);
  const v = (await f.locator(".cc-fig-v").textContent() ?? "").trim();
  const s = (await f.locator(".cc-fig-s").textContent() ?? "").trim();
  if (!v) fail.push(`figure ${i} has no value`);
  if (!s) fail.push(`figure ${i} has no source line`);
}

const text = await p.locator("body").innerText();

// The source line must never be a <figcaption>: copy-audit samples those for
// AAA and .cc-label is --muted at 5.03:1, so the tidier markup fails the build
// on all three source lines at once.
const capt = await p.locator(".cc-fig-s").evaluateAll((els) =>
  els.filter((e) => e.tagName === "FIGCAPTION").length);
if (capt) fail.push(`${capt} source lines are <figcaption>; use <div>`);

// The worked example is evidence, so it must come after every figure it
// evidences. This is the whole point of the rebuild and the one thing a
// well-meaning later edit is most likely to undo.
const order = await p.evaluate(() => {
  const fig = document.querySelectorAll(".cc-fig");
  const ev = document.querySelector(".cc-stage");
  if (!fig.length || !ev) return null;
  const last = fig[fig.length - 1].getBoundingClientRect().top + window.scrollY;
  return { lastFig: last, stage: ev.getBoundingClientRect().top + window.scrollY };
});
if (!order) fail.push("cannot find both the figures and the worked example");
else if (order.stage < order.lastFig)
  fail.push("the worked example appears above the last figure; it is evidence, not the opening");

// The capability act. The page read as "records a consult, calls the next
// morning" and nothing else, which is the commodity half of a saturated genre;
// the three wedges (the linkage, drift monitoring, dialect coverage) plus the
// call that produces the sample are now an act of their own. It sits between
// the problem and the evidence: after the rooms, because it is the answer to
// them, and before the worked example, because that example evidences it.
const caps = await p.evaluate(() => {
  const act = document.querySelector(".cc-solution");
  if (!act) return null;
  const fig = document.querySelectorAll(".cc-fig");
  const stage = document.querySelector(".cc-stage");
  const y = (el) => el.getBoundingClientRect().top + window.scrollY;
  return {
    n: act.querySelectorAll(".cc-sol").length,
    // Every panel carries a value read off the record, so a judge can check it
    // rather than take it. A panel without one is a marketing claim.
    detailed: [...act.querySelectorAll(".cc-sol")]
      .filter((c) => (c.querySelector(".cc-sol-d")?.textContent ?? "").trim()).length,
    top: y(act),
    lastFig: fig.length ? y(fig[fig.length - 1]) : null,
    stage: stage ? y(stage) : null,
  };
});
// The four features are CARDS, on their own warm ground, each numbered. The act
// shipped as four columns of running text, which read as four paragraphs rather
// than as the product's four parts. A card is an opaque ground that differs from
// the page's; without that it is a column with a rule on top.
const cards = await p.evaluate(() => {
  const page = getComputedStyle(document.body).backgroundColor;
  const out = { grounds: [], sameAsPage: 0, ordinals: 0 };
  for (const c of document.querySelectorAll(".cc-solution .cc-sol")) {
    const bg = getComputedStyle(c).backgroundColor;
    const m = bg.match(/[\d.]+/g);
    const opaque = m && (m.length < 4 || Number(m[3]) === 1);
    if (!opaque) { out.grounds.push(bg); continue; }
    if (bg === page) out.sameAsPage++;
    if ((c.querySelector(".cc-sol-n")?.textContent ?? "").trim()) out.ordinals++;
  }
  return out;
});
for (const g of cards.grounds)
  fail.push(`a feature panel has no opaque ground (${g}); it is a column, not a card`);
if (cards.sameAsPage)
  fail.push(`${cards.sameAsPage} feature panels share the page ground; the card cannot be seen`);
if (cards.ordinals !== 4)
  fail.push(`${cards.ordinals} feature panels carry an ordinal, expected 4`);

// Brian's note was that the copy is wordy. Held at 30 words rather than left to
// judgement, because prose creeps back one clause at a time and nothing else on
// the page would catch it. The bodies were 52 to 61 words when this was written.
const wordy = await p.evaluate(() =>
  [...document.querySelectorAll(".cc-solution .cc-sol-b")]
    .map((el) => el.textContent.trim().split(/\s+/).length)
    .filter((n) => n > 30));
for (const n of wordy)
  fail.push(`a feature body runs to ${n} words; the cap is 30, two sentences`);

if (!caps) fail.push("no capability act on /; the page still reads as a recorder plus a phone call");
else {
  if (caps.n !== 4) fail.push(`${caps.n} capability panels, expected 4`);
  if (caps.detailed !== caps.n)
    fail.push(`${caps.n - caps.detailed} capability panels carry no value from the record`);
  if (caps.lastFig !== null && caps.top < caps.lastFig)
    fail.push("the capability act appears above the last figure; it is the answer to the problem, not the opening");
  if (caps.stage !== null && caps.top > caps.stage)
    fail.push("the capability act appears below the worked example, which exists to evidence it");
}

// The differentiators must be ON the page, not merely in the PRD. Each of these
// is a claim the old copy dropped entirely, and dropping them is what made the
// product read like the six competitors named in CLAUDE.md.
const capsText = (await p.locator("body").innerText()).toLowerCase();
for (const [term, why] of [
  ["watch", "the linkage: the visit writes the next call's questions"],
  ["confound", "the linkage: the visit also gates the drift flag"],
  ["pausing", "drift monitoring, named by its actual markers"],
  ["cadence", "the check-in call is on her schedule, not a fixed daily bot"],
  ["teochew", "dialect coverage below the tier that transcription reaches"],
]) if (!capsText.includes(term)) fail.push(`/ never mentions "${term}" (${why})`);

// Forbidden vocabulary, anywhere in visible text.
//
// "diagnose" and "detect" are deliberately NOT banned. The footer's own
// disclaimer reads "does not diagnose, does not score anyone against a
// condition", and /agent uses the word the same way; a substring ban would
// force the sentence that refuses the claim to be reworded, which is the test
// demanding the wrong thing. The forbidden claim itself is caught by
// "dementia" and "memory decline", here and in copy-audit.
for (const bad of ["sent to", "delivered", "suppress", "dementia",
                   "memory decline", "interpreter", "—"]) {
  if (text.toLowerCase().includes(bad.toLowerCase()))
    fail.push(`forbidden term in copy: ${bad}`);
}

// Every clip must be muted, looped, inline and postered. An unmuted clip is a
// defect a judge meets in the first second, and a posterless one is a black
// rectangle on any connection slow enough to matter.
const vids = await p.locator("video").evaluateAll((els) =>
  els.map((v) => ({
    muted: v.muted, loop: v.loop,
    inline: v.hasAttribute("playsinline"), poster: !!v.getAttribute("poster"),
  })));
// Three, one per room. It was four while the hero opened on the consultation
// room and room 1 returned to it; the hero is a product showcase now and the
// clip would be the same room twice within one screen of itself.
if (vids.length !== 3) fail.push(`expected 3 clips, found ${vids.length}`);
vids.forEach((v, i) => {
  if (!v.muted) fail.push(`clip ${i} is not muted`);
  if (!v.loop) fail.push(`clip ${i} does not loop`);
  if (!v.inline) fail.push(`clip ${i} lacks playsinline`);
  if (!v.poster) fail.push(`clip ${i} has no poster`);
});

// Every clip and poster must actually resolve. The attribute assertions above
// all pass against a wrong path, and a 404 poster reads as a design choice
// rather than a fault.
const urls = await p.evaluate(() => {
  const out = [];
  for (const v of document.querySelectorAll("video")) {
    out.push(v.getAttribute("src"));
    out.push(v.getAttribute("poster"));
  }
  return out;
});
for (const u of urls) {
  const r = await p.request.get(new URL(u, base).href);
  if (!r.ok()) fail.push(`asset ${u} returned ${r.status()}`);
}

// The rooms must SCRUB, not step. Counting part-way layer opacities across many
// scroll positions is the property that separates a dissolve from a slideshow;
// an integer-index build scores zero here. Same assertion shape as act one's in
// tests/walkthrough.mjs, and it is the one that caught the /demo step function.
//
// Scanned rather than jumped to a computed offset: the pin starts below a
// full-viewport hero, and a magic scroll number would be measuring the hero.
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base, { waitUntil: "networkidle" });
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(250);
const roomLayers = await p.locator(".cc-room").count();
if (roomLayers !== 3) fail.push(`expected 3 room layers, found ${roomLayers}`);
let roomPartial = 0;
let seen = "";
for (let s = 0; s < 90; s++) {
  const shot = await p.evaluate(() => {
    const op = [...document.querySelectorAll(".cc-room")]
      .map((l) => Number(getComputedStyle(l).opacity));
    return {
      partial: op.some((o) => o > 0.05 && o < 0.95),
      // Only what is actually rendered. innerText skips visibility:hidden, so
      // this accumulates the figures the reader genuinely passes through.
      text: document.body.innerText,
    };
  });
  if (shot.partial) roomPartial++;
  seen += " " + shot.text;
  await p.mouse.wheel(0, 100);
  await p.waitForTimeout(80);
}
if (roomPartial < 6)
  fail.push(`only ${roomPartial} scroll positions showed a part-way room; the rooms are stepping, not dissolving`);

// A figure cannot drift from the source it claims, and a source nobody ever
// sees is not printed on the page. Asserted against the text actually rendered
// across the scrub rather than against one snapshot, because the figures
// co-mount and two of the three are hidden at any given scroll position.
// Compared case-insensitively: .cc-label is text-transform: uppercase and
// innerText returns the rendered text, so "Kessels" arrives as "KESSELS".
// "prd 5.4" was the third source until 2026-08-09. All three now answer to a
// document a reader can open: a self-citation on the one figure about language
// was the weakest link in an act whose whole claim is that it can be checked.
const seenLower = seen.toLowerCase();
for (const src of ["kessels", "duke-nus care", "census of population 2020"])
  if (!seenLower.includes(src))
    fail.push(`source string never became visible while scrolling: ${src}`);

// No route may cite the PRD. It is a private document, so on a public page it
// is a citation a reader cannot follow. The refusals on /agent name the rules.py
// function that raises them instead, which ships inside the skill bundle.
for (const r of ["/", "/demo", "/agent", "/record"]) {
  await p.goto(base + r, { waitUntil: "networkidle" });
  const t = await p.locator("body").innerText();
  if (/\bPRD\b/i.test(t)) fail.push(`${r}: cites the PRD, which a reader cannot open`);
}
await p.goto(base + "/", { waitUntil: "networkidle" });

// Below the pin breakpoint the stack is a first-class path, not a fallback: all
// three figures present and readable, with no pinned wrapper measuring a
// viewport it no longer has.
await p.setViewportSize({ width: 600, height: 900 });
await p.goto(base, { waitUntil: "networkidle" });
const stacked = await p.locator(".cc-rooms-stack .cc-fig").count();
if (stacked !== 3) fail.push(`expected 3 figures in the stacked path at 600px, found ${stacked}`);
const stillPinned = await p.locator(".cc-rooms").count();
if (stillPinned) fail.push("the pinned wrapper still exists at 600px; the stack should have replaced it");
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base, { waitUntil: "networkidle" });

// Dead space is not composition. The audience band shipped with its left column
// ending 600px above the section's bottom edge, which is what "bland" looked
// like in CSS. Measured as the gap between the shorter column's last child and
// the section floor.
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base, { waitUntil: "networkidle" });
const slack = await p.evaluate(() => {
  const sec = document.querySelector(".cc-two");
  if (!sec) return null;
  const floor = sec.getBoundingClientRect().bottom;
  return [...sec.children].map((col) => {
    const last = col.lastElementChild;
    return last ? floor - last.getBoundingClientRect().bottom : 0;
  });
});
if (!slack) fail.push("cannot find the audience band");
else if (Math.max(...slack) > 200)
  fail.push(`a column in the audience band leaves ${Math.round(Math.max(...slack))}px of dead space; balance it`);

// Reveal's fade-and-rise was applied to every band, which is motion that
// communicates nothing and costs a beat of readability each time. At most one
// use may survive on this page.
const reveals = await p.locator(".cc-reveal").count();
if (reveals > 1) fail.push(`${reveals} blanket reveals remain on /; at most 1 may survive`);

// The doors are the only way onward for a judge who does not use the nav, so
// they get to look like destinations rather than a list of links. A card owns
// an opaque ground; a bare link does not.
//
// The first version of this also accepted "has a left border", which was
// meaningless: Tailwind's preflight sets border-style: solid on every element
// at zero width, so borderLeftStyle is "solid" on a link with no border at all
// and the assertion passed before anything was built. An assertion that goes
// green before its implementation is wrong, not lucky.
const doorCard = await p.locator(".cc-doors a").first().evaluate((el) => {
  const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
  return !!m && (m.length < 4 || Number(m[3]) === 1);
});
if (!doorCard) fail.push("the doors are still bare links, not cards");

// The evidence act still exists as an act: full bleed, holding the worked
// example and both devices. It is a LIGHT act; the dark ground it had for half
// a day is asserted gone by the site-wide sweep below.
// Selected by .cc-evidence, not by .cc-act: the capability act is also a
// .cc-act and comes first in the document, so the bare class would measure the
// wrong section and report it as having no devices.
const act = await p.evaluate(() => {
  const s = document.querySelector(".cc-evidence");
  if (!s) return null;
  return {
    w: s.getBoundingClientRect().width,
    stage: !!s.querySelector(".cc-stage"),
    devices: s.querySelectorAll(".cc-dev").length,
  };
});
if (!act) fail.push("no evidence act on /");
else {
  if (act.w < 1400)
    fail.push(`the evidence act is ${Math.round(act.w)}px wide at 1440, expected full bleed`);
  if (!act.stage) fail.push("the worked example is not inside the evidence act");
  if (act.devices !== 2)
    fail.push(`${act.devices} devices in the evidence act, expected 2`);
}

// Every phone-screen element is a <div> or <span>, and copy-audit samples only
// p/li/dd/figcaption, so the screens are invisible to it. That gap shipped a
// build where .cc-inv re-pointed --body to light grey for its whole subtree and
// the elder's screen rendered white-on-white inside a passing suite. The device
// is a light surface wherever it sits, so its own contrast is checked here.
const screenText = await p.evaluate(() => {
  const lum = (c) => {
    const [r, g, bl] = c.match(/[\d.]+/g).slice(0, 3).map((v) => {
      const n = Number(v) / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const opaque = (c) => {
    const m = c.match(/[\d.]+/g);
    return m && (m.length < 4 || Number(m[3]) === 1);
  };
  const bad = [];
  for (const dev of document.querySelectorAll(".cc-dev")) {
    for (const el of dev.querySelectorAll("div, span, dt, dd, p")) {
      const t = [...el.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent.trim()).length;
      if (!t) continue;
      const st = getComputedStyle(el);
      if (st.visibility === "hidden" || Number(st.opacity) < 0.05) continue;
      let ground = null;
      for (let n = el; n; n = n.parentElement)
        if (opaque(getComputedStyle(n).backgroundColor)) {
          ground = getComputedStyle(n).backgroundColor; break;
        }
      if (!ground) continue;
      const a = lum(st.color), g = lum(ground);
      const ratio = (Math.max(a, g) + 0.05) / (Math.min(a, g) + 0.05);
      if (ratio < 4.5)
        bad.push(`${st.color} on ${ground} = ${ratio.toFixed(2)}:1 (${el.className})`);
    }
  }
  return [...new Set(bad)];
});
for (const c of screenText)
  fail.push(`a device screen is unreadable: ${c}`);

// The routing pair is the product's wedge made concrete and must survive the
// de-specification: who was told, and who was not and why. In roles, though.
// This asserted the PRESENCE of "Serene" and "Wei Jie" until 2026-08-09, when
// / stopped being one person's file: the wedge is the asymmetry, not the names.
const bodyText = await p.locator("body").innerText();
for (const s of ["Her daughter", "Not her son overseas"])
  if (!bodyText.includes(s)) fail.push(`routing role missing from /: ${s}`);
for (const s of ["Serene", "Marisa", "Wei Jie", "Lim Mei Hua"])
  if (bodyText.includes(s)) fail.push(`/ still names an individual: ${s}`);

// The evidence act is two screens of a product, not a dated entry in a file.
for (const s of ["7 and 8 August", "7 August", "8 August"])
  if (bodyText.includes(s)) fail.push(`/ dates the record: ${s}`);

// The reduced path is a real path, not a courtesy. With reduce set, no video
// element may exist at all, so nothing moves and nothing is fetched.
const rc = await b.newContext({ reducedMotion: "reduce" });
const rp = await rc.newPage();
await rp.setViewportSize({ width: 1440, height: 900 });
await rp.goto(base, { waitUntil: "networkidle" });
const rv = await rp.locator("video").count();
if (rv) fail.push(`${rv} video elements exist under prefers-reduced-motion: reduce`);
const rimg = await rp.locator("img.cc-clip").count();
if (rimg !== 3) fail.push(`expected 3 poster images under reduce, found ${rimg}`);
await rc.close();

await b.close();
if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log("home ok");

import { chromium } from "playwright";
const base = process.env.BASE ?? "http://127.0.0.1:3000";
const routes = ["/", "/demo", "/agent", "/record"];
const banned = [
  ["—", "em dash"],
  ["sent to", "send vocabulary"],
  ["delivered", "send vocabulary"],
  ["suppress", "forbidden by PRD 8.3"],
  ["dementia", "forbidden claim"],
  ["memory decline", "forbidden claim"],
  ["interpreter", "forbidden framing"],
  ["download the app", "availability claim"],
];

const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 1440, height: 900 });
const fail = [];

for (const r of routes) {
  await p.goto(base + r, { waitUntil: "networkidle" });
  const t = (await p.locator("body").innerText()).toLowerCase();
  for (const [term, why] of banned)
    if (t.includes(term.toLowerCase())) fail.push(`${r}: "${term}" (${why})`);

  // No individual is named on the two public routes, and neither dates the
  // record. /agent and /record keep the real trace and the generated console,
  // where the names and the dates ARE the evidence. This was a /demo-only ban
  // on the elder's name until 2026-08-09; / carried three recipient names and
  // a date heading, which is one person's file rather than a product.
  if (r === "/" || r === "/demo") {
    for (const n of ["lim mei hua", "serene", "marisa", "wei jie"])
      if (t.includes(n))
        fail.push(`${r}: names "${n}"; the public routes speak in roles`);
    for (const d of ["7 august", "8 august", "august 7", "august 8"])
      if (t.includes(d))
        fail.push(`${r}: dates the record ("${d}"); the public routes are not one person's file`);
  }

  // A pronoun needs somebody to refer to. Removing the elder's name on
  // 2026-08-09 left "she" and "her" with no antecedent anywhere: / opened on
  // "It writes up the consultation she agreed to record" with nobody
  // introduced, /agent and /record never introduced a subject at all, and the
  // nav's own "Her record" label made a pronoun the first word a visitor read
  // on every route. 141 pronouns, no referent.
  //
  // The fix is not to rewrite them. It is that a referent must arrive at or
  // before the first pronoun, after which every later one is anchored. Compared
  // by line index over rendered text, so it follows reading order rather than
  // source order.
  // Ordered by where the text actually SITS, not by DOM order. The first pass
  // of this check used innerText and passed while the hero's device caption
  // ("Her record, on her phone", y=171) sat 300px above the lede that
  // introduces her (y=493): later in the markup, first on the screen. Reading
  // order on a two-column hero is visual, so the assertion has to be.
  const lines = await p.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length) continue;              // leaves only
      const t = (el.textContent || "").trim();
      if (!t) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;           // not rendered
      if (getComputedStyle(el).visibility === "hidden") continue;
      out.push({ t, top: Math.round(r.top + window.scrollY), left: Math.round(r.left) });
    }
    return out.sort((a, b) => a.top - b.top || a.left - b.left).map((o) => o.t);
  });
  const isPron = (l) => /\b(she|her|hers)\b/i.test(l);
  // Deliberately a short allowlist of the introductions actually written, not a
  // general "any noun" test: "the person who could have written it down" sat
  // 20 lines above the first pronoun on / and refers to the CAREGIVER, so a
  // loose pattern passed while the page still read as a non sequitur.
  const isAnte = (l) => /older person|older adult|\bthe elder\b/i.test(l);
  const fp = lines.findIndex(isPron);
  const fa = lines.findIndex(isAnte);
  if (fp >= 0) {
    if (fa < 0)
      fail.push(`${r}: uses "${lines[fp].slice(0, 60)}…" but never says who she is`);
    else if (fa > fp)
      fail.push(`${r}: first pronoun at line ${fp} ("${lines[fp].slice(0, 50)}…") precedes the first referent at line ${fa}`);
  }

  for (const [w, h] of [[1440, 900], [390, 844]]) {
    await p.setViewportSize({ width: w, height: h });
    // ScrollTrigger rebuilds its pin-spacer asynchronously on resize, so the
    // frame straight after setViewportSize still carries the old width and
    // reports an overflow the visitor never sees. Let the reflow land.
    await p.waitForTimeout(600);
    const over = await p.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth);
    if (over) fail.push(`${r}: horizontal overflow at ${w}px`);
  }
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.waitForTimeout(300);

  // Body text must clear AAA (7:1) against the ground it is actually on.
  // Resolving the ground means walking ancestors until one paints: reading the
  // element's own backgroundColor and falling back to <body> scores the
  // inverted tool-call log as light-grey-on-white and fails a passing design.
  const bad = await p.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const opaque = (c) => {
      const m = c.match(/[\d.]+/g);
      return m && (m.length < 4 || Number(m[3]) > 0);
    };
    const groundOf = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const bg = getComputedStyle(n).backgroundColor;
        if (opaque(bg)) return bg;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    const out = [];
    for (const el of document.querySelectorAll("p, li, dd, figcaption")) {
      if (!el.textContent.trim()) continue;
      const st = getComputedStyle(el);
      const a = lum(st.color), g = lum(groundOf(el));
      const ratio = (Math.max(a, g) + 0.05) / (Math.min(a, g) + 0.05);
      if (ratio < 7)
        out.push(`${st.color} on ${groundOf(el)} = ${ratio.toFixed(2)}:1 (${el.className || el.tagName})`);
    }
    return [...new Set(out)];
  });
  for (const c of bad) fail.push(`${r}: body contrast below AAA, ${c}`);

  // The page is light only, by decision. A dark rule means someone "fixed"
  // the console iframe looking dark on /record, which breaks the direction.
  // Recursive: Tailwind wraps its output in @layer, and a flat scan of
  // sheet.cssRules never reaches inside one.
  const dark = await p.evaluate(() => {
    const hit = (rules) => {
      for (const r of rules) {
        const c = r.conditionText ?? "";
        if (c.includes("prefers-color-scheme") && c.includes("dark")) return true;
        if (r.cssRules && hit(r.cssRules)) return true;
      }
      return false;
    };
    return [...document.styleSheets].some((s) => {
      try { return hit(s.cssRules); } catch { return false; }
    });
  });
  if (dark) fail.push(`${r}: a prefers-color-scheme dark rule exists; the site is light only`);

  // The site is BRIGHT THROUGHOUT, by decision (2026-08-09). The rule above only
  // ever banned a dark *theme*; for half a day the site carried dark *sections*
  // instead, which passed it: the evidence act on /, the tool-call act on
  // /agent, act two on /demo and the room caption bands. Brian's call was that
  // the whole page is bright, so this bans the ground itself.
  //
  // Two exemptions, both objects rather than grounds: device chrome (a phone
  // bezel is a black object in a picture of a product) and media elements (a
  // <video>'s backdrop shows only while it loads or letterboxes, and a black
  // one is correct there). Nothing else may carry a dark ground.
  const darkGround = await p.evaluate(() => {
    const lum = (c) => {
      const m = c.match(/[\d.]+/g);
      if (!m) return 1;
      const [r, g, b] = m.slice(0, 3).map((v) => {
        const n = Number(v) / 255;
        return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const opaque = (c) => {
      const m = c.match(/[\d.]+/g);
      return m && (m.length < 4 || Number(m[3]) === 1);
    };
    const bad = [];
    for (const el of document.querySelectorAll("*")) {
      if (el.closest(".cc-dev")) continue;
      if (el.tagName === "VIDEO" || el.tagName === "IMG" || el.tagName === "IFRAME") continue;
      const st = getComputedStyle(el);
      if (!opaque(st.backgroundColor)) continue;
      if (lum(st.backgroundColor) > 0.12) continue;
      const b = el.getBoundingClientRect();
      if (b.width * b.height < 150000) continue;
      bad.push(`${el.tagName}.${el.className || "(none)"} ${Math.round(b.width)}x${Math.round(b.height)} on ${st.backgroundColor}`);
    }
    return [...new Set(bad)];
  });
  for (const d of darkGround)
    fail.push(`${r}: a dark section ground is back; the site is bright throughout: ${d}`);
}

await b.close();
if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log("copy audit ok:", routes.length, "routes");

import { chromium } from "playwright";
const base = process.env.BASE ?? "http://127.0.0.1:3000";
const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(`${base}/demo`, { waitUntil: "networkidle" });
const fail = [];

// The pinned timeline only exists once the client has hydrated. Without JS the
// component stays on its reduced-motion stack, which is correct behaviour but
// not what this test is checking, so say so rather than timing out 40 times.
await p.waitForSelector(".cc-wt", { timeout: 10000 }).catch(() => {});
if (await p.locator(".cc-wt").count() === 0) {
  console.error("no .cc-wt: the page did not hydrate (stack fallback rendered)");
  await b.close();
  process.exit(1);
}

// Advance through every beat. A short per-call timeout matters: the default is
// 30s, and a missing locator would stall this loop for 20 minutes.
const seen = new Set();
const offending = new Set();
for (let s = 0; s < 40; s++) {
  const label = await p.locator('[data-act="visit"] .cc-wt-copy h3')
    .innerText({ timeout: 1000 }).catch(() => "");
  if (label) seen.add(label);
  // Scoped to the phone stage, not the whole walkthrough: what is banned is a
  // transcript on HER screen, in these beats, not the word appearing in the
  // narration copy beside it. ".cc-wt" over-matched that copy panel too, which
  // is where "Afterwards" legitimately says her screen is "an overview rather
  // than a transcript" — the honest negative, not the claim this bans. Same
  // trap as banning "diagnose" would be on the footer's "does not diagnose".
  const wt = await p.locator(".cc-wt-stage").innerText({ timeout: 1000 }).catch(() => "");
  if (/caption|transcript|translat/i.test(wt)) offending.add(label || "(unlabelled beat)");
  await p.mouse.wheel(0, 300);
  await p.waitForTimeout(120);
}
if (seen.size < 6) fail.push(`saw ${seen.size} beats, expected 6: ${[...seen].join(" | ")}`);

// Beat 3 must never show a transcript.
if (offending.size)
  fail.push(`beats mention captions or transcripts on her screen: ${[...offending].join(", ")}`);

// The device must read as a phone, not an outline: a status bar and a tab bar
// inside the frame are what carry that. Both are decoration and aria-hidden,
// so this counts elements rather than reading text.
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(200);
if (await p.locator(".cc-dev .cc-sb").count() === 0)
  fail.push("no status bar inside the device frame");
if (await p.locator(".cc-dev .cc-tabs .cc-tab").count() < 3)
  fail.push("fewer than three tabs in the device tab bar");

// Beat 5 says the agent is calling her. Her phone must show a call, not a
// static record: it was the one beat whose copy contradicted its own screen.
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(200);
let sawCall = false;
for (let s = 0; s < 40; s++) {
  if (await p.locator(".cc-call").count() > 0) { sawCall = true; break; }
  await p.mouse.wheel(0, 300);
  await p.waitForTimeout(110);
}
if (!sawCall) fail.push("no in-call screen on any beat");

// Nothing may print outside the device. A fixed height put the carer's four
// watch-fors plus the routing panel on the page below the frame once already,
// and min-height alone does not prove it cannot happen again.
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(300);
const spill = await p.evaluate(() => {
  const out = [];
  for (const app of document.querySelectorAll(".cc-app")) {
    const a = app.getBoundingClientRect();
    for (const kid of app.querySelectorAll(".cc-app-body *")) {
      // Hidden layers keep their boxes, and from the scrub onward most layers
      // are hidden at any moment. Only what a visitor can see can escape.
      const cs = getComputedStyle(kid);
      if (cs.visibility === "hidden" || cs.display === "none" ||
          Number(cs.opacity) < 0.05) continue;
      const k = kid.getBoundingClientRect();
      if (k.height === 0 && k.width === 0) continue;
      if (k.bottom > a.bottom + 1 || k.right > a.right + 1 || k.left < a.left - 1)
        out.push(`${kid.className || kid.tagName} escapes its device`);
    }
  }
  return out.slice(0, 4);
});
for (const s of spill) fail.push(s);

// A scrub means the screens change GRADUALLY as you scroll. The first build
// floored progress into an integer index and swapped what was mounted, so a
// screen was either fully there or absent and nothing was ever part-way.
//
// This deliberately does NOT require two layers to be visible at once. That
// was the earlier version of this check, and satisfying it meant crossfading
// two dense pages of text through each other, which printed the call timer
// through her dose lines. The transitions are pushes: one screen leaves, the
// next arrives, and continuity is carried by movement. So the property to
// assert is that part-way states exist across many scroll positions.
//
// Scanned rather than jumped to a computed offset. The pin starts below a hero
// whose height is not the viewport's, and a magic scroll number would be
// measuring the hero, not the scrub.
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(250);
let partialSamples = 0;
let visibleText = "";
for (let s = 0; s < 120; s++) {
  const shot = await p.evaluate(() => {
    const ls = [...document.querySelectorAll(".cc-lyr")];
    const op = ls.map((l) => Number(getComputedStyle(l).opacity));
    return {
      partial: op.some((o) => o > 0.05 && o < 0.95),
      text: ls.filter((l, n) => op[n] > 0.5).map((l) => l.innerText).join(" "),
    };
  });
  if (shot.partial) partialSamples++;
  visibleText += " " + shot.text;
  await p.mouse.wheel(0, 100);
  await p.waitForTimeout(80);
}
// Six transitions, each spanning several hundred px of scroll, sampled every
// 100px. A step function scores 0 here; the old integer-index build scored 0.
if (partialSamples < 6)
  fail.push(`only ${partialSamples} scroll positions showed a part-way screen; the beats are stepping, not scrubbing`);

// Banned vocabulary must be judged on what is VISIBLE, not on the DOM. Layers
// co-mount now, so a subtree-wide check would quietly pass on hidden content.
if (/caption|transcript|translat/i.test(visibleText))
  fail.push("a visible screen mentions captions, a transcript or a translation");

// The waveform is the page's only art, and it must be driven by scroll rather
// than decorative and static: flat before consent, active while recording.
// Scanned, not jumped to a computed offset, for the same reason as above.
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);
const readAmp = () => p.evaluate(() => {
  const g = document.querySelector(".cc-tl-g");
  return g ? new DOMMatrix(getComputedStyle(g).transform).d : null;
});
let lo = await readAmp();
let hi = lo;
if (lo === null) fail.push("no timbre line on the page");
else {
  for (let s = 0; s < 60; s++) {
    await p.mouse.wheel(0, 200);
    await p.waitForTimeout(80);
    const a = await readAmp();
    if (a === null) continue;
    if (a < lo) lo = a;
    if (a > hi) hi = a;
  }
  if (!(hi > lo * 3))
    fail.push(`timbre line does not respond to scroll (${lo} to ${hi})`);
}

// Reduced motion must not mean a text-only page. Same content, no timeline.
const rp = await b.newPage();
await rp.emulateMedia({ reducedMotion: "reduce" });
await rp.setViewportSize({ width: 1440, height: 900 });
await rp.goto(`${base}/demo`, { waitUntil: "networkidle" });
await rp.waitForTimeout(400);
const stackBeats = await rp.locator('[data-act="visit"] .cc-stack-beat').count();
const stackDevices = await rp.locator('[data-act="visit"] .cc-stack-beat .cc-dev').count();
if (stackBeats !== 6) fail.push(`act one stack has ${stackBeats} beats, expected 6`);
if (stackDevices < 6) fail.push(`act one stack shows ${stackDevices} devices, expected at least 6`);

// The stack has no timeline, so every sub-region and every late block would
// otherwise print on every beat. That is a truth defect, not a layout one:
// beat 1 showed the consent card under copy saying nothing has started, and
// the daughter's screen showed "nothing to report" on the morning before the
// call was placed. Lowercased because .cc-label is uppercased in CSS and
// Chromium's innerText reflects text-transform.
const beatText = async (h) =>
  (await rp.locator(`.cc-stack-beat[data-h="${h}"]`).innerText()).toLowerCase();
const sb1 = await beatText("before");
const sb4 = await beatText("handover");
const sb5 = await beatText("call");
const sb6 = await beatText("after");
if (!sb1.includes("尚未开始录音") || sb1.includes("按一下开始录音"))
  fail.push("reduced-motion beat 1 does not show the idle screen alone");
for (const [h, t] of [["handover", sb4], ["call", sb5]])
  if (t.includes("routed to") || t.includes("nothing to report"))
    fail.push(`reduced-motion beat "${h}" shows an outcome that had not happened yet`);
if (!sb6.includes("routed to") || !sb6.includes("nothing to report"))
  fail.push("reduced-motion last beat is missing the routing or the unanswered watch-for");
if (await rp.locator('.cc-stack-beat[data-h="call"] .cc-call').count() !== 1)
  fail.push("reduced-motion call beat does not show the in-call screen");
await rp.close();

// ---- act two ----
// Scoped by data-act because both acts render .cc-wt-copy h3. Without the
// scope a single act with twelve beats would pass this and act one's check
// simultaneously, which is the ambiguity the attribute exists to remove.
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(250);
const seenTwo = new Set();
for (let s = 0; s < 140; s++) {
  const label = await p.locator('[data-act="record"] .cc-wt-copy h3')
    .innerText({ timeout: 1000 }).catch(() => "");
  if (label) seenTwo.add(label);
  await p.mouse.wheel(0, 300);
  await p.waitForTimeout(90);
}
if (seenTwo.size < 6)
  fail.push(`act two: saw ${seenTwo.size} beats, expected 6: ${[...seenTwo].join(" | ")}`);

// The turn is what makes the act boundary deliberate rather than a scroll
// accident. It is released from both pins, so it must exist outside them.
if (await p.locator(".cc-turn").count() !== 1)
  fail.push("no interstitial between the two acts");
if (await p.locator('.cc-wt .cc-turn, .cc-in .cc-turn').count() > 0)
  fail.push("the interstitial is inside a pinned act; it must be released");

// The chart is act two's whole stage. Its three properties that are clinical
// claims rather than styling: one column per call, the three unanswered days
// present as gaps, and no line bridging a gap. A bridged gap is imputation
// drawn in SVG, and imputation smooths the exact variance being measured.
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(200);
let sawChart = false;
for (let s = 0; s < 140; s++) {
  if (await p.locator(".cc-chart").count() > 0) { sawChart = true; break; }
  await p.mouse.wheel(0, 300);
  await p.waitForTimeout(90);
}
if (!sawChart) fail.push("no marker chart in act two");
else {
  const cols = await p.locator(".cc-chart [data-col]").count();
  const gaps = await p.locator(".cc-chart [data-gap]").count();
  const runs = await p.locator(".cc-chart polyline[data-run]").count();
  if (cols !== 44) fail.push(`chart has ${cols} columns, expected 44 calls`);
  if (gaps !== 3) fail.push(`chart marks ${gaps} gaps, expected 3 unanswered days`);
  // Three interior gaps split 44 points into exactly four unbroken runs. One
  // polyline would mean the line crosses the gaps.
  if (runs !== 4) fail.push(`chart draws ${runs} runs, expected 4; a run spanning a gap is imputation`);
}

// The flagged region is beat 5's reveal. Showing it earlier asserts the
// finding before the baseline it is measured against has been drawn, which is
// a truth defect and not a timing preference. Sampled from the top of act two.
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(250);
let flaggedBeat = -1;
let chartFirstSeenAt = -1;
// A layer driven by a React beat index is only ever fully on or fully off, so
// counting part-way opacities is what separates a scrub from a step function.
// Asserting the ORDER alone is not enough: an index-driven build satisfies
// "flagged is absent before beat 5" perfectly and still cuts.
let inPartial = 0;
for (let s = 0; s < 200; s++) {
  const st = await p.evaluate(() => {
    const c = document.querySelector('.cc-chart [data-layer="flagged"]');
    const h = document.querySelector('[data-act="record"] .cc-wt-copy h3');
    if (!c || !h) return null;
    const idx = [...document.querySelectorAll('[data-act="record"] .cc-rail li')]
      .findIndex((li) => li.classList.contains("is-on"));
    const tweened = [
      ...document.querySelectorAll('.cc-chart [data-layer], [data-act="record"] [data-fact]'),
    ].map((el) => Number(getComputedStyle(el).opacity));
    return {
      op: Number(getComputedStyle(c).opacity),
      idx,
      partial: tweened.some((o) => o > 0.05 && o < 0.95),
    };
  });
  if (st) {
    if (chartFirstSeenAt < 0) chartFirstSeenAt = s;
    if (st.op > 0.05 && flaggedBeat < 0) flaggedBeat = st.idx;
    if (st.partial) inPartial++;
  }
  await p.mouse.wheel(0, 120);
  await p.waitForTimeout(70);
}
if (chartFirstSeenAt < 0) fail.push("act two never became visible while scrolling");
else if (flaggedBeat < 0) fail.push("the flagged region never appears");
else if (flaggedBeat < 4)
  fail.push(`the flagged region appears on beat ${flaggedBeat + 1}; it belongs on beat 5`);
if (inPartial < 6)
  fail.push(`only ${inPartial} scroll positions showed a part-way layer in act two; the annotations are stepping, not scrubbing`);

// The act ends on a finding, not on a refusal. The old build's payoff was a
// drift flag being withheld, which is honest about that record and a poor
// showcase; the real withheld one is still on /agent, in the agent's words.
const actTwoBody = await p.locator("body").innerText();
for (const term of ["confound", "Blocked, as of"])
  if (actTwoBody.includes(term))
    fail.push(`/demo still carries "${term}"; act two ends on the flag being raised`);

// The linguistic family is ineligible for this elder, so any marker counted
// off a transcript must be absent from the whole route, not merely unplotted.
const demoText = (await p.locator("body").innerText()).toLowerCase();
for (const term of ["words per minute", "speech rate", "wpm"])
  if (demoText.includes(term))
    fail.push(`/demo contains "${term}"; the linguistic family is ineligible here`);

// Act two must land on a human surface, not on a refusal and a graph. The
// device arrives on the last beat holding a digest with no finding in it.
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(250);
let sawDigest = false;
for (let s = 0; s < 220; s++) {
  const vis = await p.evaluate(() => {
    const d = document.querySelector(".cc-in-dev");
    if (!d) return false;
    return Number(getComputedStyle(d).opacity) > 0.9;
  });
  if (vis) { sawDigest = true; break; }
  await p.mouse.wheel(0, 120);
  await p.waitForTimeout(70);
}
if (!sawDigest) fail.push("the digest device never becomes visible in act two");

// Three recipients, three different holdings. Wei Jie holds the digest and not
// the flags; Marisa holds the flags and not the digest. That asymmetry is the
// point of the panel, so it must actually render three rows.
const scopeRows = await p.locator('[data-fact="scopes"] .cc-scope').count();
if (scopeRows !== 3)
  fail.push(`scope grid has ${scopeRows} recipients, expected 3`);

// ---- act two, reduced motion ----
// Same content, no timeline. A visitor who asks for less motion must not be
// handed a text-only page, and must not be handed every outcome at once.
const rp2 = await b.newPage();
await rp2.emulateMedia({ reducedMotion: "reduce" });
await rp2.setViewportSize({ width: 1440, height: 900 });
await rp2.goto(`${base}/demo`, { waitUntil: "networkidle" });
await rp2.waitForTimeout(400);

const inBeats = await rp2.locator('[data-act="record"] .cc-stack-beat').count();
if (inBeats !== 6) fail.push(`act two stack has ${inBeats} beats, expected 6`);
const inCharts = await rp2.locator('[data-act="record"] .cc-chart').count();
if (inCharts !== 6) fail.push(`act two stack shows ${inCharts} charts, expected 6`);

const visibleFacts = async (h) => rp2.evaluate((key) => {
  const beat = document.querySelector(`[data-act="record"] .cc-stack-beat[data-h="${key}"]`);
  if (!beat) return null;
  return [...beat.querySelectorAll("[data-fact]")]
    .filter((f) => getComputedStyle(f).display !== "none")
    .map((f) => f.getAttribute("data-fact"));
}, h);

// Beat 1 has named nothing yet, so no readout may be showing.
const f1 = await visibleFacts("cadence");
if (f1 === null) fail.push("act two stack is missing its first beat");
else if (f1.length) fail.push(`stack beat 1 shows readouts before anything is named: ${f1}`);

// The finding belongs on beat 5, with the baseline it is measured against.
// Beat 4 draws the band and must not already show the departure from it.
const f4 = await visibleFacts("baseline");
if (f4 && f4.includes("flagged"))
  fail.push("stack beat 4 shows the finding before the baseline it is measured against");

const f5 = await visibleFacts("flagged");
if (f5 && !f5.includes("flagged"))
  fail.push("stack beat 5 does not show the finding");

// Every layer named in a beat's `shows` must have a rule that displays it.
// The scopes panel was named in IN_BEATS and had no selector, so the static
// path showed beat 6's device with no answer to who receives the digest: half
// the beat's argument, lost only in the path nobody looks at.
const f6 = await visibleFacts("digest");
if (f6 && !f6.includes("scopes"))
  fail.push("stack beat 6 does not show who holds which scope");
if (f5 && f5.includes("scopes"))
  fail.push("stack beat 5 shows the scope panel before its own beat");

// The digest is beat 6's payoff and must not precede the calls it summarises.
const devBefore = await rp2.locator(
  '[data-act="record"] .cc-stack-beat:not([data-h="digest"]) .cc-in-dev').count();
if (devBefore > 0)
  fail.push("the digest device appears on a stack beat before its own");
const devOn = await rp2.locator(
  '[data-act="record"] .cc-stack-beat[data-h="digest"] .cc-in-dev').count();
if (devOn !== 1) fail.push("the digest device is missing from its own stack beat");
await rp2.close();

// Act two abandons the pin below 1100px and uses the stack instead. Act one
// pins at every width because two 156px phones fit; act two's stage is a chart
// plus a 620px device, which at 1000px put the device above the viewport top
// and at 390px put it 300px below an unscrollable fold. Guarded because the
// fallback is the only reason narrow viewports work at all.
const np = await b.newPage();
await np.setViewportSize({ width: 1000, height: 800 });
await np.goto(`${base}/demo`, { waitUntil: "networkidle" });
await np.waitForTimeout(600);
if (await np.locator('.cc-in[data-act="record"]').count() > 0)
  fail.push("act two is still pinned at 1000px; the device does not fit there");
if (await np.locator('.cc-stack[data-act="record"] .cc-stack-beat').count() !== 6)
  fail.push("act two does not fall back to six stacked beats at 1000px");
// Act one must NOT have changed: it pins at every width by design.
if (await np.locator('.cc-wt[data-act="visit"]').count() !== 1)
  fail.push("act one stopped pinning at 1000px; only act two has a width gate");
await np.close();

// The devices are the argument on this route and were set at a size that left
// the stage half air. Larger, and matched: the two phones are one object seen
// twice, so they carry the same size and sit level.
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base + "/demo", { waitUntil: "networkidle" });
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);
const devW = await p.locator(".cc-wt-stage .cc-dev").first().evaluate((el) =>
  el.getBoundingClientRect().width);
// >= 318, not >= 300: the device already measured exactly 300, so a 300 floor
// went green before anything was built and could not force the change it exists
// for. An assertion that passes before its implementation is wrong, not lucky.
if (devW < 318)
  fail.push(`act one's device is ${Math.round(devW)}px wide at 1440, expected >= 318`);

// Level and identical, reversed on Brian's call of 2026-08-10. This asserted
// the opposite until then: the elder's phone led, 26px lower and scaled 1.04
// (0.94 once the daughter's arrived), on the argument that her record is what
// the visit produces. Two reasons it went: the pair reads as a pair only when
// it is the same object seen twice, and the elder's larger, lower placement
// was what pushed her phone past the fold on beats 1-3 at a normal window
// height while the daughter's fitted.
//
// Both halves are checked because the asymmetry had two parts: a size-only
// assertion still passes with the 26px offset restored, and vice versa. Both
// would have failed before the change rather than going green early — the
// offset measured 26px and the elder's device 333px against the carer's 320px.
const matched = await p.evaluate(() => {
  const e = document.querySelector(".cc-wt-stage .cc-dev-slot--elder");
  const c = document.querySelector(".cc-wt-stage .cc-dev-slot--carer");
  if (!e || !c) return null;
  const ed = e.querySelector(".cc-dev").getBoundingClientRect();
  const cd = c.querySelector(".cc-dev").getBoundingClientRect();
  return {
    offset: e.getBoundingClientRect().top - c.getBoundingClientRect().top,
    dw: ed.width - cd.width,
    dh: ed.height - cd.height,
  };
});
if (matched === null) fail.push("cannot find both device slots in act one's stage");
else {
  if (Math.abs(matched.offset) > 2)
    fail.push(`the two phones sit ${Math.round(matched.offset)}px apart; they are meant to be level`);
  if (Math.abs(matched.dw) > 2 || Math.abs(matched.dh) > 2)
    fail.push(`the phones differ by ${Math.round(matched.dw)}x${Math.round(matched.dh)}px; they are meant to be the same size`);
}

// The waveform is the route's one piece of non-photographic art and was drawn
// inside .cc-wt, which is capped at 1240px, so "full width" meant full width of
// a centred grid. It is art behind the act, not a panel behind the stage.
const tlW = await p.locator(".cc-tl").first().evaluate((el) =>
  el.getBoundingClientRect().width);
if (tlW < 1300)
  fail.push(`TimbreLine is ${Math.round(tlW)}px wide at 1440, expected to reach past its wrapper`);

// The constraint this change is most likely to break, asserted explicitly
// rather than left to the generic overflow check. DESIGN.md records it as
// hard-won: stacked inside the pin, the second phone sat below an unscrollable
// fold on exactly the three beats that carry the linkage.
await p.setViewportSize({ width: 390, height: 844 });
await p.goto(base + "/demo", { waitUntil: "networkidle" });
await p.waitForTimeout(300);
const pair = await p.evaluate(() => {
  const d = [...document.querySelectorAll(".cc-wt-stage .cc-dev, .cc-stack .cc-dev")].slice(0, 2);
  if (d.length < 2) return null;
  const [a, c] = d.map((el) => el.getBoundingClientRect());
  return { sideBySide: Math.abs(a.top - c.top) < 40, right: Math.max(a.right, c.right) };
});
if (!pair) fail.push("fewer than two devices found at 390px");
else {
  if (!pair.sideBySide) fail.push("the two phones stacked at 390px; they must stay a pair");
  if (pair.right > 390) fail.push(`a device reaches ${Math.round(pair.right)}px at 390px wide`);
}

// The dialect tier table is gone (Brian's call, 2026-08-09): a consumer does
// not want a word-error rate, and a tier named as a failure case reads as a
// gap rather than as coverage. What replaces it is a single capability
// statement. The claim survives; the essay does not.
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(base + "/demo", { waitUntil: "networkidle" });
const demoTxt = await p.locator("body").innerText();
// Lowercased on both sides: innerText returns RENDERED text, and .cc-label is
// text-transform: uppercase, so a case-sensitive "Tier 1" passes against a
// page that is displaying "TIER 1" in 11px caps.
const demoLower = demoTxt.toLowerCase();
// "no recogniser exists", not "no recogniser": the replacement paragraph says
// the call still works "in a language no recogniser handles", which is the
// honest coverage statement, and a substring ban punishes the sentence that
// makes the claim properly. What is banned is the tier card's own wording.
for (const t of ["tier 1", "tier 2", "tier 3", "46%", "word error", "no recogniser exists"])
  if (demoLower.includes(t))
    fail.push(`/demo still carries the tier table: "${t}"`);
if (await p.locator(".cc-tier").count() > 0)
  fail.push("/demo still renders .cc-tier cards");
if (!/English, Mandarin, Malay, Tamil and Cantonese/.test(demoTxt))
  fail.push("/demo does not state which languages work end to end");
if (await p.locator(".cc-demo-note").count() !== 1)
  fail.push("/demo must carry the illustrative note exactly once");

// /demo's header was a bare .cc-hero, which has no max-width and no auto
// margin, so its h1 started at the viewport edge while every other route's
// started at the 1180px measure. Measured, not asserted from a class name.
const edges = {};
for (const r of ["/demo", "/agent", "/record"]) {
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto(base + r, { waitUntil: "networkidle" });
  await p.waitForTimeout(200);
  edges[r] = await p.locator("h1").first().evaluate((el) =>
    el.getBoundingClientRect().left);
}
if (Math.abs(edges["/demo"] - edges["/agent"]) > 1)
  fail.push(`/demo's h1 starts at ${Math.round(edges["/demo"])}px, /agent's at ${Math.round(edges["/agent"])}px`);
if (Math.abs(edges["/record"] - edges["/agent"]) > 1)
  fail.push(`/record's h1 starts at ${Math.round(edges["/record"])}px, /agent's at ${Math.round(edges["/agent"])}px`);

await b.close();
if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log("walkthrough ok:", seen.size, "beats");

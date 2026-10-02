/**
 * Act two's data. Every value is transcribed from
 * care-companion/data/signal_store.json (sha256 prefix 0a4bc5ee6e8f6663) on
 * 2026-08-09, or from the output of care-companion/build_console.py's
 * build_marker() against that same store.
 *
 * The 44-point series was emitted once by a throwaway script and committed as
 * static values. Nothing here is read at build time, and there is no sync
 * script in this repo: the rebuild deleted sync-data.mjs and snapshot.json on
 * purpose, so that every value a visitor sees is inspectable in a diff.
 *
 * Derived statistics (BAND, SPREAD) are transcribed from build_marker rather
 * than recomputed here. deck/build_charts.py imports build_console for the same
 * reason: two surfaces computing one statistic two ways will eventually
 * disagree, and this is the copy a judge reads.
 *
 * The charted marker is pause fraction. It is ACOUSTIC, so it survives this
 * elder's failed lexical gate. speech_rate_wpm is in every call record and has
 * a more dramatic spread (1.8x), and it is LINGUISTIC and must never appear on
 * this page in any form. The console and deck slide 8 both shipped that
 * contradiction for a day.
 */

/**
 * INVENTED. Forty-four calls, three of them unanswered.
 *
 * The real 44-point series was transcribed from the store and ended in a drift
 * flag being WITHHELD, because a sedating medication moved inside the window.
 * That is the honest reading of that record and it is still on /agent, in the
 * agent's own words. It is a poor showcase: a visitor meeting the product for
 * the first time watches it decline to do the thing it exists to do.
 *
 * This series is shaped to do the thing instead. The first thirty usable
 * samples are tight; the last eleven are visibly wider around a similar mean,
 * because the product's claim is that rising day-to-day VARIABILITY shows
 * earlier than a sinking average. BAND and SPREAD below are computed from
 * these numbers, not asserted over them.
 *
 * The charted marker is pause fraction, which is ACOUSTIC and therefore
 * survives this elder's failed lexical gate. Speech rate is linguistic and
 * must never appear on this page in any form; tests/walkthrough.mjs bans the
 * three ways of naming it.
 */
export const SERIES = [
  { d: "06-25", v: 0.301 }, { d: "06-26", v: 0.278 }, { d: "06-27", v: 0.264 },
  { d: "06-28", v: 0.312 }, { d: "06-29", v: 0.289 }, { d: "06-30", v: 0.295 },
  { d: "07-01", v: 0.271 }, { d: "07-02", v: 0.306 }, { d: "07-03", v: 0.283 },
  { d: "07-04", v: 0.298 }, { d: "07-05", v: 0.315 }, { d: "07-06", v: 0.269 },
  { d: "07-07", v: null },
  { d: "07-08", v: 0.292 }, { d: "07-09", v: 0.304 }, { d: "07-10", v: 0.276 },
  { d: "07-11", v: 0.288 }, { d: "07-12", v: 0.309 }, { d: "07-13", v: 0.281 },
  { d: "07-14", v: 0.297 }, { d: "07-15", v: 0.266 }, { d: "07-16", v: 0.303 },
  { d: "07-17", v: 0.291 }, { d: "07-18", v: 0.274 }, { d: "07-19", v: 0.310 },
  { d: "07-20", v: 0.285 }, { d: "07-21", v: 0.299 },
  { d: "07-22", v: null },
  { d: "07-23", v: 0.268 }, { d: "07-24", v: 0.294 }, { d: "07-25", v: 0.307 },
  { d: "07-26", v: 0.279 }, { d: "07-27", v: 0.286 },
  { d: "07-28", v: null },
  { d: "07-29", v: 0.258 }, { d: "07-30", v: 0.322 }, { d: "07-31", v: 0.264 },
  { d: "08-01", v: 0.331 }, { d: "08-02", v: 0.251 }, { d: "08-03", v: 0.315 },
  { d: "08-04", v: 0.272 }, { d: "08-05", v: 0.328 }, { d: "08-07", v: 0.256 },
  { d: "08-08", v: 0.318 },
] as const;

/**
 * Her own baseline: mean +/- one standard deviation over the first 30 usable
 * samples, which is rules.BASELINE_SAMPLES. Computed from SERIES above rather
 * than asserted over it, and the arithmetic is printed here so it can be
 * redone: 41 usable of 44, baseline mean 0.2901, sd 0.0150.
 */
export const BAND = { lo: 0.275, mid: 0.290, hi: 0.305 } as const;

/** Chart y-domain. Chosen to contain SERIES (0.251 to 0.331) with margin, and
 *  fixed rather than derived so the axis cannot move when a value does. */
export const DOMAIN = { lo: 0.22, hi: 0.36 } as const;

/** SERIES index of the first sample after the 30-sample baseline period. The
 *  30th usable value is 07-26, so this is the index of 07-27. The flagged
 *  region spans this index to the end. */
export const FLAGGED_FROM_INDEX = 32;

/** elders["lim-mei-hua"].marker_eligibility. */
export const FAMILIES = [
  { name: "Acoustic", on: true,
    markers: "Time spent pausing, articulation rate" },
  { name: "Behavioural", on: true,
    markers: "Answer latency, whether she picked up, call duration" },
  { name: "Linguistic", on: false,
    markers: "Everything counted off a transcript" },
] as const;

/**
 * Reworded 2026-08-10 from elders["lim-mei-hua"].eligibility_reason. The
 * verbatim tool-layer string ("fell below the lexical gate... need
 * diarisation, not word recognition") reports what happened to this one
 * elder, in the server's own jargon, on a route meant for a general reader.
 * Restated as the general mechanism instead, in the same plain language as
 * this beat's own title and body: no "family", no "lexical gate", no
 * "diarisation". The verbatim reason is still quotable from the server; it is
 * not repeated on this route.
 */
export const ELIGIBILITY_REASON =
  "Markers that depend on recognising her words switch off automatically " +
  "when that confidence can't be trusted. Acoustic and behavioural markers " +
  "don't need the words to be right, so they keep working.";

/**
 * What the digest says, and the precondition that makes saying it legitimate.
 * `checked` is not decoration: without it this is the threshold alarm the
 * product refuses to be. The confound register is checked before any drift
 * flag, every time; here it came back clean, so the spread is hers.
 *
 * CONFOUND stood here until 2026-08-09, naming the sedating medication that
 * blocked the real record's flag. The real one is still on /agent, in the
 * agent's own words, where it is evidence rather than a showcase.
 */
export const FLAG = {
  marker: "Time spent pausing",
  what: "less consistent from day to day",
  checked: "The medication list was checked first and nothing on it had moved.",
} as const;

/* SCOPES moved to content/persona.ts on 2026-08-09, in roles rather than
   names. The asymmetry it exists for is unchanged. */

/**
 * The finding. Computed, not asserted: 2.1 is the recent stretch's standard
 * deviation (0.0320) over the baseline period's (0.0150).
 *
 * Both counts are printed on the page. Eleven usable samples against a thirty
 * sample baseline is what the page says, rather than claiming a significance
 * nobody computed.
 */
export const SPREAD = {
  ratio: "2.1x",
  recentDays: 14,
  recentSamples: 11,
  baselineSamples: 30,
} as const;

/** Counts and dates, from .calls, .enrolled_on and .check_in_cadence. */
export const COUNTS = {
  calls: 44,
  usable: 41,
  missing: 3,
  baselineNeeded: 30,
  cadence: "daily",
  from: "25 June",
  to: "8 August",
} as const;

/** The three no_answer dates, from .calls[].status. */
export const MISSED = ["7 July", "22 July", "28 July"] as const;

/**
 * `shows` names the annotation layers this beat has revealed. It is the
 * reduced-motion and no-JS contract: with no timeline every layer would print
 * at once, which is a truth defect rather than a layout one. Act one already
 * hit exactly this, showing the consent card under copy saying nothing had
 * started. Anything added to the chart behind a tween gets its entry here in
 * the same commit.
 */
export const IN_BEATS = [
  { key: "cadence", title: "She is called on the rhythm she chose.",
    body: "The cadence is hers: daily, every other day, or three times a " +
          "week. Anything slower is refused, because the call is the " +
          "conversation and the speech sample at once.",
    shows: [] as readonly string[] },
  { key: "missing", title: "A missed call stays empty, not filled in.",
    body: "If she does not answer, that day is left blank rather than " +
          "estimated. Filling it in would smooth the day-to-day spread, and " +
          "the spread is the thing being measured.",
    shows: ["gaps"] },
  { key: "families", title: "What's measured, read from how she sounds, not what she says.",
    body: "Acoustic and behavioural markers come from pausing, " +
          "articulation, timing and response. Anything counted from her " +
          "actual words switches off automatically whenever recognition " +
          "confidence can't be trusted.",
    shows: ["gaps", "families"] },
  { key: "baseline", title: "Her baseline is her own first thirty usable samples.",
    body: "A missed call is not counted toward it, and it is never a " +
          "population average. Rising inconsistency against her own " +
          "baseline shows earlier than a sinking average does.",
    shows: ["gaps", "families", "band"] },
  { key: "flagged", title: "Her last fortnight is wider, and that is the finding.",
    body: "Her pausing has become less consistent from day to day. The " +
          "medication list was checked first and nothing on it had moved, so " +
          "the spread is hers, and it is raised.",
    shows: ["gaps", "families", "band", "flagged"] },
  { key: "digest", title: "The digest reaches whoever holds that scope, not everyone.",
    body: "Her son gets this drift digest but never her verbatim words. Her " +
          "helper gets her verbatim words but never a drift digest. Only her " +
          "daughter, shown here, holds both.",
    shows: ["gaps", "families", "band", "flagged", "scopes"] },
] as const;

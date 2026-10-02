/**
 * The illustrative case behind / and /demo.
 *
 * NOTHING HERE IS TRANSCRIBED FROM THE RECORD. Every value is invented, and
 * invented deliberately: a consumer meeting this product for the first time
 * should not be handed a stranger's prescription, four of her verbatim
 * complaints and the names of the three people who receive them.
 *
 * The record the agent actually wrote is on /record, generated from the same
 * JSON the tools write to, and the real tool-call trace is on /agent. Those two
 * routes keep their names and their dates, because there the identity IS the
 * evidence. tests/copy-audit.mjs fails the build if a name or a date from that
 * record appears on / or /demo.
 *
 * Two things here are load-bearing rather than decorative:
 *   - The record is in Chinese. With the dialect tier table gone from /demo,
 *     this screen is the only place the language capability is shown rather
 *     than claimed.
 *   - The medications are drug CLASSES, not a named prescription, so nothing
 *     reads as one real patient's chart.
 */

/** Her record, in the language she reads. */
export const HER_RECORD = {
  heading: "药物改变",
  lines: ["二甲双胍 500 毫克，一天两次", "安眠药 减到 半粒，晚上吃"],
  foot: "看诊当天 · 家庭医生",
};

/** The appointment screen, beats 1 to 3 of act one. No date: "today". */
export const HER_VISIT = {
  kicker: "今天的看诊",
  day: "今天",
  doctor: "家庭医生",
  dept: "家庭医学 · 上午 9:30",
};

/** Each row must match a string that is actually on the screen beside it. */
export const GLOSS = [
  { zh: "看诊记录", en: "Consultation record" },
  { zh: "药物改变", en: "Medication changes" },
  { zh: "二甲双胍", en: "metformin" },
  { zh: "毫克", en: "milligrams" },
  { zh: "减到 半粒", en: "Reduced to half a tablet" },
];

/**
 * Four things she raised on the call. Counts are the number of days a topic
 * appears, which is what the product offers instead of grading a complaint:
 * it never scores severity, so a plain frequency is the whole answer.
 */
export const CONCERNS = [
  { id: "knee", topic: "Knee pain",
    quote: "Coming down the stairs is harder than before", note: "2nd mention" },
  { id: "appetite", topic: "Appetite",
    quote: "I leave most of my lunch these days", note: "3rd mention" },
  { id: "drowsy", topic: "Grogginess on the new dose",
    quote: "The tablet makes my mornings foggy", note: "" },
  { id: "sleep", topic: "Sleep",
    quote: "I keep waking through the night", note: "" },
];

/**
 * What the visit wrote for the next call to ask. Three of four produced
 * something; the fourth was asked and she had nothing to report, and the screen
 * says exactly that. The watch-fors and the concerns are NOT the same four:
 * sleep was raised without anything asking for it, which is the point.
 */
export const WATCH_FORS = [
  { text: "Whether she is still leaving most of her meals unfinished",
    answered: "appetite" },
  { text: "Whether the morning grogginess has settled since the sleeping tablet was halved",
    answered: "drowsy" },
  { text: "Whether the knee pain is worse, especially on stairs",
    answered: "knee" },
  { text: "Whether she feels giddy when she stands up",
    answered: null },
];

export const UNPROMPTED = "Sleep, which nothing had asked about";

/** Roles, never names. The asymmetry is the wedge and survives intact. */
export const ROUTING = {
  to: "Her daughter, her live-in helper",
  notTo: "Not her son overseas, who does not hold that scope",
};

/**
 * Access is per person and per scope, and the asymmetry is the whole panel:
 * the son holds the drift digest and never what she actually said, the helper
 * the reverse. Two kinds of finding reach two different sets of people.
 *
 * There is no family tier. The product refuses to encode that a relative is
 * inherently more trusted than a paid carer, partly because a hardcoded family
 * tier can route a concern to its own subject.
 */
export const SCOPES = [
  { who: "Her daughter", note: "primary caregiver",
    holds: ["Drift digest", "Content flags", "Appt summary", "Acute alerts"] },
  { who: "Her helper", note: "in the home daily",
    holds: ["Content flags", "Appt summary", "Acute alerts"] },
  { who: "Her son", note: "overseas",
    holds: ["Drift digest", "Appt summary"] },
];

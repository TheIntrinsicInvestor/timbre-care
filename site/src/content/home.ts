/**
 * Every clinical value here is transcribed from care-companion/data/signal_store.json
 * and annotated with the store id it came from. Nothing is read at build time.
 */

/**
 * The hero presents the product. It opened on the problem instead
 * ("Most of what the doctor said is gone before she gets home", over the
 * consultation-room clip) until 2026-08-09, which had two faults: a reader met
 * an argument before learning what was being sold, and the clip was the same
 * room the first pinned figure opens on, one screen apart. The problem now
 * starts where it belongs, in the rooms.
 *
 * The description carries four claims on purpose, because the page read as
 * "records a consult, calls the next morning" and that is the commodity half of
 * a saturated genre (CLAUDE.md names six competitors). Record and language,
 * cadence and linkage, drift, scoped routing: each is expanded in the
 * capability act below the rooms.
 */
export const HERO = {
  /* Not the product name: the wordmark sits in the nav, 40px above and to the
     left of it, so repeating it here spends the one mono line on nothing. Four
     terms, in the order the capability act takes them. */
  kicker: "Consult record · Check-in calls · Drift signal · Dialect tiers",
  headline: "One agent for the appointment, and for the days between.",
  /* The first sentence exists to introduce the two people the rest of the page
     talks about. Without it the lede opened "It writes up the consultation she
     agreed to record" with no antecedent anywhere above it: removing the
     elder's name on 2026-08-09 left 141 pronouns on the site and nobody for
     them to refer to. tests/copy-audit.mjs now fails the build if the first
     pronoun on a route arrives before the first referent. */
  lede:
    "For an older person living at home, and the family who cannot always be " +
    "there. It writes up the consultation she agreed to record, in the " +
    "language she reads. It calls her on the cadence she chose, about exactly " +
    "what the doctor flagged. Across those calls it measures how her speech " +
    "changes from day to day. What she raises reaches only the people she " +
    "authorised.",
  primary: { href: "/demo", label: "See how it works" },
  secondary: { href: "/record", label: "Read the record it wrote" },
  /** The showcase device. Her record, because it is the artifact the product
   *  exists to produce and the one no competitor writes in her language.
   *
   *  "Her record, on her phone" until 2026-08-09. It sits at y=171 in the art
   *  column, roughly 320px ABOVE the lede that introduces her, so it was the
   *  first pronoun on the page and had nothing to refer to. Naming her here
   *  instead makes the first human noun on the site an introduction. */
  deviceCaption: "The record, on the elder's phone",
};

/**
 * Three figures, one per problem band. `source` is printed on the page, so
 * every one of them has to resolve for a reader who goes looking.
 *
 * Figures 1 and 2 were read at source, not off a search summary:
 *   1. Kessels RPC, "Patients' memory for medical information",
 *      J R Soc Med 2003;96:219-222, p219 verbatim: "40-80% of medical
 *      information provided by healthcare practitioners is forgotten
 *      immediately... furthermore, almost half of the information that is
 *      remembered is incorrect."
 *   2. Duke-NUS CARE Research Brief 16, March 2023, Key Findings, from the
 *      TraCE survey of 278 primary family caregivers interviewed April 2019
 *      to May 2020: 73% child or child-in-law, "on average 33 hours per
 *      week", "a quarter of the family caregivers were the only person
 *      taking care of their care recipient".
 *
 * Figure 3 was going to be the SingHealth i-COMM dialect survey ("one in two
 * nurses under 35 are not conversant in dialects"). Every URL for that page
 * 404s, and this site's whole argument is that what it shows can be checked,
 * so a number whose source does not resolve is worse than no number. It fell
 * back to this project's own PRD 5.4 tiering, which was honest but was still a
 * self-citation: a reader could not open it, and it made the one figure about
 * language the only one not answerable to an outside source.
 *
 * Replaced 2026-08-09 with the census, computed from the table rather than
 * quoted from a summary. Dataset d_68860ef451f948e62754a830b6ae5024,
 * "Resident Population Aged 5 Years and Over by Language Most / Second Most
 * Frequently Spoken at Home, Age Group and Ethnic Group (Chinese)", downloaded
 * from data.gov.sg and summed over the five age bands from 65-69 upward:
 *
 *   Chinese residents 65+          448,536
 *   Chinese dialect most often     169,357   37.8%
 *     of which Hokkien              83,754   18.7%
 *     of which Teochew              37,495    8.4%
 *     of which Cantonese            38,388    8.6%
 *
 * Hokkien plus Teochew is 27.1%, and those are precisely the two tiers where
 * recognition is unreliable or absent, which is why the figure is the one about
 * language. data.gov.sg's dataset page returns 200; singstat.gov.sg's own
 * census URLs 404, as they did for the survey above.
 */
export const FIGURES = [
  {
    id: "visit",
    label: "The visit",
    value: "40 to 80%",
    gloss:
      "of what a clinician says is forgotten immediately. Almost half of what " +
      "is remembered is wrong.",
    source: "Kessels, J R Soc Med 2003;96:219",
    body:
      "The dose changed. The follow-up moved. One tablet stops and another is " +
      "halved. Twenty minutes later she has the gist and not the numbers, and " +
      "the person who would have written them down was at work. Nothing " +
      "leaves that room in a form anyone can check.",
  },
  {
    id: "between",
    label: "The days between",
    value: "33 hours a week",
    gloss:
      "is the average family caregiver's load in Singapore. 73% are an adult " +
      "child or child-in-law, and a quarter are the only person doing it.",
    source: "Duke-NUS CARE, Research Brief 16, 2023",
    body:
      "An appointment lasts one morning. The next one may be months away, and " +
      "in between nobody is watching except family who are working and not " +
      "always there. If something changes in week two, it waits until the " +
      "next visit to be seen.",
  },
  {
    id: "language",
    label: "The language",
    value: "38%",
    gloss:
      "of Singapore's Chinese residents aged 65 and over speak a Chinese " +
      "dialect most often at home. Hokkien and Teochew alone are more than a " +
      "quarter of them.",
    source: "Singapore Census of Population 2020, via data.gov.sg",
    body:
      "She counts in Hokkien. She describes pain in Teochew. Her record is " +
      "written in English, so the words she is most precise in never reach " +
      "it. Transcribing her does not fix it: recognition for these dialects " +
      "gets the words wrong too often, and wrong words are worse than none.",
  },
];

export const AUDIENCE = [
  { who: "The elder",
    what: "Lives at home, attends appointments, and speaks a language her record is not written in." },
  { who: "The family caregiver",
    what: "Usually an adult child, usually working, usually not in the room." },
  { who: "The clinician",
    what: "Asked to do nothing differently." },
];

/**
 * Refusals of category. The live rule refusals are imported from agent.ts and
 * quoted from mcp_server/rules.py, never re-typed here.
 *
 * "Not an interpreting service", not "Not an interpreter": tests/copy-audit.mjs
 * bans the bare substring "interpreter" across every route, so the tidier
 * wording fails the build.
 */
export const NOT_THIS = [
  { claim: "Not a diagnosis",
    why: "It reports changes in how she speaks, never a conclusion about her memory." },
  { claim: "Not an interpreting service",
    why: "Nothing she says is machine-translated to her doctor, by design." },
  { claim: "Not a listening device",
    why: "Recording starts on a consent tap and on nothing else." },
];

/**
 * The capability act, added 2026-08-09. It replaces a three-step "visit, call,
 * record" block that described the commodity half of the genre and nothing
 * else: every one of VoiceCare, ElderSense, Cara, MediMate, GuardianAI,
 * CareDash, CLOVA CareCall and inTouch could have run the same three lines.
 * The four panels are the three defensible wedges named in CLAUDE.md (the
 * appointment-to-check-in linkage, dialect coverage, variability-based drift)
 * plus the call that produces the sample they are read from.
 *
 * `detail` is not decoration. Every panel ends on a value a reader can go and
 * check on /record or /agent, because a capability list with no values in it is
 * the one shape this site has spent two passes refusing to be. Sources:
 *
 *   linkage   elders["lim-mei-hua"].watch_fors, all four written with
 *             source "appointment 2026-08-07"; the second is quoted verbatim.
 *   call      rules.CADENCES (daily 1, every_other_day 2, three_times_a_week 3,
 *             the value being the largest gap in days the setting can leave)
 *             and rules.require_supported_cadence, which refuses anything
 *             slower. 44 call records over 45 calendar days: instrument.ts.
 *   drift     build_marker: "Baseline 0.287 +/- 0.037" over the first 30 usable
 *             samples (rules.BASELINE_SAMPLES). Three nulls in SERIES.
 *   dialect   PRD 5.4 tiers, and elders["lim-mei-hua"].marker_eligibility,
 *             where the linguistic family is off and the other two are on.
 */
export const SOLUTION = {
  label: "What Timbre Care does",
  heading: "One agent across the appointment, the call, and the record between them.",
  /* The genre splits in two and nobody joins it: consultation recorders never
     call her afterwards, and check-in callers never know what the doctor said.
     Stated here because the four panels below are each defensible on their own
     and the join is what makes them one product. */
  body:
    "Products that record a consultation never call her afterwards. Products " +
    "that call her never know what the doctor said. Timbre Care does both, " +
    "and each half is what makes the other work.",
};

/**
 * Bodies are capped at 30 words and two sentences, and tests/home.mjs enforces
 * it. They ran 57 to 64 words on first build, which read as four paragraphs
 * rather than four parts of a product. What was cut is qualification, never a
 * mechanism: the linkage still states both of its (the questions AND the
 * confound register), because either alone is the commodity claim.
 */
export const CAPABILITIES = [
  {
    id: "linkage",
    n: "01",
    label: "The linkage",
    title: "The visit writes what the next call asks.",
    body:
      "What the doctor raises becomes tomorrow's questions. Medication " +
      "changes are logged as confounds, so nothing is flagged as drift while " +
      "a dose is still changing.",
    detail:
      "One watch-for reads: \"whether the morning grogginess has settled since " +
      "the sleeping tablet was halved\". The visit wrote that question. The " +
      "call asks it.",
  },
  {
    id: "call",
    n: "02",
    label: "The check-in call",
    title: "She sets the schedule, and every call is also a measurement.",
    body:
      "Daily, every other day, or three times a week. Anything slower is " +
      "refused, because the call is the conversation and the speech sample at " +
      "once.",
    detail:
      "A day she does not answer is left blank. Filling it in would smooth " +
      "out the day-to-day variation the calls exist to measure.",
  },
  {
    id: "drift",
    n: "03",
    label: "Drift monitoring",
    title: "It reads the pattern. It leaves the meaning to her doctor.",
    body:
      "It measures pausing, answer latency and articulation on every call, " +
      "against her own baseline. What a change means is her doctor's " +
      "judgment, not the system's.",
    detail:
      "The baseline is her own first thirty usable samples, never an average " +
      "of other people. Samples, not days: her schedule decides how many a " +
      "month produces.",
  },
  {
    id: "dialect",
    n: "04",
    label: "Dialect coverage",
    title: "Three tiers, because the languages are not equally supported.",
    body:
      "Five languages work end to end. For Hokkien and Teochew, speech " +
      "recognition is not good enough, so it measures how she speaks instead " +
      "of what she said.",
    detail:
      "Teochew has no recogniser at all, and the daily call still works. " +
      "Nothing counted off a transcript is charted when that transcript " +
      "cannot be trusted.",
  },
];

/**
 * ELDER, HER_SCREEN, FLAGS_8_AUG and ROUTING lived here until 2026-08-09, each
 * transcribed from the store with the id it came from. They named one woman,
 * her prescription, four of her verbatim complaints and the three people who
 * receive them, on the page a consumer meets first. All four moved to
 * content/persona.ts as an illustrative case in roles; the real record is on
 * /record and the real trace on /agent, where the identity is the evidence.
 */

/**
 * The three ambient clips. Generated 2026-08-09 (Higgsfield: nano_banana_pro
 * stills, kling2_6 image-to-video, 21 credits), then re-encoded silent and
 * content-hashed. Every frame is an empty room: no people, no hands, no
 * saturated red, bright daylight. Checked on each clip's LAST frame as well as
 * its first, because nothing stops a model walking somebody in at second four.
 *
 * Filenames carry a content hash because EdgeOne serves media as
 * max-age=31536000, immutable: a re-cut clip at the same path is never
 * re-fetched, and the edge serves the new bytes correctly the whole time, so
 * nothing about the fault is visible from the server side. Re-hashed 2026-08-09
 * with the re-encode below, which is exactly the case that rule exists for.
 *
 * RE-ENCODED 2026-08-09 at the source 1924x1076, CRF 21, from raw/*.mp4.
 * They shipped at 1600x894 (hero) and 1100x616 (kitchen, void deck) at roughly
 * 0.5-0.8 Mbps, which was the right call when each was a 208px rectangle in a
 * right-hand column. Once they became the full-viewport ground, a 1100px-wide
 * clip stretched across 1440+ was visibly soft, and the softness was a
 * downscale, not the source: raw/ holds 1924x1076 at 9.5-12 Mbps. This is that
 * footage, not an upscale, so no detail is invented.
 *
 * PALINDROMED 2026-08-09. Each clip drifts to a different place from where it
 * started, so `loop` cut hard back to frame 0 every five seconds. They now play
 * forward and then backward, which is a property of the FILE, not of the
 * player: a video element cannot play in reverse (a negative playbackRate is
 * unsupported in Chrome), so the reversal is encoded in.
 *
 * The join drops two frames rather than none, and that is the whole trick. The
 * reversed half is trimmed to original frames 119..1: without dropping 120 the
 * last forward frame plays twice at the turn, and without dropping 0 the first
 * frame plays twice at the loop point, each reading as a stutter at exactly the
 * moment the motion is meant to be invisible. 121 frames become 240, five
 * seconds become ten:
 *
 *   ffmpeg -i raw/<name>.mp4 -filter_complex \
 *     "[0:v]split[a][b];[b]reverse,trim=start_frame=1:end_frame=120,\
 *      setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1[out]" -map "[out]" \
 *     -c:v libx264 -crf 21 -preset slow -pix_fmt yuv420p \
 *     -movflags +faststart -an -r 24 public/art/<name>.<sha8>.mp4
 *
 * Twice the frames costs roughly twice the bytes, 4.8 MB to 9.4 MB for the
 * three, because x264 has no idea the second half is the first reversed. That
 * is the price of the smooth turn and it was accepted knowingly; raising CRF to
 * 23 buys it back to 6.2 MB and was declined, since these are the full-viewport
 * ground and CRF 21 is the quality decision the re-encode above exists for.
 *
 * The posters are unchanged bytes, carried over under the new hash: a
 * palindrome's first frame is the original's first frame.
 */
export const ART = {
  hero: {
    src: "/art/hero.8c927d38.mp4", poster: "/art/hero.8c927d38.jpg",
    alt: "An empty consultation room, two chairs and a desk in morning light.",
  },
  kitchen: {
    src: "/art/kitchen.511ced06.mp4", poster: "/art/kitchen.511ced06.jpg",
    alt: "A kitchen table with a weekly pill organiser, a cup of kopi and an empty chair.",
  },
  voiddeck: {
    src: "/art/voiddeck.199f7b37.mp4", poster: "/art/voiddeck.199f7b37.jpg",
    alt: "An empty void deck, stone table and letterboxes in hard morning light.",
  },
};

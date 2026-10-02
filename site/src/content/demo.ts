import type { TabItem } from "@/components/phone/TabBar";

export type Beat = {
  key: string;
  title: string;
  body: string;
  carer: boolean;
  /** Status-bar clock on her device. Interface chrome, not a clinical value. */
  clock: string;
  /** Status-bar clock on the daughter's device, where one is shown. */
  carerClock?: string;
};

/** Painted, not wired. See TabBar. */
export const ELDER_TABS: TabItem[] = [
  { icon: "home", label: "首页" },
  { icon: "doc", label: "记录" },
  { icon: "gear", label: "设置" },
];
export const CARER_TABS: TabItem[] = [
  { icon: "cal", label: "Today" },
  { icon: "person", label: "People" },
  { icon: "gear", label: "Settings" },
];

/**
 * What each phone shows moved to content/persona.ts on 2026-08-09: / and /demo
 * run on one illustrative case now, in roles rather than names. What is left
 * here is the beat structure, which is about the product rather than about a
 * person.
 */

/**
 * Beat 3 shows a recording state and nothing more. It must never show captions,
 * a transcript, or a translation. Live captioning was removed from the product
 * on 2026-08-07: it asks an 80-year-old to read and listen at the same time in
 * the one room where her attention is most contested.
 */
export const BEATS: Beat[] = [
  { key: "before", carer: false, clock: "09:28",
    title: "Before she goes in",
    body: "The appointment is already on her phone. Nothing is recording, and the screen says so in the language she reads." },
  { key: "consent", carer: false, clock: "09:29",
    title: "In the room",
    body: "Nothing records until she taps. The app says so out loud, so the room knows too." },
  { key: "recording", carer: false, clock: "09:31",
    title: "Recording",
    body: "Her screen shows that it is running and how to stop it. It does not show the words. She is listening, not reading." },
  { key: "handover", carer: true, clock: "10:14", carerClock: "10:16",
    title: "The visit ends",
    body: "Four things to watch for are written from what the doctor said. This is the handover." },
  { key: "call", carer: true, clock: "08:05", carerClock: "08:05",
    title: "The next morning",
    body: "The agent calls in Hokkien and asks those four by name, rather than asking how she is." },
  { key: "after", carer: true, clock: "08:12", carerClock: "08:12",
    title: "Afterwards",
    body: "The visit's key points are on her screen in large print, an overview rather than a transcript. What was raised is shown alongside who it was routed to, and who it was not." },
];

/* TIERS (three cards, with a 46% word-error rate and "no recogniser exists" on
   them) was deleted on 2026-08-09. /demo now states the coverage claim in one
   paragraph in the route itself. The tiering is unchanged and still documented
   in PRD 5.4; what went is the essay, on the route a consumer reads. */

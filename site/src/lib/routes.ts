/** The one route list. Nav and footer both read it, so they cannot disagree. */
export type Route = { href: string; label: string };

export const ROUTES: Route[] = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "How it works" },
  { href: "/agent", label: "Behind the scenes" },
  // "Her record" until 2026-08-09, which made a pronoun the first word a
  // visitor read on every route, before anyone had been introduced. The door
  // card on / already said "The record".
  { href: "/record", label: "The record" },
];

/** The generated caregiver console. The only live surface this site links to. */
export const LIVE_CONSOLE = "https://care-companion-sg.edgeone.dev";

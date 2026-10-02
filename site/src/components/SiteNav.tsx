import { ROUTES } from "@/lib/routes";
import Mark from "./Mark";

/**
 * Plain anchors, not next/link, and this is load-bearing.
 *
 * Next 16's client router fetches an exported route's payload from
 * `/agent/__next.agent.__PAGE__.txt`, but `output: "export"` writes that payload
 * into a DIRECTORY, `out/agent/__next.agent/__PAGE__.txt`. Every sub-route
 * payload therefore 404s. Live, a few clicks in, the router gave up and
 * rendered Next's full-page "This page couldn't load" screen, which carries no
 * nav, so the visitor was stranded with only the Back button. Every route test
 * passed throughout, because they all navigate by URL and never click.
 *
 * Four static pages share no client state worth preserving, so a full document
 * load costs nothing and removes the entire failure class.
 * tests/nav.mjs clicks every link from every route to keep it removed.
 */
export default function SiteNav({ current }: { current: string }) {
  return (
    <nav className="cc-nav">
      {/* The mark, then the name in Switzer. The supplied logo sets its
          wordmark in Newsreader; using that lockup whole would put a third type
          voice in a nav that is otherwise Switzer and mono, so the drawing does
          the brand work and the name stays in the site's own face. */}
      <a href="/" className="cc-mark">
        <Mark />
        <span>Timbre Care</span>
      </a>
      <div className="cc-nav-links">
        {ROUTES.map((r) => (
          <a key={r.href} href={r.href}
             className={r.href === current ? "on" : undefined}>
            {r.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

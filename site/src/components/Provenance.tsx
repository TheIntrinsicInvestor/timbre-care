import { PROVENANCE } from "@/content/agent";

/**
 * The replayed/live boundary, as two cards side by side.
 *
 * Equal weight on purpose. The flattering half is the live column, and making
 * it the louder one would be the same move as burying the replayed half, which
 * is the thing this section exists to stop doing.
 *
 * Built on the card language the rest of /agent's explanatory sections already
 * use (.cc-skill's panel ground and #d8d4c9 border, .cc-skill-d's ruled list
 * rows), so it reads as part of the page rather than as a notice bolted to it.
 * List items are <li> at --body, which copy-audit samples for AAA.
 */
export default function Provenance() {
  return (
    <>
      <p className="cc-lede-left">{PROVENANCE.lede}</p>
      <div className="cc-prov">
        <section className="cc-prov-card">
          <div className="cc-label">Replayed</div>
          <ul className="cc-prov-list">
            {PROVENANCE.replayed.map((i) => <li key={i.t}>{i.t}</li>)}
          </ul>
        </section>
        <section className="cc-prov-card">
          <div className="cc-label">Live</div>
          <ul className="cc-prov-list">
            {PROVENANCE.live.map((i) => (
              <li key={i.t}>
                {i.t}
                {i.link ? <a href={i.link.href}>{i.link.label}</a> : null}
                {i.after}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="cc-lede-left cc-prov-close">{PROVENANCE.close}</p>
    </>
  );
}

import { CONCERNS, ROUTING } from "@/content/persona";

/**
 * The evidence act's caregiver device: what the call heard, and who it was
 * routed to. All four, because the heading says four and a judge counts.
 *
 * "Routed to", never "sent": nothing in this build delivers anything. The tool
 * that decides a recipient's items records a routing and no more.
 */
export default function CarerFlags() {
  return (
    <>
      <div className="cc-label">The morning after the visit</div>
      <div className="cc-sc-h2">Four things she mentioned</div>
      {CONCERNS.map((f) => (
        <div className="cc-flag" key={f.id}>
          <div className="cc-flag-t">{f.topic}</div>
          <div className="cc-flag-q">&ldquo;{f.quote}&rdquo;</div>
          {f.note && <div className="cc-label cc-flag-m">{f.note}</div>}
        </div>
      ))}
      <div className="cc-routed">
        <div className="cc-label">Routed to</div>
        <div className="cc-who">{ROUTING.to}<br />
          <span className="cc-no">{ROUTING.notTo}</span></div>
      </div>
    </>
  );
}

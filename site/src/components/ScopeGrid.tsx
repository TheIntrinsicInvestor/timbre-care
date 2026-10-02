import { SCOPES } from "@/content/persona";

/**
 * Who holds which scope. Access is granted per person and per scope, and the
 * asymmetry is the whole panel: her son holds the drift digest and never the
 * content flags, her helper the reverse. Two kinds of finding reach two
 * different sets of people (PRD 7.2).
 *
 * The elder can change any of it, and there is no family tier: the product
 * refuses to encode that a relative is inherently more trusted than a paid
 * carer, partly because a hardcoded family tier can route a concern to its own
 * subject.
 */
export default function ScopeGrid() {
  return (
    <div className="cc-scopes">
      {SCOPES.map((s) => (
        <div className="cc-scope" key={s.who}>
          <div className="cc-scope-w">{s.who}</div>
          <div className="cc-label">{s.note}</div>
          <ul>
            {s.holds.map((h) => (
              <li key={h} data-drift={h === "Drift digest" ? "1" : "0"}>{h}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

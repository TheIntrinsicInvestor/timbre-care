import { FAMILIES, ELIGIBILITY_REASON, FLAG, SPREAD, COUNTS, MISSED }
  from "@/content/instrument";
import ScopeGrid from "./ScopeGrid";

/**
 * The readouts beside the chart. Every block is mounted from beat 1 and
 * revealed by the timeline, for the same reason the chart's layers are: an
 * index that decides what exists produces a step function, not a scrub.
 *
 * Both sample counts are printed on the baseline block on purpose. Fourteen
 * days is roughly eleven usable samples against a thirty-sample baseline, and
 * a page that prints "2.0x" without printing what it is 2.0x of is claiming a
 * significance nobody computed.
 */
export default function InFacts() {
  return (
    <div className="cc-facts">
      <div className="cc-fact" data-fact="missing">
        <div className="cc-label">Missing, never filled in</div>
        <p>{MISSED.join(", ")}. {COUNTS.usable} of {COUNTS.calls} calls left a
        usable sample.</p>
      </div>

      <div className="cc-fact" data-fact="families">
        <div className="cc-label">What is measured</div>
        <ul className="cc-fams">
          {FAMILIES.map((f) => (
            <li key={f.name} data-on={f.on ? "1" : "0"}>
              <span className="cc-fam-n">{f.name}</span>
              <span className="cc-fam-m">{f.markers}</span>
            </li>
          ))}
        </ul>
        <p className="cc-fact-why">{ELIGIBILITY_REASON}</p>
      </div>

      <div className="cc-fact" data-fact="band">
        <div className="cc-label">Her own baseline</div>
        <p>The first {SPREAD.baselineSamples} samples set the band, never a
        population average. Her last {SPREAD.recentDays} days are{" "}
        {SPREAD.ratio} as spread as that period, on {SPREAD.recentSamples}{" "}
        samples against {SPREAD.baselineSamples}.</p>
      </div>

      <div className="cc-fact" data-fact="flagged">
        <div className="cc-label">Raised as a drift signal</div>
        <p>{FLAG.marker} has become {FLAG.what} over her last{" "}
        {SPREAD.recentDays} days: {SPREAD.ratio} the spread of her own baseline
        period, on {SPREAD.recentSamples} samples against{" "}
        {SPREAD.baselineSamples}. {FLAG.checked}</p>
      </div>

      <div className="cc-fact" data-fact="scopes">
        <div className="cc-label">Who holds what</div>
        <ScopeGrid />
      </div>
    </div>
  );
}

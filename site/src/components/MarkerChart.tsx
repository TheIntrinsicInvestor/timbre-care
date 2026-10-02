import { SERIES, BAND, DOMAIN, FLAGGED_FROM_INDEX } from "@/content/instrument";

/**
 * Pause fraction across 44 calls. Acoustic, so it survives this elder's failed
 * lexical gate. Speech rate is NOT charted here and must not be added: it is
 * linguistic, her linguistic family is ineligible, and a marker rendered
 * beside a model line that excludes it is a contradiction a clinically
 * literate judge will catch.
 *
 * Geometry: 44 columns of 10 units in a 440x120 viewBox, preserveAspectRatio
 * "none" so one authored geometry stretches to any stage width.
 *
 * width:100% is load-bearing, not tidying. An <svg> is a replaced element with
 * an intrinsic ratio from its viewBox, so with a height set and the width left
 * to the layout, the browser resolves width from the ratio and the page
 * scrolls sideways. TimbreLine taught this page that lesson once already.
 *
 * A gap is a gap. The line is drawn as one polyline per contiguous run of
 * usable samples, so nothing bridges 7, 22 or 28 July. Bridging them would be
 * imputation drawn in SVG, and imputation smooths precisely the day-to-day
 * variance that constitutes the signal (PRD 6.7).
 */
const W = 10;
const H = 120;
const x = (i: number) => i * W + W / 2;
const y = (v: number) => H - ((v - DOMAIN.lo) / (DOMAIN.hi - DOMAIN.lo)) * H;

/** Contiguous runs of non-null samples. Three interior nulls give four runs. */
function runs() {
  const out: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  SERIES.forEach((p, i) => {
    if (p.v === null) { if (cur.length) out.push(cur); cur = []; return; }
    cur.push({ i, v: p.v });
  });
  if (cur.length) out.push(cur);
  return out;
}

export default function MarkerChart({ shows }: { shows: readonly string[] }) {
  const on = (k: string) => (shows.includes(k) ? 1 : 0);
  return (
    <figure className="cc-chart">
      <figcaption className="cc-chart-cap">
        <span className="cc-label">Time spent pausing · acoustic</span>
        <span className="cc-label">{SERIES[0].d} to {SERIES[SERIES.length - 1].d}</span>
      </figcaption>
      <svg viewBox={`0 0 ${SERIES.length * W} ${H}`} preserveAspectRatio="none"
           className="cc-chart-svg" role="img"
           aria-label={`Time spent pausing across ${SERIES.length} calls, with three days missing.`}>
        {/* Layers are co-mounted and revealed by opacity. The timeline never
            mounts them: an index that decides what exists is what made act
            one's first build step instead of scrub. */}
        <g data-layer="band" style={{ opacity: on("band") }}>
          <rect x="0" y={y(BAND.hi)} width={SERIES.length * W}
                height={y(BAND.lo) - y(BAND.hi)} className="cc-chart-band" />
          <line x1="0" x2={SERIES.length * W} y1={y(BAND.mid)} y2={y(BAND.mid)}
                className="cc-chart-mid" />
        </g>

        {/* The stretch the finding is about: everything after her own
            thirty-sample baseline period. It arrives AFTER the band, so the
            reader sees the baseline before the departure from it. This was the
            confound region until 2026-08-09, marking a window a medication had
            moved through; that reading is still on /agent. */}
        <g data-layer="flagged" style={{ opacity: on("flagged") }}>
          <rect x={FLAGGED_FROM_INDEX * W} y="0"
                width={(SERIES.length - FLAGGED_FROM_INDEX) * W} height={H}
                className="cc-chart-flag" />
          <line x1={FLAGGED_FROM_INDEX * W} x2={FLAGGED_FROM_INDEX * W}
                y1="0" y2={H} className="cc-chart-flag-edge" />
        </g>

        <g data-layer="gaps" style={{ opacity: on("gaps") }}>
          {SERIES.map((p, i) => p.v === null && (
            <line key={p.d} data-gap={p.d} x1={x(i)} x2={x(i)} y1="0" y2={H}
                  className="cc-chart-gap" />
          ))}
        </g>

        {runs().map((r) => (
          <polyline key={r[0].i} data-run={r[0].i} fill="none"
                    className="cc-chart-line"
                    points={r.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")} />
        ))}

        {SERIES.map((p, i) => (
          <circle key={p.d} data-col={p.d} cx={x(i)} cy={p.v === null ? H : y(p.v)}
                  r={p.v === null ? 0 : 2.6}
                  className={p.v === null ? "cc-chart-dot is-gap" : "cc-chart-dot"} />
        ))}
      </svg>
    </figure>
  );
}

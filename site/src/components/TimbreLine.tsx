/**
 * The page's only art, and deliberately non-figurative: DESIGN.md bans
 * photography and illustration of people. A single stroke spanning the stage,
 * whose amplitude the walkthrough timeline scrubs. Flat before she consents,
 * full while recording, mid on the call, settled afterwards.
 *
 * preserveAspectRatio="none" lets one authored path stretch to any stage width,
 * so there is no raster asset and no second breakpoint to maintain.
 * vector-effect keeps the stroke 1.4px however hard the group is scaled.
 */
export default function TimbreLine() {
  return (
    <svg className="cc-tl" viewBox="0 0 1200 120" preserveAspectRatio="none"
         aria-hidden="true" focusable="false">
      <g className="cc-tl-g">
        <path
          d="M0 60 C 40 60 60 12 100 12 S 160 108 200 108 S 260 24 300 24
             S 360 96 400 96 S 460 18 500 18 S 560 102 600 102 S 660 30 700 30
             S 760 90 800 90 S 860 20 900 20 S 960 100 1000 100
             S 1060 40 1100 40 S 1160 60 1200 60"
          fill="none" stroke="var(--ink)" strokeWidth="1.4"
          strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

import { ARCH } from "@/content/agent";

/**
 * Four layers, top to bottom, each a card with a connector between.
 *
 * Deliberately not an SVG. This has to read at 390px, and stacked rows do that
 * by existing rather than by being made to; a hand-authored diagram that must
 * survive that width is more risk than the shape is worth.
 */
export default function Architecture() {
  return (
    <ol className="cc-arch">
      {ARCH.map((a, n) => (
        <li className="cc-arch-l" key={a.layer}>
          <div className="cc-arch-h">
            <span className="cc-arch-n">{a.layer}</span>
            <span className="cc-label">{a.what}</span>
          </div>
          <p className="cc-arch-b">{a.note}</p>
          {n < ARCH.length - 1 && <span className="cc-arch-c" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

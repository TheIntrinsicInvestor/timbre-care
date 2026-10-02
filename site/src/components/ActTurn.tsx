/**
 * The released beat between the two pinned acts. Its whole job is to make the
 * turn deliberate: act one ends on a morning, act two opens on 44 of them, and
 * without a stated boundary the second pin reads as the first one glitching.
 *
 * Deliberately not pinned and not animated. After roughly 4,200px of pinned
 * scroll, a full-width block that simply scrolls is the rest.
 */
export default function ActTurn() {
  return (
    <section className="cc-turn cc-act cc-bleed">
      <div className="cc-wrap">
        <div className="cc-label">Act two</div>
        <h2>That was one visit. These are the calls that follow it.</h2>
        <p>
          The visit is where the record is written. The calls are where it is
          checked, one morning at a time, against the way she sounded the morning
          before.
        </p>
      </div>
    </section>
  );
}

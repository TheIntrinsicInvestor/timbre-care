import { WATCH_FORS, UNPROMPTED, ROUTING } from "@/content/persona";

/**
 * Beats 4 to 6 on the daughter's phone. All three headings and both late
 * blocks render at once, marked with data attributes; the walkthrough
 * crossfades them.
 *
 * data-done marks the watch-fors that actually produced an event on 2026-08-08.
 * Three of four did. The fourth was asked and she had nothing to report, and
 * the screen must say exactly that: an earlier version read "All four were
 * raised", which the record does not support and the console contradicts.
 */
export default function CarerWatchFors() {
  return (
    <>
      <div className="cc-h2s">
        <span className="cc-h2" data-h2="handover">Four things to watch for</span>
        <span className="cc-h2" data-h2="call">Asked on this morning&rsquo;s call</span>
        <span className="cc-h2" data-h2="after">Three of the four came back</span>
      </div>
      <ol className="cc-wf">
        {WATCH_FORS.map((w) => (
          <li key={w.text} data-done={w.answered ? "1" : "0"}>
            {w.text}
            {!w.answered && (
              <span className="cc-wf-none" data-late="1">nothing to report</span>
            )}
          </li>
        ))}
      </ol>
      <div className="cc-wf-extra" data-late="1">
        <span className="cc-label">Raised anyway</span>
        {UNPROMPTED}
      </div>
      <div className="cc-routed" data-late="1">
        <div className="cc-label">Routed to</div>
        <div className="cc-who">{ROUTING.to}<br />
          <span className="cc-no">{ROUTING.notTo}</span></div>
      </div>
    </>
  );
}

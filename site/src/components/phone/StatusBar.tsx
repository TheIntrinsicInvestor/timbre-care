/**
 * Decoration only, so the whole bar is aria-hidden: a screen reader announcing
 * a fake battery level on a page about a medical record is noise at best.
 * The clock is passed in and differs per beat, because a status bar frozen at
 * Apple's 9:41 across a visit and the next morning is the detail that gives a
 * mockup away.
 */
export default function StatusBar({ clock }: { clock: string }) {
  return (
    <div className="cc-sb" aria-hidden="true">
      <span className="cc-sb-time">{clock}</span>
      <span className="cc-sb-icons">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7.6" width="3" height="3.4" rx="0.8" opacity=".38" />
          <rect x="4.6" y="5.2" width="3" height="5.8" rx="0.8" />
          <rect x="9.2" y="2.8" width="3" height="8.2" rx="0.8" />
          <rect x="13.8" y="0" width="3" height="11" rx="0.8" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none"
             stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M1.4 4.2a10 10 0 0 1 13.2 0" />
          <path d="M4 7a6.2 6.2 0 0 1 8 0" />
          <path d="M6.6 9.7a2.4 2.4 0 0 1 2.8 0" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.2"
                stroke="currentColor" strokeOpacity=".35" />
          <rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" />
          <path d="M23 4.2a2 2 0 0 1 0 3.6z" fill="currentColor" fillOpacity=".35" />
        </svg>
      </span>
    </div>
  );
}

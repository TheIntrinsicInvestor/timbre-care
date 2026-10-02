/**
 * Inert by design. The decision was that chrome may suggest a fuller app while
 * only the six walkthrough beats are real screens, so these tabs are painted,
 * not wired. aria-hidden keeps them from being announced as navigation that
 * goes nowhere.
 */
const ICONS = {
  home: <path d="M2.4 8.4 9 2.8l6.6 5.6V15.6H2.4z" />,
  doc: <><path d="M4.4 2.2h6.2l3 3v10.6H4.4z" /><path d="M6.8 8.4h4.8M6.8 11.4h4.8" /></>,
  // Sliders, not a cogwheel. A ring with eight radial teeth reads as a sun at
  // 18px, which is what the first cut shipped.
  gear: <><path d="M3 5.4h12M3 9h12M3 12.6h12" /><circle cx="6.6" cy="5.4" r="1.7" /><circle cx="11.4" cy="9" r="1.7" /><circle cx="7.8" cy="12.6" r="1.7" /></>,
  cal: <><rect x="2.6" y="3.6" width="12.8" height="12" rx="2" /><path d="M2.6 7.4h12.8M6.4 2v3M11.6 2v3" /></>,
  person: <><circle cx="9" cy="6.2" r="2.8" /><path d="M3.6 15.6a5.4 5.4 0 0 1 10.8 0" /></>,
};

/** Declared after ICONS so `keyof typeof ICONS` reads in source order. */
export type TabItem = { icon: keyof typeof ICONS; label: string };

export default function TabBar({ items }: { items: TabItem[] }) {
  return (
    <div className="cc-tabs" aria-hidden="true">
      {items.map((t, n) => (
        <span key={t.label} className={n === 0 ? "cc-tab is-on" : "cc-tab"}>
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none"
               stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round">
            {ICONS[t.icon]}
          </svg>
          <span className="cc-tab-l">{t.label}</span>
        </span>
      ))}
    </div>
  );
}

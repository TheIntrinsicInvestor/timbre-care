import { LIVE_CONSOLE } from "@/lib/routes";

/**
 * The console, and nothing beside it. It carried a CTA below it and a
 * paragraph that stood in for it below 767px, where the iframe was hidden;
 * both are gone on Brian's call (2026-08-09). The console is the page, at
 * every width, and it is now deployed with data-theme="light" forced so it
 * cannot render dark inside this bright page.
 */
export default function ConsoleEmbed() {
  return (
    <div className="cc-embed">
      <iframe src={LIVE_CONSOLE} title="The caregiver console" />
    </div>
  );
}

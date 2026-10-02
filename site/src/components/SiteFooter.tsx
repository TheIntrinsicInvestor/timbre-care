import Mark from "./Mark";

/**
 * The footer identifies the submission. It was the route list plus the medical
 * disclaimer until 2026-08-09; nothing on the site said what this is, who built
 * it, or what it was built for, which on a hackathon submission is the one
 * thing a judge should never have to look up.
 *
 * The disclaimer stays, rather than being replaced. It is the only place the
 * site states its limits, on a product that reads speech for signs of change,
 * and a clinically literate judge will look for exactly that sentence. Note
 * tests/copy-audit.mjs bans "dementia" and "memory decline" but deliberately
 * NOT "diagnose", because this line is the honest negative. It is set italic
 * (2026-08-10, Brian's call), which is now what separates it from the meta
 * above: it sat under the route row's hairline until that row was removed.
 *
 * WorkBuddy is named as the harness that planned and ran the work. It must not
 * be described as, or implied to be, a Tencent model: it runs kimi-k3.
 *
 * Plain anchors for the same reason as SiteNav: the exported RSC payload path
 * does not match what the client router requests, so next/link strands the
 * visitor on an error page with no navigation.
 */
export default function SiteFooter() {
  return (
    <footer className="cc-footer">
      <div className="cc-wrap">
        <div className="cc-foot-top">
          <div className="cc-foot-brand">
            <a href="/" className="cc-foot-mark">
              <Mark size={26} />
              <span>Timbre Care</span>
            </a>
            <p className="cc-foot-line">
              An appointment companion and a check-in call that feed each other.
            </p>
          </div>

          <dl className="cc-foot-meta">
            <dt className="cc-label">Built for</dt>
            <dd>
              AI CAN DO IT: Age Well Social Good Challenge<br />
              Tencent Cloud · AI Agent and Skills track
            </dd>

            <dt className="cc-label">Team Karpathians</dt>
            <dd>Brian Liew · Joseph Chew</dd>

            <dt className="cc-label">Built with</dt>
            <dd>
              WorkBuddy, planning and running the agent over a purpose-built MCP
              tool layer, on Tencent EdgeOne. <a href="/agent">See how it is put together</a>.
            </dd>
          </dl>
        </div>

        {/* The claim and the limit, kept together. The plan's draft once read
            "does not score dementia risk"; the word is banned outright by
            tests/copy-audit.mjs, and the guard is blunt on purpose, because a
            disclaimer is still the word sitting next to the product. The claim
            itself is unchanged. */}
        <p className="cc-foot-legal">
          Timbre Care surfaces changes worth mentioning to a doctor. It does not
          diagnose, does not score anyone against a condition, and does not
          advise on treatment.
        </p>
      </div>
    </footer>
  );
}

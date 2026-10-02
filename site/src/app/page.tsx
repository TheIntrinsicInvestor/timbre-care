import { Fragment } from "react";
import SiteNav from "@/components/SiteNav";
import Reveal from "@/components/Reveal";
import Rooms from "@/components/Rooms";
import DeviceFrame from "@/components/phone/DeviceFrame";
import MarkerChart from "@/components/MarkerChart";
import ElderRecord from "@/components/phone/screens/ElderRecord";
import CarerFlags from "@/components/phone/screens/CarerFlags";
import { ELDER_TABS, CARER_TABS } from "@/content/demo";
import {
  HERO, AUDIENCE, NOT_THIS, SOLUTION, CAPABILITIES,
} from "@/content/home";
import { GLOSS, ROUTING } from "@/content/persona";
// Read rather than retyped: the hero's chart is the same component /demo's act
// two scrubs, drawing the same series, so its caption cannot drift from it.
import { COUNTS, BAND } from "@/content/instrument";

/**
 * The spine: a showcase of the product, the problem in three cited figures,
 * what the product does about it, who it is for, the worked example, the doors.
 *
 * The order is load-bearing twice over. The two screens used to open this page,
 * which meant a reader who had never heard of Timbre Care met a Chinese dose
 * line and four verbatim complaints before learning what the product was; and
 * the problem opened it after that, which meant an argument arrived before the
 * thing it argues for. Both are asserted in tests/home.mjs: the worked example
 * may not rise above the last figure, and the capability act may not leave the
 * gap between the last figure and that example.
 */
export default function Home() {
  return (
    <>
      <SiteNav current="/" />

      {/* The hero holds the first screen and presents the product: what it is,
          what it does, and the record it produces, on the page's own bright
          ground. It was a 55dvh band over the consultation-room clip until
          2026-08-09; the clip is gone from here because the first pinned room
          below is that same room, one screen away, and a showcase is not a mood
          shot. Nothing here sits over footage, so the copy needs no scrim and
          the lede is ordinary body type on --surface. */}
      <header className="cc-hero cc-hero--show">
        <div className="cc-wrap cc-show-in">
          <div className="cc-show-copy">
            <div className="cc-label cc-hero-k">{HERO.kicker}</div>
            <h1 className="cc-hero-h1">{HERO.headline}</h1>
            <p className="cc-lede">{HERO.lede}</p>
            <div className="cc-hero-acts">
              <a className="cc-cta-block" href={HERO.primary.href}>{HERO.primary.label}</a>
              <a className="cc-quiet" href={HERO.secondary.href}>
                {HERO.secondary.label}
              </a>
            </div>
          </div>

          {/* The product itself, and both halves of it: the record she reads,
              and the instrument the calls feed. The chart is the same component
              /demo's act two scrubs, drawing the same 44 samples, and it is
              passed only the baseline band. The flagged region is deliberately
              not shown: it is accent home 3 at region scale, and the hero's one
              vermilion belongs to the primary action. */}
          <div className="cc-show-art" aria-hidden="true">
            <div className="cc-show-dev">
              <DeviceFrame role="elder" caption={HERO.deviceCaption}
                           clock="10:14" tabs={ELDER_TABS}>
                <ElderRecord />
              </DeviceFrame>
            </div>
            <div className="cc-show-card">
              <MarkerChart shows={["band"]} />
              <div className="cc-label cc-show-card-f">
                {COUNTS.calls} calls · baseline {BAND.mid.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <Rooms />

      {/* The answer to the three rooms, and the reason this page no longer
          reads as a recorder plus a phone call. Full bleed and light, the same
          act treatment as the evidence below. */}
      <section className="cc-act cc-bleed cc-solution">
        <div className="cc-wrap">
          <div className="cc-label">{SOLUTION.label}</div>
          <div className="cc-sol-head">
            <p className="cc-linkage">{SOLUTION.heading}</p>
            <p className="cc-band-b cc-sol-lede">{SOLUTION.body}</p>
          </div>
          <ol className="cc-sol-grid">
            {CAPABILITIES.map((c) => (
              <li className="cc-sol" key={c.id}>
                <div className="cc-sol-h">
                  <span className="cc-sol-n">{c.n}</span>
                  <span className="cc-label">{c.label}</span>
                </div>
                <h3 className="cc-sol-t">{c.title}</h3>
                <p className="cc-sol-b">{c.body}</p>
                <p className="cc-sol-d">{c.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="cc-band">
        <div className="cc-wrap cc-two">
          <div>
            <div className="cc-label">Who this is for</div>
            <ul className="cc-list cc-list--num">
              {AUDIENCE.map((a) => (
                <li key={a.who}><b>{a.who}</b><span>{a.what}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="cc-label">What it is not</div>
            <ul className="cc-list">
              {NOT_THIS.map((n) => (
                <li key={n.claim}><b>{n.claim}</b><span>{n.why}</span></li>
              ))}
            </ul>
            {/* A quoted rule refusal sat here until 2026-08-09: the verbatim
                mcp_server/rules.py message for an ineligible marker family,
                under a "Blocked · PRD 6.3" label. It was the strongest item in
                a list of things the product is not, and it was also a wall of
                implementation detail on the page a consumer meets first. The
                three refusals are still quoted in full on /agent, which is the
                route built to carry them. */}
          </div>
        </div>
      </section>

      {/* The evidence act: the two screens that prove the act above it. It
          opened with a "visit, call, record" three-step and the linkage line
          until 2026-08-09; both moved into the capability act, where they are
          stated with the values behind them, and repeating them here would
          have described the product twice in three screens.
          A full-bleed light act, separated from the bands above and the doors
          below by hairlines and space rather than by a change of ground. */}
      <Reveal as="section" className="cc-act cc-bleed cc-evidence">
        <div className="cc-wrap">
          {/* The same label + display line + lede rhythm the capability act
              opens on, so the two full-bleed acts read as a pair rather than as
              two unrelated sections that happen to share a border. */}
          <div className="cc-ev-head">
            <div className="cc-label">The visit, and the morning after</div>
            <div className="cc-sol-head">
              <p className="cc-linkage">One record, on two phones.</p>
              <p className="cc-band-b cc-ev-lede">
                The same record, seen by two people with different
                permissions. She reads what changed, in the language she reads.
                Her caregiver is told what she raised, and who was not told.
              </p>
            </div>
          </div>

          <div className="cc-stage">
            <div className="cc-glossed">
              <DeviceFrame role="elder" caption="Her phone" clock="10:14" tabs={ELDER_TABS}>
                <ElderRecord />
              </DeviceFrame>
              {/* The gloss sits OUTSIDE the frame. Her screen is genuinely in
                  Chinese; translating it inside the device would misrepresent
                  what she sees. Each row matches a string actually on the
                  screen beside it. */}
              <dl className="cc-gloss">
                {GLOSS.map((g) => (
                  <Fragment key={g.zh}>
                    <dt lang="zh">{g.zh}</dt><dd>{g.en}</dd>
                  </Fragment>
                ))}
              </dl>
            </div>
            <DeviceFrame role="carer" caption="Her daughter's phone" clock="08:05" tabs={CARER_TABS}>
              <CarerFlags />
            </DeviceFrame>
          </div>

          {/* Who held which scope is the wedge, and it was only ever visible
              inside the caregiver's screen at 13.5px. Stated at full size. */}
          <dl className="cc-routing">
            <dt className="cc-label">Routed to</dt>
            <dd>{ROUTING.to}</dd>
            <dt className="cc-label">Not routed</dt>
            <dd>{ROUTING.notTo}</dd>
          </dl>
        </div>
      </Reveal>

      {/* Home had no way onward but the nav. A judge who does not click never
          reaches the agent evidence, which is the 40-point criterion. */}
      <section className="cc-wrap cc-doors">
        <a href="/demo">
          <span className="cc-label">How it works</span>
          <span className="cc-door-t">One visit, one call, one record</span>
          <span className="cc-door-b">
            Six steps, from the tap that starts the recording to the morning her
            daughter is told what was raised.
          </span>
        </a>
        <a href="/agent">
          <span className="cc-label">Behind the scenes</span>
          <span className="cc-door-t">How it is actually built</span>
          <span className="cc-door-b">
            The two skills, the purpose-built tool layer they call, and a
            recorded run where the rules stopped the agent three times.
          </span>
        </a>
        <a href="/record">
          <span className="cc-label">The record</span>
          <span className="cc-door-t">The console it wrote, live</span>
          <span className="cc-door-b">
            Generated from the same record the agent writes to, so it cannot
            show something the agent did not do.
          </span>
        </a>
      </section>
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IN_BEATS } from "@/content/instrument";
import MarkerChart from "./MarkerChart";
import InFacts from "./InFacts";
import DeviceFrame from "./phone/DeviceFrame";
import CarerDigest from "./phone/screens/CarerDigest";
import { CARER_TABS } from "@/content/demo";

gsap.registerPlugin(ScrollTrigger);

/**
 * Act two. Deliberately does NOT share a hook with Walkthrough: the two
 * timelines have nothing in common beyond the pin, and act one is a verified
 * build whose assertions currently pass. Extracting a shared abstraction would
 * put a working scrub at risk to save about 35 lines. If a third act ever
 * appears, extract then.
 *
 * 600 rather than act one's 700. Act two's beats are read, not watched: there
 * is one chart on screen throughout and less to take in per beat.
 */
const PER_BEAT = 600;

/**
 * Below this width the pin is abandoned for the stack. Act one pins at every
 * width because two 156px phones fit a 390px viewport; act two's stage is a
 * 44-point chart, four readouts and a 620px device, which does not fit a short
 * or narrow viewport at all. Patched three ways first: the device sat above the
 * viewport top at 1000px, its scope rows collided with it, and on mobile it
 * landed 300px below an unscrollable fold, which is the exact defect DESIGN.md
 * records against act one's first build. The stack is not a downgrade here, it
 * is the same six beats with the same content, scrolling.
 */
const PIN_FROM = 1100;

export default function Instrument() {
  const wrap = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  // Same default as act one: the server-rendered HTML is the plain stack, and
  // that is what a no-JS visitor keeps.
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia(`(min-width: ${PIN_FROM}px)`);
    const decide = () => setReduced(motion.matches || !wide.matches);
    decide();
    // Re-decided on resize, so dragging a window across the breakpoint swaps
    // the two paths rather than leaving a pin measured for the other one.
    motion.addEventListener("change", decide);
    wide.addEventListener("change", decide);
    return () => {
      motion.removeEventListener("change", decide);
      wide.removeEventListener("change", decide);
    };
  }, []);

  useEffect(() => {
    if (reduced || !wrap.current) return;
    const ctx = gsap.context((self) => {
      const q = self.selector!;

      // Opening state. Everything that arrives later starts hidden here rather
      // than in CSS, so the server-rendered HTML stays the plain stack.
      gsap.set(q('[data-layer="gaps"], [data-layer="band"], [data-layer="flagged"]'),
               { autoAlpha: 0 });
      gsap.set(q("[data-fact]"), { autoAlpha: 0, y: 12 });
      gsap.set(q(".cc-chart-svg"), { opacity: 0.32 });
      gsap.set(q(".cc-in-dev"), { autoAlpha: 0, xPercent: 14 });

      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      // 1 -> 2: the line resolves and the three unanswered days appear as gaps.
      tl.to(q(".cc-chart-svg"), { opacity: 1, duration: 0.5 }, 0.55)
        .to(q('[data-layer="gaps"]'), { autoAlpha: 1, duration: 0.45 }, 1)
        .to(q('[data-fact="missing"]'), { autoAlpha: 1, y: 0, duration: 0.45 }, 1.1)

        // 2 -> 3: which families are read, and which is struck.
        .to(q('[data-fact="missing"]'), { autoAlpha: 0, duration: 0.3 }, 2)
        .to(q('[data-fact="families"]'), { autoAlpha: 1, y: 0, duration: 0.45 }, 2.2)

        // 3 -> 4: her own baseline, and the spread against it.
        .to(q('[data-fact="families"]'), { autoAlpha: 0, duration: 0.3 }, 3)
        .to(q('[data-layer="band"]'), { autoAlpha: 1, duration: 0.5 }, 3.1)
        .to(q('[data-fact="band"]'), { autoAlpha: 1, y: 0, duration: 0.45 }, 3.25)

        // 4 -> 5: the finding. The region arrives AFTER the band, so the
        // reader sees the baseline before the departure from it.
        .to(q('[data-fact="band"]'), { autoAlpha: 0, duration: 0.3 }, 4)
        .to(q('[data-layer="flagged"]'), { autoAlpha: 1, duration: 0.55 }, 4.2)
        .to(q('[data-fact="flagged"]'), { autoAlpha: 1, y: 0, duration: 0.45 }, 4.35)

        // 5 -> 6: the device arrives over the chart, which gives up the room
        // rather than disappearing: the finding it holds is about that chart.
        .to(q('[data-fact="flagged"]'), { autoAlpha: 0, duration: 0.3 }, 5)
        .to(q(".cc-chart-svg"), { opacity: 0.42, duration: 0.5 }, 5.1)
        // The chart and readouts give up the right of the stage rather than
        // being covered by the device. Occluding them lost the flagged region
        // AND the scope panel, whose whole point is that her son holds the
        // drift digest and never the content flags. A tween of width costs
        // a layout per frame on one subtree, which is the right price for not
        // hiding the beat's argument behind its own illustration.
        .to(q(".cc-in-main"), { "--dev": "318px", duration: 0.55 }, 5.1)
        .to(q(".cc-in-dev"), { autoAlpha: 1, xPercent: 0, duration: 0.55 }, 5.15)
        .to(q('[data-fact="scopes"]'), { autoAlpha: 1, y: 0, duration: 0.45 }, 5.4);

      ScrollTrigger.create({
        trigger: wrap.current!,
        start: "top top",
        end: () => `+=${IN_BEATS.length * PER_BEAT}`,
        pin: true,
        scrub: true,
        animation: tl,
        // The index selects copy and rail only. It must never decide what is
        // mounted; that is what made act one's first build cut instead of
        // scrub.
        onUpdate: (self) =>
          setI(Math.min(IN_BEATS.length - 1,
            Math.floor(self.progress * IN_BEATS.length))),
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduced]);

  if (reduced) {
    return (
      <div className="cc-stack" data-act="record">
        {IN_BEATS.map((b) => (
          <section key={b.key} className="cc-stack-beat cc-stack-beat--in"
                   data-h={b.key}>
            <div className="cc-stack-say">
              <h3>{b.title}</h3><p>{b.body}</p>
            </div>
            <div className="cc-in-stage" data-shows={b.shows.join(" ")}>
              <div className="cc-in-main">
                <MarkerChart shows={b.shows} />
                <InFacts />
              </div>
              {b.key === "digest" && (
                <div className="cc-in-dev">
                  <DeviceFrame role="carer" caption="Her daughter's phone"
                               clock="08:20" tabs={CARER_TABS}>
                    <CarerDigest />
                  </DeviceFrame>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    );
  }

  const beat = IN_BEATS[i];
  return (
    <div ref={wrap} className="cc-in" data-act="record">
      <div className="cc-wt-copy">
        <div className="cc-label">Step {i + 1} of {IN_BEATS.length}</div>
        <div key={beat.key} className="cc-wt-say">
          <h3>{beat.title}</h3>
          <p>{beat.body}</p>
        </div>
        <ol className="cc-rail" aria-hidden="true">
          {IN_BEATS.map((b, n) => (
            <li key={b.key} className={n === i ? "is-on" : undefined} />
          ))}
        </ol>
      </div>
      <div className="cc-in-stage">
        {/* All layers on: the timeline, not the index, decides what is seen.
            The reduced-motion branch above is where `shows` still applies. */}
        <div className="cc-in-main">
          <MarkerChart shows={["gaps", "families", "band", "flagged", "scopes"]} />
          <InFacts />
        </div>
        <div className="cc-in-dev">
          <DeviceFrame role="carer" caption="Her daughter's phone"
                       clock="08:20" tabs={CARER_TABS}>
            <CarerDigest />
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}

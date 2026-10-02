"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DeviceFrame from "./phone/DeviceFrame";
import ElderVisit from "./phone/screens/ElderVisit";
import ElderRecord from "./phone/screens/ElderRecord";
import ElderCall from "./phone/screens/ElderCall";
import CarerWatchFors from "./phone/screens/CarerWatchFors";
import TimbreLine from "./TimbreLine";
import { BEATS, ELDER_TABS, CARER_TABS } from "@/content/demo";

gsap.registerPlugin(ScrollTrigger);

/** Scroll distance per beat. 520 was too tight to read a transition as motion. */
const PER_BEAT = 700;

export default function Walkthrough() {
  const wrap = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [tapped, setTapped] = useState(false);
  // Defaults to the stack, so the server-rendered HTML is the full six beats.
  // With JavaScript disabled that is what the visitor keeps. Only a mounted
  // client that allows motion switches to the pinned timeline.
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    setReduced(false);
  }, []);

  // Scrolling away from the consent beat resets the control. Without this it
  // stayed armed, so scrolling back showed a black "recording" button on a
  // screen whose copy says nothing has started.
  useEffect(() => {
    if (BEATS[i].key !== "consent" && tapped) setTapped(false);
  }, [i, tapped]);

  // Split from the branch above: `wrap` does not exist until the pinned markup
  // has rendered, so the timeline has to be built on the pass after `reduced`
  // flips, not in the same effect that flips it.
  useEffect(() => {
    if (reduced || !wrap.current) return;
    const ctx = gsap.context((self) => {
      const q = self.selector!;

      // Opening state. Everything that arrives later starts hidden here rather
      // than in CSS, so the server HTML stays the plain stack.
      gsap.set(q('[data-lyr="record"], [data-lyr="call"]'), { autoAlpha: 0 });
      gsap.set(q('[data-sub="ready"], [data-sub="rec"]'), { autoAlpha: 0 });
      gsap.set(q(".cc-dev-slot--carer"), { autoAlpha: 0, xPercent: 16 });
      gsap.set(q(".cc-dev-slot--elder"), { xPercent: 56 });
      gsap.set(q('[data-h2="call"], [data-h2="after"]'), { autoAlpha: 0 });
      gsap.set(q('[data-late="1"]'), { autoAlpha: 0 });
      gsap.set(q(".cc-cap-late"), { autoAlpha: 0 });
      gsap.set(q(".cc-tl-g"), { scaleY: 0.03, transformOrigin: "50% 50%" });
      gsap.set(wrap.current!, { "--wx": "66%" });

      // One unit of timeline per beat. ScrollTrigger maps scroll progress onto
      // it, so every tween below is scrubbed rather than played.
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      // 1 -> 2: the card and the consent action arrive. The header never moves.
      tl.to(q('[data-sub="idle"]'), { autoAlpha: 0, duration: 0.45 }, 1)
        .set(q('[data-sub="ready"]'), { autoAlpha: 1 }, 1)
        .fromTo(q('[data-sub="ready"] > *'),
                { autoAlpha: 0, y: 16 },
                { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.14 }, 1.05)

        // 2 -> 3: the action morphs into the recorder rather than cutting.
        .to(q('[data-sub="ready"]'), { autoAlpha: 0, duration: 0.4 }, 2)
        .fromTo(q('[data-sub="rec"]'),
                { autoAlpha: 0, scaleY: 0.84, transformOrigin: "50% 100%" },
                { autoAlpha: 1, scaleY: 1, duration: 0.5 }, 2.05)
        .to(q(".cc-tl-g"), { scaleY: 1, duration: 0.5 }, 2.05)

        // 3 -> 4: the record pushes up, the daughter's phone arrives, and the
        // elder device gives up the centre it held for three beats.
        // A push, not a crossfade, and this was measured rather than guessed.
        // Overlapping the fades put "00:12" through "安眠药 减到 半粒，晚上吃" as a
        // double exposure: two dense pages of text cannot occupy one screen at
        // 0.3 opacity each and stay readable. The fades are therefore
        // sequential, and continuity is carried by motion instead, which is
        // what a scrub actually reads on. Nothing here cuts: the two halves
        // span 0.9 of a beat, about 630px of scroll.
        .to(q('[data-lyr="visit"]'),
            { autoAlpha: 0, y: -40, duration: 0.45, ease: "none" }, 3)
        .fromTo(q('[data-lyr="record"]'),
                { autoAlpha: 0, y: 40 },
                { autoAlpha: 1, y: 0, duration: 0.45, ease: "none" }, 3.45)
        .to(q(".cc-dev-slot--elder"),
            { xPercent: 0, duration: 0.6 }, 3.05)
        .to(q(".cc-dev-slot--carer"),
            { autoAlpha: 1, xPercent: 0, duration: 0.6 }, 3.05)
        .to(q(".cc-tl-g"), { scaleY: 0.22, duration: 0.5 }, 3.1)
        // The wash follows the device as it gives up the centre.
        .to(wrap.current!, { "--wx": "50%", duration: 0.6 }, 3.05)

        // 4 -> 5: she takes the call.
        .to(q('[data-lyr="record"]'),
            { autoAlpha: 0, y: -40, duration: 0.45, ease: "none" }, 4)
        .fromTo(q('[data-lyr="call"]'),
                { autoAlpha: 0, y: 40 },
                { autoAlpha: 1, y: 0, duration: 0.45, ease: "none" }, 4.45)
        .to(q('[data-h2="handover"]'), { autoAlpha: 0, duration: 0.35 }, 4)
        .to(q('[data-h2="call"]'), { autoAlpha: 1, duration: 0.4 }, 4.1)
        .to(q(".cc-tl-g"), { scaleY: 0.66, duration: 0.5 }, 4.05)

        // 5 -> 6: back to the record, and the three watch-fors that produced
        // something light in turn. The fourth stays grey; it was asked and she
        // had nothing to report.
        .to(q('[data-lyr="call"]'),
            { autoAlpha: 0, y: -40, duration: 0.45, ease: "none" }, 5)
        .fromTo(q('[data-lyr="record"]'),
                { autoAlpha: 0, y: 40 },
                { autoAlpha: 1, y: 0, duration: 0.45, ease: "none" }, 5.45)
        .to(q('[data-h2="call"]'), { autoAlpha: 0, duration: 0.35 }, 5)
        .to(q('[data-h2="after"]'), { autoAlpha: 1, duration: 0.4 }, 5.1)
        .to(q('.cc-wf li[data-done="1"]'),
            { borderLeftColor: "#cf3016", duration: 0.3, stagger: 0.15 }, 5.15)
        .to(q('[data-late="1"]'),
            { autoAlpha: 1, duration: 0.4, stagger: 0.1 }, 5.35)
        .to(q(".cc-cap-early"), { autoAlpha: 0, duration: 0.3 }, 5.2)
        .to(q(".cc-cap-late"), { autoAlpha: 1, duration: 0.3 }, 5.35)
        .to(q(".cc-tl-g"), { scaleY: 0.16, duration: 0.5 }, 5.2);

      ScrollTrigger.create({
        trigger: wrap.current!,
        // "top top" pins flush to the true viewport top (y=0), but .cc-nav is
        // position:sticky at z-index:50 and paints OVER the pinned section
        // rather than reserving space above it. Anything sitting near the top
        // of the stage (the "Her phone" / "Her daughter's phone" captions)
        // landed behind the nav. Offsetting the start by the nav's own height
        // (globals.css .cc-nav, 66px) pins the stage that far below the true
        // top instead, which is what ScrollTrigger's start value also sets as
        // the held pin position, not only the trigger point.
        start: "top 66px",
        end: () => `+=${BEATS.length * PER_BEAT}`,
        pin: true,
        scrub: true,
        animation: tl,
        // The index selects copy and rail only. It must never decide what is
        // mounted: that is what made the old build cut instead of scrub.
        onUpdate: (self) =>
          setI(Math.min(BEATS.length - 1,
            Math.floor(self.progress * BEATS.length))),
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduced]);

  // Reduced motion and no-JS both get every beat as a plain stack. It shows the
  // same screens, statically: a visitor who asks for less motion should not be
  // handed a text-only page while everyone else sees an app.
  if (reduced) {
    return (
      <div className="cc-stack" data-act="visit">
        {BEATS.map((b) => {
          const screen = b.key === "call" ? "call"
            : ["handover", "after"].includes(b.key) ? "record" : "visit";
          // With no timeline every sub-region and every late block would print
          // at once, so the beat states its own. Without this, beat 1 showed
          // the consent card under copy that says nothing has started, and the
          // daughter's screen showed "nothing to report" on the morning before
          // the call was placed.
          const stage = b.key === "recording" ? "rec"
            : b.key === "consent" ? "ready" : "idle";
          return (
            <section key={b.key} className="cc-stack-beat"
                     data-stage={stage} data-h={b.key}>
              <div className="cc-stack-say">
                <h3>{b.title}</h3><p>{b.body}</p>
              </div>
              <div className="cc-stack-dev">
                <DeviceFrame role="elder" caption="Her phone"
                             clock={b.clock} tabs={ELDER_TABS}>
                  {screen === "visit" && <ElderVisit armed={false} onTap={() => {}} />}
                  {screen === "record" && <ElderRecord />}
                  {screen === "call" && <ElderCall />}
                </DeviceFrame>
                {b.carer && (
                  <DeviceFrame role="carer" caption="Her daughter's phone"
                               clock={b.carerClock ?? b.clock} tabs={CARER_TABS}>
                    <div className="cc-label">
                      {b.key === "after" ? "The next morning" : "The visit"}
                    </div>
                    <CarerWatchFors />
                  </DeviceFrame>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  const beat = BEATS[i];
  return (
    <div ref={wrap} className="cc-wt" data-act="visit">
      <TimbreLine />
      <div className="cc-wt-copy">
        <div className="cc-label">Step {i + 1} of {BEATS.length}</div>
        {/* Keyed so the copy fades up on each change. The rail is ink and rule,
            never accent: a vermilion progress rail would be a fifth home. */}
        <div key={beat.key} className="cc-wt-say">
          <h3>{beat.title}</h3>
          <p>{beat.body}</p>
        </div>
        <ol className="cc-rail" aria-hidden="true">
          {BEATS.map((b, n) => (
            <li key={b.key} className={n === i ? "is-on" : undefined} />
          ))}
        </ol>
      </div>

      <div className="cc-wt-stage">
        <div className="cc-dev-slot cc-dev-slot--elder">
          <DeviceFrame role="elder" caption="Her phone"
                       clock={beat.clock} tabs={ELDER_TABS}>
            <div className="cc-lyr" data-lyr="visit">
              <ElderVisit armed={tapped} onTap={() => setTapped(true)} />
            </div>
            <div className="cc-lyr" data-lyr="record"><ElderRecord /></div>
            <div className="cc-lyr" data-lyr="call"><ElderCall /></div>
          </DeviceFrame>
        </div>
        <div className="cc-dev-slot cc-dev-slot--carer">
          <DeviceFrame role="carer" caption="Her daughter's phone"
                       clock={beat.carerClock ?? beat.clock} tabs={CARER_TABS}>
            <div className="cc-lyr is-flat">
              <div className="cc-caps">
                <span className="cc-label cc-cap-early">The visit</span>
                <span className="cc-label cc-cap-late">The next morning</span>
              </div>
              <CarerWatchFors />
            </div>
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}

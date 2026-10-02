"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FIGURES, ART } from "@/content/home";
import AmbientClip from "./AmbientClip";
import Figure from "./Figure";

gsap.registerPlugin(ScrollTrigger);

/**
 * The three problem figures, each over a full-viewport room that dissolves into
 * the next as you scroll.
 *
 * Structured after Instrument.tsx, which is a verified build, and deliberately
 * does not share a hook with it: the two timelines have nothing in common
 * beyond the pin, and a shared abstraction would put a working scrub at risk to
 * save about thirty lines. Extract only if a fourth act ever appears.
 *
 * The clips co-mount as stacked layers and the TIMELINE decides what is seen.
 * The derived index selects the copy block only. Letting an index decide what
 * is mounted is what made /demo's first build cut instead of scrub.
 */
const PER_BEAT = 700;

/**
 * 768, not Instrument's 1100, and the difference is reasoned rather than
 * copied. Instrument abandons its pin at 1100 because its stage holds
 * fixed-size objects: a 44-column chart, four readouts and a 620px device, none
 * of which fit a narrow viewport. A room contains no fixed-width object at all,
 * only footage that crops and type that reflows, so width is not what binds
 * here. A SHORT viewport is: the lower-third band needs room for a body
 * paragraph under a display-scale figure. Hence both a width and a height gate.
 */
const PIN_FROM = 768;
const PIN_MIN_H = 640;

/** One room per figure, in the page's order. */
const ROOM_ART = [ART.hero, ART.kitchen, ART.voiddeck];
/**
 * Per-room crop bias, added 2026-08-10. `.cc-clip`'s object-fit:cover had no
 * object-position, so it defaulted to centring the source frame. The hero and
 * kitchen clips both put their table (the blood-pressure cuff and paperwork;
 * the coffee, pill organiser and newspaper) in the lower half of the shot, and
 * a centred crop under a box shorter than the source's aspect cuts most of it,
 * reading as "the room" rather than "the desk" or "the table". Void deck is
 * untouched: not flagged, and its stone table already sits closer to centre.
 */
const ROOM_CROP = ["cc-clip--crop-hero", "cc-clip--crop-kitchen", ""];

export default function Rooms() {
  const wrap = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  // Same default as both /demo acts: the server-rendered HTML is the plain
  // stack, and that is what a no-JS visitor keeps.
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const room = window.matchMedia(
      `(min-width: ${PIN_FROM}px) and (min-height: ${PIN_MIN_H}px)`);
    const decide = () => setReduced(motion.matches || !room.matches);
    decide();
    // Re-decided on resize, so dragging a window across either gate swaps the
    // two paths rather than leaving a pin measured for the other one.
    motion.addEventListener("change", decide);
    room.addEventListener("change", decide);
    return () => {
      motion.removeEventListener("change", decide);
      room.removeEventListener("change", decide);
    };
  }, []);

  useEffect(() => {
    if (reduced || !wrap.current) return;
    const ctx = gsap.context((self) => {
      const q = self.selector!;

      // Opening state, set here rather than in CSS so the server-rendered HTML
      // stays the plain stack with nothing hidden in it.
      gsap.set(q(".cc-room"), { autoAlpha: 0 });
      gsap.set(q(".cc-room").slice(0, 1), { autoAlpha: 1 });
      gsap.set(q(".cc-room-fig"), { autoAlpha: 0, y: 18 });
      gsap.set(q(".cc-room-fig").slice(0, 1), { autoAlpha: 1, y: 0 });

      // One unit of timeline per beat. ScrollTrigger maps scroll progress onto
      // it, so every tween below is scrubbed rather than played. The rooms
      // cross-dissolve because they are photographs of empty places: unlike
      // /demo's dense text screens, two of these CAN share the frame, and the
      // overlap is what makes the sequence read as one continuous morning.
      const tl = gsap.timeline({ defaults: { ease: "power1.inOut" } });

      for (let n = 1; n < ROOM_ART.length; n++) {
        tl.to(q(".cc-room").slice(n - 1, n), { autoAlpha: 0, duration: 0.55 }, n - 0.3)
          .to(q(".cc-room").slice(n, n + 1), { autoAlpha: 1, duration: 0.55 }, n - 0.3)
          // The figure leaves before its successor arrives. These are dense
          // blocks of type; overlapping them printed the call timer through her
          // dose lines on /demo and the same arithmetic applies here.
          .to(q(".cc-room-fig").slice(n - 1, n), { autoAlpha: 0, y: -14, duration: 0.3 }, n - 0.35)
          .to(q(".cc-room-fig").slice(n, n + 1), { autoAlpha: 1, y: 0, duration: 0.4 }, n - 0.05);
      }

      ScrollTrigger.create({
        trigger: wrap.current!,
        start: "top top",
        end: () => `+=${FIGURES.length * PER_BEAT}`,
        pin: true,
        scrub: true,
        animation: tl,
        // Selects the mono step label only. It must never decide what is
        // mounted.
        onUpdate: (self) =>
          setI(Math.min(FIGURES.length - 1,
            Math.max(0, Math.floor(self.progress * FIGURES.length - 0.15)))),
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduced]);

  if (reduced) {
    return (
      <div className="cc-rooms-stack">
        {FIGURES.map((f, n) => (
          <section className="cc-rooms-beat" key={f.id}>
            <div className="cc-rooms-film">
              <AmbientClip {...ROOM_ART[n]} className={`cc-clip--bg ${ROOM_CROP[n]}`} />
              <div className="cc-scrim" aria-hidden="true" />
            </div>
            <div className="cc-room-band">
              <div className="cc-wrap cc-room-in">
                {/* The pinned path carries this too. It had no counterpart
                    here at all, so the reduced-motion and no-JS reader got
                    three figures with nothing saying they are one argument. */}
                <div className="cc-label cc-room-step">
                  Problem statement {n + 1} of {FIGURES.length}
                </div>
                <Figure label={f.label} value={f.value} gloss={f.gloss} source={f.source} />
                <p className="cc-band-b">{f.body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div ref={wrap} className="cc-rooms">
      {ROOM_ART.map((a, n) => (
        <div className="cc-room" key={a.src} aria-hidden={n > 0 || undefined}>
          <AmbientClip {...a} className={`cc-clip--bg ${ROOM_CROP[n]}`} />
          <div className="cc-scrim" aria-hidden="true" />
        </div>
      ))}
      <div className="cc-room-band">
        <div className="cc-wrap cc-room-in">
          {/* "1 of 3" until 2026-08-09, which counted the beats without ever
              saying what they were counting. Three cited figures over three
              rooms read as an argument only once the reader knows they are the
              problem being answered by the act below them. */}
          <div className="cc-label cc-room-step">
            Problem statement {i + 1} of {FIGURES.length}
          </div>
          {/* All three co-mounted: the timeline, not the index, decides what is
              seen. `i` reaches only the step label above. */}
          {FIGURES.map((f) => (
            <div className="cc-room-fig" key={f.id}>
              <Figure label={f.label} value={f.value} gloss={f.gloss} source={f.source} />
              <p className="cc-band-b">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

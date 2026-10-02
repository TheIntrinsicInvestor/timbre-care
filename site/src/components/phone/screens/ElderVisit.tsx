"use client";
import ConsentTap from "../../ConsentTap";
import { HER_VISIT } from "@/content/persona";

/**
 * Beats 1 to 3 are one screen, not three. The header never moves across them;
 * only the region below it changes, which is what makes the consent tap read
 * as something happening inside an app rather than as a slide change.
 *
 * All three sub-regions are rendered at once and marked with data-sub. The
 * walkthrough crossfades them with GSAP. Nothing here knows about scroll.
 *
 * This screen must never show captions, a transcript or a translation. Live
 * captioning was removed from the product on 2026-08-07: it asks an 80-year-old
 * to read and listen at once in the room where her attention is most contested.
 */
export default function ElderVisit({
  armed, onTap,
}: { armed: boolean; onTap: () => void }) {
  return (
    <>
      <div className="cc-label" lang="zh">{HER_VISIT.kicker}</div>
      <div className="cc-sc-h" lang="zh">{HER_VISIT.day}</div>

      <div className="cc-sub" data-sub="idle">
        <div className="cc-card">
          <div className="cc-card-t" lang="zh">{HER_VISIT.doctor}</div>
          <div className="cc-card-b" lang="zh">{HER_VISIT.dept}</div>
        </div>
        <div className="cc-sc-idle" lang="zh">尚未开始录音</div>
      </div>

      <div className="cc-sub" data-sub="ready">
        <div className="cc-card">
          <div className="cc-card-t" lang="zh">{HER_VISIT.doctor}</div>
          <div className="cc-card-b" lang="zh">{HER_VISIT.dept}</div>
        </div>
        <div className="cc-act">
          <ConsentTap armed={armed} onTap={onTap} />
          <p className="cc-act-n" lang="zh">录音前会先出声告知</p>
        </div>
      </div>

      <div className="cc-sub" data-sub="rec">
        <div className="cc-rec">
          <div className="cc-rec-h">
            <span className="cc-rec-dot" /><span lang="zh">录音中</span>
          </div>
          <div className="cc-rec-t">00:12</div>
          <div className="cc-rec-w" aria-hidden="true">
            {Array.from({ length: 19 }, (_, n) => (
              <i key={n} style={{ animationDelay: `${(n % 7) * 0.11}s` }} />
            ))}
          </div>
          <button type="button" className="cc-rec-stop" lang="zh">停止</button>
        </div>
      </div>
    </>
  );
}

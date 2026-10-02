"use client";

/**
 * The label used to read "Hold to consent" on a click handler, in English, on
 * the one screen the site argues is hers and in her language. It now names the
 * action the control actually performs, in the script her record is written in.
 * The English sits outside the frame with the rest of the gloss.
 */
export default function ConsentTap({
  armed, onTap,
}: { armed: boolean; onTap: () => void }) {
  return (
    <button type="button" className="cc-consent" onClick={onTap}
            aria-pressed={armed} lang="zh">
      {armed ? "录音中" : "按一下开始录音"}
    </button>
  );
}

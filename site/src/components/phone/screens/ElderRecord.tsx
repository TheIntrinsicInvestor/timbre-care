import { HER_RECORD } from "@/content/persona";

/**
 * Beats 4 and 6, and the hero showcase on /. Large print, one dose per card,
 * because the dose is what she is reading back. The drugs are named in Chinese
 * because her record is written in Chinese, and with /demo's tier table gone
 * this screen is where the language capability is shown rather than claimed.
 *
 * Values are illustrative. See the header of content/persona.ts.
 */
export default function ElderRecord() {
  return (
    <>
      <div className="cc-label" lang="zh">看诊记录</div>
      <div className="cc-sc-h" lang="zh">{HER_RECORD.heading}</div>
      <div className="cc-doses">
        {HER_RECORD.lines.map((l) => (
          <div className="cc-dose" key={l} lang="zh">{l}</div>
        ))}
      </div>
      <div className="cc-sc-foot">
        <span className="cc-label" lang="zh">{HER_RECORD.foot}</span>
      </div>
    </>
  );
}

/**
 * Beat 5. The check-in call, placed by the app (PRD 13.1). Deliberately shows
 * no words: this screen is the one place a transcript would be most tempting
 * and most wrong. Bars are decoration, so the block is aria-hidden.
 */
export default function ElderCall() {
  return (
    <div className="cc-call">
      <div className="cc-label" lang="zh">通话中</div>
      <div className="cc-call-n" lang="zh">关怀通话</div>
      <div className="cc-call-s">02:14</div>
      <div className="cc-call-w" aria-hidden="true">
        {Array.from({ length: 5 }, (_, n) => (
          <i key={n} style={{ animationDelay: `${n * 0.14}s` }} />
        ))}
      </div>
      <div className="cc-call-l" lang="zh">福建话</div>
      <button type="button" className="cc-call-end" lang="zh">结束</button>
    </div>
  );
}

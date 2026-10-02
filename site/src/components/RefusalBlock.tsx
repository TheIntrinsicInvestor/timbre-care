export default function RefusalBlock({
  tool, args, message, cite,
}: { tool: string; args: string; message: string; cite: string }) {
  return (
    <div className="cc-refusal">
      <div className="cc-refusal-call">
        <span className="cc-refusal-tool">{tool}</span>
        <span className="cc-refusal-args">({args})</span>
      </div>
      <div className="cc-refusal-out">
        <span className="cc-label cc-refusal-status">Blocked</span>
        <p>{message}</p>
        <span className="cc-label">{cite}</span>
      </div>
    </div>
  );
}

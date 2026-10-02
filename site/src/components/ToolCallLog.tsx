import { CALLS } from "@/content/agent";

export default function ToolCallLog() {
  return (
    <div className="cc-log">
      <ol>
        {CALLS.map((c, n) => (
          <li key={c.call}>
            <span className="cc-log-n">{String(n + 1).padStart(2, "0")}</span>
            <span className="cc-log-call">{c.call}</span>
            {/* Not decoration: this is the row in signal_store.json the call
                left behind, so the claim can be checked against the console. */}
            <span className="cc-log-left">{c.left}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

import { TOOL_GROUPS } from "@/content/agent";

/**
 * Seventeen tools, grouped by what they touch. The names are the real ones, so
 * a reader can match them against the log further down the page: five of the
 * nine calls in that run are named here.
 */
export default function ToolSurface() {
  return (
    <div className="cc-tools">
      {TOOL_GROUPS.map((g) => (
        <section className="cc-toolg" key={g.group}>
          <div className="cc-label">{g.group}</div>
          <dl>
            {g.tools.map((t) => (
              <div className="cc-tool" key={t.name}>
                <dt>{t.name}</dt><dd>{t.what}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

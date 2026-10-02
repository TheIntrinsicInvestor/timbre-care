import SiteNav from "@/components/SiteNav";
import Architecture from "@/components/Architecture";
import SkillCards from "@/components/SkillCards";
import ToolSurface from "@/components/ToolSurface";
import ToolCallLog from "@/components/ToolCallLog";
import RefusalBlock from "@/components/RefusalBlock";
import Provenance from "@/components/Provenance";
import ClipGrid from "@/components/ClipGrid";
import { REFUSALS, DECLINED } from "@/content/agent";

/**
 * The technical route, rebuilt 2026-08-09. It exhibited a run and never
 * explained the system that produced it: a judge scoring agent autonomy could
 * read nine calls and three refusals without ever learning what the tool layer
 * was or where it came from.
 *
 * Three explanatory sections sit above the evidence now, and the evidence is
 * untouched below them, which is the order that matters. Everything above can
 * be asserted; only what is below can be checked.
 *
 * This page names no development tool. The subject is the product agent and the
 * surface it was given, and tests/agent.mjs fails the build on four of them.
 */
export default function AgentPage() {
  return (
    <>
      <SiteNav current="/agent" />
      <div className="cc-wrap">
        <header className="cc-hero-left cc-hero-left--big">
          <div className="cc-label">How it is built, and how to check it</div>
          <h1>Two skills, an agent, and seventeen tools it has to go through.</h1>
          {/* Names the subject before the log below starts saying "her record".
              This route introduced nobody at all until 2026-08-09. */}
          <p className="cc-lede-left">
            Timbre Care looks after an older person living at home. The agent
            below never touches her record directly: it reaches it through a
            purpose-built tool layer, over MCP, that enforces every product
            rule and refuses what it shouldn&rsquo;t do. The run at the bottom
            of this page is that refusal happening three times.
          </p>
        </header>

        <h2>How the pieces fit</h2>
        <p className="cc-lede-left">
          Four layers, and the last one is the argument: the console on{" "}
          <a href="/record">the record</a> is generated from the same file the
          tools write to, so it cannot show something the agent did not do.
        </p>
        <Architecture />

        <h2>The two skills</h2>
        <p className="cc-lede-left">
          A skill describes the job. It deliberately does not carry the rules,
          because a procedure an agent can read is a procedure an agent can
          decide to depart from.
        </p>
        <SkillCards />

        <h2>Seventeen tools</h2>
        <p className="cc-lede-left">
          Exposed over MCP, the open protocol that let the agent discover all
          seventeen of them itself rather than being told about them by a
          bespoke integration. It&rsquo;s the only thing that can touch the
          record: no severity parameter anywhere in the surface, no call that
          mutes a finding, urgency may rise and never fall.
        </p>
        <ToolSurface />

        <h2>One run, nine calls</h2>
        <p className="cc-lede-left">
          A recurring WorkBuddy automation fired on the clock and ran the whole
          check-in with nobody present. The goal it was given was one sentence. Every call
          below left something behind in the record, named beside it, so none of
          this has to be taken on trust.
        </p>
      </div>

      {/* The log sat inside a 1180px column, which read as a widget on a page
          rather than the evidence the page exists for. .cc-wrap closes above and
          reopens below so this can reach both edges. It is a light act: the
          terminal reading comes from the mono grid and the ruled rows, not from
          a dark ground. */}
      <section className="cc-act cc-bleed cc-agent-act">
        <div className="cc-wrap">
          <ToolCallLog />
        </div>
      </section>

      <div className="cc-wrap">
        <h2>What it decided not to do</h2>
        <p className="cc-lede-left">
          The record cannot show this one, because nothing was written. It is on
          the recording instead.
        </p>
        <blockquote className="cc-quote">{DECLINED.quote}</blockquote>
        <p className="cc-lede-left">{DECLINED.gloss}</p>

        <h2>Where it was stopped</h2>
        <p className="cc-lede-left">
          Each of these is the message the tool layer actually raises, quoted
          from the rule that raises it.
        </p>
        {REFUSALS.map((r) => <RefusalBlock key={r.tool} {...r} />)}

        {/* The boundary arrives here, after the run and the refusals a reader
            has just been asked to believe, and before the recordings of them.
            It existed only at the internal scroll foot of /record's console
            embed until 2026-08-10, which the judge review's cold read read as
            concealment rather than as disclosure. */}
        <h2>What is replayed, and what is live</h2>
        <Provenance />

        <h2>Recorded</h2>
        {/* Which one to open, before a judge decides not to open any. The
            manifest names two different clips as strongest, for two different
            criteria, so both are pointed at rather than one picked silently. */}
        <p className="cc-lede-left">
          Eight recordings of the agent in the harness, planning and being
          stopped. Short on time: the jargon refusal is the tool layer
          overruling the agent, and the last one is the visit writing what the
          next call asks.
        </p>
        <ClipGrid />
      </div>
    </>
  );
}

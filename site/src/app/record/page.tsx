import SiteNav from "@/components/SiteNav";
import ConsoleEmbed from "@/components/ConsoleEmbed";

export default function RecordPage() {
  return (
    <>
      <SiteNav current="/record" />
      <div className="cc-wrap">
        <header className="cc-hero-left cc-hero-left--big">
          <div className="cc-label">Generated from the record itself</div>
          {/* "Nothing here is written by hand" sat above four paragraphs of
              hand-written site copy and read as a claim about this page. It
              means the console, so it now says the console. The second half
              also repeated the console's own opening line word for word. */}
          <h1>The console below is not written by hand.</h1>
          {/* "she did not answer" had no antecedent on this route: it was the
              first pronoun after the nav and nobody had been introduced. */}
          <p className="cc-lede-left">
            This is the record of one older person living at home, generated from
            the same file the agent writes to, so it cannot show something the
            agent did not do. Look for the days with no point on the line: she
            did not answer, and those days stay missing rather than being
            bridged, because the day-to-day variability is the signal itself.
          </p>
          <p className="cc-lede-left">
            The console scrolls inside its frame. At its foot it states what
            is live and what is replayed.
          </p>
        </header>
        <ConsoleEmbed />
      </div>
    </>
  );
}

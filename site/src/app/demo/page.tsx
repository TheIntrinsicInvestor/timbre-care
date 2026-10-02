import SiteNav from "@/components/SiteNav";
import Walkthrough from "@/components/Walkthrough";
import ActTurn from "@/components/ActTurn";
import Instrument from "@/components/Instrument";

export default function Demo() {
  return (
    <>
      <SiteNav current="/demo" />
      {/* .cc-hero has no max-width and no auto margin: it is the full-bleed
          showcase header /'s hero is built on, and used bare here it started
          this h1 at the viewport edge while /agent's and /record's started at
          the 1180px measure. The interior routes share one header. */}
      <div className="cc-wrap">
        <header className="cc-hero-left cc-hero-left--big">
          <div className="cc-label">Two acts, twelve beats</div>
          <h1>One visit. One call. One pattern over time.</h1>
          {/* Opens by saying who "she" is. Without the first clause this read
              "The calls measure how she speaks" with no antecedent on the
              route at all. Rewritten 2026-08-10 so the hero names drift
              tracking as a third part of the product, not only the visit and
              the call: the H1 was previously silent on it entirely. */}
          <p className="cc-lede-left">
            An older person living at home, and the family looking after her.
            The visit writes what the next call asks. Each call adds one point
            to a pattern only her own history sets the baseline for, and a
            shift in that pattern is treated as a finding, not a diagnosis.
            What she raises reaches only the people she authorised.
          </p>
          {/* The app-status disclosure, added 2026-08-10 on Brian's sign-off.
              It reverses the 2026-08-08 decision recorded in DESIGN.md that
              these screens carry no disclosure the elder's app is unbuilt: the
              judge review's cold read finished the walkthrough believing the
              app exists today, because six screens, the hero device and the
              two-phones act all read as an operating product and the only
              counterweight never mentioned the app. It is not a prototype
              label and it does not touch the screens, which is what the
              original decision was protecting. */}
          <p className="cc-demo-note">
            This walkthrough shows a representative case, on screens that are
            the product&apos;s design. The agent and the record behind them are
            built, and the record it actually wrote is on{" "}
            <a href="/record">the record</a>.
          </p>
        </header>
      </div>
      <Walkthrough />
      <ActTurn />
      <Instrument />
      {/* Three tier cards with word-error rates on them stood here until
          2026-08-09. Every number was true and the section was still wrong for
          this route: a consumer does not want an error rate, and a tier named
          as a failure case ("no recogniser exists") reads as a gap in the
          product rather than as the reason its coverage is honest. The claim
          survives as one paragraph; the essay does not. The tiering itself is
          unchanged and still documented in PRD 5.4. */}
      <section className="cc-wrap cc-lang">
        <div className="cc-label">Across languages</div>
        <h2>It works in the language she actually speaks.</h2>
        <p className="cc-lede-left">
          The call and the record work in English, Mandarin, Malay, Tamil and
          Cantonese end to end. Where speech recognition is not reliable enough
          to trust, the product reads how she speaks rather than what she said,
          so the daily call still works in a language no recogniser handles, and
          nothing counted off an unreliable transcript is ever charted.
        </p>
      </section>
    </>
  );
}

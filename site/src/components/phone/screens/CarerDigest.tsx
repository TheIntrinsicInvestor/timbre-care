import { FLAG, SPREAD, COUNTS } from "@/content/instrument";

/**
 * The last beat, on the caregiver's phone. The weekly drift digest, carrying a
 * finding.
 *
 * "Goes out", never "sent": nothing in this build delivers anything. The tool
 * that decides a recipient's digest records a routing and no more, which is
 * why its return key is routed_to. tests/copy-audit.mjs fails the build on
 * send vocabulary across every route.
 *
 * The last two sentences are the product's whole claim and its whole limit in
 * one place: a change in how she speaks, worth mentioning to a doctor, and not
 * a conclusion about her. Never reword this into a finding about her memory.
 *
 * This digest held nothing until 2026-08-09, because the real record's flag was
 * withheld while a sedating medication moved. That reading is still on /agent.
 */
export default function CarerDigest() {
  return (
    <>
      <div className="cc-label">Weekly drift digest</div>
      <div className="cc-dg-h">A change worth mentioning.</div>
      <p className="cc-dg-b">
        {FLAG.marker} has become {FLAG.what} over the last {SPREAD.recentDays}{" "}
        days, against her own baseline. This is a change in how she speaks. It
        is not a conclusion about her, and it is worth raising at her next
        appointment.
      </p>
      <div className="cc-dg-n">
        <div className="cc-label">Still counted</div>
        <div className="cc-dg-c">
          {COUNTS.usable} usable samples · {COUNTS.missing} days missing
        </div>
      </div>
    </>
  );
}

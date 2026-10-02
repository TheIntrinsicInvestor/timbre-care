"""Exercise the Appointment Companion end to end, and every guard rail on it.

Run this AFTER smoke_test.py, not before: smoke_test.py reseeds the store from
scratch, which would throw away the watch-fors this run writes.

Run:  python smoke_test_appointment.py
"""

from __future__ import annotations

import sys

from mcp_server import rules, store
from mcp_server.server import (
    check_confounds,
    confirm_medication_change,
    get_appointment_record,
    next_consult_segments,
    publish_caption,
    publish_elder_summary,
    publish_recipient_digest,
    reconcile_medications,
    start_appointment_capture,
    write_watch_fors,
)

ELDER = "lim-mei-hua"
LANG = "English"  # legible in a recording; her stored preference is written Chinese
failures: list[str] = []

# What a competent agent would caption, one per clinician segment.
CAPTIONS = {
    "s01": "The doctor is asking how you have been since July.",
    "s03": "Your long-term sugar reading has gone up to 8.2. That is higher than last time.",
    "s04": "The doctor is increasing your diabetes medicine, metformin, to 850 mg twice a day.",
    "s06": "The X-ray shows the inside of your knee joint is worn down.",
    "s07": "No strong painkiller, because of your kidneys. You will be sent to physiotherapy.",
    "s09": "Your sleeping tablet is being reduced from 25 mg to 10 mg, to stop the morning fog.",
    "s10": "The doctor is checking that you still take amlodipine for blood pressure.",
    "s12": "Your weight is down 2 kilos since July. The doctor is asking if you finish your meals.",
    "s14": "If you are still leaving half your meals in two weeks, the doctor wants to look at it.",
    "s15": "Come back in 6 weeks. Come sooner if the knee worsens or you feel giddy standing up.",
}


def expect_violation(label: str, fn) -> None:
    try:
        fn()
    except rules.RuleViolation as exc:
        print(f"  refused ({label}): {str(exc).splitlines()[0]}")
    else:
        failures.append(f"{label} was allowed but must be refused")
        print(f"  NOT REFUSED: {label}")


def main() -> int:
    store.load()  # seed if this is a clean checkout

    print("1. consent gate")
    expect_violation("recipient consenting for the elder", lambda: start_appointment_capture(
        ELDER, consent_tap_by="Serene", announcement_played=True,
    ))
    expect_violation("no audible announcement", lambda: start_appointment_capture(
        ELDER, consent_tap_by="Lim Mei Hua", announcement_played=False,
    ))
    expect_violation("the agent tapping for her", lambda: start_appointment_capture(
        ELDER, consent_tap_by="agent", announcement_played=True,
    ))
    expect_violation("a clinician tapping for her", lambda: start_appointment_capture(
        ELDER, consent_tap_by="Dr Tan", announcement_played=True,
    ))
    cap = start_appointment_capture(
        ELDER, consent_tap_by="Lim Mei Hua", announcement_played=True
    )
    capture_id = cap["capture_id"]
    print(f"  opened {capture_id}: {cap['clinician']} at {cap['clinic']},"
          f" {cap['segments_total']} segments")
    print(f"  her caption language: {cap['caption_language']}")

    print("\n2. replay and caption")
    captioned = 0
    while True:
        batch = next_consult_segments(ELDER, capture_id, count=4)
        for seg in batch["segments"]:
            if not seg["needs_caption"]:
                print(f"  [{seg['at']}] elder: {seg['text']}")
                continue
            written = publish_caption(
                ELDER, capture_id, seg["segment_id"], CAPTIONS[seg["segment_id"]], LANG
            )
            captioned += 1
            jargon = f"  (replaced {written['jargon_replaced']})" if written["jargon_replaced"] else ""
            print(f"  [{seg['at']}] caption: {written['written']}{jargon}")
        if batch["finished"]:
            break
    print(f"  {captioned} captions published")

    print("\n2b. reopening today's capture resumes it, and destroys nothing")
    # A retry is the normal case, and this used to reset the cursor to 0 and
    # empty the captions list without a word. The two alternate phrasings are
    # the ones real runs actually used for her tap.
    before = store.get_elder(store.load(), ELDER)
    n_captions = len(before["appointments"][capture_id]["captions"])
    n_consent = len(before["consent_log"])
    for phrasing in ("Lim Mei Hua", "lim-mei-hua", "Lim Mei Hua (the elder herself)"):
        again = start_appointment_capture(
            ELDER, consent_tap_by=phrasing, announcement_played=True
        )
        if not again.get("already_open"):
            failures.append(f"reopening as {phrasing!r} did not resume the open capture")
    after = store.get_elder(store.load(), ELDER)
    if len(after["appointments"][capture_id]["captions"]) != n_captions:
        failures.append("reopening the capture changed the captions already written")
    if len(after["consent_log"]) != n_consent:
        failures.append("reopening the capture appended a duplicate consent entry")
    print(f"  resumed with {again['captions_so_far']} captions and cursor "
          f"{again['cursor']} intact, consent ledger still {n_consent} entries")

    print("\n3. caption guard rails")
    expect_violation("invented dose", lambda: publish_caption(
        ELDER, capture_id, "s04",
        "The doctor is increasing your diabetes medicine to 1000 mg twice a day.", LANG,
    ))
    expect_violation("medicine not mentioned here", lambda: publish_caption(
        ELDER, capture_id, "s06",
        "Your knee joint is worn down, so take more amitriptyline for it.", LANG,
    ))
    expect_violation("jargon carried over", lambda: publish_caption(
        ELDER, capture_id, "s06",
        "The X-ray shows osteoarthritis in your knee.", LANG,
    ))
    expect_violation("caption too long for large print", lambda: publish_caption(
        ELDER, capture_id, "s01",
        "The doctor would like to know how things have been going for you " * 3, LANG,
    ))
    expect_violation("caption in a language with no orthography", lambda: publish_caption(
        ELDER, capture_id, "s01", "Isu long time no see.", "Hokkien",
    ))

    print("\n3b. the same rules in her own written language")
    # Regression: units were matched on Latin letters only, so a correct dose
    # in written Chinese read as a bare number and was refused. The agent then
    # stripped the dose out of her record, which is the opposite of the intent.
    zh = "Chinese (standard written)"
    ok = publish_caption(
        ELDER, capture_id, "s04",
        "医生要把您的糖尿病药二甲双胍加到850毫克，一天两次。", zh,
    )
    print(f"  accepted: {ok['written']}")
    expect_violation("invented dose in Chinese", lambda: publish_caption(
        ELDER, capture_id, "s04",
        "医生要把您的糖尿病药加到1000毫克，一天两次。", zh,
    ))
    expect_violation("wrong interval in Chinese", lambda: publish_caption(
        ELDER, capture_id, "s15", "6个月后再来复诊。", zh,
    ))
    ok = publish_caption(ELDER, capture_id, "s15", "6周后再来复诊。", zh)
    print(f"  accepted: {ok['written']}")

    print("\n4. medication reconciliation, which writes nothing")
    rec = reconcile_medications(ELDER, capture_id)
    print(f"  confirmed: {[m['name'] for m in rec['confirmed_against_list']]}")
    print(f"  not on her list: {[m['name'] for m in rec['not_on_list']]}")
    print(f"  writes performed: {rec['writes_performed']}")
    if rec["writes_performed"] != 0:
        failures.append("reconcile_medications wrote to the store")
    if not any(m["name"] == "amlodipine" for m in rec["not_on_list"]):
        failures.append("amlodipine was not surfaced as unrecognised")

    print("\n5. confirmation, by a named human")
    expect_violation("transcript confirming its own change", lambda: confirm_medication_change(
        ELDER, "amlodipine", "add", confirmed_by="transcript",
    ))
    added = confirm_medication_change(
        ELDER, "amlodipine", "add", confirmed_by="Serene (daughter)", dose="5 mg mane"
    )
    print(f"  added amlodipine: {added['confound_register']}")
    reduced = confirm_medication_change(
        ELDER, "amitriptyline", "reduce", confirmed_by="Serene (daughter)",
        dose="10 mg at night",
    )
    print(f"  reduced amitriptyline: {reduced['confound_register']}")

    print("\n6. the change reaches the confound register")
    conf = check_confounds(ELDER)
    kinds = [c["kind"] for c in conf["confounds"]]
    print(f"  clear={conf['clear']}")
    for c in conf["confounds"]:
        print(f"    {c['detail']}")
    if "sedating_medication_changed" not in kinds:
        failures.append("today's sedating med change did not reach the confound register")

    print("\n7. the two outputs")
    summary = publish_elder_summary(
        ELDER, capture_id,
        whats_happening=(
            "Your knee is worn down on the inside of the joint. Your long-term "
            "sugar reading has gone up."
        ),
        whats_changed=(
            "Your diabetes medicine goes up to 850 mg twice a day. Your sleeping "
            "tablet goes down from 25 mg to 10 mg."
        ),
        what_to_do=(
            "Take the new doses. You will be sent to physiotherapy for the knee. "
            "Try to finish your meals."
        ),
        when_to_return=(
            "In 6 weeks. Sooner if the knee gets worse or you feel giddy when "
            "you stand up."
        ),
    )
    print(f"  elder summary to {summary['written_for']}, "
          f"not to {summary['not_written_for']}")

    # "6 months" shares its digit with the "6 weeks" the doctor actually said,
    # so this only fails if the unit is checked too.
    expect_violation("summary inventing a follow-up interval", lambda: publish_elder_summary(
        ELDER, capture_id,
        whats_happening="Your knee is worn down.",
        whats_changed="Your diabetes medicine goes up.",
        what_to_do="Take the new doses.",
        when_to_return="Come back in 6 months.",
    ))

    digest = publish_recipient_digest(
        ELDER, capture_id,
        plain_diagnosis=(
            "Wear and tear in the inner side of the right knee joint, seen on "
            "X-ray. Blood sugar control has worsened."
        ),
        medication_changes=(
            "Metformin increased to 850 mg twice daily. Amitriptyline reduced to "
            "10 mg at night because of morning drowsiness. Amlodipine confirmed "
            "as still being taken and added to the list."
        ),
        next_appointment="6 weeks, earlier if the knee worsens or she feels giddy standing.",
        what_to_watch_for=[
            "whether she is finishing her meals",
            "whether the morning drowsiness settles on the lower dose",
            "knee pain going down the stairs",
            "giddiness when standing up",
        ],
        suggested_questions=[
            "Has the physiotherapy referral come through?",
            "Is she managing the twice-daily dose without help?",
        ],
    )
    print(f"  digest routed to {digest['routed_to']}")
    print(f"  withheld from {digest['not_routed_to'] or 'nobody'}")

    print("\n8. watch-fors reach the check-in call")
    expect_violation("watch-for that asks for severity", lambda: write_watch_fors(
        ELDER, capture_id, ["how bad the knee pain is on the stairs"],
    ))
    written = write_watch_fors(ELDER, capture_id, [
        "knee pain going down the stairs",
        "whether she is finishing her meals",
        "whether the morning drowsiness settles on the lower dose",
        "giddiness when standing up",
    ])
    print(f"  replaced: {written['replaced']}")
    for w in written["written"]:
        print(f"    {w['id']}: {w['text']}  (from {w['source']})")
    # Provenance is the appointment's date, not the date the write-up ran.
    expected_source = f"appointment {cap['capture_id'][len('capture-'):]}"
    if any(w["source"] != expected_source for w in written["written"]):
        failures.append(
            f"watch-for provenance is not {expected_source!r}, so a write-up "
            "finished after midnight claims an appointment that never happened"
        )

    print("\n9. the record reads back, and reading changes nothing")
    before_hash = store.DATA_PATH.read_bytes()
    record = get_appointment_record(ELDER)
    if record["capture_id"] != capture_id:
        failures.append("get_appointment_record did not return the latest capture")
    if [c["caption"] for c in record["captions"]] != [
        c["caption"] for c in store.get_elder(store.load(), ELDER)
        ["appointments"][capture_id]["captions"]
    ]:
        failures.append("the captions read back do not match what was published")
    if record["digest_routed_to"] != digest["routed_to"]:
        failures.append("the digest routing read back does not match what was recorded")
    if record["watch_fors_written"] != [w["text"] for w in written["written"]]:
        failures.append("the watch-fors read back do not match what was written")
    get_appointment_record(ELDER, capture_id)
    if store.DATA_PATH.read_bytes() != before_hash:
        failures.append("get_appointment_record wrote to the store; it must only read")
    print(f"  {record['capture_id']}: {len(record['captions'])} captions, "
          f"outputs {record['outputs_present']}")
    print(f"  digest routed to {record['digest_routed_to']}")
    print(f"  captures on record: {[c['capture_id'] for c in record['all_captures']]}")

    print()
    if failures:
        for f in failures:
            print(f"FAIL: {f}")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())


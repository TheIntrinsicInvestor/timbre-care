"""Exercise the happy path and every guard rail, without a client attached.

Run:  python smoke_test.py
"""

from __future__ import annotations

import asyncio
import sys

from mcp_server import rules, store
from mcp_server.server import (
    check_confounds,
    get_check_in_context,
    log_call_outcome,
    mcp,
    notify_recipients,
    place_check_in_call,
    raise_content_flag,
    raise_drift_flag,
    set_check_in_cadence,
)

ELDER = "lim-mei-hua"
failures: list[str] = []


def expect_violation(label: str, fn) -> None:
    try:
        fn()
    except rules.RuleViolation as exc:
        print(f"  refused ({label}): {str(exc).splitlines()[0]}")
    else:
        failures.append(f"{label} was allowed but must be refused")
        print(f"  NOT REFUSED: {label}")


def main() -> int:
    if store.DATA_PATH.exists():
        store.DATA_PATH.unlink()

    print("tools registered:", sorted(t.name for t in asyncio.run(mcp.list_tools())))

    print("\n1. context")
    ctx = get_check_in_context(ELDER)
    print(f"  {ctx['display_name']}, tier {ctx['language_tier']} {ctx['spoken_language']}")
    print(f"  cadence {ctx['check_in_cadence']}, at most "
          f"{ctx['days_between_calls_at_most']}d between calls")
    print(f"  baseline {ctx['baseline']['usable_samples']}"
          f"/{ctx['baseline']['required_samples']}"
          f" mature={ctx['baseline']['mature']}")
    print(f"  eligible families: "
          f"{[k for k, v in ctx['marker_eligibility'].items() if v]}")
    print(f"  watch-fors: {[w['text'] for w in ctx['watch_fors']]}")

    print("\n1b. she sets her own cadence")
    cad = set_check_in_cadence(ELDER, "every_other_day", set_by="Lim Mei Hua")
    print(f"  {cad['previous']} -> {cad['cadence']}, set by {cad['set_by']}")
    print(f"  {cad['explanation']}")
    expect_violation("cadence set by nobody in particular", lambda: set_check_in_cadence(
        ELDER, "every_other_day", set_by="",
    ))
    expect_violation("cadence set by the agent itself", lambda: set_check_in_cadence(
        ELDER, "every_other_day", set_by="agent",
    ))
    set_check_in_cadence(ELDER, "daily", set_by="Lim Mei Hua")

    print("\n2. call")
    result = place_check_in_call(
        ELDER,
        opening="Auntie Lim ah, morning! Slept okay or not?",
        watch_for_questions=[
            "Your knee, still give you trouble on the stairs?",
            "Lunch yesterday, you finish or not?",
        ],
        probe="That photo Serene sent you, what was it?",
    )
    print(f"  {result['duration_s']}s, note: {result['note']}")

    print("\n3. log")
    logged = log_call_outcome(
        ELDER, "completed", note=result["note"], markers=result["observed_markers"]
    )
    print(f"  {logged['sample']}, usable samples now {logged['usable_samples']}")

    print("\n4. confounds")
    conf = check_confounds(ELDER)
    print(f"  clear={conf['clear']} {[c['detail'] for c in conf['confounds']]}")

    print("\n5. content flag and routing")
    flag = raise_content_flag(
        ELDER, topic="appetite", verbatim_quote="Lunch I eat half only"
    )
    sent = notify_recipients(ELDER, flag["event_id"], "routine")
    print(f"  routed to {sent['routed_to']}")
    print(f"  withheld from {sent['not_routed_to']} ({sent['scope_required']} not held)")

    print("\n5b. what is still awaiting routing is visible on the record")
    unrouted = raise_content_flag(
        ELDER, topic="sleep", verbatim_quote="Sleep not so good"
    )
    if unrouted["already_flagged_today"] != [flag["event_id"]]:
        failures.append(
            "raising a flag does not name what was already flagged today, so a "
            "differently worded near-duplicate of one complaint goes unnoticed"
        )
    print(f"  already flagged today: {unrouted['already_flagged_today']}")
    on_record = {
        f["event_id"]: f for f in get_check_in_context(ELDER)["flags_on_record"]
    }
    if on_record.get(flag["event_id"], {}).get("notified") != sent["routed_to"]:
        failures.append("a routed flag does not show who was told")
    if on_record.get(unrouted["event_id"], {}).get("notified") != []:
        failures.append(
            "an unrouted flag is not visible as unrouted, so an agent asked to "
            "chase it cannot see it exists and raises a duplicate instead"
        )
    for f in on_record.values():
        print(f"  {f['event_id']}: {f['notified'] or 'awaiting routing'}")

    print("\n6. drift flag, blocked by the confound")
    drift = raise_drift_flag(
        ELDER, family="acoustic", marker="pause_fraction",
        observation="pause fraction widened over the last fortnight",
    )
    if drift.get("raised"):
        failures.append("drift flag raised despite an active sedating-med confound")
        print("  NOT BLOCKED")
    else:
        print(f"  blocked: {[c['detail'] for c in drift['blocked_because']]}")

    print("\n7. guard rails")
    expect_violation("triage question", lambda: place_check_in_call(
        ELDER, opening="Morning!",
        watch_for_questions=["How bad is the knee pain today?"], probe="",
    ))
    expect_violation("imputed sample", lambda: log_call_outcome(
        ELDER, "no_answer", markers={"speech_rate_wpm": 118.0},
    ))
    expect_violation("ineligible marker family", lambda: raise_drift_flag(
        ELDER, family="linguistic", marker="type_token_ratio", observation="x",
    ))
    expect_violation("urgency downgrade", lambda: notify_recipients(
        ELDER, flag["event_id"], "routine",
    ) if notify_recipients(ELDER, flag["event_id"], "immediate") else None)
    expect_violation("cadence below the floor", lambda: set_check_in_cadence(
        ELDER, "weekly", set_by="Serene (daughter)",
    ))
    expect_violation("second flag for one complaint", lambda: raise_content_flag(
        ELDER, topic="sleep", verbatim_quote="Sleep still not so good",
    ))
    expect_violation("triage term in the opening line", lambda: place_check_in_call(
        ELDER, opening="Morning! How bad is the knee today?",
        watch_for_questions=[], probe="",
    ))
    expect_violation("completed call with the wrong markers", lambda: log_call_outcome(
        ELDER, "completed", markers={"vibes": "good"},
    ))
    expect_violation("completed call with no markers at all", lambda: log_call_outcome(
        ELDER, "completed",
    ))
    expect_violation("flag with no topic", lambda: raise_content_flag(
        ELDER, topic="", verbatim_quote="Lunch I eat half only",
    ))
    expect_violation("flag with no quote", lambda: raise_content_flag(
        ELDER, topic="mood", verbatim_quote="   ",
    ))

    print("\n8. counts follow one complaint across how it was worded")
    # "Knee pain" today and "knee  pain" tomorrow are one history. Matched on
    # the slug, they used to be two, and the count under-reported in silence.
    knee = raise_content_flag(
        ELDER, topic="Knee pain", verbatim_quote="The knee again on the stairs"
    )
    elder = store.get_elder(store.load(), ELDER)
    counts = store.mention_counts(elder, "knee  pain")
    print(f"  {knee['event_id']} -> variant lookup found {counts['mentions_on_record']}")
    if counts["mentions_on_record"] != 1:
        failures.append(
            "mention_counts missed a differently spaced wording of the same "
            "topic, so one complaint's frequency count splits in two"
        )

    print()
    if failures:
        for f in failures:
            print(f"FAIL: {f}")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

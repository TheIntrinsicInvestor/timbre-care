"""Timbre Care MCP server: the tools a check-in agent needs, and no others.

The tool surface is deliberately narrow. There is no severity parameter, no
suppression call and no way to lower an urgency, because the product does not
grade complaints (PRD 8.3, 8.6). Attempts to do those things fail here rather
than being talked out of in a prompt.
"""

from __future__ import annotations

import functools
import random
from datetime import date, timedelta

from mcp.server import MCPServer

from . import consult, rules, store

mcp = MCPServer("care-companion")


def tool():
    """Register a tool and give it the store to itself while it runs.

    An agent that captions four segments at once issues four overlapping
    calls, and each one loads the whole store, appends and writes it back.
    Without this they collide on the store and one of them loses its write,
    which is how segment s01 went missing from a real run. See store.exclusive
    for the two ways that happens. Serialising per call is enough: no tool
    here holds the store across a wait.
    """
    def register(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            with store.exclusive():
                return fn(*args, **kwargs)

        return mcp.tool()(wrapper)

    return register


MED_CHANGE_PAST = {
    "add": "added",
    "increase": "increased",
    "reduce": "reduced",
    "stop": "stopped",
}


# Lives in store.py, because mention_counts matches topics through the same
# function: an id and a count that disagree about what one complaint is called
# is how a frequency count silently halves.
_slug = store.slug


RECENT_FLAG_DAYS = 7


def _recent_flags(elder: dict) -> list[dict]:
    """Flags already on the record, so the agent can route rather than re-raise.

    Without this the only readable trace of a past call is last_call.note, so an
    agent asked to chase an unrouted flag cannot see that one exists and raises
    a duplicate dated today. Each entry carries who was notified, because "not
    yet routed" and "routed to nobody who holds the scope" are different states
    and only the first is the agent's to act on. Bounded to a week: this is for
    planning today's call, not for auditing the enrolment.
    """
    cutoff = (date.today() - timedelta(days=RECENT_FLAG_DAYS)).isoformat()
    recent = [
        {
            "event_id": event_id,
            "kind": event.get("kind"),
            "about": event.get("topic") or event.get("marker", ""),
            "urgency": event.get("urgency"),
            "raised_on": event.get("raised_on"),
            "notified": event.get("notified") or [],
        }
        for event_id, event in elder["events"].items()
        if (event.get("raised_on") or "") >= cutoff
    ]
    return sorted(recent, key=lambda f: (f["raised_on"] or "", f["event_id"]))


@tool()
def get_check_in_context(elder_id: str) -> dict:
    """Everything needed to plan today's check-in call for one elder.

    Returns the elder's language tier and which marker families are eligible,
    the active watch-fors the call should ask about, the current medication
    list, baseline maturity, who is authorised to receive what, and the flags
    already raised in the last week with who each was routed to.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    samples = store.usable_samples(elder)
    cadence = elder.get("check_in_cadence", rules.DEFAULT_CADENCE)
    return {
        "elder_id": elder_id,
        "display_name": elder["display_name"],
        "spoken_language": elder["spoken_language"],
        "language_tier": elder["language_tier"],
        "marker_eligibility": elder["marker_eligibility"],
        "eligibility_reason": elder["eligibility_reason"],
        "check_in_cadence": cadence,
        "days_between_calls_at_most": rules.CADENCES[cadence],
        "baseline": {
            "usable_samples": samples,
            "required_samples": rules.BASELINE_SAMPLES,
            "mature": samples >= rules.BASELINE_SAMPLES,
        },
        "watch_fors": elder["watch_fors"],
        "med_list": elder["med_list"],
        "recipients": [
            {"name": r["name"], "scopes": r["scopes"]} for r in elder["recipients"]
        ],
        "last_call": elder["calls"][-1] if elder["calls"] else None,
        "flags_on_record": _recent_flags(elder),
    }


@tool()
def set_check_in_cadence(elder_id: str, cadence: str, set_by: str) -> dict:
    """Set how often the check-in call goes out, on the elder's instruction.

    She chooses "daily", "every_other_day" or "three_times_a_week"; anything
    slower is refused. Whoever is named in `set_by` is written to the consent
    ledger with her record; the app is what will show it to her (PRD 13.1). A
    recipient may relay her choice and may not quietly make it for her, so this
    needs a named person. A slower cadence lengthens the longest a concern she
    has not volunteered can wait to be heard, so the return value states that
    figure rather than leaving it to be inferred.
    """
    rules.require_supported_cadence(cadence)
    rules.require_named_person(set_by, "a change to her check-in cadence")

    data = store.load()
    elder = store.get_elder(data, elder_id)
    previous = elder.get("check_in_cadence", rules.DEFAULT_CADENCE)
    elder["check_in_cadence"] = cadence
    elder.setdefault("consent_log", []).append({
        "on": date.today().isoformat(),
        "event": "check_in_cadence_set",
        "from": previous,
        "to": cadence,
        "set_by": set_by,
    })
    store.save(data)

    gap = rules.CADENCES[cadence]
    gap_text = "a day" if gap == 1 else f"{gap} days"
    return {
        "cadence": cadence,
        "previous": previous,
        "set_by": set_by,
        "days_between_calls_at_most": gap,
        "baseline_samples_required": rules.BASELINE_SAMPLES,
        "explanation": (
            f"At most {gap_text} between calls, which is the longest a concern "
            "she has not volunteered can wait to be heard (PRD 8.2). The "
            f"baseline still needs {rules.BASELINE_SAMPLES} usable samples, "
            "which this cadence reaches more slowly (PRD 6.6)."
        ),
    }


@tool()
def place_check_in_call(
    elder_id: str,
    opening: str,
    watch_for_questions: list[str],
    probe: str,
) -> dict:
    """Place today's check-in call and return what was heard.

    `watch_for_questions` must ask only whether something is happening, never
    how severe it is: severity questions are triage and are rejected. Keep the
    whole call to sixty to ninety seconds.

    This scaffold simulates the call and returns a replayed transcript. Real
    telephony replaces the body of this function and nothing else.

    The markers are drawn from the same distribution the seeded history uses,
    at the widened spread of the last fortnight, and seeded on the elder and
    the day. So today's sample is reproducible if the call is retried, and a
    different day is a different sample. They were four constants, which made
    every call in the record identical: an awkward look for a product whose
    signal is the variability between samples.
    """
    rules.require_no_triage_question(opening)
    for question in watch_for_questions:
        rules.require_no_triage_question(question)
    rules.require_no_triage_question(probe)

    transcript = (
        "Morning ah. Sleep not so good, the knee again when I go down the stairs. "
        "Lunch I eat half only, not so hungry these few days. Tablets I took, "
        "the new one make me a bit blur."
    )
    rng = random.Random(f"{elder_id}-{date.today().isoformat()}")
    return {
        "status": "completed",
        "duration_s": 74,
        "transcript": transcript,
        "audio_ref": f"seed://{elder_id}/latest.wav",
        "observed_markers": {
            "speech_rate_wpm": round(rng.gauss(118, 9.6), 1),
            "articulation_rate_sps": round(rng.gauss(4.3, 0.36), 2),
            "pause_fraction": round(rng.gauss(0.28, 0.072), 3),
            "answer_latency_s": round(rng.gauss(1.6, 0.60), 2),
        },
        "note": "knee pain; ate half of lunch; reports feeling blur on new tablet",
    }


@tool()
def log_call_outcome(
    elder_id: str,
    status: str,
    note: str = "",
    markers: dict | None = None,
) -> dict:
    """Record today's call against the elder's longitudinal record.

    `status` is one of "completed", "no_answer" or "unusable". Markers may only
    accompany a completed call: a call without a usable sample is recorded as
    missing and is never filled in, because the primary drift signal is the
    variability between samples and imputation would smooth it away.
    """
    if status not in ("completed", "no_answer", "unusable"):
        raise rules.RuleViolation(
            f"unknown status {status!r}; expected completed, no_answer or unusable"
        )
    rules.reject_imputed_sample(status, markers)
    rules.require_marker_shape(status, markers)

    data = store.load()
    elder = store.get_elder(data, elder_id)
    today = date.today().isoformat()
    elder["calls"] = [c for c in elder["calls"] if c["date"] != today]
    elder["calls"].append({
        "date": today,
        "status": status,
        "markers": markers if status == "completed" else None,
        "note": note,
    })
    store.save(data)
    return {
        "recorded": today,
        "status": status,
        "sample": "usable" if status == "completed" else "missing, not imputed",
        "usable_samples": store.usable_samples(elder),
    }


@tool()
def check_confounds(elder_id: str) -> dict:
    """Check what else could be moving this elder's markers right now.

    Must be called before any drift flag. A newly prescribed sedating
    medication is the largest single confounder and is read straight off the
    reconciled medication list. Changes to an existing sedating medication
    count too: coming off one moves the markers as surely as going on.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    today = date.today()

    found = []
    for med in elder["med_list"]:
        started = date.fromisoformat(med["started"])
        age_days = (today - started).days
        if age_days <= 30 and med["sedating"]:
            found.append({
                "kind": "new_sedating_medication",
                "detail": f"{med['name']} started {age_days} days ago",
                "blocks_drift_flag": True,
            })

    for change in elder.get("med_changes", []):
        age_days = (today - date.fromisoformat(change["on"])).days
        if age_days <= 30 and change["sedating"]:
            found.append({
                "kind": "sedating_medication_changed",
                "detail": (
                    f"{change['name']} {MED_CHANGE_PAST[change['change']]} "
                    f"{age_days} days ago, confirmed by {change['confirmed_by']}"
                ),
                "blocks_drift_flag": True,
            })

    elder["last_confound_check"] = today.isoformat()
    store.save(data)
    return {
        "checked_on": today.isoformat(),
        "confounds": found,
        "clear": not any(c["blocks_drift_flag"] for c in found),
    }


@tool()
def raise_content_flag(elder_id: str, topic: str, verbatim_quote: str) -> dict:
    """Flag something the elder actually said. Needs no baseline.

    Returns plain frequency counts alongside the quote so a recipient can judge
    it in seconds. The counts carry no interpretation and no severity.
    """
    if not topic.strip():
        raise rules.RuleViolation(
            "a content flag needs a topic: name what she talked about, so the "
            "frequency counts have a history to accumulate on (PRD 8.4)."
        )
    if not verbatim_quote.strip():
        raise rules.RuleViolation(
            "a content flag carries her own words as evidence. The quote is "
            "what a recipient judges in seconds instead of a severity score "
            "(PRD 8.4)."
        )

    data = store.load()
    elder = store.get_elder(data, elder_id)
    today = date.today().isoformat()
    event_id = f"content-{_slug(topic)}-{today}"
    rules.require_not_already_flagged_today(event_id, elder["events"])

    # Named separately from the refusal above, which only fires on an identical
    # topic. She said "appetite" and "meal intake / appetite" in one call once,
    # and the two slugged apart into two flags for one complaint.
    already_today = [
        eid
        for eid, e in elder["events"].items()
        if e.get("kind") == "content_flag" and e.get("raised_on") == today
    ]

    elder["events"][event_id] = {
        "kind": "content_flag",
        "topic": topic,
        "quote": verbatim_quote,
        "urgency": "routine",
        "raised_on": today,
    }
    store.save(data)
    return {
        "event_id": event_id,
        "topic": topic,
        "quote": verbatim_quote,
        "counts": store.mention_counts(elder, topic),
        "urgency": "routine",
        "already_flagged_today": already_today,
    }


@tool()
def raise_drift_flag(elder_id: str, family: str, marker: str, observation: str) -> dict:
    """Flag a change in how the elder speaks, against their own baseline.

    Gated three ways, all of which fail loudly rather than degrading: the
    marker family must be eligible for this elder, the baseline must be mature,
    and check_confounds must have run today. State what was observed, never
    what it means.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    today = date.today()

    rules.require_marker_family_eligible(elder["marker_eligibility"], family)
    rules.require_mature_baseline(store.usable_samples(elder))
    rules.require_confound_check(elder.get("last_confound_check"), today)

    blocking = [
        c for c in check_confounds(elder_id)["confounds"] if c["blocks_drift_flag"]
    ]
    if blocking:
        return {
            "raised": False,
            "blocked_because": blocking,
            "logged": True,
            "explanation": (
                "Flag blocked and logged with its reason so it can be audited "
                "later. The confound moves these markers directly (PRD 6.5)."
            ),
        }

    # check_confounds wrote to the store, so reload rather than saving over it.
    event_id = f"drift-{_slug(marker)}-{today.isoformat()}"
    data = store.load()
    elder = store.get_elder(data, elder_id)
    elder["events"][event_id] = {
        "kind": "drift_flag",
        "marker": marker,
        "observation": observation,
        "urgency": "routine",
        "raised_on": today.isoformat(),
    }
    store.save(data)
    return {"raised": True, "event_id": event_id, "observation": observation}


@tool()
def notify_recipients(elder_id: str, event_id: str, urgency: str) -> dict:
    """Route an event to every recipient holding the matching scope.

    All holders are routed to at once. There is no primary recipient and no
    routing order: whoever can act is whoever is nearest, and the product has no
    way to know who that is. Urgency may be raised on an existing event and
    never lowered.

    This decides and records who the event is for. It does not itself deliver:
    there is no send in this build, so never tell anyone the event reached them.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    event = elder["events"].get(event_id)
    if event is None:
        known = list(elder["events"]) or ["(none raised yet)"]
        raise KeyError(
            f"unknown event {event_id!r}. Use an id exactly as returned by "
            f"raise_content_flag or raise_drift_flag. Currently open: {known}"
        )

    event["urgency"] = rules.require_monotone_escalation(event.get("urgency"), urgency)
    scope = "acute_notification" if urgency == "immediate" else (
        "content_flags" if event["kind"] == "content_flag" else "drift_digest"
    )
    routed_to = [r["name"] for r in elder["recipients"] if scope in r["scopes"]]
    withheld = [r["name"] for r in elder["recipients"] if scope not in r["scopes"]]

    event["notified"] = routed_to
    store.save(data)
    return {
        "event_id": event_id,
        "urgency": event["urgency"],
        "scope_required": scope,
        "routed_to": routed_to,
        "not_routed_to": withheld,
        "reason_not_routed": "recipient does not hold this scope (PRD 7.2)",
    }


# ---------------------------------------------------------------------------
# Feature 1: Appointment Companion (PRD 5)
#
# The tools below hand the agent the consultation and the rules. They do not
# write a single caption or summary: the plain-language work is the agent's,
# and what it may say is constrained here rather than asked for in a prompt.
# ---------------------------------------------------------------------------


def _capture(elder: dict, capture_id: str) -> dict:
    captures = elder.setdefault("appointments", {})
    capture = captures.get(capture_id)
    if capture is None:
        known = list(captures) or ["(none; call start_appointment_capture first)"]
        raise KeyError(f"unknown capture {capture_id!r}. Open captures: {known}")
    return capture


def _med_vocabulary(elder: dict, consult_doc: dict) -> set[str]:
    return consult.medicines_in(consult_doc) | {
        m["name"].lower() for m in elder["med_list"]
    }


@tool()
def start_appointment_capture(
    elder_id: str,
    consent_tap_by: str,
    announcement_played: bool,
    consult_id: str = "",
) -> dict:
    """Open a consultation capture, if and only if the elder consented in the room.

    Requires an explicit tap by the elder herself plus an audible announcement
    so the clinician knows capture has begun. A recipient's standing access
    grant governs what they may see and never whether recording happens, so
    passing a recipient's name here is refused.

    Calling this twice in one day resumes the capture already open rather than
    starting a new one. It used to reset the cursor and drop every caption
    already written, silently, and an agent retry is the normal case.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    rules.require_elder_consent(
        consent_tap_by,
        announcement_played,
        [r["name"] for r in elder["recipients"]],
        elder["display_name"],
        elder_id,
    )

    consult_id = consult_id or consult.default_id()
    today = date.today().isoformat()
    capture_id = f"capture-{today}"

    existing = elder.get("appointments", {}).get(capture_id)
    if existing is not None:
        consult_doc = consult.load(existing["consult_id"])
        return {
            "capture_id": capture_id,
            "consult_id": existing["consult_id"],
            "clinic": consult_doc["clinic"],
            "clinician": consult_doc["clinician"],
            "segments_total": len(consult_doc["segments"]),
            "caption_language": elder.get("written_language", "English"),
            "caption_max_chars": rules.CAPTION_MAX_CHARS,
            "already_open": True,
            "captions_so_far": len(existing["captions"]),
            "cursor": existing["cursor"],
            "consent": (
                f"already tapped by {elder['display_name']} today and logged; "
                "this capture was not reopened."
            ),
            "explanation": (
                "Capture already open for today; its captions and cursor are "
                "preserved. Resume with next_consult_segments."
            ),
        }

    consult_doc = consult.load(consult_id)
    elder.setdefault("appointments", {})[capture_id] = {
        "consult_id": consult_id,
        "opened_on": today,
        "cursor": 0,
        "captions": [],
        "outputs": {},
    }
    elder.setdefault("consent_log", []).append({
        "on": today,
        "event": "appointment_capture_opened",
        "tapped_by": consent_tap_by,
        "announcement_played": announcement_played,
        "capture_id": capture_id,
    })
    store.save(data)

    return {
        "capture_id": capture_id,
        "consult_id": consult_id,
        "clinic": consult_doc["clinic"],
        "clinician": consult_doc["clinician"],
        "segments_total": len(consult_doc["segments"]),
        "caption_language": elder.get("written_language", "English"),
        "caption_max_chars": rules.CAPTION_MAX_CHARS,
        "consent": (
            f"tapped by {consent_tap_by}, announcement played. Logged to the "
            "consent ledger and visible to the elder."
        ),
    }


@tool()
def next_consult_segments(elder_id: str, capture_id: str, count: int = 4) -> dict:
    """Play the next few seconds of the consultation.

    Returns what was said, who said it, and which words are jargon the elder
    will not know. Caption the clinician's segments as they arrive; the elder's
    own speech needs no caption.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    capture = _capture(elder, capture_id)
    consult_doc = consult.load(capture["consult_id"])

    start = capture["cursor"]
    batch = consult_doc["segments"][start : start + count]
    capture["cursor"] = start + len(batch)
    store.save(data)

    return {
        "segments": [
            {
                "segment_id": s["id"],
                "at": f"{s['t_start']:.1f}s",
                "speaker": s["speaker"],
                "text": s["text"],
                "jargon": s["jargon"],
                "needs_caption": s["speaker"] == "clinician",
            }
            for s in batch
        ],
        "remaining": len(consult_doc["segments"]) - capture["cursor"],
        "finished": capture["cursor"] >= len(consult_doc["segments"]),
        "caption_language": elder.get("written_language", "English"),
    }


@tool()
def publish_caption(
    elder_id: str, capture_id: str, segment_id: str, caption: str, language: str
) -> dict:
    """Write a plain-language line of the consultation into her record.

    Nothing appears on her screen during the consult. She reads this back
    afterwards, on her own page, and acts on it. So the line must render what
    the clinician said and nothing more: a number or a medicine that does not
    appear in the segment is refused, because nobody in the room is checking
    it against the audio.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    capture = _capture(elder, capture_id)
    consult_doc = consult.load(capture["consult_id"])
    segment = consult.segment(consult_doc, segment_id)

    if segment["speaker"] != "clinician":
        raise rules.RuleViolation(
            f"segment {segment_id!r} is the elder speaking. Captions carry the "
            "clinician's words to her; she does not need her own read back "
            "(PRD 5.1)."
        )

    rules.require_written_language_supported(language)
    rules.require_large_print(caption, rules.CAPTION_MAX_CHARS, "caption")
    rules.require_jargon_explained(segment["jargon"], caption)
    rules.require_no_invented_facts(
        segment["text"],
        {m["name"].lower() for m in segment["meds_mentioned"]},
        _med_vocabulary(elder, consult_doc),
        caption,
    )

    capture["captions"].append({
        "segment_id": segment_id,
        "caption": caption,
        "language": language,
        "at": segment["t_end"],
    })
    store.save(data)

    return {
        "written": caption,
        "language": language,
        "segment_id": segment_id,
        "jargon_replaced": segment["jargon"],
        "captions_so_far": len(capture["captions"]),
    }


@tool()
def reconcile_medications(elder_id: str, capture_id: str) -> dict:
    """Compare what the doctor said against the list, and write nothing.

    The transcript is a reconciler, not a writer. Anything the doctor mentioned
    that is not on the list comes back as a prompt for a human to confirm,
    because this list is also the confound register that gates every drift flag.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    capture = _capture(elder, capture_id)
    consult_doc = consult.load(capture["consult_id"])

    on_list = {m["name"].lower(): m for m in elder["med_list"]}
    mentioned: dict[str, dict] = {}
    for seg in consult_doc["segments"]:
        for med in seg["meds_mentioned"]:
            mentioned[med["name"].lower()] = med

    confirmed, unrecognised = [], []
    for name, med in mentioned.items():
        entry = {
            "name": med["name"],
            "doctor_said": med["action"],
            "dose": med["dose"] or "not stated",
        }
        (confirmed if name in on_list else unrecognised).append(entry)

    return {
        "confirmed_against_list": confirmed,
        "not_on_list": unrecognised,
        "on_list_but_not_mentioned": [
            m["name"] for m in elder["med_list"] if m["name"].lower() not in mentioned
        ],
        "writes_performed": 0,
        "next_step": (
            "Ask a human about each entry in not_on_list and each change in "
            "confirmed_against_list, then call confirm_medication_change with "
            "their name. Nothing has been written (PRD 5.3)."
        ),
    }


@tool()
def confirm_medication_change(
    elder_id: str,
    med_name: str,
    change: str,
    confirmed_by: str,
    dose: str = "",
    sedating: bool = False,
) -> dict:
    """Write a medication change that a named human has confirmed.

    `change` is one of "add", "increase", "reduce" or "stop". The change also
    writes to the confound register, because a medication that moves the
    markers must be able to block a drift flag raised days later.
    """
    if change not in ("add", "increase", "reduce", "stop"):
        raise rules.RuleViolation(
            f"unknown change {change!r}; expected add, increase, reduce or stop"
        )
    rules.require_human_confirmation(confirmed_by)

    data = store.load()
    elder = store.get_elder(data, elder_id)
    today = date.today().isoformat()

    existing = next(
        (m for m in elder["med_list"] if m["name"].lower() == med_name.lower()), None
    )
    already_on_list = change == "add" and existing is not None
    if change == "add":
        if existing is None:
            elder["med_list"].append({
                "name": med_name.lower(),
                "started": today,
                "sedating": sedating,
            })
        else:
            # The list is the confound register, so its own sedating flag wins
            # over whatever the caller asserted: recording a contradiction here
            # is worse than recording nothing.
            sedating = existing["sedating"]
    elif existing is None:
        raise KeyError(
            f"{med_name!r} is not on the list, so it cannot be "
            f"{MED_CHANGE_PAST[change]}. "
            f"On the list: {[m['name'] for m in elder['med_list']]}"
        )
    else:
        sedating = existing["sedating"]
        if change == "stop":
            elder["med_list"] = [
                m for m in elder["med_list"] if m["name"].lower() != med_name.lower()
            ]

    elder.setdefault("med_changes", []).append({
        "on": today,
        "name": med_name.lower(),
        "change": change,
        "dose": dose,
        "sedating": sedating,
        "confirmed_by": confirmed_by,
    })
    store.save(data)

    return {
        "recorded": {"name": med_name.lower(), "change": change, "dose": dose},
        "already_on_list": already_on_list,
        "confirmed_by": confirmed_by,
        "confound_register": (
            "recorded as a confound: this medicine moves the markers the drift "
            "model watches, so no drift flag may be raised on them for 30 days"
            if sedating
            else "recorded; not sedating, so it does not gate the drift model"
        ),
        "med_list": [m["name"] for m in elder["med_list"]],
    }


@tool()
def publish_elder_summary(
    elder_id: str,
    capture_id: str,
    whats_happening: str,
    whats_changed: str,
    what_to_do: str,
    when_to_return: str,
) -> dict:
    """Write the large-print summary for the elder, and for nobody else.

    Understanding flows to the elder; interpretation flows to the family. This
    is her view of her own health: plain language, no jargon carried over, and
    no number the doctor did not say.

    This writes the summary into her record. It is the Timbre Care app that
    shows it to her, so nothing here asserts she has read it or been told.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    capture = _capture(elder, capture_id)
    consult_doc = consult.load(capture["consult_id"])

    said = consult.spoken_text(consult_doc)
    jargon = consult.jargon_in(consult_doc)
    vocabulary = _med_vocabulary(elder, consult_doc)
    allowed = consult.medicines_in(consult_doc)

    sections = {
        "whats_happening": whats_happening,
        "whats_changed": whats_changed,
        "what_to_do": what_to_do,
        "when_to_return": when_to_return,
    }
    for field, text in sections.items():
        rules.require_large_print(text, rules.SUMMARY_FIELD_MAX_CHARS, field)
        rules.require_jargon_explained(jargon, text)
        rules.require_no_invented_facts(said, allowed, vocabulary, text)

    capture["outputs"]["elder_summary"] = sections
    store.save(data)

    return {
        "written_for": elder["display_name"],
        "surface": "her record, read in the Timbre Care app in large print",
        "not_a_delivery_claim": (
            "written to the record; whether she has opened it is not something "
            "this call knows"
        ),
        "language": elder.get("written_language", "English"),
        "sections": sections,
        "not_written_for": [r["name"] for r in elder["recipients"]],
        "reason": (
            "This is the elder's own view. Recipients get the digest instead, "
            "filtered to their scopes (PRD 4.1, 7.2)."
        ),
    }


@tool()
def publish_recipient_digest(
    elder_id: str,
    capture_id: str,
    plain_diagnosis: str,
    medication_changes: str,
    next_appointment: str,
    what_to_watch_for: list[str],
    suggested_questions: list[str],
) -> dict:
    """Route the structured digest to everyone holding appointment_summary.

    All holders are routed to at once. Whoever is nearest is whoever can act,
    and the product has no way to know who that is.

    This writes the digest and records who it is for. Nothing is transmitted:
    the app that would show it is specified and not built (PRD 13.1).
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    capture = _capture(elder, capture_id)
    consult_doc = consult.load(capture["consult_id"])

    said = consult.spoken_text(consult_doc)
    jargon = consult.jargon_in(consult_doc)
    vocabulary = _med_vocabulary(elder, consult_doc)
    allowed = consult.medicines_in(consult_doc)

    digest = {
        "plain_diagnosis": plain_diagnosis,
        "medication_changes": medication_changes,
        "next_appointment": next_appointment,
        "what_to_watch_for": what_to_watch_for,
        "suggested_questions": suggested_questions,
    }
    for text in [plain_diagnosis, medication_changes, next_appointment]:
        rules.require_jargon_explained(jargon, text)
        rules.require_no_invented_facts(said, allowed, vocabulary, text)
    for line in list(what_to_watch_for) + list(suggested_questions):
        rules.require_no_invented_facts(said, allowed, vocabulary, line)

    scope = "appointment_summary"
    routed_to = [r["name"] for r in elder["recipients"] if scope in r["scopes"]]
    withheld = [r["name"] for r in elder["recipients"] if scope not in r["scopes"]]

    capture["outputs"]["recipient_digest"] = digest
    capture["outputs"]["digest_routed_to"] = routed_to
    store.save(data)

    return {
        "digest": digest,
        "scope_required": scope,
        "routed_to": routed_to,
        "not_routed_to": withheld,
        "reason_not_routed": "recipient does not hold this scope (PRD 7.2)",
        "verbatim_transcript": (
            "not attached. That scope is off for everyone by default and is "
            "granted per item on request, with the access logged and visible to "
            "the elder (PRD 7.2)."
        ),
    }


@tool()
def write_watch_fors(elder_id: str, capture_id: str, watch_fors: list[str]) -> dict:
    """Hand the appointment's watch-fors to the check-in call.

    This is the join between the two halves of the product. Each watch-for must
    be answerable by asking whether something is happening, because the
    check-in may never ask how bad it is.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    capture = _capture(elder, capture_id)

    for text in watch_fors:
        rules.require_no_triage_question(text)

    # The appointment's own date, not the date this ran: a write-up finished
    # the morning after the consult used to stamp the record with an
    # appointment on a day none happened.
    replaced = [w["text"] for w in elder["watch_fors"]]
    elder["watch_fors"] = [
        {
            "id": f"wf-{_slug(text)}",
            "text": text,
            "source": f"appointment {capture['opened_on']}",
        }
        for text in watch_fors
    ]
    capture["outputs"]["watch_fors"] = watch_fors
    store.save(data)

    return {
        "written": elder["watch_fors"],
        "replaced": replaced,
        "effect": (
            "Tomorrow's check-in call will ask about exactly these, and the "
            "caregiver console will show them as what this appointment produced."
        ),
    }


@tool()
def get_appointment_record(elder_id: str, capture_id: str = "") -> dict:
    """Read back what an appointment wrote, without writing anything itself.

    Nothing here delivers or re-sends anything; routing records who an item is
    for. Leave `capture_id` empty for the most recent capture.

    Every other appointment tool writes, and none read, so an agent asked
    whether the family digest was routed, or told to resume a half-finished
    write-up, had to re-run a publish step to find out and rewrote the record
    doing it. `next_consult_segments` is not a read: it advances the cursor.
    """
    data = store.load()
    elder = store.get_elder(data, elder_id)
    captures = elder.get("appointments", {})
    if not captures:
        raise KeyError(
            f"{elder_id!r} has no appointment captures on record. Open one with "
            "start_appointment_capture."
        )

    capture_id = capture_id or max(captures)
    capture = _capture(elder, capture_id)
    consult_doc = consult.load(capture["consult_id"])
    outputs = capture.get("outputs", {})

    return {
        "capture_id": capture_id,
        "opened_on": capture["opened_on"],
        "consult_id": capture["consult_id"],
        "cursor": capture["cursor"],
        "segments_total": len(consult_doc["segments"]),
        "captions": [
            {
                "segment_id": c["segment_id"],
                "caption": c["caption"],
                "language": c["language"],
            }
            for c in capture["captions"]
        ],
        "outputs_present": sorted(outputs),
        "elder_summary": outputs.get("elder_summary"),
        "recipient_digest": outputs.get("recipient_digest"),
        "digest_routed_to": outputs.get("digest_routed_to"),
        "watch_fors_written": outputs.get("watch_fors"),
        "all_captures": [
            {"capture_id": cid, "opened_on": c["opened_on"]}
            for cid, c in sorted(captures.items())
        ],
    }


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()

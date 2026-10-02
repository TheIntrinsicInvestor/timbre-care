"""The product invariants, enforced here rather than in a prompt.

Every rule in this module exists because the PRD forbids something, and a model
asked politely not to do it will eventually do it anyway. Putting the refusal in
the tool layer means the agent *cannot* violate these, whatever it plans.
"""

from __future__ import annotations

from datetime import date

from . import consult


class RuleViolation(Exception):
    """Raised when a tool call would break a documented product rule."""


# PRD 6.6: the statistical model produces nothing useful before this. Counted in
# usable samples rather than calendar days, because cadence is hers to set
# (PRD 6.1) and a 30-day window buys a different number of samples at each of
# the three settings.
BASELINE_SAMPLES = 30

# PRD 6.1: she chooses her own cadence from these three. The value is the
# largest gap in days the setting can leave between calls, which is what bounds
# how long a stated concern may go unheard (PRD 8.2).
CADENCES = {
    "daily": 1,
    "every_other_day": 2,
    "three_times_a_week": 3,
}
DEFAULT_CADENCE = "every_other_day"

# PRD 8.3: urgency may only ever be raised. This is the whole ordering.
URGENCY_ORDER = ["routine", "same_day", "immediate"]

# PRD 8.2: asking these establishes severity, which is triage.
TRIAGE_TERMS = [
    "how bad", "how long", "scale of", "worse than", "radiat",
    "onset", "severity", "rate the pain", "out of 10",
]


# PRD 5.1: a caption is read at arm's length, in large type, by someone who is
# also trying to listen to a doctor. Past this it stops being readable in time.
CAPTION_MAX_CHARS = 140

# PRD 5.1: the elder's summary is large print on a phone held close. Longer than
# this per section and it stops being a summary.
SUMMARY_FIELD_MAX_CHARS = 240

# PRD 5.3: the transcript is a reconciler, never a writer. These are not people.
NON_HUMAN_CONFIRMERS = ["agent", "transcript", "system", "model", "ai", "auto"]

# PRD 6.3: the four markers a completed call carries. A call logged with any
# other key set parses fine and then kills the console build with a bare
# KeyError days later, which is a long way from where the mistake was made.
MARKER_KEYS = {
    "speech_rate_wpm",
    "articulation_rate_sps",
    "pause_fraction",
    "answer_latency_s",
}


def rank(urgency: str) -> int:
    if urgency not in URGENCY_ORDER:
        raise RuleViolation(
            f"unknown urgency {urgency!r}; expected one of {URGENCY_ORDER}"
        )
    return URGENCY_ORDER.index(urgency)


def require_monotone_escalation(existing: str | None, proposed: str) -> str:
    """PRD 8.3: any signal may raise an event's urgency, none may lower it."""
    if existing is None:
        return proposed
    if rank(proposed) < rank(existing):
        raise RuleViolation(
            f"cannot lower urgency from {existing!r} to {proposed!r}. "
            "Escalation is monotone: nothing heard is downgraded out of "
            "recipient visibility (PRD 8.3)."
        )
    return proposed


def require_not_already_flagged_today(event_id: str, events: dict) -> None:
    """PRD 8.3: one flag per complaint per call, carrying a frequency count.

    Raising the same topic twice in one day used to overwrite the first flag,
    its verbatim quote included, with no error and no trace. That is data loss
    in a record whose whole worth is that it quotes her exactly. A complaint
    heard again is a higher count on the flag that already exists, never a
    second flag competing with it.
    """
    existing = events.get(event_id)
    if existing is not None:
        topic = existing.get("topic", event_id)
        raise RuleViolation(
            f"{topic!r} is already flagged today as {event_id}. A complaint is "
            "flagged once per call and carries a frequency count; notify that "
            "event rather than raising a second one (PRD 8.3)."
        )


def require_no_triage_question(text: str) -> None:
    """PRD 8.2: onset, duration and radiation are triage fields."""
    lowered = text.lower()
    for term in TRIAGE_TERMS:
        if term in lowered:
            raise RuleViolation(
                f"question contains the triage term {term!r}. The check-in never "
                "establishes severity; it forwards what was volunteered (PRD 8.2)."
            )


def require_marker_family_eligible(eligibility: dict, family: str) -> None:
    """PRD 6.3: eligibility is measured per elder, not declared per language."""
    if not eligibility.get(family):
        raise RuleViolation(
            f"the {family!r} marker family is not eligible for this elder. "
            "A failed confidence gate disables the family rather than feeding a "
            "noisy transcript into a variance model (PRD 6.3)."
        )


def require_mature_baseline(usable_samples: int) -> None:
    """PRD 6.6: no statistical output before the baseline matures."""
    if usable_samples < BASELINE_SAMPLES:
        raise RuleViolation(
            f"baseline is immature: {usable_samples} usable samples of "
            f"{BASELINE_SAMPLES} required. Content flags need no baseline and "
            "are still available (PRD 6.6)."
        )


def require_supported_cadence(cadence: str) -> str:
    """PRD 6.1: she chooses her check-in cadence, from a range with a floor.

    The floor is three times a week. Below it, 30 usable samples stop landing
    inside a quarter, so the dispersion estimate the drift model rests on never
    matures; and the gap a stated concern can sit in grows past what PRD 8.2 is
    willing to carry.
    """
    if cadence not in CADENCES:
        raise RuleViolation(
            f"unsupported check-in cadence {cadence!r}. She may choose "
            f"{sorted(CADENCES)}. Anything slower is refused: the baseline needs "
            f"{BASELINE_SAMPLES} usable samples, and PRD 8.2 bounds how long a "
            "stated concern may go unheard (PRD 6.1)."
        )
    return cadence


def require_confound_check(last_check: str | None, today: date) -> None:
    """PRD 6.5: no flag may be raised without checking the medication list."""
    if last_check != today.isoformat():
        raise RuleViolation(
            "check_confounds has not run today. No drift flag may be raised "
            "without first checking the confound register, because a recent "
            "medication change moves exactly these markers (PRD 6.5)."
        )


def require_elder_consent(
    consent_tap_by: str,
    announcement_played: bool,
    recipient_names: list[str],
    elder_display_name: str,
    elder_id: str,
) -> None:
    """PRD 5.2: the elder taps, and the room is told. Both, every appointment.

    Presence confers no authority. The person accompanying an elder is often an
    employed carer, and a standing access grant governs who may *see* the
    output, never whether capture happens.

    The tap has to be hers by name, not merely not-a-recipient's. This refused
    the daughter and accepted "agent", "system" and any invented clinician,
    which is the half of the gate a judge is most likely to try.
    """
    who = consent_tap_by.strip().lower()
    if not who:
        raise RuleViolation(
            "no consent tap recorded. Capture requires an explicit in-room tap "
            "by the elder; it cannot be pre-authorised (PRD 5.2)."
        )
    for name in recipient_names:
        # Match on the leading name, since recipients are stored as
        # "Serene (daughter)" and a caller will usually pass just "Serene".
        first = name.split("(")[0].strip().lower()
        if who == first or who == name.strip().lower():
            raise RuleViolation(
                f"{name} holds standing access, which governs what they may see, "
                "not whether recording happens. The consent tap is the elder's "
                "and cannot be given on her behalf (PRD 5.2)."
            )
    if who in NON_HUMAN_CONFIRMERS:
        raise RuleViolation(
            "the consent tap is a physical act by the elder; an agent or system "
            f"cannot perform it ({consent_tap_by!r} is not a person, PRD 5.2)."
        )
    if who != elder_id.lower() and elder_display_name.strip().lower() not in who:
        raise RuleViolation(
            f"the consent tap is {elder_display_name}'s own; {consent_tap_by!r} "
            "cannot tap for her. Whoever is in the room, she taps (PRD 5.2)."
        )
    if not announcement_played:
        raise RuleViolation(
            "capture announcement was not played. The clinician must be able to "
            "hear that recording has begun, and to object (PRD 5.2)."
        )


def require_written_language_supported(language: str) -> None:
    """PRD 5.4: captions are text, and text needs a settled orthography."""
    if language not in consult.WRITTEN_LANGUAGES:
        raise RuleViolation(
            f"cannot caption in {language!r}. Tai-lo, POJ, Han characters and "
            "Peng'im all compete for the spoken dialects, so there is no agreed "
            "target to render into. Caption in a written language the elder "
            f"reads instead: {consult.WRITTEN_LANGUAGES} (PRD 5.4)."
        )


def require_jargon_explained(jargon_terms: list[str], text: str) -> None:
    """PRD 5.1: a caption that repeats the jargon has done nothing."""
    lowered = text.lower()
    for term in jargon_terms:
        if term.lower() in lowered:
            raise RuleViolation(
                f"caption still contains {term!r}. The point of the caption is "
                "that the elder understands the sentence without knowing the "
                "word. Say what it means, in plain language (PRD 5.1)."
            )


def require_no_invented_facts(
    source_text: str, allowed_medicines: set[str], vocabulary: set[str], text: str
) -> None:
    """PRD 5.1 / 5.3: a caption renders what was said. It never adds.

    An invented dose is the failure that matters here: she reads her record
    afterwards and acts on it, and nobody in the room is checking it against
    the audio.
    """
    said = consult.quantities_in(source_text)
    said_pairs = {(value, unit) for value, unit in said if unit}
    said_bare = {value for value, _ in said}

    # A quantity carrying a unit must match on both, so "6 months" fails
    # against "6 weeks". One without a recognised unit is checked on the number
    # alone, so a caption in a language whose units we do not know still passes
    # a figure the doctor genuinely said.
    invented = []
    for value, unit in consult.quantities_in(text):
        if unit:
            if (value, unit) not in said_pairs:
                invented.append(f"{value} {unit}")
        elif value not in said_bare:
            invented.append(value)

    if invented:
        raise RuleViolation(
            f"{sorted(set(invented))} does not appear in what the doctor said. "
            "A dose or an interval she reads back afterwards and acts on must "
            "be one that was actually spoken (PRD 5.1)."
        )

    lowered = text.lower()
    for med in sorted(vocabulary - allowed_medicines):
        if med in lowered:
            raise RuleViolation(
                f"{med!r} was not mentioned here. A medicine named in a caption "
                "or summary must have been named in the source, because the "
                "transcript reconciles the medication list and never writes to "
                "it (PRD 5.3)."
            )


def require_large_print(text: str, limit: int, field: str) -> None:
    """PRD 5.1: large type is the whole delivery mechanism, so length is a rule."""
    if len(text) > limit:
        raise RuleViolation(
            f"{field} is {len(text)} characters, over the {limit} that fit at "
            "the type size an 80-year-old reads across a desk. Captions degrade "
            "gracefully only if they are short enough to be read in time "
            "(PRD 5.1)."
        )


def require_human_confirmation(confirmed_by: str) -> None:
    """PRD 5.3: a prescription change heard in the room is a prompt, not a write."""
    who = confirmed_by.strip()
    if not who or who.lower() in NON_HUMAN_CONFIRMERS:
        raise RuleViolation(
            f"medication changes need a named human confirmer, not {confirmed_by!r}. "
            "The transcript reconciles the list against what the doctor said; it "
            "never silently edits it, because this list is also the confound "
            "register that gates every drift flag (PRD 5.3, 6.5)."
        )


def require_marker_shape(status: str, markers: dict | None) -> None:
    """PRD 6.3: a completed call carries the four markers, or it is not usable.

    The console reads these four keys directly off every completed call, so a
    junk key set written here surfaces as a KeyError in the page generator long
    after the call that caused it. Fail at the tool, naming what was expected.
    """
    if status != "completed":
        return
    if not isinstance(markers, dict):
        raise RuleViolation(
            "a completed call must carry markers. Expected the four keys "
            f"{sorted(MARKER_KEYS)}; a call with no usable sample is logged as "
            "no_answer or unusable instead (PRD 6.3)."
        )
    if set(markers) != MARKER_KEYS:
        raise RuleViolation(
            f"markers {sorted(markers)} are not the four this elder's record is "
            f"measured on. Expected exactly {sorted(MARKER_KEYS)}, as returned "
            "by place_check_in_call (PRD 6.3)."
        )
    for key, value in markers.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise RuleViolation(
                f"marker {key!r} is {value!r}, which is not a number. Every "
                "marker is a measurement the drift model takes a variance over "
                "(PRD 6.3)."
            )


def require_named_person(name: str, what: str) -> None:
    """PRD 5.2 / 5.3: some acts are a person's, and an agent cannot stand in.

    Separate from require_human_confirmation, whose message is specifically
    about the medication list, because the agent quotes these strings verbatim
    and a refusal that explains the wrong thing reads as a system fault.
    """
    who = name.strip()
    if not who or who.lower() in NON_HUMAN_CONFIRMERS:
        raise RuleViolation(f"{what} needs a named person, not {name!r}.")


def reject_imputed_sample(status: str, markers: dict | None) -> None:
    """PRD 6.7: a call with no usable sample is missing, and never imputed."""
    if status != "completed" and markers:
        raise RuleViolation(
            f"markers supplied for a call with status {status!r}. A call without a "
            "usable sample is recorded as missing. Imputation would smooth exactly "
            "the variance that constitutes the primary signal (PRD 6.7)."
        )

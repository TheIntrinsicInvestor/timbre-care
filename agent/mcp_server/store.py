"""JSON-backed Signal Store, seeded with one elder and a mature baseline.

Scaffold only. The shape matches PRD 9.2's Signal Store, Consent Ledger and
Confound Register; the persistence is a single file so the demo has no
infrastructure to stand up.
"""

from __future__ import annotations

import json
import os
import random
import threading
import time
from contextlib import contextmanager
from datetime import date, timedelta
from pathlib import Path

from . import rules

# Overridable so a test run can put the store on local disk. OneDrive
# intermittently locks the real store while a test rewrites it many times a
# second, and save()'s os.replace then fails with WinError 5 partway through a
# run. See run_smoke.py, which sets this per test.
_STORE_OVERRIDE = os.environ.get("CARE_COMPANION_STORE")
DATA_PATH = (
    Path(_STORE_OVERRIDE) if _STORE_OVERRIDE
    else Path(__file__).resolve().parent.parent / "data" / "signal_store.json"
)
LOCK_PATH = DATA_PATH.with_suffix(".lock")

_thread_lock = threading.RLock()
_held = threading.local()

# PRD 7.2: five scopes, granted per person. There is no family tier.
SCOPES = [
    "appointment_summary",
    "content_flags",
    "acute_notification",
    "drift_digest",
    "verbatim_transcript",
]


def slug(text: str) -> str:
    """Event ids must survive being read back by an agent, so keep them plain.

    Spaces and brackets in a topic used to leak into the id, and a caller
    quoting it back with one character different got a bare KeyError. It lives
    here rather than in server.py because mention_counts matches topics through
    it too: "Appetite" and "appetite " are one complaint's history, not two.
    """
    out = "".join(c.lower() if c.isalnum() else "-" for c in text)
    while "--" in out:
        out = out.replace("--", "-")
    out = out.strip("-")
    if len(out) > 24:
        # Cut on a word boundary: a half-word id is quoted back wrong by eye.
        out = out[:24].rsplit("-", 1)[0]
    return out or "item"


def _seed_calls(enrolled: date, today: date) -> list[dict]:
    """41 days of behavioural and acoustic markers, with three days missing.

    Missing days are left missing on purpose: they are what a non-imputing
    store looks like, and the demo should show them.
    """
    rng = random.Random(20260805)
    calls = []
    day = enrolled
    while day < today:
        offset = (day - enrolled).days
        if offset in (12, 27, 33):
            calls.append({
                "date": day.isoformat(),
                "status": "no_answer",
                "markers": None,
                "note": "unanswered after two retries",
            })
        else:
            # A gentle widening of dispersion in the last fortnight, which is
            # the pattern PRD 6.4 calls the primary signal.
            spread = 1.0 if offset < 27 else 2.4
            calls.append({
                "date": day.isoformat(),
                "status": "completed",
                "markers": {
                    "speech_rate_wpm": round(rng.gauss(118, 4.0 * spread), 1),
                    "articulation_rate_sps": round(rng.gauss(4.3, 0.15 * spread), 2),
                    "pause_fraction": round(rng.gauss(0.28, 0.03 * spread), 3),
                    "answer_latency_s": round(rng.gauss(1.6, 0.25 * spread), 2),
                },
                "note": "",
            })
        day += timedelta(days=1)
    return calls


def seed() -> dict:
    today = date.today()
    enrolled = today - timedelta(days=41)
    return {
        "elders": {
            "lim-mei-hua": {
                "display_name": "Lim Mei Hua",
                "spoken_language": "Hokkien",
                # PRD 5.4: she speaks a dialect with no settled orthography and
                # reads standard characters, which is why the caption surface
                # serves her when a recogniser cannot.
                "written_language": "Chinese (standard written)",
                "language_tier": 2,
                # PRD 5.4 / 6.3: Tier 2 has recognition, but not at the quality
                # lexical markers need, so the linguistic family is off.
                "marker_eligibility": {
                    "linguistic": False,
                    "acoustic": True,
                    "behavioural": True,
                },
                "eligibility_reason": (
                    "Measured recognition confidence over the baseline period fell "
                    "below the lexical gate. Acoustic and behavioural families are "
                    "unaffected because they need diarisation, not word recognition."
                ),
                "enrolled_on": enrolled.isoformat(),
                "watch_fors": [
                    {
                        "id": "wf-knee",
                        "text": "knee pain when climbing stairs",
                        "source": "appointment 2026-07-24",
                    },
                    {
                        "id": "wf-meals",
                        "text": "whether she is finishing her meals",
                        "source": "appointment 2026-07-24",
                    },
                ],
                "med_list": [
                    {"name": "metformin", "started": "2024-03-11", "sedating": False},
                    {"name": "atorvastatin", "started": "2025-01-08", "sedating": False},
                    {
                        "name": "amitriptyline",
                        "started": (today - timedelta(days=4)).isoformat(),
                        "sedating": True,
                    },
                ],
                # PRD 7.2: scopes per person. The helper is not a lesser class of
                # recipient; she simply has different scopes, set by the elder.
                "recipients": [
                    {
                        "name": "Serene (daughter)",
                        "relationship": "family",
                        "scopes": [
                            "appointment_summary", "content_flags",
                            "acute_notification", "drift_digest",
                        ],
                    },
                    {
                        "name": "Marisa (live-in helper)",
                        "relationship": "employed",
                        "scopes": [
                            "appointment_summary", "content_flags",
                            "acute_notification",
                        ],
                    },
                    {
                        "name": "Wei Jie (son, Perth)",
                        "relationship": "family",
                        "scopes": ["appointment_summary", "drift_digest"],
                    },
                ],
                # PRD 6.1: hers to choose, from rules.CADENCES. Deliberately
                # "daily" rather than rules.DEFAULT_CADENCE: _seed_calls writes
                # one call per consecutive day, so any other value would make
                # her record contradict itself. She is an elder who chose the
                # daily setting; every_other_day is the default for a new
                # enrolment, not a claim about her.
                "check_in_cadence": "daily",
                "calls": _seed_calls(enrolled, today),
                "events": {},
                "last_confound_check": None,
            }
        }
    }


@contextmanager
def exclusive(timeout: float = 10.0):
    """Hold the store for one whole read-modify-write.

    Two failures, one lock. Within a process, save() names its temp file after
    the pid alone, so overlapping calls write the same temp path and whichever
    reaches os.replace second dies with a sharing violation; the agent sees a
    tool error and that segment ends up with no caption. Across processes,
    where the pids differ, the quieter one applies instead: both calls loaded
    the same document, so the second save drops the first one's change without
    complaining. os.replace keeps the file parseable through either, which is
    why neither shows up as corruption.

    The lock therefore has to span load *and* save, not sit inside either.
    Threads share _thread_lock; separate server processes contend on a lock
    file, because a client can have more than one of them open at once.
    """
    if getattr(_held, "depth", 0):
        # Already inside an exclusive block on this thread; O_EXCL would
        # deadlock against our own lock file.
        _held.depth += 1
        try:
            yield
        finally:
            _held.depth -= 1
        return

    with _thread_lock:
        LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
        deadline = time.monotonic() + timeout
        while True:
            try:
                fd = os.open(LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                break
            except FileExistsError:
                if time.monotonic() > deadline:
                    # Left behind by a process that died mid-write. Waiting
                    # forever on a dead holder is worse than taking it.
                    LOCK_PATH.unlink(missing_ok=True)
                    continue
                time.sleep(0.02)
        _held.depth = 1
        try:
            yield
        finally:
            _held.depth = 0
            os.close(fd)
            LOCK_PATH.unlink(missing_ok=True)


def load() -> dict:
    if not DATA_PATH.exists():
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        save(seed())
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def save(data: dict) -> None:
    """Write via a temp file and swap it in, because the write must be atomic.

    A client can have more than one server process open on this file at once.
    A plain write truncates and refills in place, so two interleaved writes
    leave the tail of the longer document behind and every later read fails to
    parse. os.replace is atomic within a volume, so a reader sees either the
    old file or the new one, never a splice of both.
    """
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = DATA_PATH.with_suffix(f".{os.getpid()}.tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(tmp, DATA_PATH)


def get_elder(data: dict, elder_id: str) -> dict:
    elder = data["elders"].get(elder_id)
    if elder is None:
        known = ", ".join(data["elders"]) or "none"
        raise KeyError(f"unknown elder {elder_id!r}. Enrolled: {known}")
    return elder


def usable_samples(elder: dict) -> int:
    """Completed calls, which is what the baseline is counted in (PRD 6.6).

    Never calendar days: cadence is hers to set, so the same span of dates
    carries a different number of samples for different elders.
    """
    return sum(1 for c in elder["calls"] if c["status"] == "completed")


def mention_counts(elder: dict, topic: str) -> dict:
    """Plain counts, with no interpretation attached (PRD 8.4).

    Counted off the flags, which carry the topic and the day as structured
    fields. These used to grep the call note for the topic word, so "appetite"
    scored zero against a note reading "ate half of lunch" and the agent duly
    reported it as the first mention on record when it was the second. The
    counts are what the product offers a recipient instead of grading the
    complaint (PRD 8.3), so a silent zero is the one thing they cannot do.

    Matched through slug(), not on the raw string: "Appetite", "appetite" and
    "poor  appetite" differ only in how the day's agent happened to word it,
    and a count split across those wordings under-reports frequency silently.
    """
    wanted = slug(topic)
    days = sorted({
        e["raised_on"]
        for e in elder.get("events", {}).values()
        if e.get("kind") == "content_flag"
        and e.get("raised_on")
        and slug(e.get("topic") or "") == wanted
    })
    calls = elder.get("calls", [])
    window_opens = calls[-14:][0]["date"] if calls else None

    return {
        "flagged_on": days,
        "mentions_on_record": len(days),
        "mentions_in_last_14_calls": sum(
            1 for d in days if window_opens and d >= window_opens
        ),
        "total_calls_on_record": len(calls),
        "first_flagged": days[0] if days else None,
        "days_since_first": (
            (date.today() - date.fromisoformat(days[0])).days if days else None
        ),
    }

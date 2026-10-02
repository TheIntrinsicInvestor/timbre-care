"""The replayed consultation, and the facts a caption is allowed to contain.

Live ASR is out of scope (PRD 5.1 describes the room; the demo replays a fixed
transcript instead). Everything downstream of recognition is real: the agent
still writes every caption and every summary, and this module supplies the only
things it is permitted to say back.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# PRD 5.4: output is generation, but a caption is *text*, and a language with no
# settled orthography has no target to render into. Hokkien has Tai-lo, POJ and
# Han characters competing; Teochew has Peng'im and no commercial support at all.
WRITTEN_LANGUAGES = [
    "English",
    "Chinese (standard written)",
    "Malay",
    "Tamil",
]

# The unit may be Latin or CJK: the doctor speaks English and the caption is
# written in the elder's own written language, so "850 milligrams" and
# "850 毫克" have to compare equal.
NUMBER = re.compile(r"(\d+(?:\.\d+)?)\s*([a-zA-Z]+|[一-鿿]{1,2})?")

# "6 weeks" and "6 months" share a digit, so the digit alone is not enough: the
# unit is where a wrong follow-up interval hides. Spellings are normalised so a
# caption may say "850 mg" for a doctor's "850 milligrams".
UNITS = {
    "mg": "mg", "milligram": "mg", "milligrams": "mg", "毫克": "mg",
    "kg": "kg", "kilo": "kg", "kilos": "kg",
    "kilogram": "kg", "kilograms": "kg", "公斤": "kg", "千克": "kg",
    "day": "day", "days": "day", "天": "day", "日": "day",
    "week": "week", "weeks": "week", "周": "week", "星期": "week",
    "month": "month", "months": "month", "个月": "month", "月": "month",
    "year": "year", "years": "year", "年": "year",
    "hour": "hour", "hours": "hour", "小时": "hour",
    "time": "time", "times": "time", "次": "time",
}


def default_id() -> str:
    """The consult on file, when there is exactly one. Saves a demo a round trip."""
    found = sorted(p.stem for p in DATA_DIR.glob("consult-*.json"))
    if len(found) != 1:
        raise KeyError(
            f"consult_id is required: {len(found)} consults on file {found}"
        )
    return found[0]


def load(consult_id: str) -> dict:
    path = DATA_DIR / f"{consult_id}.json"
    if not path.exists():
        known = sorted(p.stem for p in DATA_DIR.glob("consult-*.json"))
        raise KeyError(f"unknown consult {consult_id!r}. On file: {known or 'none'}")
    return json.loads(path.read_text(encoding="utf-8"))


def segment(consult: dict, segment_id: str) -> dict:
    for seg in consult["segments"]:
        if seg["id"] == segment_id:
            return seg
    known = [s["id"] for s in consult["segments"]]
    raise KeyError(f"unknown segment {segment_id!r}. This consult has: {known}")


def quantities_in(text: str) -> list[tuple[str, str | None]]:
    """Every number, paired with its unit where the unit is one we recognise.

    A dose or an interval the doctor never said is the thing to catch, and the
    unit is half of it: "6 months" and "6 weeks" share a digit.
    """
    out = []
    for value, word in NUMBER.findall(text):
        value = value.lstrip("0") or "0"
        word = (word or "").lower()
        unit = UNITS.get(word)
        if unit is None and len(word) > 1:
            # "周后" is "weeks later": the unit is the first character and the
            # rest is the next word running on, which CJK does not space out.
            unit = UNITS.get(word[0])
        out.append((value, unit))
    return out


def medicines_in(consult: dict) -> set[str]:
    return {
        m["name"].lower()
        for seg in consult["segments"]
        for m in seg["meds_mentioned"]
    }


def jargon_in(consult: dict) -> list[str]:
    seen: list[str] = []
    for seg in consult["segments"]:
        for term in seg["jargon"]:
            if term not in seen:
                seen.append(term)
    return seen


def spoken_text(consult: dict, upto_segment: str | None = None) -> str:
    """Everything said so far, as one blob, for checking a summary against."""
    out = []
    for seg in consult["segments"]:
        out.append(seg["text"])
        if upto_segment and seg["id"] == upto_segment:
            break
    return " ".join(out)

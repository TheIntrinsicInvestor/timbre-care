"""Prove that overlapping tool calls cannot lose each other's writes.

An agent that captions several segments in one turn issues the calls in
parallel. Every write path loads the whole store, mutates it and writes it
back, so without a lock spanning the whole call the last writer wins and the
other captions are gone. That is not hypothetical: segment s01 went missing
from the 2026-08-05 appointment run exactly this way.

Reseeds the store, so run it before smoke_test.py or accept that it clears
whatever is there.

Run:  python smoke_test_concurrency.py
"""

from __future__ import annotations

import sys
from concurrent.futures import ThreadPoolExecutor

from mcp_server import store
from mcp_server.server import (
    next_consult_segments,
    publish_caption,
    start_appointment_capture,
)

ELDER = "lim-mei-hua"


def main() -> int:
    store.save(store.seed())

    cap = start_appointment_capture(
        ELDER, consent_tap_by="Lim Mei Hua", announcement_played=True
    )
    capture_id = cap["capture_id"]

    # Pull the whole consult so every clinician segment is available at once.
    clinician = []
    while True:
        batch = next_consult_segments(ELDER, capture_id, count=8)
        clinician += [s for s in batch["segments"] if s["needs_caption"]]
        if not batch["segments"]:
            break

    print(f"{len(clinician)} clinician segments, captioning all at once")

    def caption(seg: dict) -> None:
        publish_caption(
            ELDER,
            capture_id,
            seg["segment_id"],
            # No digits: a figure not spoken in the segment is refused, which
            # is a different rule and not the one under test here.
            "The doctor is explaining something to you now.",
            language="English",
        )

    with ThreadPoolExecutor(max_workers=len(clinician)) as pool:
        list(pool.map(caption, clinician))

    written = {
        c["segment_id"]
        for c in store.load()["elders"][ELDER]["appointments"][capture_id]["captions"]
    }
    expected = {s["segment_id"] for s in clinician}
    lost = sorted(expected - written)

    if lost:
        print(f"FAIL: {len(lost)} caption(s) lost to a concurrent write: {lost}")
        return 1

    print(f"OK: all {len(written)} captions survived concurrent publication")
    return 0


if __name__ == "__main__":
    sys.exit(main())

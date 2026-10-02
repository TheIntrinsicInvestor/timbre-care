"""Run the smoke tests against a throwaway store on local disk.

Two reasons this exists rather than running each test directly.

The store lives under OneDrive, which intermittently opens signal_store.json to
sync it while a test is rewriting it many times a second. save()'s os.replace
then fails with PermissionError WinError 5 partway through, and the run dies
somewhere different each time. It is an environment fault, not a product one,
so the fix is to move the store rather than to retry the write.

And the tests reseed. Running them against the real store destroys the agent
output the console is rendered from, which is the evidence for the submission.
A fresh temp store per test means neither can happen.

Run:  python run_smoke.py                    # all of them, in order
      python run_smoke.py smoke_test         # one by name
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Order matters between the first two: concurrency reseeds, so it must not run
# after a test whose state the next one reads.
TESTS = [
    "smoke_test_concurrency",
    "smoke_test",
    "smoke_test_appointment",
]


def run(name: str) -> int:
    tmp = Path(tempfile.mkdtemp(prefix=f"cc-{name}-"))
    env = dict(os.environ)
    env["CARE_COMPANION_STORE"] = str(tmp / "signal_store.json")

    print(f"=== {name}  (store: {tmp}) ===", flush=True)
    result = subprocess.run(
        [sys.executable, f"{name}.py"], cwd=ROOT, env=env
    )
    print(f"--- {name}: exit {result.returncode}\n", flush=True)
    return result.returncode


def main() -> int:
    requested = sys.argv[1:] or TESTS
    unknown = [t for t in requested if t not in TESTS]
    if unknown:
        print(f"unknown test(s) {unknown}. Known: {TESTS}")
        return 2

    failed = [t for t in requested if run(t) != 0]
    if failed:
        print(f"FAILED: {', '.join(failed)}")
        return 1
    print(f"all {len(requested)} smoke tests passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

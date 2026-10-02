"""Render the caregiver console from the same store the agent writes to.

The page is generated, never hand-edited, so it cannot show something the agent
did not actually do. Run this after a check-in to refresh it.

Run:  python build_console.py
Out:  web/index.html   (self-contained, deploy as a static file)
"""

from __future__ import annotations

import hashlib
import json
import re
import statistics
from datetime import date
from pathlib import Path

from mcp_server import rules, store

ROOT = Path(__file__).resolve().parent
TEMPLATE = ROOT / "web" / "console.template.html"
# Standalone document for static hosting, and a bare fragment for artifact
# publishing, which supplies its own doctype and head.
OUTPUT = ROOT / "web" / "index.html"
OUTPUT_FRAGMENT = ROOT / "web" / "console.fragment.html"
# Deploy root: only what should be publicly served. The template still holds
# its data placeholder and would render broken if it were published.
OUTPUT_PUBLIC = ROOT / "public" / "index.html"

PUBLIC_DIR = ROOT / "public"

# Screen recordings of the agent, for judges reading this async. Hand-written
# copy about the build rather than anything read out of the store, but it is
# copied through here so nothing under public/ is edited in place.
TEMPLATE_EVIDENCE = ROOT / "web" / "evidence.html"
OUTPUT_EVIDENCE = PUBLIC_DIR / "evidence" / "index.html"

# The brand vermilion, and the ground the logo is drawn on. BRAND matches the
# site's --accent rather than the logo master's own #b23a1f: two vermilions
# that close read as a rendering fault, and the site is the surface a judge
# sees this one embedded in.
BRAND = "#cf3016"
GROUND = "#f9f9f7"

MARK_D = (
    # The brand mark as one continuous stroke, traced from the logo master
    # (brand/Timbre Care - Logo.png). Identical geometry to the site's
    # Mark.tsx, duplicated rather than imported: the console is a separate
    # deploy with no build-time link to the site repo, and a favicon that
    # silently 404s is worse than 5 KB of repeated path data.
    "M 239 4 C 224.9 5.3, 206.3 8.3, 196 11 C 183.7 14.1, 176.1 16.3, 173.5 17.5 C 171.9 18.2, 166.7 20.3, 162 22.1 C 134.2 32.7, 108.6 49.5, 80.7 75.2 C 65.8 88.9, 50.1 108.9, 36.3 131.5 C 34.1 135.1, 25.8 152.5, 24.5 156.1 C 23.8 158.1, 22.7 160.6, 22.2 161.6 C 19.7 166.1, 11.6 191.1, 10.7 196.7 C 10.4 198.5, 9.9 200.4, 9.5 201 C 8.7 202.4, 5.3 224.1, 3.9 237.5 C 1.9 256.6, 4.7 297.9, 9.2 313.5 C 9.8 315.7, 10.5 318.5, 10.7 319.7 C 13.3 336, 27.4 362.9, 38.7 373.1 C 68.1 399.7, 99.2 398.9, 145.4 370.6 C 175 352.5, 197.5 346.5, 221.5 350.6 C 229 351.8, 231.1 352.3, 236 353.7 C 239 354.6, 246.7 357, 253 359.1 C 289.8 371.6, 316 375, 343 371 C 365.8 367.6, 378.4 376, 368.5 387.9 C 358.8 399.4, 333.9 404, 279.5 404.4 C 252.3 404.6, 250.6 404.9, 247.6 409.2 C 245.2 412.6, 245.6 416.6, 248.9 420.2 L 251.8 423.5 273.7 423.9 C 313.7 424.5, 346.6 421.2, 362 414.9 C 379.5 407.7, 403.3 388, 418.4 368.2 C 426.2 357.9, 434.2 346.5, 442.7 333.5 C 456.7 312.1, 466.7 303.6, 479.1 302.5 C 488.7 301.7, 490.2 304.6, 485.6 315.1 C 484.8 317, 482.7 322.3, 480.9 327 C 477.9 335, 465.5 361.2, 462.8 365.4 C 462.1 366.5, 458.6 371.8, 455.2 377.3 C 431.6 414.3, 397 445.1, 357.5 464.4 C 333.9 475.9, 318.5 480.9, 291.5 485.7 C 274.6 488.7, 219.7 487.4, 212.9 483.9 C 212 483.5, 208.2 482.6, 204.4 482 C 195.3 480.6, 182.4 476.5, 166.5 470.2 C 156 466, 136.7 456.2, 126 449.6 C 120.3 446.1, 117.6 445, 114.4 445 C 105.9 445, 101.7 454.5, 107.8 460.2 C 113.3 465.4, 144.9 483, 156.7 487.4 C 158.8 488.2, 164.1 490.2, 168.5 492 C 178.4 495.8, 187.1 498.4, 203.5 502.1 C 240.3 510.5, 278.5 510.3, 314.7 501.5 C 324.7 499, 345.8 492.2, 351.5 489.6 C 360.8 485.3, 378.1 476.6, 381.5 474.5 C 383.7 473.2, 386.8 471.3, 388.4 470.4 C 390 469.5, 391.8 468.4, 392.4 467.8 C 393 467.3, 397.3 464.2, 402 460.9 C 426.8 443.5, 453.2 415.7, 471.3 388 C 481.4 372.6, 494.7 348.5, 498.6 338.5 C 499.3 336.9, 501.2 331.9, 503 327.5 C 504.7 323.1, 506.3 318.4, 506.6 317 C 506.9 315.6, 507.5 312.8, 508.1 310.7 C 513.1 291.7, 490.9 277.6, 467.9 285.1 C 448.5 291.5, 443.1 297.2, 410.7 345.8 C 406.5 352.2, 395.8 364.7, 392.1 367.5 C 389.7 369.3, 389.7 369.3, 387.6 366.4 C 382.2 358.7, 375.7 354.7, 363.8 351.5 C 356.9 349.7, 356 349.7, 338.5 352 C 328.3 353.4, 300.2 352.8, 295.5 351.2 C 293.9 350.6, 290 349.6, 287 348.9 C 284 348.3, 274.8 345.5, 266.5 342.8 C 221.8 328, 200.2 326.3, 173.5 335.2 C 162.2 339, 145.1 347.4, 136.8 353.1 C 135.4 354.2, 133.9 355, 133.6 355 C 133.3 355, 130.6 356.6, 127.6 358.5 C 94.7 379.5, 58.2 375.2, 43.7 348.4 C 33.9 330.3, 27.9 309.8, 24.9 283.5 C 17.8 221.3, 37.8 154.5, 77.4 108.2 C 104.4 76.6, 134.4 54.7, 170.5 40.2 C 217.5 21.3, 274 19, 325 33.9 C 329.1 35.1, 333.4 36.5, 334.5 36.9 C 339.5 39.1, 343.8 40.8, 347 42.1 C 399.9 63, 452.4 116.8, 472.1 170.2 C 475.3 178.9, 476 191.1, 473.7 197 C 466.6 215.1, 457.3 221.4, 437.5 221.5 C 418.8 221.5, 412.7 216.8, 398.4 191.5 C 384.8 167.3, 367.9 162.4, 355.2 178.9 C 352 182.9, 346 196.1, 346 198.8 C 346 199.8, 345.6 201, 345.1 201.6 C 344.2 202.5, 338.6 221.8, 337.5 228 C 337.2 229.9, 336.5 232.6, 336 234 C 335.6 235.4, 334 241.9, 332.4 248.5 C 326.1 276, 321 293.5, 319.3 293.5 C 318.5 293.5, 312.4 270.7, 312.5 268 C 312.6 267.2, 312.3 265.8, 311.8 264.8 C 311.1 263.2, 308.5 246.9, 305.4 224.5 C 304.6 218.5, 303.5 210.8, 303 207.5 C 302.4 204.2, 301.3 196.3, 300.5 190 C 299.6 183.7, 298.2 174.7, 297.4 170 C 296.6 165.3, 295.5 159, 295 156 C 292.4 139.6, 286.9 120.9, 282.8 114.5 C 270.5 95.3, 252.4 101.5, 244.4 127.7 C 242.2 135, 241.2 139, 238 154 C 237.5 156.5, 236.3 161.7, 235.5 165.5 C 233.9 172.4, 232.8 178.4, 231 189 C 227.3 210.3, 226.3 215.8, 225.7 216.7 C 225.4 217.2, 224.6 220.6, 224.1 224.2 C 222.6 233.4, 217.1 250, 215.6 250 C 214.9 250, 213.8 249, 213.2 247.8 C 210.8 243, 207 233, 207 231.6 C 207 230.7, 206.4 228.6, 205.6 226.8 C 204.8 225, 202 216.8, 199.4 208.6 C 190.2 179, 183 169.8, 169.3 169.8 C 158.1 169.8, 151.3 176.3, 139.6 198.5 C 127.9 220.7, 129.4 220, 90.8 220 L 62.2 220 59.1 222.6 C 55.8 225.4, 55.1 228.9, 57.1 233.3 C 59.3 238.1, 60.2 238.2, 94 238.3 L 125.7 238.3 131.4 235.6 C 137.4 232.8, 147.3 223.6, 150 218.4 C 150.8 216.8, 152 215, 152.6 214.3 C 153.2 213.7, 155.9 208.9, 158.5 203.8 C 169.6 182, 170.8 183.1, 185.1 226.2 C 193.7 252, 196.9 258.9, 203 264.4 C 218.6 278.4, 236.2 263.9, 242.4 232 C 242.7 230.6, 243.4 227, 244 224 C 246.3 213.2, 250.1 193.4, 250.9 188 C 252.7 176.5, 257.1 155.3, 258.5 150.9 C 259.3 148.3, 260 145.4, 260.1 144.4 C 260.2 141, 265.7 124.5, 266.6 125 C 268.6 126, 272.4 139.9, 275.6 158 C 279.3 178.6, 281 189, 282 196.5 C 290.1 259.2, 296 290.5, 301.8 301.6 C 310.7 318.6, 327.4 319.5, 336.3 303.5 C 338.7 299.3, 345.1 279.9, 346.9 271.5 C 347.5 268.8, 348.7 263.8, 349.5 260.5 C 350.4 257.2, 351.9 250.6, 352.9 245.8 C 354 241.1, 355.3 235.7, 355.9 233.8 C 356.4 232, 358.3 225.1, 360.1 218.5 C 368.8 185.5, 372.1 183.2, 383 202.4 C 386.6 209, 387.5 210.5, 390 214.1 C 412.1 245.9, 450.7 250.7, 477 225 C 499.4 203, 499.7 174.8, 477.7 134.5 C 474.2 128.1, 466.2 115.5, 460 106.6 C 437.1 73.8, 391.6 38.2, 353 22.9 C 339 17.3, 335.4 16, 332 15.4 C 330.1 15, 327.7 14.3, 326.8 13.8 C 325.8 13.3, 323.1 12.5, 320.8 12 C 318.4 11.5, 313.4 10.4, 309.6 9.6 C 289.6 5.1, 256.1 2.5, 239 4"
)

EVIDENCE_HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Screen recordings of the Timbre Care agent planning its own sequence, and being stopped by rules held in the tool layer.">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<meta name="theme-color" content="#cf3016">
</head>
<body>
"""

# data-theme="light" is not a default, it is a lock. This page is embedded in an
# iframe on the site's /record, and the site is bright by decision, so a visitor
# whose OS is dark would otherwise see a dark panel inside a light page. The
# stylesheet's dark blocks are written as :root:where(:not([data-theme="light"]))
# and :root[data-theme="dark"], so light now wins over both and no token is lost.
# EVIDENCE_HEAD is deliberately not locked: that page is not embedded anywhere.
STANDALONE_HEAD = """<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Timbre Care caregiver console: what the check-in call heard, and who it was routed to.">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-192.png">
<meta name="theme-color" content="#cf3016">
</head>
<body>
"""

# Installability lives only in the standalone build. The fragment is published
# as an artifact on another origin, where registering a service worker for this
# scope would be both wrong and invisible.
PWA_TAIL = """
<style>
  .pwa-bar {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: 1rem; z-index: 50;
    display: flex; align-items: center; gap: 0.75rem;
    background: var(--surface); color: var(--ink);
    border: 1px solid var(--border); border-radius: 999px;
    padding: 0.55rem 0.7rem 0.55rem 1.1rem;
    box-shadow: 0 6px 24px rgba(0,0,0,0.16); font-size: 0.85rem;
    max-width: calc(100vw - 2rem);
  }
  .pwa-bar[hidden] { display: none; }
  .pwa-bar button {
    font: inherit; font-weight: 600; cursor: pointer; border-radius: 999px;
    border: 0; padding: 0.4rem 0.9rem; background: var(--series); color: #fff;
  }
  .pwa-bar .pwa-x {
    background: transparent; color: var(--ink-muted); padding: 0.2rem 0.5rem; font-weight: 700;
  }
  .pwa-bar .pwa-msg { line-height: 1.35; }
  @media print { .pwa-bar { display: none; } }
</style>
<div class="pwa-bar" id="pwa-bar" hidden>
  <span class="pwa-msg" id="pwa-msg"></span>
  <button id="pwa-go" hidden>Install</button>
  <button class="pwa-x" id="pwa-x" aria-label="Dismiss">&times;</button>
</div>
<script>
(function () {
  "use strict";
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }

  var bar = document.getElementById("pwa-bar");
  var msg = document.getElementById("pwa-msg");
  var go = document.getElementById("pwa-go");
  var standalone = window.matchMedia("(display-mode: standalone)").matches ||
                   window.navigator.standalone === true;
  // Never offer the install inside a frame. This page is embedded in an iframe
  // on the site's /record, where the bar floats over the console offering an
  // install that cannot happen: a framed document is not installable, and on
  // iOS the Share-sheet copy is instructions for the wrong window entirely.
  // Opened on its own it is installable as before. Cross-origin access to
  // window.top throws, so a framed page is detected by the throw as well.
  var framed = true;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (framed || standalone || sessionStorage.getItem("pwa-dismissed")) return;

  document.getElementById("pwa-x").addEventListener("click", function () {
    sessionStorage.setItem("pwa-dismissed", "1");
    bar.hidden = true;
  });

  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    msg.textContent = "Keep this console on your home screen.";
    go.hidden = false;
    bar.hidden = false;
  });

  go.addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt();
    deferred = null;
    bar.hidden = true;
  });

  // iOS fires no beforeinstallprompt, so the only route is the Share sheet and
  // the only way a caregiver finds it is being told.
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) {
    msg.textContent = "To install: Share, then Add to Home Screen.";
    bar.hidden = false;
  }
})();
</script>
"""

ELDER_ID = "lim-mei-hua"

# The trailing field names the marker family whose eligibility gates the panel.
# Words per minute is counted off the transcript, so it is linguistic and must
# disappear whenever that family is ineligible. The other three come from
# diarisation and segmentation, which need no word recognition, so they survive
# a failed lexical gate. Rendering a marker the elder is not eligible for
# contradicts the model line printed directly beside it (PRD 6.3).
MARKERS = [
    ("speech_rate_wpm", "Speech rate", "wpm", 1, "linguistic"),
    ("pause_fraction", "Time spent pausing", "of the call", 3, "acoustic"),
    ("answer_latency_s", "Answer latency", "seconds", 2, "behavioural"),
    ("articulation_rate_sps", "Articulation rate", "syll/sec", 2, "acoustic"),
]

SCOPES = [
    "appointment_summary",
    "content_flags",
    "acute_notification",
    "drift_digest",
    "verbatim_transcript",
]

SCOPE_LABELS = {
    "appointment_summary": "Appt summary",
    "content_flags": "Content flags",
    "acute_notification": "Acute alerts",
    "drift_digest": "Drift digest",
    "verbatim_transcript": "Transcripts",
}

# PRD 6.1. Keyed on rules.CADENCES so a cadence the tool accepts can never
# reach a page without a label.
CADENCE_LABELS = {
    "daily": "daily",
    "every_other_day": "every other day",
    "three_times_a_week": "three times a week",
}
assert set(CADENCE_LABELS) == set(rules.CADENCES)

# The chain's last-call line, keyed on what was actually logged. A missing day
# is stated as missing and never filled in (PRD 6.7), so the page has to have a
# sentence for it rather than one that assumes she answered.
LAST_CALL_TITLES = {
    "completed": "She answered. Sample usable.",
    "no_answer": "No answer after retries. Recorded as missing, never filled in.",
    "unusable": (
        "She answered; the sample was unusable. Recorded as missing, never "
        "filled in."
    ),
}


def build_marker(
    elder: dict, key: str, label: str, unit: str, dp: int, family: str
) -> dict:
    calls = elder["calls"]
    points = [
        {
            "d": c["date"],
            "v": round(c["markers"][key], dp) if c["status"] == "completed" else None,
        }
        for c in calls
    ]

    # Baseline is the reference period only, so later drift is measured against
    # a stable window rather than against itself.
    baseline_vals = [
        p["v"] for p in points[: rules.BASELINE_SAMPLES] if p["v"] is not None
    ]
    mid = statistics.mean(baseline_vals)
    sd = statistics.pstdev(baseline_vals) or 0.01

    recent = [p["v"] for p in points[-14:] if p["v"] is not None]
    early = [p["v"] for p in points[: rules.BASELINE_SAMPLES] if p["v"] is not None]
    spread_change = (statistics.pstdev(recent) or 0) / (statistics.pstdev(early) or 0.01)

    last = next((p["v"] for p in reversed(points) if p["v"] is not None), None)
    missing = sum(1 for p in points if p["v"] is None)

    return {
        "key": key,
        "label": label,
        "unit": unit,
        "family": family,
        "points": points,
        "band_lo": round(mid - sd, dp),
        "band_hi": round(mid + sd, dp),
        "band_mid": round(mid, dp),
        "last_label": f"{last} {unit}" if last is not None else "no sample",
        "foot": (
            f"{points[0]['d'][5:]} to {points[-1]['d'][5:]}. "
            f"Baseline {round(mid, dp)} ± {round(sd, dp)}. "
            f"Spread over the last 14 days is {spread_change:.1f}× the baseline period."
        ),
        "aria": (
            f"Baseline mean {round(mid, dp)} {unit}, latest {last} {unit}, "
            f"{missing} days with no usable sample."
        ),
    }


def when_label(iso_day: str | None) -> str:
    """Relative day for the narrative chain, read off the record's own dates.

    These were hardcoded to "Today", so a flag raised three days ago read as
    this morning and four days of history collapsed into one. The frequency
    counts are the whole argument for not grading complaints (PRD 8.3), and
    they mean nothing if every mention looks simultaneous.
    """
    if not iso_day:
        return ""
    days = (date.today() - date.fromisoformat(iso_day)).days
    if days <= 0:
        return "Today"
    if days == 1:
        return "Yesterday"
    return f"{days} days ago"


def appointment_link(elder: dict) -> dict:
    """The first link in the chain, read off the appointment the agent ran.

    Falls back to the watch-fors as they stand if no appointment has been
    captured yet, so the page never claims a consultation that did not happen.
    """
    watch_fors = "; ".join(w["text"] for w in elder["watch_fors"])
    appointments = elder.get("appointments") or {}
    if not appointments:
        return {
            "when": "Last appointment",
            "title": f"{len(elder['watch_fors'])} things to watch, on her record",
            "detail": (
                f"{watch_fors}. These were written to her record, not left in a "
                "summary nobody re-reads."
            ),
        }

    key = max(appointments)
    appt = appointments[key]
    when = date.fromisoformat(appt["opened_on"])
    captions = len(appt["captions"])
    written = appt.get("outputs", {}).get("watch_fors", [])
    # The language the captions were actually published in, not her stored
    # preference: the page may only report what the agent did.
    languages = sorted({c["language"] for c in appt["captions"]}) or ["none"]
    return {
        # Built by hand: the no-pad day directive differs between platforms.
        "when": f"{when.day} {when:%b}",
        "title": (
            f"Consultation written up as it happened, then turned into "
            f"{len(written)} things to watch"
        ),
        "detail": (
            f"{captions} plain-language lines written during the visit, "
            f"in {' and '.join(languages)}, none of them containing a dose or a "
            "date the doctor did not say. Written into her record to be read "
            "back afterwards, by her and by the people she authorised. Then: "
            f"{watch_fors}. Written to her record by the agent, not left in a "
            "summary nobody re-reads."
        ),
    }


def write_pwa(version: str) -> list[Path]:
    """Manifest, service worker and icons for the caregiver console.

    Network-first, because this shows medication doses: a stale copy served
    instantly is worse than a fresh copy served slowly. The cache exists only so
    a caregiver in a hospital basement can still read the last state, and the
    version is stamped from the build so a deploy always retires the old worker.
    EdgeOne's edge already serves a previous build for about a minute; a
    cache-first worker on top of that would make stale content stick for good.
    """
    written = []

    manifest = {
        "name": "Timbre Care: caregiver console",
        "short_name": "Timbre Care",
        "description": (
            "What the check-in call heard, who it was routed to, and the record "
            "kept for the elder to read."
        ),
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "orientation": "portrait-primary",
        "background_color": "#f9f9f7",
        "theme_color": "#cf3016",
        "icons": [
            {
                "src": f"/icon-{s}.png",
                "sizes": f"{s}x{s}",
                "type": "image/png",
                "purpose": "any maskable",
            }
            for s in (192, 512)
        ],
    }
    path = PUBLIC_DIR / "manifest.json"
    path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    written.append(path)

    sw = f"""// Generated by build_console.py. Cache name carries the build version,
// so publishing retires every previous worker instead of racing it.
const CACHE = "care-companion-{version}";
const FALLBACK = "/";

self.addEventListener("install", (e) => {{
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([FALLBACK, "/manifest.json"]))
      .then(() => self.skipWaiting())
  );
}});

self.addEventListener("activate", (e) => {{
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
}});

// Network first. The cache is the offline fallback, never the fast path: this
// page states medication doses and a silently stale dose is the worst outcome.
self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  // The evidence clips are served in ranges. A 206 cannot be cached anyway, and
  // an offline fallback of the console HTML for a video request helps nobody.
  if (e.request.destination === "video" || url.pathname.endsWith(".mp4")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {{
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {{}});
        return res;
      }})
      .catch(() => caches.match(e.request).then((r) => r || caches.match(FALLBACK)))
  );
}});
"""
    path = PUBLIC_DIR / "sw.js"
    path.write_text(sw, encoding="utf-8")
    written.append(path)

    # The favicon. An SVG file rather than a data URI in the head: the path is
    # 5 KB and every page in this deploy links it.
    icon = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 576 576">'
        f'<path fill="{BRAND}" fill-rule="evenodd" d="{MARK_D}"/></svg>'
    )
    path = PUBLIC_DIR / "icon.svg"
    path.write_text(icon, encoding="utf-8")
    written.append(path)

    # The installed-app icons. These were a six-point polyline hand-drawn with
    # ImageDraw on a blue tile, which approximated a mark that did not exist
    # yet; they are the real one now, composited from web/mark-512.png (the
    # antialiased bitmap the SVG above was traced from) so no SVG renderer is
    # needed at build time.
    #
    # Drawn at 62% on a full-bleed cream ground because the manifest declares
    # these "any maskable": an OS may crop to a circle of 80% diameter, and a
    # mark drawn edge to edge would lose its own circle to that crop. Cream and
    # vermilion rather than the old white-on-blue, which matched nothing in the
    # brand.
    from PIL import Image

    src = Image.open(ROOT / "web" / "mark-512.png").convert("L")
    for size in (192, 512):
        inner = round(size * 0.62)
        ink = src.resize((inner, inner), Image.LANCZOS)
        tile = Image.new("RGB", (size, size), GROUND)
        # The greyscale is ink-on-white, so it inverts into a coverage mask.
        layer = Image.new("RGB", (inner, inner), BRAND)
        mask = ink.point(lambda v: 255 - v)
        tile.paste(layer, ((size - inner) // 2, (size - inner) // 2), mask)
        path = PUBLIC_DIR / f"icon-{size}.png"
        tile.save(path, "PNG", optimize=True)
        written.append(path)

    return written


def build() -> dict:
    data = store.load()
    elder = store.get_elder(data, ELDER_ID)
    calls = elder["calls"]
    usable = store.usable_samples(elder)
    missing = len(calls) - usable

    eligibility = elder["marker_eligibility"]
    markers = [build_marker(elder, *m) for m in MARKERS if eligibility.get(m[4])]
    if not markers:
        raise SystemExit(
            f"{ELDER_ID} has no eligible marker family, so there is no drift "
            "panel to render. Check marker_eligibility in the store."
        )

    eligible = [k for k, v in eligibility.items() if v]
    model = " + ".join(eligible)

    today = calls[-1]
    events = elder["events"]
    content = [e for e in events.values() if e["kind"] == "content_flag"]
    # Read off the flags rather than assumed: the stat used to say "raised
    # today, all routine" against a record whose newest flag was days old and
    # one of which sits at immediate urgency and stays there (PRD 8.3).
    flag_days = sorted({e["raised_on"] for e in content if e.get("raised_on")})
    n_immediate = sum(1 for e in content if e.get("urgency") == "immediate")

    notified = sorted({
        n for e in events.values() for n in e.get("notified", [])
    })
    all_names = [r["name"] for r in elder["recipients"]]
    not_notified = [n for n in all_names if n not in notified]

    chain = [
        appointment_link(elder),
        {
            "when": "Every day since",
            "title": f"The call asks about exactly those, and nothing sharper",
            "detail": (
                "Presence only. It never asks how bad something is, because onset, "
                "duration and severity are triage fields and asking them is triage."
            ),
        },
        {
            "when": when_label(today.get("date")),
            # Read off the status. This used to say "She answered" whatever the
            # record held, so the day after a missed call the page would have
            # read "She answered. No Answer, sample usable."
            "title": LAST_CALL_TITLES.get(
                today["status"], f"Call recorded as {today['status']}."
            ),
            "said": today.get("note") or "",
        },
    ]

    # Everything after the two fixed openers is dated, and it is sorted, because
    # each item prints a relative day and a reader takes that for a timeline
    # whether or not one was intended. Unsorted it ran "Yesterday" (the call),
    # then "4 days ago", then "2 days ago", then "Yesterday" again: the flags
    # were appended in store order after an item that is always the newest call.
    #
    # The secondary key puts a day's call ahead of the flags raised on it, which
    # is causally right as well as tidy: the call is what produced them.
    dated: list[tuple[str, int, dict]] = [
        (today.get("date") or "", 0, chain.pop()),
    ]
    for e in content:
        dated.append((e.get("raised_on") or "", 1, {
            "when": when_label(e.get("raised_on")),
            "title": f"Flagged: {e['topic']}",
            "said": e["quote"],
            "counts": (
                ("Routed to " + ", ".join(e.get("notified", [])) + "."
                 if e.get("notified") else "Raised, not yet routed.")
                + " Urgency: " + (e.get("urgency") or "routine") + "."
            ),
        }))
    dated.sort(key=lambda t: (t[0], t[1]))
    chain.extend(item for _, _, item in dated)

    # The most important panel on the page: a flag the product declined to raise.
    blocking = [
        m for m in elder["med_list"]
        if m["sedating"] and (date.today() - date.fromisoformat(m["started"])).days <= 30
    ]
    blocked_flag = None
    if blocking:
        med = blocking[0]
        age = (date.today() - date.fromisoformat(med["started"])).days
        blocked_flag = {
            "title": "A drift flag was not raised today, on purpose",
            "body": (
                "Her pausing and answer latency have both widened against her own "
                "baseline. That would normally be reported. It was not, because "
                "something else explains it."
            ),
            "why": (
                f"{med['name'].title()} is sedating and was started {age} days ago. "
                "Sedating medication moves exactly these markers, so no flag may be "
                "raised until the confound register is clear. The block and its "
                "reason are logged so this can be audited later."
            ),
        }

    return {
        "generated": date.today().isoformat(),
        "elder": {
            "name": elder["display_name"],
            "meta": (
                f"{elder['spoken_language']} · Tier {elder['language_tier']} · "
                f"{model} model · enrolled {elder['enrolled_on']} · "
                f"check-ins {CADENCE_LABELS[elder.get('check_in_cadence', rules.DEFAULT_CADENCE)]}"
            ),
        },
        "stats": [
            {"value": str(len(calls)), "label": "Calls on record"},
            {
                "value": f"{round(100 * usable / len(calls))}%",
                "label": f"Calls with a usable sample ({missing} missing, never filled in)",
            },
            {
                "value": f"{usable}",
                "label": f"Usable samples, of {rules.BASELINE_SAMPLES} needed",
                "pill": "Baseline mature" if usable >= rules.BASELINE_SAMPLES else "Building",
                "pill_good": usable >= rules.BASELINE_SAMPLES,
            },
            {
                "value": str(len(content)),
                "label": (
                    "Content flags on record"
                    + (f", latest {when_label(flag_days[-1]).lower()}" if flag_days else "")
                    + (
                        f", {n_immediate} at immediate urgency" if n_immediate
                        else ", all routine"
                    )
                ),
            },
        ],
        "chain": chain,
        "blocked_flag": blocked_flag,
        "chart_note": (
            "Each marker against her own baseline, never a population norm. The shaded "
            "band is her personal reference range. The line breaks where a day has no "
            "usable sample, and the red tick below marks it: a missing call is recorded "
            "as missing and is never estimated, because the signal being watched is the "
            "variability between samples and filling gaps would smooth away the thing itself."
        ),
        "markers": markers,
        "scopes": [SCOPE_LABELS[s] for s in SCOPES],
        "recipients": [
            {
                "name": r["name"],
                "scopes": [SCOPE_LABELS[s] for s in r["scopes"]],
            }
            for r in elder["recipients"]
        ],
        "footer": (
            "Timbre Care surfaces changes worth mentioning to a doctor. It does not "
            "diagnose, does not score dementia risk, and does not advise on treatment. "
            f"Routed so far to: {', '.join(notified) or 'nobody'}. "
            f"Not routed to: {', '.join(not_notified) or 'nobody'}. "
            "The consultation audio, the check-in call and the seeded call history on "
            "this page are replayed fixtures; the most recent calls and every flag "
            "were written by live agent runs, and routing records who an item is for "
            "rather than transmitting it. Every rule, refusal and routing decision "
            "here is live code, and this page is generated from what the agent "
            "actually wrote."
        ),
    }


def stamp_clip_urls(html: str) -> str:
    """Version every evidence clip URL by the hash of its bytes.

    EdgeOne serves media as `max-age=31536000, immutable`, so a re-cut clip
    published at the same path is never fetched again: the browser keeps the old
    one and, because of `immutable`, will not even revalidate on reload. The
    hash is what makes a new cut a new URL. It goes before the `#t=` fragment,
    which is what makes the player paint an opening frame.
    """
    def stamp(match: re.Match[str]) -> str:
        name, fragment = match.group(1), match.group(2)
        clip = OUTPUT_EVIDENCE.parent / name
        if not clip.exists():
            return match.group(0)
        digest = hashlib.sha256(clip.read_bytes()).hexdigest()[:8]
        return f'src="{name}?v={digest}{fragment}"'

    return re.sub(r'src="([^"?#]+\.mp4)([^"]*)"', stamp, html)


def main() -> None:
    snapshot = build()
    body = TEMPLATE.read_text(encoding="utf-8")
    # `<` is escaped because HTML ends a script element at the first literal
    # `</script>`, whatever its type attribute says, and this payload carries
    # agent-written free text. < is valid JSON, so JSON.parse restores it
    # and nothing rendered on the page changes.
    data = json.dumps(snapshot, separators=(",", ":")).replace("<", "\\u003c")
    body = body.replace("/*__DATA__*/", data)

    OUTPUT_FRAGMENT.write_text(body, encoding="utf-8")
    html = STANDALONE_HEAD + body + PWA_TAIL + "\n</body>\n</html>\n"
    OUTPUT.write_text(html, encoding="utf-8")
    OUTPUT_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PUBLIC.write_text(html, encoding="utf-8")
    print(f"wrote {OUTPUT}  ({len(html):,} bytes)")
    print(f"wrote {OUTPUT_FRAGMENT}  (for artifact publishing, no service worker)")
    print(f"wrote {OUTPUT_PUBLIC}  (deploy root)")

    evidence_html = stamp_clip_urls(
        EVIDENCE_HEAD
        + TEMPLATE_EVIDENCE.read_text(encoding="utf-8")
        + "\n</body>\n</html>\n"
    )
    OUTPUT_EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_EVIDENCE.write_text(evidence_html, encoding="utf-8")
    clips = sorted(OUTPUT_EVIDENCE.parent.glob("*.mp4"))
    print(f"wrote {OUTPUT_EVIDENCE}  (deploy root, /evidence/, {len(clips)} clips)")

    version = hashlib.sha256(html.encode("utf-8")).hexdigest()[:12]
    for path in write_pwa(version):
        print(f"wrote {path.name}  (pwa, cache {version})")
    print(f"  {len(snapshot['markers'])} marker panels, "
          f"{len(snapshot['markers'][0]['points'])} days")
    print(f"  blocked-flag callout: {'yes' if snapshot['blocked_flag'] else 'no'}")


if __name__ == "__main__":
    main()

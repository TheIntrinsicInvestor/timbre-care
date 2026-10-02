# Timbre Care: skills and MCP server

Scaffold for both halves of the product, built as WorkBuddy Skills driving one
custom MCP server. The skills carry the plan; the MCP server carries the tools
and, more importantly, the refusals.

```
agent/
├── mcp_server/
│   ├── server.py     seventeen tools, the whole agent surface
│   ├── rules.py      the product invariants, enforced in code
│   ├── store.py      JSON Signal Store, seeded with one elder
│   └── consult.py    the replayed consultation, and what a caption may say
├── skill/
│   ├── care-companion-check-in/       the daily call
│   ├── care-companion-appointment/    the consultation
│   └── *.zip                          built by build_skill_zips.ps1
├── run_smoke.py               the only sanctioned way to run the tests
├── smoke_test_concurrency.py  the store lock: parallel captions, none lost
├── smoke_test.py              check-in: happy path plus every guard rail
├── smoke_test_appointment.py  appointment: same, run this one last
├── build_console.py           renders web/index.html from the store
├── build_skill_zips.ps1       builds the submission ZIP
└── data/
    ├── signal_store.json      seeded on first run; now carries real agent
    │                          output the console renders. Never delete or reseed.
    └── consult-2026-08-05.json  the replayed consultation, fixed input
```

The two halves are one chain, not two features. The consultation writes the
watch-fors the daily call asks about, and the medication change it confirms is
what blocks a drift flag three weeks later.

## Why the rules live in the tools

The product's safety properties are the pitch, so they cannot depend on a model
choosing to honour them. There is no severity parameter anywhere in the tool
surface, no suppression call, and no way to lower an urgency, because the
product does not grade complaints. An agent that tries gets an error naming the
rule and the section of the PRD it comes from.

The smoke suite demonstrates twenty-seven such refusals, and they are the
interesting part of a demo, not the boring part. Among them:

| Attempt | Result |
|---|---|
| Ask "how bad is the knee pain?" | Refused: severity questions are triage |
| Open the consult on the agent's own tap | Refused: the tap is a physical act, hers |
| Set her check-in cadence slower than three a week | Refused: the baseline never matures |
| Set her cadence with nobody named | Refused: a recipient may relay, not decide |
| Log a completed call with the wrong marker keys | Refused: the record is measured on four |
| Raise a content flag with no topic or no quote | Refused: counts need a history, and evidence |
| Log markers for an unanswered call | Refused: missing days are never imputed |
| Compute lexical markers for a Tier 2 elder | Refused: confidence gate not passed |
| Lower an urgency from immediate to routine | Refused: escalation is monotone |
| Record the consult on the daughter's consent | Refused: the tap is the elder's, per visit |
| Record with no audible announcement | Refused: the clinician must be able to object |
| Caption a dose of 1000 mg when 850 mg was said | Refused: no number the doctor did not say |
| Caption a medicine that segment never mentioned | Refused: the transcript reconciles, never writes |
| Caption that still says "osteoarthritis" | Refused: the jargon is the thing being removed |
| Caption longer than large print allows | Refused: it cannot be read in time |
| Caption in Hokkien | Refused: no settled orthography to render into |
| Let the transcript confirm its own med change | Refused: a named human confirms, or nothing is written |
| Tell her to come back in 6 months, not 6 weeks | Refused: the unit is checked, not only the digit |
| Write a watch-for asking how bad the knee is | Refused: the check-in asks whether, and stops |

One more behaviour is worth showing on its own: a legitimate drift flag is
**blocked** because a sedating medication started four days ago, and the block
is logged with its reason rather than silently dropped.

## Setup

Python 3.11+.

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Verify:

```powershell
$env:PYTHONIOENCODING = "utf-8"
.venv\Scripts\python.exe run_smoke.py
.venv\Scripts\python.exe build_console.py
```

Never run the three test files directly; they reseed `data/signal_store.json`,
which holds real agent output. `run_smoke.py` gives each test a throwaway store
on local disk, runs them in the one order that works, and leaves the real store
byte-identical. `PYTHONIOENCODING` matters because the store holds her Chinese
captions and a default Windows cp1252 stdout dies on them.

Expected last line: `all 3 smoke tests passed`. Build the console after, so the
page reflects everything.

The concurrency test exists because a real agent run lost a caption. It
publishes every clinician segment at once and asserts none went missing, which
is a thing sequential tests cannot catch.

## Wiring into WorkBuddy

Add the server to `~/.workbuddy-ai/.mcp.json`. Note the dot-prefixed filename
inside `.workbuddy-ai`: the `~/.workbuddy/` directory is the app itself, and
writing config there does nothing. Merge rather than overwrite, since a
`connector-proxy` entry is present by default.

```json
{
  "mcpServers": {
    "care-companion": {
      "type": "stdio",
      "command": "<path to agent>\\.venv\\Scripts\\python.exe",
      "args": ["-m", "mcp_server.server"],
      "cwd": "<path to agent>"
    }
  }
}
```

A newly added server also needs Trust granting in connector management before
its tools surface to the agent.

Then install the skills. `build_skill_zips.ps1` writes one archive into
`skill/`: the bundle containing both skills, because the appointment-to-check-in
linkage is the wedge and a judge given a single skill cannot see it. Upload
through WorkBuddy's Skills settings; installed skills land in
`~/.workbuddy-ai/skills/`.
Each `config.yaml` declares `care-companion` as a required MCP server, so
install the server config first.

For the scheduled run, create a WorkBuddy automation on a daily trigger whose
instruction is "run the daily check-in for lim-mei-hua". The skill's trigger
keywords pick it up from there.

## Wiring into Claude Code

Same server, different config file:

```powershell
claude mcp add care-companion --scope user -- <path to agent>\.venv\Scripts\python.exe -m mcp_server.server
```

Run it from the `agent` directory so the relative data path resolves.

## What is real and what is not

Real: the tool surface, every rule in `rules.py`, the scope-based routing, the
confound gate, the store and its 41 days of seeded markers including three
deliberately missing days. Every caption and every summary is written by the
agent and validated against what was actually said.

Not real: `place_check_in_call` simulates the call and returns a fixed
transcript. Telephony replaces the body of that one function and nothing else.
The consultation is replayed from `data/consult-2026-08-05.json` rather than
recognised live, so the Live Simplifier is exercised without a microphone in
the room; streaming ASR replaces `next_consult_segments` and nothing downstream
of it changes. No TTS and no dialect model is wired up. The elder, her family,
her helper, her doctor and her medication list are invented.

Say so on the demo page. The product's whole argument is that it does not
overclaim, and an unlabelled simulation undercuts that faster than a thin
feature ever would.

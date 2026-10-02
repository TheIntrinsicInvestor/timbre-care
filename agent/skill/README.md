# Timbre Care: Skills Bundle

**AI CAN DO IT | Age Well Social Good Challenge Singapore. AI Agent/Skills track. Team Karpathians.**

Live site: https://timbre-care.edgeone.dev
Caregiver console: https://care-companion-sg.edgeone.dev

Two WorkBuddy skills driving one custom MCP server. The skills carry the plan;
the server carries the tools and, more importantly, the refusals. Everything
needed to run them is in this archive.

```
care-companion-check-in/       the daily welfare call
care-companion-appointment/    the medical consultation
server/
├── mcp_server/
│   ├── server.py     seventeen tools, the whole agent surface
│   ├── rules.py      the product invariants, enforced in code
│   ├── store.py      JSON Signal Store, one enrolled elder
│   └── consult.py    the replayed consultation, and what a caption may say
├── data/
│   ├── signal_store.json        the real record the live console renders
│   └── consult-2026-08-05.json  the replayed consultation, fixed input
├── run_smoke.py                 the only sanctioned way to run the tests
├── smoke_test_concurrency.py    the store lock: parallel captions, none lost
├── smoke_test.py                check-in: happy path plus every guard rail
├── smoke_test_appointment.py    appointment: same, run this one last
└── requirements.txt             one line
```

The two skills are one chain, not two features. The consultation writes the
watch-fors the daily call asks about, and the medication change it confirms is
what blocks a drift flag three weeks later. That linkage is why both ship in a
single archive: a judge given one skill cannot see it.

## Why the rules live in the tools, not the prompt

The product's safety properties are the pitch, so they cannot depend on a model
choosing to honour them. There is no severity parameter anywhere in the tool
surface, no suppression call, and no way to lower an urgency, because the
product does not grade complaints. An agent that tries gets an error naming the
rule it broke.

The smoke suite demonstrates twenty-seven such refusals, and they are the
interesting part of the demo rather than the boring part. Among them:

| Attempt | Result |
|---|---|
| Ask "how bad is the knee pain?" | Refused: severity questions are triage |
| Open the consult on the agent's own tap | Refused: the tap is a physical act, hers |
| Set her check-in cadence slower than three a week | Refused: the baseline never matures |
| Log markers for an unanswered call | Refused: missing days are never imputed |
| Compute lexical markers for a Tier 2 elder | Refused: confidence gate not passed |
| Lower an urgency from immediate to routine | Refused: escalation is monotone |
| Record the consult on the daughter's consent | Refused: the tap is the elder's, per visit |
| Caption a dose of 1000 mg when 850 mg was said | Refused: no number the doctor did not say |
| Caption that still says "osteoarthritis" | Refused: the jargon is the thing being removed |
| Caption in Hokkien | Refused: no settled orthography to render into |
| Let the transcript confirm its own med change | Refused: a named human confirms, or nothing is written |
| Tell her to come back in 6 months, not 6 weeks | Refused: the unit is checked, not only the digit |
| Write a watch-for asking how bad the knee is | Refused: the check-in asks whether, and stops |

One more behaviour is worth watching on its own: a legitimate drift flag is
**blocked** because a sedating medication started four days ago, and the block
is logged with its reason rather than silently dropped.

## Running it

Python 3.11 or later. One dependency.

```
cd server
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt      # Windows: .venv\Scripts\python.exe
```

Verify the whole rule surface, which needs no agent and no network:

```
PYTHONIOENCODING=utf-8 .venv/bin/python run_smoke.py
```

Expected last line: `all 3 smoke tests passed`. `PYTHONIOENCODING` matters
because the store holds Chinese captions and a default Windows console dies on
them.

Never run the three test files directly. They reseed `data/signal_store.json`,
which holds real agent output. `run_smoke.py` gives each test a throwaway store,
runs them in the one order that works, and leaves the real store byte-identical.

## Wiring the server into an agent

WorkBuddy reads `~/.workbuddy-ai/.mcp.json` (dot-prefixed, inside
`.workbuddy-ai`). Merge rather than overwrite, since a `connector-proxy` entry
is present by default, and grant Trust in connector management afterwards or the
tools will not surface.

```json
{
  "mcpServers": {
    "care-companion": {
      "type": "stdio",
      "command": "<path to server/.venv python>",
      "args": ["-m", "mcp_server.server"],
      "cwd": "<path to server>"
    }
  }
}
```

`cwd` matters: the data paths resolve relative to `server/`.

Then install the skills. Extracting the two `care-companion-*` folders into
`~/.workbuddy-ai/skills/` is a real install, since WorkBuddy discovers skills
from the filesystem rather than a registry. Installing through the Skills
settings UI additionally runs a security scan. Each `config.yaml` declares
`care-companion` as a required MCP server, so add the server config first.

For the unattended run, create an automation on a daily trigger whose
instruction is "run the daily check-in for lim-mei-hua". The skill's trigger
keywords pick it up from there.

The same server works in any MCP client. For Claude Code:

```
claude mcp add care-companion --scope user -- <python> -m mcp_server.server
```

## What is real and what is replayed

Stated here because the product's whole argument is that it does not overclaim.

**Real:** the tool surface, every rule in `rules.py`, the scope-based routing of
every notification, the confound gate, the store's concurrency lock, and the
caregiver console, which is generated from the store rather than hand-written so
it cannot show something the agent did not do. There is no network code anywhere
in the server.

**Replayed:** seven inputs. The consultation audio and transcript, the check-in
call, the observed markers, the 41-day history, the jargon lists, the speaker
diarisation, and the medication list's provenance. `place_check_in_call`
simulates the call and returns a fixed transcript; telephony replaces the body of
that one function and nothing else. Streaming ASR replaces `next_consult_segments`
and nothing downstream of it changes. No TTS and no dialect model is wired up.

The elder, her family, her helper, her doctor and her medication list are
invented. The record holds the same consultation captured twice, on 5 and 7
August, because it was demonstrated twice; that is the truth rather than a
duplicate.

## What this product will not claim

It does not detect dementia or memory decline, and it never will. Speech markers
predict the language domain reasonably and memory essentially not at all. The
only defensible claim is that something about how she speaks has changed, which
is why every refusal above exists. It does not triage, does not interpret her to
her clinician, and does not diagnose.

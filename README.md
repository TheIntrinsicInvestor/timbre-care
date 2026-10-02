# Timbre Care

An AI care agent for elderly people living alone. Built in August 2026 for the Tencent Cloud
"AI CAN DO IT | Age Well Social Good Challenge" in Singapore, AI Agent/Skills track, by team
Karpathians: Brian Liew and Joseph Chew ([@joczx](https://github.com/joczx)).

**Live: https://timbre-care.edgeone.dev**

## What it does

Two features that are really one chain:

- **Appointment Companion.** With the elder's consent, tapped by her in the room, it writes up a
  doctor's consultation in plain language as it happens, in a language she reads. It reconciles
  medication changes without ever writing one itself, and produces a large-print page for her and
  a separate digest for the family members she chose.
- **Daily Check-In.** A short outbound call that sounds like someone checking in rather than an
  assessment. It doubles as a speech sample taken over months.

The link between them is the point. The consultation writes the things the next morning's call
asks about. The medication change it confirms is what blocks a drift flag three weeks later,
because a newly sedating drug moves the same speech markers that cognitive drift does.

## The rules live in the tools

The product's safety properties can't depend on a model choosing to honour them, so they are
enforced in code (`agent/mcp_server/rules.py`), not in a prompt. There is no severity parameter
anywhere in the tool surface, no suppression call, and no way to lower an urgency. An agent that
tries gets an error naming the rule and the section of the spec it comes from.

The smoke tests show 27 of these refusals. The table in [`agent/README.md`](agent/README.md) is
the fastest way to understand what this thing is.

## Layout

| Path | What |
|---|---|
| `agent/` | MCP server (17 tools), the two WorkBuddy skills, the console builder, smoke tests |
| `site/` | The public site: product, demo walkthrough, agent run, and the record |
| `PRD.md` | The product spec, and the reasoning behind every constraint |

## Running it

```powershell
cd agent
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:PYTHONIOENCODING = "utf-8"
.venv\Scripts\python.exe run_smoke.py     # expect: all 3 smoke tests passed
```

The site: `cd site && npm install && npm run dev`.

## What is simulated

The phone call is simulated and the consultation is replayed from a fixed file rather than
transcribed live. No text-to-speech or dialect model is wired up. The elder, her family, her
doctor and her medication list are invented. Every caption and summary is written by the agent
and checked against what was actually said.

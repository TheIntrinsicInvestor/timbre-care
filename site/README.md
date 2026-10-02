# Timbre Care: site

The public site for Timbre Care, live at **https://timbre-care.edgeone.dev**. Next.js, exported as
static files and served from Tencent EdgeOne.

| Route | What it shows |
|---|---|
| `/` | The product for a family member: the problem, the handover from consult to daily call, the rules |
| `/demo` | A walkthrough of a representative case, from consultation to a drift flag being raised |
| `/agent` | How the agent is built, then a real unattended run with every tool call and refusal |
| `/record` | The elder's record, rendered from the same store the agent writes |

Clinical values on the site are transcribed from `agent/data/signal_store.json`, not written by
hand. Values that only illustrate the product, on `/` and `/demo`, live in
`src/content/persona.ts`. The elder and everyone around her are invented.

## Run

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build                # static export to out/
```

## Tests

`tests/*.mjs` are Playwright scripts that check a running build: layout at desktop and phone
widths, navigation by real clicks, and a copy audit. Start the site, then:

```bash
BASE=http://127.0.0.1:3000 node tests/home.mjs
```

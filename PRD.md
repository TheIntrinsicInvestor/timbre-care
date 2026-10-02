# Care Companion: Product Requirements Document

*Version 0.3 · 2026-08-07 · Owner: Brian Liew*

> **What changed in 0.3.** Check-in cadence is the elder's to choose from daily, every other day (the default) or three times a week, and the drift baseline is counted in usable samples rather than calendar days (§6.1, §6.6). Her consultation summary now lives in a native app instead of being sent to her as a WhatsApp or SMS link, which is a deliberate trade against §3's no-install promise. The native app and the care chatbot are specified in §13.1 and §13.2 and **are not built**.

> **Scope note.** This is a product vision PRD. It deliberately does **not** scope the Tencent Cloud hackathon submission due 9 Aug 2026. What ships by that date is a separate scoping pass against this document (see §14).

---

## 1. Summary

Care Companion is an eldercare product with two front doors and one brain.

**The Appointment Companion** listens during a medical consultation (with consent), shows the elder plain-language captions in their own language while the doctor is still speaking, and afterwards produces a large-print summary for the elder plus a structured digest for their adult children.

**The Check-In Call** phones the elder at a cadence she chooses, for a short conversation. It sounds like a welfare call. It also functions as a longitudinal speech-sampling instrument, tracking how a person's speech changes against their own baseline over months.

The two are not separate apps bundled together. The consultation generates the medication list and the things to watch for; the check-in call asks about exactly those things; what the call hears then shapes the next visit summary. Neither half is as useful alone.

**Positioning:** a wellness product. Care Companion surfaces *changes worth mentioning to a doctor*. It never diagnoses, never scores dementia risk, and never advises on treatment.

---

## 2. The problem

Two failures, both ordinary, both expensive.

**The consultation is lost.** An elder attends a fifteen-minute appointment conducted in a language they half-follow, dense with terms nobody defines. They leave holding a prescription and no reliable account of what was said. Their daughter, who cannot take a weekday morning off, receives a garbled version over dinner. Medication changes get missed. Follow-up questions never surface.

**Decline is invisible until it is obvious.** Cognitive and functional decline is gradual, and the people best placed to notice it are precisely the people who see the elder daily and have therefore normalised each small change. The formal system samples the person once or twice a year in an unfamiliar room where they are trying hard. By the time something is flagged, months of intervention window have gone.

The gap between those two is a person who is drifting, in a system that measures them twice a year and a family that cannot see it happening.

---

## 3. Users

### Primary: the recipient
The person who installs the product, configures it, and receives its output. **This is a role, not a relationship.** In practice it is filled by an adult child (typically 35 to 55, working full time, often living separately, carrying the anxiety), by a live-in domestic helper or an employed carer, or by two or three of these at once. They are not looking for another dashboard; they are looking for the answer to "is Mum okay, and what do I need to do?"

**The product does not rank recipients by relationship.** A helper who lives with the elder is usually more present, and better informed, than a son overseas. What each recipient sees is set per person by the elder (§7.2); relationship supplies only the default preset, never a ceiling the elder cannot raise or a floor they cannot lower.

Where this document says "caregiver," it means any authorised recipient. Where the family and employed cases genuinely diverge, it is stated explicitly.

### Primary: the elder
65+, living independently or semi-independently, variable smartphone literacy, often dialect-dominant or multilingual. **They experience the product as a phone call plus one large-print screen, never as an interface to operate.** The call reaches a feature phone or a landline and asks nothing of her but conversation; the app carries her record, and the only two things she does in it are tap once to record a consultation and read what came out. Anything beyond those two acts is a design failure, not a feature.

Her willingness is the product's ceiling: a person who feels surveilled will stop answering. Requiring the app to read her own summary is a real cost against the earlier design, which reached her by message and needed no install, and it is accepted because the app is also what makes the consent tap, the medication photo and the record in one place possible.

### Secondary: the clinician
Not a user in v1. They are a party whose consent is required for capture, and a downstream beneficiary of a patient who arrives with an accurate medication list and prepared questions. Any design that makes their consultation slower will be refused.

### Non-users
Elders with nobody to fill the recipient role at all: no motivated family member, and no live-in or employed carer either. Defining the role by function rather than by relationship shrinks this population, since a helper can now be the recipient where previously only a child counted, but it does not remove it. What remains is the highest-need group there is, and it stays out of scope for a product somebody else has to install and configure. Reaching them requires the institutional channel on the roadmap (§13).

---

## 4. Product principles

1. **Understanding flows to the elder; interpretation flows to the family.** The elder gets clarity about their own health. The family gets situational awareness. Neither gets the other's view by default.
2. **The elder owns their data.** Family access is granted, standing, and revocable at any time by the elder.
3. **Never ask an elder to log anything.** Every input is a conversation or a photo. Any feature requiring daily data entry is rejected by default.
4. **Compare a person to themselves.** Population norms are meaningless for a 78-year-old Teochew-speaking retiree. Every signal is measured against that individual's own baseline.
5. **Say what was observed, not what it means.** "She has paused more than usual this week" is reportable. "She may have MCI" is not.
6. **Interruptions must stay rare to stay credible.** The default rhythm is a weekly digest. An alert that fires often is an alert nobody reads.

---

## 5. Feature 1: Appointment Companion

### 5.1 Mode: record in the room, read it afterwards

**In the room.** The elder's phone lies face-up on the desk and does nothing she has to watch. As the doctor speaks, the agent writes each thing he says down in plain language, in a written language she reads. No earpiece, no whispering over the clinician, no device worn on the body, and nothing she must keep up with while trying to listen to her doctor.

> Doctor: "...your HbA1c is 8.2, so we'll titrate the metformin."
> Written: **Your long-term sugar level is too high. The doctor is increasing your diabetes medicine.**

**Why not put it on screen live.** Live captioning is the commodity half of this problem and it is well served: dedicated medical interpretation apps, human video interpreters on demand in 260+ languages, and Singapore's own hospital-built dialect phrasebook all address the in-room moment. Competing there wins nothing. It also asks an 80-year-old to read and listen at the same time, in the one room where her attention is most contested. The defensible claim is not that she follows along; it is that nothing said in that room is lost when she walks out of it.

**After the visit.** Within minutes:
- **Elder** receives a large-print summary: what the problem is, what changed, what to do, when to return.
- **Recipients** receive a structured digest, each filtered to their own scopes (§7.2): diagnosis in plain language, medication changes, next appointment, what to watch for, suggested follow-up questions.
- **The medication list** is reconciled (§5.3).
- **The check-in agent** receives new watch-fors to ask about.

**Explicitly rejected:** live audio interpretation into an earpiece. It requires an 80-year-old to wear and manage a device, introduces latency the elder must talk over, and fails loudly in exactly the moment it matters. Captions degrade gracefully; a whisper in the ear does not.

### 5.2 Consent and capture

Recording requires **an explicit in-room tap by the elder plus an audible announcement** so the clinician knows capture has begun. If the clinician objects, capture stops and **nothing partial is retained**.

The consent tap is per-appointment and cannot be pre-authorised by any recipient. This matters most in the common case where the person accompanying the elder is an employed carer rather than a family member: physical presence confers no capture authority. The standing access grant (§7) governs who may *see* the output; it never governs whether capture happens.

### 5.3 Medication reconciliation

The medication list is built and maintained three ways, in this order of authority:

| Source | Role |
|---|---|
| Caregiver manual entry | Seeds the list at onboarding |
| Photo of label or packaging | OCR; handles pre-existing prescriptions and mid-course additions |
| Appointment transcript | **Reconciler, not writer** |

The transcript never silently edits the list. It confirms what is already there against what the doctor said, and when it hears something unrecognised it asks: *"The doctor mentioned amlodipine. This isn't on your list. Add it?"* A prescription change heard in the room is a prompt for a human, never an automatic write.

This matters beyond convenience: the medication list is also the **confound register** for Feature 2 (§6.5).

### 5.4 Language

**Dialect support is asymmetric, and the asymmetry is technical rather than chosen.**

Output is generation: the system controls the input text, one clean speaker supplies enough data, and an error degrades gracefully into an odd accent that the elder still understands. Input is recognition: the input space is unbounded, errors are silent, and two further problems apply only here. Hokkien and Teochew have no standard orthography (Tâi-lô, POJ, Han characters and Peng'im all compete), so there is no agreed target for a recogniser to emit. And the data volumes differ by orders of magnitude: text-to-speech needs tens of hours from one voice, recognition needs thousands from many, and the entire public Teochew speech corpus is 18.9 hours.

The asymmetry also matches the real need. The elder must *understand* far more urgently than they must *be understood*. A doctor speaking English can be rendered into Hokkien; the elder's Hokkien reply does not need machine transcription for Feature 1 to work.

**Three tiers, not one bloc.** Grouping the dialects together overstates the problem for Cantonese and understates it for Teochew.

| Tier | Languages | Output (TTS) | Input (ASR) | Feature 2 eligibility |
|---|---|---|---|---|
| **1. Bidirectional** | English, Mandarin, Malay, Tamil, **Cantonese** | Yes | Yes, production quality | Full marker set |
| **2. Input-capable, marker-limited** | **Hokkien** | Yes, Taiwanese-accented voices | Yes, but error rates too high for lexical markers | Acoustic and behavioural markers only |
| **3. Output-only** | **Teochew** | Vendor gap, see Risk 14 | No usable system exists | Acoustic and behavioural markers only, from diarisation without transcription |

Cantonese recognition is a solved commercial problem and belongs on the input list. Hokkien recognition now exists (MERaLiON-3-ASR from A\*STAR covers it natively, as does Alibaba's Qwen3-ASR) but at roughly 46% word error, which is usable for gist and unusable for counting words. Teochew has one research corpus, no recogniser and no commercial voice: it is the only language in the table where even the output half is unresolved.

**Why "some recognition" is not automatically an improvement.** Feature 2's linguistic markers are computed from the transcript, and the primary drift signal is the *variability* between samples (§6.4). Recognition error does not merely weaken those markers, it inflates their variance, which is the exact pattern the product exists to detect. A noisy transcript manufactures drift. This is the same reasoning that forbids imputing a missing sample, and it is why Tier 2 exists at all rather than Hokkien simply being promoted to Tier 1. See §11, Risk 13.

**Consequence that must be stated plainly:** a Hokkien-dominant elder gets the full Appointment Companion and a *reduced* drift model, not a full one. They are not excluded, and they are not equally served. See §11, Risk 1.

**Teochew is worse than the table's "output-only" label suggests, and the shortfall lands on Feature 2 rather than Feature 1.** There is no commercial Teochew voice at all (§14.2), so the output half is unbuilt rather than merely foreign-accented. Feature 1 survives this, because captions are *text*: a Teochew-dominant elder who reads standard Chinese characters is served by the caption surface with no synthesis involved. Feature 2 does not survive it, because the check-in is a voice call and a voice call needs a voice. Until a Teochew voice exists, a Teochew-dominant elder can only be called in whatever second language they hold (usually Mandarin, Hokkien or English), and an elder who holds none cannot be enrolled in Feature 2 at all. This is a **feasibility** gap, not the reduced-marker gap of Risk 1, and the transcript-free marker families of §6.3 do not close it. See §11, Risk 16.

### 5.5 The pre-visit question card

§5.1 carries understanding *into* the elder. This carries the elder's own concerns *into the room*, and it does so with no recognition anywhere in the path, which is why it works in every tier including Teochew.

Before an appointment, the Visit Synthesiser assembles a short card from what the product already holds: the watch-fors from the last visit, recurring content flags from recent check-ins ("knee pain on 12 of the last 14 calls"), and any unresolved medication question. The card is large-print, one question per line, set in the elder's written language alongside English, with each line playable as audio in their spoken language. The elder points, taps, or reads it aloud.

This is deliberately low technology, and it closes part of the be-understood gap that §5.4 otherwise leaves open: the elder's standing concerns reach the doctor without a recogniser ever having to work. Three limits, stated rather than designed around:

- **It assumes literacy in some written language.** Spoken dialect with read standard Chinese is a common pattern in this cohort, but a non-literate elder is served only by the audio playback and by a companion willing to read the line out.
- **It carries nothing live.** The card reflects what the elder said before the visit, not what the doctor says during it. A concern that first arises in the room still has no machine channel, and §5.4's asymmetry is narrowed rather than removed.
- **It must never be handed to the clinician as a checklist to work through.** §3 states that any design making the consultation slower will be refused, and a patient arriving with a printed interrogation is exactly that. This is the elder's aide-memoire, not an agenda imposed on the doctor.

---

## 6. Feature 2: the Check-In Call and drift detection

### 6.1 Mechanic: an outbound voice call, at a cadence she sets

The agent phones the elder at an agreed time. Sixty to ninety seconds. No app to open, no notification to notice, works on a feature phone or a landline: the call is the one part of the product that never requires the app.

The call is the right channel for three reasons: it requires zero technology literacy, it reuses the identical audio-in pipeline as Feature 1, and it is the only mechanic that reliably produces a connected-speech sample without asking her to do anything.

**Cadence is hers, from a range with a floor.** She chooses **daily**, **every other day**, or **three times a week**. Every other day is the default for a new enrolment, because a daily call is a real imposition on someone who did not ask for one, and §10 is explicit that engagement determines whether any signal exists at all. A perfect drift model on an elder who stopped answering is worth nothing.

The floor is three times a week, and it is a floor for two independent reasons.

- **The baseline is counted in samples, not days** (§6.6). Thirty usable samples is thirty usable samples whatever the cadence; below three a week it stops arriving inside a quarter.
- **Cadence bounds how long a stated concern can wait.** The gap between calls is the worst case for hearing something she has not otherwise reported: 24 hours at daily, 48 at every other day, 72 across a weekend at three times a week. §8.2 records that as a cost, not a detail.

Halving the cadence is not free, and the PRD should not pretend otherwise. Dispersion is estimated from the samples, so the relative sampling error on it rises from roughly 13% at thirty samples to roughly 19% at fifteen. That is why the baseline is defined by sample count: the estimate keeps its precision and the calendar stretches instead.

The cadence is enforced in the tool layer, not in a prompt. `set_check_in_cadence` refuses anything outside the three, records who set it in the consent ledger, and returns the resulting worst-case gap so it is stated rather than inferred. A recipient may relay her choice; nobody may quietly make it for her.

### 6.2 Structure of a call

```
09:00  "Auntie Lim ah, morning! Slept okay or not?"
       → open narrative moment          (speech sample)

       "Your morning tablets, taken already?"
       → self-report                    (adherence + answer latency)

       [rotating disguised probe]
       → e.g. recalling yesterday's topic, or describing
         a photo the family sent        (sample standardisation)

       "Okay lah, you take care. Talk tomorrow."
```

**The narrative moment does the heavy lifting.** The largest study on this (n=1003) found that a plain journaling prompt ("describe your past week", around 90 seconds and 186 words) performed on par with the Cookie Theft picture description, the clinical gold standard. An ordinary conversation, if it elicits connected narrative, is already a valid sample.

**The rotating probe exists only to stabilise comparability**, since free conversation varies in topic and therefore in vocabulary. It must never read as a test. Structured reading tasks are explicitly excluded: fluency on a reading task is confounded by education level and eyesight, both of which vary enormously in this population.

**Medication is asked, never logged.** The signal is not ground-truth adherence, it is the shape of the answer over time. Forty days of "yes, at nine" followed by "I think so?" at eleven is the finding. Hesitation and timing drift are the data.

### 6.3 What is measured

From each call's transcript and audio:

**Linguistic:** moving-average type-token ratio, unique words in the first 50, noun frequency, propositional density, determiner ratio, adverb ratio. *Requires a transcript.*

**Acoustic:** speech rate, articulation rate, fraction of time spent pausing. *Requires voice-activity detection and diarisation, not word recognition.*

**Behavioural:** answer latency, call answered or not, call duration. *Requires neither.*

**The split is load-bearing.** Two of the three families are language-independent: they measure the shape and timing of speech rather than its content, so they work identically for a Teochew speaker and an English one. This is what makes the Tier 2 and Tier 3 reduced models of §5.4 possible instead of a flat exclusion. The trade must be stated: the published performance the product leans on (language domain ROC-AUC ~0.81) comes largely from lexical features, so an acoustic-and-behavioural-only model is a weaker instrument. It gets a longer baseline before any flag is permitted, and the digest says which model an elder is on.

**The split has a floor.** Every marker family, including the two needing no transcript, presupposes that a call happened and the elder spoke. That in turn presupposes an agent voice the elder understands, which Teochew does not currently have (§5.4). Transcript-free markers make a *reduced* model possible; they do not make a *voiceless* one possible.

**Marker eligibility is measured, not declared.** Whether an elder's lexical markers are computed is gated on the recognition confidence observed during *that elder's* baseline period, not on the language they were assigned at onboarding. A Mandarin speaker in a noisy flat can fail the gate; a clearly-recorded Hokkien speaker could one day pass it. A failed gate disables the linguistic family for that elder and says so, rather than feeding a noisy transcript into a variance model.

**Code-switching policy:** the system detects the elder's dominant language at onboarding and **analyses only segments in that language**, discarding the rest. Singapore elders mix English, Mandarin and dialect within single sentences, and lexical-diversity metrics are meaningless across a mixed sample. This is a deliberate trade: it discards data and works less well for the most multilingual users, in exchange for markers that mean something. (Per-language modelling and switch-rate-as-signal are on the roadmap, §13.)

### 6.4 The drift model

Three things are watched, in descending order of how early they appear:

**1. Rising inconsistency between samples (primary).** Widening dispersion against the personal baseline. Intraindividual variability research shows dispersion is elevated *before* mean-level decline, and was already raised at baseline in people who converted from MCI to Alzheimer's within twelve months. A person having good days and bad days is an earlier signal than a slowly sinking average. Repeated sampling at her chosen cadence is what makes this measurable, and it is what a twice-yearly clinic visit structurally cannot see. Note the cost of a slower cadence lands precisely here: fewer samples widen the error on the dispersion estimate itself (§6.1), which is why the baseline is counted in samples and the calendar is allowed to stretch instead.

**2. Sustained trend.** The slow slope in speech rate, lexical diversity and pause fraction against personal baseline. Later than variability, but far easier to explain to a family.

**3. Content flags.** What the agent literally heard: skipped meals, recurring pain, not leaving the house, low mood, poor sleep. Needs no baseline and no statistics, and is immediately intelligible.

**Step-change and acute-event detection is out of scope for v1.**

### 6.5 Confounds

The following move exactly these markers and must be registered before any flag is raised:

- **Newly prescribed sedating medication** (the largest single confounder, and available free from the reconciled med list)
- Acute illness, particularly respiratory infection
- Dental work or new dentures
- Poor sleep, low mood, bereavement
- Hearing-aid failure, which looks like comprehension loss
- Environmental noise, which corrupts acoustic features

**No flag may be raised without checking the medication list for a recent change.** This is a hard requirement, and it is a second structural reason the two features belong in one product.

### 6.6 Cold start

The statistical model produces nothing useful until **30 usable samples** exist. How long that takes depends on the cadence she chose: about a month at daily, about two at every other day, about ten weeks at three times a week. This is not hidden, and the elapsed figure quoted to a caregiver is the one for her actual cadence, never the best case.

- **Week 1 onward:** content flags are reported. "She has mentioned knee pain three days running" needs no baseline and is genuinely useful.
- **Day 30+:** baseline matures and trend and variability reporting switch on.
- The caregiver is told at onboarding, explicitly, that the monitoring half takes a month to become meaningful. Under-promising here protects trust in every later alert.

Accelerated onboarding (denser early calls) is rejected: it front-loads burden onto the user least likely to tolerate it, at exactly the point the habit has not formed and drop-off risk is highest. That is also why there is no daily-then-taper default. If she wants a faster baseline she may choose daily herself, and the trade is stated to her rather than made for her.

### 6.7 Missing data

A call with no usable sample is recorded as **missing and never imputed.** Imputation would smooth exactly the variance that constitutes the primary signal.

An unanswered call is itself recorded as a behavioural signal, subject to a retry policy, escalating to a no-contact notification to the caregiver after a configured number of consecutive missed calls.

A slower cadence makes each miss cost more. At daily, a missed call retries tomorrow; at every other day the gap becomes four days, and at three times a week it can reach a week. Since the gap cannot be filled in, the no-contact escalation is counted in **consecutive missed calls rather than elapsed days**, so it fires at the same point for every elder regardless of cadence.

---

## 7. Consent, privacy and data

### 7.1 Consent model: layered

| Layer | Who consents | Granularity | Revocable |
|---|---|---|---|
| Product enrolment | Elder | Once, at onboarding | Yes, anytime |
| Recipient access grant | Elder | Standing, **per person and per scope** (§7.2) | Yes, anytime |
| Appointment capture | Elder, in the room | Per appointment | N/A, per-instance |
| Clinician awareness | Audible announcement | Per appointment | Clinician may refuse; capture stops |

The elder owns the data. Every recipient, family or employed, holds a **standing, revocable grant**, not ownership. Revocation is available through the check-in call itself, not only through the app, so that an elder who cannot navigate a phone interface can still withdraw. This matters more now that her record lives in the app: the one route out must not require the surface she may be least able to operate.

**Grants terminate cleanly, and the record of them does not.** An employed carer leaves the household; a daughter does not, which is why a family-only model never forced this to be designed. On termination, access ends immediately, any cached digest content is invalidated at next open, and **that person's historical access log is retained and stays visible to the elder**. Who read what, and when, survives the end of the relationship.

### 7.2 What each recipient sees: five scopes

Access is granted per person, one scope at a time. There is no family tier and no external tier.

| Scope | Contents | Default |
|---|---|---|
| **Appointment summary** | Structured digest, action items, medication changes | On for all recipients |
| **Content flags** | What the agent literally heard: pain, appetite, sleep, mood (§6.4) | On for all recipients |
| **Acute notification** | Immediate notification with evidence attached (§8.4) | On for all recipients |
| **Drift digest** | Weekly variability and trend reporting against personal baseline | On for family, off for employed carers |
| **Verbatim transcript** | The raw record of a call or a consultation | Off for everyone; on request, per item |

Every verbatim access is logged and visible to the elder. A recipient may read the raw record; the elder can always see that they did.

**The default column is a starting configuration, not a policy.** The elder may switch any scope on or off for any person, and the two defaults that differ by relationship are conveniences, not judgments. The product refuses to encode a rule that a relative is inherently more trusted than a paid carer, for two reasons. The carer who lives with the elder is frequently the better-informed party and the one able to act. And elder financial and physical abuse is disproportionately committed by family members, so a hardcoded family-only tier can route a concern directly to its own subject.

This is the same principle as §8.3. The system forwards to whoever the elder authorised, and it grades the recipient no more than it grades the complaint.

### 7.3 Data residency

All identifiable health data is pinned to the **Singapore region**, with no cross-border transfer. PDPA-aligned retention with defined deletion, and full export and erasure on request. Audio is retained only as long as needed to extract features and generate summaries; the derived feature series, which is far less sensitive than raw clinical audio, is what persists.

This is a product requirement, not an infrastructure detail. It is the first question any institutional buyer will ask, and it is the most obvious line of attack on a product built on a China-headquartered cloud.

---

## 8. Alerting

### 8.1 Alert map

| Event | Channel | Timing |
|---|---|---|
| Appointment summary | Push and email | Within minutes of the visit |
| Routine drift and content reporting | Weekly digest | Fixed weekly slot |
| Sustained or severe threshold breach | Direct notification | Same day |
| Consecutive missed calls | Direct notification | After configured threshold |
| Acute concern heard on a call | Direct notification to **every recipient holding the acute scope**, with context (§8.4) | Immediate |

**Alarm fatigue is the failure mode that kills this category.** The weekly digest is the trained rhythm; interruption is rare by design so that it retains meaning. No single-day deviation may trigger an alert.

### 8.2 Acute events: caregiver notification only

When the agent hears something acutely concerning (chest pain, a fall, marked confusion, self-harm ideation), it notifies the caregiver immediately and takes **no in-call action**: it does not assess, does not advise, does not direct the elder to emergency services. It does not ask follow-up questions to establish severity, because onset, duration and radiation are triage fields and asking them is triage.

This is a deliberate decision to bound liability, and it carries a real cost: an elder who describes chest pain at 09:00 receives a warm goodbye while their daughter's phone buzzes. It is recorded as Risk 5 (§11) and should be revisited before any real-world deployment.

**Cadence makes that cost larger, and it is stated here rather than left in the statistics.** The acute channel needs no baseline, so it works from the first call, but the gap between calls bounds how long something she has not otherwise reported can go unheard: 24 hours at daily, 48 at every other day, and up to 72 across a weekend at three times a week. Nothing in the product reduces that gap, and no chosen cadence is treated as clinically adequate coverage. This is a welfare call that samples speech, not a monitoring service, and a slower cadence makes the distinction more important rather than less.

**The notification reaches every recipient holding the acute scope at once, with no primary and no routing order.** Whoever can act is whoever is physically nearest, the product has no way to know who that is, and it has no business modelling it. Choosing one recipient to notify first is the same failure as suppressing an alert: it inserts a judgment between what was heard and the people entitled to hear it.

### 8.3 The system never grades the complaint

Elders vary enormously in how they report. Some describe minor discomfort in dramatic terms every day; others describe a genuine cardiac event as indigestion. The obvious response is to build triage: score the complaint against the person's own history of complaining and interrupt the family only for the ones that look real. **This product does not do that**, for three reasons.

1. **Triage is a clinical function.** A documented decision *not* to alert is a worse exposure than the escalation gap it would close. Today the product forwards and never judges, and liability sits where it belongs.
2. **The dangerous direction is under-reporting, not exaggeration.** Atypical and understated presentation is well documented in older patients, and any model tuned to damp the exaggerator damps the stoic with it.
3. **Habituation must never be able to mute a real event.** A per-elder threshold that learns "she always says her chest is tight" is a mechanism for missing the one day it matters.

The governing rule is **monotone escalation only**. Any signal may raise an event's urgency. No signal may lower it. Nothing heard is withheld, downgraded out of caregiver visibility, or silently dropped.

### 8.4 Context is attached as evidence, never used as a gate

The answer to alert fatigue on acute mentions is not fewer alerts, it is alerts a caregiver can resolve in seconds. Every acute notification carries:

- **The clip.** Roughly twenty seconds of the elder's own audio around the mention. A daughter who hears her mother's voice knows more in one listen than any score could tell her.
- **The verbatim quote**, in the language it was said in, with translation.
- **Frequency and novelty, as plain counts.** "Mentioned knee pain on 12 of the last 14 calls." "First mention of chest in 94 days of calls." Counts only, with no interpretation attached.
- **Functional consequences the elder volunteered**, if any: did not go downstairs, did not finish lunch, could not sleep from it. Elders offer these unprompted, and they carry more information than intensity adjectives do.
- **Voice disturbance, when present** (§8.5).

None of this changes whether the notification is sent. It changes how fast the caregiver can decide. A caregiver who sees "twelfth day running" discounts it in three seconds and stays subscribed to the channel; a caregiver who sees "first ever mention" acts. The discrimination happens in the human, which is the only place it is safe to happen.

### 8.5 Acute voice signals, raise-only

This is separate from the drift model. Drift (§6.4) is between-day, baseline-relative and needs 30+ days to mature, and it explicitly excludes step-change detection. This is within-call, same-day, and available from the first call. It is a second read of the same feature stream: §6.5 lists acute illness as a confound to be *discarded* from drift, and here that same disturbance is the signal.

Watched inside a single call: breath-group length as a proxy for breathlessness, phonation strain, cough and wheeze events, a same-day collapse in speech rate or spike in answer latency against personal baseline, and articulation breakdown.

Two properties matter.

**It needs no transcript**, so it reaches Tier 2 and Tier 3 elders on the same argument as §6.3. **And it can only raise.** A worrying mention delivered in a completely unchanged voice is still forwarded, unchanged, with no note that the voice sounded normal. Telling a caregiver "she sounded fine" invites them to discount an event the product has no standing to grade.

The case this exists for is the elder who says "just a bit of indigestion" in a strained, breathless voice. That mention would not trip a phrase list at all. Voice disturbance can promote it to an immediate notification: escalation gained without ever grading anyone as an exaggerator.

### 8.6 What is deliberately not built

- No severity score, triage level or confidence rating, shown to anyone.
- No suppression rule, and no per-elder threshold that mutes a complaint for being habitual.
- No assessment, no advice, no emergency-services integration (§12).
- No "probably nothing" language anywhere in the product surface.

---

## 9. System design

### 9.1 Architecture

Two capture surfaces, one longitudinal store, one caregiver view.

```
CAPTURE            UNDERSTANDING           LONGITUDINAL        DELIVERY
─────────          ─────────────           ────────────        ────────
Appointment  ──┐   Live Simplifier      ┐
Capture        ├──►Visit Synthesiser    ├──► Signal Store ──► Caregiver
Check-In     ──┘   Marker Extractor     │    Baseline Engine   Console
Caller             Content Flag Engine  ┘    Confound Register  Digest
                                                                Elder App
                        ▲                          │
                        └──── watch-fors, ─────────┘
                              med list

                   Consent Ledger  ·  SG residency  ·  Retention
                        (governs every path above)
```

### 9.2 Components

| Component | Responsibility | Depends on |
|---|---|---|
| **Appointment Capture** | Consent gate, in-room audio stream, capture lifecycle | Consent Ledger |
| **Check-In Caller** | Scheduling, telephony, call script, retry policy | Signal Store (watch-fors) |
| **Live Simplifier** | Streaming ASR, jargon detection, plain-language rewrite, caption and dialect TTS output | Appointment Capture |
| **Visit Synthesiser** | Pre-visit question card (§5.5); post-visit summary, action items, med reconciliation prompts, watch-for generation | Transcript, Med List, Signal Store |
| **Marker Extractor** | Language segmentation, then the nine linguistic and acoustic features | Call transcript and audio |
| **Content Flag Engine** | Extracts stated concerns from call content; no baseline required | Call transcript |
| **Baseline Engine** | Rolling personal baseline over the last 30 usable samples, not 30 days; dispersion and trend; threshold logic | Marker Extractor, Confound Register |
| **Confound Register** | Recent med changes, illness, reported disruptions; gates all flags | Med List, call content |
| **Signal Store** | Per-elder longitudinal record: markers, flags, med list, watch-fors, consent state | none |
| **Caregiver Console** | Web app: digest, alerts, transcripts on request, configuration. Every view is filtered to the viewing recipient's scopes (§7.2) | Signal Store, Consent Ledger |
| **Elder App** | Consent tap and in-room capture; large-print summaries; med list and medication photo; revocation | Signal Store, Consent Ledger |
| **Consent Ledger** | Who consented to what and when; per-person scope grants; revocation and termination; access logging | none |

### 9.3 Data flow: an appointment

1. **Before the visit:** the Visit Synthesiser assembles the pre-visit question card (§5.5) from watch-fors, recent content flags and any unresolved medication question.
2. Elder taps to record; audible announcement plays; Consent Ledger writes the event.
3. Audio streams to the Live Simplifier; captions render in the elder's language ~2s behind.
4. On stop: transcript finalised; Visit Synthesiser produces elder summary, recipient digest and watch-fors.
5. Med reconciliation prompts surface anything the doctor said that is not on the list; a human confirms.
6. Watch-fors and any med change write to the Signal Store; the med change also writes to the Confound Register.
7. Her summary is written to her record and appears in her app; each recipient's digest is delivered filtered to their scopes (§7.2). Writing the summary is not a claim that she has read it, and no surface may say otherwise.

### 9.4 Data flow: a check-in call

1. Scheduler triggers the Check-In Caller, which pulls current watch-fors and med list.
2. Call runs: narrative moment, med confirmation, rotating probe.
3. Transcript and audio go to the Marker Extractor (dominant-language segments only) and the Content Flag Engine.
4. Markers append to the Signal Store; the Baseline Engine updates dispersion and trend.
5. Any candidate flag is checked against the Confound Register before it may be raised.
6. Surviving flags route to the weekly digest, or interrupt if the threshold is breached.

### 9.5 Failure handling

| Failure | Behaviour |
|---|---|
| Clinician objects to recording | Capture stops; nothing partial retained |
| Room too noisy for reliable live ASR | Captions degrade to "listening, summary after" rather than showing wrong text |
| Live pipeline fails mid-consult | Fall back to recording only; post-hoc summary still produced |
| Call unanswered | Retry per policy; record as behavioural signal; escalate after N consecutive days |
| Sample too short or unusable | Day marked missing; **never imputed** |
| Baseline immature | Content flags only; statistical reporting suppressed and labelled as such |
| Confound present | Flag suppressed and logged with its reason, so it can be audited later |
| No agent voice exists in the elder's only language | Feature 2 enrolment is refused at onboarding with the reason stated; Feature 1 is still offered in full |
| A recipient's grant is revoked or terminated | Access ends immediately; cached content invalidated at next open; their access log retained and still visible to the elder |
| Elder revokes consent | Capture and calls stop; all recipient access ends; data retained per policy until erasure is requested |

---

## 10. Success metrics

### Engagement and retention: the metrics that determine whether any signal exists at all
- Call answer rate (target: >80% by week 4)
- Days with a usable speech sample (target: >70% of enrolled days)
- 90-day retention of the elder, not the caregiver
- Median time to baseline maturity
- Share of appointments where capture was attempted and completed

### Caregiver outcomes: the metrics closest to the actual value
- Self-reported caregiver anxiety and burden, measured before and at 90 days
- Share of appointments where the family understood the outcome without needing to ask the elder
- Number of actions taken as a result of a digest or alert
- Weekly digest open rate, and alert dismissal rate as an alarm-fatigue proxy

**Explicitly not a v1 metric:** sensitivity and specificity against a reference cognitive assessment. Claiming detection performance requires a validation study, and the product does not make that claim (§13).

---

## 11. Risks

| # | Risk | Severity | Mitigation / position |
|---|---|---|---|
| 1 | **Dialect-dominant elders get a weaker drift model.** Hokkien and Teochew speakers are limited to the acoustic and behavioural marker families (§5.4, §6.3). | Medium | Downgraded from High: the three-tier split moves Cantonese to full coverage, and transcript-free markers keep Tiers 2 and 3 monitored rather than excluded. Stated openly as product segmentation, and the digest names which model the elder is on. Teochew carries a second and more serious problem this risk does not cover: see Risk 16. |
| 2 | **Speech markers do not measure memory.** Published performance is decent for the language domain (ROC-AUC ~0.81) and weak for executive function; for memory and processing speed it is near zero (R² 0.04–0.07). | High | The product only ever claims changes in *how someone speaks*. Never "memory decline". This is why the wellness positioning is load-bearing rather than cosmetic. |
| 3 | **Clinicians refuse to be recorded.** The flagship feature depends on a third party's cooperation in their own consultation room. | High | Audible announcement, per-visit consent, graceful stop. Needs field validation with real clinicians early; if refusal rates are high, the product's centre of gravity shifts to Feature 2. |
| 4 | **False positives and alarm fatigue.** A family that learns to ignore alerts is worse off than one with no product. | High | Weekly digest as the default rhythm; no single-day alerts; mandatory confound check before any flag. On the acute channel the answer is deliberately *not* fewer alerts (§8.3) but alerts a caregiver can resolve in seconds from clip, quote and counts (§8.4). |
| 5 | **Escalation gap.** Caregiver-notification-only means an elder describing chest pain receives no in-call response. | High | Accepted deliberately to bound liability, and narrowed rather than closed. §8.4 makes each notification act-on-able in seconds, and §8.5 lets voice disturbance promote an understated complaint that a phrase list would miss entirely. The in-call gap itself is unchanged and **should still be revisited before any real deployment**: the position is defensible for a wellness product and uncomfortable in a genuine emergency. |
| 6 | **Cold start.** No statistical output for 30+ days; a caregiver may churn before the product's core value appears. | Medium | Content flags carry weeks 1–4; the Appointment Companion delivers on day one; expectations set explicitly at onboarding. |
| 7 | **Prior art.** Naver's CLOVA CareCall is a deployed AI care-call service with published trial results; inTouch and CareYaya QuikTok are commercial equivalents. "AI phones the elder" is not novel. | Medium | Differentiation rests on three things none of them have: appointment linkage, dialect coverage, and variability-based drift modelling. |
| 8 | **Health data on a China-headquartered cloud.** | Medium | Singapore residency committed in §7.3, no cross-border transfer, stated as a product requirement. |
| 9 | **Confounding produces false drift.** Sedating medication, illness, dental work and bereavement all move the same markers. | Medium | Confound Register gates every flag; the reconciled med list supplies the largest confounder automatically. |
| 10 | **No motivated recipient means no user.** A product somebody else must install and configure structurally cannot reach isolated elders, who are the highest-need population. | Medium | Narrowed slightly by §3: the recipient is a role rather than a relationship, so a live-in helper can fill it where previously only an adult child counted. The residue is acknowledged as a v1 limitation. The institutional channel (§13) is the answer, and it requires partnerships. |
| 11 | **Consent withdrawal breaks the longitudinal record.** A gap of weeks invalidates the baseline. | Low | Baseline re-establishment logic; gaps surfaced honestly in the digest rather than smoothed over. |
| 12 | **Telephony cost scales linearly** with one call per elder per day. | Low | A unit-economics problem for the business model, out of scope for this PRD. Recognition itself is not the cost driver: at Qwen3-ASR-Flash rates a 90-second call costs around US$0.003. |
| 13 | **Noisy recognition manufactures false drift.** Word error inflates the variance of lexical markers, and rising variance *is* the primary signal. A marginal dialect recogniser would produce exactly the pattern the product looks for. | High | Marker eligibility is gated on measured per-elder recognition confidence (§6.3), not on a language label. This is the same principle as the ban on imputing missing samples: a degraded input is dropped, never smoothed in. |
| 14 | **Dialect TTS voices are foreign-accented.** The available Hokkien voices are Taiwanese Hokkien; Singapore Hokkien carries Malay and English loanwords and different intonation. Teochew has no commercial voice at all. | Medium | Accepted for Hokkien with user testing, since comprehension survives accent difference. Teochew output requires either a voice-cloning engagement with a local speaker or honest exclusion. §14.2. |
| 15 | **The habitual complainer generates recurring acute alerts that are never suppressed.** Refusing to grade complaints (§8.3) means an elder who reports pain on every call produces a notification every call, and the caregiver may disengage from the acute channel. | Medium | Accepted as the lesser of two failures: the alternative is a learned threshold that mutes the one day it matters. Mitigated by evidence rather than volume (§8.4), where the frequency counts make a habitual mention cheap to dismiss. Alert volume per elder is a pilot metric. |
| 16 | **A Teochew-dominant elder with no second language cannot be enrolled in the check-in call at all.** There is no commercial Teochew voice, so the outbound call has no language to speak in (§5.4, §14.2). This is a feasibility gap, distinct from the reduced-marker gap of Risk 1. | High | Feature 1 is unaffected, because captions are text rather than synthesis, so the Appointment Companion still serves these elders fully. Feature 2 enrolment is refused explicitly at onboarding with the reason given, rather than silently degraded. The route out is a voice-cloning engagement with a local speaker, or the contributed corpus (§13), and neither is near. |
| 17 | **Scope misconfiguration routes a sensitive finding to the wrong person.** Per-person scopes (§7.2) place the configuration in the elder's hands, and an elder may grant broadly without following the consequence. | Medium | The two scopes carrying the most exposure, drift digest and verbatim transcript, default conservatively. Scope changes are confirmed back to the elder through the check-in call, not only in the app. The alternative, a hardcoded family-versus-carer tier, was rejected on principle: it misjudges in both directions and can route an abuse-related concern to its own subject (§7.2). |

---

## 12. Out of scope for v1

- Wearables and health-app integration (Fitbit, Apple Health, Health Connect)
- Passive smartphone sensing: keystroke timing, mobility and life-space patterns
- Step-change and acute-event detection as a modelled signal
- Emergency-services integration or monitoring-centre escalation
- HealthHub / NEHR integration
- Clinician-facing product surface
- Lexical markers for Tier 2 and Tier 3 languages (Hokkien, Teochew)
- Teochew speech recognition of any kind
- Live machine transcription of the *elder's* speech during a consultation. The pre-visit card (§5.5) is the partial substitute, and it is deliberately a partial one
- A family-versus-external-carer permission tier, rejected on principle (§7.2)
- Contributed-corpus collection (§13) and any secondary use of recorded speech
- Business model and pricing (deliberately excluded from this document)

---

## 13. Roadmap

### 13.1 The native app

Four surfaces, all specified and none built at the time of writing. They are grouped because they share one justification: each is a thing the current build either fakes or cannot reach, and each becomes honest only on a device.

**Consent-gated in-room capture.** This is the one that closes a real gap rather than adding a feature. §5.2 requires an explicit tap by the elder plus an audible announcement, and the shipped tool takes both as arguments the agent asserts. A device makes the tap the actual event. It also makes "if the clinician objects, capture stops and nothing partial is retained" a real deletion path rather than a sentence. Native rather than web because browser audio capture is suspended when the screen locks or the tab backgrounds, and her phone lies face-up on a desk for a fifteen-minute consultation.

**Her record, in large print.** The consultation summary is written to her record by `publish_elder_summary` and the app is what shows it to her. Two acts only: read it, and nothing else. Note the cost this replaced: an earlier build sent her a link by WhatsApp or SMS, which needed no install and reached a feature phone. Requiring the app is a deliberate trade against §3, not an improvement to it.

**Placing the check-in call.** The call itself stays telephony and must keep working on a feature phone or a landline (§6.1), because that is the half of the product that asks nothing of her. The app adds a way to place or take it, never a requirement to.

**Medication photo.** §5.3 already ranks a photo of the label as the second source of authority, above the transcript, and this is where it lands. It covers exactly the case the shipped build surfaces and cannot resolve: the consultation names a medicine the list does not have. **The OCR path takes the same gate as the transcript.** A photo may propose; only a named human may confirm. The medication list is the confound register that gates every drift flag (§6.5), so a model writing to it unattended would silently move the thing that decides whether flags fire.

### 13.2 The care chatbot

Conversational access to her own record, for her and for a caregiver she has authorised. It is listed separately because it is the only roadmap item that can breach three existing invariants in a single answer, and the constraints are therefore part of the specification rather than an implementation detail.

- **Scope-filtered retrieval, not a filtered prompt.** A recipient may only retrieve what their scopes permit (§7.2). A caregiver holding `appointment_summary` alone must not obtain drift information conversationally. The elder may grant a caregiver more, and only she may.
- **Every verbatim read is logged and visible to her.** §7.2 promises she can always see who read what. A chatbot that reads transcripts without logging breaks that promise quietly, which is the worst way to break it.
- **Clinical questions are refused, in the tool layer.** "Is this knee pain serious?" and "should I take more metformin?" are §8.3 and §8.2 respectively. The refusal cannot live in a system prompt, because generation is the interface and the interface is the thing being asked to hold the line.
- **Inference stays in-region.** §7.3 pins identifiable health data to Singapore, and a general-purpose endpoint elsewhere would break a claim that is currently clean.

### 13.3 Everything else

**Near.** Wearable enhancer tier. Fitbit first, because its Web API is the only one of the three reachable from a web backend via server-side OAuth; Apple HealthKit and Android Health Connect both require native apps. Gait speed and walking steadiness are among the best-validated passive predictors of frailty and cognitive decline that exist, and they cost the user no effort. Wearables must remain an enhancer and never a requirement: watch adoption in the 75+ bracket is low, and remembering to charge a watch is itself a compliance task that the exact user being monitored will fail.

**Near.** Per-language marker modelling and code-switch rate as a candidate signal. Loss of language control is a documented marker in bilingual dementia, and Singapore's multilingual elders are an unusually good population in which to study it.

**Medium.** Institutional channel: senior activity centres, AIC-funded providers, hospital discharge programmes. This is how the product reaches elders with no motivated family member.

**Medium.** Promote Hokkien from Tier 2 to Tier 1 by closing the word-error gap. The bottleneck is Singapore Hokkien specifically: the available models are trained on Taiwanese Hokkien, and Singapore Hokkien differs in vocabulary and loanwords. Fine-tuning an open recogniser (MERaLiON-3-3B-ASR or Qwen3-ASR-1.7B, both open-weights) on local data is the route.

**Medium.** **The contributed corpus, and it is the answer to the previous item.** The scarce asset in this whole problem is longitudinal Singapore Hokkien and Teochew speech from elderly speakers, and the product manufactures precisely that as a by-product: a hundred elders at ninety seconds a call generate two and a half hours per round of calls, so roughly nine hours a week at the default every-other-day cadence, against a public Teochew corpus that totals 18.9 hours. Separately opt-in, separately consented, de-identified, never bundled into the Feature 2 consent, and refusable without losing the product. This is both the technical unlock for Tiers 2 and 3 and a genuine public good, since the resulting resource does not currently exist for any Singapore dialect.

**Long.** Teochew recognition. Requires the corpus above to exist first; there is no vendor path.

**Long.** Clinical validation study against reference cognitive assessment, and the regulated pathway if and only if the evidence supports it. Until then the product stays non-diagnostic.

---

## 14. Open items

1. **Hackathon scope.** This document does not define the 9 Aug 2026 submission. That requires a separate pass selecting a demonstrable slice.
2. **Dialect TTS vendor.** Partially resolved. Cantonese synthesis is available from every major provider. Hokkien synthesis has real commercial vendors, all Taiwanese: ATEN 優聲學 (cloud and offline, API and SDK), Taigi AI Labs (API by enquiry), and 意傳科技's SuiSiann tool with the open-source 臺灣言語工具 behind it. Pricing for all three is quote-based, not published, so commercial terms remain unverified. **Teochew synthesis has no vendor**, which is the live gap. Remaining questions: quoted pricing, whether any vendor will voice-clone a Singapore Hokkien or Teochew speaker, and whether Tencent Cloud's own TTS covers Cantonese well enough to keep Tier 1 on one stack.
3. **Telephony provider and Singapore number provisioning.** Unresolved.
4. **Clinician acceptance rate.** Unknown, and Risk 3 depends entirely on it. Needs field contact, not desk research.
5. **Threshold calibration.** What magnitude of dispersion increase warrants interrupting a family is currently undefined and cannot be set from the literature alone.
6. **Team.** Not yet formed.
7. **Recognition vendor for Tiers 1 and 2.** Three candidates, none yet tested on real elderly Singapore speech: MERaLiON-3-ASR (A\*STAR, Singapore-native, covers Singlish plus Cantonese and Hokkien, open weights and a hosted API), Qwen3-ASR-Flash (Alibaba, commercial, covers Minnan and Cantonese, roughly US$0.13 per audio hour), and Tencent Cloud's own ASR. The choice interacts with the §7.3 data-residency commitment and with whichever stack the hackathon submission requires.
8. **Confidence-gate threshold.** §6.3 gates lexical markers on measured recognition confidence, but the threshold that separates "usable transcript" from "variance-inflating noise" is undefined and cannot be set without pilot audio. Related to item 5.
9. **The acute mention set, and the voice-disturbance trigger.** §8.2 lists chest pain, falls, marked confusion and self-harm ideation as illustrative, but the actual set of mentions that warrant an immediate notification is undefined, and it has to be defined in all five Tier 1 languages, where the idiom for pain and distress differs. Separately, §8.5 promotes an understated mention on voice disturbance alone, and the magnitude of disturbance that justifies promotion cannot be set without pilot audio. Both are false-negative-sensitive and should be set generously. Related to items 5 and 8.
10. **Does the pre-visit question card actually get used?** §5.5 assumes an elder will hold up, tap or read out a card in a consultation room. That is a behavioural assumption rather than a technical one, and it is the kind that fails quietly: the card gets left in the bag and nobody reports it. Needs testing with real elders before the feature is built, and it interacts with item 4.
11. **Default scope presets.** §7.2 sets a starting configuration per recipient, and the only two defaults that vary by relationship are the drift digest and the verbatim transcript. Those were chosen by reasoning, not evidence, and should be checked with families who actually employ a carer, and with carers themselves.
12. **Teochew voice.** Item 2 records that no vendor exists. Risk 16 records what that costs: no check-in call at all for a Teochew-monolingual elder. Whether to pursue a voice-cloning engagement with a local speaker, or to state the exclusion permanently, is undecided.

---

## Appendix A: Evidence base

| Claim | Source |
|---|---|
| Naturalistic journaling prompt performs on par with Cookie Theft; feature list; domain-specific performance ceilings (language R² 0.27–0.29, ROC-AUC 0.81; memory R² 0.04–0.07) | [Towards a speech-based digital biomarker for cognitive impairment, *npj Digital Medicine*](https://pmc.ncbi.nlm.nih.gov/articles/PMC12917134/) |
| Spontaneous speech preferred over structured reading tasks; reading confounded by education and visual impairment | [Automatic Spontaneous Speech Analysis for the Detection of Cognitive Functional Decline in Older Adults, *JMIR Aging*](https://aging.jmir.org/2024/1/e50537) |
| Intraindividual variability elevated before mean-level decline; raised at baseline in MCI-to-AD converters within 12 months | [Within-Individual Variability: An Index for Subtle Change in Neurocognition in MCI](https://ncbi.nlm.nih.gov/pmc/articles/PMC5238959) · [Intraindividual variability is related to cognitive change in older adults](https://pubmed.ncbi.nlm.nih.gov/20853965/) |
| Older adults' acceptability of passive monitoring: 13/17 raised privacy concerns; 11/17 wanted baselines longer than a month; confounds raised included arthritis and injury | [Older adults' views of passive smartphone monitoring for dementia risk, *Innovation in Aging*](https://academic.oup.com/innovateage/article/10/6/igag034/8572640) |
| Prior art: deployed LLM care-call service with trial results in people with dementia | [Beneficial effect of artificial intelligence care call on memory and depression, *Scientific Reports* 2025](https://www.nature.com/articles/s41598-025-12895-7) |
| Passive smartphone biomarkers: keystroke flight time, mobility and life-space patterns (roadmap only) | [Passive Smartphone Sensing Reveals Gait and Typing Biomarkers of Cognitive Impairment](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12784374/) · [Mobility-Based Smartphone Digital Phenotypes, *JMIR Human Factors*](https://humanfactors.jmir.org/2024/1/e59974) |
| Hokkien and Cantonese recognition exists in a Singapore-built model; Hokkien 46.5% average WER (22.6% best subset, 58.6% worst), Cantonese 11.3% average; open weights plus hosted API | [MERaLiON-3-3B-ASR, A\*STAR I²R](https://huggingface.co/MERaLiON/MERaLiON-3-3B-ASR) · [MERaLiON API console](https://meralion.org/) |
| Commercial recognition covering Minnan and Cantonese at US$0.000035 per second of audio | [Qwen3-ASR-Flash](https://openrouter.ai/qwen/qwen3-asr-flash-2026-02-10) · [Qwen3-ASR open weights](https://github.com/QwenLM/Qwen3-ASR) |
| Taiwanese Hokkien recognition at 30.1% average CER by transcribing to Mandarin characters; CC-BY-4.0 | [Breeze Taigi, MediaTek Research](https://arxiv.org/abs/2603.19259) · [Breeze-ASR-26](https://huggingface.co/MediaTek-Research/Breeze-ASR-26) |
| Entire public Teochew speech corpus is 18.9 hours from 20 speakers, first released 2025 | [Teochew-Wild](https://arxiv.org/abs/2505.05056) |
| Commercial Taiwanese Hokkien text-to-speech vendors with API access | [ATEN 優聲學](https://www.aivoice.com.tw/) · [Taigi AI Labs](https://ailabs.jp/nan-TW/taiwanese-tts) · [意傳科技 SuiSiann](https://suisiann.ithuan.tw/) |

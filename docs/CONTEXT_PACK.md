# The context pack

**What it is.** The short text Bayani reads to answer one question, built from a group's BIX records. Training,
testing and the app all build it with the same code (`src/pack.ts`), so the model sees in use exactly what it saw in
training. Decided 2026-11-14.

## Rules

1. **Only what the person can see.** The pack is built from the records the person using Bayani may open, using
   Bayanihan Core's `authorize` (BIX rule 26). A volunteer's pack has no Practice their steps don't point to. Asking
   about a record they can't see is refused.
2. **Short labels, never record ids.** Steps are `S1`, `S2`; known steps (Practices) `P1`, `P2`; teams `T1`, `T2`.
   Bayani answers with a label, and `decode` maps it back to the BIX reference. Bayani can't invent a record because
   it never sees or writes an id.
3. **The same records give the same text.** Labels, order and wording are deterministic, whatever order the records
   arrive in. Teams are sorted by name, known steps by how well they match.
4. **A fixed set of answers.** Every question lists what Bayani may answer (`yes`/`no`, labels and `none`, or short
   text with a length limit). In the app a grammar holds the model to that list; `decode` rejects anything else.
5. **A size limit.** About 600 tokens by default (estimated as characters / 4). Over the limit, the pack trims in a
   fixed order: fewer listed steps and known steps, then fewer or shorter team names, then shorter titles. **A
   possible answer is never dropped**, so a team question in a group with very many teams may stay over the limit.
6. **English.** Bayani-1's data is English (decided 2026-11-11).
7. **No people unless needed.** These questions are about steps, so packs name no one.

## Picking the known steps to compare (shortlist)

Decided 2026-11-14: plain shared words, no second model (`src/shortlist.ts`).

- Only active Practices of the same group that apply to the project's kind (`Practice.appliesTo` against
  `Initiative.category`).
- Score: 2 points per word shared with the step's title and the title of the step it sits under, plus 1 point for
  the same team. Words are lowercased, without punctuation, stop words or a plural "s".
- Best 5 (3 when trimming), ties broken by how often the step was done, then by title.
- The team point lets a step with no words in common still reach the list: "Letter to Kapitan for the road closure",
  under "Permits and clearances", reaches "Get the barangay permit" through "permit" and the Logistics team.
- If the shortlist is empty, the pack says `needsModel: false` and the app doesn't ask. A second, meaning-based model
  is added only if testing shows too many misses.

## The six questions

Each pack is a few labelled lines, then `Question:`. Examples are the golden files in `test/golden/`.

| Question | Lines | Answers |
|---|---|---|
| `same-practice`: is this step the same kind as that known step? | Project, Step, Known step with evidence | yes, no |
| `which-practice`: which known step, if any, is this? | Project, Step, Known steps (shortlist) | P labels, none |
| `applies`: does this usual step belong in this project? | Project, Teams, Steps so far, Usual step with evidence and timing | yes, no |
| `one-off`: was this step needed only this once? | Project (finished), Step, Closest known steps | yes, no |
| `which-team`: which team should own this step? | Project, Teams (all of them), Step | T labels, none |
| `general-title`: a general name for this kind of step | Step, Team | text, up to 60 characters |

**The lines.**

```
Project: "Fun run 2027" (fun run), starts in 30 days
Teams: T1 Design, T2 Finance, T3 Logistics
Step S1: "Letter to Kapitan for the road closure" (team T3 Logistics, under "Permits and clearances")
Known step P1 "Get the barangay permit" (usually Logistics, in 3 of 3 past projects, added late once)
Steps so far: 8 ("Book the covered court", "Confirm sponsor logos", …)
Question: Which known step is S1? Answer P1, P2, none.
```

- **Project:** title, kind of project (`Initiative.category`), and when: starts in N days, started N days ago, or
  finished.
- **Evidence** comes from `Practice.observed`, calculated by rule (BIX rule 23): "in 3 of 3 past projects", "added
  late once", and for `applies` the usual timing ("usually 21 days before the start"). A Practice with no figures
  says "common for projects like this" (starter or adopted) or "new for this group".

## Changing the format

The format is part of the model's training. Changing it means regenerating the golden files deliberately
(`npm run golden`), reviewing the diff, and retraining or re-checking the model on the new format. Never edit a golden
file by hand.

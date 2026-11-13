# Facts library

Short, sourced answers about Dasig, BIX, Bayanihan and Bayani, for the app and for Bayani to hand to a person as
written. **Facts are looked up, not trained into the model** (decided 2026-11-14): they change and must be exact, and a
small model trained on them would mix them up and invent details around them. Bayani's training teaches skills;
this library holds what's true.

**Rules for every fact**

- Public material only, matching what bayanihan.dasig.org already says. Nothing internal: no plans, prices, people's
  names or programmes. A test checks for internal terms.
- One question per fact, with a few everyday wordings (`Q:`, separated by `|`), an answer of at most about 80 words
  (`A:`), the public page it comes from (`Source:`), and the date it was last checked (`Updated:`).
- Plain words, present tense, honest about status ("in pilot", "in development", "coming with the first release").
- When the product changes, change the fact and its date in the same commit as the page it comes from.

**Files.** `facts/*.md` (edit these), `out/facts.jsonl` (generated: `npm run knowledge`). Lookup: `findFacts` in
`src/knowledge.ts`, by shared words, so no second model is needed.

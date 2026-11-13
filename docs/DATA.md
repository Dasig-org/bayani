# Bayani-1 v0 data

**What it is.** Invented, English training and test data for Bayani-1's six questions (`docs/CONTEXT_PACK.md`), built
by code from playbooks. No real group or person. Decided 2026-11-11 (seeded by us first, English only) and 2026-11-14.

**How it's made** (`data/generate.ts`, run with `npm run data`):

1. **Playbooks** (`data/playbooks.ts`): six kinds of project volunteer groups in the Philippines run (fun run,
   feeding program, tutoring program, coastal cleanup, community conference, medical mission). Each has its teams,
   its usual steps (the team that owns each, the day it's usually done, how often groups include it, how often it's
   forgotten until the last week, what comes before it), a few one-off steps, and several ways people word each step.
2. **Groups and years**: three invented groups per kind each run it three years and are planning a fourth, as BIX
   records (Organization, Role, Initiative, Team, Task, Practice). A seeded random generator decides which steps each
   year had, which were added late, which one-offs happened, and how each step was worded.
3. **Memory**: Bayanihan Core calculates every Practice's figures from the finished years (`computeObserved`), as a
   group's server would.
4. **Questions with exact answers**: this year's steps, in new wordings, against the group's Practices (same step or
   not, which one, which team, a general name), usual steps this year lacks (do they belong?), and last year's
   close-out (was it a one-off?).
5. **Packs**: each question is turned into text by the same context-pack code the app uses.

**Kept apart.** The test set uses different groups, different random seeds, and wordings that never appear in
training (checked by a test). Never train on `test.jsonl`.

**Files** (`data/out/`, regenerated deterministically): `train.jsonl`, `test.jsonl` (one example per line:
`question`, `text`, `answers`, `answer`), `starter-practices.json` (the playbooks' usual steps as Dasig's starter
Practices, no figures), `summary.json` (counts and the shortlist's recall).

**Known limits of v0.** It's synthetic and tidy: real groups write messier titles, mix languages, and run projects
that don't fit a playbook. "Does it belong?" is judged from how often groups include a step, which the pack shows, so
it may be easier than real use. These are the first things the baseline and pilot data should test. More groups per
kind scale the set up with no extra writing.

# Bayani: design and decisions

The full design record for Bayani-1: what it is for, what it is asked, how it is trained and shipped, and the state at v0. For an introduction, see the [README](../README.md).

**Status: Bayani-1 v0 is trained on sample data and runs in the Dasig app, but it hasn't yet been tested on a real group's projects.** See [State at v0](#state-at-v0-2026-11-14) for what it does today and its known limits.

**What it's for (decided 2026-11-13): project memory.** A coordinator has to remember everything a project needs, and
most of that knowledge left with whoever ran it last. Bayani-1 has one job: **"What else does this project need, and
is anything late or out of order?"**, answered from the group's own past projects (or starter Practices for a group's
first project), and at close-out, keeping what was learned for next time. Bayani-1 starts with memory per project; the
organization's memory is built from projects later.

**The structured memory is BIX, not the model (decided 2026-11-13).** Because Bayani is a small model, BIX holds the
memory and rules do the counting: each kind of step is a `Practice` with `observed` figures calculated by rule
(how often it was needed, when it was done, what came before it, how often it was added late), and each step points to
one through `Task.practice`. Bayani only makes the judgments rules can't. Spec: BIX "Project memory: Practices";
Core: `packages/core/src/practice.ts`.

**Where it works (decided 2026-10-31):** inside the Dasig app and any BIX implementation. Everything it produces is a BIX proposal (`intent: proposal` / `status: draft`, or a `ChangeProposal` for an edit, with Provenance naming the model and version), checked by Bayanihan Core and committed only by a person or a declared rule. A group turns it on with the `memory` assistance area.

## Rules do this, Bayani does that

| Question | Who | How |
|---|---|---|
| What does this project usually need that it doesn't have? | Rules, then Bayani | Core `usuallyNeeded` lists candidates; Bayani judges whether each applies to *this* project |
| Is anything usually done by now? | Rules | Core `usuallyDoneByNow` (from `dayFromStart.median`) |
| Is anything out of order? | Rules | Core `outOfOrder` (from `Practice.after[]`) |
| Is this step the same as a known Practice? | **Bayani** | Proposes `Task.practice` |
| Was this step a one-off? | **Bayani** | At close-out: keep as a new Practice or not |
| What did we learn? | **Bayani drafts, a person writes** | A proposed `lesson` |
| Breaking a step down, reviewing a plan | Bayani, from Practices | Child steps proposed from the Practices that are usually `partOf` it |

Who to ask stays a rule. Figures are never set by the model (BIX rules 21, 23).

## The questions Bayani-1 is trained on

| Question | Shape |
|---|---|
| Is step S the same kind of step as Practice P? | yes/no, over candidates the code picks |
| Does Practice P apply to this project? | yes/no |
| Which known Practice, if any, is step S? | choice over candidates, with "none" |
| Was step S a one-off for this project? | yes/no |
| Which team usually owns a step like S? | choice over the group's teams, with "none fit" |
| A general title for step S ("Book Mactan Expo" → "Book the venue") | short text under a grammar, only when no Practice fits |

**Writing:** step titles come from the group's Practices first. Bayani writes a short general title, under a grammar, only when no Practice fits.

**Why this shape:** answers are one token, so training needs less data, labels are quick, evaluation is exact, probabilities set when a suggestion is shown, and a model small enough for a phone can do it.

## Contract with the app (any BIX implementation)

1. **Core stays model-free.** Bayani lives in its own package (prompt and context building, grammar, mapping output back to records). The inference backend is pluggable: llama.rn (native), llama.cpp in the browser (wasm/WebGPU), llama.cpp on a server.
2. **Input** is the record being worked on plus a small context pack built under the current user's permissions: teams, related tasks, templates, visible roster nicknames, today's date. Bayani never sees what the user can't.
3. **No invented IDs.** The model refers to short handles from the context pack (`T3`, `P2`); the package maps them back.
4. **Output** is validated by Core. Core writes the Provenance, not the model. If it fails, the app shows the manual form; it never retries with a cloud model.
5. **One memory for the whole group.** Bayani on each phone reads the group's synced `Practice` records; figures are calculated only by the group's server or hub (BIX rule 23), and Bayani sees only what its person may see (rule 26). No per-device learning in v0.
6. **The app works fully without Bayani.** The model download is optional, Wi-Fi only, behind a flag.
7. **Product metric:** the share of suggestions a lead accepts unchanged, read from Provenance (confirmed, edited, rejected).

## Data and training

- **v0 is seeded by us (decided 2026-11-11), not pilot users.** About 30 sample projects in BIX, several of each kind (fun run, feeding program, tutoring, cleanup, conference), including steps added late and steps that slipped. They are also the **starter Practices** a group's first project compares against.
- **Generated by code from BIX:** from each set of sample projects of one kind, code builds the Practices and their figures (Core `computeObserved`), then makes questions with exact answers: reword a step and ask if it matches its Practice, drop a usual step, swap a step into another kind of project, add a one-off.
- **The test set is written first and kept apart.** Never trained on; ideally partly written by someone who didn't write the training data, so scores aren't inflated by our own phrasing.
- **English only (decided 2026-11-11).** Training and test data are in English; coordinators use English. No Filipino or Taglish work for Bayani-1.
- **Synthetic variants** (more phrasings of the same projects) come from an open model, not a frontier API, so the whole lineage stays open.
- **Training:** LoRA on a small open base (360M–1.7B), answering a single option token so probabilities come from the logits. Trained in the cloud with Unsloth on a free GPU notebook (Kaggle or Google Colab), because training needs more memory than a typical laptop has (decided 2026-11-11). The Mac prepares the data, runs the evaluation, and runs the exported GGUF model with llama.cpp.
- **Later, with consent:** pilot projects and the edit between what Bayani proposed and what a lead confirmed.

## Model constraints

- The base must be a non-frontier open model. Llama is excluded (Llama 1B/3B are slimmed-down frontier models). Candidates: OLMo, SmolLM. Gemma and Qwen need their licences checked before use.
- It runs on the device from day one. A frontier model may be used only as an offline comparison, never in the product.
- Grammar-constrained output (llama.cpp grammars), checked by Core.

**Native only for v0 (decided 2026-11-11).** Bayani runs in the iOS and Android apps through llama.rn. The PWA works without it, and there is no cloud AI API. A browser engine (llama.cpp in wasm or WebGPU) is a later option, only if coordinators stay on the PWA and want Bayani, and only after a one-day test on a real iPhone with a trained model.

**Naming:** versioned by generation and size, e.g. `Bayani-1-1B`. Not "1.0".

## Evaluation

Per question: accuracy, and whether its probabilities match how often it's right. Baselines: off-the-shelf open models with the grammar, and a frontier model offline. The task eval is the headline.

## In this repository

| Path | What |
|---|---|
| `docs/CONTEXT_PACK.md` | What Bayani reads for each question, and the rules for building it |
| `src/pack.ts` | Builds the context pack from BIX records (only what the person can see) and decodes Bayani's answer |
| `src/shortlist.ts` | Picks the known steps to compare a new step against, by shared words |
| `data/playbooks.ts`, `data/generate.ts` | The v0 data: six kinds of project, built into BIX projects and questions (`docs/DATA.md`) |
| `data/out/` | Generated `train.jsonl`, `test.jsonl`, starter Practices; regenerate with `npm run data` |
| `test/golden/` | Golden examples: fixed records and the exact pack they produce. Regenerate only with `npm run golden` |

Setup: clone `bix`, `bayanihan` and `bayani` side by side, run `npm install` in `bayanihan/` and here, then
`npm run verify`.

**Coming next:** the evaluation harness and baseline results.

## Shipping a new model (any base)

The app doesn't name a model. It reads `bayani-manifest.json` next to the model files and offers a newer version as an
update, so a new base (OLMo-2, a later SmolLM) or a retrained add-on ships without a new app. It writes prompts as chat
messages and llama.cpp applies the model's own chat format from the GGUF, the same way training does
(`tokenizer.apply_chat_template` in `train/train.py`).

1. **Train** on Kaggle (GPU): `BAYANI_MODELS=allenai/OLMo-2-0425-1B-Instruct python train/train.py`. It scores the
   trained model, saves the add-on without merging (B41), converts the base and the add-on to GGUF separately and scores
   them together in llama.cpp. Keep the run only if llama.cpp's score matches the trained one.
2. **Check on a Mac** with the app's own code: `llama-server -m base.gguf --lora add-on.gguf -c 2048 --jinja`, then
   `npx vite-node ../dasig-app/app/scripts/bayani-check.ts` (the six questions, at the app's threshold) and
   `npx vite-node ../dasig-app/app/scripts/bayani-answer-check.ts` (sorting typed questions).
3. **Publish** the two `.gguf` files on Hugging Face, then the manifest:

```json
{ "name": "Bayani-1", "version": "1b-olmo2-q4-lora-2026-11-20", "family": "OLMo-2-1B-Instruct",
  "files": { "base": { "url": "https://huggingface.co/dasig/bayani-1/resolve/main/olmo2/base-q4_k_m.gguf", "file": "olmo2-base-q4_k_m.gguf", "mb": 0 },
             "lora": { "url": "https://huggingface.co/dasig/bayani-1/resolve/main/olmo2/bayani-1-lora.gguf", "file": "olmo2-bayani-1-lora.gguf", "mb": 0 } } }
```

`mb` is each file's size in megabytes (shown before downloading; the app checks the exact size the server sends).
`version` is what suggestions record as the model in BIX Provenance, so never reuse one. Without a manifest the app uses
the model it was released with (SmolLM2-1.7B, `1.7B-q4-lora-2026-11-14`).

**Why OLMo-2-1B next** (train/results/README.md): trained, it scored 0.96 on the fixed-answer questions, the same as
SmolLM2-1.7B, with better calibration (0.05), at 1B parameters instead of 1.7B, so it suits 4 GB phones (D25). It is
fully open, data included. Its GGUF was never published because the add-on export bug (B41) was fixed on the SmolLM2
run; the training script now does the fixed export for any base.

## State at v0 (2026-11-14)

- **Model:** Bayani-1 = SmolLM2-1.7B-Instruct (Q4_K_M GGUF) plus the Bayani LoRA add-on (36 MB), trained on the v0
  data. Held-out test: 0.96 in training (transformers); 0.90 in llama.cpp; 35/40 in Ollama. Files:
  `huggingface.co/dasig/bayani-1` (`base-q4_k_m.gguf`, `bayani-1-lora.gguf`). Results: `train/results/README.md`.
- **Run it locally:** `ollama create bayani-1 -f train/Modelfile` (base + ADAPTER), or `python3 train/local_check.py`.
- **In the Dasig app (v0.18.0, 2026-11-15):** all six trained questions are used, built with this package's `buildPack`
  (option `prefiltered`: records already filtered for the person by their server) and read with `decode`. Same step and
  "does it belong" filter project memory; "which known step" and "which team" are suggestions on a project or step;
  "one-off" and "general title" suggest what to keep at close-out. Each suggestion shows its confidence (raw token
  probabilities over the allowed answers) and is shown at 0.8 or above; accepting records Bayani-1, the question and the
  confidence in Provenance. Through the app's own code on llama.cpp, the held-out set scores 95% on fixed answers
  (`dasig-app/app/scripts/bayani-check.ts`). Facts from `knowledge/` stay looked up, never generated.
- **Known limits:** synthetic, tidy English data from six playbooks; not yet tested on a held-out kind of project, messy
  wordings or a real group's project. Facts are looked up, never generated.

# Bayani

**A small language model for volunteer groups and nonprofits. It runs on the phone, and its first job is your group's
memory.**

> **Status: early.** Bayani-1 v0 is trained on sample data and runs in the [Dasig app](https://github.com/Dasig-org/dasig-app)
> as an optional download. It has **not yet been tested on a real group's projects.** See
> [what works today](#what-works-today) and its [known limits](#known-limits).

## Why it exists

AI money goes to sales, ads and whoever pays most. Meanwhile the groups that run feeding programmes, fun runs,
tutoring circles and shore cleanups still plan in group chats, and most of what they learn leaves with whoever ran the
last project.

Bayani is built for them. It answers one question well:

> **"What else does this project need, and is anything late or out of order?"**

It answers from the group's own past projects (or starter examples for a group's first project), and at the end of a
project it helps decide what to keep for next time.

## How it's different

| Most AI assistants | Bayani |
|---|---|
| A large model in the cloud | A small model (1–2B parameters) **on the phone**, working with no internet |
| Writes anything | Answers **a few narrow questions**, each with a confidence score |
| Acts for you | **Proposes**; a person accepts every change |
| Makes up numbers | **Never sets figures.** Counts and dates come from rules in [Bayanihan Core](https://github.com/Dasig-org/bayanihan) |
| Remembers in the model | The memory is structured data in [BIX](https://github.com/Dasig-org/bix) (`Practice` records), not in the model |
| Closed weights, frontier lineage | Open base models (SmolLM2, OLMo-2), open data, open training code |

The idea: let the format and the rules do the counting, so the model only makes the judgments rules can't, such as
"is *Book Mactan Expo* the same kind of step as *Book the venue*?". That's what lets it be small enough for a phone.

## What it's asked

| Question | Answer shape |
|---|---|
| Is this step the same kind of step as a known one? | yes / no |
| Does this usual step apply to this project? | yes / no |
| Which known step, if any, is this? | a choice, or "none" |
| Was this step a one-off for this project? | yes / no |
| Which team usually owns a step like this? | a choice of the group's teams, or "none fit" |
| A general title for this step | short text, only when nothing known fits |

Answers are mostly a single token, so the confidence comes straight from the model, evaluation is exact, and a small
model can learn it from little data.

## What works today

- **Model:** Bayani-1 = SmolLM2-1.7B-Instruct (4-bit GGUF) plus a 36 MB LoRA add-on, published at
  [huggingface.co/dasig/bayani-1](https://huggingface.co/dasig/bayani-1).
- **Scores** on a held-out test set: 0.96 on the fixed-answer questions in training, 0.95 through the app's own code on
  llama.cpp. Untrained, the same base models score no better than simple rules (0.54). Details:
  [`train/results/README.md`](train/results/README.md).
- **In the Dasig app** (Android): suggestions on a project and its steps, shown only at 0.8 confidence or above, each
  recording the model, the question and the confidence when a lead accepts it.
- **Next base:** OLMo-2-1B scored the same with better calibration at 1B parameters, which suits 4 GB phones.

## Known limits

- Trained on tidy, synthetic English data from six kinds of project (fun run, feeding programme, tutoring, cleanup,
  conference and more).
- Not yet tested on a held-out kind of project, messy wording, or a real group's project.
- Not yet measured on a 4 GB Android phone (memory, speed, battery). That's one of the most useful things you can help with.
- English only for Bayani-1.

## Try it

**On a computer,** with [Ollama](https://ollama.com):

```sh
git clone https://github.com/Dasig-org/bayani.git && cd bayani
# download base-q4_k_m.gguf and bayani-1-lora.gguf from huggingface.co/dasig/bayani-1 into models/
ollama create bayani-1 -f train/Modelfile
```

or check it with llama.cpp: `python3 train/local_check.py`.

**On a phone:** install [Dasig for Android](https://github.com/Dasig-org/dasig-app/releases/latest), open
**Ask Bayani** and tap **Download Bayani-1** (about 1.1 GB; use Wi-Fi).

## Develop

The package in `src/` builds what Bayani reads (the *context pack*) from BIX records, and maps its answers back. It
needs [BIX](https://github.com/Dasig-org/bix) and [Bayanihan](https://github.com/Dasig-org/bayanihan) beside it:

```sh
mkdir dasig && cd dasig
git clone https://github.com/Dasig-org/bix.git
git clone https://github.com/Dasig-org/bayanihan.git
git clone https://github.com/Dasig-org/bayani.git
(cd bix && npm install) && (cd bayanihan && npm install)
cd bayani && npm install
npm run verify
```

| Path | What |
|---|---|
| `src/` | Context pack (`pack.ts`), shortlist of known steps (`shortlist.ts`), facts lookup (`knowledge.ts`) |
| `data/` | The v0 sample projects (`playbooks.ts`) and the generator for training and test questions |
| `train/` | Training (`train.py`, LoRA with Unsloth on a free Kaggle or Colab GPU), GGUF export, results |
| `knowledge/` | Short, sourced facts about Dasig and BIX, looked up, never trained in |
| `test/golden/` | Fixed records and the exact pack they produce |
| [`docs/DESIGN.md`](docs/DESIGN.md) | The full design: decisions, contract with the app, training, shipping a new model |
| [`docs/CONTEXT_PACK.md`](docs/CONTEXT_PACK.md), [`docs/DATA.md`](docs/DATA.md) | What Bayani reads, and how the data is made |

## Help wanted

Bayani needs people who **aren't** us, because a model tested only by its makers is flattered by their phrasing.

- **Write test questions** in your own words (no ML needed).
- **Measure it on a 4 GB Android phone.**
- **Train another open base** and compare.
- **Improve the evaluation** (calibration, a softer score for titles, a held-out kind of project).

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and the issues labelled
[`good first issue`](https://github.com/Dasig-org/bayani/labels/good%20first%20issue) and
[`help wanted`](https://github.com/Dasig-org/bayani/labels/help%20wanted).

## Part of Bayanihan

Bayani is one piece of [Bayanihan, an open initiative by Dasig](https://bayanihan.dasig.org):
[BIX](https://github.com/Dasig-org/bix) (the open format) ·
[Bayanihan Core and Server](https://github.com/Dasig-org/bayanihan) (rules and storage) ·
**Bayani** (the small model) · [Dasig](https://github.com/Dasig-org/dasig-app) (the app).

## Licence

**Apache-2.0**, see [`LICENSE`](LICENSE): the code, the training and test data, and the Bayani LoRA add-on. The base
models keep their own licences (SmolLM2 and OLMo-2 are Apache-2.0). Maintained by Dasig Inc. Questions:
hello@dasig.org. Security and privacy problems: [`SECURITY.md`](SECURITY.md).

# Contributing to Bayani

Salamat for helping. Bayani is a small language model for the civic sector, and the package that connects it to BIX
records. It's early: trained on sample data, and not yet tested on a real group's projects. That makes this a good time
to help shape it.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Write test questions.** The held-out test set is best when it's partly written by people who didn't write the
  training data, so scores aren't inflated by our own phrasing. This needs no ML background.
- **Run it on a low-end Android phone** (4 GB) and report memory use, seconds per question and battery.
- **Train and compare bases** (OLMo, SmolLM, others with open licences) using [`train/train.py`](train/train.py) on a
  free Kaggle or Colab GPU, and share the results.
- **Improve the evaluation:** calibration, a softer score for general titles, a held-out kind of project.
- **Add or correct facts** in [`knowledge/facts/`](knowledge/facts) (public material only; see its README).
- **Pick up an issue** labelled [`good first issue`](https://github.com/Dasig-org/bayani/labels/good%20first%20issue)
  or [`help wanted`](https://github.com/Dasig-org/bayani/labels/help%20wanted).

## Before you start

- **Small fixes, tests, test questions, facts:** open a pull request straight away.
- **Anything that changes what Bayani is asked or reads** (a new question, a change to the context pack, a new base
  model in the app): open an issue first and wait until a maintainer agrees on the approach.
- **To work on an issue,** comment on it so it can be assigned to you. If there's no news after two weeks, it goes back
  to the pool. No hard feelings.

## Set up

You need Node.js 22. `@bayanihan/*` packages aren't on npm yet, so the repositories sit side by side:

```sh
mkdir dasig && cd dasig
git clone https://github.com/Dasig-org/bix.git
git clone https://github.com/Dasig-org/bayanihan.git
git clone https://github.com/<you>/bayani.git     # your fork
(cd bix && npm install)
(cd bayanihan && npm install)
cd bayani && npm install
npm run verify        # typecheck + tests; should pass before you change anything
```

For training you need Python and a GPU (a free Kaggle or Colab notebook is enough). To run the model on a Mac or PC:
[llama.cpp](https://github.com/ggml-org/llama.cpp) or [Ollama](https://ollama.com) (`ollama create bayani-1 -f train/Modelfile`).

## Useful commands

| Command | What it does |
|---|---|
| `npm run verify` | Typecheck and tests. Run before every pull request. |
| `npm run data` | Regenerates the training and test data in `data/out/` from `data/playbooks.ts` |
| `npm run golden` | Regenerates the golden context-pack examples in `test/golden/` (only when you meant to change the pack) |
| `npm run knowledge` | Rebuilds `knowledge/out/facts.jsonl` from `knowledge/facts/` |

## Rules Bayani keeps

- **Never add real groups' projects** to `data/` or `test/`. Sample projects use fictional groups.
- **Never train on the held-out test set,** and never tune on it.
- **Bayani proposes, people decide.** Everything it produces is a BIX draft or `ChangeProposal`, checked by Core and
  accepted by a person. It never acts on its own.
- **Figures come from rules, not the model.** Counts, dates and "usually done by" are calculated by Core.
- **Facts are looked up, never generated.**
- **Open lineage.** Bases are non-frontier open models (no Llama). Synthetic data comes from open models, not a
  frontier API. A frontier model may be used only as an offline comparison, never in the product.
- **Changing the questions or the context pack** needs the golden examples regenerated (`npm run golden`) and the
  reason in the pull request.
- **Privacy:** the context pack holds only what the current person may see.

## Open a pull request

1. Branch from `main` in your fork: `git switch -c more-test-questions-cleanup`.
2. Keep it to one change. For a training run, include the numbers and where the files are.
3. Run `npm run verify` and say so in the pull request.
4. Fill in the pull request template.

## What happens next

- A maintainer reviews it, usually **within a week**. Only maintainers can merge; every change to `main` needs an
  approving review.
- You may be asked for changes. That's normal, not a rejection.
- We squash-merge, so your pull request becomes one commit on `main`, credited to you.

## Your contribution's licence

By contributing you agree that your contribution (code, data, test questions, facts) is licensed under **Apache-2.0**
([`LICENSE`](LICENSE)).

## Questions

[Dasig-org Discussions](https://github.com/orgs/Dasig-org/discussions), or hello@dasig.org. Security and privacy
problems: see [`SECURITY.md`](SECURITY.md), never a public issue.

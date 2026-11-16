# Results

## Baseline, 2026-11-14 (before any training)

Off-the-shelf open models on the v0 held-out test set (254 questions), on a Kaggle T4. Each model picks the allowed
answer it gives the highest probability. Full numbers: `baseline-2026-11-14.json`.

| | Rules only (floor) | SmolLM2-360M | SmolLM2-1.7B | OLMo-2-1B |
|---|---|---|---|---|
| Same step? | 0.50 | 0.50 | 0.50 | 0.52 |
| Which known step? | 0.63 | 0.63 | 0.10 | 0.63 |
| Does it belong? | 0.75 | 0.78 | 0.25 | 0.53 |
| One-off? | 0.67 | 0.67 | 0.56 | 0.33 |
| Which team? | 0.27 | 0.27 | 0.20 | 0.27 |
| General name (exact) | – | 0.00 | 0.00 | 0.02 |
| **All fixed-answer questions** | **0.54** | **0.54** | **0.32** | **0.49** |
| HellaSwag (general common sense, 300) | – | 0.53 | 0.67 | 0.69 |

**Reading.** Untrained, none of the models beats simple rules at Bayani's questions, even though the larger ones
have real general common sense (HellaSwag). The skill is specific: it has to be taught. "Same step?" at 0.50 is a coin
flip on a balanced set. The general-name score uses exact matching, which is strict; a softer measure comes later.

## First training run, 2026-11-14 (LoRA, 2 epochs, 2,425 training examples)

Same 254 held-out test questions as the baseline. Full numbers: `trained-2026-11-14.json`.

| | Rules only | OLMo-2-1B before | **OLMo-2-1B trained** | SmolLM2-360M before | SmolLM2-360M trained |
|---|---|---|---|---|---|
| Same step? (82) | 0.50 | 0.52 | **0.90** | 0.50 | 0.57 |
| Which known step? (41) | 0.63 | 0.63 | **0.90** | 0.63 | 0.63 |
| Does it belong? (40) | 0.75 | 0.53 | **1.00** | 0.78 | 0.75 |
| One-off? (9) | 0.67 | 0.33 | **1.00** | 0.67 | 0.67 |
| Which team? (41) | 0.27 | 0.27 | **0.93** | 0.27 | 0.37 |
| General name, exact / word overlap (41) | – | 0.02 | **0.54 / 0.78** | 0.00 | 0.56 / 0.69 |
| **All fixed-answer questions** | **0.54** | 0.49 | **0.93** | 0.54 | 0.58 |
| Calibration error (lower is better) | – | 0.28 | **0.05** | 0.15 | 0.07 |

**Reading.** OLMo-2-1B learned the skill: 0.93 on fixed-answer questions against 0.54 for rules, with confidence that
matches how often it's right. SmolLM2-360M barely moved: too small for this, at least with this recipe.

**Limits.** The test set uses held-out groups and wordings, but the same six kinds of project and the same playbook
steps as training, and its wordings are tidy. "One-off?" has only 9 questions. These scores show the model learned the
task on this data, not that it works on a real group's project yet. Next checks: a kind of project left out of
training entirely, messier wordings, and a real, consented project.

## SmolLM2-1.7B and the export bug, 2026-11-14

SmolLM2-1.7B trained the same way: **0.96** on fixed-answer questions (calibration error 0.04); 0.95 after merging and
after reloading from disk. OLMo-2-1B's best run: 0.96, and 0.967 from disk.

**Open bug: the llama.cpp (GGUF) file loses the training.** Converted with `convert_hf_to_gguf.py`, both models
score near or below the untrained level in llama.cpp (OLMo-2 0.53 at f16 and Q4; SmolLM2-1.7B 0.27 at Q4), on Kaggle
and on the Mac, and in Ollama. The saved Hugging Face model is fine, so the gap is in conversion or in how the prompt
reaches llama.cpp. Next: compare llama.cpp's tokens and first-token probabilities with transformers' on the same
prompt (`train/diagnose_gguf.py` is the starting point).

**B41 finding (2026-11-14).** llama.cpp is faithful: on 30 questions its tokens match transformers' exactly (30/30)
and its first token mostly agrees (21/30). But **transformers itself, loading the exported `bayani-merged` files, scores
only 12/30**, while the training run reported 0.95 after reloading the same folder. So the files that reach the
converter don't hold the trained weights, despite the in-run check. Next: in the training run, compare a LoRA-targeted
weight against the base model before and after saving (it must differ), and export the LoRA adapter separately as a
GGUF adapter (`convert_lora_to_gguf.py`, loaded with `--lora`) so the merge step can't lose it.

**Fixed (2026-11-14).** No merge: the LoRA add-on saved directly (336 tensors, 36 MB) and converted on its own. llama.cpp, 60 questions: base alone 0.27, base + Bayani add-on **0.90**. Ollama (base + ADAPTER, `train/Modelfile`), 40 questions: **35/40**. The merge step was what lost the training.

## v1 data and the harder checks (B38, B39, B128), 2026-11-16

**Data.** 13 kinds of project instead of 6: v0's six and seven written from how Philippine groups describe their own
projects in public (relief operation, bloodletting drive, school supplies drive, mangrove planting, Christmas
gift-giving, livelihood training, fundraising event); medical mission **left out of training** and only tested; every
test project asked twice, tidy and messy; a 7th question (sorting a typed question into the app's kinds); a few
identity and declining examples. 5,495 training, 1,202 test; the v0 test set kept as `test-v0.jsonl`
(`docs/DATA.md`). Both bases trained in one Kaggle run (LoRA, 2 epochs, no merge). Full numbers:
`trained-v1-2026-11-16.json`.

Fixed-answer accuracy (transformers, on Kaggle):

| Test set | OLMo-2-1B | **SmolLM2-1.7B** |
|---|---|---|
| Tidy (526) | 0.95 | 0.95 |
| Messy, same projects (526) | 0.92 | 0.91 |
| **Medical mission, never trained (106)** | 0.80 | **0.91** |
| Sorting typed questions (37) | 0.84 | 0.87 |
| Who it is / declining (7, exact sentence) | 7/7 | 7/7 |
| v0 test set (254) | 0.93 | 0.94 |
| All fixed answers / calibration error | 0.92 / 0.06 | 0.92 / 0.05 |
| llama.cpp, base + add-on (120 across all sets) | 0.93 | 0.93 |

On the Mac through the app's own code (`dasig-app/app/scripts/bayani-check.ts`, llama.cpp, Q4): the same per-question
scores as above, within a point or two; at the app's threshold, 98% of answers are shown. Sorting the app's 14 check
questions (`bayani-answer-check.ts`, `MODEL_ONLY=1`, add-on on): SmolLM2 **14/14**, OLMo 12/14; the base model alone
(as the app sorts today, add-on off) 7/14, and 30% on the 37 held-out typed questions. Today's v0 model on the new
test set: tidy 89%, messy 84% (all questions).

**Reading.** Messy wordings cost about 3–4 points; a kind of project never trained costs SmolLM2 4 points and OLMo
15 (its "which team" falls to 0.56). On the kinds they trained on the two bases are equal, and OLMo's Q4 file is only
130 MB smaller, so **SmolLM2-1.7B was published** (`1.7B-q4-lora-2026-11-16`); OLMo-2-1B stays a candidate for small
phones (B49). General titles stay weak (0.4 exact, 0.0 on the unseen kind), which is why the app writes titles from
Practices first. Still synthetic: the next check is a real, consented group's project (B38).

**Published** (2026-11-16): `huggingface.co/dasig/bayani-1`: the new add-on at `smollm2-2026-11-16/bayani-1-lora.gguf`
(36 MB) and `bayani-manifest.json`. The base is byte-for-byte the v0 file (`base-q4_k_m.gguf`), so the manifest points
at it. The app offers this as an update from the version with manifest support (after v0.20.0).

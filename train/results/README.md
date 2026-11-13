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

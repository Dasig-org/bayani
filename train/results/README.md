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

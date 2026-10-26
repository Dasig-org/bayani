# Bayani · the small model of Bayanihan Intelligence

**Bayani does not exist yet.** This folder will hold the work to build it. Never describe it as trained, deployed or benchmarked until it is.

**What it's for:** reading informal coordination messages (Filipino and English, usually mixed in the same message) on the phone, offline, and proposing BIX records. It proposes; a person or a declared rule commits. It never stores a raw message unless the sender consented.

**Naming:** versioned by generation and size, like other model families, e.g. `Bayani-1-1B`. Not "1.0".

**Model constraints:**

- The base must be a non-frontier open model. Llama is excluded (Llama 1B/3B are slimmed-down frontier models). Candidates: OLMo, SmolLM. Gemma and Qwen are a grey zone.
- It runs on the device from day one. A frontier model may be used only as an offline comparison, never in the product.
- Grammar-constrained JSON output (e.g. llama.cpp grammars), checked by the BIX engine.

**Coming in this folder:** the evaluation harness, the consented test set (about 100 labelled messages from pilot organizations), and benchmark results against Filipino suites such as Batayan, Kalahi and FilBench (which covers Cebuano).

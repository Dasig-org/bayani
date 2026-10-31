# Bayani · the small model of Bayanihan Intelligence

**Bayani does not exist yet.** This folder will hold the work to build it. Never describe it as trained, deployed or benchmarked until it is.

**What it's for:** reading informal coordination messages (Filipino and English, usually mixed in the same message) on the phone, offline, and proposing BIX records. It proposes; a person or a declared rule commits. It never stores a raw message unless the sender consented.

**Where it works (decided 2026-10-31):** Bayani is built into the Dasig app and any BIX implementation, not only the group chat. Everything it produces is a BIX proposal (`intent: proposal` / `status: draft` with Provenance naming the model), checked by Bayanihan Core and committed only by a person or a declared rule.

| Use | Reads | Proposes (BIX) |
|---|---|---|
| Break down a project, task or step | The Initiative or Task, the group's saved teams (`InitiativeTemplate`) and kinds of work (`TaskDefinition`), past projects | Child `Task`s with `partOf`, `dependsOn`, `team`; or a draft `TaskDefinition` that becomes active only with `ratifiedBy` |
| Suggest who to ask | The Team roster, time `Offer`s with `recurrence`, each person's confirmed past work, `goodFirstStep` | A `requested` owner on a Task, with the reason shown. Never a score or ranking; the person accepts or declines |
| Turn messages into drafts | A message, with the sender's consent to keep it | `Offer`, `Need`, Task release or `receive` step (spec worked example) |
| Draft a report narrative | A `Report` and its derived figures | Narrative text only. Figures stay derived by rule; the model never sets one |
| Ask about your group (a possible direction, not decided) | The group's BIX records the person can already see, on the phone | Summaries and next steps in a chat; any change it suggests is still a proposal |

**Naming:** versioned by generation and size, like other model families, e.g. `Bayani-1-1B`. Not "1.0".

**Model constraints:**

- The base must be a non-frontier open model. Llama is excluded (Llama 1B/3B are slimmed-down frontier models). Candidates: OLMo, SmolLM. Gemma and Qwen are a grey zone.
- It runs on the device from day one. A frontier model may be used only as an offline comparison, never in the product.
- Grammar-constrained JSON output (e.g. llama.cpp grammars), checked by the BIX engine.

**Coming in this folder:** the evaluation harness, the consented test set (about 100 labelled messages from pilot organizations), and benchmark results against Filipino suites such as Batayan, Kalahi and FilBench (which covers Cebuano).

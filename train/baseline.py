"""Bayani-1 baseline (B21): score off-the-shelf open models on the held-out test set, before any training.

Runs on Kaggle (GPU, internet on). Reads test.jsonl from the private dataset `bayani-v0-data`.
For questions with a fixed set of answers, the model's answer is the allowed answer it gives the highest probability
(the same as holding it to a grammar), so every model is scored on its judgment, not its formatting. The probability
it gave that answer is kept, to check whether its confidence matches how often it's right. General names are
generated and compared after normalising.

Output: /kaggle/working/baseline.json and a table in the log.
"""
import json, math, os, re, time, glob
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODELS = os.environ.get("BAYANI_MODELS", "HuggingFaceTB/SmolLM2-360M-Instruct,HuggingFaceTB/SmolLM2-1.7B-Instruct,allenai/OLMo-2-0425-1B-Instruct").split(",")
SYSTEM = ("You help a volunteer group remember how its projects usually go. Read the project details and answer the "
          "question with exactly one of the allowed answers, and nothing else.")

# Stop at once if the notebook has no internet (Kaggle needs a phone-verified account for it), instead of retrying.
import socket
try:
    socket.create_connection(("huggingface.co", 443), timeout=5).close()
except OSError as ex:
    raise SystemExit(f"No internet in this notebook ({ex}). On Kaggle: verify your phone in Settings, then turn Internet on.")

path = (glob.glob("/kaggle/input/**/test.jsonl", recursive=True) or ["data/out/test.jsonl"])[0]
examples = [json.loads(l) for l in open(path)]
print(f"{len(examples)} test examples from {path}")
device = "cuda" if torch.cuda.is_available() else "cpu"


def prompt(tok, text):
    msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": text}]
    return tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)


@torch.no_grad()
def choose(model, tok, text, answers):
    """Log-probability of each allowed answer as the model's whole reply; softmax over them."""
    p_ids = tok(prompt(tok, text), add_special_tokens=False).input_ids
    scores = []
    for a in answers:
        a_ids = tok(a, add_special_tokens=False).input_ids
        ids = torch.tensor([p_ids + a_ids], device=device)
        logp = torch.log_softmax(model(ids).logits[0, len(p_ids) - 1:-1].float(), dim=-1)
        scores.append(logp.gather(1, torch.tensor(a_ids, device=device).unsqueeze(1)).sum().item())
    m = max(scores)
    probs = [math.exp(s - m) for s in scores]
    z = sum(probs)
    return [x / z for x in probs]


@torch.no_grad()
def generate(model, tok, text, max_new=24):
    ids = tok(prompt(tok, text), return_tensors="pt", add_special_tokens=False).input_ids.to(device)
    out = model.generate(ids, max_new_tokens=max_new, do_sample=False, pad_token_id=tok.eos_token_id)
    return tok.decode(out[0, ids.shape[1]:], skip_special_tokens=True).strip().split("\n")[0].strip().strip('"')


norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def score(name):
    t0 = time.time()
    tok = AutoTokenizer.from_pretrained(name)
    model = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.float16 if device == "cuda" else torch.float32).to(device).eval()
    rows = []
    for e in examples:
        if isinstance(e["answers"], list):
            probs = choose(model, tok, e["text"], e["answers"])
            i = max(range(len(probs)), key=lambda k: probs[k])
            rows.append({"q": e["question"], "ok": e["answers"][i] == e["answer"], "conf": probs[i], "got": e["answers"][i]})
        else:
            got = generate(model, tok, e["text"])
            rows.append({"q": e["question"], "ok": norm(got) == norm(e["answer"]), "conf": None, "got": got})
    del model
    torch.cuda.empty_cache()
    return rows, time.time() - t0


def summarise(rows):
    by = {}
    for r in rows:
        by.setdefault(r["q"], []).append(r)
    per = {q: {"n": len(v), "accuracy": round(sum(x["ok"] for x in v) / len(v), 3)} for q, v in sorted(by.items())}
    fixed = [r for r in rows if r["conf"] is not None]
    # Calibration: does a 0.8-confidence answer turn out right about 80% of the time? (expected calibration error)
    bins = [[] for _ in range(10)]
    for r in fixed:
        bins[min(int(r["conf"] * 10), 9)].append(r)
    ece = sum(len(b) / len(fixed) * abs(sum(x["ok"] for x in b) / len(b) - sum(x["conf"] for x in b) / len(b)) for b in bins if b)
    return {"perQuestion": per, "fixedAnswerAccuracy": round(sum(r["ok"] for r in fixed) / len(fixed), 3), "calibrationError": round(ece, 3)}


def majority():
    """The floor: always give the most common answer for each question (from the test set itself)."""
    from collections import Counter
    rows = []
    common = {}
    for e in examples:
        if isinstance(e["answers"], list):
            common.setdefault(e["question"], Counter())[e["answer"] if e["answer"] in ("yes", "no", "none") else "label"] += 1
    for e in examples:
        if not isinstance(e["answers"], list):
            continue
        top = common[e["question"]].most_common(1)[0][0]
        guess = top if top != "label" else e["answers"][0]
        rows.append({"q": e["question"], "ok": guess == e["answer"], "conf": 1.0, "got": guess})
    return rows


results = {"testExamples": len(examples), "device": device, "models": {}}
results["models"]["(rules only: most common answer, or top of the shortlist)"] = summarise(majority())
for name in MODELS:
    try:
        rows, secs = score(name)
        results["models"][name] = {**summarise(rows), "seconds": round(secs)}
    except Exception as ex:  # one model failing shouldn't lose the others
        results["models"][name] = {"error": repr(ex)[:300]}
    print(json.dumps({name: results["models"][name]}, indent=1), flush=True)

json.dump(results, open("/kaggle/working/baseline.json" if os.path.isdir("/kaggle/working") else "baseline.json", "w"), indent=1)
print("\nquestion".ljust(18) + "".join(n.split("/")[-1][:22].ljust(24) for n in results["models"]))
qs = sorted({e["question"] for e in examples})
for q in qs:
    print(q.ljust(18) + "".join(str(m.get("perQuestion", {}).get(q, {}).get("accuracy", "-")).ljust(24) for m in results["models"].values()))

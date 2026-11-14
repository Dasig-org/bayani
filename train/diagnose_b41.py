"""B41: where do transformers and llama.cpp part ways? CPU only, no retraining.

Uses the last bayani-train run's output (SmolLM2-1.7B: bayani-merged, 0.95 from disk, and its Q4 GGUF). For 30
fixed-answer test questions it compares, on the identical prompt:
  1. tokens: transformers' token IDs vs llama.cpp's /tokenize of the same text
  2. llama.cpp score when given transformers' exact token IDs (bypasses any template or tokenizer difference)
  3. llama.cpp score when given the prompt text (as the app would)
  4. transformers' first-token choice vs llama.cpp's, from the same token IDs
"""
import glob, json, os, subprocess, sys, time, urllib.request

run = lambda *a: subprocess.run(list(a), check=True)
inp = "/kaggle/input"
merged = glob.glob(f"{inp}/**/bayani-merged/config.json", recursive=True)[0].rsplit("/", 1)[0]
gguf = glob.glob(f"{inp}/**/*.gguf", recursive=True)[0]
test = [json.loads(l) for l in open(glob.glob(f"{inp}/**/test.jsonl", recursive=True)[0])]
xs = [e for e in test if isinstance(e["answers"], list)][:30]
SYSTEM = ("You help a volunteer group remember how its projects usually go. Read the project details and answer the "
          "question with exactly one of the allowed answers, and nothing else.")

run("git", "clone", "-q", "--depth", "1", "https://github.com/ggml-org/llama.cpp", "/tmp/llama.cpp")
run("cmake", "-S", "/tmp/llama.cpp", "-B", "/tmp/b", "-DGGML_NATIVE=OFF", "-DLLAMA_CURL=OFF", "-DCMAKE_BUILD_TYPE=Release")
run("cmake", "--build", "/tmp/b", "--target", "llama-server", "-j", str(os.cpu_count() or 2))

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
tok = AutoTokenizer.from_pretrained(merged)
model = AutoModelForCausalLM.from_pretrained(merged, torch_dtype=torch.float32).eval()
prompt = lambda t: tok.apply_chat_template([{"role": "system", "content": SYSTEM}, {"role": "user", "content": t}], tokenize=False, add_generation_prompt=True)

srv = subprocess.Popen([glob.glob("/tmp/b/**/llama-server", recursive=True)[0], "-m", gguf, "--port", "8099", "-c", "2048"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
post = lambda path, body: json.load(urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:8099{path}", json.dumps(body).encode(), {"Content-Type": "application/json"}), timeout=300))
for _ in range(300):
    try: urllib.request.urlopen("http://127.0.0.1:8099/health", timeout=1); break
    except Exception: time.sleep(1)

out = {"gguf": gguf.split("/")[-1], "n": len(xs), "tokensMatch": 0, "idsScore": 0, "textScore": 0, "hfScore": 0, "firstTokenAgree": 0, "examples": []}
try:
    for k, e in enumerate(xs):
        p = prompt(e["text"])
        hf_ids = tok(p, add_special_tokens=False).input_ids
        ll_ids = post("/tokenize", {"content": p, "add_special": False, "parse_special": True})["tokens"]
        out["tokensMatch"] += hf_ids == ll_ids
        g = "root ::= " + " | ".join(json.dumps(a) for a in e["answers"])
        by_ids = post("/completion", {"prompt": hf_ids, "temperature": 0, "n_predict": 8, "grammar": g})["content"].strip()
        by_text = post("/completion", {"prompt": p, "temperature": 0, "n_predict": 8, "grammar": g})["content"].strip()
        out["idsScore"] += by_ids == e["answer"]; out["textScore"] += by_text == e["answer"]
        with torch.no_grad():
            logits = model(torch.tensor([hf_ids])).logits[0, -1]
        firsts = {a: tok(a, add_special_tokens=False).input_ids[0] for a in e["answers"]}
        hf_pick = max(firsts, key=lambda a: logits[firsts[a]].item())
        out["hfScore"] += hf_pick == e["answer"]
        ll_top = post("/completion", {"prompt": hf_ids, "temperature": 0, "n_predict": 1, "n_probs": 5})
        ll_first = (ll_top.get("completion_probabilities") or [{}])[0]
        top = ll_first.get("top_logprobs") or ll_first.get("probs") or []
        hf_top = tok.decode([int(logits.argmax())])
        ll_tok = (top[0].get("token") or top[0].get("tok_str")) if top else None
        out["firstTokenAgree"] += ll_tok == hf_top
        if k < 4:
            out["examples"].append({"answer": e["answer"], "hf": hf_pick, "llamaIds": by_ids, "llamaText": by_text, "hfTop": hf_top, "llamaTop": [t.get("token") or t.get("tok_str") for t in top[:3]],
                                    "hfTokens": len(hf_ids), "llamaTokens": len(ll_ids), "firstDiff": next((i for i, (a, b) in enumerate(zip(hf_ids, ll_ids)) if a != b), None)})
        print(k, out["tokensMatch"], out["hfScore"], out["idsScore"], out["textScore"], out["firstTokenAgree"], flush=True)
finally:
    srv.terminate()
json.dump(out, open("/kaggle/working/b41.json", "w"), indent=1)
print(json.dumps(out, indent=1))

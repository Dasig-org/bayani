"""Bayani-1 first training run (B37), on Kaggle (T4 GPU, internet on).

For each base model: LoRA fine-tune on train.jsonl (the loss counts only the answer, not the context pack), then
score on the same held-out test.jsonl as the baseline, the same way (the allowed answer with the highest
probability). Saves each LoRA adapter and results to /kaggle/working.

Plain transformers + peft rather than Unsloth, so OLMo-2 works without depending on Unsloth's model list.
"""
import json, math, os, re, glob, time, random, socket, subprocess, sys

try:
    socket.create_connection(("huggingface.co", 443), timeout=5).close()
except OSError as ex:
    raise SystemExit(f"No internet in this notebook ({ex}). Verify your phone in Kaggle Settings and turn Internet on.")
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "peft>=0.13"], check=False)
# Kaggle's image ships an old torchao that new peft refuses to load; peft works without it.
subprocess.run([sys.executable, "-m", "pip", "uninstall", "-y", "-q", "torchao"], check=False)
try:
    import peft  # noqa: F401  fail in seconds, not after downloading models
except Exception as ex:
    raise SystemExit(f"peft didn't load: {ex!r}")

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, get_cosine_schedule_with_warmup
from peft import LoraConfig, get_peft_model

MODELS = os.environ.get("BAYANI_MODELS", "allenai/OLMo-2-0425-1B-Instruct").split(",")
EPOCHS, LR, BATCH, ACCUM, MAXLEN = 2, 2e-4, 8, 2, 640
SYSTEM = ("You help a volunteer group remember how its projects usually go. Read the project details and answer the "
          "question with exactly one of the allowed answers, and nothing else.")
OUT = "/kaggle/working" if os.path.isdir("/kaggle/working") else "."
device = "cuda"
find = lambda n: (glob.glob(f"/kaggle/input/**/{n}", recursive=True) or [f"data/out/{n}"])[0]
train = [json.loads(l) for l in open(find("train.jsonl"))]
test = [json.loads(l) for l in open(find("test.jsonl"))]
print(f"{len(train)} train, {len(test)} test", flush=True)


def prompt(tok, text):
    return tok.apply_chat_template([{"role": "system", "content": SYSTEM}, {"role": "user", "content": text}], tokenize=False, add_generation_prompt=True)


def encode(tok, e):
    p = tok(prompt(tok, e["text"]), add_special_tokens=False).input_ids
    a = tok(e["answer"] + (tok.eos_token or ""), add_special_tokens=False).input_ids
    ids = (p + a)[-MAXLEN:]
    labels = ([-100] * len(p) + a)[-MAXLEN:]
    return ids, labels


def fit(model, tok):
    data = [encode(tok, e) for e in train]
    opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=LR, weight_decay=0.0)
    steps = math.ceil(len(data) / BATCH / ACCUM) * EPOCHS
    sched = get_cosine_schedule_with_warmup(opt, int(steps * 0.05), steps)
    scaler = torch.cuda.amp.GradScaler()
    pad = tok.pad_token_id if tok.pad_token_id is not None else tok.eos_token_id
    model.train()
    step = 0
    for ep in range(EPOCHS):
        random.Random(ep).shuffle(data)
        for i in range(0, len(data), BATCH):
            chunk = data[i:i + BATCH]
            n = max(len(x[0]) for x in chunk)
            ids = torch.tensor([x[0] + [pad] * (n - len(x[0])) for x in chunk], device=device)
            lab = torch.tensor([x[1] + [-100] * (n - len(x[1])) for x in chunk], device=device)
            att = torch.tensor([[1] * len(x[0]) + [0] * (n - len(x[0])) for x in chunk], device=device)
            with torch.autocast("cuda", dtype=torch.float16):
                loss = model(input_ids=ids, attention_mask=att, labels=lab).loss / ACCUM
            scaler.scale(loss).backward()
            if (i // BATCH + 1) % ACCUM == 0:
                scaler.unscale_(opt)
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                scaler.step(opt); scaler.update(); opt.zero_grad(); sched.step(); step += 1
                if step % 25 == 0:
                    print(f"  epoch {ep + 1} step {step}/{steps} loss {loss.item() * ACCUM:.4f}", flush=True)
    model.eval()


@torch.no_grad()
def choose(model, tok, text, answers):
    p_ids = tok(prompt(tok, text), add_special_tokens=False).input_ids
    scores = []
    for a in answers:
        a_ids = tok(a, add_special_tokens=False).input_ids
        ids = torch.tensor([p_ids + a_ids], device=device)
        with torch.autocast("cuda", dtype=torch.float16):
            logits = model(ids).logits
        lp = torch.log_softmax(logits[0, len(p_ids) - 1:-1].float(), dim=-1)
        scores.append(lp.gather(1, torch.tensor(a_ids, device=device).unsqueeze(1)).sum().item())
    m = max(scores); ps = [math.exp(s - m) for s in scores]; z = sum(ps)
    return [x / z for x in ps]


@torch.no_grad()
def generate(model, tok, text):
    ids = tok(prompt(tok, text), return_tensors="pt", add_special_tokens=False).input_ids.to(device)
    with torch.autocast("cuda", dtype=torch.float16):
        out = model.generate(ids, max_new_tokens=24, do_sample=False, pad_token_id=tok.eos_token_id)
    return tok.decode(out[0, ids.shape[1]:], skip_special_tokens=True).strip().split("\n")[0].strip().strip('"')


norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower()).split()


def word_f1(a, b):
    a, b = norm(a), norm(b)
    common = sum(min(a.count(w), b.count(w)) for w in set(a))
    if not common: return 0.0
    p, r = common / len(a), common / len(b)
    return 2 * p * r / (p + r)


def evaluate(model, tok):
    rows = []
    for e in test:
        if isinstance(e["answers"], list):
            ps = choose(model, tok, e["text"], e["answers"]); i = max(range(len(ps)), key=lambda k: ps[k])
            rows.append({"q": e["question"], "ok": e["answers"][i] == e["answer"], "conf": ps[i]})
        else:
            got = generate(model, tok, e["text"])
            rows.append({"q": e["question"], "ok": norm(got) == norm(e["answer"]), "f1": word_f1(got, e["answer"]), "conf": None, "got": got, "want": e["answer"]})
    by = {}
    for r in rows: by.setdefault(r["q"], []).append(r)
    per = {q: {"n": len(v), "accuracy": round(sum(x["ok"] for x in v) / len(v), 3), **({"wordF1": round(sum(x["f1"] for x in v) / len(v), 3)} if v[0]["conf"] is None else {})} for q, v in sorted(by.items())}
    fixed = [r for r in rows if r["conf"] is not None]
    bins = [[] for _ in range(10)]
    for r in fixed: bins[min(int(r["conf"] * 10), 9)].append(r)
    ece = sum(len(b) / len(fixed) * abs(sum(x["ok"] for x in b) / len(b) - sum(x["conf"] for x in b) / len(b)) for b in bins if b)
    samples = [{"got": r["got"], "want": r["want"]} for r in rows if r["conf"] is None][:8]
    return {"perQuestion": per, "fixedAnswerAccuracy": round(sum(r["ok"] for r in fixed) / len(fixed), 3), "calibrationError": round(ece, 3), "titleSamples": samples}


def evaluate_subset(model, tok, n):
    xs = [e for e in test if isinstance(e["answers"], list)][:n]
    ok = 0
    for e in xs:
        ps = choose(model, tok, e["text"], e["answers"]); ok += e["answers"][max(range(len(ps)), key=lambda k: ps[k])] == e["answer"]
    return round(ok / len(xs), 3)


def export(model, tok, name):
    """Merged model -> GGUF (f16) -> Q4_K_M, with llama.cpp. Output: /kaggle/working/bayani-1-1b-q4_k_m.gguf"""
    import shutil
    from huggingface_hub import snapshot_download
    merged = f"{OUT}/bayani-merged"
    model.save_pretrained(merged, safe_serialization=True)
    # Prove the saved files hold the trained weights: reload from disk and score. If not, write the weights directly.
    def disk_score():
        m2 = AutoModelForCausalLM.from_pretrained(merged, torch_dtype=torch.float16).to(device).eval()
        sc = evaluate_subset(m2, tok, 60); del m2; torch.cuda.empty_cache(); return sc
    sc = disk_score()
    print("reloaded from disk, 60 questions:", sc, flush=True)
    if sc < 0.8:
        from safetensors.torch import save_file
        for f in glob.glob(f"{merged}/*.safetensors") + glob.glob(f"{merged}/*.index.json"): os.remove(f)
        save_file({k: v.detach().contiguous().cpu() for k, v in model.state_dict().items()}, f"{merged}/model.safetensors", metadata={"format": "pt"})
        sc = disk_score()
        print("after writing weights directly:", sc, flush=True)
    results["models"][name]["savedCheck60"] = sc
    json.dump(results, open(f"{OUT}/trained.json", "w"), indent=1)
    src = snapshot_download(name, allow_patterns=["tokenizer*", "special_tokens_map.json", "vocab*", "merges*", "generation_config.json"])
    for f in glob.glob(f"{src}/*"): shutil.copy(f, merged)
    run = lambda *a: subprocess.run(list(a), check=True)
    run("git", "clone", "-q", "--depth", "1", "https://github.com/ggml-org/llama.cpp", "/tmp/llama.cpp")
    run(sys.executable, "-m", "pip", "install", "-q", "/tmp/llama.cpp/gguf-py", "sentencepiece", "protobuf")
    run(sys.executable, "/tmp/llama.cpp/convert_hf_to_gguf.py", merged, "--outfile", "/tmp/bayani-f16.gguf", "--outtype", "f16")
    run("cmake", "-S", "/tmp/llama.cpp", "-B", "/tmp/llama.cpp/build", "-DGGML_NATIVE=OFF", "-DLLAMA_CURL=OFF", "-DCMAKE_BUILD_TYPE=Release")
    run("cmake", "--build", "/tmp/llama.cpp/build", "--target", "llama-quantize", "-j", str(os.cpu_count() or 2))
    q = glob.glob("/tmp/llama.cpp/build/**/llama-quantize", recursive=True)[0]
    run(q, "/tmp/bayani-f16.gguf", f"{OUT}/bayani-1-1b-q4_k_m.gguf", "Q4_K_M")
    print("exported", os.path.getsize(f"{OUT}/bayani-1-1b-q4_k_m.gguf") // 1_000_000, "MB", flush=True)


results = {"train": len(train), "test": len(test), "epochs": EPOCHS, "lr": LR, "models": {}}
for name in MODELS:
    t0 = time.time()
    try:
        tok = AutoTokenizer.from_pretrained(name)
        model = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.float16).to(device)
        model.gradient_checkpointing_enable(); model.enable_input_require_grads()
        model = get_peft_model(model, LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, task_type="CAUSAL_LM",
                                                 target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]))
        for p in model.parameters():
            if p.requires_grad: p.data = p.data.float()
        print(f"training {name}", flush=True)
        fit(model, tok)
        res = evaluate(model, tok)
        results["models"][name] = {**res, "seconds": round(time.time() - t0)}
        # Saving the adapter alone came out empty with this peft/transformers pair (938 bytes, 2026-11-14), so merge it
        # into the model here, check the merged model still scores the same, and export that.
        model = model.merge_and_unload()
        for p in model.parameters(): p.data = p.data.half()
        check = evaluate_subset(model, tok, 60)
        results["models"][name]["mergedCheck60"] = check
        print("merged model, first 60 fixed-answer test questions:", check, flush=True)
        export(model, tok, name)
        del model; torch.cuda.empty_cache()
    except Exception as ex:
        results["models"][name] = {"error": repr(ex)[:400]}
    print(json.dumps({name: results["models"][name]}, indent=1), flush=True)
    json.dump(results, open(f"{OUT}/trained.json", "w"), indent=1)

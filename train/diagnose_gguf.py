"""Where does the training get lost? (diagnostic, CPU only, no retraining)

Uses the merged model saved by the last `bayani-train` run (scored 0.967 after reloading from disk). Converts it to
GGUF with llama.cpp, then scores 60 fixed-answer test questions with llama.cpp's own server here, at f16 and at
Q4_K_M, the same way train/local_check.py does on the Mac. Prints three scores:
  transformers (from disk) vs llama.cpp f16 vs llama.cpp Q4_K_M.
"""
import glob, json, os, subprocess, sys, time, urllib.request, socket

socket.create_connection(("github.com", 443), timeout=5).close()
run = lambda *a: subprocess.run(list(a), check=True)
merged = glob.glob("/kaggle/input/**/bayani-merged/config.json", recursive=True)[0].rsplit("/", 1)[0]
test = [json.loads(l) for l in open(glob.glob("/kaggle/input/**/test.jsonl", recursive=True)[0])]
fixed = [e for e in test if isinstance(e["answers"], list)][:60]
SYSTEM = ("You help a volunteer group remember how its projects usually go. Read the project details and answer the "
          "question with exactly one of the allowed answers, and nothing else.")

run("git", "clone", "-q", "--depth", "1", "https://github.com/ggml-org/llama.cpp", "/tmp/llama.cpp")
run(sys.executable, "-m", "pip", "install", "-q", "/tmp/llama.cpp/gguf-py", "sentencepiece", "protobuf")
run("cmake", "-S", "/tmp/llama.cpp", "-B", "/tmp/b", "-DGGML_NATIVE=OFF", "-DLLAMA_CURL=OFF", "-DCMAKE_BUILD_TYPE=Release")
run("cmake", "--build", "/tmp/b", "--target", "llama-server", "llama-quantize", "-j", str(os.cpu_count() or 2))
binary = lambda n: glob.glob(f"/tmp/b/**/{n}", recursive=True)[0]
run(sys.executable, "/tmp/llama.cpp/convert_hf_to_gguf.py", merged, "--outfile", "/tmp/f16.gguf", "--outtype", "f16")
run(binary("llama-quantize"), "/tmp/f16.gguf", "/kaggle/working/bayani-1-1b-q4_k_m.gguf", "Q4_K_M")


def score(model, chat):
    srv = subprocess.Popen([binary("llama-server"), "-m", model, "--port", "8099", "-c", "2048"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(240):
            try: urllib.request.urlopen("http://127.0.0.1:8099/health", timeout=1); break
            except Exception: time.sleep(0.5)
        ok, got = 0, []
        for e in fixed:
            g = "root ::= " + " | ".join(json.dumps(a) for a in e["answers"])
            if chat:
                body = {"messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": e["text"]}], "temperature": 0, "max_tokens": 8, "grammar": g}
                r = json.load(urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:8099/v1/chat/completions", json.dumps(body).encode(), {"Content-Type": "application/json"})))
                a = r["choices"][0]["message"]["content"].strip()
            else:
                prompt = f"<|endoftext|><|system|>\n{SYSTEM}\n<|user|>\n{e['text']}\n<|assistant|>\n"
                body = {"prompt": prompt, "temperature": 0, "n_predict": 8, "grammar": g}
                a = json.load(urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:8099/completion", json.dumps(body).encode(), {"Content-Type": "application/json"})))["content"].strip()
            ok += a == e["answer"]; got.append(a)
        return round(ok / len(fixed), 3), got[:12]
    finally:
        srv.terminate()


out = {}
for label, path, chat in [("f16 chat", "/tmp/f16.gguf", True), ("f16 raw", "/tmp/f16.gguf", False), ("q4 chat", "/kaggle/working/bayani-1-1b-q4_k_m.gguf", True)]:
    out[label] = score(path, chat)
    print(label, out[label], flush=True)
print("expected first 12:", [e["answer"] for e in fixed[:12]], flush=True)
json.dump(out, open("/kaggle/working/diagnose.json", "w"), indent=1)

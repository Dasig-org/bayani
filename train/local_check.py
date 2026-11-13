"""Try Bayani-1 on this Mac with llama.cpp (the same engine the phone app will use).

  brew install llama.cpp
  python3 train/local_check.py models/bayani-1-1b-q4_k_m.gguf          # 40 test questions
  python3 train/local_check.py models/bayani-1-1b-q4_k_m.gguf 254      # the whole test set

Each answer is held to the question's allowed answers by a grammar, as in the app.
"""
import json, subprocess, sys, time, urllib.request, pathlib, random

model = sys.argv[1] if len(sys.argv) > 1 else "models/bayani-1-1b-q4_k_m.gguf"
n = int(sys.argv[2]) if len(sys.argv) > 2 else 40
SYSTEM = ("You help a volunteer group remember how its projects usually go. Read the project details and answer the "
          "question with exactly one of the allowed answers, and nothing else.")
test = [json.loads(l) for l in open(pathlib.Path(__file__).parent.parent / "data/out/test.jsonl")]
random.Random(1).shuffle(test)
test = test[:n]

PORT = 8099
srv = subprocess.Popen(["llama-server", "-m", model, "--port", str(PORT), "-c", "2048", "--log-disable"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(120):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{PORT}/health", timeout=1); break
        except Exception:
            time.sleep(0.5)

    def ask(e):
        grammar = ("root ::= " + " | ".join(json.dumps(a) for a in e["answers"])) if isinstance(e["answers"], list) else None
        body = {"messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": e["text"]}], "temperature": 0, "max_tokens": 24}
        if grammar: body["grammar"] = grammar
        req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", json.dumps(body).encode(), {"Content-Type": "application/json"})
        return json.load(urllib.request.urlopen(req, timeout=120))["choices"][0]["message"]["content"].strip().strip('"')

    right, t0, shown = 0, time.time(), 0
    for e in test:
        got = ask(e)
        ok = got.lower() == e["answer"].lower()
        right += ok
        if shown < 6:
            print(f"\n{e['text']}\n  Bayani: {got}   expected: {e['answer']}   {'right' if ok else 'wrong'}")
            shown += 1
    secs = time.time() - t0
    print(f"\n{right}/{len(test)} right ({right / len(test):.0%}), {secs / len(test):.2f} s per question on this Mac")
finally:
    srv.terminate()

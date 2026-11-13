"""Export Bayani-1 for running locally and on phones (B38 prep).

Merges the LoRA adapter from the `bayani-train` run into OLMo-2-1B, converts it to GGUF with llama.cpp, and quantizes
it to Q4_K_M (about 1 GB). Output: /kaggle/working/bayani-1-1b-q4_k_m.gguf. CPU is enough; internet must be on.
"""
import glob, os, subprocess, sys, socket

try:
    socket.create_connection(("huggingface.co", 443), timeout=5).close()
except OSError as ex:
    raise SystemExit(f"No internet ({ex}).")
run = lambda *a, **k: subprocess.run(list(a), check=True, **k)
run(sys.executable, "-m", "pip", "install", "-q", "peft>=0.13")
subprocess.run([sys.executable, "-m", "pip", "uninstall", "-y", "-q", "torchao"], check=False)

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE = "allenai/OLMo-2-0425-1B-Instruct"
adapter = (glob.glob("/kaggle/input/**/adapter-OLMo-2-0425-1B-Instruct", recursive=True) or [None])[0]
if not adapter:
    raise SystemExit("adapter not found: attach the bayani-train notebook's output")
W = "/kaggle/working"
merged = "/tmp/bayani-merged"
tok = AutoTokenizer.from_pretrained(adapter)
model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float16)
model = PeftModel.from_pretrained(model, adapter).merge_and_unload()
model.save_pretrained(merged, safe_serialization=True)
tok.save_pretrained(merged)
print("merged", flush=True)

run("git", "clone", "-q", "--depth", "1", "https://github.com/ggml-org/llama.cpp", "/tmp/llama.cpp")
run(sys.executable, "-m", "pip", "install", "-q", "-r", "/tmp/llama.cpp/requirements/requirements-convert_hf_to_gguf.txt")
f16 = "/tmp/bayani-f16.gguf"
run(sys.executable, "/tmp/llama.cpp/convert_hf_to_gguf.py", merged, "--outfile", f16, "--outtype", "f16")
run("cmake", "-S", "/tmp/llama.cpp", "-B", "/tmp/llama.cpp/build", "-DGGML_NATIVE=OFF", "-DLLAMA_CURL=OFF", "-DCMAKE_BUILD_TYPE=Release")
run("cmake", "--build", "/tmp/llama.cpp/build", "--target", "llama-quantize", "-j", str(os.cpu_count() or 2))
q = glob.glob("/tmp/llama.cpp/build/**/llama-quantize", recursive=True)[0]
run(q, f16, f"{W}/bayani-1-1b-q4_k_m.gguf", "Q4_K_M")
print("done", os.path.getsize(f"{W}/bayani-1-1b-q4_k_m.gguf") // 1_000_000, "MB", flush=True)

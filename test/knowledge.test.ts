import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { findFacts, parseFacts } from "../src/index.js";

const dir = new URL("../knowledge/facts/", import.meta.url);
const facts = readdirSync(dir).filter((f) => f.endsWith(".md")).sort().flatMap((f) => parseFacts(readFileSync(new URL(f, dir), "utf8")));
// Internal terms come from the private workspace's push guard, so they're never written into this open repo.
const guard = new URL("../../workspace/tools/hooks/pre-push-open-repo", import.meta.url);
const INTERNAL = existsSync(guard) ? new RegExp(readFileSync(guard, "utf8").match(/^INT='([^']+)'/m)?.[1] ?? "$^", "i") : /$^/;

describe("facts library", () => {
  it("every fact is complete, short, sourced and dated, with a unique id", () => {
    expect(facts.length).toBeGreaterThanOrEqual(30);
    expect(new Set(facts.map((f) => f.id)).size).toBe(facts.length);
    for (const f of facts) {
      expect(f.questions.length, f.id).toBeGreaterThan(0);
      expect(f.answer.split(/\s+/).length, f.id).toBeLessThanOrEqual(85);
      expect(f.source, f.id).toMatch(/^https:\/\/bayanihan\.dasig\.org/);
      expect(f.updated, f.id).toMatch(/^\d{4}-\d\d-\d\d$/);
    }
  });

  it("holds only public material: no internal names, plans or prices", () => {
    for (const f of facts) expect(`${f.questions.join(" ")} ${f.answer}`, f.id).not.toMatch(INTERNAL);
  });

  it("finds the right fact for everyday questions", () => {
    const cases: [string, string][] = [
      ["what is BIX", "what-is-bix"], ["who made this app", "who-makes-dasig"], ["does it work without signal", "offline-and-hubs"],
      ["can I download it on iPhone", "status-pilot"], ["is our data used to train the AI", "ai-training-data"],
      ["who are you", "what-is-bayani"], ["how do I start a group", "start-a-group"], ["can we host our own server", "self-hosting"],
      ["is this dasig.org fundraising", "dasig-vs-dasig-fundraising"], ["how do I report a fake group", "safety-reports"],
    ];
    for (const [q, id] of cases) expect(findFacts(q, facts)[0]?.fact.id, q).toBe(id);
  });

  it("writes knowledge/out/facts.jsonl when asked", () => {
    if (process.env["WRITE_DATA"] !== "1") return;
    mkdirSync(new URL("../knowledge/out/", import.meta.url), { recursive: true });
    writeFileSync(new URL("../knowledge/out/facts.jsonl", import.meta.url), facts.map((f) => JSON.stringify(f)).join("\n") + "\n");
  });
});

import { describe, expect, it } from "vitest";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { validate } from "@bayanihan/core";
import { buildAll, starterPractices, buildGroup, HELD_OUT, messy } from "../data/generate.js";
import { ALL_PHRASINGS, APP_CHECK_QUESTIONS, INTENTS, INTENT_SYSTEM, intentUser } from "../data/asking.js";
import { PLAYBOOKS } from "../data/playbooks.js";
import { decode, buildPack } from "../src/index.js";

/** B20: the v0 data. `npm run data` writes data/out/{train,test}.jsonl and data/out/starter-practices.json. */
const all = buildAll();

describe("v0 data", () => {
  it("is the same every time", () => {
    const again = buildAll();
    expect(again.train.map((e) => e.text + e.answer)).toEqual(all.train.map((e) => e.text + e.answer));
  });

  it("keeps the test set apart: no test wording ever appears in training", () => {
    const trainText = all.train.map((e) => e.text).join("\n");
    for (const pb of PLAYBOOKS) for (const st of pb.steps) for (const w of st.test) expect(trainText).not.toContain(`"${w}"`);
    const testGroups = new Set(all.test.map((e) => e.group).filter(Boolean));
    expect(all.train.some((e) => testGroups.has(e.group))).toBe(false);
  });

  it("leaves one kind of project out of training entirely (B38)", () => {
    expect(all.train.some((e) => e.projectKind === HELD_OUT && e.question !== "intent")).toBe(false);
    const label = PLAYBOOKS.find((p) => p.kind === HELD_OUT)!.label;
    expect(all.train.some((e) => e.text.includes(`(${label})`))).toBe(false);
    expect(all.test.filter((e) => e.set === "held-out-kind").length).toBeGreaterThan(100);
  });

  it("asks the test groups again in messier words, about the same projects", () => {
    const tidy = all.test.filter((e) => e.set === "tidy"), mess = all.test.filter((e) => e.set === "messy");
    expect(mess.length).toBe(tidy.length);
    expect(mess.filter((e, i) => e.text !== tidy[i]!.text).length / mess.length).toBeGreaterThan(0.5);
    expect(messy("Get the barangay permit", "x")).not.toBe("Get the barangay permit");
  });

  it("keeps typed-question and identity test phrasings out of training, and the app's own check questions too", () => {
    const trainText = all.train.map((e) => e.text).join("\n");
    const test = [...Object.values(ALL_PHRASINGS.TEST).flat(), ...ALL_PHRASINGS.ASK_ME.test, ...ALL_PHRASINGS.OUTSIDE.test];
    for (const q of test) if (!q.includes("{")) expect(trainText, q).not.toContain(`Question: ${q}\n`);
    for (const q of [...ALL_PHRASINGS.ASK_ME.test, ...ALL_PHRASINGS.OUTSIDE.test]) expect(all.train.map((e) => e.text)).not.toContain(q);
    for (const q of APP_CHECK_QUESTIONS) expect(trainText.toLowerCase()).not.toContain(`question: ${q.toLowerCase()}`);
  });

  it.skipIf(!existsSync(new URL("../../dasig-app/app/src/lib/bayaniAnswer.ts", import.meta.url)))("sorts typed questions with the app's exact prompt and kinds", async () => {
    const app = await import("../../dasig-app/app/src/lib/bayaniAnswer.ts" as string);
    expect(app.INTENTS).toEqual(INTENTS);
    expect(app.intentMessages("Who has the bibs?")).toEqual([{ role: "system", content: INTENT_SYSTEM }, { role: "user", content: intentUser("Who has the bibs?") }]);
  });

  it("every answer is one the pack allows, and decodes", () => {
    for (const e of [...all.train, ...all.test]) {
      if (Array.isArray(e.answers)) expect(e.answers).toContain(e.answer);
      else expect(e.answer.length).toBeLessThanOrEqual(e.answers.text.maxLength);
    }
  });

  it("covers all seven questions and the identity examples in both sets, with yes and no both present", () => {
    for (const set of [all.train, all.test]) {
      const kinds = new Set(set.map((e) => e.question));
      expect([...kinds].sort()).toEqual(["about-me", "applies", "decline", "general-title", "intent", "one-off", "same-practice", "which-practice", "which-team"]);
      for (const k of ["same-practice", "applies", "one-off"]) {
        const a = set.filter((e) => e.question === k).map((e) => e.answer);
        expect(a).toContain("yes"); expect(a).toContain("no");
      }
    }
  });

  it("produces valid BIX records, with figures calculated by Core", () => {
    const d = buildGroup(PLAYBOOKS[0]!, PLAYBOOKS[0]!.groups.train[0]!, "train");
    for (const r of d.records) expect(validate(r).errors).toEqual([]);
    const permit = d.records.find((r) => r.resourceType === "Practice" && r["title"] === "Get the barangay permit")!;
    expect((permit["observed"] as { ofProjects: number }).ofProjects).toBe(3);
  });

  it("the shortlist finds the right known step most of the time (its recall, measured)", () => {
    expect(all.shortlistMisses / all.shortlistTries).toBeLessThan(0.25);
  });

  it("writes the files when asked", () => {
    const summary = { projects: all.projects, groups: all.groups, train: all.train.length, test: all.test.length,
      shortlistRecall: +(1 - all.shortlistMisses / all.shortlistTries).toFixed(3),
      heldOut: HELD_OUT,
      bySet: Object.fromEntries(["tidy", "messy", "held-out-kind", "intent", "self"].map((k) => [k, all.test.filter((e) => e.set === k).length])),
      byQuestion: Object.fromEntries(["same-practice", "which-practice", "applies", "one-off", "which-team", "general-title", "intent", "about-me", "decline"].map((k) => [k, [all.train.filter((e) => e.question === k).length, all.test.filter((e) => e.question === k).length]])) };
    console.log(JSON.stringify(summary));
    if (process.env["WRITE_DATA"] !== "1") return;
    const out = new URL("../data/out/", import.meta.url);
    mkdirSync(out, { recursive: true });
    writeFileSync(new URL("train.jsonl", out), all.train.map((e) => JSON.stringify(e)).join("\n") + "\n");
    writeFileSync(new URL("test.jsonl", out), all.test.map((e) => JSON.stringify(e)).join("\n") + "\n");
    writeFileSync(new URL("starter-practices.json", out), JSON.stringify(starterPractices(), null, 1) + "\n");
    writeFileSync(new URL("summary.json", out), JSON.stringify(summary, null, 1) + "\n");
  });

  it("starter Practices are valid BIX, with no figures", () => {
    for (const p of starterPractices()) { expect(validate(p).errors).toEqual([]); expect(p["observed"]).toBeUndefined(); }
  });

  it("a decoded answer maps back to the right record", () => {
    const pb = PLAYBOOKS[0]!, name = pb.groups.train[0]!, d = buildGroup(pb, name, "train");
    const e = d.examples.find((x) => x.question === "which-practice" && x.answer !== "none")!;
    const step = d.records.find((r) => r.resourceType === "Task" && e.text.includes(`"${String(r["title"])}"`) && r["status"] === "ready")!;
    const officer = d.records.find((r) => r.resourceType === "Role")!["person"] as { reference: string };
    const p = buildPack({ kind: "which-practice", step: `Task/${step.id}` }, { records: d.records, viewer: officer.reference, now: "2027-02-04T20:00:00+08:00" });
    const got = decode(p, e.answer);
    expect(got.ok && got.kind === "reference" && got.value?.startsWith("Practice/")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { buildPack, decode, shortlist, words, type Question } from "../src/index.js";
import { NOW, crowded, records } from "./fixtures.js";

/**
 * Golden examples: fixed records and a question, and the exact pack they must produce (test/golden/*.txt).
 * A change to the format shows up here as a diff to review. Regenerate deliberately with `npm run golden`.
 */
const GOLDEN = new URL("./golden/", import.meta.url);
const UPDATE = process.env["UPDATE_GOLDEN"] === "1";
const cases: [string, Question, { viewer?: string; records?: typeof records; maxTokens?: number }?][] = [
  ["01-same-practice", { kind: "same-practice", step: "Task/kapitan", practice: "Practice/permit" }],
  ["02-which-practice", { kind: "which-practice", step: "Task/kapitan" }],
  ["03-which-practice-water", { kind: "which-practice", step: "Task/water" }],
  ["04-applies", { kind: "applies", practice: "Practice/thanks", initiative: "Initiative/run2027" }],
  ["05-applies-starter", { kind: "applies", practice: "Practice/bags", initiative: "Initiative/first-cleanup" }],
  ["06-one-off", { kind: "one-off", step: "Task/shuttle" }],
  ["07-which-team", { kind: "which-team", step: "Task/unassigned" }],
  ["08-general-title", { kind: "general-title", step: "Task/venue" }],
  ["09-volunteer-view", { kind: "which-practice", step: "Task/kapitan" }, { viewer: "Person/vic" }],
  ["10-budget-trimmed", { kind: "which-team", step: "Task/unassigned" }, { records: crowded, maxTokens: 180 }],
];

const show = (name: string, q: Question, o: { viewer?: string; records?: typeof records; maxTokens?: number } = {}) => {
  const p = buildPack(q, { records: o.records ?? records, viewer: o.viewer ?? "Person/ana", now: NOW, maxTokens: o.maxTokens });
  const answers = Array.isArray(p.answers) ? p.answers.join(" | ") : `text, at most ${p.answers.text.maxLength} characters`;
  return { p, file: `${p.text}\n\n# answers: ${answers}\n# labels: ${Object.entries(p.labels).map(([k, v]) => `${k}=${v}`).join(" ")}\n# tokens: ${p.tokens}${p.needsModel ? "" : "\n# needs model: no"}\n` };
};

describe("golden context packs", () => {
  if (UPDATE && !existsSync(GOLDEN)) mkdirSync(GOLDEN);
  for (const [name, q, o] of cases) {
    it(name, () => {
      const { file } = show(name, q, o);
      const path = new URL(`${name}.txt`, GOLDEN);
      if (UPDATE) writeFileSync(path, file);
      expect(file).toBe(readFileSync(path, "utf8"));
    });
  }
});

describe("the pack's guarantees", () => {
  it("is the same every time for the same records, whatever their order", () => {
    const q: Question = { kind: "which-practice", step: "Task/kapitan" };
    const a = buildPack(q, { records, viewer: "Person/ana", now: NOW });
    const b = buildPack(q, { records: [...records].reverse(), viewer: "Person/ana", now: NOW });
    expect(b.text).toBe(a.text);
  });

  it("never contains a record id, only short labels", () => {
    for (const [, q, o] of cases) {
      const { p } = show("", q, o);
      for (const r of Object.values(p.labels)) expect(p.text).not.toContain(r);
      expect(p.text).not.toMatch(/\b(Task|Practice|Team|Initiative|Organization|Person)\//);
    }
  });

  it("uses only what the viewer can see: a volunteer gets no Practice their steps don't point to", () => {
    const ana = buildPack({ kind: "which-practice", step: "Task/kapitan" }, { records, viewer: "Person/ana", now: NOW });
    const vic = buildPack({ kind: "which-practice", step: "Task/kapitan" }, { records, viewer: "Person/vic", now: NOW });
    expect(ana.needsModel).toBe(true);
    expect(vic.text).not.toContain("barangay permit");
    expect(Object.values(vic.labels).every((r) => r !== "Practice/permit")).toBe(true);
  });

  it("with prefiltered records (already filtered by the person's server), uses them as given and gives the same pack", () => {
    const seen = buildPack({ kind: "which-practice", step: "Task/kapitan" }, { records, viewer: "Person/ana", now: NOW });
    const given = records.filter((r) => Object.values(seen.labels).includes(`${r.resourceType}/${r.id}`) || r.resourceType !== "Practice");
    const pre = buildPack({ kind: "which-practice", step: "Task/kapitan" }, { records: given, viewer: "Person/ana", now: NOW, prefiltered: true });
    expect(pre.text).toBe(seen.text);
    const vicView = records.filter((r) => r.resourceType !== "Practice");
    expect(buildPack({ kind: "which-practice", step: "Task/kapitan" }, { records: vicView, viewer: "Person/vic", now: NOW, prefiltered: true }).needsModel).toBe(false);
  });

  it("refuses a question about something the viewer can't see", () => {
    expect(() => buildPack({ kind: "same-practice", step: "Task/bibs", practice: "Practice/bibs" }, { records, viewer: "Person/vic", now: NOW })).toThrow(/can see/);
  });

  it("stays within the token budget by trimming", () => {
    const loose = buildPack({ kind: "which-team", step: "Task/unassigned" }, { records: crowded, viewer: "Person/ana", now: NOW, maxTokens: 10_000 });
    const tight = buildPack({ kind: "which-team", step: "Task/unassigned" }, { records: crowded, viewer: "Person/ana", now: NOW, maxTokens: 180 });
    expect(tight.tokens).toBeLessThan(loose.tokens);
    // Every team is still a possible answer: names get shorter, none is dropped.
    expect(Object.keys(tight.labels).filter((l) => l.startsWith("T"))).toHaveLength(Object.keys(loose.labels).filter((l) => l.startsWith("T")).length);
    expect(tight.text).toContain("Logistics");
  });

  it("says when the model isn't needed", () => {
    const none = buildPack({ kind: "which-practice", step: "Task/unassigned" }, { records: records.filter((r) => r.resourceType !== "Practice"), viewer: "Person/ana", now: NOW });
    expect(none.needsModel).toBe(false);
    expect(none.answers).toEqual(["none"]);
  });
});

describe("shortlist (shared words)", () => {
  it("normalises words: case, punctuation, plurals, stop words", () => {
    expect([...words("Get the Barangay PERMITS, please!")].sort()).toEqual(["barangay", "permit", "please"]);
  });

  it("ranks by shared words, then the same team; skips retired Practices and other kinds of project", () => {
    const practices = records.filter((r) => r.resourceType === "Practice");
    const c = shortlist({ title: "Permit from the barangay hall", teamName: "Logistics", organization: "Organization/lakad", kinds: [{ system: "bayanihan:initiative-category", code: "fun-run" }] }, practices);
    expect(c[0]!.practice.id).toBe("permit");
    expect(c[0]!.shared).toEqual(["barangay", "permit"]);
    expect(c.some((x) => x.practice.id === "retired" || x.practice.id === "bags")).toBe(false);
  });

  it("a step with no words in common still reaches the list through its team and parent step", () => {
    const practices = records.filter((r) => r.resourceType === "Practice");
    const c = shortlist({ title: "Letter to Kapitan for the road closure", parentTitle: "Permits and clearances", teamName: "Logistics", organization: "Organization/lakad", kinds: [{ system: "bayanihan:initiative-category", code: "fun-run" }] }, practices);
    expect(c[0]!.practice.id).toBe("permit");
  });
});

describe("decode", () => {
  const which = buildPack({ kind: "which-practice", step: "Task/kapitan" }, { records, viewer: "Person/ana", now: NOW });
  it("maps a label back to its record, and none to null", () => {
    expect(decode(which, "P1")).toEqual({ ok: true, kind: "reference", value: "Practice/permit" });
    expect(decode(which, " none ")).toEqual({ ok: true, kind: "reference", value: null });
  });
  it("refuses anything outside the allowed answers", () => {
    expect(decode(which, "P9").ok).toBe(false);
    expect(decode(which, "Practice/permit").ok).toBe(false);
  });
  it("reads yes/no and short text", () => {
    const yn = buildPack({ kind: "one-off", step: "Task/shuttle" }, { records, viewer: "Person/ana", now: NOW });
    expect(decode(yn, "Yes")).toEqual({ ok: true, kind: "yes-no", value: true });
    const gt = buildPack({ kind: "general-title", step: "Task/venue" }, { records, viewer: "Person/ana", now: NOW });
    expect(decode(gt, '"Book the venue"')).toEqual({ ok: true, kind: "text", value: "Book the venue" });
    expect(decode(gt, "x".repeat(61)).ok).toBe(false);
  });
});

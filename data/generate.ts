import { computeObserved, type BixResource } from "@bayanihan/core";
import { buildPack, type Question } from "../src/index.js";
import { PLAYBOOKS, type Playbook } from "./playbooks.js";

/**
 * Bayani-1 v0 data (B20): invented groups run each kind of project for three years and are planning a fourth.
 * Everything is built from the playbooks, deterministically (a seeded random generator), as BIX records; Core
 * calculates the Practices' figures exactly as the app will; the context pack turns each question into text.
 *
 * The test set is kept apart: different groups, different seeds, and wordings that never appear in training.
 */

export const NOW = "2027-02-04T20:00:00+08:00";
const DAY = 86_400_000;
const CATEGORY = "bayanihan:initiative-category";
const R = (r: string) => ({ reference: r });
const at = (base: string, days: number) => new Date(Date.parse(base) + days * DAY).toISOString().replace(".000Z", "Z");
/** A deterministic UUID for a readable key, so records are valid BIX and the data is the same every run. */
export function uid(key: string): string {
  const h = (n: number) => { let x = 2166136261 ^ n; for (let i = 0; i < key.length; i++) x = Math.imul(x ^ key.charCodeAt(i), 16777619); return (x >>> 0).toString(16).padStart(8, "0"); };
  const a = h(1) + h(2) + h(3) + h(4);
  return `${a.slice(0, 8)}-${a.slice(8, 12)}-4${a.slice(13, 16)}-${"89ab"[parseInt(a[16]!, 16) % 4]}${a.slice(17, 20)}-${a.slice(20, 32)}`;
}
/** Give every record a UUID and rewrite every "Type/key" reference to match. */
function remap(records: BixResource[]): { records: BixResource[]; ref: (r: string) => string } {
  const map = new Map(records.map((r) => [`${r.resourceType}/${r.id}`, `${r.resourceType}/${uid(`${r.resourceType}/${r.id}`)}`]));
  const walk = (x: unknown): unknown => Array.isArray(x) ? x.map(walk)
    : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, k === "reference" && typeof v === "string" ? map.get(v) ?? v : walk(v)]))
    : x;
  return { records: records.map((r) => ({ ...(walk(r) as BixResource), id: uid(`${r.resourceType}/${r.id}`) })), ref: (r) => map.get(r) ?? r };
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const next = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, pick: <T>(xs: T[]) => xs[Math.floor(next() * xs.length)]!, chance: (p: number) => next() < p };
}

export type Example = { id: string; split: "train" | "test"; group: string; projectKind: string; question: Question["kind"]; text: string; answers: string[] | { text: { maxLength: number } }; answer: string };
export type GroupData = { records: BixResource[]; examples: Example[]; shortlistMisses: number; shortlistTries: number; projects: number };

export function buildGroup(pb: Playbook, groupName: string, split: "train" | "test"): GroupData {
  const r = rng(`${split}:${pb.kind}:${groupName}`);
  const g = slug(groupName), org = `Organization/${g}`, officer = `Person/${g}-officer`;
  const wordings = (st: Playbook["steps"][number]) => (split === "train" ? st.train : st.test);
  const records: BixResource[] = [
    { resourceType: "Organization", id: g, meta: { version: 1 }, name: groupName },
    { resourceType: "Role", id: `${g}-officer`, meta: { version: 1 }, person: R(officer), organization: R(org), code: { system: "bayanihan:role", code: "officer" }, status: "active" },
  ];
  const practiceId = (i: number) => `${g}-p${i}`;
  const practices: BixResource[] = pb.steps.map((st, i) => ({
    resourceType: "Practice", id: practiceId(i), meta: { version: 1 }, title: st.title, organization: R(org), status: "active",
    appliesTo: [{ system: CATEGORY, code: pb.kind }], team: st.team, source: "own",
    after: (st.after ?? []).map((t) => R(`Practice/${practiceId(pb.steps.findIndex((x) => x.title === t))}`)),
  }));
  const tasks: BixResource[] = [], initiatives: BixResource[] = [], teams: BixResource[] = [];
  const firstRecorded = new Map<string, string>();
  const project = (year: number, status: string, start: string) => {
    const id = `${g}-${year}`;
    initiatives.push({ resourceType: "Initiative", id, meta: { version: 1 }, title: pb.projectTitle(year), kind: "project", status, organization: R(org),
      category: [{ system: CATEGORY, code: pb.kind }], period: { start } });
    for (const t of pb.teams) teams.push({ resourceType: "Team", id: `${id}-${slug(t)}`, meta: { version: 1 }, name: t, organization: R(org), initiative: R(`Initiative/${id}`), status: "active", participant: [] });
    return id;
  };
  const addTask = (id: string, ini: string, title: string, team: string | null, extra: Record<string, unknown> = {}) => {
    tasks.push({ resourceType: "Task", id, meta: { version: 1 }, intent: "plan", status: "ready", title, partOf: R(`Initiative/${ini}`),
      ...(team ? { team: R(`Team/${ini}-${slug(team)}`), owner: R(`Team/${ini}-${slug(team)}`) } : {}), audience: "organization", ...extra });
  };

  // Three finished years: steps linked to their Practice, some added late, some one-offs.
  const past = [2024, 2025, 2026];
  const pastStart = (y: number) => `${y}-03-0${(y % 3) + 6}T05:00:00Z`;
  const oneOffsSeen: { id: string; ini: string; title: string }[] = [];
  for (const y of past) {
    const ini = project(y, "completed", pastStart(y));
    pb.steps.forEach((st, i) => {
      if (!r.chance(st.rate)) return;
      const id = `${ini}-s${i}`;
      const done = at(pastStart(y), st.day + Math.round((r.next() - 0.5) * 6));
      addTask(id, ini, r.chance(0.5) ? st.title : r.pick(wordings(st)), st.team, { status: "completed", practice: R(`Practice/${practiceId(i)}`), executionPeriod: { start: done } });
      firstRecorded.set(`Task/${id}`, r.chance(st.late ?? 0) ? at(pastStart(y), -3) : at(pastStart(y), Math.min(st.day, 0) - 25));
    });
    const fresh = pb.oneOffs.filter((x) => !oneOffsSeen.some((s) => s.title === x.title));
    if (fresh.length && (y === 2026 || r.chance(0.7))) {
      const o = r.pick(fresh), id = `${ini}-oneoff`;
      // A one-off from an earlier year was kept as a Practice at its close-out; it stays rare ("in 1 of 3").
      const kept = y !== 2026 ? `${g}-kept-${slug(o.title)}` : null;
      if (kept) practices.push({ resourceType: "Practice", id: kept, meta: { version: 1 }, title: o.title, organization: R(org), status: "active",
        appliesTo: [{ system: CATEGORY, code: pb.kind }], team: o.team, source: "own" });
      addTask(id, ini, o.title, o.team, { status: "completed", executionPeriod: { start: at(pastStart(y), o.day) }, ...(kept ? { practice: R(`Practice/${kept}`) } : {}) });
      firstRecorded.set(`Task/${id}`, at(pastStart(y), o.day - 2));
      oneOffsSeen.push({ id, ini, title: o.title });
    }
  }
  // Practices' figures, calculated by Core from the finished years (as the group's server would).
  for (const p of practices) p["observed"] = computeObserved(p, initiatives, tasks, (t) => firstRecorded.get(t), NOW);

  // This year: some usual steps, in new wordings, not yet matched; one one-off; one step with no team.
  const start = at(NOW, 30), cur = project(2027, "active", start);
  const current: { id: string; step: number | null; team: string }[] = [];
  pb.steps.forEach((st, i) => {
    if (!r.chance(0.55)) return;
    const id = `${cur}-s${i}`;
    addTask(id, cur, r.pick(wordings(st)), st.team);
    current.push({ id, step: i, team: st.team });
  });
  const unseen = pb.oneOffs.filter((x) => !oneOffsSeen.some((s) => s.title === x.title));
  if (unseen.length) {
    const o = r.pick(unseen);
    addTask(`${cur}-oneoff`, cur, o.title, o.team);
    current.push({ id: `${cur}-oneoff`, step: null, team: o.team });
  }
  const keptOnes = practices.filter((p) => p.id.includes("-kept-"));
  records.push(...practices, ...initiatives, ...teams, ...tasks);
  const ids = remap(records);

  // Questions with exact answers.
  const examples: Example[] = [];
  let misses = 0, tries = 0;
  const ask = (q: Question, truth: (labels: Record<string, string>) => string | null, recs = records) => {
    const mq = Object.fromEntries(Object.entries(q).map(([k, v]) => [k, k === "kind" ? v : ids.ref(v as string)])) as Question;
    const p = buildPack(mq, { records: remap(recs).records, viewer: officer, now: NOW });
    const ans = truth(p.labels);
    if (ans === null || !p.needsModel) return;
    examples.push({ id: `${split}-${pb.kind}-${g}-${examples.length}`, split, group: groupName, projectKind: pb.kind, question: q.kind, text: p.text, answers: p.answers, answer: ans });
  };
  const labelOf = (labels: Record<string, string>, ref: string) => Object.entries(labels).find(([, v]) => v === ids.ref(ref))?.[0] ?? null;

  for (const c of current) {
    const task = `Task/${c.id}`;
    if (c.step !== null) {
      const truth = `Practice/${practiceId(c.step)}`;
      ask({ kind: "same-practice", step: task, practice: truth }, () => "yes");
      const wrong = practices.filter((p) => `Practice/${p.id}` !== truth && !p.id.includes("-kept-"));
      const near = wrong.find((p) => p["team"] === c.team) ?? r.pick(wrong);
      ask({ kind: "same-practice", step: task, practice: `Practice/${near.id}` }, () => "no");
      tries++;
      ask({ kind: "which-practice", step: task }, (labels) => { const l = labelOf(labels, truth); if (!l) misses++; return l; });
      ask({ kind: "general-title", step: task }, () => pb.steps[c.step!]!.title);
    } else {
      ask({ kind: "which-practice", step: task }, () => "none");
    }
    // Which team: the same step, as if added without a team.
    const without = records.map((x) => (x.resourceType === "Task" && x.id === c.id ? (({ team: _t, owner: _o, ...rest }) => rest as BixResource)(x) : x));
    ask({ kind: "which-team", step: task }, (labels) => labelOf(labels, `Team/${cur}-${slug(c.team)}`), without);
  }
  // Does a usual step this year's plan lacks belong in it? Yes when groups usually have it (at least 6 in 10).
  const have = new Set(current.map((c) => c.step));
  pb.steps.forEach((st, i) => { if (!have.has(i)) ask({ kind: "applies", practice: `Practice/${practiceId(i)}`, initiative: `Initiative/${cur}` }, () => (st.rate >= 0.6 ? "yes" : "no")); });
  // A one-off kept from an earlier year doesn't belong in a new year's plan.
  for (const k of keptOnes) ask({ kind: "applies", practice: `Practice/${k.id}`, initiative: `Initiative/${cur}` }, () => "no");
  // Close-out of last year: was it a one-off? Yes for the one-off; no for a usual step written in other words.
  const last = `${g}-2026`;
  for (const x of oneOffsSeen.filter((x) => x.ini === last)) ask({ kind: "one-off", step: `Task/${x.id}` }, () => "yes");
  const usual = tasks.find((t) => t.id.startsWith(`${last}-s`));
  if (usual) {
    const unmatched = records.map((x) => (x === usual ? (({ practice: _p, ...rest }) => rest as BixResource)(x) : x));
    ask({ kind: "one-off", step: `Task/${usual.id}` }, () => "no", unmatched);
  }
  return { records: ids.records, examples, shortlistMisses: misses, shortlistTries: tries, projects: initiatives.length };
}

export function buildAll() {
  const out = { train: [] as Example[], test: [] as Example[], projects: 0, shortlistMisses: 0, shortlistTries: 0, groups: 0 };
  for (const pb of PLAYBOOKS) {
    const runs: [string, "train" | "test"][] = [...pb.groups.train.map((n) => [n, "train"] as [string, "train"]), [pb.groups.test, "test"]];
    for (const [name, split] of runs) {
      const d = buildGroup(pb, name, split);
      out[split].push(...d.examples);
      out.projects += d.projects; out.shortlistMisses += d.shortlistMisses; out.shortlistTries += d.shortlistTries; out.groups++;
    }
  }
  return out;
}

/** Dasig's starter Practices: the playbooks' usual steps, with no figures, for a group's first project. */
export function starterPractices(): BixResource[] {
  return PLAYBOOKS.flatMap((pb) => pb.steps.map((st, i) => ({
    resourceType: "Practice", id: uid(`starter-${pb.kind}-${i}`), meta: { version: 1 }, title: st.title, organization: R(`Organization/${uid("dasig-starter")}`),
    status: "active", appliesTo: [{ system: CATEGORY, code: pb.kind }], team: st.team, source: "starter",
    after: (st.after ?? []).map((t) => R(`Practice/${uid(`starter-${pb.kind}-${pb.steps.findIndex((x) => x.title === t)}`)}`)),
  })));
}

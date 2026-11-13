import { authorize, type BixResource, type Directory } from "@bayanihan/core";
import { shortlist, type Candidate } from "./shortlist.js";

/**
 * The context pack: the short text Bayani reads for one question, built from BIX records (docs/CONTEXT_PACK.md).
 *
 * - Built only from records the viewer may see (BIX rule 26): Bayani never knows more than its person.
 * - Records get short labels (S1, P1, T1); Bayani answers with a label and `decode` maps it back, so it never writes
 *   or invents a record id.
 * - The same records always give the same text: labels, order and wording are deterministic.
 * - Kept under a token budget (default 600) by trimming in a fixed order.
 */

export type Question =
  | { kind: "same-practice"; step: string; practice: string }
  | { kind: "which-practice"; step: string }
  | { kind: "applies"; practice: string; initiative: string }
  | { kind: "one-off"; step: string }
  | { kind: "which-team"; step: string }
  | { kind: "general-title"; step: string };

export type PackInput = { records: BixResource[]; viewer: string; now: string; maxTokens?: number };

export type Pack = {
  question: Question["kind"];
  text: string;
  /** What Bayani may answer: a fixed list (held to it by a grammar), or short text. */
  answers: string[] | { text: { maxLength: number } };
  /** Label → BIX reference, for decoding the answer. */
  labels: Record<string, string>;
  /** Rough token count (characters / 4). */
  tokens: number;
  /** False when the answer is already known without the model (e.g. no candidates to compare). */
  needsModel: boolean;
};

const TITLE_MAX = 80, GENERAL_TITLE_MAX = 60;
const refOf = (r: BixResource) => `${r.resourceType}/${r.id}`;
const ref = (r: BixResource | undefined, k: string) => (r?.[k] as { reference?: string } | undefined)?.reference;
const str = (x: unknown) => (typeof x === "string" ? x : "");
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const quote = (s: string, n = TITLE_MAX) => `"${clip(s.replace(/\s+/g, " ").trim(), n)}"`;
const kindsText = (cs: unknown) => ((cs as { code?: string }[] | undefined) ?? []).map((c) => (c.code ?? "").replace(/-/g, " ")).filter(Boolean).join(", ");
const DAY = 86_400_000;

function visibleOnly(input: PackInput): Map<string, BixResource> {
  const by = (t: string) => input.records.filter((r) => r.resourceType === t);
  const dir: Directory = { roles: by("Role"), positions: by("Position"), teams: by("Team"), initiatives: by("Initiative"), tasks: by("Task") };
  const out = new Map<string, BixResource>();
  for (const r of input.records) if (authorize(input.viewer, "view", r, dir).allowed) out.set(refOf(r), r);
  return out;
}

/** Walk partOf up to the Initiative a step belongs to. */
function projectOf(step: BixResource, seen: Map<string, BixResource>): BixResource | undefined {
  let at: BixResource | undefined = step;
  for (let i = 0; at && i < 20; i++) {
    const up = ref(at, "partOf");
    const next = up ? seen.get(up) : undefined;
    if (!next) return undefined;
    if (next.resourceType === "Initiative") return next;
    at = next;
  }
  return undefined;
}

function when(project: BixResource, now: string): string {
  if (project["status"] === "completed") return "finished";
  const start = (project["period"] as { start?: string } | undefined)?.start;
  if (!start) return "";
  const d = Math.round((Date.parse(start) - Date.parse(now)) / DAY);
  return d > 1 ? `starts in ${d} days` : d === 1 ? "starts tomorrow" : d === 0 ? "starts today" : `started ${-d} days ago`;
}

function evidence(p: BixResource, withTiming: boolean): string {
  const o = p["observed"] as { included?: number; ofProjects?: number; addedLate?: number; dayFromStart?: { median?: number } } | undefined;
  const bits: string[] = [];
  if (str(p["team"])) bits.push(`usually ${str(p["team"])}`);
  if (o?.ofProjects) {
    bits.push(`in ${o.included ?? 0} of ${o.ofProjects} past projects`);
    if (o.addedLate) bits.push(`added late ${o.addedLate === 1 ? "once" : `${o.addedLate} times`}`);
  } else bits.push(p["source"] === "own" ? "new for this group" : "common for projects like this");
  const m = o?.dayFromStart?.median;
  if (withTiming && m !== undefined) bits.push(m === 0 ? "usually on the day" : `usually ${Math.abs(m)} days ${m < 0 ? "before" : "after"} the start`);
  return bits.join(", ");
}

class Labels {
  map: Record<string, string> = {};
  private n: Record<string, number> = {};
  private back = new Map<string, string>();
  get(prefix: string, reference: string): string {
    const had = this.back.get(reference);
    if (had) return had;
    this.n[prefix] = (this.n[prefix] ?? 0) + 1;
    const label = `${prefix}${this.n[prefix]}`;
    this.map[label] = reference;
    this.back.set(reference, label);
    return label;
  }
}

type Ctx = { seen: Map<string, BixResource>; now: string; labels: Labels; level: number };

function projectLine(c: Ctx, project: BixResource | undefined): string {
  if (!project) return "Project: (none)";
  const kinds = kindsText(project["category"]), w = when(project, c.now);
  return `Project: ${quote(str(project["title"]))}${kinds ? ` (${kinds})` : ""}${w ? `, ${w}` : ""}`;
}

function teamsOf(c: Ctx, project: BixResource | undefined): BixResource[] {
  if (!project) return [];
  const mine = refOf(project);
  return [...c.seen.values()].filter((t) => t.resourceType === "Team" && ref(t, "initiative") === mine && t["status"] !== "ended")
    .sort((a, b) => str(a["name"]).localeCompare(str(b["name"]), "en", { numeric: true }) || a.id.localeCompare(b.id));
}

/** The teams line. When the teams are the possible answers (`allAnswers`), none is ever dropped; names get shorter instead. */
function teamsLine(c: Ctx, teams: BixResource[], allAnswers = false): string {
  const cap = allAnswers ? teams.length : c.level >= 2 ? 8 : 12;
  const len = c.level >= 2 ? 24 : 40;
  const shown = teams.slice(0, cap).map((t) => `${c.labels.get("T", refOf(t))} ${clip(str(t["name"]), len)}`);
  return `Teams: ${shown.length ? shown.join(", ") : "(none)"}${teams.length > cap ? `, and ${teams.length - cap} more` : ""}`;
}

function stepLine(c: Ctx, step: BixResource, withTeam: boolean): string {
  const label = c.labels.get("S", refOf(step));
  const team = c.seen.get(ref(step, "team") ?? "");
  const parent = c.seen.get(ref(step, "partOf") ?? "");
  const bits: string[] = [];
  if (withTeam) bits.push(team ? `team ${c.labels.get("T", refOf(team))} ${clip(str(team["name"]), 40)}` : "no team");
  if (parent && parent.resourceType === "Task") bits.push(`under ${quote(str(parent["title"]), c.level >= 3 ? 50 : TITLE_MAX)}`);
  return `Step ${label}: ${quote(str(step["title"]), c.level >= 3 ? 60 : TITLE_MAX)}${bits.length ? ` (${bits.join(", ")})` : ""}`;
}

function practiceLine(c: Ctx, p: BixResource, withTiming: boolean): string {
  return `${c.labels.get("P", refOf(p))} ${quote(str(p["title"]), c.level >= 3 ? 60 : TITLE_MAX)} (${evidence(p, withTiming)})`;
}

const practices = (c: Ctx) => [...c.seen.values()].filter((r) => r.resourceType === "Practice");

function candidatesFor(c: Ctx, step: BixResource, project: BixResource | undefined, limit: number): Candidate[] {
  const team = c.seen.get(ref(step, "team") ?? "");
  const parent = c.seen.get(ref(step, "partOf") ?? "");
  return shortlist({
    title: str(step["title"]),
    parentTitle: parent?.resourceType === "Task" ? str(parent["title"]) : undefined,
    teamName: team ? str(team["name"]) : undefined,
    organization: ref(project, "organization"),
    kinds: project?.["category"],
  }, practices(c), limit);
}

function need(c: Ctx, reference: string, type: string): BixResource {
  const r = c.seen.get(reference);
  if (!r || r.resourceType !== type) throw new Error(`${reference} isn't a ${type} this person can see`);
  return r;
}

function compose(q: Question, c: Ctx): Omit<Pack, "tokens"> {
  const lines: string[] = [];
  const done = (answers: Pack["answers"], question: string, needsModel = true) => {
    lines.push(`Question: ${question}`);
    return { question: q.kind, text: lines.join("\n"), answers, labels: c.labels.map, needsModel };
  };
  switch (q.kind) {
    case "same-practice": {
      const step = need(c, q.step, "Task"), p = need(c, q.practice, "Practice"), project = projectOf(step, c.seen);
      lines.push(projectLine(c, project), stepLine(c, step, true), `Known step ${practiceLine(c, p, false)}`);
      const s = c.labels.get("S", q.step), pl = c.labels.get("P", q.practice);
      return done(["yes", "no"], `Is ${s} the same kind of step as ${pl}? Answer yes or no.`);
    }
    case "which-practice": {
      const step = need(c, q.step, "Task"), project = projectOf(step, c.seen);
      const cands = candidatesFor(c, step, project, c.level >= 1 ? 3 : 5);
      lines.push(projectLine(c, project), stepLine(c, step, true), "Known steps:");
      for (const k of cands) lines.push(`- ${practiceLine(c, k.practice, false)}`);
      if (!cands.length) lines.push("- (none)");
      const ls = cands.map((k) => c.labels.get("P", refOf(k.practice)));
      return done([...ls, "none"], `Which known step is ${c.labels.get("S", q.step)}? Answer ${[...ls, "none"].join(", ")}.`, cands.length > 0);
    }
    case "applies": {
      const project = need(c, q.initiative, "Initiative"), p = need(c, q.practice, "Practice");
      const teams = teamsOf(c, project);
      const steps = [...c.seen.values()].filter((t) => t.resourceType === "Task" && t["status"] !== "cancelled" && projectOf(t, c.seen) === project)
        .sort((a, b) => str(a["title"]).localeCompare(str(b["title"])) || a.id.localeCompare(b.id));
      const cap = c.level >= 1 ? 4 : 8;
      lines.push(projectLine(c, project), teamsLine(c, teams),
        `Steps so far: ${steps.length}${steps.length ? ` (${steps.slice(0, cap).map((s) => quote(str(s["title"]), 50)).join(", ")}${steps.length > cap ? ", …" : ""})` : ""}`,
        `Usual step ${practiceLine(c, p, true)}`);
      return done(["yes", "no"], `Does ${c.labels.get("P", q.practice)} belong in this project? Answer yes or no.`);
    }
    case "one-off": {
      const step = need(c, q.step, "Task"), project = projectOf(step, c.seen);
      const cands = candidatesFor(c, step, project, 3);
      lines.push(projectLine(c, project), stepLine(c, step, true), "Closest known steps:");
      for (const k of cands) lines.push(`- ${practiceLine(c, k.practice, false)}`);
      if (!cands.length) lines.push("- (none)");
      return done(["yes", "no"], `Was ${c.labels.get("S", q.step)} needed only this once, so not worth keeping for next time? Answer yes or no.`);
    }
    case "which-team": {
      const step = need(c, q.step, "Task"), project = projectOf(step, c.seen), teams = teamsOf(c, project);
      lines.push(projectLine(c, project), teamsLine(c, teams, true), stepLine(c, step, false));
      const ls = teams.map((t) => c.labels.get("T", refOf(t)));
      return done([...ls, "none"], `Which team should own ${c.labels.get("S", q.step)}? Answer ${[...ls, "none"].join(", ")}.`, ls.length > 0);
    }
    case "general-title": {
      const step = need(c, q.step, "Task"), team = c.seen.get(ref(step, "team") ?? "");
      lines.push(stepLine(c, step, false), `Team: ${team ? clip(str(team["name"]), 40) : "(none)"}`);
      return done({ text: { maxLength: GENERAL_TITLE_MAX } },
        `Write a short general name for this kind of step, as a group would reuse it next time: no names of people, places or dates, at most ${GENERAL_TITLE_MAX} characters.`);
    }
  }
}

export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

/** Build the pack for one question, from the records one person may see. */
export function buildPack(q: Question, input: PackInput): Pack {
  const seen = visibleOnly(input);
  const max = input.maxTokens ?? 600;
  let last: Pack | undefined;
  // Trim in a fixed order until it fits: fewer listed steps and candidates, then fewer or shorter team names, then
  // shorter titles. A possible answer is never dropped, so a team question with many teams may stay over budget.
  for (let level = 0; level <= 3; level++) {
    const p = compose(q, { seen, now: input.now, labels: new Labels(), level });
    last = { ...p, tokens: estimateTokens(p.text) };
    if (last.tokens <= max) return last;
  }
  return last!;
}

export type Decoded =
  | { ok: true; kind: "yes-no"; value: boolean }
  | { ok: true; kind: "reference"; value: string | null }
  | { ok: true; kind: "text"; value: string }
  | { ok: false; reason: string };

/** Map Bayani's answer back: yes/no, a BIX reference (or null for "none"), or cleaned short text. */
export function decode(pack: Pack, answer: string): Decoded {
  const a = answer.trim();
  if (!Array.isArray(pack.answers)) {
    const t = a.replace(/^["']|["']$/g, "").replace(/\s+/g, " ").trim();
    if (!t) return { ok: false, reason: "empty answer" };
    if (t.length > pack.answers.text.maxLength) return { ok: false, reason: "answer too long" };
    return { ok: true, kind: "text", value: t };
  }
  const allowed = pack.answers.find((x) => x.toLowerCase() === a.toLowerCase());
  if (!allowed) return { ok: false, reason: `"${a}" isn't one of ${pack.answers.join(", ")}` };
  if (allowed === "yes" || allowed === "no") return { ok: true, kind: "yes-no", value: allowed === "yes" };
  if (allowed === "none") return { ok: true, kind: "reference", value: null };
  return { ok: true, kind: "reference", value: pack.labels[allowed]! };
}

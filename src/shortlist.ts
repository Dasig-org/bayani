import type { BixResource } from "@bayanihan/core";

/**
 * Shortlisting known steps for a new step (decided 2026-11-14): plain shared words, no second model.
 *
 * A group may have a hundred Practices; a small model compares a handful. Code picks them: Practices of the same
 * organization that apply to the project's kind, ranked by words shared with the step and the step it sits under,
 * plus a point for the same team. The team point lets a step with no words in common ("Letter to Kapitan for the road
 * closure" and "Get the barangay permit") still reach the shortlist, and every score can be explained.
 */

const STOP = new Set(("a an and are as at be by for from get got has have in into is it its of on or our the their this to up " +
  "with we us you your do does did done make made set ask").split(" "));

/** Lowercase words, without punctuation, short words and stop words; a trailing "s" is dropped ("permits" = "permit"). */
export function words(text: string | undefined): Set<string> {
  const out = new Set<string>();
  for (const w of (text ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/)) {
    if (w.length < 3 || STOP.has(w)) continue;
    out.add(w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
  }
  return out;
}

export type Candidate = { practice: BixResource; score: number; shared: string[]; sameTeam: boolean };

const refOf = (r: BixResource) => `${r.resourceType}/${r.id}`;
const ref = (r: BixResource | undefined, k: string) => (r?.[k] as { reference?: string } | undefined)?.reference;
const codes = (cs: unknown) => ((cs as { system?: string; code?: string }[] | undefined) ?? []).map((c) => `${c.system ?? ""}|${c.code ?? ""}`);

/**
 * The Practices most likely to be the same kind of step as `step`, best first.
 * `parentTitle` is the title of the step (or project) it sits under; `teamName` the name of its team.
 */
export function shortlist(
  step: { title?: string; parentTitle?: string; teamName?: string; organization?: string; kinds?: unknown },
  practices: BixResource[],
  limit = 5,
): Candidate[] {
  const mine = words(`${step.title ?? ""} ${step.parentTitle ?? ""}`);
  const kinds = new Set(codes(step.kinds));
  const team = (step.teamName ?? "").trim().toLowerCase();
  const out: Candidate[] = [];
  for (const p of practices) {
    if (p["status"] !== "active") continue;
    if (step.organization && ref(p, "organization") !== step.organization) continue;
    const applies = codes(p["appliesTo"]);
    if (kinds.size && applies.length && !applies.some((c) => kinds.has(c))) continue;
    const theirs = words(`${String(p["title"] ?? "")} ${String(p["description"] ?? "").slice(0, 160)}`);
    const shared = [...mine].filter((w) => theirs.has(w)).sort();
    const sameTeam = !!team && String(p["team"] ?? "").trim().toLowerCase() === team;
    const score = shared.length * 2 + (sameTeam ? 1 : 0);
    if (score > 0) out.push({ practice: p, score, shared, sameTeam });
  }
  const seen = (p: BixResource) => ((p["observed"] as { included?: number } | undefined)?.included ?? 0);
  return out
    .sort((a, b) => b.score - a.score || seen(b.practice) - seen(a.practice) || String(a.practice["title"]).localeCompare(String(b.practice["title"])) || refOf(a.practice).localeCompare(refOf(b.practice)))
    .slice(0, limit);
}

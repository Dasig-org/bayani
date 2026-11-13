import type { BixResource } from "@bayanihan/core";

/**
 * Invented sample data for the context-pack golden examples: one running club, three finished fun runs and this
 * year's. No real group or person.
 */
const R = (r: string) => ({ reference: r });
const m = (v = 1) => ({ version: v });
export const ORG = "Organization/lakad";
const run = { system: "bayanihan:initiative-category", code: "fun-run" };
const cleanup = { system: "bayanihan:initiative-category", code: "coastal-cleanup" };

const role = (p: string, code: string): BixResource => ({ resourceType: "Role", id: `role-${p}`, meta: m(), person: R(`Person/${p}`), organization: R(ORG), code: { code }, status: "active" });
const team = (id: string, name: string, ini: string, people: [string, string][] = []): BixResource =>
  ({ resourceType: "Team", id, meta: m(), name, organization: R(ORG), initiative: R(`Initiative/${ini}`), status: "active",
    participant: people.map(([p, r]) => ({ person: R(`Person/${p}`), role: r, status: "active" })) });
const task = (id: string, title: string, partOf: string, teamId?: string, over: Record<string, unknown> = {}): BixResource =>
  ({ resourceType: "Task", id, meta: m(), intent: "plan", status: "ready", title, partOf: R(partOf),
    ...(teamId ? { team: R(`Team/${teamId}`), owner: R(`Team/${teamId}`) } : {}), audience: "team", ...over });
const practice = (id: string, title: string, over: Record<string, unknown> = {}): BixResource =>
  ({ resourceType: "Practice", id, meta: m(3), title, organization: R(ORG), status: "active", appliesTo: [run], source: "own", ...over });
const seen = (included: number, ofProjects: number, addedLate = 0, median?: number) =>
  ({ included, ofProjects, addedLate, ...(median !== undefined ? { dayFromStart: { median, earliest: median - 9, latest: median + 10 } } : {}), basis: [], calculated: "2026-03-10T20:00:00+08:00" });

export const NOW = "2027-02-04T20:00:00+08:00";

export const records: BixResource[] = [
  { resourceType: "Organization", id: "lakad", meta: m(), name: "Lakad Runners" },
  role("ana", "officer"), role("cora", "core-member"), role("vic", "volunteer-episodic"),
  { resourceType: "Initiative", id: "run2027", meta: m(), title: "Fun run 2027", kind: "project", status: "active", organization: R(ORG), category: [run], period: { start: "2027-03-07T05:00:00+08:00" } },
  { resourceType: "Initiative", id: "run2026", meta: m(), title: "Fun run 2026", kind: "project", status: "completed", organization: R(ORG), category: [run], period: { start: "2026-03-08T05:00:00+08:00" } },
  { resourceType: "Initiative", id: "first-cleanup", meta: m(), title: "Our first coastal cleanup", kind: "project", status: "planned", organization: R(ORG), category: [cleanup], period: { start: "2027-02-20T06:00:00+08:00" } },
  team("program", "Program", "run2027"), team("logistics", "Logistics", "run2027", [["vic", "volunteer"]]), team("finance", "Finance", "run2027"),
  team("sponsors", "Sponsors", "run2027"), team("design", "Design", "run2027"),
  team("beach", "Beach crew", "first-cleanup"),
  task("permits", "Permits and clearances", "Initiative/run2027", "logistics"),
  task("kapitan", "Letter to Kapitan for the road closure", "Task/permits", "logistics"),
  task("water", "Water stations at km 3 and km 7", "Initiative/run2027", "logistics"),
  task("bibs", "Print race bibs", "Initiative/run2027", "design"),
  task("logos", "Confirm sponsor logos", "Initiative/run2027", "sponsors"),
  task("venue", "Book the Lahug covered court", "Initiative/run2027", "logistics"),
  task("shuttle", "Book a shuttle from the mall", "Initiative/run2026", undefined, { status: "completed" }),
  task("marshal-water", "Buy water for the marshals", "Initiative/run2027", "finance", { practice: R("Practice/water") }),
  task("unassigned", "Find a sound system for the stage", "Initiative/run2027"),
  practice("permit", "Get the barangay permit", { team: "Logistics", observed: seen(3, 3, 1, -21),
    lesson: [{ text: "Ask the barangay a month ahead.", author: R("Person/ana"), time: "2026-03-10T20:00:00+08:00" }] }),
  practice("marshals", "Brief the marshals", { team: "Program", observed: seen(3, 3, 0, -2) }),
  practice("water", "Set up water stations", { team: "Logistics", observed: seen(3, 3, 0, -1) }),
  practice("venue", "Book the venue", { team: "Logistics", observed: seen(3, 3, 0, -45) }),
  practice("thanks", "Thank the barangay", { team: "Program", observed: seen(2, 3, 0, 5) }),
  practice("bibs", "Print race bibs", { team: "Design", after: [R("Practice/logos")], observed: seen(3, 3, 0, -14) }),
  practice("logos", "Collect sponsor logos", { team: "Sponsors", observed: seen(3, 3, 1, -24) }),
  practice("shuttle", "Book a shuttle", { team: "Logistics", observed: seen(1, 3, 0, -10) }),
  practice("retired", "Fax the city hall", { status: "retired", team: "Logistics" }),
  practice("bags", "Bring trash bags and gloves", { appliesTo: [cleanup], source: "starter", team: "Beach crew" }),
];

/** Many teams and candidates, to exercise the token budget. */
export const crowded: BixResource[] = [
  ...records,
  ...Array.from({ length: 14 }, (_, i) => team(`extra${i}`, `Committee number ${i + 1} with a long descriptive name`, "run2027")),
  ...Array.from({ length: 12 }, (_, i) => practice(`perm${i}`, `Barangay permit variant ${i + 1} for the road closure on race day morning`, { team: "Logistics", observed: seen(1, 3) })),
];

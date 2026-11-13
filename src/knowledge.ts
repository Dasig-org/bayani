const FACT_STOP = new Set("a an and are as at be by for from i in is it its me my of on or our the this to us we you your do does can".split(" "));
/** Words for fact lookup. Lighter than the step shortlist's: question words like "who" and "made" matter here. */
function words(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of text.toLowerCase().replace(/[^a-z0-9\s.-]/g, " ").split(/[\s-]+/)) {
    const t = w.replace(/^\.+|\.+$/g, "");
    if (t.length < 2 || FACT_STOP.has(t)) continue;
    out.add(t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t);
  }
  return out;
}

/**
 * The facts library (knowledge/): short, sourced answers about Dasig, BIX, Bayanihan and Bayani, kept outside the
 * model. Facts change and must be exact, so they're looked up and handed to Bayani (or shown) as written, never
 * trained into the weights. Lookup uses the same shared words as the step shortlist: no second model.
 */
export type Fact = { id: string; questions: string[]; answer: string; source: string; updated: string };

/** Parse one facts file: `## id`, then `Q:` (alternatives separated by |), `A:`, `Source:`, `Updated:`. */
export function parseFacts(markdown: string): Fact[] {
  const out: Fact[] = [];
  for (const block of markdown.split(/^## /m).slice(1)) {
    const [head, ...rest] = block.split("\n");
    const get = (k: string) => rest.find((l) => l.startsWith(`${k}:`))?.slice(k.length + 1).trim() ?? "";
    out.push({ id: head!.trim(), questions: get("Q").split("|").map((q) => q.trim()).filter(Boolean), answer: get("A"), source: get("Source"), updated: get("Updated") });
  }
  return out;
}

export type Found = { fact: Fact; score: number };

/** The facts most likely to answer a question, best first. Question wording counts double. */
export function findFacts(question: string, facts: Fact[], limit = 3): Found[] {
  const mine = words(question);
  return facts
    .map((fact) => {
      const q = words(fact.questions.join(" ")), a = words(fact.answer);
      let score = 0;
      for (const w of mine) score += (q.has(w) ? 2 : 0) + (a.has(w) ? 1 : 0);
      // A question asked exactly as one of the fact's wordings wins.
      const asked = [...mine].sort().join(" ");
      if (asked && fact.questions.some((x) => [...words(x)].sort().join(" ") === asked)) score += 10;
      return { fact, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || x.fact.id.localeCompare(y.fact.id))
    .slice(0, limit);
}

/**
 * Bayani-1's 7th question and its identity and declining examples (B38, B39), built by code like the rest of the data.
 *
 * 1. **Which kind of question is it?** The Dasig app's "Ask Bayani" sorts a typed question into one of a fixed list of
 *    kinds, then works the answer out from the records itself (dasig-app `app/src/lib/bayaniAnswer.ts`). The model is
 *    asked only to choose the kind, under a grammar. The prompt and kinds below must match the app's exactly; a test
 *    checks them against the app when it's checked out next to this repository.
 * 2. **Who it is, and declining** (B39): one stable sentence for who Bayani is, and one for anything outside its
 *    questions, so it never invents facts. Facts about BIX and Dasig stay in the app and its docs, never trained in.
 *
 * Training and test phrasings are written separately; no test phrasing appears in training (checked by a test). The
 * questions in the app's own check (`scripts/bayani-answer-check.ts`) are kept out of training too.
 */
import type { Playbook } from "./playbooks.js";

export const INTENTS = [
  { code: "late", means: "which steps are late or overdue" },
  { code: "needs-people", means: "which steps still need someone, need volunteers or have nobody" },
  { code: "this-week", means: "what to do this week or soon, what's coming up, priorities" },
  { code: "team", means: "a team or committee: who leads it, who is on it, how it is doing" },
  { code: "step", means: "one step or task: who is on it, when it is due, its status" },
  { code: "when-where", means: "when or where the project happens" },
  { code: "progress", means: "how far along it is, how many steps are done, whether it is on schedule" },
  { code: "needs", means: "supplies or things still needed, goods received" },
  { code: "updates", means: "the latest news or updates people posted" },
  { code: "summary", means: "a summary or overview of the project or group" },
  { code: "not-recorded", means: "money, budget, funds raised, expenses, or anything the app doesn't keep" },
  { code: "unknown", means: "anything else, or how to use the Dasig app itself" },
] as const;
export type Intent = (typeof INTENTS)[number]["code"];
export const INTENT_SYSTEM = "You sort a question a volunteer group asks about its project into one kind. Reply with the kind only.";
export const intentUser = (q: string) => `Kinds:\n${INTENTS.map((x) => `${x.code}: ${x.means}`).join("\n")}\n\nQuestion: ${q.trim()}`;

/** The app's own check questions (dasig-app scripts/bayani-answer-check.ts): never trained on. */
export const APP_CHECK_QUESTIONS = ["What should we do this week?", "Who is leading the water team?", "Anything overdue?", "Which steps still need people?",
  "How much money did we raise?", "Who's doing the bibs?", "When is the run?", "Are we on schedule?", "What has the team been saying?",
  "Give me the big picture", "Do we have enough bottles?", "How do I invite someone?", "Is first aid covered?", "Which committee is struggling?"];

/*
 * Phrasings, with slots: {team} a team's name, {step} a step's title in lower case, {thing} a supply, {event} the kind
 * of project. Many are worded so the app's word matching misses them, since those are the ones that reach the model.
 */
type Phrasings = Record<Intent, string[]>;
const TRAIN: Phrasings = {
  late: ["What did we miss?", "Which tasks slipped past their dates?", "Is anything behind?", "What's past due?", "Are we running late on anything?",
    "What should have been finished already?", "Which deadlines did we blow?", "Anything that fell through the cracks?", "Who hasn't delivered on time?", "What is overdue for {team}?"],
  "needs-people": ["Which tasks have nobody assigned?", "Where do we need more hands?", "What still needs a volunteer?", "Who can take {step}? Nobody has it yet",
    "Which jobs are unclaimed?", "What tasks are still open for someone to grab?", "Are there steps without an owner?", "Where are we short on people?", "What can a new volunteer pick up?", "Does {team} need extra help?"],
  "this-week": ["What's next?", "What should I focus on?", "What do we do first?", "What's on our plate the next few days?", "What's urgent right now?",
    "What needs doing before Saturday?", "What are the top priorities?", "Anything due in the coming days?", "What should the core team work on now?", "Plan for the next 7 days?"],
  team: ["Who heads {team}?", "Who is in {team}?", "How is {team} doing?", "Who runs the {team} committee?", "Who are the members of {team}?",
    "Is {team} on top of things?", "Who's the point person for {team}?", "Tell me about {team}", "Which people are with {team}?", "Does {team} have a lead?"],
  step: ["Who has {step}?", "When is {step} due?", "Is {step} done yet?", "What's the status of {step}?", "Who is handling {step}?",
    "Did anyone finish {step}?", "Is someone working on {step}?", "Who took {step}?", "Has {step} been started?", "{step}: who and when?"],
  "when-where": ["What day is the {event}?", "Where are we holding it?", "What's the venue again?", "What time do we start?", "Where do we meet on the day?",
    "Which date did we set?", "How many days until the {event}?", "Where is the {event} happening?", "Is the date final?", "What's the address?"],
  progress: ["How far along are we?", "How much is done?", "Are we on track?", "What percent complete are we?", "How many tasks are finished?",
    "Are we keeping pace?", "How close are we to being ready?", "Status overall?", "How many steps are left?", "Are we ahead or behind overall?"],
  needs: ["Do we have enough {thing}?", "How many {thing} came in?", "What supplies are we still missing?", "What donations have arrived?", "Are we short on {thing}?",
    "What items do we still need to collect?", "How much {thing} did we get?", "What's left on the supply list?", "Did the {thing} arrive?", "What goods are still lacking?"],
  updates: ["Any news?", "What's new?", "What did people post lately?", "Any announcements from the team?", "What happened since yesterday?",
    "What's the latest from {team}?", "Did anyone post something new?", "Catch me up on recent posts", "What have members shared?", "Latest notes?"],
  summary: ["Give me an overview", "Summarize the project", "Quick rundown please", "Brief me on the {event}", "What's this project about?",
    "Sum it all up for me", "Can I get a snapshot of where things are?", "Explain this project in a few lines", "Describe our group's work", "TL;DR of the {event}?"],
  "not-recorded": ["What's our budget?", "How much did we spend?", "How much cash do we have left?", "What did the {thing} cost?", "Did the sponsors pay yet?",
    "How much was donated in pesos?", "What are our expenses so far?", "How much did we collect from registration fees?", "Is there money left for {thing}?", "What's the total cost of the {event}?"],
  unknown: ["How do I add a step?", "How can I change my profile photo?", "Where can I find the settings?", "How do we add a new team?", "Can I use the app offline?",
    "What's the weather on Saturday?", "Tell me a joke", "Write a thank-you letter to our sponsors", "What's the capital of Japan?", "Who won the game last night?",
    "Translate this into Cebuano", "How do I reset my password?", "Who are you?", "What can you do?", "What is BIX?"],
};
const TEST: Phrasings = {
  late: ["Which things are behind schedule?", "anything we forgot to do on time", "What's lagging?"],
  "needs-people": ["Any task that no one has volunteered for?", "where are we understaffed", "Which steps lack a person?"],
  "this-week": ["What's on deck for the next few days?", "what needs attention first", "Upcoming deadlines?"],
  team: ["Who's in charge of {team}?", "how's {team} holding up", "Members of {team}?"],
  step: ["Is anyone assigned to {step}?", "when do we need {step} done", "{step} status?"],
  "when-where": ["What's the schedule for the {event} day?", "where's it gonna be", "Remind me of the date"],
  progress: ["How complete is the plan?", "are we close to done", "What share of the tasks is finished?"],
  needs: ["Still lacking any {thing}?", "how many {thing} were donated", "What do we still have to gather?"],
  updates: ["Anything new from the members?", "what's been posted today", "Recent announcements?"],
  summary: ["Can you give me the gist?", "short summary of where we are", "Overview of the {event}?"],
  "not-recorded": ["How much funding do we have?", "what did we pay for the {thing}", "Total expenses?"],
  unknown: ["How do I leave a group?", "recommend a good restaurant", "Write a poem about volunteering", "is there a dark mode"],
};
const THINGS = ["water bottles", "rice", "chairs", "tarpaulins", "gloves", "sacks", "medicines", "t-shirts", "snacks", "tables"];

export type AskExample = { id: string; split: "train" | "test"; set: string; group: string; projectKind: string; question: "intent" | "about-me" | "decline"; system?: string; text: string; answers: string[] | { text: { maxLength: number } }; answer: string };

/** Typed questions, in the app's format, from the trained kinds' teams and steps; a few made messy like real typing. */
export function intentExamples(split: "train" | "test", playbooks: Playbook[], messy: (w: string, seed: string) => string): AskExample[] {
  const out: AskExample[] = [];
  const phrasings = split === "train" ? TRAIN : TEST;
  const copies = split === "train" ? 3 : 1;
  for (const { code } of INTENTS) {
    phrasings[code].forEach((p, i) => {
      for (let c = 0; c < copies; c++) {
        const pb = playbooks[(i + c * 2 + code.length) % playbooks.length]!;
        const step = pb.steps[(i * 3 + c) % pb.steps.length]!.title;
        const fill = p.replaceAll("{team}", pb.teams[(i + c) % pb.teams.length]!).replaceAll("{step}", step.charAt(0).toLowerCase() + step.slice(1))
          .replaceAll("{thing}", THINGS[(i + c) % THINGS.length]!).replaceAll("{event}", pb.label);
        const key = `${split}-intent-${code}-${i}-${c}`;
        // In training, one copy in three is messy; in the test set, every other phrasing.
        const q = (split === "train" ? c === 2 : i % 2 === 1) ? messy(fill, key) : fill;
        out.push({ id: key, split, set: "intent", group: "", projectKind: pb.kind, question: "intent", system: INTENT_SYSTEM, text: intentUser(q), answers: INTENTS.map((x) => x.code), answer: code });
      }
    });
  }
  return out;
}

/** B39: who Bayani is, in one stable sentence, and one for declining. Under the judgment questions' system prompt. */
export const ABOUT_ME = "I'm Bayani-1, the small model in the Dasig app. I answer a few fixed questions about a group's projects from its own records.";
export const DECLINE = "I can't answer that. I only answer a few fixed questions about a group's projects from its own records.";
const ASK_ME = {
  train: ["Who are you?", "What are you?", "Introduce yourself", "What's your name?", "Are you ChatGPT?", "Which model are you?", "What do you do?", "Who made you?"],
  test: ["Tell me about yourself", "what kind of AI are you", "Are you a person?"],
};
const OUTSIDE = {
  train: ["What is the population of Cebu City?", "When was Rotary founded?", "Write a sponsorship letter for our fun run", "What is BIX?", "How much does a barangay permit cost?",
    "Who is the mayor of Cebu?", "Give me a recipe for arroz caldo", "What's the best time to hold a beach cleanup?", "Explain photosynthesis", "What does Dasig cost?",
    "Tell me a joke", "What's today's news?", "Summarize the rules of basketball", "What medicines should a medical mission bring?", "Write a Facebook post for our event",
    "What is the phone number of the Red Cross?", "How many volunteers does a typical fun run need?", "Translate 'thank you' into Japanese"],
  test: ["Who founded JCI?", "write an invitation letter for our speakers", "What's the exchange rate today?", "How long should a tutoring session be?"],
};
export function selfExamples(split: "train" | "test", messy: (w: string, seed: string) => string): AskExample[] {
  const text = { text: { maxLength: 140 } };
  const mk = (question: "about-me" | "decline", qs: string[], answer: string) => qs.flatMap((q, i) => {
    const variants = split === "train" ? [q, messy(q, `${question}-${i}`)] : [i % 2 ? messy(q, `t-${question}-${i}`) : q];
    return variants.map((v, k) => ({ id: `${split}-${question}-${i}-${k}`, split, set: "self", group: "", projectKind: "", question, text: v, answers: text, answer }));
  });
  return [...mk("about-me", ASK_ME[split], ABOUT_ME), ...mk("decline", OUTSIDE[split], DECLINE)];
}
export const ALL_PHRASINGS = { TRAIN, TEST, ASK_ME, OUTSIDE };

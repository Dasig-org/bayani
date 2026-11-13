# Facts: BIX, Bayanihan Core and Bayanihan Server

## what-is-bix
Q: What is BIX? | What does BIX stand for? | What is the Bayanihan Information Exchange?
A: BIX, the Bayanihan Information Exchange, is an open standard for the work volunteer groups do: who is doing what, for whom, where, and whether it really happened. Any app that speaks BIX can read and write the same records, so a group can change apps or run its own server without losing its history. BIX is not an app.
Source: https://bayanihan.dasig.org/docs/bix
Updated: 2026-11-14

## bix-status
Q: Is BIX finished? | What version is BIX? | Does the government use BIX?
A: BIX is a v0.1 draft, shaped in conversations with the groups in the pilot. It isn't a government system and no LGU uses it today; it's built so an LGU or agency could set a shared goal and see which groups contribute.
Source: https://bayanihan.dasig.org/docs/bix
Updated: 2026-11-14

## bix-inspiration
Q: Where does BIX come from? | Is BIX based on FHIR? | Why is BIX like FHIR?
A: BIX takes its pattern from HL7 FHIR, the standard health care uses to share records: resources, references, lifecycles, extensions, bundles and a REST API. Civic Interconnect's CAE and CEP give it a classification of civic things and a way to export confirmed work. BIX is not affiliated with or endorsed by HL7.
Source: https://bayanihan.dasig.org/docs/bix
Updated: 2026-11-14

## bix-governance
Q: Who owns BIX? | Who decides what goes into BIX? | Can I contribute to BIX?
A: BIX is developed by Dasig Inc. and shaped by the pilot groups, who are credited as contributors with their permission. It's open to contribution, and as organizations join it is to be governed together with them. Dasig is one app built on BIX; it is meant to have others.
Source: https://bayanihan.dasig.org/docs/bix
Updated: 2026-11-14

## bix-everyday-words
Q: What are the main parts of BIX? | What does BIX call a committee? | What is an Initiative or a Task?
A: In everyday words: your group is an Organization; a committee is a Team; a project, program or Saturday session is an Initiative; what you still lack is a Need; what someone will give is an Offer; a job someone says yes to is a Task; the logbook of who did what is Provenance; a report you owe is a Report.
Source: https://bayanihan.dasig.org/docs/bix
Updated: 2026-11-14

## bix-how-it-works
Q: How does BIX work? | What are the main ideas of BIX?
A: Everything is a record with a permanent ID, and records point to each other: a job belongs to a project, a project to a group. Anyone can suggest; a person with the right role decides. Report numbers are counted from confirmed work, not typed. Your group decides who sees what, the people you serve are counted, never named, and you can take all your records with you.
Source: https://bayanihan.dasig.org/docs/bix
Updated: 2026-11-14

## proposals
Q: Can volunteers suggest work? | Can the AI change my records? | What is a proposal?
A: Anyone in a group can suggest work or an edit, and so can Bayani if the group turns it on. A suggestion stays a draft until someone with the right role accepts it, and every change records who suggested it and who confirmed it. A suggestion made against an old version is marked outdated and never applied.
Source: https://bayanihan.dasig.org/docs/bix
Updated: 2026-11-14

## what-is-core
Q: What is Bayanihan Core? | What does the rules engine do?
A: Bayanihan Core is the engine that enforces BIX: it checks every change against BIX's rules, such as who may make it, what can come next and who confirmed it, and it counts report figures and votes. The same code runs on the phone and on the server.
Source: https://bayanihan.dasig.org/about
Updated: 2026-11-14

## what-is-server
Q: What is Bayanihan Server? | Where are my group's records stored?
A: Bayanihan Server is the reference BIX server, like HAPI for FHIR. It stores a group's records and answers the BIX API. It runs inside the Dasig app, on a hub phone, or on your own machine.
Source: https://bayanihan.dasig.org/about
Updated: 2026-11-14

## self-hosting
Q: Can we run our own server? | Can an LGU host its own data? | What do I need to self-host?
A: Yes, with the first open-source release. An LGU, federation, school or network of chapters can run its own Bayanihan Server, keep its records on its own machine, and still list its groups on the Dasig Ecosystem if it wants. It needs a small Linux server (1 GB of memory is enough for many groups), Docker, S3-compatible storage for backups and a domain name.
Source: https://bayanihan.dasig.org/docs/self-hosting
Updated: 2026-11-14

# Contributing

Thank you for helping. Bayani is young and shaped with the volunteer groups that use Dasig.

- **Talk first for anything big.** Open an issue describing the problem before writing a large change.
- **Small pull requests** with a clear description and tests where code changes.
- **Plain language** in anything a coordinator or volunteer reads. No jargon, short sentences.
- **Privacy is part of the design.** People served are counts, never names; small numbers are hidden in public; photos of children never leave the group. Changes that weaken this won't be merged.
- **Examples use fictional groups** (for instance "Lahug Uplands Runners Club"), never real people or real groups' data.

By contributing you agree your contribution is licensed under this repository's licence.

**For Bayani specifically:** never add real groups' projects to `data/` or `test/`, and never train on the held-out test set. Changes to the model's questions or the context pack need the golden examples regenerated (`npm run golden`) and the reason in the pull request.

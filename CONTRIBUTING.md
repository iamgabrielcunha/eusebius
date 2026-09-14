# Contributing to Eusebius

## Before you start

Read `docs/00-vision-and-requirements.md` (what it is and is not) and `docs/01-decision-log.md` (why it is built the way it is). Every contribution must fit the architecture.

## How contributions work

All changes arrive as pull requests. The core team reviews all PRs before anything is merged. There is no in-app editing.

## AI transparency policy

We see AI as a tool — the same way C++ or Python is a tool. It has its place, and using it well is a skill. That said, we prefer you use the gift God gave you: your brain. Think first. Use AI to assist, not to replace your own reasoning and judgement.

AI-assisted contributions are allowed and welcome. There is no shame in using AI tools (GitHub Copilot, Claude, ChatGPT, etc.) to write code, draft data entries, or produce other content. But it must be disclosed.

**What disclosure looks like:**

- In your PR description, include an `## AI usage` section listing:
  - Which tool(s) you used (e.g. "Claude Sonnet 4.6 via Claude Code")
  - What you used it for (e.g. "generated the initial YAML structure for the entity file", "suggested the TypeScript types for the loader")
  - What you reviewed or changed afterwards
- If an entire file was AI-generated and lightly edited, say so.
- If you used AI only for autocomplete or minor suggestions, a single sentence is enough.

PRs with AI-assisted content will receive an `ai-assisted` label. This is a transparency flag, not a quality judgement. AI-assisted PRs go through exactly the same review process as any other.

**For data specifically:** the `ai_suggested` status already exists in the pipeline (see below). AI-generated claims and relationships must enter as `ai_suggested` and cannot become `verified` without a human reviewer taking an explicit action.

## The status pipeline

Every claim, relationship and source carries a `status` field. The pipeline is:

```
ai_suggested → under_review → verified
                           → disputed
                           → deprecated
```

- `ai_suggested` — produced by an AI tool. Never renders as ordinary content.
- `under_review` — submitted for human review; visible with a badge.
- `verified` — a human has checked the claim against a fetched source and marked it verified.
- `disputed` — a verified claim with a credible competing interpretation on record.
- `deprecated` — superseded; kept for provenance.

**An AI-produced claim cannot become `verified` without a human action recorded in the audit log.**

## The sourcing rule

A citation exists only when the source was actually retrieved and the relevant passage captured. Specifically:

- For a URL or DOI: the connector must have fetched it and stored the retrieved-at timestamp and the captured passage.
- For a printed book: a page reference and a typed excerpt are required; the source is marked `inspected-offline`.
- A source that was found but not retrieved is stored as `discovered` and may not be used as evidence for a `verified` claim.

## Data format

- One YAML file per entity under `data/<subtype>/`.
- All human-readable fields are language-keyed maps: `label: {en: "…", pt-BR: "…"}`.
- Every claim includes: `model`, `value`, `precision`, `confidence`, `basis`, `status`, `evidence`.
- Every relationship includes: `type`, `explanation`, `strength`, `evidence_direction`, `status`.
- Run `make validate` before opening a pull request. The loader will reject files with missing required fields.

## Developer Certificate of Origin

By contributing you certify that:

1. The contribution was created in whole or in part by you and you have the right to submit it under the open-source licence indicated in the file; or
2. The contribution is based upon previous work that is covered under an appropriate open-source licence and you have the right to submit that work with modifications.

Add `Signed-off-by: Your Name <email>` to your commit message.

## Licence compatibility

Input data must be CC0, CC BY, public domain, or otherwise compatible with CC BY-SA 4.0 (D-001). If you are unsure, ask before submitting. Non-commercial media (CC BY-NC-*) may not be stored in this repository — link or embed from the institution instead (D-017).

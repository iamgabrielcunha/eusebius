# Eusebius

A citation-first research environment that places the biblical narrative, world history, theology, archaeology and science on a shared chronological framework — and traces every claim to its evidence.

> The timeline tells you **when**. The map tells you **where**. The graph tells you **what it connects to**. The library tells you **why we believe it**.

Named after Eusebius of Caesarea, whose *Chronicon* was the first serious attempt to synchronise biblical and world history on a single axis.

---

## What it is

Eusebius is not a Bible app with a timeline bolted on. It is a knowledge graph with four navigational frameworks — time, place, relation, evidence — built on one strict rule: **no bare claims**. Every date, relationship and assertion carries a model, a confidence level, a basis, a status, and a link to the source that was actually retrieved and read.

Where reputable positions differ, we show them, name them, and say what evidence each uses. Catholic, Orthodox and the major Protestant traditions sit side by side. Competing chronologies — Masoretic, Septuagint, Samaritan — can be switched live. AI-generated suggestions are quarantined from verified facts and stay that way until a human reviewer acts.

**What version 1 covers:**
- The Assyrian crisis to the return, c. 750–520 BC — the best-attested period in the Old Testament, exercising the full evidence-analysis system against Sennacherib's prism, the Lachish reliefs, the Babylonian Chronicle and the Cyrus Cylinder.
- The doctrine of justification — from Romans and Galatians through Augustine, Luther, Trent, Calvin and the Westminster and 1689 confessions.
- The Genesis 5 and 11 chronology engine — deriving dates from Masoretic offsets anchored to 586 BC, with LXX and Samaritan switching.

---

## Stack

| Layer | Technology |
|---|---|
| Web app | Next.js (App Router) + TypeScript |
| Package manager | pnpm (workspaces) |
| Database | PostgreSQL 16 + pgvector |
| Timeline | PixiJS + D3 |
| Graph | Cytoscape.js |
| IIIF viewer | OpenSeadragon |

### Monorepo layout

```
apps/
  web/           Next.js app
packages/
  chronology/    date-computation engine
  loader/        YAML validator and Postgres loader
  connectors/    DOI/URL fetch; one folder per institution
  api/           public read API
data/            YAML entity files — the source of truth
schemas/         JSON Schema for every core concept
docs/            vision, decisions, roadmap, project map
tools/           importers, coverage reports, checks
```

---

## Getting started

**Prerequisites:** Node 20+, pnpm 9+, PostgreSQL 16.

```bash
# Install dependencies
pnpm install

# Start the dev server
make dev

# Validate data files and load into Postgres
make build-data

# Run tests
make test
```

---

## Status

See [`STATUS.md`](STATUS.md) for what's built, what's next, and how to resume a session.

## Contributing

We are a team. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request — it covers the data format, the status pipeline, and the AI transparency policy.

The short version on AI: we see AI as a tool, the same way C++ or Python is a tool. Use it if it helps. But we prefer you use the gift God gave you — your brain. Think first, reach for AI second. And whatever you used, disclose it in your PR.

---

## Licence

- **Code:** Apache-2.0 — see [`LICENSE`](LICENSE)
- **Data and written content:** CC BY-SA 4.0 — see [`LICENSE-DATA`](LICENSE-DATA)

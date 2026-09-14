@AGENTS.md

# Eusebius — Claude Code conventions

## What this project is

A citation-first Bible and world-history research platform. Read `docs/00-vision-and-requirements.md` before touching any code or data.

## Architecture in one sentence

YAML files in `data/` are the source of truth → `tools/load.ts` validates and loads them into PostgreSQL → Next.js app in `apps/web/` reads Postgres.

## Non-negotiable rules

1. **Never write a bare date or relationship on an entity.** Everything goes through the Claim schema. See `docs/00-vision-and-requirements.md` §8 and D-006.
2. **Never mark a claim `verified` in code or data.** Only a human reviewer does that, manually, after checking a fetched source. It cannot be automated.
3. **Never store a citation without a fetched source.** See D-016 and the sourcing rule in CONTRIBUTING.md.
4. **All human-readable strings are language maps** — `{en: "…", "pt-BR": "…"}`. Never a bare string in a data field.
5. **Confidence display always shows** the numeric badge (0–100), the gradient, and the plain-language status label ("verified" / "theorised"). See D-019.
6. **Relationships carry `evidence_direction`** — record which direction of a connection is evidenced and which is inferred. See D-019.

## AI usage in this project

AI tools are welcome. All AI-assisted contributions must be disclosed in the PR description (tool used, what it produced, what was reviewed). See CONTRIBUTING.md for the full policy. When generating data, always set `status: ai_suggested` — never `verified`.

## Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Package manager:** pnpm
- **Database:** PostgreSQL 16 + pgvector
- **Timeline rendering:** PixiJS + D3 (Stage 4)
- **Graph:** Cytoscape.js (Stage 5)
- **IIIF viewer:** OpenSeadragon (Stage 8)

## Commands

```bash
make dev          # start Next.js dev server
make build-data   # validate data/ and load into Postgres
make test         # run all tests
```

## Directory layout

```
docs/        Phase 1 documents — vision, decisions, roadmap, project map
schemas/     JSON Schema for every core concept
data/        YAML entity files — the canon
packages/
  chronology/  engine (Stage 2)
  loader/      validate + build (Stage 1)
  connectors/  one folder per institution; DOI/URL fetch (Stage 6)
  api/         public read API (Stage 9)
apps/
  web/         Next.js app
tools/       importers, coverage reports, checks
```

## Current stage

**Stage 0 complete.** Next: Stage 1 — Data model (JSON Schemas and loader).

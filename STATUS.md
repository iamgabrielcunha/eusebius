# Eusebius — Where We Left Off

**Date:** 15 September 2026
**Repo:** https://github.com/iamgabrielcunha/eusebius (public)
**Branch:** `main` (Stage 1 merged via PR #1, fast-forward, branch deleted)

---

## What's done

### Stage 0 — Complete
Repo, licences, docs, Next.js scaffold, pnpm workspace, Makefile, PostgreSQL 16 + pgvector via Homebrew.

### Stage 1 — Complete
- **Schemas** (`schemas/`, 26 files, JSON Schema draft 2020-12): every §8 concept, cross-referenced by `$id`. Invariants from D-003, D-006, D-007, D-008, D-012, D-013, D-016, D-017, D-019 encoded mechanically. `schemas/README.md` lists what is deferred.
- **Language-map convention** — `docs/04-language-map-convention.md`. `en` required, `original` sibling, exempt fields, three worked examples, a test that keeps the doc's schema fragment identical to the real schema.
- **Loader** — `packages/loader/src/` + `tools/load.ts`. Reads `data/**/*.yaml`, validates by directory, resolves every `{ref}`/`{claim}`, applies cross-file rules (only `inspected` sources may be cited — D-016), loads 11 normalised PostgreSQL tables (JSONB for language maps and claim values), prints a report (counts per subtype/status/model, orphans, dangling refs). `make validate`, `make build-data`, `make test`; exits non-zero on any error.
- **Example data** (`data/`, 16 files): Hezekiah, Sennacherib's campaign of 701 BC, Lachish (Pleiades 687951, Wikidata Q848509), Isaiah 36 (OSIS `Isa.36`, `NARRATES`), the book of Isaiah (two competing `COMPOSED_AT` positions), justification (Reformed + Catholic Views), both traditions, the Taylor Prism (Evidence Analysis, British Museum link only), one tier-1 inspected source (ORACC RINAP 3 Sennacherib 022, fetched and captured), one public-domain Commons photo, plus Model A, Model B, one AssumptionSet, the 586 BC Anchor, one Offset. No claim is `verified`; unfetched facts are `ai_suggested` with empty evidence.
- **Tests** — `packages/loader/test/`, 101 tests total: 55 schema fixtures, loader rejection cases (missing `basis`, evidence citing a `discovered` source, missing `evidence_direction`, bare-string language map, dangling ref, id/filename mismatch), the sixteen examples validate and load, SQL queries by model and by status.
- **D-020** (`docs/01-decision-log.md`) records the five Stage 1 conventions settled during the build: model-independent attribute/View claims, snake_case enums, `inspection_method` alongside `inspection_status`, `COMPOSED_AT` targeting a claim, and the loader's connectedness rule. §8, CONTRIBUTING and `schemas/README.md` were updated to match.
- Project rules moved from `CLAUDE.md` into `AGENTS.md` (a tool-neutral filename, below the Next.js-managed block) since the repo welcomes any AI tool per `CONTRIBUTING.md`; `CLAUDE.md` is now a one-line `@AGENTS.md` pointer, kept only because Claude Code requires that exact filename to auto-load.

**Verify Stage 1 still holds:**
```bash
brew services start postgresql@16   # if not already running
pnpm install
make validate     # 16 file(s) read, 0 errors, 0 dangling
make build-data   # loads into the local `eusebius` database
make test         # Test Files 5 passed, Tests 101 passed
```

---

## What's next — Stage 2: Chronology engine

**Goal:** turn the Offset chains, Anchors and AssumptionSets that Stage 1 defined but does not compute into an engine that produces actual dates. Right now Model A dates in `data/people/hezekiah.yaml` and `data/events/sennacherib-campaign-701.yaml` are hand-estimated placeholders — their `derivation` fields say outright that they wait on this engine.

**Inputs:** Stage 1 schemas; MT, LXX, SP numbers for Genesis 5 and 11; Exodus 12:40 variants; 1 Kings 6:1; Thiele's regnal data for the divided kingdom; anchors (586 BC, 853 BC).

**Three open decisions** (same brainstorming process as Stage 1 — run the `brainstorming` skill first):
1. Internal time representation. Roadmap recommends float years, astronomical numbering, precision as a separate field; the render-space transform belongs to the timeline (Stage 4), not the engine.
2. Deep-time representation (log-scaled coordinate) — out of scope for the MVP slice, but the engine's number type must not preclude it later.
3. How the engine's output distinguishes "not placed" from "roughly placed" (D-011).

**Five tasks (roadmap `docs/02-roadmap.md`, Stage 2):**
1. Implement offset chains, anchors and AssumptionSets as executable computations.
2. Propagate precision through a chain — uncertainty accumulates as offsets stack, it doesn't vanish.
3. Build an agreement report: for a given span, do Model A and Model B agree, and by how much.
4. Tests against known results: MT reproduces Ussher-consistent dates within a stated tolerance; LXX shifts the antediluvian chain by ~600 years and the postdiluvian chain by ~700–800 years; toggling early/late Exodus moves only the affected span.
5. Document every assumption the engine exposes, for the future assumptions panel (Stage 4).

**Output:** `packages/chronology/` (currently a stub with no test) becomes real, with tests and a written table of creation, flood, Abraham, Exodus and temple dates under MT, LXX and SP with the assumption that produced each.

**Risks called out in the roadmap:** off-by-one and inclusive/exclusive counting errors in regnal years; treating Ussher as the only possible Masoretic reconstruction rather than one reconstruction among several.

**Dependencies:** Stage 1 (met).

---

## Key rules to never break

1. No bare dates or relationships on an entity — everything goes through the Claim schema (D-006).
2. Never mark a claim `verified` in code or data — only a human reviewer does that manually.
3. Never store a citation without a fetched source (D-016).
4. All human-readable strings are language maps: `{en: "…", "pt-BR": "…"}` (D-004).
5. Relationships carry `evidence_direction` (D-019).
6. Enum values are snake_case; `COMPOSED_AT` targets a claim, not an entity (D-020).

Full detail: `AGENTS.md` at the repo root (project rules for any AI tool) and `docs/01-decision-log.md` (every decision with its reasoning).

---

## To resume with Claude

Open Claude Code in the repo directory (`~/eusebius`, already connected to GitHub) and say:

> "We're building Eusebius. Stage 1 is merged. Read STATUS.md and let's start Stage 2."

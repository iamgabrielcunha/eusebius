# Stage 1 — Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** JSON Schemas for every §8 concept, a language-map convention, a YAML → PostgreSQL loader with a report, ten hand-written example entities, and tests that prove the loader rejects what §8 and the decision log forbid.

**Architecture:** `data/**/*.yaml` is the canon. `tools/load.ts` is a thin CLI over `packages/loader/src/`, which reads YAML, validates each file against the JSON Schema chosen by its directory, resolves every `{ref: …}` and `{claim: …}` link, applies cross-file rules (D-016), loads normalised tables into PostgreSQL 16, and prints a report. Claims are embedded in entity files; IDs are `type/slug` plus an immutable UUIDv4; every cross-reference is an object `{ref: …}` so the loader finds links mechanically.

**Tech Stack:** TypeScript on Node 26 (native `.ts` execution, ESM), Ajv 8 (draft 2020-12) + ajv-formats, `yaml`, `pg`, Vitest, pnpm workspaces, PostgreSQL 16.

**Spec:** Gabriel's Stage 1 brief (the task message of 15 Sep 2026), `docs/00-vision-and-requirements.md` §8, decisions D-004…D-008, D-011…D-013, D-016, D-017, D-019 in `docs/01-decision-log.md`, Stage 1 of `docs/02-roadmap.md`, "Data format" in `CONTRIBUTING.md`. The three open decisions were settled in chat on 15 Sep 2026 (see "Settled decisions" below).

## Global Constraints

- A schema that contradicts a §8 definition is wrong. Deviations are reported as proposed doc amendments, never silently applied.
- Claim requires `model`, `value`, `precision`, `confidence`, `basis`, `status`, `evidence`, `why_uncertain` (D-006, D-008).
- `status` enum: `ai_suggested`, `under_review`, `verified`, `disputed`, `deprecated` (D-003). No example file may contain `verified`.
- Relationship requires `type`, `explanation`, `strength`, `evidence_direction`, `status` (D-019). `ANCESTOR_OF` carries `telescoped` (D-013). `NARRATES` and `COMPOSED_AT` are distinct types (D-012).
- Source requires `tier` 1–6 and `inspection_status` ∈ {`discovered`, `inspected`} (D-016). Evidence may only cite an `inspected` source.
- Media requires `licence`, `copyright_status`, `attribution`, `relevance`, `nature` (D-017). NC/ND/restricted media must be `storage: linked`.
- Artefact requires an `evidence_analysis` on the six-level scale (§8).
- Dates: astronomical year as a float, with a separate `precision` field. Model A dates are computed (anchor + offsets), never typed-in absolutes (D-007).
- Every human-readable field is a language map with `en` required (D-004).
- Every fact in an example file is a claim needing a source. No fetched source → `status: ai_suggested`, `evidence: []`. Never invent a reference.
- Smallest schema the ten examples need. Anything deferred is listed in `schemas/README.md`.
- `make validate` = validation only; `make build-data` = full pipeline; `make test` = Vitest. All exit non-zero on any error.
- Commits go on branch `stage-1-data-model`, one commit per task, with DCO sign-off (`git commit -s`).

## Settled decisions (from brainstorming, 15 Sep 2026)

1. **Claim attachment.** Embedded. Each entity file has `claims:` and `relationships:` lists. Each claim has a local `id` slug; global key is `<entity id>#<claim id>`. A relationship lives in its subject's file. Concept Views are claims of `kind: view`. Overflow files are deferred.
2. **ID scheme.** `id: <singular subtype>/<slug>`, file at `data/<plural dir>/<slug>.yaml`. `uuid` is a random v4 written once. All links are `{ref: <id>}`; claim links are `{claim: <entity id>#<claim id>}` (or `#<claim id>` for a claim in the same file).
3. **Reference schemes.** `external_ids` map; `osis` (required on Passage), `pleiades` (numeric string), `wikidata` (`Q\d+`) are pattern-checked; other keys free-form.

Defaults: `precision` ∈ {day, month, year, decade, century, era, not_assessed, not_applicable}; `confidence` ∈ {high, medium, low, not_assessed}; `evidence_direction` ∈ {source_to_target, target_to_source, both, neither}; six-level scale shared by Evidence and Artefact analysis.

## File structure

```
schemas/
  README.md                       what each schema is; deferred items; enum ↔ doc spelling map
  language-map.schema.json        $defs: language-map, original-term, bcp47
  date.schema.json                $defs: year, precision, absolute, range, computed, date-value
  ref.schema.json                 $defs: ref, claim-ref, id, slug, uuid
  evidence.schema.json            Evidence + $defs/level (six-level scale)
  claim.schema.json               Claim (kinds: date, attribute, view)
  relationship.schema.json        Relationship
  entity.base.schema.json         shared entity fields
  person / group / event / place / period / passage / work / concept / tradition /
  artefact / technology / source / media / language / term  (.schema.json each)
  chronological-model.schema.json
  assumption-set.schema.json
  anchor.schema.json
  offset.schema.json
docs/04-language-map-convention.md
packages/loader/
  package.json  tsconfig.json  vitest.config.ts
  src/types.ts        LoaderError, LoadedFile, Report, PipelineResult
  src/schemas.ts      loadSchemas(schemasDir) → Ajv; DIRECTORY_SCHEMA map
  src/read.ts         readDataFiles(dataDir) → LoadedFile[]
  src/validate.ts     validateFiles(files, ajv) → LoaderError[]  (schema + id/dir + uuid uniqueness)
  src/refs.ts         collectRefs(files) → Ref[]; resolveRefs(files) → LoaderError[] (dangling)
  src/rules.ts        crossFileRules(files) → LoaderError[]  (D-016 inspected-only; ref type constraints)
  src/db.ts           DDL, ensureDatabase(), loadIntoPostgres(files, url)
  src/report.ts       buildReport(files) ; formatReport(report)
  src/index.ts        runPipeline(options) → PipelineResult
  test/               Vitest specs + fixtures/
tools/load.ts         CLI: parses --validate-only, calls runPipeline, prints, exits
data/
  models/chronological-models/{a-biblical-literal,b-conventional-historical}.yaml
  models/assumption-sets/mt-early-exodus-thiele.yaml
  models/anchors/fall-of-jerusalem-586.yaml
  models/offsets/hezekiah-reign-length.yaml
  people/hezekiah.yaml   events/sennacherib-campaign-701.yaml   places/lachish.yaml
  passages/isa-36.yaml   works/isaiah.yaml   concepts/justification.yaml
  traditions/reformed.yaml   artefacts/taylor-prism.yaml   sources/<slug>.yaml   media/<slug>.yaml
```

Directory → schema map (loader): `people→person`, `groups→group`, `events→event`, `places→place`, `periods→period`, `passages→passage`, `works→work`, `concepts→concept`, `traditions→tradition`, `artefacts→artefact`, `technologies→technology`, `sources→source`, `media→media`, `languages→language`, `terms→term`, `models/chronological-models→chronological-model`, `models/assumption-sets→assumption-set`, `models/anchors→anchor`, `models/offsets→offset`. ID prefix is the singular schema name (`model/` for chronological-model, `assumption-set/`, `anchor/`, `offset/`).

---

### Task 1: JSON Schemas in `schemas/`

**Goal.** A schema for every §8 concept, compiled in Ajv strict mode, with the invariants encoded mechanically.
**What changes.** 27 new files under `schemas/`, a `packages/loader` package skeleton (deps only, needed to compile schemas in a test), and one test.
**Verification.** `pnpm --filter @eusebius/loader test` compiles every schema and checks a positive and a negative fixture per invariant.

**Files:**
- Create: everything under `schemas/` listed above; `packages/loader/package.json`, `tsconfig.json`, `vitest.config.ts`; `packages/loader/test/schemas.test.ts`; `packages/loader/test/fixtures/schema-cases/*.yaml`.
- Modify: `pnpm-workspace.yaml` (no change needed; `packages/*` already included).

**Interfaces:**
- Produces: schema `$id`s of the form `https://github.com/iamgabrielcunha/eusebius/schemas/<name>.schema.json`. Task 3 loads them by file and picks by directory.

- [ ] **Step 1: Package skeleton**

`packages/loader/package.json`:
```json
{
  "name": "@eusebius/loader",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "validate": "node ../../tools/load.ts --validate-only",
    "load": "node ../../tools/load.ts",
    "test": "vitest run"
  },
  "dependencies": { "ajv": "^8.17.1", "ajv-formats": "^3.0.1", "pg": "^8.13.1", "yaml": "^2.6.0" },
  "devDependencies": { "@types/node": "^22", "@types/pg": "^8.11.10", "typescript": "^5.6", "vitest": "^2.1" }
}
```
Run `pnpm install` at the repo root. Verify Node 26 runs a `.ts` file natively: `node -e "console.log(process.versions.node)"` then `node packages/loader/src/types.ts` (empty file) exits 0.

- [ ] **Step 2: Write the failing schema test**

`packages/loader/test/schemas.test.ts` — loads every `schemas/*.schema.json` into an Ajv 2020 instance (`strict: true`, `allErrors: true`, ajv-formats), asserts each compiles, then for each fixture in `test/fixtures/schema-cases/` (front-matter `schema:` and `expect: valid|invalid`, `error_contains:`) validates and asserts. Fixture cases (one YAML each):
  - `claim-missing-basis` → invalid, error contains `basis`
  - `claim-bad-status` → invalid (`status: confirmed`)
  - `claim-model-a-absolute-year` → invalid (Model A value with `method: absolute`) — encoded by `if model.ref == model/a-biblical-literal then value.method == computed`
  - `relationship-missing-evidence-direction` → invalid
  - `relationship-ancestor-without-telescoped` → invalid; `relationship-ancestor-telescoped` → valid
  - `relationship-composed-at-entity-target` → invalid (must target a claim); `relationship-narrates-claim-target` → invalid
  - `source-tier-7` → invalid; `source-discovered` → valid; `source-inspected-no-retrieved-at` → invalid
  - `media-nc-stored` → invalid; `media-cc-by-stored` → valid; `media-missing-attribution` → invalid
  - `artefact-no-analysis` → invalid; `artefact-bad-level` → invalid
  - `language-map-bare-string` → invalid (`label: Hezekiah`); `language-map-missing-en` → invalid; `language-map-ok` → valid
  - `passage-missing-osis` → invalid; `place-bad-pleiades` → invalid (`pleiades: abc`); `place-bad-wikidata` → invalid
  - `date-range-open` → valid; `date-precision-bad` → invalid
  - `concept-without-view` → invalid
  - `entity-bad-uuid` → invalid; `entity-id-wrong-shape` → invalid

Run: `pnpm --filter @eusebius/loader test` — Expected: FAIL (schemas missing).

- [ ] **Step 3: Write the shared definitions**

`language-map.schema.json`:
```json
{ "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://github.com/iamgabrielcunha/eusebius/schemas/language-map.schema.json",
  "$defs": {
    "bcp47": { "type": "string", "pattern": "^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$" },
    "language-map": {
      "type": "object", "required": ["en"],
      "properties": { "en": { "type": "string", "minLength": 1 } },
      "propertyNames": { "$ref": "#/$defs/bcp47" },
      "additionalProperties": { "type": "string", "minLength": 1 } },
    "original-term": {
      "type": "object", "required": ["text", "lang", "script"],
      "properties": { "text": {"type":"string","minLength":1}, "lang": {"$ref":"#/$defs/bcp47"},
        "script": {"type":"string","pattern":"^[A-Z][a-z]{3}$"}, "transliteration": {"type":"string"} },
      "additionalProperties": false } } }
```
`ref.schema.json` `$defs`: `slug` `^[a-z0-9][a-z0-9-]*$`; `id` `^(person|group|event|place|period|passage|work|concept|tradition|artefact|technology|source|media|language|term|model|assumption-set|anchor|offset)/[a-z0-9][a-z0-9-]*$`; `uuid` `format: uuid`; `ref` `{type: object, required: [ref], properties: {ref: {$ref: #/$defs/id}}, additionalProperties: false}`; `claim-ref` `{required: [claim], properties: {claim: {pattern: "^(<id>)?#[a-z0-9][a-z0-9-]*$"}}}`.
`date.schema.json` `$defs`: `year` `{type: number}`; `precision` enum; `absolute` `{method: const absolute, year}`; `range` `{method: const range, earliest?, latest?}` with `anyOf` requiring one; `computed` `{method: const computed, anchor: ref, chain: [{offset: ref, direction: forward|backward}] minItems 1}` (required anchor; chain optional so a bare anchor offset of 0 is expressible), plus optional `offset_years: number` for a direct anchor offset; `date-value` `oneOf` of the three.

- [ ] **Step 4: Evidence, Claim, Relationship**

`evidence.schema.json`: `$defs/level` enum `[demonstrates, strongly_supports, consistent_with, may_suggest, debated, cannot_establish]`; Evidence object `required: [source, locator, captured_passage, demonstrates]`; `source: ref`; `locator: string`; `captured_passage: {text: string, lang: bcp47}`; `demonstrates: level`; `note?: language-map`; `additionalProperties: false`.

`claim.schema.json`: required `[id, kind, model, value, precision, confidence, basis, status, evidence, why_uncertain]`; `kind` enum `[date, attribute, view]`; `property` string slug (required when kind ≠ view via `if/then`); `model: oneOf [ref, const "model-independent"]`; `assumption_set?: ref`; `value`: `if kind==date then value: date-value`, `if kind==view then value: {tradition: ref, summary: language-map, key_texts?: [ref]}`, `if kind==attribute then value: oneOf [language-map, number, ref, boolean]`; `precision` enum; `confidence` enum; `basis` enum `[biblical_text, archaeology, radiometric, documentary, tradition, scholarly_consensus, minority_view, speculation, narrative_sequence, traditional, not_assessed]`; `status` enum; `evidence: array of Evidence`; `why_uncertain: language-map`; `attributed_to?: [ref]`; `notes?: language-map`. Rules: `if status==verified then evidence.minItems 1`; `if model.ref == model/a-biblical-literal then value.method == computed` (date kind only); `if kind==date then model is a ref` (not model-independent).

`relationship.schema.json`: required `[type, target, explanation, strength, evidence_direction, status, evidence]`; `id?: slug`; `type` enum `[PARENT_OF, SPOUSE_OF, ANCESTOR_OF, NARRATES, COMPOSED_AT, PARTICIPATED_IN, TOOK_PLACE_AT, LOCATED_IN, PART_OF, MEMBER_OF, RULED, AUTHORED, ATTESTS, DEPICTS, DISCUSSES, ADHERES_TO, CONTEMPORARY_OF]`; `target: oneOf [ref, claim-ref]`; `strength` enum `[direct, strongly_supported, interpretive, speculative]`; `evidence_direction` enum; `telescoped` enum `[no, possible, certain]`; `why_uncertain?: language-map`; `evidence: [Evidence]`. Rules: `if type==ANCESTOR_OF then required telescoped`; `if type==COMPOSED_AT then target has claim`; `if type != COMPOSED_AT then target has ref`.

- [ ] **Step 5: entity.base and the fifteen subtypes**

`entity.base.schema.json`: required `[id, uuid, type, label]`; `id`, `uuid` from ref defs; `type` string; `label`, `summary?` language-map; `original?: original-term`; `aliases?: [language-map]`; `external_ids?: {osis?: string pattern OSIS, pleiades?: "^[0-9]+$", wikidata?: "^Q[0-9]+$", additionalProperties: string}`; `claims?: [Claim]`; `relationships?: [Relationship]`; `notes?: language-map`. OSIS pattern: `^[1-4]?[A-Z][A-Za-z]+(\.[0-9]+(\.[0-9]+)?)?(-[1-4]?[A-Z][A-Za-z]+(\.[0-9]+(\.[0-9]+)?)?)?$`.
Each subtype: `allOf: [{$ref: entity.base}, {properties: {type: {const: "<name>"}, id: {pattern: "^<name>/"}, …extras}, required: […]}]`, `unevaluatedProperties: false`. Extras:
  - person, group (`group_kind?` enum people/tribe/civilisation/institution), event, technology, tradition (`parent?: ref`): none required.
  - place: `geometry?: {type: Point, coordinates: [lon, lat]}`.
  - period: required `authority: ref` (PeriodO: per-authority).
  - passage: required `external_ids` with required `osis`; required `work: ref`.
  - work: `work_kind?` enum.
  - concept: required `summary`; `claims` must `contains` `{properties: {kind: {const: view}}}`.
  - artefact: required `evidence_analysis: [{level, statement: language-map, evidence?: [Evidence]}] minItems 1`; `find_context?: language-map`; `custody?: {holder: language-map, accession_number?: string, url?: uri}`.
  - source: required `tier` (integer 1–6), `inspection_status`, `source_type` enum `[book, chapter, article, website, database_record, edition, manuscript]`, `locator: {url?: uri, doi?: string, isbn?: string, pages?: string}`; `original_language?: bcp47`; `authors?: [string]`; `year?: integer`; `retrieved_at?: date-time`; `inspection_method?: fetched|offline`; `captured_passages?: [{locator, text, lang}]`. Rule: `if inspection_status==inspected then required [retrieved_at, captured_passages] and captured_passages.minItems 1`.
  - media: required `media_type` enum `[image, video, model_3d, map, audio]`, `licence` enum `[CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, CC-BY-NC-4.0, CC-BY-NC-SA-4.0, CC-BY-ND-4.0, CC-BY-NC-ND-4.0, public-domain, all-rights-reserved, other]`, `copyright_status` enum `[public_domain, copyrighted, unknown]`, `attribution: string`, `relevance` enum `[high, medium, low]`, `nature` enum `[primary_evidence, artistic_interpretation]`, `storage` enum `[stored, linked]`, `url: uri`; `depicts?: [ref]`; `licence_url?: uri`; `rights_holder?: string`. Rule: `if licence not in [CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, public-domain] then storage == linked`.
  - language: required `bcp47`; term: required `original`, `language?: ref`, `gloss?: language-map`.

- [ ] **Step 6: Chronology schemas**

`chronological-model`: required `[id, uuid, label, description]`, `default_assumption_set?: ref`. `assumption-set`: required `[id, uuid, label, model, parameters]`; `parameters` object with optional known keys `numbers` (MT|LXX|SP), `exodus` (early|late), `sojourn` (egypt_only|including_canaan), `coregencies` (on|off), `regnal_method` (string), additionalProperties string. `anchor`: required `[id, uuid, label, year, precision, confidence, basis, status, evidence, why_uncertain]`. `offset`: required `[id, uuid, label, from, to, variants, precision, confidence, basis, status, evidence, why_uncertain]`; `from`/`to`: `{entity: ref, moment: string}`; `passage: ref`; `variants: {MT?: number, LXX?: number, SP?: number}` minProperties 1; `unit: const years`.

- [ ] **Step 7: Run the schema test until green**

Run: `pnpm --filter @eusebius/loader test` — Expected: PASS, every fixture behaves as declared.

- [ ] **Step 8: `schemas/README.md`** — one line per schema; enum spelling map (`narrative_sequence` ↔ D-011 `narrative-sequence`; `inspected` + `inspection_method: offline` ↔ CONTRIBUTING `inspected-offline`); deferred list (overflow files; time-varying Place geometry; Interpretation as a distinct schema — represented by `attributed_to` + interpretive basis; `schema_version`; DateRange as a standalone entity — represented as `method: range`; Group membership over time; media IIIF manifests).

- [ ] **Step 9: Commit** `git add schemas packages/loader pnpm-lock.yaml && git commit -s -m "Stage 1 / Task 1: JSON Schemas for every §8 concept"`

---

### Task 2: `docs/04-language-map-convention.md`

**Goal.** A contributor can write a correct language map without reading the schema.
**Verification.** The JSON fragment in the doc is byte-identical to `schemas/language-map.schema.json`'s `language-map` def (checked by a small Vitest that reads the doc's fenced block and deep-equals it), and the three YAML examples in the doc validate.

- [ ] **Step 1: failing test** `test/convention-doc.test.ts`: extracts the ```` ```json ```` block tagged `<!-- schema-fragment -->` and the three ```` ```yaml ```` blocks tagged `<!-- example: <schema> -->`; asserts deep-equal and validity. Run → FAIL (doc missing).
- [ ] **Step 2: write the doc.** Sections: Rule; keys (`en` required; other BCP 47 keys optional; `pt-BR` spelling); `original` sibling (`text`, `lang`, `script` ISO 15924, `transliteration`); exempt fields (ids, uuids, enums, URLs/DOIs, dates and numbers, `attribution` credit lines, author names, accession numbers, `captured_passage` verbatim quotations which carry their own `lang`); three worked YAML examples (a Person label with Hebrew original; a Concept view summary in en + pt-BR; a Term with Greek original and transliteration); the exact schema fragment; what the loader says when it rejects.
- [ ] **Step 3: run test** → PASS.  **Step 4: Commit** `docs: language-map convention (D-004)`.

---

### Task 3: Loader (`packages/loader/src`, `tools/load.ts`) — TDD

**Goal.** `make validate` and `make build-data` work end-to-end and exit non-zero on any error.
**Verification.** Rejection tests (b)–(f) from the brief pass; `make validate` on a fixture set prints the report; `make build-data` populates Postgres.

**Interfaces (Produces):**
```ts
// src/types.ts
export interface LoaderError { file: string; path: string; message: string; rule: 'schema'|'id'|'uuid'|'ref'|'evidence-source'|'ref-type'|'io' }
export interface LoadedFile { file: string; dir: string; schema: string; doc: any }
export interface Report { entitiesBySubtype: Record<string,number>; claimsByStatus: Record<string,number>; claimsByModel: Record<string,number>;
  orphans: string[]; dangling: {file:string; path:string; target:string}[]; errors: LoaderError[] }
export interface PipelineOptions { dataDir: string; schemasDir: string; validateOnly: boolean; databaseUrl?: string }
export interface PipelineResult { ok: boolean; report: Report }
export function runPipeline(o: PipelineOptions): Promise<PipelineResult>
```
`tools/load.ts`: `--validate-only` flag; `DATABASE_URL` default `postgres://localhost:5432/eusebius`; prints `formatReport`; `process.exit(ok ? 0 : 1)`.

- [ ] **Step 1: Invoke `superpowers:test-driven-development`.** Write `test/loader-rejections.test.ts` with fixtures under `test/fixtures/`:
  - `missing-basis/` (b): one person with a claim lacking `basis` → error with `file` ending `people/x.yaml` and `path` containing `/claims/0` and message containing `basis`.
  - `discovered-source/` (c): source with `inspection_status: discovered`, an event whose claim cites it → error rule `evidence-source`, message names the source id.
  - `missing-evidence-direction/` (d) → error path `/relationships/0`, message contains `evidence_direction`.
  - `bare-string-label/` (e): `label: Hezekiah` → message contains `label` and `object`.
  - `dangling-ref/` (f): relationship target `{ref: person/nobody}` → `report.dangling[0].target == 'person/nobody'` and `ok == false`.
  Run → FAIL (module not found).
- [ ] **Step 2: `read.ts`** — recursive walk of `dataDir`, `.yaml`/`.yml`, `yaml.parse`; YAML syntax error → `LoaderError{rule:'io'}`; `dir` = path relative to dataDir without filename.
- [ ] **Step 3: `schemas.ts`** — `DIRECTORY_SCHEMA` map above; `loadSchemas()` adds every `schemas/*.schema.json` to Ajv (`strict: true`, `allErrors: true`, formats); `schemaFor(dir)`; unknown directory → error.
- [ ] **Step 4: `validate.ts`** — for each file: Ajv validate; map each Ajv error to `LoaderError{file, path: instancePath, message: ajv.errorsText([e]) + missingProperty hint}`; check `id` prefix matches schema's singular name and slug matches filename; collect uuids, error on duplicate. For language-map failures, produce the friendlier message `"<path>: expected a language map {en: …}, got a bare string"` when `error.keyword==='type'` and the schema ref ends with `language-map`.
- [ ] **Step 5: `refs.ts`** — `collectRefs`: depth-first walk; any object with exactly key `ref` → entity ref; any object with key `claim` → claim ref (expand `#x` to `<file id>#x`). `resolveRefs`: index of ids (entities + model files) and of claim keys; return dangling list + LoaderErrors.
- [ ] **Step 6: `rules.ts`** — (1) every Evidence `source` must resolve to a `source/` entity with `inspection_status: inspected` (D-016); (2) typed refs: `passage.work → work/`, `period.authority → source/`, `claim.model → model/`, `claim.assumption_set → assumption-set/`, `computed.anchor → anchor/`, `chain[].offset → offset/`, `view.tradition → tradition/`, `assumption-set.model → model/`.
- [ ] **Step 7: `report.ts`** — counts per subtype (from `type`), per claim status, per model; orphans = entities (not sources/media/model files) with no relationship in or out; `formatReport` prints a plain table then `ERRORS (n):` lines as `file:path — message`.
- [ ] **Step 8: `index.ts` + `tools/load.ts`** — run read → validate → refs → rules; stop before DB if errors or `validateOnly`. Run rejection tests → PASS.
- [ ] **Step 9: `db.ts`** — `ensureDatabase(url)` connects to `postgres` db and `CREATE DATABASE` if missing; `loadIntoPostgres(files, url)` in one transaction: `DROP TABLE IF EXISTS … CASCADE` for all tables, then DDL, then inserts. DDL:
```sql
CREATE TABLE chronological_models (id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, label jsonb NOT NULL, description jsonb NOT NULL, doc jsonb NOT NULL);
CREATE TABLE assumption_sets (id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, model_id text NOT NULL REFERENCES chronological_models(id), label jsonb NOT NULL, parameters jsonb NOT NULL, doc jsonb NOT NULL);
CREATE TABLE anchors (id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, label jsonb NOT NULL, year double precision NOT NULL, precision text NOT NULL, confidence text NOT NULL, basis text NOT NULL, status text NOT NULL, why_uncertain jsonb NOT NULL, doc jsonb NOT NULL);
CREATE TABLE offsets (id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, label jsonb NOT NULL, variants jsonb NOT NULL, precision text NOT NULL, confidence text NOT NULL, basis text NOT NULL, status text NOT NULL, why_uncertain jsonb NOT NULL, doc jsonb NOT NULL);
CREATE TABLE entities (id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, type text NOT NULL, label jsonb NOT NULL, summary jsonb, original jsonb, external_ids jsonb NOT NULL DEFAULT '{}', file text NOT NULL, doc jsonb NOT NULL,
  CONSTRAINT entities_type_chk CHECK (type IN ('person','group','event','place','period','passage','work','concept','tradition','artefact','technology','source','media','language','term')));
CREATE INDEX entities_type_idx ON entities (type);
CREATE INDEX entities_external_ids_idx ON entities USING gin (external_ids);
CREATE TABLE sources (entity_id text PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE, tier smallint NOT NULL CHECK (tier BETWEEN 1 AND 6), inspection_status text NOT NULL CHECK (inspection_status IN ('discovered','inspected')), source_type text NOT NULL, retrieved_at timestamptz, locator jsonb NOT NULL, original_language text);
CREATE TABLE media (entity_id text PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE, media_type text NOT NULL, licence text NOT NULL, copyright_status text NOT NULL, attribution text NOT NULL, relevance text NOT NULL, nature text NOT NULL, storage text NOT NULL, url text NOT NULL);
CREATE TABLE claims (id text PRIMARY KEY, entity_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE, local_id text NOT NULL, position int NOT NULL, kind text NOT NULL, property text, model_id text REFERENCES chronological_models(id), assumption_set_id text REFERENCES assumption_sets(id), value jsonb NOT NULL, precision text NOT NULL, confidence text NOT NULL, basis text NOT NULL, status text NOT NULL, why_uncertain jsonb NOT NULL, attributed_to jsonb, doc jsonb NOT NULL,
  CONSTRAINT claims_status_chk CHECK (status IN ('ai_suggested','under_review','verified','disputed','deprecated')), UNIQUE (entity_id, local_id));
CREATE INDEX claims_entity_idx ON claims (entity_id);
CREATE INDEX claims_model_status_idx ON claims (model_id, status);
CREATE INDEX claims_status_idx ON claims (status);
CREATE TABLE relationships (id text PRIMARY KEY, source_entity_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE, position int NOT NULL, type text NOT NULL, target_entity_id text REFERENCES entities(id), target_claim_id text REFERENCES claims(id), explanation jsonb NOT NULL, strength text NOT NULL, evidence_direction text NOT NULL, status text NOT NULL, telescoped text, why_uncertain jsonb, doc jsonb NOT NULL,
  CONSTRAINT relationships_one_target_chk CHECK ((target_entity_id IS NULL) <> (target_claim_id IS NULL)));
CREATE INDEX relationships_source_idx ON relationships (source_entity_id);
CREATE INDEX relationships_target_idx ON relationships (target_entity_id);
CREATE INDEX relationships_type_idx ON relationships (type);
CREATE TABLE evidence_analyses (id text PRIMARY KEY, entity_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE, position int NOT NULL, level text NOT NULL, statement jsonb NOT NULL);
CREATE TABLE evidence (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, claim_id text REFERENCES claims(id) ON DELETE CASCADE, relationship_id text REFERENCES relationships(id) ON DELETE CASCADE, analysis_id text REFERENCES evidence_analyses(id) ON DELETE CASCADE, anchor_id text REFERENCES anchors(id) ON DELETE CASCADE, offset_id text REFERENCES offsets(id) ON DELETE CASCADE, source_id text NOT NULL REFERENCES sources(entity_id), position int NOT NULL, locator text NOT NULL, captured_passage jsonb NOT NULL, demonstrates text NOT NULL, note jsonb,
  CONSTRAINT evidence_one_parent_chk CHECK (num_nonnulls(claim_id, relationship_id, analysis_id, anchor_id, offset_id) = 1));
CREATE INDEX evidence_claim_idx ON evidence (claim_id);
CREATE INDEX evidence_source_idx ON evidence (source_id);
```
  Insert order: models → assumption sets → anchors → offsets → entities → sources → media → claims → relationships → evidence_analyses → evidence. Relationship id = `<entity>#rel-<position>` unless `id` given.
- [ ] **Step 10: Makefile** — change `test:` to `pnpm -r run test`. Verify `make validate` and `make build-data` against the fixtures (use `EUSEBIUS_DATA_DIR` env override, default `data/`).
- [ ] **Step 11: Commit** `Stage 1 / Task 3: loader — validate, resolve refs, load Postgres, report`.

---

### Task 4: Ten example files in `data/`

**Goal.** Ten entities plus five supporting model files that validate, load, and exercise: Model A computed date, Model B date, competing COMPOSED_AT positions, NARRATES, Views for two traditions, Evidence Analysis, an inspected source with a captured passage, rights-complete media, Pleiades + Wikidata IDs.
**Guards.** Fetch before citing. Use WebFetch for: the source record (candidate: ORACC RINAP 3 Sennacherib 22 / Taylor Prism edition, or the British Museum collection page for BM 91032); Pleiades search for Lachish (confirm ID by title); Wikidata search for Lachish and Hezekiah; the Wikimedia Commons file page for a Taylor Prism photo (confirm licence is CC0/CC BY/CC BY-SA/PD, record author + licence URL). Anything not fetched → `ai_suggested`, `evidence: []`.
**Verification.** `make validate` → 0 errors, report shows 15 files, counts per subtype and status, no dangling; `make build-data` loads; `SELECT count(*) FROM claims WHERE status='verified'` = 0.

- [ ] Step 1: models — `model/a-biblical-literal`, `model/b-conventional-historical`, `assumption-set/mt-early-exodus-thiele` (numbers MT, exodus early, coregencies on, regnal_method thiele — D-010), `anchor/fall-of-jerusalem-586` (year −585, precision year, basis documentary, status ai_suggested unless fetched), `offset/hezekiah-reign-length` (from Hezekiah accession to death, `variants: {MT: 29, LXX: 29}`, passage ref → but `passage/2kgs-18-2` isn't in the ten; use `citation_osis: 2Kgs.18.2` string field instead of a ref to avoid an eleventh passage file).
- [ ] Step 2: `people/hezekiah.yaml` — label + Hebrew `original`; claims: `accession` under Model B (`method: range`, −726…−714, precision year, basis scholarly_consensus, under_review), `accession` under Model A (`method: computed`, anchor 586, chain of the reign-length offset backward plus `offset_years` for the interval to Josiah's reign… keep honest: use `offset_years: -129` with `derivation` note flagged ai_suggested), `death` under Model A computed from accession + reign offset. Relationships: `RULED → group/judah`? No such entity — instead `PARTICIPATED_IN → event/sennacherib-campaign-701` (evidence_direction both, strength direct, evidence from the source if fetched).
- [ ] Step 3: `events/sennacherib-campaign-701.yaml` — Model B date `absolute −700`, precision year; Model A computed from anchor (`offset_years: -115`); relationship `TOOK_PLACE_AT → place/lachish` (strength direct, evidence from prism/ reliefs source if fetched).
- [ ] Step 4: `places/lachish.yaml` — `external_ids: {pleiades, wikidata}` (fetched), geometry from Pleiades representative point, claim `name` attribute? None needed; relationships none required (orphan check will list it unless the event links to it — it does).
- [ ] Step 5: `passages/isa-36.yaml` — `external_ids.osis: Isa.36`, `work: {ref: work/isaiah}`, relationship `NARRATES → event/sennacherib-campaign-701` (strength direct, evidence_direction source_to_target, basis biblical_text).
- [ ] Step 6: `works/isaiah.yaml` — two competing date claims `property: composition`: `composition-unified-8c` (range −760…−680, attributed_to Reformed/conservative position — as `attributed_to: [{ref: tradition/reformed}]`), `composition-multiple-authors` (range −760…−500, basis scholarly_consensus, minority/majority noted in why_uncertain); two relationships `COMPOSED_AT → {claim: "#composition-unified-8c"}` and `COMPOSED_AT → {claim: "#composition-multiple-authors"}`; `AUTHORED`? skip.
- [ ] Step 7: `concepts/justification.yaml` — `summary`; `original` Greek δικαίωσις; views: `view-reformed` (tradition/reformed) and `view-catholic` (tradition ref `tradition/catholic` → would dangle; so include the Catholic view as a view claim whose `tradition` refs `tradition/reformed`? No — a second tradition file is needed. Decision: add `traditions/catholic.yaml` as an eleventh minimal file rather than fake the ref. Record this in the task report.)
- [ ] Step 8: `traditions/reformed.yaml` (+ `traditions/catholic.yaml` minimal) — label, summary, `ADHERES_TO`? none; relationship `DISCUSSES → concept/justification` from the tradition (strength interpretive).
- [ ] Step 9: `artefacts/taylor-prism.yaml` — custody British Museum, accession BM 91032, url to BM collection page (link only, D-017); `find_context` Nineveh; date claim Model B (−690 ± precision year, basis documentary/archaeology); `evidence_analysis` six entries (demonstrates: Sennacherib campaigned in Judah and besieged Jerusalem, per the text; strongly_supports: Hezekiah paid tribute; consistent_with: the biblical account of the siege being lifted; may_suggest…; debated: whether one or two campaigns; cannot_establish: the cause of the Assyrian withdrawal); relationship `ATTESTS → event/sennacherib-campaign-701`.
- [ ] Step 10: `sources/<slug>.yaml` — the fetched record: tier 1 (primary text edition) or 2; `inspection_status: inspected`, `retrieved_at` now, `captured_passages` with the verbatim lines about Hezekiah, `locator.url`. Use its Evidence on the artefact analysis + event claim.
- [ ] Step 11: `media/<slug>.yaml` — Commons image: licence from the file page, `copyright_status`, `attribution` "Photo: <author>, Wikimedia Commons, <licence>", `relevance: high`, `nature: primary_evidence`, `storage: linked`, `depicts: [{ref: artefact/taylor-prism}]`.
- [ ] Step 12: `make validate` → clean; `make build-data` → loaded. Commit `Stage 1 / Task 4: ten example entities`.

---

### Task 5: Schema tests and `make test`

**Goal.** Tests (a)–(g) from the brief all pass under `make test`.
- [ ] Step 1: `test/examples.test.ts` — (a) `runPipeline({dataDir: 'data', validateOnly: false, databaseUrl: TEST_URL})` → `ok`, `report.errors.length === 0`, `report.dangling.length === 0`, entity count ≥ 10; (g) `SELECT id FROM claims WHERE model_id='model/a-biblical-literal'` non-empty, `… WHERE model_id='model/b-conventional-historical'` non-empty, `… WHERE status='under_review'` non-empty, `… WHERE status='verified'` empty; a join `relationships WHERE type='COMPOSED_AT'` returns 2 rows with `target_claim_id` set; `type='NARRATES'` returns 1 with `target_entity_id` set. `TEST_URL` = `process.env.DATABASE_URL_TEST ?? 'postgres://localhost:5432/eusebius_test'`.
- [ ] Step 2: confirm (b)–(f) already exist in `loader-rejections.test.ts` and pass.
- [ ] Step 3: `make test` runs `pnpm -r run test`; verify exit code 0 on green, 1 when a fixture is broken on purpose (temporarily), then restore.
- [ ] Step 4: Update `CLAUDE.md` "Current stage" line and `docs/03-project-map.md` status board (Data model → schemas + loader present; Stage 2 next). Commit `Stage 1 / Task 5: schema and loader tests wired to make test`.

## Proposed doc amendments (to be confirmed by Gabriel, not applied silently)

1. §8 "Claim … carries model" — attribute and view claims use `model: model-independent`; date claims must carry a real model. Proposed wording: "Date claims carry a chronological model; other claims may be model-independent."
2. D-011 spells the basis `narrative-sequence`; schema uses `narrative_sequence` for consistency with `ai_suggested` etc.
3. CONTRIBUTING mentions `inspected-offline`; schema represents it as `inspection_status: inspected` + `inspection_method: offline` to keep D-016's two-value enum.
4. D-012 COMPOSED_AT targets a claim, not an entity; the Relationship schema allows a claim target only for this type. Worth stating in §8 under Relationship.
5. The ten examples need two Tradition files for "Views for at least two traditions" without a dangling ref; an eleventh minimal file (`tradition/catholic`) is added.

# Schemas

JSON Schema (draft 2020-12) for every core concept in `docs/00-vision-and-requirements.md` §8. One file per concept. `$id`s are `https://github.com/iamgabrielcunha/eusebius/schemas/<name>.schema.json`; files `$ref` each other by `$id`. The loader (`packages/loader`) compiles all of them into one Ajv instance in strict mode and picks the schema for a data file from its directory.

If a schema contradicts a §8 definition, the schema is wrong. Amend §8 first, then the schema.

## Files

| File | Concept (§8) | Notes |
|---|---|---|
| `language-map.schema.json` | shared | `language-map` (`en` required), `original-term`, `bcp47`. See `docs/04-language-map-convention.md`. |
| `ref.schema.json` | shared | `id` (`type/slug`), `uuid`, `{ref}` and `{claim}` link objects. |
| `date.schema.json` | Date, DateRange | Astronomical year as float; `absolute`, `range` (open-ended allowed), `computed` (anchor ± offsets, D-007). Precision lives on the claim. |
| `evidence.schema.json` | Evidence | source, locator, captured passage, `demonstrates` on the six-level scale. |
| `claim.schema.json` | Claim, Interpretation, Rough placement | kinds `date`, `attribute`, `view`. Status, confidence, basis enums live here. Model A dates must be `computed`. |
| `relationship.schema.json` | Relationship | type enum, strength, `evidence_direction` (D-019), `telescoped` for `ANCESTOR_OF` (D-013), `COMPOSED_AT` targets a claim (D-012). |
| `entity.base.schema.json` | Entity | id, uuid, type, label, summary, original, aliases, external_ids, claims, relationships. |
| `person` `group` `event` `place` `period` `passage` `work` `concept` `tradition` `artefact` `technology` `source` `media` `language` `term` | the fifteen subtypes | each = base + `type` const + its own required fields; unknown properties rejected. |
| `chronological-model` `assumption-set` `anchor` `offset` | chronology concepts | not graph nodes; live under `data/models/`. |

## Directory → schema

| `data/` directory | schema | id prefix |
|---|---|---|
| `people/` | person | `person/` |
| `groups/` | group | `group/` |
| `events/` | event | `event/` |
| `places/` | place | `place/` |
| `periods/` | period | `period/` |
| `passages/` | passage | `passage/` |
| `works/` | work | `work/` |
| `concepts/` | concept | `concept/` |
| `traditions/` | tradition | `tradition/` |
| `artefacts/` | artefact | `artefact/` |
| `technologies/` | technology | `technology/` |
| `sources/` | source | `source/` |
| `media/` | media | `media/` |
| `languages/` | language | `language/` |
| `terms/` | term | `term/` |
| `models/chronological-models/` | chronological-model | `model/` |
| `models/assumption-sets/` | assumption-set | `assumption-set/` |
| `models/anchors/` | anchor | `anchor/` |
| `models/offsets/` | offset | `offset/` |

## Invariants encoded mechanically

- Claim requires `id, kind, model, value, precision, confidence, basis, status, evidence, why_uncertain` (D-006, D-008). A `verified` claim must have at least one evidence entry. Never author `verified` by hand.
- `status` ∈ `ai_suggested | under_review | verified | disputed | deprecated` (D-003).
- A date claim under `model/a-biblical-literal` must have `value.method: computed` (D-007).
- Relationship requires `type, target, explanation, strength, evidence_direction, status, evidence` (D-019). `ANCESTOR_OF` requires `telescoped` (D-013). `COMPOSED_AT` must target a claim; every other type must target an entity (D-012).
- Source requires `tier` 1–6 and `inspection_status` ∈ `discovered | inspected`; an `inspected` source must carry `retrieved_at` and at least one captured passage (D-016). The loader additionally rejects evidence that cites a `discovered` source.
- Media requires `licence, copyright_status, attribution, relevance, nature, storage, url`; anything other than CC0, CC BY, CC BY-SA or public domain must be `storage: linked` (D-017).
- Artefact requires `evidence_analysis` with at least one entry on the scale `demonstrates | strongly_supports | consistent_with | may_suggest | debated | cannot_establish` (§8).
- Passage requires `external_ids.osis` and `work`. Period requires `authority` (PeriodO). Concept requires `summary` and at least one `view` claim.
- Every human-readable field is a language map. Bare strings are rejected.

## Enum spellings versus the documents

| Document says | Schema uses | Why |
|---|---|---|
| D-011 `narrative-sequence` | `narrative_sequence` | one spelling style (`ai_suggested`, `under_review`) across all enums |
| CONTRIBUTING `inspected-offline` | `inspection_status: inspected` + `inspection_method: offline` | keeps D-016's two-value status; the method is a separate fact |
| §8 "Claim carries model" | `model: model-independent` allowed on `attribute` and `view` claims | a View of justification has no chronological model; date claims must still name one |

These are proposed amendments to the documents, listed in the Task 1 report; the schema will follow whichever spelling Gabriel confirms.

## Deferred (not needed by the ten examples)

- Overflow files for very large entities (roadmap Stage 1 recommendation). All claims are embedded for now.
- Time-varying Place geometry. `geometry` is a single point; regions and change over time wait for the map (Phase 2).
- Interpretation as its own schema. Represented as a claim with an interpretive basis plus `attributed_to`.
- DateRange as a standalone object. Represented as `value.method: range`.
- Group membership and office-holding over time (relationship qualifiers with date claims).
- IIIF manifests and Sketchfab embeds on Media (Stage 8).
- A `schema_version` field on data files.
- Renaming an entity id (aliases table keyed by uuid).
- Relationship-level `assumption_set` and `model`.

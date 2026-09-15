# Language-map convention

**Status:** Living document — 15 September 2026. Implements D-004.
**Enforced by:** `schemas/language-map.schema.json`, applied by every schema to every human-readable field. The loader rejects any file that breaks it.

---

## 1. The rule

Every human-readable field in a data file is a **language map**: an object keyed by BCP 47 language tag, never a bare string.

```yaml
label: {en: "Hezekiah", pt-BR: "Ezequias"}
```

- `en` is **required** in v1. English is the authored language; everything else is a translation.
- Any other key is optional and must be a valid BCP 47 tag: `pt-BR`, `de`, `fr`, `es`, `la`, `grc`, `hbo`. Use the region subtag when it matters (`pt-BR`, not `pt`, for Brazilian Portuguese).
- Values are non-empty strings. An empty string is rejected; omit the key instead.
- Keys are case-sensitive in the file. Write them as BCP 47 recommends: lowercase language, uppercase region (`pt-BR`).

Fields this applies to (non-exhaustive): `label`, `summary`, `description`, `notes`, `why_uncertain`, `explanation`, `derivation`, `statement` (Artefact analysis), `gloss` (Term), `holder` (Artefact custody), `find_context`, and `summary` inside a View.

## 2. Original-language terms: the `original` sibling

Translations never replace the original word. When an entity or term has an original-language form, it goes in a sibling field called `original`, next to `label`, with the text, its language, its script and (optionally) a transliteration:

```yaml
label: {en: "justification", pt-BR: "justificação"}
original: {text: "δικαίωσις", lang: grc, script: Grek, transliteration: "dikaiōsis"}
```

- `text` — the term in its own script.
- `lang` — BCP 47 tag of the original (`hbo` Biblical Hebrew, `grc` Ancient Greek, `la` Latin, `de` German for *Rechtfertigung*).
- `script` — ISO 15924 four-letter code: `Hebr`, `Grek`, `Latn`, `Arab`, `Syrc`, `Xsux` (cuneiform).
- `transliteration` — optional, romanised form.

`original` is a single term, not a map. If one entity has several original forms (a Hebrew and a Greek name), the second goes in `aliases` as a language map keyed by the original language, e.g. `aliases: [{en: "Ezekias", grc: "Ἐζεκίας"}]`.

## 3. Fields that are exempt

These are not prose and are written as plain values:

| Kind | Examples | Why exempt |
|---|---|---|
| Identifiers | `id`, `uuid`, `{ref: …}`, `{claim: …}`, `external_ids` (OSIS, Pleiades, Wikidata, accession numbers) | machine keys, not text |
| Enumerations | `status`, `basis`, `confidence`, `precision`, `type`, `strength`, `evidence_direction`, `licence`, `nature`, `level` | fixed vocabulary; the interface translates them |
| URLs and DOIs | `url`, `licence_url`, `locator.url`, `locator.doi` | addresses |
| Dates and numbers | `year`, `earliest`, `latest`, `offset_years`, `tier`, `retrieved_at`, `coordinates` | values |
| Locators | `locator` on evidence (`"p. 214"`, `"lines iii 18–49"`) | citation position |
| Verbatim quotations | `captured_passage`, `captured_passages[].text` | quoted as retrieved, in the source's own language; each carries its own `lang` tag instead |
| Credit lines and names | `attribution`, `rights_holder`, `authors` | legally or bibliographically fixed strings |
| Original terms | `original.text`, `original.transliteration` | already language-tagged by `original.lang` |

If a field is not in this table and a human will read it, it is a language map.

## 4. Three worked examples

**A person with a Hebrew original.** `label` is bilingual; `original` is the sibling; `summary` is English-only for now and can gain `pt-BR` later without touching anything else.

<!-- example: person -->
```yaml
id: person/hezekiah
uuid: 4b9d7c2e-6a1f-4d3b-9e8c-2f7a1b5c9d0e
type: person
label: {en: "Hezekiah", pt-BR: "Ezequias"}
original: {text: "חִזְקִיָּהוּ", lang: hbo, script: Hebr, transliteration: "Ḥizqiyyāhū"}
summary: {en: "King of Judah during Sennacherib's campaign of 701 BC."}
aliases:
  - {en: "Ezekias", grc: "Ἐζεκίας"}
```

**A concept with a View in two languages.** The View is a claim of `kind: view`; its `summary` and the claim's `why_uncertain` are both language maps. The enum fields stay bare.

<!-- example: concept -->
```yaml
id: concept/justification
uuid: 8c2e5f1a-3b7d-4e9c-a1f6-5d8b2c4e7a90
type: concept
label: {en: "Justification", pt-BR: "Justificação"}
original: {text: "δικαίωσις", lang: grc, script: Grek, transliteration: "dikaiōsis"}
summary:
  en: "How a sinner comes to be counted righteous before God."
  pt-BR: "Como um pecador passa a ser considerado justo diante de Deus."
claims:
  - id: view-reformed
    kind: view
    model: model-independent
    value:
      tradition: {ref: tradition/reformed}
      summary:
        en: "A forensic declaration grounded in the imputed righteousness of Christ, received by faith alone."
        pt-BR: "Uma declaração forense fundada na justiça imputada de Cristo, recebida pela fé somente."
    precision: not_applicable
    confidence: high
    basis: tradition
    status: under_review
    evidence: []
    why_uncertain: {en: "A one-sentence summary compresses real diversity within the tradition."}
```

**A term.** `original` is required on a Term. `gloss` is the translated meaning and is a language map; the transliteration is not.

<!-- example: term -->
```yaml
id: term/berit
uuid: 1f6a9d3c-7e2b-4c5d-8a9f-3b1e6c2d4f70
type: term
label: {en: "berit", pt-BR: "berit"}
original: {text: "בְּרִית", lang: hbo, script: Hebr, transliteration: "bərît"}
gloss: {en: "covenant; binding agreement", pt-BR: "aliança; pacto"}
language: {ref: language/biblical-hebrew}
```

## 5. What is rejected

A bare string where a language map belongs is the most common mistake. This file is rejected:

<!-- rejected: person -->
```yaml
id: person/hezekiah
uuid: 4b9d7c2e-6a1f-4d3b-9e8c-2f7a1b5c9d0e
type: person
label: Hezekiah
```

The loader reports it as:

```
data/people/hezekiah.yaml:/label — expected a language map {en: "…"}, got a bare string
```

Also rejected: a map without `en` (`label: {pt-BR: "Ezequias"}`), an empty value (`label: {en: ""}`), and a key that is not a BCP 47 tag (`label: {english: "Hezekiah"}`).

## 6. The exact schema fragment the loader enforces

This block is compared byte-for-byte against `schemas/language-map.schema.json` by `packages/loader/test/convention-doc.test.ts`. If the schema changes, this document must change with it.

<!-- schema-fragment -->
```json
{
  "language-map": {
    "type": "object",
    "description": "Human-readable text keyed by BCP 47 language tag. en is required in v1.",
    "required": [
      "en"
    ],
    "properties": {
      "en": {
        "type": "string",
        "minLength": 1
      }
    },
    "propertyNames": {
      "$ref": "#/$defs/bcp47"
    },
    "additionalProperties": {
      "type": "string",
      "minLength": 1
    }
  },
  "original-term": {
    "type": "object",
    "description": "An original-language term kept alongside its translations.",
    "required": [
      "text",
      "lang",
      "script"
    ],
    "properties": {
      "text": {
        "type": "string",
        "minLength": 1
      },
      "lang": {
        "$ref": "#/$defs/bcp47"
      },
      "script": {
        "type": "string",
        "description": "ISO 15924 script code, e.g. Hebr, Grek, Latn.",
        "pattern": "^[A-Z][a-z]{3}$"
      },
      "transliteration": {
        "type": "string",
        "minLength": 1
      }
    },
    "additionalProperties": false
  },
  "bcp47": {
    "type": "string",
    "description": "A BCP 47 language tag, e.g. en, pt-BR, hbo, grc.",
    "pattern": "^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$"
  }
}
```

## 7. For translators

- Add your language as a new key next to `en`. Never remove or rewrite `en`.
- Do not translate `original`, quotations, or anything in the exempt table.
- One pull request per language per batch of files keeps review simple.
- Interface strings live in the web app's message catalogues, not in data files.

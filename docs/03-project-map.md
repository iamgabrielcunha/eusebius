# Project Map

**Status:** Living document. Update whenever a system is added, renamed or retired.
**You are here:** Stage 0 complete → Stage 1 (Data model) next.

---

## 1. Systems

```text
                                   PLATFORM
                                      │
             ┌────────────────────────┼────────────────────────┐
             │                        │                        │
          TIMELINE                   MAP                 KNOWLEDGE GRAPH
       (when)                      (where)               (connected to what)
             │                   [deferred]                     │
       Lifespans                  Places                  Relationships
       Events                     Regions                 Concepts
       Periods                    Routes                  Traditions
       Semantic zoom              Boundaries              Strength + explanation
       Model selector             (reconstructed?)        Directional evidence
             │                        │                        │
             └────────────────────────┼────────────────────────┘
                                      │
                             CHRONOLOGY ENGINE
                    models · assumption sets · anchors · offsets
                    precision propagation · agreement report
                                      │
                                CLAIM LAYER
                 every date, attribute and relationship is a Claim
                 model · precision · confidence · basis · status
                 confidence score (0–100) · gradient · status label
                                      │
             ┌────────────────────────┼────────────────────────┐
             │                        │                        │
         SCRIPTURE                 THEOLOGY                 EVIDENCE
       Passages (OSIS)            Concepts                 Artefacts
       Works / books              Views by tradition       Evidence Analysis
       NARRATES vs COMPOSED_AT    Councils, confessions    Museums, sites
       [full text deferred]       Development threads      Commentary comparison
             │                        │                        │
             └────────────────────────┼────────────────────────┘
                                      │
                                   LIBRARY
                  Sources (tier 1–6) · fetched-only citations
                  languages searched · open-access lookup
                                      │
                                    MEDIA
                  images · 3D · maps · video [video deferred]
                  rights strip · provenance chain · relevance rating
                                      │
                               RESEARCH TOOLS
                  trails · notes · collections · search · API · dumps
                                      │
                             AI RESEARCH ASSISTANT
                  proposals only → review queue → human verification
```

## 2. Data flow

```text
  Open datasets            Institutional APIs          Hand curation
  (Theographic, BibleData, (Wikimedia, Met, IIIF,      (Gabriel, contributors,
   Pleiades, PeriodO,       Sketchfab, DOI resolvers)   AI proposals via queue)
   Wikidata)                       │                          │
        │                          │                          │
        └──────────────┬───────────┴──────────────────────────┘
                       ▼
              data/  (YAML files in Git — the canon)
              one file per entity · claims embedded · status on every claim
                       │
                       ▼   tools/load.ts
              validate (JSON Schema) → resolve references → report orphans
                       │
                       ▼
              PostgreSQL  (queryable build: tables, JSONB, FTS, pgvector)
                       │
          ┌────────────┼────────────────┐
          ▼            ▼                ▼
      Web app      Public API       Bulk dumps
   (timeline,    (REST/JSON-LD,     (CC BY-SA,
    graph,        GraphQL)           nightly)
    inspector)
                       │
                       ▼   later, if traversal outgrows Postgres
              Graph engine (derived read layer; never the master)
```

## 3. Repository layout

```text
eusebius/
├── README.md
├── LICENSE                     Apache-2.0 (code)
├── LICENSE-DATA                CC BY-SA 4.0 (data, text content)
├── CONTRIBUTING.md             status rules · sourcing rules · DCO
├── CLAUDE.md                   conventions for Claude Code
├── Makefile                    dev · build-data · validate · test
├── docs/
│   ├── 00-vision-and-requirements.md
│   ├── 01-decision-log.md
│   ├── 02-roadmap.md
│   ├── 03-project-map.md
│   └── design-system.md        (Stage 4)
├── schemas/                    JSON Schema for every core concept (Stage 1)
├── data/
│   ├── models/                 chronological models + assumption sets + anchors
│   ├── people/
│   ├── groups/
│   ├── events/
│   ├── places/
│   ├── periods/
│   ├── passages/
│   ├── works/
│   ├── concepts/
│   ├── traditions/
│   ├── artefacts/
│   ├── technologies/
│   ├── sources/
│   ├── media/
│   └── languages/ terms/
├── packages/
│   ├── chronology/             engine (Stage 2)
│   ├── loader/                 validate + build (Stage 1)
│   ├── connectors/             one folder per institution; DOI/URL fetch (Stage 6)
│   └── api/                    public read API (Stage 9)
├── apps/
│   └── web/                    Next.js 16 — timeline · graph · inspector · artefact pages
└── tools/                      importers, coverage reports, checks
```

## 4. Status board

| Area | State | Next |
|---|---|---|
| Vision & requirements | Draft v0.1 | Review after Stage 1 |
| Decision log | 19 entries; D-003, D-015, D-019 accepted this session | D-010, D-011 defaults to confirm |
| Roadmap | Stages 0–11 defined | Stage 1 |
| Data model | Definitions only | Stage 1 |
| Chronology engine | Not started | Stage 2 |
| Seed data | Not started | Stage 3 |
| Timeline | Not started | Stage 4 |
| Design system | Direction only | Stage 4 |
| Map | Deferred | Phase 2 |
| Deep time | Deferred (anchor points only) | Phase 2 |
| Full Bible text | Deferred | Phase 2 |
| Video | Deferred | Phase 2 |
| Accounts / collaboration | Deferred | Phase 2 |

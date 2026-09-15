# Decision Log

**Status:** Living document. Append; never silently edit a past decision — add a new entry that supersedes it and mark the old one `Superseded by D-xxx`.
**Statuses:** `Accepted` (Gabriel decided) · `Recommended` (Claude's recommendation, accepted unless Gabriel objects) · `Open` · `Superseded`

Format for every entry: Decision · Reason · Alternatives considered · Assumptions · Consequences · Status · Date.

---

### D-001 — The project is open source and open data
**Decision:** Code and content are released under open licences. Code: Apache-2.0. Data and written content: CC BY-SA 4.0.
**Reason:** Gabriel's stated goal. Apache-2.0 is permissive, widely understood, and carries an explicit patent grant, lowering the barrier for others to build apps on the platform. CC BY-SA on the data protects the labour-intensive part of the project from being enclosed in a proprietary product while remaining fully reusable by anyone who shares alike.
**Alternatives considered:** AGPL-3.0 for code (stronger copyleft; would force hosted forks to publish source — but deters institutional adoption and complicates embedding). CC BY 4.0 for data (maximum reuse, matches Theographic, but permits proprietary enclosure). CC0 for data (as Wikidata; simplest, but removes even attribution).
**Assumptions:** No intention to commercialise the platform itself. Contributors will sign a simple DCO-style attestation rather than a CLA.
**Consequences:** Any input dataset must be CC0, CC BY, public domain, or otherwise compatible with CC BY-SA. Non-commercial media cannot be redistributed and must be linked or embedded (D-017). Licensed Bible translations are excluded from v1.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-002 — Builder and operator
**Decision:** Gabriel builds the platform himself using Claude Code on the ThinkPad (Ubuntu, 8 GB RAM) and Claude in chat for design work.
**Reason:** Gabriel's stated choice; keeps the project affordable and under his control.
**Alternatives considered:** Commissioning a developer (cost; loss of understanding of one's own architecture). Recruiting co-maintainers from the outset (premature before the core exists).
**Assumptions:** Development happens on the ThinkPad; the MacBook remains the law-work machine.
**Consequences:** Every stack choice must run comfortably within 8 GB alongside a browser and editor. Memory-hungry services (Neo4j, Elasticsearch, large local models) are deferred. Guidance is delivered as ready-to-run steps.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-003 — Editorial model
**Decision:** Content lives in a Git repository. Changes arrive as pull requests reviewed by the maintainer (Gabriel). AI-generated content enters with status `ai_suggested` and cannot render as ordinary content until a human marks it `verified`.
**Reason:** Open source implies contributions; Git gives review, attribution, history and rollback without building any of it. The status gate is what prevents the project from becoming Chronas.
**Alternatives considered:** In-app wiki editing (requires accounts, moderation tooling and abuse handling before there is any content). Closed single-author database (contradicts open-source goal).
**Assumptions:** Gabriel is the sole reviewer in v1. An in-app suggestion queue may be added later (roadmap Stage 10) but still feeds pull requests.
**Consequences:** The data format must be human-readable and diffable (D-005). A `CONTRIBUTING.md` with the status rules and sourcing rules is a Stage 0 deliverable.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-004 — Language
**Decision:** English is the language of the interface and of authored content in v1. Internationalisation is built in from day one: all interface strings externalised; all human-readable data fields stored as language-keyed maps (`label: {en: …, pt-BR: …}`). Portuguese (Brazil) is the first translation target. Original-language terms are preserved alongside translations.
**Reason:** Gabriel's stated choice, with the explicit intent that others translate later. Retrofitting i18n is expensive; designing for it costs little.
**Alternatives considered:** English-only data fields with translation tables added later (creates a migration). Bilingual authoring from the start (doubles Gabriel's editorial workload before the core exists).
**Assumptions:** Translators will contribute via the same Git workflow.
**Consequences:** Every entity, claim explanation, concept summary and view text is a map, not a string. Search must be language-aware.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-005 — Data architecture: Git-backed files as canon, PostgreSQL as the queryable build, graph layer later
**Decision:** Structured files (YAML/JSON, one file per entity) in Git are the source of truth. A build step validates them and loads them into PostgreSQL, which serves the application, search and API. A dedicated graph engine may be added later as a derived read layer if traversal outgrows Postgres.
**Reason:** Gabriel chose "a hybrid of all of them, but D is good". Files give provenance and review for free and are editable in Obsidian and by Claude Code; Postgres gives relational integrity for the claim/evidence model, JSONB flexibility, full-text search and pgvector; the graph layer is deferred because Postgres recursive queries handle MVP-scale traversal and Neo4j would strain 8 GB.
**Alternatives considered:** Postgres alone as master (loses free provenance and review). Neo4j as master (weaker for the tabular claim/evidence model; RAM-heavy; licence complexity for hosting). Hybrid from day one (premature).
**Assumptions:** MVP data volume is tens of thousands of nodes and edges at most.
**Consequences:** A schema-validation step is mandatory (Stage 1). Migrating to or adding a graph engine later is painless because the database was never the master.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-006 — Dates and connections are claims, not attributes
**Decision:** No entity carries a bare date or relationship. Entities carry claims; each claim has a chronological model, a value, precision, confidence, basis, status and evidence. Relationships are claims with a type, explanation and strength.
**Reason:** Every hard requirement (model comparison, confidence indicators, source panels, "why is this connected", "not datable under this model", AI-vs-verified) follows from this one structure. Precedents: Wikidata statements, PeriodO assertions.
**Alternatives considered:** Attributes on entities with separate "alternative dates" tables (every feature then needs its own exception path).
**Assumptions:** Editorial willingness to record a claim's basis and confidence on every entry.
**Consequences:** Slightly more effort per entry; dramatically less structural rework later. Rendering code always asks "which model, which status".
**Status:** Accepted
**Date:** 14 Sep 2026

### D-007 — Model A (biblical-literal chronology) is computed, not typed in
**Decision:** Scriptural offsets (begetting ages, reign lengths, stated intervals) are stored as claims with their textual variants (MT / LXX / SP). Anchors fix the chain to absolute dates. An engine computes absolute dates for a chosen AssumptionSet.
**Reason:** "Biblical chronology" is not one thing. Masoretic and Septuagint numbers differ by c. 1,300–1,500 years in Genesis 5 and 11; the Exodus date, the 430 years, and divided-kingdom coregencies are further switches. Computing makes each assumption visible and lets a user flip it and watch the timeline move — which is the project's purpose.
**Alternatives considered:** Hand-entering Ussher's dates (fast to start; frozen; hides assumptions; cannot compare).
**Assumptions:** Anchor: 587/586 BC (fall of Jerusalem) and/or 853 BC via the Assyrian eponym canon; both well documented.
**Consequences:** Stage 2 builds and tests the engine on Genesis 5/11 and 1 Kings 6:1 before any UI. Telescoped genealogies must be expressible (D-013).
**Status:** Accepted
**Date:** 14 Sep 2026

### D-008 — Uncertainty has three dimensions plus a reason
**Decision:** Every claim records precision (range width), confidence (evidential strength), basis (type of evidence), and a free-text "why uncertain".
**Reason:** A precise-but-disputed date (1446 BC) and a vague-but-secure one (Late Bronze Age collapse) must not receive the same indicator for opposite reasons. Gabriel approved.
**Alternatives considered:** A single four-level scale (conflates the dimensions).
**Assumptions:** Editors can assess all three; a "not assessed" value exists for each.
**Consequences:** The interface shows confidence prominently, precision through the bar or range, and basis through iconography and the source panel.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-009 — Confidence display (original)
**Decision:** Category is shown by hue. Confidence is shown by opacity and edge treatment plus a text/numeric badge. A lens mode recolours the whole view on a perceptually uniform gradient by confidence.
**Status:** Superseded by D-019
**Date:** 14 Sep 2026

### D-010 — Chronological models are a toggle; defaults set as follows
**Decision:** A selector offers **Both (synchronised)** / **Model A** / **Model B**. First load opens on a period where the models agree (the MVP period), in Both mode, with divergence zones shaded where the models part company. Model A's default AssumptionSet is Masoretic numbers + early Exodus (1 Kings 6:1 read literally) + Thiele's regnal chronology; Septuagint, Samaritan, late-Exodus and no-coregency are switches. Model B's default is the conventional historical/scientific chronology.
**Reason:** Gabriel asked for a toggle with "the one we think is best" as default. Landing on the zone of agreement avoids taking a side on first load, which honours the requirement not to label either model true. The MT + early Exodus + Thiele set is the most widely used and best documented conservative reconstruction, so it is the sensible default for Model A while the alternatives remain one click away.
**Alternatives considered:** Model A as default (privileges one framework on first load). Model B as default (same objection, reversed). No default and a forced chooser (friction before the user has seen anything).
**Assumptions:** The MVP period sits inside the zone of agreement, so the toggle is nearly invisible in v1 and becomes prominent only when deep time or the patriarchs are added.
**Consequences:** The engine must be able to report, for any span, whether the active models agree, and by how much.
**Status:** Recommended
**Date:** 14 Sep 2026

### D-011 — Rough placement is allowed, badged and hideable
**Decision:** Where an entity cannot be dated by evidence under a model, it may carry a rough-placement claim: era-level precision, basis `narrative-sequence` or `traditional`, always badged "placed approximately", hidden or shown by a user toggle. An entity may therefore be in one of three states under a model: dated, roughly placed, or not placed.
**Reason:** Gabriel asked that undatable items be placed roughly ("this era / city / place / time") with full transparency rather than omitted. The badge and basis keep the transparency; the toggle lets a strict reader remove them.
**Alternatives considered:** Omit entirely (loses context). Place without a badge (misrepresents — under the conventional model Methuselah has no evidential date, only a narrative position).
**Assumptions:** Rough placements are hidden by default under Model B and shown by default under Model A; confirm.
**Consequences:** The same mechanism serves places ("somewhere in Mesopotamia") and applies to spatial precision in the later map view.
**Status:** Accepted (mechanism); Recommended (defaults). Spelling of basis values clarified by D-020.
**Date:** 14 Sep 2026

### D-012 — Scripture has two relationships to time
**Decision:** `NARRATES` (passage → event, dated by the event) and `COMPOSED_AT` (passage or book → composition date claim with alternative positions) are separate relationship types.
**Reason:** Most Bible timelines collapse them and thereby take a critical-scholarship position silently. Isaiah 36 narrates 701 BC; Isaiah 40–66's composition date is a disputed claim with named positions.
**Alternatives considered:** One "date" per passage (unable to express the distinction).
**Assumptions:** Composition positions are recorded as competing claims with their proponents.
**Consequences:** The "Historical Context" panel for a passage uses `NARRATES`; the "Book" panel uses `COMPOSED_AT`.
**Status:** Accepted. Target of `COMPOSED_AT` clarified by D-020.
**Date:** 14 Sep 2026

### D-013 — Genealogical edges distinguish direct descent from possibly telescoped descent
**Decision:** Relationship types include `PARENT_OF`, `SPOUSE_OF`, and `ANCESTOR_OF (telescoped: possible)`.
**Reason:** Matthew 1 omits three kings; the "gaps in the genealogies" reading of Genesis 11 depends on the distinction. A model that cannot express it has silently sided with one chronology.
**Alternatives considered:** Parent/child only.
**Consequences:** Lifespan lanes and tree views render telescoped edges differently.
**Status:** Recommended
**Date:** 14 Sep 2026

### D-014 — Technology stack
**Decision:** Web application first (desktop wrap via Tauri later if offline use becomes important). TypeScript throughout; Next.js (chosen in Stage 0); timeline rendered with Canvas/WebGL (PixiJS + D3 for scales); Cytoscape.js for the graph; MapLibre GL later for maps; OpenSeadragon for IIIF; Sketchfab embed or `<model-viewer>` for 3D; PostgreSQL 16 with full-text search and pgvector; Meilisearch deferred.
**Reason:** Museum APIs, IIIF, 3D and video are web-native; research trails need shareable links; one language keeps a solo maintainer's burden low; SVG cannot survive thousands of elements under semantic zoom; everything listed runs within 8 GB.
**Alternatives considered:** SvelteKit (lighter but smaller ecosystem; Next.js chosen for Claude Code fluency). Python/FastAPI backend (a second language). Desktop-first (loses embeds and links). SVG timeline (fails at scale). Neo4j now (RAM; licence; see D-005).
**Assumptions:** Claude Code is the primary development partner. pnpm is the package manager.
**Consequences:** The rendering layer is prototyped early (Stage 4) because it carries the most technical risk.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-015 — MVP scope
**Decision:** Two vertical slices plus an engine test: Slice A (c. 750–520 BC), Slice B (doctrine of justification), and the Genesis 5/11 chronology test. Exclusions are listed in `00-vision-and-requirements.md` §7.
**Reason:** Slice A has the richest archaeological corroboration in the Old Testament, so it proves the evidence system; Slice B proves the Scripture → theology → history chain; the engine test proves computed chronology. Abraham or the Exodus would prove uncertainty well but starve the evidence system, which is the harder feature.
**Alternatives considered:** Abraham/Exodus first; a full sweep at shallow depth (proves nothing about depth).
**Assumptions:** Gabriel accepts the slice.
**Consequences:** Seed data curation (Stage 3) is bounded to roughly 150–300 entities and 500–1,500 claims.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-016 — A citation exists only if the source was fetched
**Decision:** The system stores a citation only when the source was retrieved (URL resolved, DOI resolved, or document on file) and the relevant passage captured. Sources found but not inspected are stored as `discovered`, never as evidence.
**Reason:** Language models invent plausible references with confidence. The guard must be mechanical.
**Alternatives considered:** Trusting AI-produced citations with a warning flag (the flag gets ignored).
**Consequences:** The source connector (Stage 6) includes a fetch-and-capture step; offline sources (books) require a page reference and a typed excerpt.
**Status:** Recommended
**Date:** 14 Sep 2026

### D-017 — Media rights: link or embed, never redistribute restricted items
**Decision:** Every media item carries licence, copyright status and attribution as mandatory fields. CC0, CC BY, CC BY-SA and public-domain items may be stored; NC, ND and item-level-restricted media are displayed by embed or link from the institution's own server, with attribution.
**Reason:** Open-data licence compatibility (D-001) and Gabriel's requirement that licence categories never be treated as interchangeable.
**Consequences:** The British Museum's collection (CC BY-NC-SA) is used by link/IIIF embed only; Sketchfab models are embedded, not downloaded.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-018 — Free public API and bulk data
**Decision:** The platform exposes a free, rate-limited read API and periodic bulk data dumps under CC BY-SA. Only free or open external APIs are used as data sources.
**Reason:** Gabriel's request ("free API as well"); mirrors Theographic; makes the data useful beyond this interface.
**Alternatives considered:** No API (limits reuse). Paid tiers (contradicts open goal).
**Assumptions:** API shape (GraphQL vs REST + JSON-LD) decided in Stage 9.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-019 — Confidence display (supersedes D-009)
**Decision:** Four layers of confidence communication, always on (no lens mode required):
1. **Category hue** — as before; encodes the type of entity or claim.
2. **Opacity and edge treatment** — as before; confidence encoded in how solid an element appears.
3. **Numeric badge** — a 0–100 confidence score displayed on every claim card, calculated from the confidence + basis + status fields. Always visible; no toggle required.
4. **Perceptual gradient** — the gradient is always rendered alongside the badge, using the same 0–100 scale on a perceptually uniform ramp. It is not locked behind a lens mode.

Two additional display rules:
- **Directional evidence** — relationships carry an explicit evidence-direction flag. If evidence only supports the connection from one side (A→B has a source; B←A is inferred), the edge is rendered asymmetrically: one end solid, one end dashed or faded, with a tooltip explaining which direction is evidenced.
- **Status badge** — every claim and relationship carries a visible status marker distinguishing `verified` (fact) from `interpretive` / `speculative` (theorised). The word "theorised" or "fact" is always shown in plain language alongside the numeric badge, not hidden behind an icon alone.

**Reason:** Gabriel confirmed that the gradient and number should be always visible, not locked behind a lens. He also asked for explicit directionality on relationships ("we only know where they come from from one side") and for theorised vs fact to be shown plainly.
**Alternatives considered:** Lens-only gradient (D-009 — deferred too much information). Icon-only status marker (too easy to miss).
**Assumptions:** The 0–100 score is derived, not manually entered; the derivation function is defined in Stage 4. Directional evidence is recorded as a field in the Relationship schema (Stage 1).
**Consequences:** Stage 1 adds an `evidence_direction` field to the Relationship schema. Stage 4 defines the score derivation, the gradient ramp, and the asymmetric edge rendering.
**Status:** Accepted
**Date:** 14 Sep 2026

### D-020 — Stage 1 data-model conventions (clarifies §8, D-011, D-012, D-016)
**Decision:** The Stage 1 schemas fix five conventions that the earlier documents left implicit or spelled differently:
1. **Claims and models.** Date claims must name a chronological model. Attribute claims and Views (a Concept's per-Tradition reading) carry `model: model-independent`, because a theological View has no chronological model. §8 amended accordingly.
2. **Enum spelling.** All enumerated values are lower snake_case, matching `ai_suggested` / `under_review`. D-011's `narrative-sequence` is stored as `narrative_sequence`; the six-level evidence scale is `demonstrates`, `strongly_supports`, `consistent_with`, `may_suggest`, `debated`, `cannot_establish`.
3. **Inspection.** `inspection_status` keeps D-016's two values, `discovered` and `inspected`. How an inspected source was inspected is a separate field, `inspection_method: fetched | offline`. CONTRIBUTING's `inspected-offline` means `inspected` + `offline`.
4. **`COMPOSED_AT` targets a claim.** A `COMPOSED_AT` relationship points from a Passage or Work to one of its own composition-date claims (`target: {claim: "#local-id"}`), so competing positions are competing claims (D-012). Every other relationship type targets an entity.
5. **Connectedness.** For the loader's orphan report, a Concept View naming a Tradition, a claim's `attributed_to`, a Media item's `depicts`, and an Evidence link to a Source all count as connections, alongside Relationships.
Also fixed in Stage 1 (roadmap "Decisions"): YAML files; ids `type/slug` plus an immutable UUIDv4; every cross-reference an object `{ref: …}`; claims embedded in the entity file; `external_ids` with pattern-checked `osis`, `pleiades`, `wikidata`.
**Reason:** Each point surfaced while encoding §8 mechanically in JSON Schema; the schema must be unambiguous, and the documents should say what the schema enforces. Gabriel approved all five on 15 Sep 2026.
**Alternatives considered:** A synthetic "model C" for non-chronological claims (misleading). Three-valued inspection status (mixes what with how). `COMPOSED_AT` targeting a Period entity (loses the competing-positions structure D-012 requires).
**Assumptions:** The Stage 2 engine consumes `method: computed` date values exactly as the schema defines them.
**Consequences:** `schemas/`, `docs/04-language-map-convention.md`, `CONTRIBUTING.md` and §8 agree. Future spellings follow snake_case.
**Status:** Accepted
**Date:** 15 Sep 2026

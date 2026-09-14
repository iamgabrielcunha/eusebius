# Roadmap — Version 1 (MVP)

**Status:** Draft v0.1 — 14 September 2026
**Rule:** No stage begins until the previous stage's success criteria are met and any decision it raises is logged in `01-decision-log.md`. Stages are sequential unless marked parallel-safe.

Every stage card follows the same eleven headings: Goal · Why · Inputs · Decisions · Options · Recommendation · Tasks · Output · Success criteria · Risks · Dependencies.

---

## Stage 0 — Foundations ✓

**Status:** Complete — 14 Sep 2026

**Goal.** A named, licensed, cloneable repository with the Phase 1 documents inside it, a contributor guide, and a working development environment on the ThinkPad.

**Completed tasks.**
1. Name chosen: Eusebius. Repository registered at github.com/iamgabrielcunha/eusebius.
2. `LICENSE` (Apache-2.0), `LICENSE-DATA` (CC BY-SA 4.0), `CONTRIBUTING.md`, `docs/` all present.
3. Node v26, pnpm 12, Next.js 16 installed on ThinkPad. `Makefile` with `dev`, `build-data`, `validate`, `test`.
4. `data/` directory layout created.
5. `CLAUDE.md` with coding conventions committed.
6. Framework: Next.js (chosen over SvelteKit for Claude Code fluency — see D-014).
7. Pending: PostgreSQL 16 + pgvector install (requires sudo; run: `sudo apt-get install -y postgresql-16 postgresql-16-pgvector`).

**Output.** Repository at v0.0.1; `pnpm dev` serves a placeholder page from `apps/web/`.

**Success criteria met.** Phase 1 docs, decisions, roadmap and project map are findable within two minutes of cloning.

---

## Stage 1 — Data model

**Goal.** Formal, validated definitions (JSON Schema) for every core concept in `00-vision-and-requirements.md` §8, a file layout for entities, and a loader that validates files and builds the PostgreSQL database.

**Why.** Every later feature depends on how people, events, passages, claims, sources and relationships are represented. A weak model here makes the whole platform hard to maintain.

**Inputs.** §8 definitions; D-005, D-006, D-008, D-011, D-012, D-013, D-016, D-017, D-019.

**Decisions.** File format (YAML vs JSON). Identifier scheme (slug vs UUID vs hybrid). How claims attach (embedded in entity files vs separate claim files). Reference schemes (OSIS for Scripture; Pleiades/Wikidata IDs for places).

**Options.** Embedded claims: readable, one file per subject, but large files for well-attested entities. Separate claim files: granular diffs, but harder to read as a whole. Hybrid: simple attribute claims embedded, date and relationship claims in sibling files.

**Recommendation.** YAML for readability in Obsidian and diffs; hybrid IDs (`person/hezekiah` plus an immutable UUID field for external linking); embedded claims with an optional overflow file when an entity exceeds a size threshold.

**Tasks.**
1. Write JSON Schemas: Entity subtypes, Claim, Evidence, Relationship (including `evidence_direction` per D-019), Source, Media, ChronologicalModel, AssumptionSet, Anchor, Offset.
2. Write the language-map convention (D-004).
3. Write the loader: validate → resolve references → load Postgres → report orphans and dangling references.
4. Create ten hand-written example files spanning every subtype (Hezekiah, Sennacherib's campaign, Lachish, Isaiah 36, the book of Isaiah, justification, Reformed tradition, Sennacherib's prism, one source, one media item).
5. Write schema tests.

**Output.** `schemas/`, `data/` with ten valid examples, `tools/load.ts`, a populated local database.

**Success criteria.** Every §8 definition has a schema; the loader rejects a file with a missing basis or an evidence link without a fetched source; the ten examples load and can be queried by model and status.

**Risks.** Over-modelling (mitigated: only what the ten examples need); under-modelling telescoped genealogies or composition-date alternatives (mitigated: the examples must include both).

**Dependencies.** Stage 0.

---

## Stage 2 — Chronology engine

**Goal.** A library that derives absolute dates from offsets, anchors and an AssumptionSet, reports precision and model agreement for any span, and passes the Genesis 5/11 + 1 Kings 6:1 test.

**Why.** Model A is computed (D-007); model comparison and divergence shading (D-010) both need the engine; nothing visual should be built on hand-typed dates.

**Inputs.** Stage 1 schemas; the MT, LXX and SP numbers for Genesis 5 and 11; Exodus 12:40 variants; 1 Kings 6:1; Thiele's regnal data for the divided kingdom; anchors (586 BC, 853 BC).

**Decisions.** Internal time representation (float years in astronomical numbering vs integer days). Deep-time representation (log-scaled coordinate for rendering). How to represent "not placed" vs "roughly placed".

**Options.** Integer days (exact for historical era, meaningless for deep time). Float years (uniform across 4.54 billion years; sub-year precision lost, which is acceptable).

**Recommendation.** Float years, astronomical numbering, with a separate precision field; render-space transform handled by the timeline, not the engine.

**Tasks.**
1. Implement offset chains, anchors, AssumptionSets.
2. Implement propagation of precision through chains (uncertainty accumulates).
3. Implement the agreement report: for a span, do the active models agree, and by how much?
4. Test: MT set reproduces Ussher-consistent dates within stated tolerance; LXX set shifts the antediluvian chain by the expected c. 600 years and the postdiluvian chain by the expected c. 700–800 years; toggling early/late Exodus moves only the affected span.
5. Document every assumption the engine exposes.

**Output.** `packages/chronology/` with tests and a written explanation of each switch.

**Success criteria.** All tests pass; a written table shows creation, flood, Abraham, Exodus and temple dates under MT, LXX and SP with the assumption that produced each.

**Risks.** Subtle off-by-one and inclusive/exclusive counting errors in regnal years (mitigated: Thiele's method documented; tests against published tables). Treating Ussher as the only MT reconstruction (mitigated: label the default set explicitly).

**Dependencies.** Stage 1.

---

## Stage 3 — Seed data for Slice A and the engine test

**Goal.** A verified dataset of roughly 150–300 entities and 500–1,500 claims covering c. 750–520 BC, imported from open sources where possible and hand-curated where necessary, every claim with a fetched source.

**Why.** The interface must be built against real, messy, sourced data or it will be built against a fantasy.

**Inputs.** Theographic (CC BY 4.0), BibleData, OpenBible.info geodata, Pleiades, Wikidata; standard references for Assyria, Babylon, Egypt and the Greek world; British Museum object records for the key artefacts (link only).

**Decisions.** Which Theographic fields to import automatically vs review manually. Which scholarly references serve as tier-2 sources for the period.

**Options.** Import everything then prune (fast, noisy). Import only the period's entities (bounded, cleaner).

**Recommendation.** Bounded import: filter Theographic to the period's people, places and events; mark every imported record `ai_suggested`/`imported` until reviewed; hand-write the world-history entities (Assyrian kings, Babylonian kings, Egyptian dynasties, Greek philosophers, Rome's traditional founding, Axial-Age figures).

**Tasks.**
1. Write the Theographic importer (attribution preserved).
2. Curate world-history entities with claims and sources.
3. Record composition-date positions for Isaiah, Jeremiah, Ezekiel, Daniel, Nahum, Habakkuk, Zephaniah (D-012).
4. Record the key artefacts as entities with Evidence Analysis drafts (Sennacherib's prism, Lachish reliefs, Siloam inscription, Hezekiah bullae, Babylonian Chronicle ABC 5, Cyrus Cylinder).
5. Review pass: promote to `verified`.

**Output.** `data/` populated; a coverage report (entities per category, claims per status, sources per tier).

**Success criteria.** No `verified` claim lacks a fetched source; every person has birth/death or floruit claims under at least one model; the engine's agreement report shows Model A and Model B agreeing across the slice within stated tolerances.

**Risks.** Curation takes longer than the software (expected; the slice is bounded for this reason). Importing Theographic's single-chronology dates as if they were model-neutral (mitigated: tag them with the model they assume).

**Dependencies.** Stages 1–2. Parallel-safe with Stage 4 once fifty entities exist.

---

## Stage 4 — Timeline renderer and design system

**Goal.** The main timeline: hybrid log/linear zoom, three semantic levels (dot → card → record), lifespan bars with tapered uncertain ends, category filters, the density histogram, and the chronology assumptions panel — built on a defined design system.

**Why.** This is the highest technical risk (rendering thousands of items at frame rate) and the highest design risk (information density). It must be proved early, and it is the first thing a user sees.

**Inputs.** Design direction (§10 of vision doc); Stage 3 data; D-010, D-011, D-019.

**Decisions.** deck.gl vs PixiJS vs hand-rolled Canvas with D3. Font choices. Exact zoom breakpoints for the three semantic levels. Confidence score derivation formula (0–100).

**Options.** deck.gl (WebGL, layer abstraction, heavier). PixiJS (2D WebGL, lighter, more manual). Canvas 2D (simplest, may hit limits around ten thousand items).

**Recommendation.** PixiJS with D3 scales; start with Canvas 2D if PixiJS proves heavy on integrated graphics, but keep the scene-graph abstraction so the swap is contained.

**Tasks.**
1. Design system: typography, palette (dark study room + light editorial), category hues with icon shapes, confidence badge anatomy (gradient + 0–100 number + plain-language status label), card anatomy with monospace time+place footer, asymmetric edge rendering for directional relationships.
2. Time-to-screen transform with hybrid zoom; jump-to-date; year labels in BC/AD or BCE/CE.
3. Semantic zoom tiers and collision layout (staggered lanes).
4. Lifespan bars; "alive at t" query and highlight.
5. Density histogram behind the axis.
6. Model selector (Both/A/B) with divergence shading; assumptions panel behind an advanced toggle.
7. Rough-placement badge and show/hide toggle.
8. Define the confidence score derivation function.

**Output.** A working timeline of Slice A at three zoom levels; a `design-system.md` and token file.

**Success criteria.** 5,000 synthetic items scroll and zoom smoothly on the ThinkPad; a user can find who was alive in 701 BC without instruction; switching MT→LXX in the assumptions panel visibly moves the Genesis 5 test lanes; every claim shows a numeric confidence score and a gradient.

**Risks.** Integrated-graphics performance (mitigated: budget, profiling, Canvas fallback). Design drifting into decoration (mitigated: every visual element maps to a data field).

**Dependencies.** Stages 1–3.

---

## Stage 5 — Knowledge graph view and inspector

**Goal.** "Show connections" for any entity; "Why is this connected?" with explanation, strength and evidence; the inspector side panel; the breadcrumb.

**Why.** The graph is the relational framework; the inspector is where evidence and interpretation become visible; the breadcrumb is how a user never gets lost.

**Inputs.** Relationship schemas (including `evidence_direction`); Stage 3 relationships; D-006, D-013, D-019.

**Decisions.** Sigma.js vs Cytoscape.js. Whether the graph opens as an overlay on the timeline or as a separate view.

**Options.** Overlay (connections drawn across the timeline — immediate but cluttered). Separate view (clean but context-switching). Both (recommended).

**Recommendation.** Cytoscape.js for its layout options; overlay for one-hop connections, separate view for exploration beyond one hop.

**Tasks.**
1. Inspector panel: identity, claims grouped by model, relationships grouped by type, sources, media, "you are here".
2. One-hop overlay on the timeline.
3. Graph view with typed edge styling by strength; asymmetric rendering for directional evidence (D-019).
4. "Why connected?" popover with explanation, evidence direction, and evidence.
5. Breadcrumb trail with back-navigation.

**Output.** Working graph and inspector for Slice A.

**Success criteria.** From Isaiah, a user reaches Sennacherib's prism in three clicks and reads why each hop exists; every edge shows a strength and a direction indicator; no edge lacks an explanation.

**Risks.** Hairball layouts (mitigated: one-hop by default, filters by type).

**Dependencies.** Stages 4 (partial) and 3.

---

## Stage 6 — Sources and citations

**Goal.** Source records with tiers, locators, languages and inspection status; a fetch-and-capture connector; interactive citations; the source panel on every claim.

**Why.** "Where did this come from?" and "how certain are we?" must be answerable for every substantive claim; the fetched-source rule (D-016) needs tooling to be enforceable.

**Inputs.** Source schema; D-016; open-access discovery targets (institutional repositories, DOI resolution, Internet Archive, CCEL, PRDL).

**Decisions.** Citation style for display. How offline sources (printed books) are captured.

**Options.** Chicago author-date (scholarly) vs numeric (compact). Offline: page reference plus a typed excerpt, marked `inspected-offline`.

**Recommendation.** Chicago author-date for display, structured fields underneath; offline sources allowed with the typed-excerpt rule.

**Tasks.**
1. Source and Evidence CRUD in the loader.
2. Connector: resolve DOI/URL → fetch → store title, author, date, publisher, language, licence, retrieved-at, captured passage.
3. Tier assignment and open-access lookup.
4. Citation rendering and click-through panel.
5. Coverage report: claims without sources, sources not inspected.

**Output.** Every Slice A `verified` claim has an inspectable citation.

**Success criteria.** The loader refuses a `verified` claim whose evidence points to a `discovered` source; clicking any citation opens the captured passage.

**Risks.** Paywalls (mitigated: open-access lookup; offline capture). Scope creep into a reference manager (mitigated: only what claims need).

**Dependencies.** Stage 1; benefits Stage 3 retroactively.

---

## Stage 7 — Theology slice: justification

**Goal.** The concept "justification" as a fully connected object: short explanation, Views by tradition, development thread from Romans to 1689, connected councils, confessions, theologians and passages, each connection explained and sourced.

**Why.** Proves the Scripture → theology → history chain and the views-by-tradition panel on one doctrine before any other is attempted.

**Inputs.** Concept, Tradition, View schemas; primary texts (Romans, Galatians, James; Augustine; Luther; Trent Session VI; Calvin; Westminster; 1689); secondary scholarship across traditions; original terms (δικαιόω, iustificatio, Rechtfertigung).

**Decisions.** Which traditions receive a View in v1 (Catholic, Orthodox, Lutheran, Reformed, Baptist recommended; Anglican and Methodist if time allows). Whether Views are authored or quoted from confessional documents.

**Options.** Authored summaries (readable; risk of caricature). Confessional quotation with commentary (accurate; longer).

**Recommendation.** Short authored summary plus a quoted confessional anchor per tradition, each summary reviewed against a source from within that tradition.

**Tasks.**
1. Author the hover explanation and the expanded panel.
2. Write the Views with sources from each tradition.
3. Build the development thread as dated events and works.
4. Connect passages via `NARRATES`/`EXPLICITLY_TEACHES`/`INTERPRETED_FROM`/`DISPUTED_INTERPRETATION` relationship types.
5. Render the concept page and the thread on the timeline.

**Output.** Justification navigable from a verse, from a theologian, from a council, or from the timeline.

**Success criteria.** Each View cites at least one source from its own tradition; the thread renders chronologically; a Catholic and a Reformed reader would each recognise their position as fairly stated.

**Risks.** Bias toward the author's tradition (mitigated: in-tradition sourcing rule; invite external review).

**Dependencies.** Stages 1, 5, 6.

---

## Stage 8 — Artefacts and media

**Goal.** Six to eight artefacts from Slice A as first-class objects with Evidence Analysis, museum metadata, IIIF images or Sketchfab embeds, rights strips and provenance chains.

**Why.** Proves the evidence system and the media/rights pipeline on real institutional records.

**Inputs.** Artefact and Media schemas; D-017; British Museum (Sennacherib's prism, Lachish reliefs, Cyrus Cylinder, Babylonian Chronicle — link/embed only); Israel Museum and Istanbul Archaeology Museums for the Siloam inscription; Met/Rijksmuseum/Wikimedia Commons for freely licensed images.

**Decisions.** Which IIIF viewer. How to represent objects whose institution offers no API (manual record with link).

**Options.** OpenSeadragon (lightweight) vs Mirador (full IIIF workspace).

**Recommendation.** OpenSeadragon in v1.

**Tasks.**
1. Media connector framework: one connector per institution with endpoint, rate limits, licence handling, retrieved-at.
2. Wikimedia Commons and Met connectors (open); British Museum by link/IIIF embed.
3. Artefact pages with the six-part Evidence Analysis and commentary comparison table.
4. Rights strip and provenance chain on every media item; artistic-interpretation flag.
5. Sketchfab embed for available 3D models.

**Output.** Artefact pages for the slice's key objects.

**Success criteria.** No media item lacks licence and attribution; every artefact's Evidence Analysis distinguishes what it demonstrates from what it cannot establish; the British Museum items display without any file being copied.

**Risks.** Institutional terms change (mitigated: connectors isolated; retrieved-at recorded). Overstating relevance (mitigated: relevance rating mandatory).

**Dependencies.** Stages 1, 5, 6.

---

## Stage 9 — Research trails, notes, collections, public API and data dumps

**Goal.** Save a research path; attach notes to any object; build collections; expose a free read API and publish a bulk dump.

**Why.** Turns the platform from a viewer into a research tool and honours D-018.

**Inputs.** D-018; Theographic's GraphQL as a reference shape; JSON-LD conventions from PeriodO/Pleiades.

**Decisions.** GraphQL vs REST + JSON-LD (or both). Local-only notes (browser) vs account-backed notes.

**Options.** GraphQL (developer-friendly, flexible queries). REST + JSON-LD (linked-data friendly, cacheable). Local notes (no accounts; lost on device change). Accounts (persistence; auth to build).

**Recommendation.** Both API shapes if cheap, else REST + JSON-LD first; local notes with export in v1, accounts deferred.

**Tasks.** Trail recording; notes and collections with export; API with rate limiting and attribution headers; nightly dump under CC BY-SA.

**Output.** API documentation; first public dump.

**Success criteria.** A developer can fetch Hezekiah with all claims and sources in one call; a trail can be saved and reopened.

**Risks.** Abuse of a free API (mitigated: rate limits, dumps for bulk users).

**Dependencies.** Stages 1–8.

---

## Stage 10 — AI review queue

**Goal.** A pipeline in which AI proposes summaries, hover texts, candidate connections and candidate sources, and Gabriel reviews them in a queue that promotes to `verified` or rejects.

**Why.** AI accelerates population; the queue keeps it from ever becoming authority (D-003, D-016).

**Inputs.** Status model; Claude API for quality; local `qwen3:8b` for cheap first-pass tagging.

**Decisions.** What AI may propose in v1 (recommended: hover explanations, candidate connections with explanations, candidate sources; not dates).

**Tasks.** Proposal generators; queue interface; automated checks (date consistency, orphan nodes, citation fetched); audit log of who verified what and when.

**Output.** Working queue; audit log.

**Success criteria.** No AI proposal can reach `verified` without a human action recorded in the log; automated checks catch a deliberately planted invented citation.

**Risks.** Reviewer fatigue (mitigated: batch sizes; quality thresholds).

**Dependencies.** Stages 1, 6, 9.

---

## Stage 11 — Review gate

**Goal.** Decide, with evidence, whether the architecture has earned expansion.

**Why.** The core must prove it holds weight before thousands of entities, the map, deep time and other doctrines are added.

**Inputs.** Everything above; a test with three outside readers (one Catholic, one Orthodox, one Reformed, ideally) and one historian.

**Tasks.** Test data accuracy, chronology, attribution, rights handling, neutrality, search, relationship accuracy, visual clarity, accessibility, performance. Record findings. Log the expansion decision.

**Output.** Review report; v1.0 tag; Phase 2 roadmap.

**Success criteria.** Outside readers recognise their traditions as fairly stated; no rights violations; performance targets met; the decision log has no unresolved `Open` entries blocking expansion.

**Dependencies.** All prior stages.

# Phase 1 — Vision and Requirements

**Project:** Bible & World History Research Platform (working title — see Stage 0 of the roadmap)
**Status:** Draft v0.1 — 14 September 2026
**Owner:** Gabriel de Almeida Prado Cunha
**Type:** Living document. When a decision in `01-decision-log.md` changes something here, update this file and note the decision ID.

---

## 1. Purpose

An open-source research environment that places the biblical narrative, world history, theology, archaeology, science and technology on a shared chronological framework, connects everything through a typed knowledge graph, and traces every claim to its evidence — while keeping evidence, interpretation, tradition and speculation visibly distinct.

> The timeline tells you **when**. The map tells you **where**. The graph tells you **what it connects to**. The library tells you **why we believe it**. The theology layer tells you **how the traditions have understood it**. The uncertainty system tells you **how confident to be**.

The conceptual ancestor is Logos Bible Software's Factbook. The scope is wider (deep time, world history, museums, archaeology as evidence) and the intellectual discipline is stricter (competing chronologies, tiered sources, AI suggestions quarantined from verified facts).

## 2. What it is and is not

**It is**

- A citation-first knowledge graph with four navigational frameworks: time, place, relation, evidence.
- A multi-model chronology: the same entities can carry different dates under different frameworks, and the frameworks can be compared.
- A theological layer that presents Catholic, Orthodox and Protestant (and within Protestantism, Lutheran, Reformed, Anglican, Baptist, Methodist, Pentecostal, Evangelical) understandings side by side.
- An evidence system in which artefacts, inscriptions and manuscripts are first-class objects with an explicit "what this demonstrates / suggests / cannot establish" analysis.
- Open source (code) and open data (content), with a free public read API.

**It is not**

- A Bible app with a timeline bolted on.
- An apologetics site, or its opposite. It represents positions; it does not adjudicate them.
- A wiki without an editorial gate. Contributions are reviewed; AI output never becomes fact unreviewed.
- A crowd-sourced map. (Chronas shows what 50 million unreviewed data points produce: kingdoms outliving themselves by centuries.)

## 3. Who it is for

| Audience | Need | Priority |
|---|---|---|
| Gabriel (v1) | Personal research; sermon and study preparation; evidence scrutiny | Primary |
| Theology and history students | Contextualised study; competing views in one place | Secondary |
| Pastors and teachers | Reliable, sourced material for teaching | Secondary |
| Researchers | Traceable citations, cross-language coverage, exportable data | Secondary |
| Developers | Free API and bulk data to build their own tools | Secondary |
| Translators | English-first content designed for translation (Portuguese first) | Later |

## 4. Problems it solves

1. Bible timelines present one chronology as fact and hide the assumptions that produced it.
2. World-history tools ignore Scripture; Bible tools ignore the world. Nobody answers "what was happening when…" visually.
3. Archaeology is presented as proof or disproof rather than as evidence with limits.
4. Theology is presented as if there were one Christian tradition.
5. Sources are absent, unverifiable, or English-centric.
6. Nothing lets a reader move Scripture → theology → history → artefact → source → competing interpretation without leaving the tool.

## 5. Guiding principles

1. **Claims, not facts.** No entity has a bare date or a bare relationship. Entities have claims; claims have models, precision, confidence, basis, status and evidence. (D-006)
2. **Represent uncertainty; never invent precision.** Ranges over points unless a point is earned. Every uncertain claim says why.
3. **Preserve disagreement.** Where reputable positions differ, show them, name them, and say what evidence each uses.
4. **Evidence ≠ interpretation ≠ tradition ≠ speculation ≠ AI suggestion.** These are distinct statuses and stay visible throughout the interface.
5. **A source that was not fetched does not exist.** Citations are stored only when the source was retrieved and the relevant passage captured. (D-016)
6. **Multilingual by design.** Original terms are preserved (λόγος, בְּרִית, homoousios, Rechtfertigung). Non-English scholarship is sought, not tolerated.
7. **Open by default.** Licence recorded per item. Non-commercial or restricted media is linked or embedded from the institution, never redistributed. (D-001, D-017)
8. **Everything connected; every connection explained and rated.** A relationship without an explanation and a strength is incomplete.
9. **Design is part of the architecture.** Information density is solved by semantic zoom and progressive disclosure, not by hiding data.
10. **Understand → explain → decide → design → build → test → review.** Never guess → build → hope.

## 6. What version 1 (the MVP) accomplishes

Version 1 proves the architecture with two thin vertical slices and one engine test. (D-015)

**Slice A — The Assyrian crisis to the return, c. 750–520 BC.**
Isaiah, Hezekiah, the fall of Samaria, Sennacherib's campaign, Josiah, Jeremiah, the fall of Jerusalem, Ezekiel, Daniel, Cyrus — alongside Assyria, Babylon, Egypt (Dynasties 25–26), the traditional founding of Rome, the first Greek philosophers, and the Axial-Age figures. It carries the strongest archaeological corroboration in the Old Testament (Sennacherib's prism, the Lachish reliefs, the Siloam inscription, Hezekiah's bullae, the Babylonian Chronicle, the Cyrus Cylinder), which makes it the right proving ground for the evidence-analysis system.

**Slice B — The doctrine of justification.**
Romans 3–5, Galatians, James → Augustine → medieval debate → Luther → Trent → Calvin → Westminster → the 1689 Confession → modern discussion. One doctrine across all major traditions, exercising the full Scripture → theology → history chain and the views-by-tradition panel.

**Engine test — Genesis 5 and 11 with 1 Kings 6:1.**
Not surfaced as content in v1. The chronology engine must derive Ussher-consistent dates from Masoretic offsets anchored to 586 BC, and shift correctly when the Septuagint or Samaritan numbers are switched in. (D-007)

At the end of v1 a user can: zoom the period at three semantic levels; ask who was alive in 701 BC; open Isaiah and see kings, empires, contemporaries and composition-date positions; click any connection and read why it exists; open Sennacherib's prism and read what it proves and what it cannot; follow justification from Romans to 1689; and inspect the source behind every claim.

## 7. Deliberately not built yet

Each of these depends on the same core and must wait until the core has proved it holds weight:

- Map view and historical boundaries
- Deep time (geological and cosmological layers) beyond a handful of anchor points used to prove the zoom
- Full Bible text with original languages, manuscripts and commentaries
- Multilingual source discovery workflow
- Video integration
- User accounts, collaborative editing, in-app suggestion queue
- Guided onboarding
- Additional theological concepts beyond justification
- Any period outside Slice A

## 8. Core concepts (definitions, not schema)

These definitions govern the data model designed in Stage 1. A schema that contradicts a definition here is wrong; a definition that proves unworkable is amended here first.

**Entity** — Any node in the graph. Subtypes: Person, Group (people, tribe, civilisation, institution), Event, Place, Period, Passage, Work, Concept, Tradition, Artefact, Technology, Source, Media, Language, Term.

**Person** — An individual, biblical or historical or theological. Carries no dates of its own; carries date-claims.

**Event** — Something that happened, or is narrated as having happened, with a temporal extent. Events nest (the Exile contains the fall of Jerusalem).

**Place** — A location with a geometry (point or region) that may change over time. Linked where possible to Pleiades and Wikidata identifiers.

**Period** — A named span as defined by a specific authority (following PeriodO: not one "Iron Age" but each author's Iron Age).

**Passage** — A canonical scripture reference (book, chapter, verse range) using a stable reference scheme (OSIS IDs). A passage relates to time in two distinct ways, never merged: it **narrates** an event, and it **was composed** at a date. (D-012)

**Work** — A text or document: a biblical book, a confession, a treatise, an inscription, a chronicle.

**Concept** — A theological or intellectual idea (justification, covenant, predestination). A Concept holds a short accessible explanation plus one View per relevant Tradition.

**Tradition** — A confessional community whose reading of a Concept is recorded as a View.

**Artefact** — A physical object with find context, custody, dating claims and an Evidence Analysis (demonstrates / strongly supports / consistent with / may suggest / debated / cannot establish).

**Source** — A citable authority with tier (1 primary → 6 low confidence), locator (page, URL, DOI), original language, and inspection status (discovered vs inspected).

**Media** — An image, video, 3D model, map or audio item with mandatory rights metadata, a relevance rating, and a nature flag (primary evidence vs later artistic interpretation).

**Claim** — A statement about an entity: a date, an attribute, a relationship. Carries: model, value, precision, confidence, basis, status, and evidence.

**Evidence** — A link from a claim to a source with a locator, the captured passage, and what the source demonstrates for the claim.

**Interpretation** — A claim whose basis is interpretive, attributed to a tradition or scholar. Several may coexist on one entity.

**Relationship** — A typed, directed edge between entities with an explanation, a strength (direct / strongly supported / interpretive / speculative), and evidence.

**Date** — A point on a continuous number line (astronomical year numbering, so year 0 exists and there is no gap), displayed as BC/AD or BCE/CE per user preference.

**DateRange** — Earliest and latest with a precision level; may be open-ended.

**ChronologicalModel** — A named framework: Biblical-literal, Conventional-historical, Geological/scientific. Others can be added.

**AssumptionSet** — Parameter values within a model: Masoretic / Septuagint / Samaritan numbers; early or late Exodus; 430 years counted in Egypt only or including Canaan; coregencies on or off.

**Anchor** — An absolute date fixed by external evidence from which relative chains are computed (e.g. 586 BC, 853 BC).

**Offset** — A relative interval claim from Scripture (Genesis 5:3 — Adam was 130 at Seth's birth, MT; 230, LXX).

**Precision, Confidence, Basis** — The three dimensions of uncertainty. (D-008)
- *Precision*: how wide the range is.
- *Confidence*: how strong the evidential basis is.
- *Basis*: biblical text / archaeology / radiometric / documentary / tradition / scholarly consensus / minority view / speculation.

**Status** — `ai_suggested` → `under_review` → `verified`; also `disputed` and `deprecated`. Only `verified` claims render as ordinary content; everything else is badged. (D-003)

**Rough placement** — A claim with era-level precision and a basis of `narrative-sequence` or `traditional`, used when an entity cannot be dated by evidence under a model but can be placed approximately. Always badged; can be hidden. (D-011)

## 9. Landscape (summary)

No existing system combines multi-model chronology, claim/evidence separation, theological traditions as a layer, a universal typed graph, and museum integration. The parts exist:

- **Seed data:** Theographic (CC BY 4.0; biblical people, places, periods, events; GraphQL), BibleData (persons, relationships, polyglot incl. Samaritan Pentateuch), OpenBible.info geodata.
- **Modelling precedents:** PeriodO (period definitions per authority), Wikidata (statements with qualifiers and references), CIDOC-CRM (museum ontology).
- **Places:** Pleiades gazetteer (CC BY).
- **Museums and images:** IIIF standard; Metropolitan Museum, Rijksmuseum, Smithsonian, Europeana APIs; British Museum via Sketchfab for 3D (CC BY-NC-SA — link, do not copy).
- **Theological primary texts:** CCEL, Post-Reformation Digital Library, New Advent, Sefaria.
- **Benchmark:** Logos Factbook (closed; single chronology; 2,280 catalogued biblical events).
- **Cautionary examples:** Chronas (ungoverned crowd data), ChronoZoom (retired; proved deep-time zoom must be hybrid log/linear).

## 10. Design direction

Derived from the nine reference images (analysis in the conversation of 13 September 2026; to be expanded into a design system in Stage 4).

- **Palette:** warm-dark "study room" default; light "editorial" alternative.
- **Type:** serif for titles and Scripture; sans for interface; monospace for identifiers, coordinates, citations and dates.
- **Evidence as index cards:** every claim, artefact and source is a card with a catalogue ID and a monospace footer carrying time + place.
- **Semantic zoom:** dot → card → full record. A density histogram behind the axis shows where data lives before the user zooms.
- **Main timeline:** horizontal axis, cards staggered above and below to avoid collisions, lifespan bars with tapered uncertain ends.
- **Chronology assumptions panel:** an inspector of switches (MT/LXX/SP, Exodus early/late, coregencies) that recomputes the timeline live; behind an "advanced" toggle.
- **Confidence display:** category = hue; confidence shown by opacity, edge treatment, numeric badge (0–100), and perceptual gradient — all always visible. Relationships show directional evidence asymmetrically. Status shown in plain language ("verified" / "theorised"). (D-019)
- **Object view:** museum-grade — dark ground, serif title, curatorial text, rights strip, thumbnails of related items. Dithered thumbnails are permitted on cards; the artefact view always shows the untouched photograph.
- **Breadcrumb:** always visible; "You are here: Ancient Israel → Judah → Hezekiah → Isaiah 36 → Sennacherib's prism".

## 11. Licensing (summary; detail in D-001 and D-017)

- Code: Apache-2.0.
- Data and text content: CC BY-SA 4.0.
- Compatible inputs: CC0 (PeriodO, Wikidata, Met, Smithsonian), CC BY (Theographic, Pleiades), public domain.
- Incompatible for redistribution but usable by link/embed: CC BY-NC-* (British Museum), item-level Europeana rights, licensed Bible translations (ESV, NIV). Free translations for v1: WEB, KJV, BSB.

## 12. Open questions

- Whether Model B "rough placements" for pre-Abrahamic figures should be shown by default or hidden by default (D-011 recommends hidden).
- Whether the public API should be GraphQL (matches Theographic) or REST + JSON-LD (matches linked-data conventions). Decide in Stage 9; both can be offered.

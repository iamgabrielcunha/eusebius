import pg from "pg";
import type { LoadedFile } from "./types.ts";
import { ENTITY_SCHEMAS } from "./schemas.ts";

export const DEFAULT_DATABASE_URL = "postgres://localhost:5432/eusebius";

export const DDL = `
DROP TABLE IF EXISTS evidence, evidence_analyses, relationships, claims, media, sources, entities, offsets, anchors, assumption_sets, chronological_models CASCADE;

CREATE TABLE chronological_models (
  id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, label jsonb NOT NULL, description jsonb NOT NULL, doc jsonb NOT NULL);
CREATE TABLE assumption_sets (
  id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, model_id text NOT NULL REFERENCES chronological_models(id),
  label jsonb NOT NULL, parameters jsonb NOT NULL, doc jsonb NOT NULL);
CREATE INDEX assumption_sets_model_idx ON assumption_sets (model_id);
CREATE TABLE anchors (
  id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, label jsonb NOT NULL, year double precision NOT NULL,
  precision text NOT NULL, confidence text NOT NULL, basis text NOT NULL, status text NOT NULL,
  why_uncertain jsonb NOT NULL, doc jsonb NOT NULL);
CREATE TABLE offsets (
  id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, label jsonb NOT NULL, variants jsonb NOT NULL,
  precision text NOT NULL, confidence text NOT NULL, basis text NOT NULL, status text NOT NULL,
  why_uncertain jsonb NOT NULL, doc jsonb NOT NULL);

CREATE TABLE entities (
  id text PRIMARY KEY, uuid uuid UNIQUE NOT NULL, type text NOT NULL, label jsonb NOT NULL, summary jsonb,
  original jsonb, external_ids jsonb NOT NULL DEFAULT '{}'::jsonb, file text NOT NULL, doc jsonb NOT NULL,
  CONSTRAINT entities_type_chk CHECK (type IN ('person','group','event','place','period','passage','work','concept','tradition','artefact','technology','source','media','language','term')));
CREATE INDEX entities_type_idx ON entities (type);
CREATE INDEX entities_external_ids_idx ON entities USING gin (external_ids);

CREATE TABLE sources (
  entity_id text PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  tier smallint NOT NULL CHECK (tier BETWEEN 1 AND 6),
  inspection_status text NOT NULL CHECK (inspection_status IN ('discovered','inspected')),
  source_type text NOT NULL, retrieved_at timestamptz, locator jsonb NOT NULL, original_language text);
CREATE TABLE media (
  entity_id text PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  media_type text NOT NULL, licence text NOT NULL, copyright_status text NOT NULL, attribution text NOT NULL,
  relevance text NOT NULL, nature text NOT NULL, storage text NOT NULL, url text NOT NULL);

CREATE TABLE claims (
  id text PRIMARY KEY, entity_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE, local_id text NOT NULL,
  position int NOT NULL, kind text NOT NULL, property text,
  model_id text REFERENCES chronological_models(id), assumption_set_id text REFERENCES assumption_sets(id),
  value jsonb NOT NULL, precision text NOT NULL, confidence text NOT NULL, basis text NOT NULL, status text NOT NULL,
  why_uncertain jsonb NOT NULL, attributed_to jsonb, doc jsonb NOT NULL,
  CONSTRAINT claims_status_chk CHECK (status IN ('ai_suggested','under_review','verified','disputed','deprecated')),
  UNIQUE (entity_id, local_id));
CREATE INDEX claims_entity_idx ON claims (entity_id);
CREATE INDEX claims_model_status_idx ON claims (model_id, status);
CREATE INDEX claims_status_idx ON claims (status);
CREATE INDEX claims_assumption_set_idx ON claims (assumption_set_id);

CREATE TABLE relationships (
  id text PRIMARY KEY, source_entity_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE, position int NOT NULL,
  type text NOT NULL, target_entity_id text REFERENCES entities(id), target_claim_id text REFERENCES claims(id),
  explanation jsonb NOT NULL, strength text NOT NULL, evidence_direction text NOT NULL, status text NOT NULL,
  telescoped text, why_uncertain jsonb, doc jsonb NOT NULL,
  CONSTRAINT relationships_one_target_chk CHECK ((target_entity_id IS NULL) <> (target_claim_id IS NULL)));
CREATE INDEX relationships_source_idx ON relationships (source_entity_id);
CREATE INDEX relationships_target_idx ON relationships (target_entity_id);
CREATE INDEX relationships_target_claim_idx ON relationships (target_claim_id);
CREATE INDEX relationships_type_idx ON relationships (type);

CREATE TABLE evidence_analyses (
  id text PRIMARY KEY, entity_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE, position int NOT NULL,
  level text NOT NULL, statement jsonb NOT NULL);
CREATE INDEX evidence_analyses_entity_idx ON evidence_analyses (entity_id);

CREATE TABLE evidence (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  claim_id text REFERENCES claims(id) ON DELETE CASCADE,
  relationship_id text REFERENCES relationships(id) ON DELETE CASCADE,
  analysis_id text REFERENCES evidence_analyses(id) ON DELETE CASCADE,
  anchor_id text REFERENCES anchors(id) ON DELETE CASCADE,
  offset_id text REFERENCES offsets(id) ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES sources(entity_id), position int NOT NULL,
  locator text NOT NULL, captured_passage jsonb NOT NULL, demonstrates text NOT NULL, note jsonb,
  CONSTRAINT evidence_one_parent_chk CHECK (num_nonnulls(claim_id, relationship_id, analysis_id, anchor_id, offset_id) = 1));
CREATE INDEX evidence_claim_idx ON evidence (claim_id);
CREATE INDEX evidence_relationship_idx ON evidence (relationship_id);
CREATE INDEX evidence_analysis_idx ON evidence (analysis_id);
CREATE INDEX evidence_source_idx ON evidence (source_id);
`;

/** Create the target database if it does not exist (connects to the maintenance db first). */
export async function ensureDatabase(url: string): Promise<void> {
  const u = new URL(url);
  const dbName = u.pathname.replace(/^\//, "");
  const admin = new URL(url); admin.pathname = "/postgres";
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const r = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (r.rowCount === 0) await client.query(`CREATE DATABASE ${pg.escapeIdentifier(dbName)}`);
  } finally { await client.end(); }
}

const modelId = (m: any) => (typeof m === "object" && m?.ref) ? m.ref : null;

type EvidenceParent = { claim_id?: string; relationship_id?: string; analysis_id?: string; anchor_id?: string; offset_id?: string };

export async function loadIntoPostgres(files: LoadedFile[], url: string): Promise<void> {
  await ensureDatabase(url);
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const evidenceRows: { parent: EvidenceParent; ev: any; position: number }[] = [];
  const q = (sql: string, params: any[]) => client.query(sql, params);
  const pushEvidence = (parent: EvidenceParent, list: any[] | undefined) => (list ?? []).forEach((ev, i) => evidenceRows.push({ parent, ev, position: i }));
  try {
    await client.query("BEGIN");
    await client.query(DDL);
    const by = (s: string) => files.filter((f) => f.schema === s);

    for (const f of by("chronological-model")) await q("INSERT INTO chronological_models (id, uuid, label, description, doc) VALUES ($1,$2,$3,$4,$5)", [f.doc.id, f.doc.uuid, f.doc.label, f.doc.description, f.doc]);
    for (const f of by("assumption-set")) await q("INSERT INTO assumption_sets (id, uuid, model_id, label, parameters, doc) VALUES ($1,$2,$3,$4,$5,$6)", [f.doc.id, f.doc.uuid, f.doc.model.ref, f.doc.label, f.doc.parameters, f.doc]);
    for (const f of by("anchor")) {
      const d = f.doc;
      await q("INSERT INTO anchors (id, uuid, label, year, precision, confidence, basis, status, why_uncertain, doc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [d.id, d.uuid, d.label, d.year, d.precision, d.confidence, d.basis, d.status, d.why_uncertain, d]);
      pushEvidence({ anchor_id: d.id }, d.evidence);
    }
    for (const f of by("offset")) {
      const d = f.doc;
      await q("INSERT INTO offsets (id, uuid, label, variants, precision, confidence, basis, status, why_uncertain, doc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [d.id, d.uuid, d.label, d.variants, d.precision, d.confidence, d.basis, d.status, d.why_uncertain, d]);
      pushEvidence({ offset_id: d.id }, d.evidence);
    }

    const entities = files.filter((f) => ENTITY_SCHEMAS.has(f.schema));
    for (const f of entities) {
      const d = f.doc;
      await q("INSERT INTO entities (id, uuid, type, label, summary, original, external_ids, file, doc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [d.id, d.uuid, d.type, d.label, d.summary ?? null, d.original ?? null, d.external_ids ?? {}, f.file, d]);
    }
    for (const f of by("source")) {
      const d = f.doc;
      await q("INSERT INTO sources (entity_id, tier, inspection_status, source_type, retrieved_at, locator, original_language) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [d.id, d.tier, d.inspection_status, d.source_type, d.retrieved_at ?? null, d.locator, d.original_language ?? null]);
    }
    for (const f of by("media")) {
      const d = f.doc;
      await q("INSERT INTO media (entity_id, media_type, licence, copyright_status, attribution, relevance, nature, storage, url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [d.id, d.media_type, d.licence, d.copyright_status, d.attribution, d.relevance, d.nature, d.storage, d.url]);
    }
    for (const f of entities) {
      for (const [i, c] of (f.doc.claims ?? []).entries()) {
        const id = `${f.doc.id}#${c.id}`;
        await q("INSERT INTO claims (id, entity_id, local_id, position, kind, property, model_id, assumption_set_id, value, precision, confidence, basis, status, why_uncertain, attributed_to, doc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
          [id, f.doc.id, c.id, i, c.kind, c.property ?? null, modelId(c.model), c.assumption_set?.ref ?? null, JSON.stringify(c.value), c.precision, c.confidence, c.basis, c.status, c.why_uncertain, c.attributed_to ? JSON.stringify(c.attributed_to) : null, c]);
        pushEvidence({ claim_id: id }, c.evidence);
      }
    }
    for (const f of entities) {
      for (const [i, r] of (f.doc.relationships ?? []).entries()) {
        const id = `${f.doc.id}#${r.id ?? `rel-${i}`}`;
        const targetClaim = r.target?.claim ? (r.target.claim.startsWith("#") ? `${f.doc.id}${r.target.claim}` : r.target.claim) : null;
        await q("INSERT INTO relationships (id, source_entity_id, position, type, target_entity_id, target_claim_id, explanation, strength, evidence_direction, status, telescoped, why_uncertain, doc) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
          [id, f.doc.id, i, r.type, r.target?.ref ?? null, targetClaim, r.explanation, r.strength, r.evidence_direction, r.status, r.telescoped ?? null, r.why_uncertain ?? null, r]);
        pushEvidence({ relationship_id: id }, r.evidence);
      }
    }
    for (const f of by("artefact")) {
      for (const [i, a] of (f.doc.evidence_analysis ?? []).entries()) {
        const id = `${f.doc.id}#analysis-${i}`;
        await q("INSERT INTO evidence_analyses (id, entity_id, position, level, statement) VALUES ($1,$2,$3,$4,$5)", [id, f.doc.id, i, a.level, a.statement]);
        pushEvidence({ analysis_id: id }, a.evidence);
      }
    }
    for (const { parent, ev, position } of evidenceRows) {
      await q("INSERT INTO evidence (claim_id, relationship_id, analysis_id, anchor_id, offset_id, source_id, position, locator, captured_passage, demonstrates, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [parent.claim_id ?? null, parent.relationship_id ?? null, parent.analysis_id ?? null, parent.anchor_id ?? null, parent.offset_id ?? null, ev.source.ref, position, ev.locator, ev.captured_passage, ev.demonstrates, ev.note ?? null]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally { await client.end(); }
}

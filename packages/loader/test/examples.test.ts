import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { runPipeline, type PipelineResult } from "../src/index.ts";
import { ROOT, SCHEMAS_DIR, TEST_DB_URL } from "./helpers.ts";

const DATA_DIR = join(ROOT, "data");
const walk = (d: string, out: string[] = []): string[] => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, out) : /\.ya?ml$/.test(n) && out.push(p); } return out; };

describe("(a) the example files in data/ validate and load", () => {
  let result: PipelineResult;
  const pool = new pg.Pool({ connectionString: TEST_DB_URL });
  beforeAll(async () => { result = await runPipeline({ dataDir: DATA_DIR, schemasDir: SCHEMAS_DIR, validateOnly: false, databaseUrl: TEST_DB_URL }); });
  afterAll(() => pool.end());

  it("validates with no errors, no dangling references and no orphans", () => {
    expect(result.report.errors, JSON.stringify(result.report.errors, null, 1)).toEqual([]);
    expect(result.report.dangling).toEqual([]);
    expect(result.report.orphans).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.report.loaded).toBe(true);
  });

  it("covers the ten required subtypes", () => {
    const s = result.report.entitiesBySubtype;
    for (const t of ["person", "event", "place", "passage", "work", "concept", "tradition", "artefact", "source", "media"]) expect(s[t], t).toBeGreaterThanOrEqual(1);
    expect(walk(DATA_DIR).length).toBe(result.report.files);
  });

  it("never marks a claim verified (only a human does that)", () => {
    expect(result.report.claimsByStatus.verified ?? 0).toBe(0);
  });

  it("(g) claims can be queried by model", async () => {
    const q = async (sql: string, params: any[] = []) => (await pool.query(sql, params)).rows;
    const a = await q("SELECT id, value FROM claims WHERE model_id = $1", ["model/a-biblical-literal"]);
    const b = await q("SELECT id, value FROM claims WHERE model_id = $1", ["model/b-conventional-historical"]);
    expect(a.length).toBeGreaterThanOrEqual(1);
    expect(b.length).toBeGreaterThanOrEqual(1);
    for (const row of a) expect(row.value.method, `${row.id} under Model A must be computed (D-007)`).toBe("computed");
    // The same entity carries a date under both models: the "query by model" criterion.
    const both = await q("SELECT entity_id FROM claims WHERE kind='date' GROUP BY entity_id HAVING count(DISTINCT model_id) >= 2");
    expect(both.map((r) => r.entity_id)).toContain("person/hezekiah");
  });

  it("(g) claims can be queried by status", async () => {
    const q = async (sql: string, params: any[] = []) => (await pool.query(sql, params)).rows;
    expect((await q("SELECT id FROM claims WHERE status = $1", ["under_review"])).length).toBeGreaterThanOrEqual(1);
    expect((await q("SELECT id FROM claims WHERE status = $1", ["ai_suggested"])).length).toBeGreaterThanOrEqual(1);
    expect((await q("SELECT id FROM claims WHERE status = $1", ["verified"])).length).toBe(0);
    const byModelAndStatus = await q("SELECT id FROM claims WHERE model_id = $1 AND status = $2", ["model/b-conventional-historical", "under_review"]);
    expect(byModelAndStatus.length).toBeGreaterThanOrEqual(1);
  });

  it("(g) every under_review claim cites an inspected source", async () => {
    const rows = (await pool.query(`
      SELECT c.id FROM claims c
      WHERE c.status = 'under_review'
        AND NOT EXISTS (SELECT 1 FROM evidence e JOIN sources s ON s.entity_id = e.source_id
                        WHERE e.claim_id = c.id AND s.inspection_status = 'inspected')`)).rows;
    expect(rows).toEqual([]);
  });

  it("keeps NARRATES and COMPOSED_AT distinct: entity target versus claim target (D-012)", async () => {
    const narrates = (await pool.query("SELECT target_entity_id, target_claim_id FROM relationships WHERE type='NARRATES'")).rows;
    const composed = (await pool.query("SELECT target_entity_id, target_claim_id FROM relationships WHERE type='COMPOSED_AT'")).rows;
    expect(narrates.length).toBeGreaterThanOrEqual(1);
    expect(composed.length).toBeGreaterThanOrEqual(2);
    for (const r of narrates) { expect(r.target_entity_id).toBeTruthy(); expect(r.target_claim_id).toBeNull(); }
    for (const r of composed) { expect(r.target_claim_id).toBeTruthy(); expect(r.target_entity_id).toBeNull(); }
  });

  it("every relationship carries evidence_direction", async () => {
    const n = Number((await pool.query("SELECT count(*) n FROM relationships WHERE evidence_direction IS NULL OR evidence_direction = ''")).rows[0].n);
    expect(n).toBe(0);
  });
});

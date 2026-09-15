import { describe, it, expect, afterAll } from "vitest";
import pg from "pg";
import { runPipeline } from "../src/index.ts";
import { SCHEMAS_DIR, fixture, TEST_DB_URL } from "./helpers.ts";

describe("loader → PostgreSQL", () => {
  const pool = new pg.Pool({ connectionString: TEST_DB_URL });
  afterAll(() => pool.end());

  it("loads the minimal fixture into normalised tables", async () => {
    const r = await runPipeline({ dataDir: fixture("valid-minimal"), schemasDir: SCHEMAS_DIR, validateOnly: false, databaseUrl: TEST_DB_URL });
    expect(r.report.errors).toEqual([]);
    expect(r.ok).toBe(true);
    const count = async (sql: string) => Number((await pool.query(sql)).rows[0].n);
    expect(await count("SELECT count(*) n FROM entities")).toBe(4);
    expect(await count("SELECT count(*) n FROM sources WHERE inspection_status='inspected'")).toBe(1);
    expect(await count("SELECT count(*) n FROM claims WHERE model_id='model/b-conventional-historical' AND status='under_review'")).toBe(1);
    expect(await count("SELECT count(*) n FROM relationships WHERE type='PARTICIPATED_IN' AND evidence_direction='both'")).toBe(1);
    expect(await count("SELECT count(*) n FROM evidence WHERE source_id='source/oracc-rinap3-q003497'")).toBe(1);
    const label = (await pool.query("SELECT label->>'pt-BR' l FROM entities WHERE id='event/sennacherib-campaign-701'")).rows[0].l;
    expect(label).toBe("Campanha de Senaqueribe");
  });

  it("does not touch the database when validation fails", async () => {
    const r = await runPipeline({ dataDir: fixture("dangling-ref"), schemasDir: SCHEMAS_DIR, validateOnly: false, databaseUrl: TEST_DB_URL });
    expect(r.ok).toBe(false);
    const n = Number((await pool.query("SELECT count(*) n FROM entities")).rows[0].n);
    expect(n).toBe(4); // still the previous load
  });
});

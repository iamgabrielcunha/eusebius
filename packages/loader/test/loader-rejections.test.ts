import { describe, it, expect } from "vitest";
import { runPipeline } from "../src/index.ts";
import { SCHEMAS_DIR, fixture } from "./helpers.ts";

const validateOnly = (name: string) => runPipeline({ dataDir: fixture(name), schemasDir: SCHEMAS_DIR, validateOnly: true });

describe("loader rejections", () => {
  it("(b) rejects a claim missing basis, naming the file and field", async () => {
    const r = await validateOnly("missing-basis");
    expect(r.ok).toBe(false);
    const e = r.report.errors.find((x) => x.message.includes("basis"));
    expect(e, JSON.stringify(r.report.errors)).toBeTruthy();
    expect(e!.file).toMatch(/people\/hezekiah\.yaml$/);
    expect(e!.path).toBe("/claims/0");
    expect(e!.rule).toBe("schema");
  });

  it("(c) rejects an evidence link whose source is inspection_status: discovered", async () => {
    const r = await validateOnly("discovered-source");
    expect(r.ok).toBe(false);
    const e = r.report.errors.find((x) => x.rule === "evidence-source");
    expect(e, JSON.stringify(r.report.errors)).toBeTruthy();
    expect(e!.file).toMatch(/events\/sennacherib-campaign-701\.yaml$/);
    expect(e!.path).toBe("/claims/0/evidence/0");
    expect(e!.message).toContain("source/cah-3-2");
    expect(e!.message).toContain("discovered");
  });

  it("(d) rejects a relationship missing evidence_direction", async () => {
    const r = await validateOnly("missing-evidence-direction");
    expect(r.ok).toBe(false);
    const e = r.report.errors.find((x) => x.message.includes("evidence_direction"));
    expect(e, JSON.stringify(r.report.errors)).toBeTruthy();
    expect(e!.file).toMatch(/people\/hezekiah\.yaml$/);
    expect(e!.path).toBe("/relationships/0");
  });

  it("(e) rejects a bare string in a language-map field with the documented message", async () => {
    const r = await validateOnly("bare-string-label");
    expect(r.ok).toBe(false);
    const e = r.report.errors.find((x) => x.path === "/label");
    expect(e, JSON.stringify(r.report.errors)).toBeTruthy();
    expect(e!.message).toBe('expected a language map {en: "…"}, got a bare string');
  });

  it("(f) reports a ref to a non-existent entity as dangling", async () => {
    const r = await validateOnly("dangling-ref");
    expect(r.ok).toBe(false);
    expect(r.report.dangling).toHaveLength(1);
    expect(r.report.dangling[0]).toMatchObject({ target: "person/nobody", path: "/relationships/0/target" });
    expect(r.report.dangling[0].file).toMatch(/people\/hezekiah\.yaml$/);
    expect(r.report.errors.some((x) => x.rule === "ref")).toBe(true);
  });

  it("rejects an id that does not match its filename", async () => {
    const r = await validateOnly("id-mismatch");
    expect(r.ok).toBe(false);
    const e = r.report.errors.find((x) => x.rule === "id");
    expect(e!.message).toContain("person/hezekiah");
  });
});

describe("loader happy path (validate only)", () => {
  it("accepts the minimal fixture and reports counts and orphans", async () => {
    const r = await validateOnly("valid-minimal");
    expect(r.report.errors, JSON.stringify(r.report.errors)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.report.entitiesBySubtype).toEqual({ person: 2, event: 1, source: 1 });
    expect(r.report.claimsByStatus).toEqual({ under_review: 1 });
    expect(r.report.claimsByModel).toEqual({ "model/b-conventional-historical": 1 });
    expect(r.report.dangling).toEqual([]);
    expect(r.report.orphans).toEqual(["person/isaiah"]);
  });
});

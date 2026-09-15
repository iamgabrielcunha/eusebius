import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const SCHEMAS_DIR = resolve(import.meta.dirname, "../../../schemas");
const CASES_DIR = resolve(import.meta.dirname, "fixtures/schema-cases");
const BASE = "https://github.com/iamgabrielcunha/eusebius/schemas/";

function buildAjv() {
  const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  for (const f of readdirSync(SCHEMAS_DIR).filter((n) => n.endsWith(".schema.json"))) {
    ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS_DIR, f), "utf8")));
  }
  return ajv;
}

const EXPECTED = [
  "language-map", "date", "ref", "evidence", "claim", "relationship", "entity.base",
  "person", "group", "event", "place", "period", "passage", "work", "concept", "tradition",
  "artefact", "technology", "source", "media", "language", "term",
  "chronological-model", "assumption-set", "anchor", "offset",
];

describe("schemas compile", () => {
  const ajv = buildAjv();
  for (const name of EXPECTED) {
    it(`${name}.schema.json exists and compiles`, () => {
      const v = ajv.getSchema(`${BASE}${name}.schema.json`);
      expect(v, `missing schema ${name}`).toBeTruthy();
    });
  }
});

interface Case { schema: string; expect: "valid" | "invalid"; error_contains?: string; doc: unknown }

function loadCases(): [string, Case][] {
  return readdirSync(CASES_DIR).filter((n) => n.endsWith(".yaml")).sort().map((n) => {
    const raw = readFileSync(join(CASES_DIR, n), "utf8");
    const parsed = parse(raw) as { schema: string; expect: "valid" | "invalid"; error_contains?: string; doc: unknown };
    return [n, parsed];
  });
}

describe("schema cases", () => {
  const ajv = buildAjv();
  for (const [file, c] of loadCases()) {
    it(`${file} is ${c.expect}`, () => {
      const validate = ajv.getSchema(`${BASE}${c.schema}.schema.json`);
      expect(validate, `schema ${c.schema} not found`).toBeTruthy();
      const ok = validate!(c.doc);
      const text = ajv.errorsText(validate!.errors, { separator: "\n" });
      if (c.expect === "valid") expect(ok, text).toBe(true);
      else {
        expect(ok, "expected rejection").toBe(false);
        if (c.error_contains) expect(text + JSON.stringify(validate!.errors)).toContain(c.error_contains);
      }
    });
  }
});

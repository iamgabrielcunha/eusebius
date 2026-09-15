import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = resolve(import.meta.dirname, "../../..");
const DOC = join(ROOT, "docs/04-language-map-convention.md");
const SCHEMAS_DIR = join(ROOT, "schemas");
const BASE = "https://github.com/iamgabrielcunha/eusebius/schemas/";

function ajv() {
  const a = new Ajv2020({ strict: true, strictRequired: false, allErrors: true, allowUnionTypes: true });
  addFormats(a);
  for (const f of readdirSync(SCHEMAS_DIR).filter((n) => n.endsWith(".schema.json")))
    a.addSchema(JSON.parse(readFileSync(join(SCHEMAS_DIR, f), "utf8")));
  return a;
}

/** Fenced blocks preceded by an HTML comment marker, e.g. <!-- example: person --> */
function taggedBlocks(md: string, tag: string): { arg: string; body: string }[] {
  const re = new RegExp(`<!-- ${tag}(?::\\s*([^\\s>]+))? -->\\s*\\n\`\`\`[a-z]*\\n([\\s\\S]*?)\`\`\``, "g");
  const out: { arg: string; body: string }[] = [];
  for (const m of md.matchAll(re)) out.push({ arg: m[1] ?? "", body: m[2] });
  return out;
}

describe("docs/04-language-map-convention.md", () => {
  it("exists", () => expect(existsSync(DOC)).toBe(true));

  it("contains the exact language-map fragment the loader enforces", () => {
    const md = readFileSync(DOC, "utf8");
    const blocks = taggedBlocks(md, "schema-fragment");
    expect(blocks.length, "one <!-- schema-fragment --> block").toBe(1);
    const inDoc = JSON.parse(blocks[0].body);
    const real = JSON.parse(readFileSync(join(SCHEMAS_DIR, "language-map.schema.json"), "utf8"));
    expect(inDoc).toEqual({ "language-map": real.$defs["language-map"], "original-term": real.$defs["original-term"], bcp47: real.$defs.bcp47 });
  });

  it("has three worked YAML examples that validate against their schemas", () => {
    const md = readFileSync(DOC, "utf8");
    const examples = taggedBlocks(md, "example");
    expect(examples.length, "three <!-- example: <schema> --> blocks").toBe(3);
    const a = ajv();
    for (const ex of examples) {
      const validate = a.getSchema(`${BASE}${ex.arg}.schema.json`);
      expect(validate, `schema ${ex.arg}`).toBeTruthy();
      const ok = validate!(parse(ex.body));
      expect(ok, `${ex.arg} example: ${a.errorsText(validate!.errors)}`).toBe(true);
    }
  });

  it("shows a rejected bare-string example that really is rejected", () => {
    const md = readFileSync(DOC, "utf8");
    const bad = taggedBlocks(md, "rejected");
    expect(bad.length).toBe(1);
    const a = ajv();
    const validate = a.getSchema(`${BASE}${bad[0].arg}.schema.json`)!;
    expect(validate(parse(bad[0].body))).toBe(false);
  });
});

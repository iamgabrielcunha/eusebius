import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export const SCHEMA_BASE = "https://github.com/iamgabrielcunha/eusebius/schemas/";

/** data/ directory → schema name. Order matters: longer paths first. */
export const DIRECTORY_SCHEMA: Record<string, string> = {
  "models/chronological-models": "chronological-model",
  "models/assumption-sets": "assumption-set",
  "models/anchors": "anchor",
  "models/offsets": "offset",
  people: "person", groups: "group", events: "event", places: "place", periods: "period",
  passages: "passage", works: "work", concepts: "concept", traditions: "tradition",
  artefacts: "artefact", technologies: "technology", sources: "source", media: "media",
  languages: "language", terms: "term",
};

/** schema name → id prefix */
export const ID_PREFIX: Record<string, string> = {
  "chronological-model": "model", "assumption-set": "assumption-set", anchor: "anchor", offset: "offset",
};
export function idPrefixFor(schema: string): string { return ID_PREFIX[schema] ?? schema; }

export const ENTITY_SCHEMAS = new Set(["person", "group", "event", "place", "period", "passage", "work", "concept", "tradition", "artefact", "technology", "source", "media", "language", "term"]);

export function schemaForDirectory(dir: string): string | undefined {
  return DIRECTORY_SCHEMA[dir];
}

export function loadSchemas(schemasDir: string): Ajv2020 {
  const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true, allowUnionTypes: true, verbose: true });
  addFormats(ajv);
  for (const f of readdirSync(schemasDir).filter((n) => n.endsWith(".schema.json"))) {
    ajv.addSchema(JSON.parse(readFileSync(join(schemasDir, f), "utf8")));
  }
  return ajv;
}

export function validatorFor(ajv: Ajv2020, schema: string): ValidateFunction {
  const v = ajv.getSchema(`${SCHEMA_BASE}${schema}.schema.json`);
  if (!v) throw new Error(`schema not found: ${schema}`);
  return v;
}

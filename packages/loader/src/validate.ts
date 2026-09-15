import type Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import { basename } from "node:path";
import type { LoadedFile, LoaderError } from "./types.ts";
import { validatorFor, idPrefixFor } from "./schemas.ts";

/** True when the failing subschema is the language-map definition (verbose errors carry parentSchema). */
const isLanguageMapSchema = (schema: any) => !!schema && typeof schema === "object" && "propertyNames" in schema && Array.isArray(schema.required) && schema.required.includes("en");

/** Turn Ajv's errors into one LoaderError per (path, message), with friendlier text for the common cases. */
function mapErrors(file: string, errors: ErrorObject[]): LoaderError[] {
  const out = new Map<string, LoaderError>();
  for (const e of errors) {
    const path = e.instancePath;
    let message: string;
    if (e.keyword === "required") {
      message = `missing required field "${(e.params as any).missingProperty}"`;
    } else if (e.keyword === "type" && (e.params as any).type === "object" && isLanguageMapSchema(e.parentSchema)) {
      message = 'expected a language map {en: "…"}, got a bare string';
    } else if (e.keyword === "enum") {
      message = `must be one of: ${(e.params as any).allowedValues.join(", ")}`;
    } else if (e.keyword === "const") {
      message = `must be "${(e.params as any).allowedValue}"`;
    } else if (e.keyword === "additionalProperties" || e.keyword === "unevaluatedProperties") {
      message = `unknown field "${(e.params as any).additionalProperty ?? (e.params as any).unevaluatedProperty}"`;
    } else if (e.keyword === "if" || e.keyword === "oneOf" || e.keyword === "anyOf" || e.keyword === "allOf") {
      continue; // the branch errors carry the detail
    } else {
      message = e.message ?? e.keyword;
    }
    const key = `${path}|${message}`;
    if (!out.has(key)) out.set(key, { file, path, message, rule: "schema" });
  }
  return [...out.values()];
}

export function validateFiles(files: LoadedFile[], ajv: Ajv2020): LoaderError[] {
  const errors: LoaderError[] = [];
  const uuids = new Map<string, string>();
  const ids = new Map<string, string>();
  for (const f of files) {
    const validate = validatorFor(ajv, f.schema);
    if (!validate(f.doc)) errors.push(...mapErrors(f.file, validate.errors ?? []));

    const id = f.doc.id;
    if (typeof id === "string") {
      const expected = `${idPrefixFor(f.schema)}/${basename(f.file).replace(/\.ya?ml$/, "")}`;
      if (id !== expected) errors.push({ file: f.file, path: "/id", message: `id "${id}" does not match its location; expected "${expected}"`, rule: "id" });
      if (ids.has(id)) errors.push({ file: f.file, path: "/id", message: `duplicate id "${id}" (also in ${ids.get(id)})`, rule: "id" });
      else ids.set(id, f.file);
    }
    const uuid = f.doc.uuid;
    if (typeof uuid === "string") {
      if (uuids.has(uuid)) errors.push({ file: f.file, path: "/uuid", message: `duplicate uuid "${uuid}" (also in ${uuids.get(uuid)})`, rule: "uuid" });
      else uuids.set(uuid, f.file);
    }
  }
  return errors;
}

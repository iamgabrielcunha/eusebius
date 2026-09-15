import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { parse } from "yaml";
import type { LoadedFile, LoaderError } from "./types.ts";
import { schemaForDirectory } from "./schemas.ts";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.ya?ml$/.test(name)) out.push(p);
  }
  return out;
}

export function readDataFiles(dataDir: string): { files: LoadedFile[]; errors: LoaderError[] } {
  const files: LoadedFile[] = [];
  const errors: LoaderError[] = [];
  for (const abs of walk(dataDir)) {
    const file = relative(dataDir, abs).split(sep).join("/");
    const dir = dirname(file);
    const schema = schemaForDirectory(dir);
    if (!schema) { errors.push({ file, path: "", message: `directory "${dir}" has no schema; see schemas/README.md`, rule: "io" }); continue; }
    try {
      const doc = parse(readFileSync(abs, "utf8"));
      if (doc === null || typeof doc !== "object") { errors.push({ file, path: "", message: "file is empty or not a YAML mapping", rule: "io" }); continue; }
      files.push({ file, dir, schema, doc });
    } catch (e: any) {
      errors.push({ file, path: "", message: `YAML parse error: ${e.message}`, rule: "io" });
    }
  }
  return { files, errors };
}

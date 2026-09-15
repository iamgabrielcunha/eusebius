import type { LoadedFile, LoaderError } from "./types.ts";
import { collectRefs } from "./refs.ts";

/** Cross-file rules that JSON Schema cannot express. */
export function crossFileRules(files: LoadedFile[]): LoaderError[] {
  const errors: LoaderError[] = [];
  const byId = new Map<string, LoadedFile>();
  for (const f of files) if (typeof f.doc.id === "string") byId.set(f.doc.id, f);

  for (const f of files) {
    for (const r of collectRefs(f)) {
      if (r.kind !== "ref") continue;
      const target = byId.get(r.target);
      if (!target) continue; // reported as dangling by resolveRefs

      // D-016: evidence may only cite an inspected source.
      if (/\/evidence\/\d+\/source$/.test(r.path)) {
        if (target.schema !== "source") errors.push({ file: f.file, path: r.path, message: `evidence source must be a source/ entity, got "${r.target}"`, rule: "ref-type" });
        else if (target.doc.inspection_status !== "inspected") errors.push({ file: f.file, path: r.path.replace(/\/source$/, ""), message: `evidence cites "${r.target}" whose inspection_status is "${target.doc.inspection_status}"; only inspected sources may be cited (D-016)`, rule: "evidence-source" });
        continue;
      }
      // Typed references.
      const expect = (schema: string) => { if (target.schema !== schema) errors.push({ file: f.file, path: r.path, message: `"${r.target}" must be a ${schema}, got ${target.schema}`, rule: "ref-type" }); };
      if (/^\/claims\/\d+\/model$/.test(r.path) || r.path === "/model") expect("chronological-model");
      else if (/^\/claims\/\d+\/assumption_set$/.test(r.path)) expect("assumption-set");
      else if (/\/value\/anchor$/.test(r.path)) expect("anchor");
      else if (/\/value\/chain\/\d+\/offset$/.test(r.path)) expect("offset");
      else if (/^\/claims\/\d+\/value\/tradition$/.test(r.path)) expect("tradition");
      else if (r.path === "/work") expect("work");
      else if (r.path === "/authority") expect("source");
      else if (r.path === "/parent" && f.schema === "tradition") expect("tradition");
      else if (r.path === "/language") expect("language");
      else if (r.path === "/default_assumption_set") expect("assumption-set");
      else if (r.path === "/passage") expect("passage");
    }
  }
  return errors;
}

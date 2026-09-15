import type { LoadedFile, LoaderError, Report, Dangling } from "./types.ts";
import { ENTITY_SCHEMAS } from "./schemas.ts";
import { collectRefs } from "./refs.ts";

const inc = (m: Record<string, number>, k: string) => { m[k] = (m[k] ?? 0) + 1; };

export function buildReport(files: LoadedFile[], errors: LoaderError[], dangling: Dangling[]): Report {
  const entitiesBySubtype: Record<string, number> = {};
  const claimsByStatus: Record<string, number> = {};
  const claimsByModel: Record<string, number> = {};
  const connected = new Set<string>();
  for (const f of files) {
    if (ENTITY_SCHEMAS.has(f.schema)) inc(entitiesBySubtype, f.schema);
    for (const c of f.doc.claims ?? []) {
      if (c?.status) inc(claimsByStatus, c.status);
      const m = typeof c?.model === "string" ? c.model : c?.model?.ref;
      if (m) inc(claimsByModel, m);
    }
    for (const r of f.doc.relationships ?? []) {
      connected.add(f.doc.id);
      if (r?.target?.ref) connected.add(r.target.ref);
    }
    // Media depicting an entity and evidence citing a source count as connections.
    // Media depicting an entity, evidence citing a source, a View naming a tradition, and attributed_to all count as connections.
    for (const r of collectRefs(f)) {
      if (/^\/depicts\/\d+$/.test(r.path) || /\/evidence\/\d+\/source$/.test(r.path) || /^\/claims\/\d+\/value\/tradition$/.test(r.path) || /^\/claims\/\d+\/attributed_to\/\d+$/.test(r.path)) {
        connected.add(r.target); connected.add(f.doc.id);
      }
    }
  }
  const orphans = files
    .filter((f) => ENTITY_SCHEMAS.has(f.schema) && !connected.has(f.doc.id))
    .map((f) => f.doc.id as string)
    .sort();
  return { files: files.length, entitiesBySubtype, claimsByStatus, claimsByModel, orphans, dangling, errors, loaded: false };
}

function table(title: string, rows: Record<string, number>): string {
  const keys = Object.keys(rows).sort();
  if (keys.length === 0) return `${title}\n  (none)`;
  const w = Math.max(...keys.map((k) => k.length));
  return `${title}\n` + keys.map((k) => `  ${k.padEnd(w)}  ${rows[k]}`).join("\n");
}

export function formatReport(r: Report): string {
  const lines: string[] = [];
  lines.push(`Eusebius loader — ${r.files} file(s) read${r.loaded ? ", loaded into PostgreSQL" : ""}`);
  lines.push("");
  lines.push(table("Entities per subtype", r.entitiesBySubtype));
  lines.push("");
  lines.push(table("Claims per status", r.claimsByStatus));
  lines.push("");
  lines.push(table("Claims per model", r.claimsByModel));
  lines.push("");
  lines.push(`Orphan entities (no relationship in or out): ${r.orphans.length}`);
  for (const o of r.orphans) lines.push(`  ${o}`);
  lines.push("");
  lines.push(`Dangling references: ${r.dangling.length}`);
  for (const d of r.dangling) lines.push(`  ${d.file}:${d.path} → ${d.target}`);
  lines.push("");
  if (r.errors.length === 0) lines.push("OK — no errors");
  else {
    lines.push(`ERRORS (${r.errors.length}):`);
    for (const e of r.errors) lines.push(`  ${e.file}:${e.path || "/"} — ${e.message} [${e.rule}]`);
  }
  return lines.join("\n");
}

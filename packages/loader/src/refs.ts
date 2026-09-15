import type { Dangling, LoadedFile, LoaderError } from "./types.ts";

export interface FoundRef { file: string; path: string; kind: "ref" | "claim"; target: string }

/** Depth-first walk collecting every {ref: …} and {claim: …} object. */
export function collectRefs(f: LoadedFile): FoundRef[] {
  const out: FoundRef[] = [];
  const visit = (node: any, path: string) => {
    if (Array.isArray(node)) { node.forEach((v, i) => visit(v, `${path}/${i}`)); return; }
    if (node === null || typeof node !== "object") return;
    const keys = Object.keys(node);
    if (keys.length === 1 && keys[0] === "ref" && typeof node.ref === "string") { out.push({ file: f.file, path, kind: "ref", target: node.ref }); return; }
    if (keys.length === 1 && keys[0] === "claim" && typeof node.claim === "string") {
      const t = node.claim.startsWith("#") ? `${f.doc.id}${node.claim}` : node.claim;
      out.push({ file: f.file, path, kind: "claim", target: t }); return;
    }
    for (const k of keys) visit(node[k], `${path}/${k}`);
  };
  visit(f.doc, "");
  return out;
}

export function indexIds(files: LoadedFile[]): { ids: Set<string>; claimKeys: Set<string> } {
  const ids = new Set<string>();
  const claimKeys = new Set<string>();
  for (const f of files) {
    if (typeof f.doc.id === "string") ids.add(f.doc.id);
    for (const c of f.doc.claims ?? []) if (c && typeof c.id === "string") claimKeys.add(`${f.doc.id}#${c.id}`);
  }
  return { ids, claimKeys };
}

export function resolveRefs(files: LoadedFile[]): { dangling: Dangling[]; errors: LoaderError[] } {
  const { ids, claimKeys } = indexIds(files);
  const dangling: Dangling[] = [];
  const errors: LoaderError[] = [];
  for (const f of files) for (const r of collectRefs(f)) {
    const ok = r.kind === "ref" ? ids.has(r.target) : claimKeys.has(r.target);
    if (!ok) {
      dangling.push({ file: r.file, path: r.path, target: r.target });
      errors.push({ file: r.file, path: r.path, message: `dangling ${r.kind}: "${r.target}" does not exist`, rule: "ref" });
    }
  }
  return { dangling, errors };
}

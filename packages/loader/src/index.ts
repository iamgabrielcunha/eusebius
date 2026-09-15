import { readDataFiles } from "./read.ts";
import { loadSchemas } from "./schemas.ts";
import { validateFiles } from "./validate.ts";
import { resolveRefs } from "./refs.ts";
import { crossFileRules } from "./rules.ts";
import { buildReport, formatReport } from "./report.ts";
import { loadIntoPostgres, DEFAULT_DATABASE_URL } from "./db.ts";
import type { PipelineOptions, PipelineResult, LoaderError } from "./types.ts";

export type { PipelineOptions, PipelineResult, Report, LoaderError } from "./types.ts";
export { formatReport } from "./report.ts";

/** read → validate → resolve refs → cross-file rules → (load) → report */
export async function runPipeline(o: PipelineOptions): Promise<PipelineResult> {
  const { files, errors: ioErrors } = readDataFiles(o.dataDir);
  const ajv = loadSchemas(o.schemasDir);
  const errors: LoaderError[] = [...ioErrors, ...validateFiles(files, ajv)];
  const { dangling, errors: refErrors } = resolveRefs(files);
  errors.push(...refErrors, ...crossFileRules(files));
  const report = buildReport(files, errors, dangling);
  if (errors.length === 0 && !o.validateOnly) {
    try {
      await loadIntoPostgres(files, o.databaseUrl ?? DEFAULT_DATABASE_URL);
      report.loaded = true;
    } catch (e: any) {
      report.errors.push({ file: "", path: "", message: `database load failed: ${e.message}`, rule: "db" });
    }
  }
  return { ok: report.errors.length === 0, report };
}

export { formatReport as format };

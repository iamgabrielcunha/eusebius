export type Rule = "schema" | "id" | "uuid" | "ref" | "evidence-source" | "ref-type" | "io" | "db";

export interface LoaderError {
  file: string;   // path relative to the data directory
  path: string;   // JSON pointer inside the document ("" = whole file)
  message: string;
  rule: Rule;
}

export interface LoadedFile {
  file: string;   // relative path
  dir: string;    // directory relative to dataDir, e.g. "people" or "models/anchors"
  schema: string; // schema name chosen by directory
  doc: any;
}

export interface Dangling { file: string; path: string; target: string }

export interface Report {
  files: number;
  entitiesBySubtype: Record<string, number>;
  claimsByStatus: Record<string, number>;
  claimsByModel: Record<string, number>;
  orphans: string[];
  dangling: Dangling[];
  errors: LoaderError[];
  loaded: boolean;
}

export interface PipelineOptions {
  dataDir: string;
  schemasDir: string;
  validateOnly: boolean;
  databaseUrl?: string;
}

export interface PipelineResult { ok: boolean; report: Report }

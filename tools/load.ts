#!/usr/bin/env node
/**
 * Eusebius data loader CLI.
 *   node tools/load.ts                 validate data/ and load into PostgreSQL
 *   node tools/load.ts --validate-only validate only
 * Env: DATABASE_URL (default postgres://localhost:5432/eusebius), EUSEBIUS_DATA_DIR (default data/)
 * Exits 1 on any error so CI can gate pull requests.
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runPipeline, formatReport } from "../packages/loader/src/index.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validateOnly = process.argv.includes("--validate-only");
const dataDir = process.env.EUSEBIUS_DATA_DIR ? resolve(root, process.env.EUSEBIUS_DATA_DIR) : resolve(root, "data");
const schemasDir = resolve(root, "schemas");

const { ok, report } = await runPipeline({ dataDir, schemasDir, validateOnly, databaseUrl: process.env.DATABASE_URL });
console.log(formatReport(report));
process.exit(ok ? 0 : 1);

import { resolve } from "node:path";
export const ROOT = resolve(import.meta.dirname, "../../..");
export const SCHEMAS_DIR = resolve(ROOT, "schemas");
export const fixture = (name: string) => resolve(import.meta.dirname, "fixtures", name);
export const TEST_DB_URL = process.env.DATABASE_URL_TEST ?? "postgres://localhost:5432/eusebius_test";

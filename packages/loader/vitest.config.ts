import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 30000,
    // The database tests share one eusebius_test database; run files one at a time.
    fileParallelism: false,
  },
});

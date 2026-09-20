import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    typecheck: {
      enabled: true,
      include: ["test/**/*.test.ts"],
    },
    coverage: {
      provider: "v8",
      include: ["src/**"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // JSX des tests de composants : runtime automatique de React 19 (tsconfig garde « preserve » pour Next)
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    include: ["**/*.test.{ts,tsx}"],
    // e2e/ : Playwright (pnpm test:e2e), pas Vitest
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    // Les tests de composants choisissent jsdom avec // @vitest-environment jsdom
    setupFiles: ["./vitest.setup.ts"],
  },
});

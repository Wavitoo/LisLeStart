import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Tests de bout en bout et d'accessibilité (axe-core) : `pnpm --filter @lislestart/web test:e2e`.
 * Lance Next avec l'API simulée (API_MOCK=true) : aucun backend ni base de données nécessaire.
 * Navigateur à installer une fois : `pnpm --filter @lislestart/web exec playwright install chromium`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/admin/tournois/nouveau`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { API_MOCK: "true" },
  },
});

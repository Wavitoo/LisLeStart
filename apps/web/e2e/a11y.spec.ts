import { readdirSync } from "node:fs";
import { resolve, sep } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Exemple d'URL pour chaque route dynamique (l'id ne peut pas être deviné).
// Une route dynamique sans exemple fait échouer le test ci-dessous.
const dynamicExamples: Record<string, string> = {
  "/tournois/[id]": "/tournois/coupe-hiver", // tournoi de l'API simulée
};

// Routes découvertes depuis app/**/page.tsx : groupes « (x) » retirés, dossiers « _x » et « @x » ignorés.
const appDir = resolve(__dirname, "../app");
const routes = readdirSync(appDir, { recursive: true, encoding: "utf8" })
  .filter((file) => /(^|[\\/])page\.tsx$/.test(file))
  .map((file) => file.split(sep).slice(0, -1))
  .filter((segments) => !segments.some((s) => s.startsWith("_") || s.startsWith("@")))
  .map((segments) => "/" + segments.filter((s) => !/^\(.*\)$/.test(s)).join("/"));

const dynamicRoutes = routes.filter((route) => route.includes("["));
const pages = [
  ...routes.filter((route) => !route.includes("[")),
  ...dynamicRoutes.flatMap((route) => dynamicExamples[route] ?? []),
  "/page-inexistante", // page 404
];

test("chaque page de app/ est couverte", () => {
  expect(routes).toContain("/");
  const missing = dynamicRoutes.filter((route) => !dynamicExamples[route]);
  expect(missing, `Ajouter un exemple dans dynamicExamples pour : ${missing.join(", ")}`).toEqual(
    [],
  );
});

for (const path of pages) {
  test(`aucune violation axe sérieuse ou critique : ${path}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}) : ${v.help} — ${v.nodes.map((n) => n.target).join(", ")}`);
    expect(blocking, blocking.join("\n")).toEqual([]);
  });
}

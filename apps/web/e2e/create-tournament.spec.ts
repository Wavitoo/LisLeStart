import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const URL = "/admin/tournois/nouveau";
/** Règles WCAG 2.0, 2.1 et 2.2, niveaux A et AA. */
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}) : ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary).toEqual([]);
}

async function openPage(page: Page) {
  await page.goto(URL);
  await expect(page.getByRole("heading", { level: 1, name: "Créer un tournoi" })).toBeVisible();
  // Attendre l'hydratation : le bouton d'ajout réagit
  await expect(page.getByRole("button", { name: /Ajouter une étape/ })).toBeEnabled();
}

test.describe("Créer un tournoi : accessibilité", () => {
  test("aucune violation axe sur la page par défaut", async ({ page }) => {
    await openPage(page);
    await expectNoAxeViolations(page);
  });

  test("aucune violation axe avec les erreurs affichées", async ({ page }) => {
    await openPage(page);
    await page.getByLabel("Début", { exact: true }).fill("2026-12-13T18:00");
    await page.getByLabel("Fin", { exact: true }).fill("2026-12-12T18:00");
    await page.getByRole("button", { name: "Publier le tournoi" }).click();

    const summary = page.getByRole("heading", { name: /Le formulaire contient \d+ erreurs/ });
    await expect(summary).toBeVisible();
    await expect(summary.locator("..")).toBeFocused();
    await expect(page.getByLabel("Fin", { exact: true })).toHaveAttribute("aria-invalid", "true");

    await expectNoAxeViolations(page);
  });

  test("aucune violation axe avec plusieurs étapes et la boîte « Ajouter un champ » ouverte", async ({
    page,
  }) => {
    await openPage(page);
    await page.getByRole("button", { name: /Ajouter une étape/ }).click();
    await page.getByRole("button", { name: "+ Ajouter un champ" }).click();
    await page.getByRole("button", { name: "Ajouter le champ" }).click();
    await expect(page.getByRole("dialog").getByText(/Indique le nom du champ/)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("zoom 200 % : pas de défilement horizontal", async ({ page }) => {
    // 1280 px à 200 % = 640 px CSS
    await page.setViewportSize({ width: 640, height: 900 });
    await openPage(page);
    await page.getByRole("button", { name: "Publier le tournoi" }).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("prefers-reduced-motion : aucune transition", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPage(page);
    const transition = await page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { level: 3 }) })
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(transition).toBe("0s");
  });
});

test.describe("Créer un tournoi : étapes", () => {
  test("réordonne à la souris avec la poignée et annonce la nouvelle position", async ({
    page,
  }) => {
    await openPage(page);
    await page.getByRole("button", { name: /Ajouter une étape/ }).click();
    const stages = page.getByRole("list", { name: "Étapes du tournoi, dans l'ordre" });
    // Étape 2 en ronde suisse pour distinguer les cartes
    await page.locator("#field-stages-1-format").click();
    await page.getByRole("option", { name: "Ronde suisse" }).click();
    await expect(stages.getByRole("heading", { level: 3 })).toHaveText([
      "Étape 1 · Élimination simple",
      "Étape 2 · Ronde suisse",
    ]);

    const handle = page.getByTestId("stage-handle-1");
    const target = page.getByTestId("stage-handle-0");
    const from = await handle.boundingBox();
    const to = await target.boundingBox();
    if (!from || !to) throw new Error("poignées introuvables");
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2, from.y - 10, { steps: 5 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect(stages.getByRole("heading", { level: 3 })).toHaveText([
      "Étape 1 · Ronde suisse",
      "Étape 2 · Élimination simple",
    ]);
    await expect(page.locator('[aria-live="polite"]')).toHaveText("Étape 2 déplacée en position 1");
  });

  test("parcours au clavier seul : remplir, réordonner, publier", async ({ page }) => {
    await openPage(page);
    await page.getByLabel("Nom du tournoi").fill("Coupe d'hiver");
    // Jeu : liste Radix au clavier
    await page.locator("#field-gameId").focus();
    await page.keyboard.press("Enter");
    await page.getByRole("option", { name: "FPS 5v5" }).press("Enter");
    await expect(page.locator("#field-gameId")).toHaveText(/FPS 5v5/);
    await page.getByLabel("Début", { exact: true }).fill("2026-12-13T18:00");
    await page.getByLabel("Fin", { exact: true }).fill("2026-12-15T18:00");
    await page.getByLabel("Places").fill("16");

    await page.getByRole("button", { name: /Ajouter une étape/ }).press("Enter");
    await expect(page.locator("#field-stages-1-format")).toBeFocused();
    await page.getByRole("button", { name: "Monter l'étape 2" }).press("Enter");
    await expect(page.locator('[aria-live="polite"]')).toHaveText("Étape 2 déplacée en position 1");

    await page.getByRole("button", { name: "Publier le tournoi" }).press("Enter");
    await expect(page.getByRole("button", { name: /Publication…/ })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(
      page.getByText("Tournoi « Coupe d'hiver » publié.", { exact: false }),
    ).toBeFocused();
  });
});

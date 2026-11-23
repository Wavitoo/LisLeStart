import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const URL = "/tournois/coupe-hiver";
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}) : ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary).toEqual([]);
}

async function openPage(page: Page, url = URL) {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Hydratation terminée : les onglets Radix réagissent
  await expect(page.getByRole("tab", { name: "Graphique" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
}

test.describe("Page tournoi : accessibilité", () => {
  test("aucune violation axe en vue arbre", async ({ page }) => {
    await openPage(page);
    await expectNoAxeViolations(page);
  });

  test("aucune violation axe en vue liste", async ({ page }) => {
    await openPage(page);
    await page.getByRole("tab", { name: "Liste" }).click();
    await expect(page.getByRole("table", { name: "Quarts de finale" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("aucune violation axe sur un tournoi sans données (états vides)", async ({ page }) => {
    await page.goto("/tournois/ligue-babyfoot");
    await expect(
      page.getByText("Le planning sera publié avant le début du tournoi."),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("tournoi inconnu : page 404 accessible", async ({ page }) => {
    const response = await page.goto("/tournois/inconnu");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Tournoi introuvable" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("structure : un h1, un h2 par section, aucun niveau sauté", async ({ page }) => {
    await openPage(page);
    const headings = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((nodes) =>
        nodes.map((n) => ({ level: Number(n.tagName[1]), text: n.textContent })),
      );
    expect(headings.filter((h) => h.level === 1)).toHaveLength(1);
    expect(headings.filter((h) => h.level === 2).map((h) => h.text)).toEqual([
      "Arbre",
      "Participants",
      "Planning",
      "Classement",
    ]);
    headings.forEach((heading, index) => {
      if (index > 0) expect(heading.level - headings[index - 1]!.level).toBeLessThanOrEqual(1);
    });
    await expect(page.locator("header")).toHaveCount(2); // en-tête du site et du tournoi
    await expect(page.getByRole("main")).toHaveCount(1);
  });

  test("zoom 200 % : pas de défilement horizontal de la page", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await openPage(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Page tournoi : clavier seul", () => {
  test("lien d'évitement, navigation interne, bascule de vue, arbre défilable sans piège", async ({
    page,
  }) => {
    // Assez étroit pour que l'arbre déborde et doive défiler
    await page.setViewportSize({ width: 800, height: 900 });
    await openPage(page);

    // 1. Lien d'évitement, premier arrêt de tabulation
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Aller au contenu" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();

    // 2. Fil d'Ariane, puis navigation interne : les quatre ancres, dans l'ordre
    await page.keyboard.press("Tab");
    await expect(
      page
        .getByRole("navigation", { name: "Fil d'Ariane" })
        .getByRole("link", { name: "Tournois" }),
    ).toBeFocused();
    const nav = page.getByRole("navigation", { name: "Sections du tournoi" });
    for (const label of ["Arbre", "Participants", "Planning", "Classement"]) {
      await page.keyboard.press("Tab");
      await expect(nav.getByRole("link", { name: label })).toBeFocused();
    }

    // 3. Bascule de vue : onglets Radix, flèches gauche/droite
    await page.keyboard.press("Tab");
    const treeTab = page.getByRole("tab", { name: "Graphique" });
    const listTab = page.getByRole("tab", { name: "Liste" });
    await expect(treeTab).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(listTab).toBeFocused();
    await expect(listTab).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(treeTab).toHaveAttribute("aria-selected", "true");

    // Anneau de focus visible : contour lime de 3 px
    const outline = await treeTab.evaluate((el) => {
      const style = getComputedStyle(el);
      return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`;
    });
    expect(outline).toBe("solid 3px rgb(198, 244, 50)");

    // 4. Arbre : la zone de défilement prend le focus et défile aux flèches
    await page.keyboard.press("Tab");
    const winners = page.getByRole("region", { name: "Tableau principal, défilement horizontal" });
    await expect(winners).toBeFocused();
    const scrollable = await winners.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrollable).toBe(true);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => winners.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);

    // 5. Pas de piège : Tab passe à la zone suivante
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("region", { name: "Repêchage, défilement horizontal" }),
    ).toBeFocused();
  });

  test("une ancre de la navigation interne met l'adresse à jour", async ({ page }) => {
    await openPage(page);
    await page
      .getByRole("navigation", { name: "Sections du tournoi" })
      .getByRole("link", { name: "Planning" })
      .press("Enter");
    await expect(page).toHaveURL(/#planning$/);
    await expect(page.getByRole("heading", { level: 2, name: "Planning" })).toBeInViewport();
  });
});

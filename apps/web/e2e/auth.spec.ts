import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { MOCK_ADMIN_CREDENTIALS } from "../lib/api/auth-api";
import { loginAsAdmin, waitForForm } from "./helpers";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}) : ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary).toEqual([]);
}

/** Email unique : les tests tournent en parallèle sur le même magasin en mémoire. */
const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@exemple.test`;

const passwordInput = (page: Page) => page.getByLabel("Mot de passe", { exact: true });

test.describe("Connexion et inscription : accessibilité", () => {
  for (const [path, button] of [
    ["/connexion", "Se connecter"],
    ["/inscription", "Créer mon compte"],
  ] as const) {
    test(`${path} : aucune violation axe, avant et après une erreur`, async ({ page }) => {
      await page.goto(path);
      await waitForForm(page);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoAxeViolations(page);

      await page.getByRole("button", { name: button }).click();
      await expect(
        page.getByRole("heading", { name: /Le formulaire contient \d+ erreurs?/ }),
      ).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("identifiants refusés : alerte annoncée, aucune violation axe", async ({ page }) => {
    await page.goto("/connexion");
    await waitForForm(page);
    await page.getByLabel("Email").fill("personne@exemple.test");
    await passwordInput(page).fill("pas le bon");
    await page.getByRole("button", { name: "Se connecter" }).click();
    // Next a aussi une région role="alert" (annonce des changements de page) : on cible <main>
    const alert = page.getByRole("main").getByRole("alert");
    await expect(alert).toContainText("Email ou mot de passe incorrect");
    await expect(alert).toBeFocused();
    await expectNoAxeViolations(page);
  });

  test("zoom 200 % : pas de défilement horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto("/inscription");
    await waitForForm(page);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Connexion et inscription : parcours", () => {
  test("inscription au clavier seul, puis déconnexion", async ({ page }) => {
    await page.goto("/inscription");
    await waitForForm(page);
    await expect(page.getByRole("heading", { level: 1, name: "Créer un compte" })).toBeVisible();
    const email = uniqueEmail();

    await page.getByLabel("Pseudo").focus();
    await page.keyboard.type("renard_bleu");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email")).toBeFocused();
    await page.keyboard.type(email);
    await page.keyboard.press("Tab");
    await expect(passwordInput(page)).toBeFocused();
    await page.keyboard.type("trois mots au hasard");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Afficher le mot de passe" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(passwordInput(page)).toHaveAttribute("type", "text");
    // Profil : Tab entre dans le groupe, la flèche choisit « Joueur »
    await page.keyboard.press("Tab");
    await expect(page.getByRole("radio", { name: /Spectateur/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: /Joueur/ })).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Créer mon compte" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/tournois$/);
    const header = page.locator("body > header");
    await expect(header).toContainText("renard_bleu");
    await header.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/$/);
    // Retour à l'accueil déconnecté : l'en-tête propose de nouveau la connexion
    const homeHeader = page.locator("body > header");
    await expect(homeHeader.getByRole("link", { name: "Se connecter" })).toBeVisible();
    await expect(homeHeader).not.toContainText("renard_bleu");
  });

  test("email déjà utilisé : erreur sous le champ Email", async ({ page }) => {
    await page.goto("/inscription");
    await waitForForm(page);
    await page.getByLabel("Pseudo").fill("doublon");
    await page.getByLabel("Email").fill(MOCK_ADMIN_CREDENTIALS.email);
    await passwordInput(page).fill("trois mots au hasard");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    const field = page.getByLabel("Email");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAccessibleDescription(/Un compte existe déjà avec cet email/);
  });

  test("connexion admin : retour à la page demandée, accès au back-office", async ({ page }) => {
    await page.goto("/admin/tournois/nouveau");
    await expect(page.getByRole("heading", { level: 1, name: "Accès réservé" })).toBeVisible();
    await loginAsAdmin(page, "/admin/tournois/nouveau");
    await expect(page.getByRole("heading", { level: 1, name: "Créer un tournoi" })).toBeVisible();
    // Une fois connecté, /connexion renvoie vers le back-office
    await page.goto("/connexion");
    await expect(page).toHaveURL(/\/admin\/tournois\/nouveau$/);
  });

  test("redirection ouverte refusée : ?suite vers un autre site ramène sur le site", async ({
    page,
  }) => {
    await page.goto("/connexion?suite=//exemple.test/piege");
    await waitForForm(page);
    await page.getByLabel("Email").fill(MOCK_ADMIN_CREDENTIALS.email);
    await passwordInput(page).fill(MOCK_ADMIN_CREDENTIALS.password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("http://localhost:3100/admin/tournois/nouveau");
  });

  test("le cookie de session est HttpOnly et SameSite=Lax", async ({ page, context }) => {
    await loginAsAdmin(page);
    const sid = (await context.cookies()).find((cookie) => cookie.name === "sid");
    expect(sid).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  });
});

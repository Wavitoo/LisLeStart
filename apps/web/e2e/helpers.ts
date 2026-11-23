import { expect, type Page } from "@playwright/test";
import { MOCK_ADMIN_CREDENTIALS } from "../lib/api/auth-api";

/** Connexion par le formulaire avec l'administrateur fictif de l'API simulée. */
export async function loginAsAdmin(page: Page, next = "/admin/tournois/nouveau") {
  await page.goto(`/connexion?suite=${encodeURIComponent(next)}`);
  await waitForForm(page);
  await page.getByLabel("Email").fill(MOCK_ADMIN_CREDENTIALS.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(MOCK_ADMIN_CREDENTIALS.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(new RegExp(`${next}$`));
}

/** Attend que le formulaire soit hydraté : un clic avant n'aurait aucun effet. */
export async function waitForForm(page: Page) {
  await expect(page.locator("form[data-hydrated]")).toBeVisible();
}

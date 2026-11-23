// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MESSAGES } from "@/lib/api/auth-api";
import { LoginForm, RegisterForm } from "./auth-forms";

const password = () => screen.getByLabelText("Mot de passe", { selector: "input" });

describe("LoginForm", () => {
  it("erreurs liées aux champs et récapitulatif focalisé, sans appel au serveur", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<LoginForm action={action} next={null} />);

    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    const summary = await screen.findByRole("heading", {
      name: /Le formulaire contient 2 erreurs/,
    });
    await waitFor(() => expect(summary.parentElement).toHaveFocus());
    expect(summary.parentElement).toHaveTextContent("Corrige les champs suivants puis réessaie :");
    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(
      "Erreur : Indique ton email : par exemple nom@exemple.fr.",
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("identifiants refusés : alerte générale focalisée (sans dire lequel est faux)", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: false, message: MESSAGES.badCredentials });
    render(<LoginForm action={action} next="/tournois/coupe-hiver" />);

    await user.type(screen.getByLabelText("Email"), "renard@exemple.fr");
    await user.type(password(), "mauvais");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(action).toHaveBeenCalledWith(
      { email: "renard@exemple.fr", password: "mauvais" },
      "/tournois/coupe-hiver",
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(MESSAGES.badCredentials);
    await waitFor(() => expect(alert).toHaveFocus());
  });

  it("autocomplétion déclarée (WCAG 1.3.5) et lien vers l'inscription qui garde la destination", () => {
    render(<LoginForm action={vi.fn()} next="/admin" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(password()).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("link", { name: "Créer un compte" })).toHaveAttribute(
      "href",
      "/inscription?suite=%2Fadmin",
    );
  });

  it("le bouton Afficher montre et masque le mot de passe", async () => {
    const user = userEvent.setup();
    render(<LoginForm action={vi.fn()} next={null} />);
    expect(password()).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(password()).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Masquer le mot de passe" }));
    expect(password()).toHaveAttribute("type", "password");
  });
});

describe("RegisterForm", () => {
  it("email déjà utilisé : erreur sous le champ Email et dans le récapitulatif", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, message: MESSAGES.emailTaken, field: "email" });
    render(<RegisterForm action={action} next={null} />);

    await user.type(screen.getByLabelText("Pseudo"), "renard_bleu");
    await user.type(screen.getByLabelText("Email"), "pris@exemple.fr");
    await user.type(password(), "trois mots au hasard");
    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));

    const email = screen.getByLabelText("Email");
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(email).toHaveAccessibleDescription(
      `Sert à te connecter ; il n'est jamais affiché. Erreur : ${MESSAGES.emailTaken}`,
    );
    expect(screen.getByRole("link", { name: MESSAGES.emailTaken })).toHaveAttribute(
      "href",
      "#field-email",
    );
  });

  it("profil au clavier (flèches) puis envoi des valeurs", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);
    render(<RegisterForm action={action} next={null} />);

    await user.type(screen.getByLabelText("Pseudo"), "  renard_bleu ");
    await user.type(screen.getByLabelText("Email"), "renard@exemple.fr");
    await user.type(password(), "trois mots au hasard");
    const spectator = screen.getByRole("radio", { name: /Spectateur/ });
    expect(spectator).toBeChecked();
    spectator.focus();
    // Touche maintenue : Radix déplace le focus au tour suivant et coche tant que la flèche est
    // enfoncée (dans un vrai navigateur, le relâchement arrive bien après)
    await user.keyboard("{ArrowDown>}");
    await waitFor(() => expect(screen.getByRole("radio", { name: /Joueur/ })).toBeChecked());
    await user.keyboard("{/ArrowDown}");

    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0]?.[0]).toEqual({
      displayName: "  renard_bleu ",
      email: "renard@exemple.fr",
      password: "trois mots au hasard",
      role: "player",
    });
    expect(password()).toHaveAttribute("autocomplete", "new-password");
  });
});

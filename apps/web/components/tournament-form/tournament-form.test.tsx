// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MOCK_GAMES } from "@/lib/api/admin-api";
import type { TournamentFormValues } from "@/lib/tournament-form/schema";
import { defaultStage, defaultTournamentValues } from "@/lib/tournament-form/values";
import { TournamentForm } from "./tournament-form";

function setup(values: Partial<TournamentFormValues> = {}) {
  const onSubmit = vi
    .fn()
    .mockResolvedValue({ ok: true, tournament: { id: "t1", name: "Coupe d'hiver" } });
  const user = userEvent.setup();
  render(
    <TournamentForm
      games={MOCK_GAMES}
      onSubmit={onSubmit}
      defaultValues={{ ...defaultTournamentValues(), ...values }}
    />,
  );
  return { user, onSubmit };
}

/** Deux étapes distinctes, comme dans la maquette. */
const twoStages = {
  stages: [defaultStage("round_robin"), defaultStage("double_elimination")],
};

const stageTitles = () =>
  within(screen.getByRole("list", { name: "Étapes du tournoi, dans l'ordre" }))
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);

const liveRegion = () => document.querySelector('[aria-live="polite"]');

describe("Étapes : ajout et suppression", () => {
  it("ajoute une étape, l'annonce et place le focus sur son format", async () => {
    const { user } = setup();
    expect(stageTitles()).toEqual(["Étape 1 · Élimination simple"]);

    await user.click(screen.getByRole("button", { name: /Ajouter une étape/ }));

    expect(stageTitles()).toEqual(["Étape 1 · Élimination simple", "Étape 2 · Élimination simple"]);
    expect(liveRegion()).toHaveTextContent("Étape 2 ajoutée : Élimination simple.");
    await waitFor(() => expect(document.getElementById("field-stages-1-format")).toHaveFocus());
  });

  it("supprime une étape au clavier, renumérote et annonce", async () => {
    const { user } = setup(twoStages);
    screen.getByRole("button", { name: "Supprimer l'étape 1" }).focus();
    await user.keyboard("{Enter}");

    expect(stageTitles()).toEqual(["Étape 1 · Élimination double"]);
    expect(liveRegion()).toHaveTextContent("Étape 1 supprimée. 1 étape restante.");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Étape 1 · Élimination double" })).toHaveFocus(),
    );
  });

  it("exige au moins une étape : erreur sous le bouton d'ajout et dans le récapitulatif", async () => {
    const { user, onSubmit } = setup({ stages: [defaultStage("single_elimination")] });
    await user.click(screen.getByRole("button", { name: "Supprimer l'étape 1" }));
    expect(liveRegion()).toHaveTextContent("Aucune étape");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Ajouter une étape/ })).toHaveFocus(),
    );

    await user.click(screen.getByRole("button", { name: "Publier le tournoi" }));

    const message =
      "Ajoute au moins une étape : clique sur « + Ajouter une étape » puis choisis son format.";
    const addButton = screen.getByRole("button", { name: /Ajouter une étape/ });
    expect(addButton).toHaveAccessibleDescription(`Erreur : ${message}`);
    expect(screen.getByRole("link", { name: message })).toHaveAttribute("href", "#add-stage");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("Étapes : réordonner sans souris", () => {
  it("Descendre (Entrée) déplace l'étape, met à jour les numéros et annonce la position", async () => {
    const { user } = setup(twoStages);
    expect(stageTitles()).toEqual([
      "Étape 1 · Poules (round robin)",
      "Étape 2 · Élimination double",
    ]);

    screen.getByRole("button", { name: "Descendre l'étape 1" }).focus();
    await user.keyboard("{Enter}");

    expect(stageTitles()).toEqual([
      "Étape 1 · Élimination double",
      "Étape 2 · Poules (round robin)",
    ]);
    expect(liveRegion()).toHaveTextContent("Étape 1 déplacée en position 2");
    // L'étape est maintenant la dernière : Descendre est désactivé, le focus passe sur Monter.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Monter l'étape 2" })).toHaveFocus(),
    );
    expect(screen.getByRole("button", { name: "Descendre l'étape 2" })).toBeDisabled();
  });

  it("Monter (Espace) annonce « Étape 2 déplacée en position 1 »", async () => {
    const { user } = setup(twoStages);
    screen.getByRole("button", { name: "Monter l'étape 2" }).focus();
    await user.keyboard(" ");

    expect(stageTitles()).toEqual([
      "Étape 1 · Élimination double",
      "Étape 2 · Poules (round robin)",
    ]);
    expect(liveRegion()).toHaveTextContent("Étape 2 déplacée en position 1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Descendre l'étape 1" })).toHaveFocus(),
    );
  });

  it("réordonne plusieurs fois de suite au clavier, le focus suit l'étape", async () => {
    const { user } = setup({
      stages: [
        defaultStage("swiss"),
        defaultStage("round_robin"),
        defaultStage("single_elimination"),
      ],
    });
    screen.getByRole("button", { name: "Descendre l'étape 1" }).focus();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Descendre l'étape 2" })).toHaveFocus(),
    );
    await user.keyboard("{Enter}");

    expect(stageTitles()).toEqual([
      "Étape 1 · Poules (round robin)",
      "Étape 2 · Élimination simple",
      "Étape 3 · Ronde suisse",
    ]);
    expect(liveRegion()).toHaveTextContent("Étape 2 déplacée en position 3");
  });

  it("la première étape ne peut pas monter, la dernière ne peut pas descendre", () => {
    setup(twoStages);
    expect(screen.getByRole("button", { name: "Monter l'étape 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Descendre l'étape 2" })).toBeDisabled();
  });

  it("la qualification suit l'ordre des étapes", async () => {
    const { user } = setup(twoStages);
    expect(
      screen.getByText(
        "Qualification : les 2 premiers de chaque poule rejoignent l'étape 2 (1er de A contre 2e de B…)",
      ),
    ).toBeInTheDocument();

    screen.getByRole("button", { name: "Descendre l'étape 1" }).focus();
    await user.keyboard("{Enter}");
    // Les poules sont maintenant la dernière étape : plus de qualification
    expect(screen.queryByText(/Qualification :/)).not.toBeInTheDocument();
  });
});

describe("Erreurs à l'envoi", () => {
  it("relie chaque erreur à son champ, et déplace le focus vers le récapitulatif", async () => {
    const { user, onSubmit } = setup();
    await user.click(screen.getByRole("button", { name: "Publier le tournoi" }));

    const summary = await screen.findByRole("heading", {
      name: /Le formulaire contient \d+ erreurs/,
    });
    await waitFor(() => expect(summary.parentElement).toHaveFocus());

    const name = screen.getByRole("textbox", { name: "Nom du tournoi" });
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(
      "Erreur : Indique le nom du tournoi : par exemple « Coupe d'hiver ».",
    );
    expect(onSubmit).not.toHaveBeenCalled();

    // Le lien du récapitulatif place le focus sur le champ
    await user.click(
      screen.getByRole("link", {
        name: "Indique le nom du tournoi : par exemple « Coupe d'hiver ».",
      }),
    );
    expect(name).toHaveFocus();
  });

  it("règle croisée : la fin avant le début, sous le champ Fin", async () => {
    const { user } = setup({ startsAt: "2026-12-13T18:00", endsAt: "2026-12-12T18:00" });
    await user.click(screen.getByRole("button", { name: "Publier le tournoi" }));
    const end = screen.getByLabelText("Fin");
    expect(end).toHaveAttribute("aria-invalid", "true");
    expect(end).toHaveAccessibleDescription(
      "Erreur : La date de fin précède la date de début : choisis une date après le 13/12/2026 à 18:00.",
    );
  });

  it("envoie le tournoi converti quand tout est valide et annonce la publication", async () => {
    const { user, onSubmit } = setup({
      name: "Coupe d'hiver",
      gameId: "game-fps",
      startsAt: "2026-12-13T18:00",
      endsAt: "2026-12-15T18:00",
      capacity: 16,
    });
    await user.click(screen.getByRole("button", { name: "Publier le tournoi" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      name: "Coupe d'hiver",
      capacity: 16,
      teamSize: null,
      stages: [{ format: "single_elimination" }],
    });
    // dnd-kit rend aussi une région role="status" (vide) : on cible celle du formulaire
    const status = await screen.findByText(/Tournoi « Coupe d'hiver » publié\./);
    expect(status).toHaveAttribute("role", "status");
    await waitFor(() => expect(status).toHaveFocus());
  });
});

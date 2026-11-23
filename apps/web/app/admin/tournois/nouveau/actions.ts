"use server";

import type { CreateTournamentInput } from "@lislestart/shared";
import type { CreateTournamentResult } from "@/lib/api/admin-api";
import { getAdminApi, getCurrentUser } from "@/lib/api/server";

/**
 * Relaie la création à l'API avec la session de l'administrateur (cookie HttpOnly). Les droits et
 * la validation définitive sont vérifiés par l'API ; ce contrôle évite un aller-retour inutile.
 */
export async function createTournament(
  input: CreateTournamentInput,
): Promise<CreateTournamentResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return {
      ok: false,
      message:
        "Seul un administrateur peut créer un tournoi : connecte-toi avec un compte administrateur.",
    };
  }
  return (await getAdminApi()).createTournament(input);
}

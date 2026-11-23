"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, type AuthField, type AuthResult } from "@/lib/api/auth-api";
import { getAuthApi, getRequestContext, getSessionId } from "@/lib/api/server";
import { safeDestination } from "./redirect";
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "./schema";

/** Réponse au formulaire en cas d'échec ; en cas de succès, l'action redirige. */
export type AuthFormResult = { ok: false; message: string; field?: AuthField };

async function openSession(
  result: Extract<AuthResult, { ok: true }>,
  next: unknown,
): Promise<never> {
  (await cookies()).set(SESSION_COOKIE, result.session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: result.session.maxAgeSeconds,
  });
  redirect(safeDestination(next, result.user.role));
}

const INVALID = "Le formulaire contient des erreurs : corrige les champs signalés puis réessaie.";

/**
 * Connexion : l'API vérifie les identifiants et ouvre la session, le serveur Next pose le cookie
 * HttpOnly sur le domaine du site. Données revalidées ici : une action serveur est appelable
 * directement, sans passer par le formulaire.
 */
export async function login(values: LoginValues, next: unknown): Promise<AuthFormResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: INVALID };
  const result = await getAuthApi().login(
    { email: parsed.data.email.trim().toLowerCase(), password: parsed.data.password },
    await getRequestContext(),
  );
  if (!result.ok) return result;
  return openSession(result, next);
}

export async function register(values: RegisterValues, next: unknown): Promise<AuthFormResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: INVALID };
  const { displayName, email, password, role } = parsed.data;
  const result = await getAuthApi().register(
    { displayName: displayName.trim(), email: email.trim().toLowerCase(), password, role },
    await getRequestContext(),
  );
  if (!result.ok) return result;
  return openSession(result, next);
}

/** Déconnexion : session révoquée côté API, cookie effacé, retour à l'accueil. */
export async function logout(): Promise<void> {
  const sessionId = await getSessionId();
  if (sessionId) await getAuthApi().logout(sessionId);
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}

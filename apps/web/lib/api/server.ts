import type { AuthUser } from "@lislestart/shared";
import { cookies } from "next/headers";
import { createHttpAdminApi, createMockAdminApi, type AdminApi } from "./admin-api";

/*
 * Accès à l'API depuis le serveur Next (composants serveur, actions). Le cookie de session sid
 * est HttpOnly : il est relayé tel quel, jamais exposé au navigateur.
 */

const SESSION_COOKIE = "sid";

/** URL de l'API vue du serveur Next (API_URL en Docker, sinon celle du navigateur). */
export function apiUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

/**
 * API simulée : seulement si API_MOCK=true, et jamais en production, pour qu'un oubli de variable
 * ne fasse pas passer un faux administrateur.
 */
export function isMockApi(): boolean {
  return process.env.API_MOCK === "true" && process.env.NODE_ENV !== "production";
}

/** Administrateur fictif de l'API simulée. */
const MOCK_ADMIN: AuthUser = {
  id: "mock-admin",
  email: "admin@seedline.test",
  displayName: "Admin (simulé)",
  role: "admin",
};

async function sessionCookie(): Promise<string | null> {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  return sessionId ? `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}` : null;
}

/** Utilisateur connecté d'après `GET /auth/me`, ou null sans session valide. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isMockApi()) return MOCK_ADMIN;
  const cookie = await sessionCookie();
  if (!cookie) return null;
  try {
    const response = await fetch(`${apiUrl()}/auth/me`, {
      headers: { cookie },
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as AuthUser) : null;
  } catch {
    return null;
  }
}

let mockApi: AdminApi | null = null;

export async function getAdminApi(): Promise<AdminApi> {
  if (isMockApi()) return (mockApi ??= createMockAdminApi());
  return createHttpAdminApi(apiUrl(), await sessionCookie());
}

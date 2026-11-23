import type { AuthUser } from "@lislestart/shared";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { createHttpAdminApi, createMockAdminApi, type AdminApi } from "./admin-api";
import {
  createHttpAuthApi,
  createMockAuthApi,
  SESSION_COOKIE,
  sessionCookieHeader,
  type AuthApi,
  type RequestContext,
} from "./auth-api";
import { createHttpPublicApi, createMockPublicApi, type PublicApi } from "./public-api";

/*
 * Accès à l'API depuis le serveur Next (composants serveur, actions). Le cookie de session sid
 * est HttpOnly : il est relayé tel quel, jamais exposé au navigateur.
 */

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

export async function getSessionId(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

async function sessionCookie(): Promise<string | null> {
  const sessionId = await getSessionId();
  return sessionId ? sessionCookieHeader(sessionId) : null;
}

export function getAuthApi(): AuthApi {
  return isMockApi() ? createMockAuthApi() : createHttpAuthApi(apiUrl());
}

/**
 * Utilisateur connecté d'après `GET /auth/me` (ou l'API simulée), null sans session valide.
 * Mémorisé le temps d'une requête : l'en-tête, le gabarit et la page le lisent sans le redemander.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const sessionId = await getSessionId();
  return sessionId ? getAuthApi().me(sessionId) : null;
});

/** IP du visiteur telle que vue par le proxy devant Next (premier élément de X-Forwarded-For). */
export async function getRequestContext(): Promise<RequestContext> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return { clientIp: forwarded || list.get("x-real-ip") || null };
}

let mockApi: AdminApi | null = null;

export async function getAdminApi(): Promise<AdminApi> {
  if (isMockApi()) return (mockApi ??= createMockAdminApi());
  return createHttpAdminApi(apiUrl(), await sessionCookie());
}

let mockPublicApi: PublicApi | null = null;

/** Lecture publique des tournois : aucune session relayée. */
export function getPublicApi(): PublicApi {
  if (isMockApi()) return (mockPublicApi ??= createMockPublicApi());
  return createHttpPublicApi(apiUrl());
}

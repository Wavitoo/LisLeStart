import type { AuthUser } from "@lislestart/shared";

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  displayName: string;
  /** Un administrateur n'est jamais créé par l'inscription. */
  role: "player" | "spectator";
}

/** Champ du formulaire auquel rattacher une erreur renvoyée par l'API. */
export const AUTH_FIELDS = ["email", "password", "displayName", "role"] as const;
export type AuthField = (typeof AUTH_FIELDS)[number];

export type AuthResult =
  | { ok: true; user: AuthUser; session: { id: string; maxAgeSeconds: number } }
  | { ok: false; message: string; field?: AuthField };

/** Contexte de la requête du visiteur, relayé à l'API (limite de tentatives par IP). */
export interface RequestContext {
  clientIp: string | null;
}

/**
 * Authentification vue du serveur Next. Le serveur Next appelle l'API puis pose lui-même le cookie
 * de session sur le domaine du site : en production, web et API sont sur deux domaines distincts.
 */
export interface AuthApi {
  login(credentials: Credentials, context: RequestContext): Promise<AuthResult>;
  register(registration: Registration, context: RequestContext): Promise<AuthResult>;
  logout(sessionId: string): Promise<void>;
  /** null : session absente, expirée ou révoquée. */
  me(sessionId: string): Promise<AuthUser | null>;
}

export const SESSION_COOKIE = "sid";

/** En-tête Cookie relayé à l'API pour une session donnée. */
export function sessionCookieHeader(sessionId: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}`;
}
/** Durée par défaut si l'API ne la précise pas (alignée sur SESSION_TTL_SECONDS côté API). */
const DEFAULT_MAX_AGE = 7 * 24 * 3600;

export const MESSAGES = {
  network: "Le serveur ne répond pas : vérifie ta connexion puis réessaie dans un instant.",
  badCredentials:
    "Email ou mot de passe incorrect. Vérifie ta saisie (majuscules comprises) ou crée un compte.",
  emailTaken: "Un compte existe déjà avec cet email : connecte-toi, ou utilise une autre adresse.",
  tooMany: "Trop de tentatives : attends une minute avant de réessayer.",
  server: "La connexion a échoué côté serveur : réessaie dans un instant.",
} as const;

/** Lit la valeur et la durée du cookie sid dans les en-têtes Set-Cookie de l'API. */
export function readSessionCookie(
  setCookies: string[],
): { id: string; maxAgeSeconds: number } | null {
  for (const header of setCookies) {
    const match = new RegExp(`^\\s*${SESSION_COOKIE}=([^;]*)`).exec(header);
    if (!match?.[1]) continue;
    const maxAge = /;\s*max-age=(\d+)/i.exec(header)?.[1];
    return {
      id: decodeURIComponent(match[1]),
      maxAgeSeconds: maxAge ? Number(maxAge) : DEFAULT_MAX_AGE,
    };
  }
  return null;
}

function failure(status: number, body: unknown, mode: "login" | "register"): AuthResult {
  if (status === 401) return { ok: false, message: MESSAGES.badCredentials };
  if (status === 409 && mode === "register") {
    return { ok: false, message: MESSAGES.emailTaken, field: "email" };
  }
  if (status === 429) return { ok: false, message: MESSAGES.tooMany };
  if (status === 400) {
    // Format de l'API : { message, errors: [{ field, message }] } (apps/api/src/app.setup.ts)
    const { message, errors } = (body ?? {}) as { message?: unknown; errors?: unknown };
    const fieldError = Array.isArray(errors)
      ? (errors as { field?: unknown; message?: unknown }[]).find(
          (error) => typeof error.message === "string",
        )
      : undefined;
    if (fieldError) {
      const field = AUTH_FIELDS.find((name) => name === fieldError.field);
      return { ok: false, message: String(fieldError.message), ...(field ? { field } : {}) };
    }
    if (typeof message === "string") return { ok: false, message };
  }
  return { ok: false, message: MESSAGES.server };
}

export function createHttpAuthApi(baseUrl: string): AuthApi {
  async function authenticate(
    path: string,
    body: Credentials | Registration,
    context: RequestContext,
    mode: "login" | "register",
  ): Promise<AuthResult> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    // Voir docs/security.md : l'API ne doit faire confiance à cet en-tête que derrière un proxy.
    if (context.clientIp) headers["x-forwarded-for"] = context.clientIp;
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch {
      return { ok: false, message: MESSAGES.network };
    }
    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) return failure(response.status, json, mode);
    const session = readSessionCookie(response.headers.getSetCookie());
    if (!session) return { ok: false, message: MESSAGES.server };
    return { ok: true, user: json as AuthUser, session };
  }

  return {
    login: (credentials, context) => authenticate("/auth/login", credentials, context, "login"),
    register: (registration, context) =>
      authenticate("/auth/register", registration, context, "register"),
    async logout(sessionId) {
      await fetch(`${baseUrl}/auth/logout`, {
        method: "POST",
        headers: { cookie: sessionCookieHeader(sessionId) },
        cache: "no-store",
      }).catch(() => undefined);
    },
    async me(sessionId) {
      try {
        const response = await fetch(`${baseUrl}/auth/me`, {
          headers: { cookie: sessionCookieHeader(sessionId) },
          cache: "no-store",
        });
        return response.ok ? ((await response.json()) as AuthUser) : null;
      } catch {
        return null;
      }
    },
  };
}

/** Administrateur fictif de l'API simulée (développement et tests uniquement). */
export const MOCK_ADMIN_CREDENTIALS = {
  email: "admin@seedline.test",
  password: "demo-seedline-admin",
} as const;

interface MockStore {
  users: Map<string, { user: AuthUser; password: string }>;
  sessions: Map<string, string>;
}

/**
 * Comptes et sessions en mémoire. Le magasin est rangé sur globalThis pour survivre aux
 * rechargements de modules du serveur de développement.
 */
function mockStore(): MockStore {
  const holder = globalThis as typeof globalThis & { __seedlineMockAuth?: MockStore };
  if (!holder.__seedlineMockAuth) {
    const users = new Map<string, { user: AuthUser; password: string }>();
    users.set(MOCK_ADMIN_CREDENTIALS.email, {
      user: {
        id: "mock-admin",
        email: MOCK_ADMIN_CREDENTIALS.email,
        displayName: "Admin (simulé)",
        role: "admin",
      },
      password: MOCK_ADMIN_CREDENTIALS.password,
    });
    holder.__seedlineMockAuth = { users, sessions: new Map() };
  }
  return holder.__seedlineMockAuth;
}

/** Même comportement que l'API : 401 sur identifiants faux, 409 sur email déjà pris. */
export function createMockAuthApi(): AuthApi {
  const store = mockStore();
  const openSession = (user: AuthUser): AuthResult => {
    const id = crypto.randomUUID();
    store.sessions.set(id, user.id);
    return { ok: true, user, session: { id, maxAgeSeconds: DEFAULT_MAX_AGE } };
  };
  return {
    async login({ email, password }) {
      const account = store.users.get(email.trim().toLowerCase());
      if (!account || account.password !== password) return failure(401, null, "login");
      return openSession(account.user);
    },
    async register({ email, password, displayName, role }) {
      const key = email.trim().toLowerCase();
      if (store.users.has(key)) return failure(409, null, "register");
      const user: AuthUser = {
        id: `mock-${crypto.randomUUID()}`,
        email: key,
        displayName: displayName.trim(),
        role,
      };
      store.users.set(key, { user, password });
      return openSession(user);
    },
    async logout(sessionId) {
      store.sessions.delete(sessionId);
    },
    async me(sessionId) {
      const userId = store.sessions.get(sessionId);
      if (!userId) return null;
      for (const { user } of store.users.values()) if (user.id === userId) return user;
      return null;
    },
  };
}

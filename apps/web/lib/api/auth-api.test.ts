import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createHttpAuthApi,
  createMockAuthApi,
  MESSAGES,
  MOCK_ADMIN_CREDENTIALS,
  readSessionCookie,
} from "./auth-api";

const context = { clientIp: "203.0.113.7" };
const user = { id: "u1", email: "a@b.fr", displayName: "renard_bleu", role: "spectator" };

function respond(status: number, body: unknown, setCookie: string[] = []) {
  const headers = new Headers({ "content-type": "application/json" });
  for (const cookie of setCookie) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

afterEach(() => vi.unstubAllGlobals());

describe("readSessionCookie", () => {
  it("lit la valeur et la durée du cookie sid", () => {
    expect(
      readSessionCookie(["other=1", "sid=abc%2Fdef; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax"]),
    ).toEqual({ id: "abc/def", maxAgeSeconds: 3600 });
  });

  it("null sans cookie sid", () => {
    expect(readSessionCookie(["sidebar=1"])).toBeNull();
  });
});

describe("createHttpAuthApi", () => {
  it("connexion réussie : relaie l'IP du visiteur et récupère la session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respond(200, user, ["sid=s1; Max-Age=60; HttpOnly"]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await createHttpAuthApi("http://api").login(
      { email: "a@b.fr", password: "p" },
      context,
    );

    expect(result).toEqual({ ok: true, user, session: { id: "s1", maxAgeSeconds: 60 } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api/auth/login");
    expect((init.headers as Record<string, string>)["x-forwarded-for"]).toBe("203.0.113.7");
  });

  it("traduit les refus de l'API", async () => {
    const api = createHttpAuthApi("http://api");
    const registration = {
      email: "a@b.fr",
      password: "p".repeat(10),
      displayName: "ab",
      role: "player" as const,
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(401, {})));
    expect(await api.login({ email: "a@b.fr", password: "p" }, context)).toEqual({
      ok: false,
      message: MESSAGES.badCredentials,
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(409, {})));
    expect(await api.register(registration, context)).toEqual({
      ok: false,
      message: MESSAGES.emailTaken,
      field: "email",
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(429, {})));
    expect(await api.login({ email: "a@b.fr", password: "p" }, context)).toEqual({
      ok: false,
      message: MESSAGES.tooMany,
    });

    // Format de validation de l'API : une erreur par champ, rattachée au bon champ du formulaire
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respond(400, {
          message: "Certains champs sont invalides.",
          errors: [
            { field: "displayName", message: "Le pseudo doit faire entre 2 et 32 caractères." },
          ],
        }),
      ),
    );
    expect(await api.register(registration, context)).toEqual({
      ok: false,
      message: "Le pseudo doit faire entre 2 et 32 caractères.",
      field: "displayName",
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await api.login({ email: "a@b.fr", password: "p" }, context)).toEqual({
      ok: false,
      message: MESSAGES.network,
    });
  });

  it("réponse sans cookie de session : échec plutôt qu'une session fantôme", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(200, user)));
    const result = await createHttpAuthApi("http://api").login(
      { email: "a@b.fr", password: "p" },
      context,
    );
    expect(result).toEqual({ ok: false, message: MESSAGES.server });
  });
});

describe("createMockAuthApi", () => {
  it("se comporte comme l'API : admin fictif, 401, 409, session révocable", async () => {
    const api = createMockAuthApi();

    const admin = await api.login(MOCK_ADMIN_CREDENTIALS, context);
    expect(admin.ok && admin.user.role).toBe("admin");

    expect(await api.login({ ...MOCK_ADMIN_CREDENTIALS, password: "faux" }, context)).toMatchObject(
      {
        ok: false,
        message: MESSAGES.badCredentials,
      },
    );

    const email = `test-${crypto.randomUUID()}@exemple.test`;
    const created = await api.register(
      { email, password: "trois mots au hasard", displayName: "renard_bleu", role: "player" },
      context,
    );
    if (!created.ok) throw new Error("inscription refusée");
    expect(await api.me(created.session.id)).toMatchObject({ email, role: "player" });

    expect(
      await api.register(
        { email: email.toUpperCase(), password: "x".repeat(10), displayName: "ab", role: "player" },
        context,
      ),
    ).toMatchObject({ ok: false, field: "email" });

    await api.logout(created.session.id);
    expect(await api.me(created.session.id)).toBeNull();
  });
});

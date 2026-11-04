import { describe, expect, it, vi } from "vitest";
import { ApiError, createHttpApi } from "./client";
import { MOCK_FINAL_SCORE } from "../realtime/mock";
import { createMockApi, DEMO_ACCOUNT } from "./mock";

const body = { serverTime: "2026-11-14T15:00:00Z", tournaments: [] };

describe("createHttpApi", () => {
  it("appelle l'endpoint des tournois en cours et renvoie la réponse", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
    const api = createHttpApi("http://10.0.2.2:4000", fetchImpl);

    await expect(api.liveTournaments()).resolves.toEqual(body);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://10.0.2.2:4000/tournaments?status=live",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("traduit une réponse en erreur en message lisible", async () => {
    const api = createHttpApi("http://api", async () => new Response("", { status: 503 }));
    await expect(api.liveTournaments()).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      message: "Le serveur a répondu avec une erreur (503). Réessaie dans un instant.",
    });
  });

  it("signale un serveur injoignable", async () => {
    const api = createHttpApi("http://api", async () => {
      throw new TypeError("Network request failed");
    });
    await expect(api.liveTournaments()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("pronostics", () => {
  it("envoie le prono en PUT avec un corps JSON", async () => {
    const prediction = { winnerId: "a", score: [2, 1] as [number, number] };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(prediction), { status: 200 }));
    const api = createHttpApi("http://api", fetchImpl);

    await expect(api.savePrediction("m 1", prediction)).resolves.toEqual(prediction);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api/matches/m%201/prediction",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(prediction),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("traduit un refus de verrouillage et une session absente", async () => {
    const refusing = (status: number) =>
      createHttpApi("http://api", async () => new Response("", { status }));
    await expect(
      refusing(409).savePrediction("m1", { winnerId: "a", score: null }),
    ).rejects.toMatchObject({ message: "Prono fermé : le match a commencé.", status: 409 });
    await expect(refusing(401).predictionFeed()).rejects.toMatchObject({
      message: "Connecte-toi pour continuer.",
    });
  });
});

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("authentification", () => {
  it("se connecte en POST et renvoie l'utilisateur", async () => {
    const user = { id: "u1", email: "a@b.test", displayName: "renard", role: "spectator" };
    const fetchImpl = vi.fn(async () => json(user, 200));
    const credentials = { email: "a@b.test", password: "phrase de passe" };
    await expect(createHttpApi("http://api", fetchImpl).login(credentials)).resolves.toEqual(user);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api/auth/login",
      expect.objectContaining({ method: "POST", body: JSON.stringify(credentials) }),
    );
  });

  it("reprend le message du serveur et les erreurs par champ", async () => {
    const body = {
      statusCode: 400,
      message: "Certains champs sont invalides.",
      errors: [{ field: "email", message: "Saisis une adresse email valide." }],
    };
    const api = createHttpApi("http://api", async () => json(body, 400));
    await expect(
      api.register({ email: "x", password: "x", displayName: "x", role: "player" }),
    ).rejects.toMatchObject({
      message: "Certains champs sont invalides.",
      fieldErrors: body.errors,
    });

    const wrong = createHttpApi("http://api", async () =>
      json({ message: "Email ou mot de passe incorrect." }, 401),
    );
    await expect(wrong.login({ email: "a@b.test", password: "x" })).rejects.toMatchObject({
      message: "Email ou mot de passe incorrect.",
    });
  });

  it("garde un message français pour les codes sans explication", async () => {
    const api = createHttpApi("http://api", async () =>
      json({ message: "Too Many Requests" }, 429),
    );
    await expect(api.login({ email: "a@b.test", password: "x" })).rejects.toMatchObject({
      message: "Trop de tentatives. Attends une minute et réessaie.",
    });
  });

  it("me renvoie null sans session, et la déconnexion accepte un 204", async () => {
    expect(await createHttpApi("http://api", async () => json({}, 401)).me()).toBeNull();
    const logout = createHttpApi("http://api", async () => new Response(null, { status: 204 }));
    await expect(logout.logout()).resolves.toBeUndefined();
  });
});

describe("Pick'em et classements", () => {
  it("répond à une question en PUT et construit l'URL du classement", async () => {
    const fetchImpl = vi.fn(async () => json({ optionId: "oui" }, 200));
    const api = createHttpApi("http://api", fetchImpl);
    await api.answerPickem("q 1", "oui");
    expect(fetchImpl).toHaveBeenLastCalledWith(
      "http://api/pickem/questions/q%201/answer",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ optionId: "oui" }) }),
    );
    await api.leaderboard("tournament", "t1");
    expect(fetchImpl).toHaveBeenLastCalledWith(
      "http://api/leaderboards?scope=tournament&id=t1",
      expect.anything(),
    );
    await api.leaderboard("global");
    expect(fetchImpl).toHaveBeenLastCalledWith(
      "http://api/leaderboards?scope=global",
      expect.anything(),
    );
  });
});

describe("arbre d'un tournoi", () => {
  it("appelle la route de l'arbre avec l'identifiant encodé", async () => {
    const fetchImpl = vi.fn(async () => json({ serverTime: "", stages: [] }, 200));
    await createHttpApi("http://api", fetchImpl).tournamentBracket("t 1");
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api/tournaments/t%201/bracket",
      expect.anything(),
    );
  });

  it("le faux serveur fait avancer l'arbre avec le direct et refuse un tournoi inconnu", async () => {
    const api = createMockApi(() => new Date("2026-11-14T15:00:00Z"));
    api.applyMatchUpdate(MOCK_FINAL_SCORE);
    const { stages, tournament } = await api.tournamentBracket("mock-coupe-hiver");
    expect(tournament.name).toBe("Coupe d'hiver");
    expect(stages[0]?.rounds[2]?.matches[0]?.slots[0]?.name).toBe("Les Hiboux");
    expect((await api.tournamentBracket("mock-open-echecs")).stages).toEqual([]);
    await expect(api.tournamentBracket("inconnu")).rejects.toMatchObject({ status: 404 });
  });
});

describe("createMockApi : Pick'em, classements, groupes", () => {
  const now = new Date("2026-11-14T15:00:00Z");

  it("garde les réponses Pick'em de chaque compte et refuse après la clôture", async () => {
    let clock = now;
    const api = createMockApi(() => clock);
    await expect(api.answerPickem("q-finale-3-0", "oui")).rejects.toMatchObject({ status: 401 });

    await api.login(DEMO_ACCOUNT);
    const feed = (await api.pickemFeed()).questions;
    expect(feed.find((q) => q.id === "q-manches")?.myAnswer).toBe("o-1");
    await api.answerPickem("q-finale-3-0", "oui");
    expect((await api.pickemFeed()).questions.find((q) => q.id === "q-finale-3-0")?.myAnswer).toBe(
      "oui",
    );
    await expect(api.answerPickem("q-finale-3-0", "peut-etre")).rejects.toMatchObject({
      status: 400,
    });

    clock = new Date(now.getTime() + 91 * 60_000);
    await expect(api.answerPickem("q-finale-3-0", "non")).rejects.toMatchObject({ status: 409 });
    expect((await api.pickemFeed()).questions.find((q) => q.id === "q-finale-3-0")?.status).toBe(
      "locked",
    );
  });

  it("classe l'utilisateur, même hors du haut du classement", async () => {
    const api = createMockApi(() => now);
    expect((await api.leaderboard("global")).me).toBeNull();

    await api.login(DEMO_ACCOUNT);
    const global = await api.leaderboard("global");
    expect(global.me).toMatchObject({ rank: 3, displayName: DEMO_ACCOUNT.displayName });
    expect(global.entries).toHaveLength(10);

    await api.logout();
    await api.register({
      email: "nouveau@example.test",
      password: "phrase de passe neuve",
      displayName: "nouveau",
      role: "spectator",
    });
    const fresh = await api.leaderboard("global");
    expect(fresh.me).toMatchObject({ rank: fresh.participantCount, points: 0 });
    expect(fresh.entries.some((e) => e.userId === fresh.me?.userId)).toBe(false);
  });

  it("groupes et badges : réservés aux comptes, vides pour un nouveau", async () => {
    const api = createMockApi(() => now);
    await expect(api.myGroups()).rejects.toMatchObject({ status: 401 });
    await api.login(DEMO_ACCOUNT);
    const groups = await api.myGroups();
    expect(groups.length).toBeGreaterThan(0);
    const board = await api.leaderboard("group", groups[0]?.id);
    expect(board.title).toBe(groups[0]?.name);
    expect(board.me).not.toBeNull();
    expect((await api.myBadges()).length).toBeGreaterThan(0);
    await expect(api.leaderboard("tournament", "inconnu")).rejects.toMatchObject({ status: 404 });
  });
});

describe("createMockApi", () => {
  it("exige un compte pour pronostiquer et garde les pronos de chaque compte", async () => {
    const api = createMockApi(() => new Date("2026-11-14T15:00:00Z"));
    const prediction = { winnerId: "nova", score: null };
    await expect(api.savePrediction("mock-demi-2", prediction)).rejects.toMatchObject({
      status: 401,
    });

    await api.register({
      email: "Nouveau@Example.TEST",
      password: "phrase de passe neuve",
      displayName: "nouveau",
      role: "player",
    });
    expect(await api.me()).toMatchObject({ email: "nouveau@example.test", role: "player" });
    await api.savePrediction("mock-demi-2", prediction);

    await api.logout();
    expect(await api.me()).toBeNull();
    await api.login(DEMO_ACCOUNT);
    const feed = (await api.predictionFeed()).matches;
    expect(feed.find((m) => m.id === "mock-demi-2")?.myPrediction).toBeNull();
    expect(feed.find((m) => m.id === "mock-demi-1")?.myPrediction).toEqual({
      winnerId: "hiboux",
      score: [2, 1],
    });
  });

  it("garde le résultat du direct simulé après un rechargement", async () => {
    const api = createMockApi();
    api.applyMatchUpdate(MOCK_FINAL_SCORE);
    const demi = (await api.predictionFeed()).matches.find((m) => m.id === "mock-demi-1");
    expect(demi?.status).toBe("done");
    expect(demi?.slots.map((s) => s.score)).toEqual([2, 1]);
  });

  it("valide l'inscription avec les mêmes règles que l'API", async () => {
    const api = createMockApi();
    await expect(
      api.register({
        email: "pas-un-email",
        password: "court",
        displayName: "x",
        role: "spectator",
      }),
    ).rejects.toMatchObject({
      status: 400,
      fieldErrors: [
        expect.objectContaining({ field: "email" }),
        expect.objectContaining({ field: "displayName" }),
        expect.objectContaining({ field: "password" }),
      ],
    });
    await expect(api.register({ ...DEMO_ACCOUNT, role: "spectator" })).rejects.toMatchObject({
      status: 409,
    });
    await expect(api.login({ email: DEMO_ACCOUNT.email, password: "faux" })).rejects.toMatchObject({
      status: 401,
      message: "Email ou mot de passe incorrect.",
    });
  });

  it("refuse un prono après le verrouillage, comme le serveur", async () => {
    let now = new Date("2026-11-14T15:00:00Z");
    const api = createMockApi(() => now);
    await api.login(DEMO_ACCOUNT);
    const { matches } = await api.predictionFeed();
    const open = matches.find((m) => m.id === "mock-demi-2");
    if (!open?.locksAt) throw new Error("match de démo manquant");

    const prediction = { winnerId: "renards", score: null };
    await expect(api.savePrediction(open.id, prediction)).resolves.toEqual(prediction);
    expect(
      (await api.predictionFeed()).matches.find((m) => m.id === open.id)?.myPrediction,
    ).toEqual(prediction);

    now = new Date(Date.parse(open.locksAt));
    await expect(api.savePrediction(open.id, prediction)).rejects.toMatchObject({ status: 409 });
    await expect(api.savePrediction("mock-demi-1", prediction)).rejects.toMatchObject({
      status: 409,
    });
  });

  it("ne renvoie que des tournois en cours, avec l'heure du serveur simulé", async () => {
    const now = new Date("2026-11-14T15:00:00Z");
    const { serverTime, tournaments } = await createMockApi(() => now).liveTournaments();

    expect(serverTime).toBe(now.toISOString());
    expect(tournaments.length).toBeGreaterThan(0);
    for (const t of tournaments) {
      expect(Date.parse(t.startsAt)).toBeLessThanOrEqual(now.getTime());
      expect(Date.parse(t.endsAt)).toBeGreaterThan(now.getTime());
    }
  });
});

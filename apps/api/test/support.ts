import type { Type } from "@nestjs/common";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { newSessionId, SessionStore } from "../src/auth/session.store";
import {
  EmailTakenError,
  UsersRepository,
  type NewUser,
  type StoredUser,
} from "../src/auth/users.repository";
import { APP_CONFIG, type AppConfig } from "../src/config";
import { PrismaService } from "../src/prisma/prisma.service";
import { RealtimeAccess, type TournamentVisibility } from "../src/realtime/realtime.access";

export class MemorySessionStore extends SessionStore {
  readonly sessions = new Map<string, string>();

  async create(userId: string): Promise<string> {
    const id = newSessionId();
    this.sessions.set(id, userId);
    return id;
  }

  async touch(sessionId: string): Promise<string | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async destroy(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}

export class MemoryUsersRepository extends UsersRepository {
  readonly users: StoredUser[] = [];

  async findByEmail(email: string): Promise<StoredUser | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<StoredUser | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async create(user: NewUser): Promise<StoredUser> {
    if (this.users.some((u) => u.email === user.email)) throw new EmailTakenError();
    const stored = { ...user, id: `user-${this.users.length + 1}` };
    this.users.push(stored);
    return stored;
  }
}

interface AuditRow {
  id: string;
  actorId: string;
  action: string;
  target: string;
  before: unknown;
  after: unknown;
  createdAt: Date;
}

/** Sous-ensemble de Prisma utilisé par le journal d'audit : uniquement create et findMany. */
export class MemoryPrisma {
  readonly auditRows: AuditRow[] = [];

  readonly auditLog = {
    create: async ({ data }: { data: Omit<AuditRow, "id" | "createdAt"> }) => {
      const row = { ...data, id: `audit-${this.auditRows.length + 1}`, createdAt: new Date() };
      this.auditRows.push(row);
      return row;
    },
    findMany: async ({
      where,
      take,
    }: {
      where: { target?: string; action?: string };
      take: number;
    }) =>
      this.auditRows
        .filter(
          (r) =>
            (!where.target || r.target === where.target) &&
            (!where.action || r.action === where.action),
        )
        .reverse()
        .slice(0, take),
  };
}

/** Tournois connus du temps réel : identifiant → public ou non ; un match pointe vers son tournoi. */
export class MemoryRealtimeAccess extends RealtimeAccess {
  readonly tournaments = new Map<string, TournamentVisibility>();
  readonly matches = new Map<string, string>();

  async tournament(id: string): Promise<TournamentVisibility | null> {
    return this.tournaments.get(id) ?? null;
  }

  async tournamentOfMatch(matchId: string): Promise<TournamentVisibility | null> {
    const tournamentId = this.matches.get(matchId);
    return tournamentId ? this.tournament(tournamentId) : null;
  }
}

export const testConfig: AppConfig = {
  sessionSecret: "secret-de-test-uniquement-pas-un-vrai-secret",
  redisUrl: "redis://test.invalid:6379",
  cookie: { secure: false, sameSite: "lax" },
  initialAdmin: null,
};

export interface TestApp {
  app: NestFastifyApplication;
  users: MemoryUsersRepository;
  sessions: MemorySessionStore;
  prisma: MemoryPrisma;
  realtime: MemoryRealtimeAccess;
}

/** API complète (gardes, validation, cookies, Socket.IO) sans Redis ni PostgreSQL. */
export async function createTestApp(
  controllers: Type[] = [],
  config: Partial<AppConfig> = {},
): Promise<TestApp> {
  const users = new MemoryUsersRepository();
  const sessions = new MemorySessionStore();
  const prisma = new MemoryPrisma();
  const realtime = new MemoryRealtimeAccess();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers })
    .overrideProvider(APP_CONFIG)
    .useValue({ ...testConfig, ...config })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(UsersRepository)
    .useValue(users)
    .overrideProvider(SessionStore)
    .useValue(sessions)
    .overrideProvider(RealtimeAccess)
    .useValue(realtime)
    .compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await configureApp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return { app, users, sessions, prisma, realtime };
}

/** Valeur du cookie de session posé par une réponse. */
export function sessionCookie(setCookie: string | string[] | undefined): string {
  const header = [setCookie ?? []].flat().find((c) => c.startsWith("sid="));
  if (!header) throw new Error("Aucun cookie de session dans la réponse");
  return header.split(";")[0]!.slice("sid=".length);
}

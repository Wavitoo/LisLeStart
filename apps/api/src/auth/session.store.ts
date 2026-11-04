import { createHmac, randomBytes } from "node:crypto";
import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { APP_CONFIG, type AppConfig } from "../config";

/** Durée de vie d'une session sans activité. */
export const SESSION_TTL_SECONDS = 7 * 24 * 3600;

/** Stockage des sessions : Redis en vrai, une Map dans les tests. */
export abstract class SessionStore {
  /** Crée une session et renvoie son identifiant, à placer dans le cookie. */
  abstract create(userId: string): Promise<string>;
  /** Renvoie l'utilisateur de la session et prolonge sa durée de vie, ou null si elle a expiré. */
  abstract touch(sessionId: string): Promise<string | null>;
  abstract destroy(sessionId: string): Promise<void>;
}

export function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

@Injectable()
export class RedisSessionStore extends SessionStore implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    super();
    this.redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 });
  }

  /** La clé Redis est un HMAC de l'identifiant : une copie de Redis ne donne aucun cookie valide. */
  private key(sessionId: string): string {
    return `session:${createHmac("sha256", this.config.sessionSecret).update(sessionId).digest("hex")}`;
  }

  async create(userId: string): Promise<string> {
    const sessionId = newSessionId();
    await this.redis.set(this.key(sessionId), userId, "EX", SESSION_TTL_SECONDS);
    return sessionId;
  }

  async touch(sessionId: string): Promise<string | null> {
    const key = this.key(sessionId);
    const userId = await this.redis.get(key);
    if (userId) await this.redis.expire(key, SESSION_TTL_SECONDS);
    return userId;
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

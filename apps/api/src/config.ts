/** Configuration lue une fois au démarrage ; une valeur manquante arrête l'API avec un message clair. */
export interface AppConfig {
  sessionSecret: string;
  redisUrl: string;
  cookie: {
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
  };
}

const SAME_SITE = ["lax", "strict", "none"] as const;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const sessionSecret = env.SESSION_SECRET ?? "";
  if (sessionSecret.length < 32) {
    throw new Error(
      "SESSION_SECRET manquant ou trop court (32 caractères minimum). Lance scripts/setup.sh ou génère-le avec : openssl rand -hex 32",
    );
  }

  const sameSite = (env.COOKIE_SAME_SITE ?? "lax").toLowerCase();
  if (!SAME_SITE.includes(sameSite as AppConfig["cookie"]["sameSite"])) {
    throw new Error(`COOKIE_SAME_SITE invalide : « ${sameSite} » (attendu : lax, strict ou none).`);
  }

  return {
    sessionSecret,
    redisUrl: env.REDIS_URL ?? "redis://localhost:6379",
    cookie: {
      // SameSite=None impose Secure ; en local (http) le cookie reste non sécurisé
      secure: env.NODE_ENV === "production" || sameSite === "none",
      sameSite: sameSite as AppConfig["cookie"]["sameSite"],
    },
  };
}

export const APP_CONFIG = Symbol("APP_CONFIG");

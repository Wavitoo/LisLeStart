import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id (algorithme par défaut de @node-rs/argon2) avec les paramètres minimaux recommandés
 * par l'OWASP : 19 Mio de mémoire, 2 itérations, 1 fil.
 */
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // Empreinte illisible (compte importé, donnée corrompue) : refus, jamais d'exception
    return false;
  }
}

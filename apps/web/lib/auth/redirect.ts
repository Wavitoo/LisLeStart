import type { Role } from "@lislestart/shared";

/** Page d'arrivée par défaut après connexion ou inscription. */
export function defaultDestination(role: Role): string {
  return role === "admin" ? "/admin" : "/tournois";
}

/**
 * Destination de `?suite=` : uniquement un chemin interne (« /tournois/… »). Une adresse externe,
 * « //site » ou « /\\site » serait une redirection ouverte (OWASP A01) : on retombe sur le défaut.
 */
export function safeDestination(next: unknown, role: Role): string {
  if (typeof next !== "string" || next.length > 512) return defaultDestination(role);
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return defaultDestination(role);
  }
  // Pas de retour vers les pages d'authentification elles-mêmes
  if (/^\/(connexion|inscription)(?:[/?#]|$)/.test(next)) return defaultDestination(role);
  return next;
}

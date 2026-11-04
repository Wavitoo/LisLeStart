/**
 * Horloge alignée sur le serveur : l'écart mesuré à la réponse de l'API est appliqué à l'horloge
 * du téléphone, qui peut être fausse. Seul le serveur décide du verrouillage ; ceci sert à
 * l'affichage (compte à rebours, bouton désactivé).
 */
export function serverClock(serverTime: string, deviceNow: () => number = Date.now): () => Date {
  const offset = Date.parse(serverTime) - deviceNow();
  return () => new Date(deviceNow() + offset);
}

/** Libellé de fermeture d'un pronostic, à partir de l'heure serveur et du début du match. */
export function lockLabel(serverNow: Date, startsAt: Date): string {
  const remaining = startsAt.getTime() - serverNow.getTime();
  if (remaining <= 0) return "Pronostic verrouillé";
  // Arrondi supérieur : à 40 s de la fermeture, le prono est encore ouvert (« 1 min »)
  const minutes = Math.ceil(remaining / 60000);
  if (minutes < 60) return `Se ferme dans ${minutes} min`;
  return `Se ferme dans ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** Libellé de fermeture d'un pronostic, à partir de l'heure serveur et du début du match. */
export function lockLabel(serverNow: Date, startsAt: Date): string {
  const minutes = Math.floor((startsAt.getTime() - serverNow.getTime()) / 60000);
  if (minutes <= 0) return "Pronostic verrouillé";
  if (minutes < 60) return `Se ferme dans ${minutes} min`;
  return `Se ferme dans ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

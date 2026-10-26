/** Formate un nombre de secondes en « 2 h 14 » ou « 5 min ». */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 min";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

/** « 1 erreur », « 3 erreurs » : en français, le pluriel commence à 2. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${Math.abs(count) >= 2 ? pluralForm : singular}`;
}

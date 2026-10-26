/**
 * Ordre de placement standard des têtes de série dans un arbre de taille `size`
 * (puissance de 2). La tête de série 1 et la 2 ne peuvent se croiser qu'en finale.
 *
 * Exemple pour 8 : [1, 8, 4, 5, 2, 7, 3, 6].
 */
export function seedOrder(size: number): number[] {
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new RangeError(`La taille d'arbre doit être une puissance de 2 ≥ 2 (reçu : ${size}).`);
  }
  let order = [1, 2];
  while (order.length < size) {
    const next = order.length * 2 + 1;
    order = order.flatMap((seed) => [seed, next - seed]);
  }
  return order;
}

/** Plus petite puissance de 2 supérieure ou égale à `n`. */
export function bracketSize(n: number): number {
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

import { cx } from "@/lib/cx";

/*
 * Icônes exportées de la maquette (public/icons), toujours décoratives : le sens est porté par le
 * texte voisin. Icon garde la couleur du fichier ; TintedIcon prend la couleur du texte (currentColor)
 * pour suivre l'état, comme le demande la maquette (« recolorer via le trait »).
 */

export function Icon({
  name,
  size,
  height = size,
  className,
}: {
  name: string;
  size: number;
  /** Pour les fichiers non carrés (interrupteur 46 × 28). */
  height?: number;
  className?: string;
}) {
  return (
    <img
      src={`/icons/${name}.svg`}
      alt=""
      width={size}
      height={height}
      className={cx("shrink-0", className)}
    />
  );
}

export function TintedIcon({
  name,
  size,
  className,
}: {
  name: string;
  size: number;
  className?: string;
}) {
  const mask = `url(/icons/${name}.svg) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className={cx("shrink-0 bg-current", className)}
      style={{ width: size, height: size, mask, WebkitMask: mask }}
    />
  );
}

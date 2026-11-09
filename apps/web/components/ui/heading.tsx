import type { ComponentProps } from "react";

export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

/** Titre de niveau variable : le niveau suit la structure, le style reste celui de className. */
export function Heading({ level, ...props }: { level: HeadingLevel } & ComponentProps<"h2">) {
  const Tag = `h${level}` as const;
  return <Tag {...props} />;
}

/** Niveau suivant, plafonné à h6. */
export function nextLevel(level: HeadingLevel): HeadingLevel {
  return Math.min(level + 1, 6) as HeadingLevel;
}

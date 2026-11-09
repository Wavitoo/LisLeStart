"use client";

import * as Tabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

const trigger =
  "flex h-11 items-center rounded-field border border-line-strong px-4.5 type-body-m-strong text-fg-secondary " +
  "data-[state=active]:border-2 data-[state=active]:border-lime data-[state=active]:bg-lime-soft data-[state=active]:text-fg";

/**
 * Bascule « Vue arbre / Vue liste (équivalente) » de la maquette, en onglets Radix : flèches
 * gauche/droite pour changer de vue, Tab pour entrer dans le panneau. L'onglet actif se distingue
 * aussi par sa bordure double, pas seulement par la couleur.
 */
export function BracketViews({ tree, list }: { tree: ReactNode; list: ReactNode }) {
  return (
    <Tabs.Root defaultValue="arbre" className="flex flex-col gap-5">
      <Tabs.List aria-label="Affichage de l'arbre" className="flex flex-wrap gap-2">
        <Tabs.Trigger value="arbre" className={trigger}>
          Vue arbre
        </Tabs.Trigger>
        <Tabs.Trigger value="liste" className={trigger}>
          Vue liste (équivalente)
        </Tabs.Trigger>
      </Tabs.List>
      {/* Pas de tabindex sur les panneaux : leurs zones de défilement sont déjà focalisables */}
      <Tabs.Content value="arbre" tabIndex={-1}>
        {tree}
      </Tabs.Content>
      <Tabs.Content value="liste" tabIndex={-1}>
        {list}
      </Tabs.Content>
    </Tabs.Root>
  );
}

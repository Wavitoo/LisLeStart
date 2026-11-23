"use client";

import * as Tabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

// Contrôle segmenté de la maquette : l'onglet actif est en relief (bordure, fond), pas que coloré.
const trigger =
  "flex h-11 items-center rounded-nav border border-transparent px-4 type-body-m-strong text-fg-muted " +
  "data-[state=active]:border-line-strong data-[state=active]:bg-raised data-[state=active]:text-fg data-[state=active]:shadow-md";

/**
 * Bascule « Vue arbre / Vue liste (équivalente) » de la maquette, en onglets Radix : flèches
 * gauche/droite pour changer de vue, Tab pour entrer dans le panneau. L'onglet actif se distingue
 * aussi par sa bordure double, pas seulement par la couleur.
 */
export function BracketViews({ tree, list }: { tree: ReactNode; list: ReactNode }) {
  return (
    <Tabs.Root defaultValue="arbre" className="flex flex-col gap-5">
      <Tabs.List
        aria-label="Affichage de l'arbre"
        className="flex w-fit gap-0.5 self-end rounded-control bg-sidebar p-0.75"
      >
        <Tabs.Trigger value="arbre" className={trigger}>
          Graphique
        </Tabs.Trigger>
        <Tabs.Trigger value="liste" className={trigger}>
          Liste
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

import type { PredictionState } from "../lib/predictions";
import { StatusChip } from "./StatusChip";

const CHIPS: Record<PredictionState, Parameters<typeof StatusChip>[0]> = {
  open: { tone: "neutral", icon: "pencil-outline", label: "Modifiable" },
  locked: { tone: "violet", icon: "lock", label: "Verrouillé" },
  exact: { tone: "lime", icon: "check-all", label: "Score exact" },
  right: { tone: "lime", icon: "check", label: "Prono juste" },
  wrong: { tone: "corail", icon: "close", label: "Prono faux" },
};

export const predictionChipLabel = (state: PredictionState) => CHIPS[state].label;

/** État d'un prono : icône et mot, la couleur n'étant qu'un indice de plus. */
export function PredictionChip({ state }: { state: PredictionState }) {
  return <StatusChip {...CHIPS[state]} />;
}

import type { BracketSlot } from "@lislestart/shared";
import { cx } from "@/lib/cx";
import { slotKind, slotLabel } from "@/lib/tournament/format";

export type SlotOutcome = "winner" | "loser" | "none";

/*
 * Case d'équipe (composant Figma 2:39). États dérivés de la maquette :
 * - participant : fond raised, bordure pleine (Default) ;
 * - vainqueur : nom en gras et ✓ devant le score ; perdant : texte atténué ;
 * - à déterminer et exempt : bordure pointillée (Disabled), avec « Vainqueur demie 1 » ou « Exempt ».
 * Le texte lu par les lecteurs d'écran est porté par le match (describeMatch), pas par la case.
 */
export function TeamSlot({ slot, outcome = "none" }: { slot: BracketSlot; outcome?: SlotOutcome }) {
  const kind = slotKind(slot);
  const placeholder = kind !== "participant";

  return (
    <div
      data-slot-kind={kind}
      data-outcome={outcome}
      className={cx(
        "flex min-h-12 items-center justify-between gap-3 rounded-field px-3.5 py-2",
        placeholder
          ? "border border-dashed border-line-strong text-fg-muted"
          : "border border-line-strong bg-raised",
      )}
    >
      <span
        className={cx(
          "min-w-0 break-words",
          placeholder && "type-body-m",
          !placeholder && outcome === "winner" && "type-body-m font-bold text-fg",
          !placeholder && outcome === "loser" && "type-body-m-strong text-fg-muted",
          !placeholder && outcome === "none" && "type-body-m-strong text-fg",
        )}
      >
        {slotLabel(slot)}
      </span>
      {!placeholder && (
        <span className="flex shrink-0 items-center gap-1.5">
          {outcome === "winner" && <span className="type-body-s text-lime-text">✓</span>}
          {slot.score !== null && (
            <span className={cx("type-mono-s", outcome === "loser" ? "text-fg-muted" : "text-fg")}>
              {slot.score}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

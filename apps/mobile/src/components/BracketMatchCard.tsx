import type { BracketMatch, BracketSlot } from "@lislestart/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { hasScore, matchAccessibilityLabel, slotLabel, statusLabel } from "../lib/bracket";
import { colors, fonts, radius, space, type } from "../theme";
import { LiveBadge } from "./LiveBadge";

/**
 * Un match de l'arbre en vue liste : une ligne par participant (tête de série, nom, score).
 * Le vainqueur porte une coche et le mot « Qualifié », pas seulement une couleur ; un exempt et
 * un participant à déterminer sont écrits en toutes lettres.
 */
export function BracketMatchCard({
  match,
  roundLabel,
}: {
  match: BracketMatch;
  roundLabel: string;
}) {
  const scored = hasScore(match);
  const isByeMatch = match.slots.some((s) => s.isBye);

  return (
    <View
      accessible
      // Annonce le nouveau score quand il change en direct
      accessibilityLiveRegion={match.status === "live" ? "polite" : "none"}
      accessibilityLabel={matchAccessibilityLabel(match, roundLabel)}
      style={[styles.card, match.status === "live" && styles.live]}
    >
      <View style={styles.header}>
        <Text style={styles.meta}>
          Match {match.number} · BO{match.bestOf}
        </Text>
        {match.status === "live" ? (
          <LiveBadge />
        ) : (
          <Text style={styles.meta}>{isByeMatch ? "Exempt" : statusLabel(match.status)}</Text>
        )}
      </View>
      {match.slots.map((slot, i) => (
        <SlotRow
          key={slot.participantId ?? `vide-${i}`}
          slot={slot}
          showScore={scored && !isByeMatch}
          winner={Boolean(slot.participantId) && slot.participantId === match.winnerId}
        />
      ))}
    </View>
  );
}

function SlotRow({
  slot,
  showScore,
  winner,
}: {
  slot: BracketSlot;
  showScore: boolean;
  winner: boolean;
}) {
  const unknown = slot.isBye || !slot.name;
  return (
    <View style={styles.slot}>
      <Text style={styles.seed}>{slot.seed ? `#${slot.seed}` : "–"}</Text>
      <View style={styles.nameBox}>
        <Text style={[styles.name, unknown && styles.unknown, winner && styles.winnerName]}>
          {slotLabel(slot)}
        </Text>
        {winner && (
          <View style={styles.qualified}>
            <MaterialCommunityIcons
              name="check"
              size={14}
              color={colors.lime}
              importantForAccessibility="no"
            />
            <Text style={styles.qualifiedText}>Qualifié</Text>
          </View>
        )}
      </View>
      {showScore && <Text style={styles.score}>{slot.score ?? 0}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[3],
    gap: space[2],
  },
  live: { borderColor: colors.lime, borderWidth: 2 },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[2],
  },
  meta: { ...type.caption, color: colors.muted },
  slot: { flexDirection: "row", alignItems: "center", gap: space[3], minHeight: 32 },
  seed: {
    fontFamily: fonts.dataSmall,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
    minWidth: 28,
  },
  nameBox: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space[2] },
  name: { ...type.body, color: colors.craie },
  unknown: { color: colors.muted, fontStyle: "italic" },
  winnerName: { fontFamily: fonts.bodyStrong },
  qualified: { flexDirection: "row", alignItems: "center", gap: 2 },
  qualifiedText: { ...type.caption, color: colors.lime },
  score: { fontFamily: fonts.data, fontSize: 18, lineHeight: 24, color: colors.craie },
});

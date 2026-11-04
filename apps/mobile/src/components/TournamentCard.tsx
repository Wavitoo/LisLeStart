import type { TournamentSummary } from "@lislestart/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  locationLabel,
  participantsLabel,
  sourceLabel,
  tournamentAccessibilityLabel,
} from "../lib/tournaments";
import { colors, radius, space, type } from "../theme";
import { LiveBadge } from "./LiveBadge";

/** Carte d'un tournoi en cours ; la toucher ouvre son arbre. */
export function TournamentCard({
  tournament,
  onPress,
}: {
  tournament: TournamentSummary;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tournamentAccessibilityLabel(tournament)}
      accessibilityHint="Ouvre l'arbre et les matchs du tournoi"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <LiveBadge />
        <View style={styles.open}>
          <Text style={styles.openText}>Voir l'arbre</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.craie}
            importantForAccessibility="no"
          />
        </View>
      </View>
      <Text style={styles.name}>{tournament.name}</Text>
      <Text style={styles.game}>{tournament.game}</Text>
      <Text style={styles.meta}>
        {[
          locationLabel(tournament.location),
          participantsLabel(tournament.participantCount),
          sourceLabel(tournament.source),
        ].join(" · ")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
  },
  pressed: { opacity: 0.85 },
  top: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[2],
  },
  open: { flexDirection: "row", alignItems: "center" },
  openText: { ...type.label, color: colors.craie },
  name: { ...type.heading, color: colors.craie },
  game: { ...type.bodyStrong, color: colors.craie },
  meta: { ...type.caption, color: colors.muted },
});

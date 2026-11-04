import type { TournamentSummary } from "@lislestart/shared";
import { StyleSheet, Text, View } from "react-native";
import {
  locationLabel,
  participantsLabel,
  sourceLabel,
  tournamentAccessibilityLabel,
} from "../lib/tournaments";
import { colors, radius, space, type } from "../theme";
import { LiveBadge } from "./LiveBadge";

export function TournamentCard({ tournament }: { tournament: TournamentSummary }) {
  return (
    <View
      accessible
      accessibilityLabel={tournamentAccessibilityLabel(tournament)}
      style={styles.card}
    >
      <LiveBadge />
      <Text style={styles.name}>{tournament.name}</Text>
      <Text style={styles.game}>{tournament.game}</Text>
      <Text style={styles.meta}>
        {[
          locationLabel(tournament.location),
          participantsLabel(tournament.participantCount),
          sourceLabel(tournament.source),
        ].join(" · ")}
      </Text>
    </View>
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
  name: { ...type.heading, color: colors.craie },
  game: { ...type.bodyStrong, color: colors.craie },
  meta: { ...type.caption, color: colors.muted },
});

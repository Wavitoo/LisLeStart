import type { LeaderboardEntry } from "@lislestart/shared";
import { StyleSheet, Text, View } from "react-native";
import { formatCount } from "../lib/predictions";
import { colors, fonts, radius, space, type } from "../theme";

/**
 * Ligne du classement (maquette « Top pronostiqueurs ») : rang lime, pseudo, points. La ligne de
 * l'utilisateur passe sur surface-raised et porte « (toi) », pas seulement une couleur.
 */
export function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const name = isMe ? `${entry.displayName} (toi)` : entry.displayName;
  return (
    <View
      accessible
      accessibilityLabel={`${entry.rank}e, ${name}, ${formatCount(entry.points)} points`}
      style={[styles.row, isMe && styles.me]}
    >
      <Text style={styles.rank}>#{entry.rank}</Text>
      <Text style={[styles.name, isMe && styles.nameMe]}>{name}</Text>
      <Text style={styles.points}>{formatCount(entry.points)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space[3],
    minHeight: 48,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.md,
  },
  me: { backgroundColor: colors.surfaceRaised },
  rank: { fontFamily: fonts.data, fontSize: 15, lineHeight: 20, color: colors.lime, minWidth: 36 },
  name: { ...type.body, color: colors.craie, flex: 1 },
  nameMe: { fontFamily: fonts.bodyStrong },
  points: { ...type.data, color: colors.craie },
});

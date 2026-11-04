import type { DistributionShare, PredictionMatch } from "@lislestart/shared";
import { StyleSheet, Text, View } from "react-native";
import { slotName } from "../lib/predictions";
import { colors, radius, space, type } from "../theme";

/**
 * Répartition du public : lime à gauche, violet à droite, pourcentages écrits (charte). Lue par
 * TalkBack comme une seule phrase.
 */
export function DistributionBar({
  match,
  distribution,
}: {
  match: PredictionMatch;
  distribution: DistributionShare[];
}) {
  const [left, right] = distribution;
  if (!left || !right) return null;
  const leftName = slotName(match, left.participantId);
  const rightName = slotName(match, right.participantId);

  return (
    <View
      accessible
      accessibilityLabel={`${left.percent} % voient ${leftName} gagner, ${right.percent} % ${rightName}`}
      style={styles.wrapper}
    >
      <View style={styles.legend}>
        <Text style={styles.left}>
          {left.percent} % voient {leftName} gagner
        </Text>
        <Text style={styles.right}>
          {right.percent} % {rightName}
        </Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.segment, styles.lime, { flex: left.percent }]} />
        <View style={[styles.segment, styles.violet, { flex: right.percent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space[2] },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space[2],
  },
  left: { ...type.bodyStrong, color: colors.craie, flexShrink: 1 },
  right: { ...type.bodyStrong, color: colors.violet },
  bar: { flexDirection: "row", height: 8, gap: 2 },
  segment: { borderRadius: radius.pill },
  lime: { backgroundColor: colors.lime },
  violet: { backgroundColor: colors.violet },
});

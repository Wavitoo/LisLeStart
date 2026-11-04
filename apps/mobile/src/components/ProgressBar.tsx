import { StyleSheet, View } from "react-native";
import { colors, radius } from "../theme";

/**
 * Barre de progression ; la valeur est toujours écrite à côté. Sans `label`, elle est décorative
 * (la valeur est déjà lue avec le texte voisin) et TalkBack l'ignore.
 */
export function ProgressBar({
  value,
  max,
  label,
  color = colors.lime,
}: {
  value: number;
  max: number;
  /** Phrase lue par TalkBack, par exemple « 2 questions répondues sur 4 ». */
  label?: string;
  color?: string;
}) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View
      accessible={Boolean(label)}
      accessibilityRole={label ? "progressbar" : undefined}
      accessibilityLabel={label}
      accessibilityValue={label ? { min: 0, max, now: value } : undefined}
      importantForAccessibility={label ? "yes" : "no-hide-descendants"}
      style={styles.track}
    >
      <View style={[styles.fill, { backgroundColor: color, flex: ratio }]} />
      <View style={{ flex: 1 - ratio }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  fill: { borderRadius: radius.pill },
});

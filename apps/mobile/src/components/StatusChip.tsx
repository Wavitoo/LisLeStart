import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "../theme";

type Tone = "lime" | "violet" | "corail" | "neutral";

const TONES: Record<Tone, { background: string; icon: string }> = {
  lime: { background: colors.limeSoft, icon: colors.lime },
  violet: { background: colors.violetSoft, icon: colors.violet },
  corail: { background: colors.corailSoft, icon: colors.corail },
  neutral: { background: colors.surfaceRaised, icon: colors.muted },
};

/** Badge d'état de la charte : fond doux, icône colorée et mot ; jamais la couleur seule. */
export function StatusChip({
  tone,
  icon,
  label,
}: {
  tone: Tone;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: TONES[tone].background }]}>
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={TONES[tone].icon}
        importantForAccessibility="no"
      />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space[1],
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.pill,
  },
  label: { ...type.label, color: colors.craie },
});

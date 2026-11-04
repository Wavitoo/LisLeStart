import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, touchTarget, type } from "../theme";

/**
 * Onglets segmentés. Onglet choisi : fond, bordure lime et soulignement, annoncé « sélectionné »
 * par TalkBack ; la couleur n'est jamais le seul indice.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.tab, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[1],
    gap: space[1],
  },
  tab: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[2],
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: { backgroundColor: colors.surfaceRaised, borderColor: colors.lime },
  label: { ...type.label, color: colors.muted, textAlign: "center" },
  labelSelected: { color: colors.craie, textDecorationLine: "underline" },
});

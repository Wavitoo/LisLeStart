import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space, touchTarget, type } from "../theme";

/**
 * Option à choix unique (équipe, score). Sélectionnée : bordure lime, coche et « Mon choix »,
 * annoncée « sélectionné » par TalkBack ; la couleur n'est jamais le seul indice.
 */
export function Choice({
  label,
  selected,
  disabled,
  onPress,
  data = false,
  accessibilityHint,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  /** Libellé chiffré (score) : police à chasse fixe. */
  data?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.selected,
        disabled && !selected && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[data ? styles.data : styles.label, disabled && !selected && styles.muted]}>
        {label}
      </Text>
      {selected && (
        <View style={styles.mark}>
          <MaterialCommunityIcons
            name="check"
            size={16}
            color={colors.lime}
            importantForAccessibility="no"
          />
          <Text style={styles.markText}>Mon choix</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: space[2],
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surfaceRaised,
  },
  selected: { borderColor: colors.lime, backgroundColor: colors.limeSoft },
  disabled: { borderStyle: "dashed", backgroundColor: colors.surface },
  pressed: { opacity: 0.85 },
  label: { ...type.bodyStrong, color: colors.craie, flexShrink: 1 },
  data: { fontFamily: fonts.data, fontSize: 17, lineHeight: 22, color: colors.craie },
  muted: { color: colors.muted },
  mark: { flexDirection: "row", alignItems: "center", gap: space[1] },
  markText: { ...type.label, color: colors.lime },
});

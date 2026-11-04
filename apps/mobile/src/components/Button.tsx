import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, space, touchTarget, type } from "../theme";

/**
 * Bouton de la charte : primaire (lime, un seul par écran) ou secondaire (bordure). Désactivé,
 * son libellé doit dire pourquoi (« Prono fermé »).
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  busy = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  busy?: boolean;
  accessibilityHint?: string;
}) {
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      accessibilityHint={accessibilityHint}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" ? styles.primary : styles.secondary,
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "primary" ? styles.primaryLabel : styles.secondaryLabel,
          inactive && styles.inactiveLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[5],
    paddingVertical: space[2],
  },
  primary: { backgroundColor: colors.lime },
  secondary: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.nuit },
  inactive: { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceRaised },
  pressed: { opacity: 0.85 },
  label: { ...type.label, textAlign: "center" },
  primaryLabel: { color: colors.nuit },
  secondaryLabel: { color: colors.craie },
  inactiveLabel: { color: colors.muted },
});

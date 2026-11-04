import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius, space, touchTarget, type } from "../theme";

/**
 * Champ de formulaire : libellé visible au-dessus, aide et erreur en dessous. TalkBack lit le
 * libellé, puis l'erreur ou l'aide, car React Native n'a pas d'équivalent d'aria-describedby.
 */
export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  ...input
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
} & Pick<
  TextInputProps,
  "autoComplete" | "keyboardType" | "secureTextEntry" | "textContentType" | "onSubmitEditing"
>) {
  const [focused, setFocused] = useState(false);
  const description = error ? `Erreur : ${error}` : hint;

  return (
    <View style={styles.field}>
      <Text style={styles.label} importantForAccessibility="no">
        {label}
      </Text>
      <TextInput
        {...input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={description ? `${label}. ${description}` : label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.lime}
        style={[styles.input, focused && styles.focused, error ? styles.invalid : null]}
      />
      {error ? (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons
            name="close"
            size={16}
            color={colors.corail}
            importantForAccessibility="no"
          />
          <Text style={styles.error} importantForAccessibility="no">
            {error}
          </Text>
        </View>
      ) : (
        hint && (
          <Text style={styles.hint} importantForAccessibility="no">
            {hint}
          </Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space[1] },
  label: { ...type.label, color: colors.craie },
  input: {
    ...type.body,
    minHeight: touchTarget,
    color: colors.craie,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: space[3],
  },
  // Focus : bordure lime, comme l'anneau de focus de la charte
  focused: { borderColor: colors.lime },
  invalid: { borderColor: colors.corail },
  errorRow: { flexDirection: "row", gap: space[1], alignItems: "flex-start" },
  error: { ...type.caption, color: colors.craie, flex: 1 },
  hint: { ...type.caption, color: colors.muted },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "../theme";
import { Button } from "./Button";

/** Erreur de chargement : icône, message annoncé par TalkBack et bouton « Réessayer ». */
export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="close"
          size={18}
          color={colors.corail}
          importantForAccessibility="no"
        />
        <Text style={styles.text}>{message}</Text>
      </View>
      <Button label="Réessayer" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    margin: space[4],
    padding: space[4],
    gap: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.corailSoft,
  },
  row: { flexDirection: "row", gap: space[2], alignItems: "flex-start" },
  text: { ...type.body, color: colors.craie, flex: 1 },
});

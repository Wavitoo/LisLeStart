import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "../theme";

/** Badge « En direct » : une icône et un mot, jamais la couleur seule. */
export function LiveBadge() {
  return (
    <View style={styles.badge}>
      <MaterialCommunityIcons
        name="circle"
        size={8}
        color={colors.lime}
        importantForAccessibility="no"
      />
      <Text style={styles.word}>En direct</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space[2],
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.pill,
    backgroundColor: colors.limeSoft,
  },
  word: { ...type.label, color: colors.craie },
});

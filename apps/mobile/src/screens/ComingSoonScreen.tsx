import { StyleSheet, Text } from "react-native";
import { Screen } from "../components/Screen";
import { colors, space, type } from "../theme";

/** Onglet dont le contenu arrive dans un prochain sprint. */
export function ComingSoonScreen({ title, description }: { title: string; description: string }) {
  return (
    <Screen title={title}>
      <Text style={styles.text}>{description}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { ...type.body, color: colors.muted, paddingHorizontal: space[4] },
});

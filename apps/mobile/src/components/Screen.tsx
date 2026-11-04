import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, space, type } from "../theme";

/** Gabarit d'un écran d'onglet : titre de niveau 1 puis contenu. */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.nuit },
  header: { paddingHorizontal: space[4], paddingTop: space[4], paddingBottom: space[3] },
  title: { ...type.title, color: colors.craie },
  content: { flex: 1 },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { useRootNavigation } from "../navigation";
import { colors, space, touchTarget, type } from "../theme";

/** Gabarit d'un écran d'onglet : titre de niveau 1, accès au compte, puis contenu. */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <AccountButton />
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

/** Icône pleine une fois connecté, contour sinon ; le libellé TalkBack dit l'état. */
function AccountButton() {
  const { user } = useAuth();
  const navigation = useRootNavigation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        user
          ? `Mon compte, connecté en tant que ${user.displayName}`
          : "Se connecter ou créer un compte"
      }
      onPress={() => navigation.navigate("Compte")}
      hitSlop={4}
      style={({ pressed }) => [styles.account, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons
        name={user ? "account-circle" : "account-circle-outline"}
        size={30}
        color={user ? colors.lime : colors.craie}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.nuit },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[3],
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[3],
  },
  title: { ...type.title, color: colors.craie, flexShrink: 1 },
  account: {
    width: touchTarget,
    height: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  content: { flex: 1 },
});

import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { lockLabel } from "./src/lib/lock";

export default function App() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        LisLeStart
      </Text>
      <Text style={styles.body}>
        {lockLabel(new Date(), new Date(Date.now() + 62 * 60 * 1000))}
      </Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1222",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { color: "#F2F4FA", fontSize: 32, fontWeight: "700" },
  body: { color: "#C9CEE0", fontSize: 16, marginTop: 8 },
});

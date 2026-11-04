import type { TournamentSummary } from "@lislestart/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, api, usingMockData } from "../api";
import { Screen } from "../components/Screen";
import { TournamentCard } from "../components/TournamentCard";
import { colors, radius, space, touchTarget, type } from "../theme";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; tournaments: TournamentSummary[] };

/** Onglet Arbres : tournois en cours, point d'entrée vers les arbres en direct. */
export function TournamentsScreen() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { tournaments } = await api.liveTournaments();
      setState({ kind: "ready", tournaments });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof ApiError ? error.message : "Une erreur inattendue est survenue.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = () => {
    setState({ kind: "loading" });
    void load();
  };

  return (
    <Screen title="Arbres">
      <Text accessibilityRole="header" style={styles.section}>
        Tournois en cours
      </Text>
      {usingMockData && <Text style={styles.caption}>Données de démonstration</Text>}

      {state.kind === "loading" && (
        <ActivityIndicator
          color={colors.lime}
          size="large"
          style={styles.center}
          accessibilityLabel="Chargement des tournois en cours"
        />
      )}

      {state.kind === "error" && (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <View style={styles.errorRow}>
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={colors.corail}
              importantForAccessibility="no"
            />
            <Text style={styles.errorText}>{state.message}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {state.kind === "ready" && (
        <FlatList
          data={state.tournaments}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TournamentCard tournament={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.empty} accessibilityLiveRegion="polite">
              Aucun tournoi en cours pour l'instant. Tire vers le bas pour actualiser.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[colors.nuit]}
              progressBackgroundColor={colors.lime}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...type.section, color: colors.craie, paddingHorizontal: space[4] },
  caption: {
    ...type.caption,
    color: colors.muted,
    paddingHorizontal: space[4],
    marginTop: space[1],
  },
  center: { marginTop: space[7] },
  list: { padding: space[4], paddingBottom: space[6] },
  separator: { height: space[4] },
  empty: { ...type.body, color: colors.muted },
  error: {
    margin: space[4],
    padding: space[4],
    gap: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.corailSoft,
  },
  errorRow: { flexDirection: "row", gap: space[2], alignItems: "flex-start" },
  errorText: { ...type.body, color: colors.craie, flex: 1 },
  button: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[5],
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { ...type.label, color: colors.nuit },
});

import type { TournamentSummary } from "@lislestart/shared";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ApiError, api, usingMockData } from "../api";
import { ErrorBox } from "../components/ErrorBox";
import { Screen } from "../components/Screen";
import { TournamentCard } from "../components/TournamentCard";
import { useRootNavigation } from "../navigation";
import { colors, space, type } from "../theme";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; tournaments: TournamentSummary[] };

/** Onglet Arbres : tournois en cours, point d'entrée vers les arbres en direct. */
export function TournamentsScreen() {
  const navigation = useRootNavigation();
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

      {state.kind === "error" && <ErrorBox message={state.message} onRetry={retry} />}

      {state.kind === "ready" && (
        <FlatList
          data={state.tournaments}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TournamentCard
              tournament={item}
              onPress={() =>
                navigation.navigate("Tournoi", { tournamentId: item.id, name: item.name })
              }
            />
          )}
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
});

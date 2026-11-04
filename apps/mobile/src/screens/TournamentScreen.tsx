import type { TournamentBracketResponse } from "@lislestart/shared";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, api, usingMockData } from "../api";
import { BracketMatchCard } from "../components/BracketMatchCard";
import { ErrorBox } from "../components/ErrorBox";
import { LiveBadge } from "../components/LiveBadge";
import { applyBracketUpdate, formatLabel, liveCount } from "../lib/bracket";
import { locationLabel, participantsLabel, sourceLabel } from "../lib/tournaments";
import type { RootStackParamList } from "../navigation";
import { realtime } from "../realtime";
import { colors, radius, space, type } from "../theme";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: TournamentBracketResponse };

type Props = NativeStackScreenProps<RootStackParamList, "Tournoi">;

/** Arbre d'un tournoi en vue liste : étapes, tours en titres, matchs en direct. */
export function TournamentScreen({ route }: Props) {
  const { tournamentId } = route.params;
  const [state, setState] = useState<State>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setState({ kind: "ready", data: await api.tournamentBracket(tournamentId) });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof ApiError ? error.message : "Une erreur inattendue est survenue.",
      });
    }
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Direct : le score change sur place ; à la fin d'un match, l'arbre est rechargé pour que le
  // vainqueur apparaisse au tour suivant (c'est le serveur qui fait avancer l'arbre)
  useEffect(
    () =>
      realtime.watchTournaments([tournamentId], (event) => {
        if (event.status === "done") {
          void load();
          return;
        }
        setState((current) =>
          current.kind === "ready"
            ? {
                kind: "ready",
                data: { ...current.data, stages: applyBracketUpdate(current.data.stages, event) },
              }
            : current,
        );
      }),
    [tournamentId, load],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (state.kind === "loading") {
    return (
      <View style={styles.page}>
        <ActivityIndicator
          color={colors.lime}
          size="large"
          style={styles.center}
          accessibilityLabel="Chargement de l'arbre"
        />
      </View>
    );
  }

  if (state.kind === "error") {
    return (
      <View style={styles.page}>
        <ErrorBox
          message={state.message}
          onRetry={() => {
            setState({ kind: "loading" });
            void load();
          }}
        />
      </View>
    );
  }

  const { tournament, stages } = state.data;
  const live = liveCount(stages);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={[colors.nuit]}
          progressBackgroundColor={colors.lime}
        />
      }
    >
      {usingMockData && <Text style={styles.caption}>Données de démonstration</Text>}
      <View style={styles.summary}>
        <Text accessibilityRole="header" style={styles.title}>
          {tournament.name}
        </Text>
        <Text style={styles.body}>{tournament.game}</Text>
        <Text style={styles.caption}>
          {[
            locationLabel(tournament.location),
            participantsLabel(tournament.participantCount),
            sourceLabel(tournament.source),
          ].join(" · ")}
        </Text>
        {live > 0 && (
          <View style={styles.liveRow}>
            <LiveBadge />
            <Text style={styles.body}>
              {live} match{live > 1 ? "s" : ""} en cours
            </Text>
          </View>
        )}
      </View>

      {stages.length === 0 && (
        <Text style={styles.empty}>
          L'arbre de ce tournoi n'est pas encore publié. Tire vers le bas pour actualiser.
        </Text>
      )}

      {stages.map((stage) => (
        <View key={stage.id} style={styles.stage}>
          <Text accessibilityRole="header" style={styles.stageTitle}>
            {stage.name}
          </Text>
          <Text style={styles.caption}>{formatLabel(stage.format)}</Text>
          {stage.rounds.map((round) => (
            <View key={round.round} style={styles.round}>
              <Text accessibilityRole="header" style={styles.roundTitle}>
                {round.label}
              </Text>
              {round.matches.map((match) => (
                <BracketMatchCard key={match.id} match={match} roundLabel={round.label} />
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.nuit },
  center: { marginTop: space[7] },
  content: { padding: space[4], paddingBottom: space[6], gap: space[5] },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
  },
  title: { ...type.heading, color: colors.craie },
  body: { ...type.body, color: colors.craie },
  caption: { ...type.caption, color: colors.muted },
  liveRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space[2] },
  empty: { ...type.body, color: colors.muted },
  stage: { gap: space[3] },
  stageTitle: { ...type.heading, color: colors.craie },
  round: { gap: space[2] },
  roundTitle: { ...type.section, color: colors.craie, marginTop: space[2] },
});

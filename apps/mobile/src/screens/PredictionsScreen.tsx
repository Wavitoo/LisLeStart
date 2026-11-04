import type { PredictionInput, PredictionMatch } from "@lislestart/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, api, usingMockData } from "../api";
import { LiveMatchCard } from "../components/LiveMatchCard";
import { MyPredictionRow } from "../components/MyPredictionRow";
import { PredictionCard } from "../components/PredictionCard";
import { Screen } from "../components/Screen";
import { serverClock } from "../lib/lock";
import { applyMatchUpdate, featuredMatches, myPredictions } from "../lib/predictions";
import { useAuth } from "../auth/AuthContext";
import { useRootNavigation } from "../navigation";
import { realtime } from "../realtime";
import { colors, radius, space, touchTarget, type } from "../theme";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; matches: PredictionMatch[]; clock: () => Date };

/** Le compte à rebours et le verrouillage affiché avancent à ce rythme. */
const TICK_MS = 15_000;

/** Onglet Pronos : match en cours en direct, puis le prochain match à pronostiquer. */
export function PredictionsScreen() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { user } = useAuth();
  const navigation = useRootNavigation();
  // Recharge à la connexion et à la déconnexion : « Ton prono » dépend du compte
  const userId = user?.id ?? null;

  const load = useCallback(async () => {
    try {
      const { serverTime, matches } = await api.predictionFeed();
      const clock = serverClock(serverTime);
      setState({ kind: "ready", matches, clock });
      setNow(clock());
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof ApiError ? error.message : "Une erreur inattendue est survenue.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, userId]);

  const clock = state.kind === "ready" ? state.clock : null;
  useEffect(() => {
    if (!clock) return;
    const timer = setInterval(() => setNow(clock()), TICK_MS);
    return () => clearInterval(timer);
  }, [clock]);

  // Tournois à suivre en direct : ceux des matchs affichés. Clé texte pour ne pas se réabonner
  // à chaque mise à jour de score.
  const tournamentKey =
    state.kind === "ready" ? [...new Set(state.matches.map((m) => m.tournamentId))].join(",") : "";
  useEffect(() => {
    if (!tournamentKey) return;
    return realtime.watchTournaments(tournamentKey.split(","), (event) =>
      setState((current) =>
        current.kind === "ready"
          ? { ...current, matches: applyMatchUpdate(current.matches, event) }
          : current,
      ),
    );
  }, [tournamentKey]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const save = useCallback(async (matchId: string, prediction: PredictionInput) => {
    const saved = await api.savePrediction(matchId, prediction);
    setState((current) =>
      current.kind === "ready"
        ? {
            ...current,
            matches: current.matches.map((m) =>
              m.id === matchId ? { ...m, myPrediction: saved } : m,
            ),
          }
        : current,
    );
  }, []);

  const featured = useMemo(
    () => (state.kind === "ready" ? featuredMatches(state.matches, now) : null),
    [state, now],
  );
  const next = featured?.next ?? null;
  // Tous mes pronos : un prono ne disparaît jamais de l'écran, même une fois le match fermé
  const mine = state.kind === "ready" ? myPredictions(state.matches, now) : [];

  return (
    <Screen title="Pronos">
      {usingMockData && <Text style={styles.caption}>Données de démonstration</Text>}

      {state.kind === "loading" && (
        <ActivityIndicator
          color={colors.lime}
          size="large"
          style={styles.center}
          accessibilityLabel="Chargement des matchs"
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
            onPress={() => {
              setState({ kind: "loading" });
              void load();
            }}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {featured && (
        <ScrollView
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
          <Text accessibilityRole="header" style={styles.section}>
            {featured.current?.status === "done" ? "Dernier résultat" : "Match en cours"}
          </Text>
          {featured.current ? (
            <LiveMatchCard match={featured.current} />
          ) : (
            <Text style={styles.empty}>Aucun match en direct pour l'instant.</Text>
          )}

          <Text accessibilityRole="header" style={styles.section}>
            À pronostiquer
          </Text>
          {next ? (
            // key : formulaire remis à zéro quand le prochain match change
            <PredictionCard
              key={next.id}
              match={next}
              serverNow={now}
              onSave={(prediction) => save(next.id, prediction)}
              signedIn={Boolean(user)}
              onSignIn={() => navigation.navigate("Compte")}
            />
          ) : (
            <Text style={styles.empty}>
              Aucun match à pronostiquer pour l'instant. Tire vers le bas pour actualiser.
            </Text>
          )}
          <Text style={styles.footnote}>Le pronostic se ferme au début du match.</Text>

          <Text accessibilityRole="header" style={styles.section}>
            Mes pronos
          </Text>
          {mine.length > 0 ? (
            mine.map((match) => <MyPredictionRow key={match.id} match={match} serverNow={now} />)
          ) : (
            <Text style={styles.empty}>
              {user
                ? "Tu n'as pas encore de prono. Choisis un vainqueur dans « À pronostiquer »."
                : "Connecte-toi pour retrouver tes pronos ici."}
            </Text>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: {
    ...type.caption,
    color: colors.muted,
    paddingHorizontal: space[4],
  },
  center: { marginTop: space[7] },
  content: { padding: space[4], paddingBottom: space[6], gap: space[4] },
  section: { ...type.section, color: colors.craie },
  empty: { ...type.body, color: colors.muted },
  footnote: { ...type.caption, color: colors.muted },
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

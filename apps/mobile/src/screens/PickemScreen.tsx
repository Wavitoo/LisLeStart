import type { PickemQuestionView } from "@lislestart/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, api, usingMockData } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { ErrorBox } from "../components/ErrorBox";
import { PickemQuestionCard } from "../components/PickemQuestionCard";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { serverClock } from "../lib/lock";
import { formatPoints, pointsWon, progress, sortQuestions } from "../lib/pickem";
import { useRootNavigation } from "../navigation";
import { colors, radius, space, type } from "../theme";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; questions: PickemQuestionView[]; clock: () => Date };

/** Les clôtures affichées avancent à ce rythme. */
const TICK_MS = 15_000;

/** Onglet Pick'em : progression, puis les questions de chaque tournoi. */
export function PickemScreen() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { user } = useAuth();
  const navigation = useRootNavigation();
  // Recharge à la connexion et à la déconnexion : les réponses dépendent du compte
  const userId = user?.id ?? null;

  const load = useCallback(async () => {
    try {
      const { serverTime, questions } = await api.pickemFeed();
      const clock = serverClock(serverTime);
      setState({ kind: "ready", questions, clock });
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

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const answer = useCallback(async (questionId: string, optionId: string) => {
    await api.answerPickem(questionId, optionId);
    setState((current) =>
      current.kind === "ready"
        ? {
            ...current,
            questions: current.questions.map((q) =>
              q.id === questionId ? { ...q, myAnswer: optionId } : q,
            ),
          }
        : current,
    );
  }, []);

  const questions = useMemo(
    () => (state.kind === "ready" ? sortQuestions(state.questions, now) : []),
    [state, now],
  );
  const { answered, total } = progress(questions, now);
  const won = pointsWon(questions, now);

  return (
    <Screen title="Pick'em">
      {usingMockData && <Text style={styles.caption}>Données de démonstration</Text>}

      {state.kind === "loading" && (
        <ActivityIndicator
          color={colors.lime}
          size="large"
          style={styles.center}
          accessibilityLabel="Chargement des questions"
        />
      )}

      {state.kind === "error" && (
        <ErrorBox
          message={state.message}
          onRetry={() => {
            setState({ kind: "loading" });
            void load();
          }}
        />
      )}

      {state.kind === "ready" && (
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
          <View style={styles.progress}>
            <Text accessibilityRole="header" style={styles.section}>
              Ta progression
            </Text>
            <Text style={styles.progressText}>
              {total === 0
                ? "Aucune question ouverte pour l'instant."
                : `${answered} sur ${total} questions ouvertes répondues`}
            </Text>
            {total > 0 && (
              <ProgressBar
                value={answered}
                max={total}
                label={`${answered} questions répondues sur ${total}`}
              />
            )}
            {user ? (
              <Text style={styles.points}>Points gagnés : {formatPoints(won)}</Text>
            ) : (
              <Button
                label="Se connecter pour répondre"
                onPress={() => navigation.navigate("Compte")}
              />
            )}
          </View>

          <Text accessibilityRole="header" style={styles.section}>
            Questions
          </Text>
          {questions.length === 0 ? (
            <Text style={styles.empty}>Aucune question Pick'em pour l'instant.</Text>
          ) : (
            questions.map((question) => (
              <PickemQuestionCard
                key={question.id}
                question={question}
                serverNow={now}
                signedIn={Boolean(user)}
                onAnswer={(optionId) => answer(question.id, optionId)}
                onSignIn={() => navigation.navigate("Compte")}
              />
            ))
          )}
          <Text style={styles.caption}>
            Une question se résout toute seule avec les résultats du tournoi. S'il manque une
            donnée, elle est annulée et personne ne perd de points.
          </Text>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: { ...type.caption, color: colors.muted, paddingHorizontal: space[4] },
  center: { marginTop: space[7] },
  content: { padding: space[4], paddingBottom: space[6], gap: space[4] },
  section: { ...type.section, color: colors.craie },
  progress: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[3],
  },
  progressText: { ...type.bodyStrong, color: colors.craie },
  points: { ...type.data, color: colors.lime },
  empty: { ...type.body, color: colors.muted },
});

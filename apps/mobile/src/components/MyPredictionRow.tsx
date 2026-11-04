import type { PredictionMatch } from "@lislestart/shared";
import { StyleSheet, Text, View } from "react-native";
import { formatScore, missedScore, predictionLabel, predictionState } from "../lib/predictions";
import { colors, radius, space, type } from "../theme";
import { PredictionChip, predictionChipLabel } from "./PredictionChip";

/** Une ligne de « Mes pronos » : match, mon choix, score éventuel et état (icône et mot). */
export function MyPredictionRow({ match, serverNow }: { match: PredictionMatch; serverNow: Date }) {
  const state = predictionState(match, serverNow);
  if (!state) return null;
  const missed = missedScore(match);
  const [home, away] = match.slots;
  const started = match.status === "live" || match.status === "done";
  const score = started ? formatScore(home?.score ?? null, away?.score ?? null) : null;
  const title = `${match.roundLabel} · ${match.tournamentName}`;
  const prediction = predictionLabel(match);

  return (
    <View
      accessible
      accessibilityLabel={[
        title,
        `Ton prono : ${prediction}`,
        score && `Score : ${home?.name} ${home?.score ?? 0}, ${away?.name} ${away?.score ?? 0}`,
        predictionChipLabel(state),
        missed && `Score exact manqué : ${missed}`,
      ]
        .filter(Boolean)
        .join(". ")}
      style={styles.row}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <PredictionChip state={state} />
      </View>
      <Text style={styles.prediction}>Ton prono : {prediction}</Text>
      {score && (
        <Text style={styles.score}>
          {match.status === "live" ? "En direct" : "Score final"} : {score}
        </Text>
      )}
      {missed && <Text style={styles.score}>Score exact manqué : {missed}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[2],
  },
  title: { ...type.label, color: colors.craie, flexShrink: 1 },
  prediction: { ...type.body, color: colors.craie },
  score: { ...type.caption, color: colors.muted },
});

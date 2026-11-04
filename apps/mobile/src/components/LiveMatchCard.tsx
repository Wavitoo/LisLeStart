import type { PredictionMatch } from "@lislestart/shared";
import { StyleSheet, Text, View } from "react-native";
import {
  formatCount,
  formatScore,
  missedScore,
  predictionLabel,
  predictionOutcome,
} from "../lib/predictions";
import { colors, fonts, radius, space, type } from "../theme";
import { DistributionBar } from "./DistributionBar";
import { LiveBadge } from "./LiveBadge";
import { PredictionChip } from "./PredictionChip";
import { StatusChip } from "./StatusChip";

/** Match en cours (ou dernier terminé) : score en direct, mon prono, répartition du public. */
export function LiveMatchCard({ match }: { match: PredictionMatch }) {
  const [home, away] = match.slots;
  const done = match.status === "done";
  const prediction = predictionLabel(match);
  const outcome = predictionOutcome(match);
  const missed = missedScore(match);
  const homeName = home?.name ?? "À déterminer";
  const awayName = away?.name ?? "À déterminer";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.round}>
          {done ? "Terminé" : "Match en cours"} · {match.roundLabel}
        </Text>
        {done ? <StatusChip tone="neutral" icon="flag-checkered" label="Terminé" /> : <LiveBadge />}
      </View>
      <Text style={styles.tournament}>{match.tournamentName}</Text>

      {/* Annoncé par TalkBack à chaque changement de score, sans voler le focus */}
      <View
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Score : ${homeName} ${home?.score ?? 0}, ${awayName} ${away?.score ?? 0}`}
        style={styles.scoreRow}
      >
        <Text style={[styles.team, styles.teamLeft]}>{homeName}</Text>
        <Text style={styles.score}>{formatScore(home?.score ?? null, away?.score ?? null)}</Text>
        <Text style={[styles.team, styles.teamRight]}>{awayName}</Text>
      </View>

      {prediction && (
        <View style={styles.prediction}>
          <PredictionChip state={outcome ?? "locked"} />
          <Text style={styles.predictionText}>Ton prono : {prediction}</Text>
          {missed && <Text style={styles.caption}>Score exact manqué : {missed}</Text>}
        </View>
      )}

      {match.distribution && <DistributionBar match={match} distribution={match.distribution} />}

      <Text style={styles.caption}>
        {formatCount(match.predictionCount)} pronostics · fermés depuis le début du match
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[3],
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[2],
  },
  round: { ...type.section, color: colors.craie },
  tournament: { ...type.caption, color: colors.muted, marginTop: -space[2] },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: space[3] },
  team: { ...type.heading, color: colors.craie, flex: 1 },
  teamLeft: { textAlign: "left" },
  teamRight: { textAlign: "right" },
  score: { fontFamily: fonts.data, fontSize: 36, lineHeight: 40, color: colors.craie },
  prediction: { gap: space[2] },
  predictionText: { ...type.body, color: colors.craie },
  caption: { ...type.caption, color: colors.muted },
});

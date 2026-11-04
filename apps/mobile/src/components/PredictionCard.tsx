import type { PredictionInput, PredictionMatch } from "@lislestart/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "../api";
import { lockLabel } from "../lib/lock";
import {
  draftFrom,
  formatScore,
  isLocked,
  predictionLabel,
  scoreOptions,
  submitButton,
  toPredictionInput,
  winsNeeded,
  type PredictionDraft,
} from "../lib/predictions";
import { colors, radius, space, touchTarget, type } from "../theme";
import { Choice } from "./Choice";
import { StatusChip } from "./StatusChip";

type Feedback = { kind: "saved" | "error"; message: string } | null;

/** Prochain match : choix du vainqueur, score exact facultatif, validation. */
export function PredictionCard({
  match,
  serverNow,
  onSave,
  signedIn,
  onSignIn,
}: {
  match: PredictionMatch;
  serverNow: Date;
  /** Envoie le pronostic au serveur ; lève une ApiError en cas de refus. */
  onSave: (prediction: PredictionInput) => Promise<void>;
  signedIn: boolean;
  /** Ouvre l'écran de connexion. */
  onSignIn: () => void;
}) {
  const [draft, setDraft] = useState<PredictionDraft>(() => draftFrom(match));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const locked = isLocked(match, serverNow);
  const button = submitButton(match, draft, { locked, saving, signedIn });
  const options = scoreOptions(match.bestOf);
  const startsAt = match.locksAt ? new Date(match.locksAt) : null;

  const choose = (next: Partial<PredictionDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setFeedback(null);
  };

  const submit = async () => {
    const input = toPredictionInput(match, draft);
    if (!input) return;
    setSaving(true);
    try {
      await onSave(input);
      const saved = predictionLabel({ ...match, myPrediction: input });
      setFeedback({ kind: "saved", message: `Prono enregistré : ${saved}.` });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof ApiError ? error.message : "Le prono n'a pas pu être enregistré.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.round}>Prochain match · {match.roundLabel}</Text>
        {startsAt && (
          <StatusChip
            tone="violet"
            icon={locked ? "lock" : "clock-outline"}
            label={lockLabel(serverNow, startsAt)}
          />
        )}
      </View>
      <Text style={styles.tournament}>
        {match.tournamentName} · BO{match.bestOf}
      </Text>

      <View accessibilityRole="radiogroup" accessibilityLabel="Vainqueur" style={styles.group}>
        <Text style={styles.label}>Qui gagne ?</Text>
        {match.slots.map((slot) =>
          slot.participantId ? (
            <Choice
              key={slot.participantId}
              label={slot.name ?? "À déterminer"}
              selected={draft.winnerId === slot.participantId}
              disabled={locked}
              onPress={() => choose({ winnerId: slot.participantId })}
            />
          ) : null,
        )}
      </View>

      {options.length > 0 && (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Score exact, facultatif"
          style={styles.group}
        >
          <Text style={styles.label}>
            Score exact <Text style={styles.optional}>(facultatif, bonus de points)</Text>
          </Text>
          <View style={styles.scores}>
            {options.map((score) => {
              const selected = draft.score?.[1] === score[1];
              return (
                <View key={score.join("-")} style={styles.score}>
                  <Choice
                    label={formatScore(score[0], score[1])}
                    data
                    selected={selected}
                    disabled={locked}
                    accessibilityHint={selected ? "Touche encore pour retirer le score" : undefined}
                    onPress={() => choose({ score: selected ? null : score })}
                  />
                </View>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Score du vainqueur en premier : il faut {winsNeeded(match.bestOf)} manches pour gagner.
          </Text>
        </View>
      )}

      {feedback && (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.feedback, feedback.kind === "error" ? styles.error : styles.saved]}
        >
          <MaterialCommunityIcons
            name={feedback.kind === "error" ? "close" : "check"}
            size={18}
            color={feedback.kind === "error" ? colors.corail : colors.lime}
            importantForAccessibility="no"
          />
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: button.disabled, busy: saving }}
        disabled={button.disabled}
        onPress={button.action === "signIn" ? onSignIn : submit}
        style={({ pressed }) => [
          styles.button,
          button.disabled && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.buttonText, button.disabled && styles.buttonTextDisabled]}>
          {button.label}
        </Text>
      </Pressable>
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
    gap: space[4],
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[2],
  },
  round: { ...type.section, color: colors.craie },
  tournament: { ...type.caption, color: colors.muted, marginTop: -space[3] },
  group: { gap: space[2] },
  label: { ...type.label, color: colors.craie },
  optional: { ...type.caption, color: colors.muted },
  scores: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  score: { flexGrow: 1, minWidth: 140 },
  hint: { ...type.caption, color: colors.muted },
  feedback: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[2],
    padding: space[3],
    borderRadius: radius.md,
  },
  saved: { backgroundColor: colors.limeSoft },
  error: { backgroundColor: colors.corailSoft },
  feedbackText: { ...type.body, color: colors.craie, flex: 1 },
  button: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[5],
  },
  buttonDisabled: { backgroundColor: colors.surfaceRaised },
  buttonPressed: { opacity: 0.85 },
  buttonText: { ...type.label, color: colors.nuit },
  buttonTextDisabled: { color: colors.muted },
});

import type { PickemOption, PickemQuestionView } from "@lislestart/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError } from "../api";
import { lockLabel } from "../lib/lock";
import { answerState, formatPoints, optionPercent, type AnswerState } from "../lib/pickem";
import { formatCount } from "../lib/predictions";
import { colors, radius, space, type } from "../theme";
import { Button } from "./Button";
import { Choice } from "./Choice";
import { ProgressBar } from "./ProgressBar";
import { StatusChip } from "./StatusChip";

type Feedback = { kind: "saved" | "error"; message: string } | null;

/** Chip d'état d'une question : icône et mot, selon la charte (« Résolue · +20 »). */
function stateChip(state: AnswerState, question: PickemQuestionView, serverNow: Date) {
  const closes = lockLabel(serverNow, new Date(question.closesAt));
  switch (state) {
    case "todo":
      return <StatusChip tone="neutral" icon="clock-outline" label={closes} />;
    case "answered":
      return <StatusChip tone="lime" icon="check" label={`Répondu · ${closes.toLowerCase()}`} />;
    case "locked":
      return <StatusChip tone="violet" icon="lock" label="Verrouillé" />;
    case "won":
      return <StatusChip tone="lime" icon="check" label={`Résolue · +${question.points}`} />;
    case "lost":
      return <StatusChip tone="corail" icon="close" label="Résolue · ratée" />;
    case "missed":
      return <StatusChip tone="neutral" icon="minus" label="Sans réponse" />;
    case "cancelled":
      return <StatusChip tone="corail" icon="close" label="Annulée : données absentes" />;
  }
}

/** Question Pick'em : choix tant qu'elle est ouverte, puis répartition et bonne réponse. */
export function PickemQuestionCard({
  question,
  serverNow,
  signedIn,
  onAnswer,
  onSignIn,
}: {
  question: PickemQuestionView;
  serverNow: Date;
  signedIn: boolean;
  /** Envoie la réponse ; lève une ApiError en cas de refus. */
  onAnswer: (optionId: string) => Promise<void>;
  onSignIn: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const state = answerState(question, serverNow);
  const open = state === "todo" || state === "answered";

  const choose = async (option: PickemOption) => {
    setSaving(true);
    setFeedback(null);
    try {
      await onAnswer(option.id);
      setFeedback({ kind: "saved", message: `Réponse enregistrée : ${option.label}.` });
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof ApiError ? error.message : "La réponse n'a pas pu être enregistrée.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.meta}>
          {question.tournamentName} · {formatPoints(question.points)}
        </Text>
        {stateChip(state, question, serverNow)}
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {question.title}
      </Text>

      {state === "cancelled" && question.cancelReason && (
        <Text style={styles.body}>{question.cancelReason}</Text>
      )}

      {open && signedIn && (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={question.title}
          style={styles.options}
        >
          {question.options.map((option) => (
            <Choice
              key={option.id}
              label={option.label}
              selected={question.myAnswer === option.id}
              disabled={saving}
              onPress={() => void choose(option)}
            />
          ))}
        </View>
      )}

      {open && !signedIn && (
        <Button label="Se connecter pour répondre" variant="secondary" onPress={onSignIn} />
      )}

      {!open && state !== "cancelled" && (
        <View style={styles.options}>
          {question.options.map((option) => (
            <OptionResult key={option.id} question={question} option={option} />
          ))}
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

      <Text style={styles.caption}>
        {formatCount(question.answerCount)} réponses
        {open ? " · tu peux changer d'avis jusqu'à la clôture" : ""}
      </Text>
    </View>
  );
}

/** Option d'une question fermée : part du public, ma réponse et la bonne réponse, en mots. */
function OptionResult({
  question,
  option,
}: {
  question: PickemQuestionView;
  option: PickemOption;
}) {
  const percent = optionPercent(question, option.id);
  const mine = question.myAnswer === option.id;
  const correct = question.correctOptionId === option.id;
  const marks = [correct && "bonne réponse", mine && "ta réponse"].filter(Boolean).join(", ");

  return (
    <View
      accessible
      accessibilityLabel={[option.label, percent !== null && `${percent} %`, marks]
        .filter(Boolean)
        .join(", ")}
      style={[styles.result, mine && styles.resultMine]}
    >
      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>{option.label}</Text>
        {percent !== null && <Text style={styles.percent}>{percent} %</Text>}
      </View>
      {percent !== null && <ProgressBar value={percent} max={100} color={colors.violet} />}
      {marks && (
        <View style={styles.marks}>
          {correct && (
            <MaterialCommunityIcons
              name="check"
              size={14}
              color={colors.lime}
              importantForAccessibility="no"
            />
          )}
          <Text style={styles.markText}>{marks.charAt(0).toUpperCase() + marks.slice(1)}</Text>
        </View>
      )}
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
  meta: { ...type.caption, color: colors.muted, flexShrink: 1 },
  title: { ...type.heading, color: colors.craie },
  body: { ...type.body, color: colors.craie },
  options: { gap: space[2] },
  result: {
    gap: space[1],
    padding: space[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceRaised,
  },
  resultMine: { borderColor: colors.violet, borderWidth: 2 },
  resultRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space[2],
  },
  resultLabel: { ...type.bodyStrong, color: colors.craie, flexShrink: 1 },
  percent: { ...type.data, color: colors.violet },
  marks: { flexDirection: "row", alignItems: "center", gap: space[1] },
  markText: { ...type.label, color: colors.craie },
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
  caption: { ...type.caption, color: colors.muted },
});

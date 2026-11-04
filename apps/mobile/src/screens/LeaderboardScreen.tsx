import type {
  Badge,
  FriendGroup,
  LeaderboardResponse,
  LeaderboardScope,
  TournamentSummary,
} from "@lislestart/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, api, usingMockData } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { ErrorBox } from "../components/ErrorBox";
import { LeaderboardRow } from "../components/LeaderboardRow";
import { Screen } from "../components/Screen";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { inviteMessage, isInTop, positionLabel } from "../lib/leaderboard";
import { formatPoints } from "../lib/pickem";
import { useRootNavigation } from "../navigation";
import { colors, fonts, radius, space, touchTarget, type } from "../theme";

type Board =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty"; message: string }
  | { kind: "ready"; board: LeaderboardResponse };

const SCOPES = [
  { value: "global", label: "Général" },
  { value: "tournament", label: "Tournoi" },
  { value: "group", label: "Groupe" },
] as const;

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "Une erreur inattendue est survenue.";

/** Onglet Classement : général, par tournoi ou par groupe, ma position, badges et invitations. */
export function LeaderboardScreen() {
  const { user } = useAuth();
  const navigation = useRootNavigation();
  const [scope, setScope] = useState<LeaderboardScope>("global");
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [board, setBoard] = useState<Board>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const userId = user?.id ?? null;

  // Tournois, groupes et badges : au démarrage et à chaque changement de compte
  useEffect(() => {
    api.liveTournaments().then(
      ({ tournaments: list }) => {
        setTournaments(list);
        setTournamentId((current) => current ?? list[0]?.id ?? null);
      },
      () => setTournaments([]),
    );
    if (!userId) {
      setGroups([]);
      setBadges([]);
      setGroupId(null);
      return;
    }
    api.myGroups().then(
      (list) => {
        setGroups(list);
        setGroupId(list[0]?.id ?? null);
      },
      () => setGroups([]),
    );
    api.myBadges().then(setBadges, () => setBadges([]));
  }, [userId]);

  const id = scope === "tournament" ? tournamentId : scope === "group" ? groupId : null;

  const load = useCallback(async () => {
    if (scope === "group" && !userId) {
      setBoard({ kind: "empty", message: "Connecte-toi pour voir le classement de tes groupes." });
      return;
    }
    if (scope !== "global" && !id) {
      setBoard({
        kind: "empty",
        message:
          scope === "group"
            ? "Tu n'es dans aucun groupe pour l'instant. Demande un code d'invitation à tes amis."
            : "Aucun tournoi en cours pour l'instant.",
      });
      return;
    }
    try {
      setBoard({ kind: "ready", board: await api.leaderboard(scope, id ?? undefined) });
    } catch (error) {
      setBoard({ kind: "error", message: errorMessage(error) });
    }
  }, [scope, id, userId]);

  // À l'ouverture, à chaque changement de vue, et au retour sur l'onglet (après des pronos)
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const group = groups.find((g) => g.id === groupId) ?? null;
  const invite = async () => {
    if (!group) return;
    try {
      await Share.share({ message: inviteMessage(group) });
    } catch {
      // Partage annulé ou indisponible : rien à signaler
    }
  };

  return (
    <Screen title="Classement">
      {usingMockData && <Text style={styles.caption}>Données de démonstration</Text>}
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
        <SegmentedTabs options={SCOPES} value={scope} onChange={setScope} />

        {scope === "tournament" && tournaments.length > 0 && (
          <FilterChips
            label="Tournoi"
            options={tournaments.map((t) => ({ id: t.id, label: t.name }))}
            value={tournamentId}
            onChange={setTournamentId}
          />
        )}
        {scope === "group" && groups.length > 0 && (
          <FilterChips
            label="Groupe"
            options={groups.map((g) => ({ id: g.id, label: `${g.name} (${g.memberCount})` }))}
            value={groupId}
            onChange={setGroupId}
          />
        )}

        {board.kind === "loading" && (
          <ActivityIndicator
            color={colors.lime}
            size="large"
            style={styles.center}
            accessibilityLabel="Chargement du classement"
          />
        )}
        {board.kind === "error" && (
          <ErrorBox
            message={board.message}
            onRetry={() => {
              setBoard({ kind: "loading" });
              void load();
            }}
          />
        )}
        {board.kind === "empty" && (
          <Text style={styles.empty} accessibilityLiveRegion="polite">
            {board.message}
          </Text>
        )}

        {board.kind === "ready" && (
          <>
            <MyPosition
              board={board.board}
              signedIn={Boolean(user)}
              onSignIn={() => navigation.navigate("Compte")}
            />

            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.cardTitle}>
                Top pronostiqueurs · {board.board.title}
              </Text>
              {board.board.entries.map((entry) => (
                <LeaderboardRow key={entry.userId} entry={entry} isMe={entry.userId === userId} />
              ))}
              {board.board.me && !isInTop(board.board) && (
                <>
                  <Text style={styles.gap} importantForAccessibility="no">
                    …
                  </Text>
                  <LeaderboardRow entry={board.board.me} isMe />
                </>
              )}
            </View>
          </>
        )}

        {scope === "group" && group && (
          <Button label="Inviter des amis" variant="secondary" onPress={() => void invite()} />
        )}

        {user && (
          <>
            <Text accessibilityRole="header" style={styles.section}>
              Mes badges
            </Text>
            {badges.length === 0 ? (
              <Text style={styles.empty}>
                Pas encore de badge : ton premier prono t'en rapporte un.
              </Text>
            ) : (
              <View style={styles.badges}>
                {badges.map((badge) => (
                  <View
                    key={badge.id}
                    accessible
                    accessibilityLabel={`Badge ${badge.name} : ${badge.description}`}
                    style={styles.badge}
                  >
                    <MaterialCommunityIcons
                      name="medal-outline"
                      size={20}
                      color={colors.lime}
                      importantForAccessibility="no"
                    />
                    <View style={styles.badgeText}>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <Text style={styles.badgeDescription}>{badge.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

/** Ma position : rang, points et nombre de participants ; sans compte, invite à se connecter. */
function MyPosition({
  board,
  signedIn,
  onSignIn,
}: {
  board: LeaderboardResponse;
  signedIn: boolean;
  onSignIn: () => void;
}) {
  if (!signedIn || !board.me) {
    return (
      <View style={styles.card}>
        <Text style={styles.body}>Connecte-toi pour voir ta position et tes badges.</Text>
        <Button label="Se connecter" onPress={onSignIn} />
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={`Ta position : ${positionLabel(board)}, ${formatPoints(board.me.points)}`}
      style={[styles.card, styles.position]}
    >
      <Text style={styles.positionRank}>#{board.me.rank}</Text>
      <View style={styles.positionText}>
        <Text style={styles.cardTitle}>Ta position</Text>
        <Text style={styles.body}>{positionLabel(board)}</Text>
      </View>
      <Text style={styles.positionPoints}>{formatPoints(board.me.points)}</Text>
    </View>
  );
}

/** Choix d'un tournoi ou d'un groupe : boutons radio avec coche et mot, pas seulement la couleur. */
function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.chips}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            {selected && (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={colors.lime}
                importantForAccessibility="no"
              />
            )}
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { ...type.caption, color: colors.muted, paddingHorizontal: space[4] },
  content: { padding: space[4], paddingBottom: space[6], gap: space[4] },
  center: { marginTop: space[6] },
  section: { ...type.section, color: colors.craie },
  empty: { ...type.body, color: colors.muted },
  body: { ...type.body, color: colors.craie },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
  },
  cardTitle: { ...type.section, color: colors.craie },
  gap: { ...type.body, color: colors.muted, textAlign: "center" },
  position: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space[4] },
  positionRank: { fontFamily: fonts.data, fontSize: 36, lineHeight: 40, color: colors.lime },
  positionText: { flex: 1, minWidth: 120, gap: space[1] },
  positionPoints: { ...type.data, color: colors.craie },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  chip: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: space[1],
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surfaceRaised,
  },
  chipSelected: { borderColor: colors.lime, backgroundColor: colors.limeSoft },
  chipLabel: { ...type.label, color: colors.muted },
  chipLabelSelected: { color: colors.craie },
  badges: { gap: space[2] },
  badge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[3],
    padding: space[3],
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badgeText: { flex: 1, gap: space[1] },
  badgeName: { ...type.bodyStrong, color: colors.craie },
  badgeDescription: { ...type.caption, color: colors.muted },
});

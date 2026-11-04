import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, DEMO_ACCOUNT, usingMockData, type Registration } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { Choice } from "../components/Choice";
import { StatusChip } from "../components/StatusChip";
import { TextField } from "../components/TextField";
import { errorsByField, roleLabel } from "../lib/account";
import { useRootNavigation } from "../navigation";
import { colors, radius, space, touchTarget, type } from "../theme";

type Mode = "login" | "register";

/** Compte : connexion, inscription (joueur ou spectateur), ou profil et déconnexion. */
export function AccountScreen() {
  const { user, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);

  if (user === undefined) {
    return (
      <View style={styles.page}>
        <ActivityIndicator
          color={colors.lime}
          size="large"
          style={styles.center}
          accessibilityLabel="Vérification de la session"
        />
      </View>
    );
  }

  if (user) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.name}>
            {user.displayName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          <StatusChip
            tone="lime"
            icon="account-check"
            label={`Connecté · ${roleLabel(user.role)}`}
          />
          <Text style={styles.body}>
            Tes pronos, tes points et tes badges sont liés à ce compte.
          </Text>
        </View>
        <Button
          label={leaving ? "Déconnexion…" : "Se déconnecter"}
          variant="secondary"
          busy={leaving}
          onPress={async () => {
            setLeaving(true);
            try {
              await logout();
            } finally {
              setLeaving(false);
            }
          }}
        />
      </ScrollView>
    );
  }

  return <SignInForm />;
}

function SignInForm() {
  const { login, register } = useAuth();
  const navigation = useRootNavigation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Registration["role"]>("spectator");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fields = errorsByField(error?.fieldErrors ?? []);
  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      if (mode === "login") await login({ email, password });
      else await register({ email, password, displayName, role });
      if (navigation.canGoBack()) navigation.goBack();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught : new ApiError("Une erreur inattendue est survenue."),
      );
    } finally {
      setSending(false);
    }
  };

  // Les erreurs par champ s'affichent sous leur champ ; le message général seulement sinon
  const generalError = error && error.fieldErrors.length === 0 ? error.message : null;

  return (
    <KeyboardAvoidingView behavior="height" style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View accessibilityRole="tablist" style={styles.tabs}>
          {(["login", "register"] as const).map((tab) => (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === tab }}
              onPress={() => switchMode(tab)}
              style={[styles.tab, mode === tab && styles.tabSelected]}
            >
              <Text style={[styles.tabLabel, mode === tab && styles.tabLabelSelected]}>
                {tab === "login" ? "Se connecter" : "Créer un compte"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.body}>
          {mode === "login"
            ? "Connecte-toi pour enregistrer tes pronos et suivre tes points."
            : "Un compte suffit pour pronostiquer, répondre aux Pick'em et rejoindre des groupes."}
        </Text>

        {mode === "register" && (
          <TextField
            label="Pseudo"
            value={displayName}
            onChangeText={setDisplayName}
            error={fields.displayName}
            hint="Entre 2 et 32 caractères, visible dans les classements."
            autoComplete="username"
          />
        )}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={fields.email}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          error={fields.password}
          hint={
            mode === "register"
              ? "10 caractères minimum. Une phrase de passe marche bien."
              : undefined
          }
          secureTextEntry
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onSubmitEditing={mode === "login" ? submit : undefined}
        />

        {mode === "register" && (
          <View accessibilityRole="radiogroup" accessibilityLabel="Profil" style={styles.group}>
            <Text style={styles.label}>Profil</Text>
            <Choice
              label="Spectateur : je pronostique et je suis les tournois"
              selected={role === "spectator"}
              disabled={false}
              onPress={() => setRole("spectator")}
            />
            <Choice
              label="Joueur : je m'inscris aussi aux tournois"
              selected={role === "player"}
              disabled={false}
              onPress={() => setRole("player")}
            />
            {fields.role && <Text style={styles.fieldError}>{fields.role}</Text>}
          </View>
        )}

        {generalError && (
          <View style={styles.error} accessibilityLiveRegion="polite">
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={colors.corail}
              importantForAccessibility="no"
            />
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        )}
        {error && error.fieldErrors.length > 0 && (
          // Annonce le résumé ; le détail est lu sur chaque champ
          <Text accessibilityLiveRegion="polite" style={styles.summary}>
            {error.message} Corrige les champs signalés.
          </Text>
        )}

        <Button
          label={sending ? "Envoi…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          busy={sending}
          onPress={submit}
        />

        {usingMockData && mode === "login" && (
          <View style={styles.demo}>
            <Text style={styles.body}>
              Données de démonstration : un compte fictif est prêt ({DEMO_ACCOUNT.email}).
            </Text>
            <Button
              label="Remplir avec le compte de démo"
              variant="secondary"
              onPress={() => {
                setEmail(DEMO_ACCOUNT.email);
                setPassword(DEMO_ACCOUNT.password);
              }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.nuit },
  center: { marginTop: space[7] },
  content: { padding: space[4], paddingBottom: space[6], gap: space[4] },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
  },
  name: { ...type.heading, color: colors.craie },
  email: { ...type.body, color: colors.muted },
  body: { ...type.body, color: colors.muted },
  label: { ...type.label, color: colors.craie },
  group: { gap: space[2] },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[1],
    gap: space[1],
  },
  tab: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  // Onglet choisi : fond, bordure et graisse, pas seulement la couleur
  tabSelected: { backgroundColor: colors.surfaceRaised, borderColor: colors.lime },
  tabLabel: { ...type.label, color: colors.muted },
  tabLabelSelected: { color: colors.craie, textDecorationLine: "underline" },
  fieldError: { ...type.caption, color: colors.craie },
  error: {
    flexDirection: "row",
    gap: space[2],
    padding: space[3],
    borderRadius: radius.md,
    backgroundColor: colors.corailSoft,
  },
  errorText: { ...type.body, color: colors.craie, flex: 1 },
  summary: { ...type.caption, color: colors.muted },
  demo: { gap: space[2], paddingTop: space[2] },
});

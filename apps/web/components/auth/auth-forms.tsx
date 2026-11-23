"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Controller,
  useForm,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/choice";
import { ErrorSummary } from "@/components/ui/error-summary";
import { fieldId } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import type { AuthFormResult } from "@/lib/auth/actions";
import { cx } from "@/lib/cx";
import {
  AUTH_LIMITS,
  loginSchema,
  registerSchema,
  type LoginValues,
  type RegisterValues,
} from "@/lib/auth/schema";
import { AuthTextField, PasswordField } from "./text-fields";

type Action<T> = (values: T, next: string | null) => Promise<AuthFormResult | undefined>;

/**
 * Envoi commun : erreurs de champ du serveur (email déjà pris) sous le champ concerné et dans le
 * récapitulatif ; erreurs générales (identifiants faux, trop de tentatives) dans une alerte.
 * En cas de succès, l'action serveur redirige.
 */
function useAuthSubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  action: Action<T>,
  next: string | null,
  alertTitle: string,
) {
  const [summaryKey, setSummaryKey] = useState(0);
  const [alert, setAlert] = useState<{ message: string; key: number } | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  // Marqueur d'hydratation : avant, le formulaire n'est qu'un POST natif sans effet
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (alert) alertRef.current?.focus();
  }, [alert]);

  const onSubmit = form.handleSubmit(
    async (values) => {
      setAlert(null);
      const result = await action(values, next);
      if (!result || result.ok) return;
      if (result.field) {
        form.setError(result.field as Path<T>, { message: result.message });
        setSummaryKey((key) => key + 1);
      } else {
        setAlert({ message: result.message, key: Date.now() });
      }
    },
    () => {
      setAlert(null);
      setSummaryKey((key) => key + 1);
    },
  );

  const alertBox = alert && (
    <div
      ref={alertRef}
      key={alert.key}
      role="alert"
      tabIndex={-1}
      className="flex items-start gap-3 rounded-control border border-alert bg-alert-soft px-4 py-3.5 text-alert-text"
    >
      <Icon name="alert" size={20} className="mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <p className="type-body-m-strong">{alertTitle}</p>
        <p className="type-body-s">{alert.message}</p>
      </div>
    </div>
  );

  return { onSubmit, summaryKey, alertBox, hydrated };
}

/** Bascule Se connecter / Créer un compte (contrôle segmenté de la maquette), destination gardée. */
function AuthSwitch({ current, next }: { current: "login" | "register"; next: string | null }) {
  const tab = (active: boolean) =>
    cx(
      "flex h-11 flex-1 items-center justify-center rounded-nav border px-4 type-body-m-strong",
      active
        ? "border-line-strong bg-raised text-fg shadow-md"
        : "border-transparent text-fg-muted hover:text-fg",
    );
  return (
    <nav aria-label="Compte">
      <ul className="flex gap-0.5 rounded-control bg-sidebar p-0.75">
        <li className="flex flex-1">
          <Link
            href={withNext("/connexion", next)}
            aria-current={current === "login" ? "page" : undefined}
            className={tab(current === "login")}
          >
            Se connecter
          </Link>
        </li>
        <li className="flex flex-1">
          <Link
            href={withNext("/inscription", next)}
            aria-current={current === "register" ? "page" : undefined}
            className={tab(current === "register")}
          >
            Créer un compte
          </Link>
        </li>
      </ul>
    </nav>
  );
}
const RETRY = "Corrige les champs suivants puis réessaie :";

function withNext(path: string, next: string | null) {
  return next ? `${path}?suite=${encodeURIComponent(next)}` : path;
}

export function LoginForm({ action, next }: { action: Action<LoginValues>; next: string | null }) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    shouldFocusError: false,
  });
  const { onSubmit, summaryKey, alertBox, hydrated } = useAuthSubmit(
    form,
    action,
    next,
    "Connexion impossible",
  );
  const { errors, isSubmitting } = form.formState;

  return (
    <>
      <AuthSwitch current="login" next={next} />
      <form
        // POST : si on envoie avant le chargement de JavaScript, le mot de passe ne part jamais dans l'URL
        method="post"
        noValidate
        onSubmit={onSubmit}
        aria-busy={isSubmitting}
        data-hydrated={hydrated || undefined}
        className="flex flex-col gap-5"
      >
        <ErrorSummary errors={errors} focusKey={summaryKey} instruction={RETRY} />
        {alertBox}
        <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-4.5">
          <AuthTextField
            {...form.register("email")}
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            error={errors.email?.message}
          />
          <PasswordField
            {...form.register("password")}
            label="Mot de passe"
            autoComplete="current-password"
            error={errors.password?.message}
          />
        </fieldset>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          loadingLabel="Connexion…"
          className="w-full"
        >
          Se connecter
        </Button>
      </form>
    </>
  );
}

const ROLE_OPTIONS = [
  { value: "spectator" as const, label: "Spectateur : je pronostique et je suis les tournois" },
  { value: "player" as const, label: "Joueur : je m'inscris aussi aux tournois" },
];

export function RegisterForm({
  action,
  next,
}: {
  action: Action<RegisterValues>;
  next: string | null;
}) {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", role: "spectator" },
    shouldFocusError: false,
  });
  const { onSubmit, summaryKey, alertBox, hydrated } = useAuthSubmit(
    form,
    action,
    next,
    "Inscription impossible",
  );
  const { errors, isSubmitting } = form.formState;

  return (
    <>
      <AuthSwitch current="register" next={next} />
      <form
        // POST : si on envoie avant le chargement de JavaScript, le mot de passe ne part jamais dans l'URL
        method="post"
        noValidate
        onSubmit={onSubmit}
        aria-busy={isSubmitting}
        data-hydrated={hydrated || undefined}
        className="flex flex-col gap-5"
      >
        <ErrorSummary errors={errors} focusKey={summaryKey} instruction={RETRY} />
        {alertBox}
        <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-4.5">
          <AuthTextField
            {...form.register("displayName")}
            label="Pseudo"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            hint={`Visible dans les classements, ${AUTH_LIMITS.displayNameMin} à ${AUTH_LIMITS.displayNameMax} caractères.`}
            error={errors.displayName?.message}
          />
          <AuthTextField
            {...form.register("email")}
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            hint="Sert à te connecter ; il n'est jamais affiché."
            error={errors.email?.message}
          />
          <PasswordField
            {...form.register("password")}
            label="Mot de passe"
            autoComplete="new-password"
            hint={`Au moins ${AUTH_LIMITS.passwordMin} caractères. Une phrase de passe marche bien.`}
            error={errors.password?.message}
          />
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <RadioGroup
                id={fieldId("role")}
                label="Profil"
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                disabled={field.disabled}
                options={ROLE_OPTIONS}
              />
            )}
          />
        </fieldset>
        <p className="type-body-s text-fg-muted">
          Aucune mise ni achat : on joue pour des points, des badges et des titres.
        </p>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          loadingLabel="Création…"
          className="w-full"
        >
          Créer mon compte
        </Button>
      </form>
    </>
  );
}

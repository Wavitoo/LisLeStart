import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { AuthPage } from "@/components/auth/auth-page";
import { getCurrentUser } from "@/lib/api/server";
import { login } from "@/lib/auth/actions";
import { safeDestination } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Se connecter · Seedline" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ suite?: string | string[] }> };

export default async function LoginPage({ searchParams }: Props) {
  const { suite } = await searchParams;
  const next = typeof suite === "string" ? suite : null;

  // Déjà connecté : inutile de rester ici
  const user = await getCurrentUser();
  if (user) redirect(safeDestination(next, user.role));

  return (
    <AuthPage title="Bon retour" intro="Connecte-toi pour pronostiquer et suivre tes groupes.">
      <LoginForm action={login} next={next} />
    </AuthPage>
  );
}

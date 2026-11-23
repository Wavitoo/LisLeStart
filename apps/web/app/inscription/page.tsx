import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/auth-forms";
import { AuthPage } from "@/components/auth/auth-page";
import { getCurrentUser } from "@/lib/api/server";
import { register } from "@/lib/auth/actions";
import { safeDestination } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Créer un compte · Seedline" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ suite?: string | string[] }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { suite } = await searchParams;
  const next = typeof suite === "string" ? suite : null;

  const user = await getCurrentUser();
  if (user) redirect(safeDestination(next, user.role));

  return (
    <AuthPage
      title="Créer un compte"
      intro="Pronostique les matchs, réponds aux Pick'em et compare-toi à tes amis."
    >
      <RegisterForm action={register} next={next} />
    </AuthPage>
  );
}

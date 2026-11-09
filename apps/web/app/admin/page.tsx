import { redirect } from "next/navigation";

// Vue d'ensemble pas encore livrée : on ouvre la création de tournoi.
export default function AdminHomePage() {
  redirect("/admin/tournois/nouveau");
}

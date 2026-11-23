import { redirect } from "next/navigation";

// Liste des tournois pas encore livrée : on ouvre la création de tournoi.
export default function AdminTournamentsPage() {
  redirect("/admin/tournois/nouveau");
}

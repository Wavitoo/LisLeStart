import Link from "next/link";
import { formatCountdown } from "@/lib/countdown";

export default function HomePage() {
  return (
    <main id="contenu" className="page flex flex-col items-start gap-4">
      <h1 className="type-display-l">LisLeStart</h1>
      <p>Organise tes tournois, importe ceux de la communauté et pronostique en direct.</p>
      <p className="muted">
        Exemple : pronostics fermés dans {formatCountdown(2 * 3600 + 14 * 60)}.
      </p>
      <Link
        href="/admin/tournois/nouveau"
        className="inline-flex h-12 items-center rounded-control bg-lime px-5.5 type-label text-on-accent"
      >
        Créer un tournoi
      </Link>
    </main>
  );
}

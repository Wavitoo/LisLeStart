import { formatCountdown } from "@/lib/countdown";

export default function HomePage() {
  return (
    <main id="contenu" className="page">
      <h1>LisLeStart</h1>
      <p>Organise tes tournois, importe ceux de la communauté et pronostique en direct.</p>
      <p className="muted">
        Exemple : pronostics fermés dans {formatCountdown(2 * 3600 + 14 * 60)}.
      </p>
    </main>
  );
}

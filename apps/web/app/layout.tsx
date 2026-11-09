import type { Metadata } from "next";
import { Barlow_Condensed, JetBrains_Mono, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Polices auto-hébergées par Next au build : aucune requête vers Google depuis le navigateur.
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-barlow-condensed",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-manrope",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "LisLeStart",
  description: "Tournois et pronostics en direct",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSpace } from "./AccountSpace";
import { Cuenta } from "@/components/app/Cuenta";
import { Puerta } from "@/components/app/Puerta";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Tus viajes, tu perfil, tu carro y tu verificación.",
  alternates: { canonical: canonical("/cuenta") },
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return (
    <main id="contenido" className="bg-ink-50 pb-16">
      {/* TROIS ÉCRANS DE L'APP SUR CETTE ROUTE : Mis viajes, Mensajes et
          Perfil, distingués par `?panel=`. La barre d'onglets en pointe
          deux, l'avatar de l'accueil la troisième. `useSearchParams`
          impose la frontière Suspense — c'est la seule raison de
          l'enveloppe. */}
      <div className="solo-app">
        <Suspense fallback={null}>
          {/* SANS COMPTE, CET ÉCRAN EST LA PORTE. Demande du
              propriétaire : toucher Perfil, Mis viajes ou Mensajes sans
              être connecté renvoie à la connexion — seule la recherche
              marche en invité. */}
          <Puerta motivo="Tus viajes viven en tu cuenta">
            <Cuenta />
          </Puerta>
        </Suspense>
      </div>
      <div className="solo-web">
        <AccountSpace />
      </div>
    </main>
  );
}

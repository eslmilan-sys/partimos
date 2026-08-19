import type { Metadata } from "next";
import { Suspense } from "react";
import { PublishFlowKeyed } from "./PublishFlow";
import { canonical } from "@/lib/site";
import { Puerta } from "@/components/app/Puerta";

export const metadata: Metadata = {
  title: "Publicar un viaje",
  description:
    "Una pregunta por pantalla: la ruta, dónde sales, dónde llegas, cuándo y cuánto. Menos de un minuto.",
  alternates: { canonical: canonical("/publicar/nuevo") },
  robots: { index: false, follow: true },
};

export default function NuevoViajePage() {
  return (
    <main id="contenido" className="bg-ink-50 pb-16">
      {/* PUBLIER EXIGE UN COMPTE — quelqu'un va monter dans ta voiture.
          Dans l'app, la porte s'affiche ; sur le site, le flux garde son
          propre garde-fou (« confirmemos quién eres »), qui explique les
          trois pièces à fournir. */}
      <div className="solo-app">
        <Puerta motivo="Publicar un viaje necesita tu cuenta">
          <Suspense fallback={<div className="min-h-[70vh]" />}>
            <PublishFlowKeyed />
          </Suspense>
        </Puerta>
      </div>
      <div className="solo-web">
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <PublishFlowKeyed />
        </Suspense>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSpace } from "../AccountSpace";
import { Cuenta } from "@/components/app/Cuenta";
import { Puerta } from "@/components/app/Puerta";

/**
 * LES ÉCRANS DE COMPTE DE L'APP, chacun à son adresse.
 *
 * Ils vivaient tous sur `/cuenta?panel=…`, et ça se voyait : la barre
 * d'onglets juge où l'on est sur le CHEMIN, donc « Mis viajes »
 * s'allumait aussi sur Mensajes et sur Perfil. Un paramètre de requête
 * n'est pas une adresse — c'est une nuance sur une adresse.
 *
 * `dynamicParams = false` ferme la porte : `/cuenta/nimporte` renvoie un
 * 404 franc au lieu de rendre un écran vide.
 */
export const dynamicParams = false;

const PANELES = ["mensajes", "perfil", "verificacion", "legal"] as const;
type Panel = (typeof PANELES)[number];

export function generateStaticParams() {
  return PANELES.map((panel) => ({ panel }));
}

const TITULOS: Record<Panel, string> = {
  mensajes: "Mensajes",
  perfil: "Mi perfil",
  verificacion: "Verificación",
  legal: "Legal",
};

type Params = { params: Promise<{ panel: Panel }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { panel } = await params;
  return { title: TITULOS[panel], robots: { index: false, follow: false } };
}

export default async function PanelPage({ params }: Params) {
  const { panel } = await params;
  return (
    <main id="contenido" className="bg-ink-50 pb-16">
      <div className="solo-app">
        <Suspense fallback={null}>
          <Puerta motivo="Tus viajes viven en tu cuenta">
            <Cuenta panel={panel} />
          </Puerta>
        </Suspense>
      </div>
      {/* LE SITE n'a qu'un espace compte, avec ses propres onglets : ces
          adresses lui montrent le même écran plutôt qu'un 404. Elles ne
          sont pas indexées et aucune navigation du site n'y mène. */}
      <div className="solo-web">
        <AccountSpace />
      </div>
    </main>
  );
}

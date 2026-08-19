import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "./SearchResults";
import { Buscar } from "@/components/app/Buscar";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Buscar un viaje",
  description:
    "Quién sale hoy hacia el interior, a qué hora y cuánto se aporta. Le pagas directo al conductor: Yappy, tarjeta o efectivo.",
  alternates: { canonical: canonical("/buscar") },
  // Une page de résultats n'a rien d'indexable : son contenu dépend de
  // paramètres. Les pages corridor sont là pour le référencement.
  robots: { index: false, follow: true },
};

function ResultsSkeleton() {
  return (
    <div aria-hidden>
      <div className="border-b border-ink-200 bg-white py-3">
        <div className="mx-auto w-full max-w-[1120px] px-5">
          <div className="h-[62px] rounded-[14px] border-[1.5px] border-ink-200" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1120px] px-5 pt-6">
        <div className="mb-4 h-[46px] rounded-[14px] bg-white" />
        <div className="mb-4 h-7 w-56 rounded-lg bg-white" />
        <div className="mb-5 h-[38px] w-64 rounded-full bg-white" />
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[152px] rounded-[20px] bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <main id="contenido" className="bg-ink-50 pb-16">
      {/* Le squelette reprend la HAUTEUR de ce qui va s'afficher : barre de
          recherche collante, en-tête, puis des cartes. Un gabarit vide de
          70 vh laissait le contenu « sauter » à l'arrivée — c'est exactement
          ce que mesure le CLS. */}
      {/* Deux présentations, UNE source de données (`searchTrips`). Le
          site garde sa page large ; l'app a la sienne, à la maquette du
          propriétaire. Dupliquer la recherche aurait dupliqué
          l'inventaire par tronçon, qui est la partie la plus délicate du
          produit.
          `useSearchParams` impose la frontière Suspense — c'est la seule
          raison de ces enveloppes. */}
      <div className="solo-web">
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults />
        </Suspense>
      </div>
      <div className="solo-app">
        <Suspense fallback={<ResultsSkeleton />}>
          <Buscar />
        </Suspense>
      </div>
    </main>
  );
}

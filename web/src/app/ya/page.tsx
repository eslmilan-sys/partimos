import type { Metadata } from "next";
import { YaExpress } from "./YaExpress";
import { Ya } from "@/components/app/Ya";

/**
 * /ya — LA VOIE EXPRESS. La page qui réduit le temps-jusqu'au-viaje à
 * deux taps : elle connaît ta rutina, elle a déjà cherché, elle te tend
 * TON puesto. Personnelle par construction — hors index.
 */
export const metadata: Metadata = {
  title: "Tu próximo viaje, en dos taps",
  robots: { index: false, follow: true },
};

export default function YaPage() {
  return (
    <main id="contenido">
      {/* L'ONGLET « BUSCAR » DE L'APP mène ici. Même moteur que le site
          (`searchTrips`) et MÊME champ de recherche (`CityCombobox`,
          avec son géocodage) — une autre composition, celle d'un écran
          qu'on tient à la main. */}
      <div className="solo-app">
        <Ya />
      </div>
      <div className="solo-web">
        <YaExpress />
      </div>
    </main>
  );
}

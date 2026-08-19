"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Barre d'action fixe en mobile. Elle n'apparaît qu'une fois le hero passé :
 * tant que le formulaire de recherche est à l'écran, une barre qui pointe
 * vers ce même formulaire ne ferait que masquer du contenu.
 *
 * `IntersectionObserver` plutôt qu'un écouteur de `scroll` : pas de calcul
 * de position à chaque image, donc aucun coût sur le fil principal.
 */
export function StickyCta({ watch = "#buscar" }: { watch?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(watch);
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watch]);

  useEffect(() => {
    // Réserve la place de la barre pour qu'elle ne recouvre pas le pied de
    // page. Depuis qu'elle flotte, il faut compter en plus son décollement du
    // bas — sinon la dernière ligne du pied passe sous la vitre.
    document.body.style.paddingBottom = visible
      ? "calc(5.5rem + env(safe-area-inset-bottom))"
      : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  return (
    <div
      /* Elle répond à la barre du haut : même verre, même détachement du
         bord, mêmes coins. Deux objets flottants qui se ressemblent se
         lisent comme UN système ; deux traitements différents, comme deux
         morceaux collés. Le `translate-y` de repli tient compte de la marge
         basse, sinon un liseré du plateau resterait visible en bas. */
      className={`glass liquid fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex gap-2.5 rounded-[20px] p-2.5 transition-transform duration-300 min-[900px]:hidden ${
        visible ? "translate-y-0" : "translate-y-[calc(100%+1.5rem)]"
      }`}
      // `inert` retire la barre repliée de la navigation clavier ET de l'arbre
      // d'accessibilité en une seule déclaration. `aria-hidden` seul ne suffit
      // pas : les liens resteraient focalisables, donc atteignables au clavier
      // tout en étant invisibles et inaudibles.
      inert={!visible}
    >
      <ButtonLink
        href="/publicar/nuevo"
        variant="secondary"
        size="sm"
        className="basis-[42%]"
      >
        Publicar viaje
      </ButtonLink>
      <ButtonLink href="/#buscar" size="sm" className="flex-1">
        Buscar viaje
      </ButtonLink>
    </div>
  );
}

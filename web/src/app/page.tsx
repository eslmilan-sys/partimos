import { Hero } from "@/components/home/Hero";
import { Inicio } from "@/components/app/Inicio";
import { AppShell } from "@/components/app/AppShell";
import { RutasFrecuentes } from "@/components/home/RutasFrecuentes";
import { Pasos } from "@/components/home/Pasos";
import { Pago } from "@/components/home/Pago";
import { Conductores } from "@/components/home/Conductores";
import { Confianza } from "@/components/home/Confianza";
import { DriverCta } from "@/components/home/DriverCta";
import { Faq, FaqJsonLd } from "@/components/home/Faq";
import { Historias } from "@/components/home/Historias";
import { StickyCta } from "@/components/StickyCta";
import { GENERAL_FAQ } from "@/lib/content";
import { canonical } from "@/lib/site";

export const metadata = {
  alternates: { canonical: canonical("/") },
};

export default function Home() {
  return (
    <>
      <main id="contenido">
        {/* L'EN-TÊTE ET LE COCKPIT DE L'APP.
            Quelqu'un qui a une reserva ouvre l'app pour vérifier qu'elle
            tient — pas pour qu'on lui redemande où il va. Les deux
            n'existent qu'en mode app : sur le site, l'accueil parle à un
            inconnu, et un salut nommé n'y aurait aucun sens.
            `--paso` donne à chaque bloc son rang dans l'ouverture. */}
        {/* LA PORTE. Pas de compte → l'écran d'entrée par-dessus tout ;
            compte + première ouverture → l'écran de bienvenue. Ne rend
            rien sur le site, ni avant hydratation. */}
        {/* L'APP. Sa propre porte, son propre accueil. Elle ne partage
            plus la carte de recherche du site : les deux surfaces ne
            posent pas la même question — le site convainc un inconnu,
            l'app sert quelqu'un qui a déjà décidé. */}
        <div className="solo-app">
          <AppShell />
          <Inicio />
        </div>

        {/* LE SITE. Entier, dans le HTML servi, pour Google. */}
        <div className="solo-web">
          <Hero />
        </div>

        {/* TOUT L'ARGUMENTAIRE EST `solo-web`.
            Il reste dans le HTML — Google le reçoit en entier, et c'est le
            canal principal du produit. Mais qui a installé l'app a déjà été
            convaincu : lui redérouler neuf sections de vente à chaque
            ouverture, c'est mettre un prospectus entre lui et le champ de
            recherche. Dans l'app, l'accueil s'arrête au Hero, réduit à sa
            carte de recherche. */}
        <div className="solo-web">
          <Pasos />

          {/* UNE seule section de nuit sur la page. Le client a raison : deux
              écrans de bleu sombre à la suite, c'est un tunnel. Historias garde
              la nuit — ses photos et ses vitres en ont besoin — et Pago revient
              à la lumière, où ses cartes blanches (Yappy, efectivo) sont chez
              elles. */}
          <Historias />
          <Pago />
          <Conductores />
          <Confianza />
          <RutasFrecuentes />
          <DriverCta />
          {/* QUATRE QUESTIONS, PAS ONZE. L'accueil doit convaincre, pas tout
              expliquer : onze réponses ouvertes, c'est un mur de texte au
              moment où la personne veut chercher un viaje. Les autres vivent
              dans /ayuda, où on va quand on a vraiment une question — et le
              balisage FAQ pour Google garde la liste complète. */}
          <Faq items={GENERAL_FAQ.slice(0, 4)} />
        </div>
      </main>
      {/* La barre d'action basse pointe vers le champ de recherche. Dans
          l'app, la barre d'onglets occupe déjà ce bord — deux barres
          empilées au même endroit, dont une redondante. */}
      <div className="solo-web">
        <StickyCta />
      </div>
      <FaqJsonLd items={GENERAL_FAQ} />
    </>
  );
}

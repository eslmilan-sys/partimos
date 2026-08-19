"use client";

import { useSession } from "@/lib/session";
import { useHydrated } from "@/lib/lastsearch";
import { entrarComoInvitado, useInvitado } from "@/lib/invitado";
import { FlujoAuth } from "@/components/auth/Flujo";
import { Bienvenida } from "./Bienvenida";

/**
 * QUI DÉCIDE DE CE QU'ON VOIT EN OUVRANT L'APP.
 *
 * Quatre états, dans l'ordre voulu par le propriétaire :
 *
 *   1. pas de compte  → l'écran d'entrée, plein écran ;
 *   2. la croix a été touchée → mode invité : l'app s'ouvre, mais seule
 *      la RECHERCHE marche. Tout le reste ramène à la porte (`Puerta`) ;
 *   3. compte, première ouverture de la session → l'écran de bienvenue ;
 *   4. ensuite        → l'app.
 *
 * IL NE S'APPLIQUE QU'À L'APP INSTALLÉE. Sur le site, exiger un compte
 * pour voir l'accueil serait une faute grave : le SEO est le canal
 * principal, et une page qui demande à se connecter avant de montrer
 * quoi que ce soit ne se référence pas. C'est pour ça que ce composant
 * est enveloppé dans `.solo-app` par la page, et pourquoi il ne rend
 * RIEN avant hydratation — le HTML servi reste celui du site, identique
 * pour tout le monde, robots compris.
 */

export function AppShell() {
  const { session } = useSession();
  const hydrated = useHydrated();
  const invitado = useInvitado();

  /* Avant hydratation on ne sait pas s'il y a un compte : rendre l'écran
     d'entrée « au cas où » le ferait clignoter chez qui est connecté. */
  if (!hydrated) return null;

  if (!session && !invitado) {
    return (
      <div className="puerta fixed inset-0 z-[200] overflow-y-auto bg-white">
        {/* LE MÊME PARCOURS QUE LE SITE, au pixel près. Ces quatre écrans
            étaient pilotés à la main ici, et une deuxième fois dans
            `Puerta`, et une troisième dans le dialogue du site : trois
            machines d'états pour un seul parcours. Elles ont divergé,
            comme elles divergent toujours. */}
        <FlujoAuth onCerrar={entrarComoInvitado} />
      </div>
    );
  }

  /* En invité, pas de bienvenue : on n'accueille pas quelqu'un par son
     prénom quand on ne le connaît pas. */
  if (!session) return null;

  return <Bienvenida nombre={session.firstName?.trim() || null} />;
}

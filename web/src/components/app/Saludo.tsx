"use client";

import { useSession } from "@/lib/session";
import { useAhora } from "@/lib/reloj";

/**
 * L'EN-TÊTE DE L'APP — le seul texte que l'app gagne par rapport au site.
 *
 * En mode app, la barre haute disparaît : rien ne dit plus où l'on est ni
 * à qui l'écran appartient. Un salut nommé et la date le disent en deux
 * lignes, et donnent à l'écran un point de départ — sans quoi la page
 * commence abruptement sur une carte.
 *
 * Il remplace un en-tête, il n'ajoute pas du marketing : la règle du mode
 * app reste « moins de texte », et ces deux lignes sont de l'orientation,
 * pas de l'argumentaire.
 *
 * Rien avant l'hydratation (`useAhora` rend `null` côté serveur) : le HTML
 * pré-rendu doit rester identique pour tout le monde, robots compris.
 */

function saludoDe(hora: number): string {
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function Saludo() {
  const { session } = useSession();
  const ahora = useAhora();

  if (ahora === null) return null;

  const fecha = new Date(ahora);
  const saludo = saludoDe(fecha.getHours());
  const nombre = session?.firstName?.trim();

  const dia = new Intl.DateTimeFormat("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);

  return (
    <header className="entra-app mx-auto w-full max-w-[1120px] px-5 pt-5">
      {/* UN `p`, PAS UN `h1`. Visuellement c'est un titre ; sémantiquement
          c'est un salut — il ne titre aucun document. Le seul `h1` de la
          page reste celui du premier écran, celui que Google lit. Poser un
          second `h1` ici l'aurait mis en concurrence dans le HTML servi,
          où les deux existent — le mode app ne masque qu'à l'affichage. */}
      <p className="font-display text-[26px] leading-tight font-extrabold tracking-[-0.03em]">
        {saludo}
        {nombre ? `, ${nombre}` : ""}
      </p>
      <p className="mt-0.5 text-[13.5px] text-ink-500">
        {dia.charAt(0).toUpperCase() + dia.slice(1)}
      </p>
    </header>
  );
}

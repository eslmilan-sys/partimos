"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/lastsearch";
import { useSession } from "@/lib/session";

/**
 * LE RETOUR DU LIEN DU COURRIEL — dire ce qui vient de se passer.
 *
 * Quelqu'un touche le lien de son courriel et atterrit ici. Trois issues,
 * et jusqu'ici les trois étaient MUETTES :
 *
 *   · ça marche  → la session s'ouvre, mais rien ne le dit et la personne
 *                  regarde une page d'accueil ordinaire en se demandant
 *                  si elle est entrée ;
 *   · le lien a expiré ou a déjà servi → Supabase renvoie l'erreur dans le
 *                  dièse de l'URL, que personne ne lit ;
 *   · le lien a été ouvert dans un autre navigateur → même chose.
 *
 * On lit donc le dièse AVANT que supabase-js ne le nettoie, et on affiche
 * une bande claire. Elle ne s'affiche jamais sur une visite normale : sans
 * paramètre d'authentification dans l'adresse, ce composant ne rend rien.
 */

type Estado =
  | { kind: "nada" }
  | { kind: "entrando" }
  | { kind: "error"; mensaje: string };

/* Les messages de Supabase sont en anglais et techniques. On traduit ce
   qui arrive vraiment, et on garde une phrase de repli honnête. */
function traducir(code: string, description: string): string {
  if (/expired/i.test(code) || /expired/i.test(description))
    return "Ese enlace ya venció. Pide otro correo y ábrelo apenas llegue.";
  if (/already|used/i.test(code) || /already|used/i.test(description))
    return "Ese enlace ya se usó una vez. Pide otro y listo.";
  if (/access_denied|otp_disabled/i.test(code))
    return "Ese enlace no sirvió. Pide otro correo desde « Conectarme ».";
  return "No pudimos abrir tu sesión con ese enlace. Pide otro correo desde « Conectarme ».";
}

/** Ce que l'adresse dit du retour d'authentification. Lecture pure. */
function leerAdresse(): Estado {
  if (typeof window === "undefined") return { kind: "nada" };
  /* Le dièse d'abord : c'est là que le flux implicite dépose les jetons
     ET les erreurs. La query ensuite, pour les erreurs de redirection. */
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);

  const code =
    hash.get("error_code") ??
    hash.get("error") ??
    query.get("error_code") ??
    query.get("error") ??
    "";
  const desc =
    hash.get("error_description") ?? query.get("error_description") ?? "";

  if (code || desc) return { kind: "error", mensaje: traducir(code, desc) };
  if (hash.get("access_token")) return { kind: "entrando" };
  return { kind: "nada" };
}

export function AuthLanding() {
  /* L'adresse se lit UNE fois, à la construction de l'état — pas dans un
     effet : React 19 refuse un setState synchrone en effet, et il a
     raison, ça relance un rendu pour rien. */
  const [estado] = useState<Estado>(leerAdresse);
  /* …mais on ne l'AFFICHE qu'après l'hydratation : le HTML pré-rendu ne
     contient pas cette bande, et rendre autre chose que lui au premier
     tour, c'est l'erreur React #418. */
  const hydrated = useHydrated();
  /* « Entrando… » est une ATTENTE, pas un état. Il disparaît dès que la
     session existe — sinon il restait affiché sous le nom de la personne
     déjà connectée, ce qui donne l'impression que le site est coincé. */
  const { session } = useSession();

  /* Nettoyer l'adresse est un effet de bord, donc il vit dans un effet —
     et il ne touche à aucun état. Recharger ne doit pas rejouer un
     message déjà lu. */
  useEffect(() => {
    if (estado.kind === "error")
      window.history.replaceState(null, "", window.location.pathname);
  }, [estado.kind]);

  if (!hydrated) return null;
  if (estado.kind === "nada") return null;
  if (estado.kind === "entrando" && session) return null;

  const esError = estado.kind === "error";

  return (
    <div
      role="status"
      className={`px-4 pt-3 ${esError ? "" : "motion-safe:animate-[fade-in_0.2s_ease-out]"}`}
    >
      <p
        className={`mx-auto max-w-[900px] rounded-[14px] px-4 py-3 text-[13.5px] leading-snug ${
          esError
            ? "bg-danger-soft text-danger"
            : "bg-action-soft text-action-ink"
        }`}
      >
        {esError ? estado.mensaje : "Entrando…"}
      </p>
    </div>
  );
}

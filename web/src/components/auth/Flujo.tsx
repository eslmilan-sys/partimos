"use client";

import { useState } from "react";
import { useProveedores } from "./proveedores";
import { Portada } from "./Portada";
import { ComoEntrar } from "./ComoEntrar";
import { Registro } from "./Registro";
import { Acceder } from "./Acceder";

/**
 * LE PARCOURS D'ENTRÉE — UN SEUL, POUR LES DEUX MOITIÉS.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE.
 *
 * Le reproche était : « in app and web is not the same ». Il ne portait
 * pas sur un détail de style — il y avait littéralement deux produits.
 *
 *   · L'APP : une porte avec photo, puis « ¿cómo quieres crear tu
 *     cuenta? », puis six écrans d'une question. Connexion par mot de
 *     passe seulement — un compte créé avec Google n'avait aucune porte.
 *   · LE SITE : un dialogue bleu nuit unique, où l'inscription tenait
 *     dans un seul formulaire et où le lien par courriel se cachait
 *     derrière une ligne de texte souligné.
 *
 * Deux chemins veut dire deux fois les corrections, et surtout deux
 * fois les oublis : le quota d'envois, le lien qui retombe sur
 * localhost, le compte sans mot de passe — chaque panne a dû être
 * réparée deux fois, et l'a été une fois et demie.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QUI DIFFÈRE ENCORE, ET C'EST TOUT.
 *
 * `pantallaCompleta`. Dans l'app, chaque vue prend l'écran et gère
 * l'encoche ; sur le site, elles se glissent dans une feuille qui a déjà
 * son cadre. Une disposition, pas un dessin : mêmes mots, mêmes
 * boutons, mêmes messages d'erreur, même palette.
 */

export type VistaAuth = "portada" | "como" | "registro" | "acceder";

export function FlujoAuth({
  vistaInicial = "portada",
  motivo,
  onCerrar,
  onListo,
  pantallaCompleta = true,
}: {
  vistaInicial?: VistaAuth;
  /** Le titre de la portada, adapté à ce qu'on venait faire. Un écran de
   *  connexion qui ne dit pas POURQUOI il s'affiche se lit comme un mur. */
  motivo?: string;
  /** Sortir du parcours SANS être entré : revenir en arrière dans l'app,
   *  fermer la feuille sur le site. Absent = pas de sortie. */
  onCerrar?: () => void;
  /** La session est ouverte. L'app n'a rien à faire (elle laisse passer
   *  dès que `useSession` voit la session) ; le site referme sa feuille. */
  onListo?: () => void;
  pantallaCompleta?: boolean;
}) {
  const [vista, setVista] = useState<VistaAuth>(vistaInicial);
  const { hayOtrasPuertas } = useProveedores();

  /* ON NE POSE PAS UNE QUESTION QUI N'A QU'UNE RÉPONSE.
     « ¿Cómo quieres crear tu cuenta? » vaut la peine quand il y a
     vraiment plusieurs portes. Si le projet n'a activé aucun
     fournisseur, l'écran se réduit à un titre et à un seul bouton —
     c'est-à-dire à un obstacle poli entre quelqu'un et son compte. Dans
     ce cas on va droit aux questions. */
  const irACrear = () => setVista(hayOtrasPuertas ? "como" : "registro");

  /* Fermer depuis une vue INTERNE ramène à la portada ; fermer depuis la
     portada sort du parcours. Sans cette distinction, la croix de
     l'inscription faisait sortir du site entier — et on ne revient pas
     d'une porte qu'on a claquée par erreur. */
  const volver = () => setVista("portada");

  if (vista === "como")
    return (
      <ComoEntrar
        onCorreo={() => setVista("registro")}
        onAcceder={() => setVista("acceder")}
        onCerrar={volver}
        pantallaCompleta={pantallaCompleta}
      />
    );

  if (vista === "registro")
    return (
      <Registro
        onListo={() => onListo?.()}
        /* « Atrás » depuis la première question remonte à l'écran
           d'AVANT — celui du choix du canal quand il existe, la portada
           sinon. Jamais la sortie du produit. */
        onAtras={() => setVista(hayOtrasPuertas ? "como" : "portada")}
        pantallaCompleta={pantallaCompleta}
      />
    );

  if (vista === "acceder")
    return (
      <Acceder
        onListo={() => onListo?.()}
        onAtras={volver}
        onRegistro={irACrear}
        pantallaCompleta={pantallaCompleta}
      />
    );

  return (
    <Portada
      motivo={motivo}
      onRegistro={irACrear}
      onAcceder={() => setVista("acceder")}
      onCerrar={onCerrar}
      pantallaCompleta={pantallaCompleta}
    />
  );
}

"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import { FlujoAuth } from "@/components/auth/Flujo";

/**
 * LA FEUILLE D'ENTRÉE DU SITE — LE MÊME PARCOURS QUE L'APP, DANS UN CADRE.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QU'IL Y AVAIT ICI, ET POURQUOI IL FALLAIT QUE ÇA PARTE.
 *
 * Mille cent lignes : une carte bleu nuit, ses propres champs, sa propre
 * gestion du quota d'envoi, ses propres messages d'erreur, sa propre
 * inscription en un seul formulaire — et le lien par courriel caché
 * derrière une ligne de texte souligné. À côté, l'app avait sa porte
 * blanche et orange, ses six écrans d'une question, et un mot de passe
 * pour seule porte.
 *
 * Deux parcours pour la même chose, c'est deux fois le travail et deux
 * fois les oublis : le quota, le lien qui retombe sur localhost, le
 * compte créé avec Google et sans mot de passe — chaque panne a dû être
 * réparée deux fois, et ne l'a été qu'une fois et demie. Sans compter le
 * plus visible : « le login de l'application web a une palette
 * différente ». Il l'avait, et c'était écrit ici.
 *
 * Ce fichier ne contient donc plus AUCUN écran. Il ne fait qu'une chose,
 * et c'est la seule qui soit propre au site : poser le parcours partagé
 * dans une feuille qu'on peut fermer, au-dessus de la page qu'on était
 * en train de lire.
 *
 * ─────────────────────────────────────────────────────────────────────
 * UNE FEUILLE, PAS UNE BOÎTE.
 *
 * Sur téléphone elle monte du bas et occupe presque tout l'écran — le
 * même geste que dans l'app. Sur grand écran elle se pose au centre,
 * bornée en hauteur. Ce sont deux dispositions d'un même objet, pas deux
 * dessins : mêmes mots, mêmes boutons, même orange.
 */

export function AuthDialog({
  trigger,
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode;
  /** `open` / `onOpenChange` sont FACULTATIFS : sans eux la feuille se
   *  pilote par son déclencheur, comme partout sur le site. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  /* Non contrôlé par défaut, contrôlé quand l'appelant le demande. Le
     composant a besoin de pouvoir se fermer LUI-MÊME (une session vient
     de s'ouvrir), y compris quand personne ne lui a passé `open`. */
  const [propio, setPropio] = useState(false);
  const abierto = open ?? propio;
  const cambiar = (v: boolean) => {
    setPropio(v);
    onOpenChange?.(v);
  };

  return (
    <Dialog.Root open={abierto} onOpenChange={cambiar}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        {/* Le voile est de l'ENCRE chaude, pas du bleu nuit : c'est la
            couleur des ombres de la maison, et elle laisse la page
            transparaître comme une page, pas comme un écran éteint. */}
        <Dialog.Overlay className="fixed inset-0 z-[130] bg-[rgb(74_33_11/0.44)] backdrop-blur-[6px] motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content
          aria-label="Entrar o crear tu cuenta"
          className="fixed bottom-0 left-1/2 z-[140] flex max-h-[92dvh] w-full max-w-[440px] -translate-x-1/2 flex-col overflow-hidden rounded-t-[28px] border border-ink-200 bg-white shadow-float motion-safe:animate-[sheet-in_0.24s_cubic-bezier(0.2,0.9,0.3,1)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
        >
          {/* LE TITRE EXISTE POUR LES LECTEURS D'ÉCRAN, et pour eux seuls :
              chaque vue du parcours porte déjà le sien, en grand. Deux
              titres visibles l'un sur l'autre, c'est un écran qui bégaie. */}
          <Dialog.Title className="sr-only">
            Entrar o crear tu cuenta
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Con tu contraseña o con un enlace por correo.
          </Dialog.Description>

          <Dialog.Close
            aria-label="Cerrar"
            className="absolute top-3 right-3 z-30 flex size-10 items-center justify-center rounded-full border border-ink-200 bg-white/80 text-ink-600 backdrop-blur transition-colors hover:bg-ink-50"
          >
            <Icon name="cross" className="size-4" />
          </Dialog.Close>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-5">
            <FlujoAuth
              pantallaCompleta={false}
              onCerrar={() => cambiar(false)}
              onListo={() => cambiar(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

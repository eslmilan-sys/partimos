"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * LA FEUILLE DE SÉCURITÉ D'UN VIAJE.
 *
 * Règle de conception, tirée d'une douleur réelle : une fonction de
 * sécurité qui n'alerte personne est PIRE que son absence — elle donne un
 * sentiment de protection qui n'existe pas. Chaque bouton de cette feuille
 * fait donc quelque chose qui marche VRAIMENT, sans dépendre de nos
 * serveurs :
 *
 *   · « Llamar al 911 » est un lien `tel:` — le canal qui ne dépend de
 *     personne, pas même de nous.
 *   · « Compartir mi viaje » passe par la feuille de partage du téléphone
 *     (WhatsApp, SMS, ce que la personne utilise déjà). Le proche reçoit
 *     la route, l'heure, le conducteur et le point de recogida — pas un
 *     lien vers un service qui pourrait être en panne.
 *   · « Reportar » mène à l'aide, où le signalement est expliqué.
 *
 * Ce qu'on ne met PAS ici tant que ça ne marche pas de bout en bout :
 * position partagée en continu, alerte automatique au contact d'urgence.
 * Le jour où ils existent, ils s'ajoutent ICI — pas avant.
 */

export function SeguridadSheet({
  from,
  to,
  cuando,
  driverName,
  point,
}: {
  from: string;
  to: string;
  cuando: string;
  driverName: string;
  point: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const texto =
    `Voy en un viaje compartido de ${from} a ${to} (${cuando}) con ${driverName}, ` +
    `por Partimos. Me recoge en: ${point}.`;

  async function compartir() {
    try {
      /* La feuille native d'abord : c'est elle qui atteint WhatsApp. Le
         presse-papiers en repli — sur un navigateur de bureau, coller dans
         un message est le même geste en deux temps. */
      if (navigator.share) {
        await navigator.share({ text: texto });
        return;
      }
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* Partage annulé par la personne : pas une erreur. */
    }
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink-200 px-3 py-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:border-accent hover:text-accent-ink"
        >
          <Icon name="shield" className="size-4" />
          Seguridad
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink-900/40 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="hoja-abajo glass fixed inset-x-0 bottom-0 z-[100] mx-auto max-w-[560px] rounded-t-[22px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] focus:outline-none"
        >
          <Dialog.Title className="mb-1 font-display text-[19px] font-bold">
            Seguridad
          </Dialog.Title>
          <p className="mb-4 text-[13.5px] leading-snug text-ink-500">
            {from} → {to} · {cuando} · con {driverName}
          </p>

          <div className="grid gap-2.5">
            {/* tel: — le seul canal qui marche sans réseau de données,
                sans compte, sans nous. C'est pour ça qu'il est premier. */}
            <a
              href="tel:911"
              className="flex items-center justify-center gap-2 rounded-[14px] bg-ink-900 px-5 py-4 font-display text-[16px] font-bold text-white transition-colors hover:bg-ink-800"
            >
              <Icon name="phone" className="size-5" />
              Llamar al 911
            </a>

            <button
              type="button"
              onClick={() => void compartir()}
              className="flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-ink-200 px-5 py-4 font-display text-[15px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
            >
              <Icon name="users" className="size-5" />
              {copiado ? "Copiado — pégalo donde quieras" : "Compartir mi viaje"}
            </button>

            <Link
              href="/ayuda"
              className="flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 text-[14px] font-semibold text-ink-500 transition-colors hover:border-accent hover:text-accent-ink"
            >
              Reportar un problema
            </Link>
          </div>

          <p className="mt-4 text-[12.5px] leading-snug text-ink-500">
            «Compartir mi viaje» envía la ruta, la hora, el conductor y tu
            punto de recogida a quien tú elijas, por WhatsApp o SMS.
          </p>

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-ink-50 text-ink-500 transition-colors hover:text-ink-900"
            >
              <Icon name="cross" className="size-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

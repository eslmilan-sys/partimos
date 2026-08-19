import { Section, SectionTitle, Lead } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { PayMarks } from "@/components/ui/PayMark";

/**
 * La section la plus importante du site : elle explique que la plateforme ne
 * touche jamais l'argent (R2). Tout le reste du modèle en découle.
 */
export function Pago() {
  return (
    <Section id="pago">
      <SectionTitle className="max-w-[18ch]">
        Le pagas a la persona — por la app o en la mano
      </SectionTitle>
      <Lead>
        Yappy o tarjeta en la app, con cobro protegido y la tarifa a la
        vista — o efectivo el día del viaje, sin tarifa. En los tres casos
        el conductor recibe su aporte completo.
      </Lead>

      {/* UN SEUL BLOC, PAS TROIS.
          La version précédente empilait une carte « Pasajero », une flèche
          verticale de 80 px et une carte « Conductor », puis les moyens de
          paiement dessous : trois blocs pour une seule idée, et sur téléphone
          la flèche mangeait à elle seule un quart d'écran. Ici le geste tient
          en une ligne — de ta main à la sienne — et ce qui circule dessus est
          posé juste en dessous. Le trait est ambre comme partout ailleurs sur
          le site : le vert de marque ne sert qu'au logo. */}
      {/* Section CLAIRE : une seule nuit par page (Historias). Le plateau
          passe au verre — même matériau que la carte de recherche — avec
          UN rectangle ambre glissé sous son coin : le motif du site, à
          dose homéopathique. */}
      <div className="relative mt-8">
        <span
          aria-hidden
          className="absolute -top-4 -right-5 size-20 rotate-[8deg] rounded-[20px] bg-[linear-gradient(135deg,#fde68a,#f59e0b_58%,#d97706)] opacity-80"
        />
      <div className="glass liquid relative rounded-[20px] px-5 py-6 [--glass-alpha:0.88] sm:px-7">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 sm:gap-x-5">
          <span className="flex size-12 items-center justify-center rounded-full bg-action font-display text-[19px] font-bold text-ink-900">
            Tú
          </span>
          {/* Le trait s'étire, la pointe non : un carré SVG pivoté ne se
              déforme jamais, contrairement à une pointe en bordures CSS. */}
          <span aria-hidden className="flex items-center">
            <i className="flujo-aporte h-[3px] flex-1 rounded-sm bg-[repeating-linear-gradient(90deg,var(--color-action)_0_10px,transparent_10px_20px)]" />
            <svg
              viewBox="0 0 12 12"
              className="size-3 shrink-0 text-action"
              aria-hidden="true"
            >
              <path d="M2 0.5 L10 6 L2 11.5 Z" fill="currentColor" />
            </svg>
          </span>
          <span className="flex size-12 items-center justify-center rounded-full bg-action font-display text-[19px] font-bold text-ink-900">
            A
          </span>
        </div>

        {/* Ce qui circule sur le trait, posé sur le trait. */}
        <div className="mt-5">
          <PayMarks />
        </div>

        <div className="mt-5 grid gap-2 text-[14.5px] leading-snug text-ink-500 sm:grid-cols-2 sm:gap-7">
          <p>
            <b className="font-display font-bold text-ink-900">Pasajero</b> —
            apartas tu puesto y pagas como prefieras: por Yappy o tarjeta en la
            app, o en la mano si prefieres el efectivo.
          </p>
          <p className="sm:text-right">
            <b className="font-display font-bold text-ink-900">Conductor</b> —
            recibe el aporte completo. Nadie le descuenta nada.
          </p>
        </div>
      </div>
      </div>

      {/* Deux encarts, deux registres : comment ça marche / comment ne pas
          se faire avoir. Le corail reste réservé à l'avertissement. */}
      <div className="mt-6.5 grid gap-3.5 md:grid-cols-2">
        <div className="glass flex items-start gap-3.5 rounded-[20px] px-5.5 py-5 [--glass-alpha:0.82]">
          {/* CETTE CARTE PROMETTAIT LE NUMÉRO DU CONDUCTEUR.
              Elle est devenue fausse le jour où le chat l'a remplacé : on
              ne débloque plus aucun numéro, ni au moment de réserver ni
              après. La laisser telle quelle, c'était vendre sur la page
              d'accueil quelque chose que le produit ne fait plus. */}
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-ink-100">
            <Icon name="chat" className="size-4.5" />
          </span>
          <div>
            <h3 className="mb-1.5 font-display text-[17px] font-bold">
              Se coordina por el chat de la reserva
            </h3>
            <p className="text-[14.5px] leading-relaxed text-ink-500">
              Para acordar el punto exacto y la hora, hablas con la persona
              desde el chat, que se abre apenas reservas — antes no, para que
              nadie reciba mensajes de quien no va a viajar con él. Nadie da su
              celular, y lo que acuerden queda escrito: un mensaje no se edita
              ni se borra, de los dos lados.
            </p>
            <span className="mt-2.5 inline-flex items-center gap-2 rounded-[10px] bg-ink-100 px-3 py-1.5 text-[13.5px] font-semibold">
              <Icon name="chat" className="size-4" />
              Chat con Ana M.
            </span>
          </div>
        </div>

      </div>
    </Section>
  );
}

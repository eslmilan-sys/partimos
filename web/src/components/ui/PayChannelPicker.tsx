"use client";

import {
  CashMark,
  TarjetaMark,
  YappyBubbles,
} from "@/components/ui/PayMark";
import {
  PAY_CHANNELS,
  SERVICE_FEE_PCT,
  type PayChannel,
} from "@/lib/pricing";

/**
 * LE MOYEN DE PAIEMENT FAVORI — un choix, jamais une case obligatoire.
 *
 * L'ordre est celui de la maison : Yappy d'abord (recommandé — c'est le
 * canal le moins cher parce qu'il NOUS coûte le moins cher), la tarjeta
 * ensuite, l'efectivo en dernier. Le favori présélectionne le canal à la
 * réservation ; les trois restent visibles à chaque reserva, et payer en
 * efectivo reste gratuit pour toujours (R2).
 *
 * Le composant est volontairement compact — trois puces — parce qu'il vit
 * dans le dialogue d'inscription et dans Mi cuenta, pas dans le panneau
 * de réservation, qui a sa propre version détaillée avec les montants.
 */

export const PAY_CHANNEL_LABELS: Record<PayChannel, string> = {
  yappy: "Yappy",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
};

const NOTES: Record<PayChannel, string> = {
  yappy: `${SERVICE_FEE_PCT.yappy}% en la app`,
  tarjeta: `${SERVICE_FEE_PCT.tarjeta}% en la app`,
  efectivo: "en la mano, sin tarifa",
};

function ChannelMark({ channel }: { channel: PayChannel }) {
  if (channel === "yappy") return <YappyBubbles className="h-4 w-auto" />;
  if (channel === "tarjeta")
    return <TarjetaMark className="size-4.5 text-ink-600" />;
  return <CashMark className="size-4.5 text-ink-600" />;
}

export function PayChannelPicker({
  value,
  onChange,
  idBase,
}: {
  value: PayChannel;
  onChange: (channel: PayChannel) => void;
  idBase: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Cómo prefieres pagar"
      className="grid grid-cols-3 gap-1.5"
    >
      {PAY_CHANNELS.map((channel) => (
        <label
          key={channel}
          htmlFor={`${idBase}-${channel}`}
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-[14px] border px-2 py-2.5 text-center transition-colors ${
            value === channel
              ? "border-ink-900 bg-ink-50"
              : "border-ink-200 hover:border-accent"
          }`}
        >
          <input
            id={`${idBase}-${channel}`}
            type="radio"
            name={idBase}
            checked={value === channel}
            onChange={() => onChange(channel)}
            className="sr-only"
          />
          <span className="flex h-5 items-center">
            <ChannelMark channel={channel} />
          </span>
          <span className="text-[13.5px] leading-none font-semibold">
            {PAY_CHANNEL_LABELS[channel]}
            {channel === "yappy" && (
              <span className="mt-1 block text-[10px] font-bold tracking-[0.08em] text-accent-ink uppercase">
                Recomendado
              </span>
            )}
          </span>
          <span className="text-[11.5px] leading-tight text-ink-500">
            {NOTES[channel]}
          </span>
        </label>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useSession, type Booking } from "@/lib/session";
import { ALL_CITIES } from "@/lib/corridors";
import { formatDayLabel, formatTime, localIso } from "@/lib/trips";
import { useAhora } from "@/lib/reloj";
import { SeguridadSheet } from "./Seguridad";

/**
 * HOY — le cockpit de l'app installée.
 *
 * Le principe : l'accueil de l'app n'est pas une page, c'est un ÉTAT.
 * Quelqu'un qui a un viaje demain à 7 h 30 n'ouvre pas Partimos pour
 * qu'on lui redemande où il va — il l'ouvre pour vérifier que ça tient
 * toujours : à quelle heure, où monte-t-il, avec qui, et comment lui
 * écrire. Cette carte répond à ces quatre questions avant tout le reste ;
 * la recherche ne prend le premier plan que quand il n'y a rien de vrai
 * à montrer.
 *
 * Elle ne vit qu'en mode app (enveloppée dans `.solo-app` par la page) :
 * sur le site, l'accueil doit convaincre un inconnu, pas résumer le
 * compte de quelqu'un.
 *
 * L'heure vient d'un état posé APRÈS le montage, jamais du rendu :
 * `Date.now()` pendant le rendu est refusé par le compilateur React
 * (règle de pureté), et surtout le HTML pré-rendu doit être identique
 * pour tout le monde — le serveur ne connaît ni l'heure du client ni ses
 * reservas. Avant hydratation, la carte n'existe pas ; c'est le
 * comportement voulu.
 */

const cityName = (slug: string) =>
  ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;

/** « Sale en 40 min », « Sale en 3 h », sinon le jour et l'heure. */
function cuandoSale(boardingAt: string, ahora: number): string {
  const salida = new Date(boardingAt).getTime();
  const diff = salida - ahora;
  if (diff <= 0) return "En curso";
  if (diff < 3_600_000) return `Sale en ${Math.max(1, Math.round(diff / 60_000))} min`;
  if (diff < 21_600_000) return `Sale en ${Math.round(diff / 3_600_000)} h`;
  return `${formatDayLabel(localIso(new Date(boardingAt)))} · ${formatTime(boardingAt)}`;
}

export function Hoy() {
  const { session } = useSession();
  /* Le compte à rebours vieillit tout seul : une carte qui dit « sale en
     45 min » une heure plus tard est un mensonge. */
  const ahora = useAhora();

  if (!session || ahora === null) return null;

  /* La prochaine reserva : la plus proche dans le futur, en tolérant
     3 h de passé — un viaje en cours reste LA chose à montrer. */
  const proximo: Booking | undefined = [...(session.bookings ?? [])]
    .filter((b) => new Date(b.boardingAt).getTime() > ahora - 3 * 3_600_000)
    .sort((a, b) => a.boardingAt.localeCompare(b.boardingAt))[0];

  if (!proximo) return null;

  const cuando = cuandoSale(proximo.boardingAt, ahora);
  const enCurso = cuando === "En curso";
  const conductor = proximo.driverName.split(" ")[0] ?? proximo.driverName;

  return (
    <section
      aria-label="Tu próximo viaje"
      className="entra-app mx-auto w-full max-w-[1120px] px-5 pt-5"
    >
      <div className="rounded-[20px] border border-ink-200 bg-white p-5">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold tracking-[0.12em] text-accent-ink uppercase">
            {enCurso ? "Viaje en curso" : "Tu próximo viaje"}
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap ${
              proximo.status === "confirmado"
                ? "bg-ink-900 text-white"
                : "bg-accent-soft text-accent-ink"
            }`}
          >
            {proximo.status === "confirmado" ? "Confirmado" : "Esperando respuesta"}
          </span>
        </div>

        <h2 className="font-display text-[24px] leading-tight font-extrabold tracking-[-0.03em]">
          {cityName(proximo.from)} → {cityName(proximo.to)}
        </h2>
        <p className="tnum mt-1 text-[15px] font-semibold">{cuando}</p>

        <div className="mt-3 grid gap-1.5 text-[13.5px] text-ink-500">
          <p className="flex items-center gap-2">
            <Icon name="pin" className="size-4 shrink-0" />
            <span className="truncate">Te recoge: {proximo.point}</span>
          </p>
          <p className="flex items-center gap-2">
            <Icon name="car" className="size-4 shrink-0" />
            Con {proximo.driverName} · {proximo.seats}{" "}
            {proximo.seats === 1 ? "puesto" : "puestos"}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Le chat vit dans Mis viajes, accroché à la reserva : on y
              mène au lieu d'en dupliquer un deuxième exemplaire ici. */}
          <Link
            href="/cuenta"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[13.5px] font-bold text-white transition-colors hover:bg-ink-800"
          >
            <Icon name="chat" className="size-4" />
            Chat con {conductor}
          </Link>
          <Link
            href={`/viaje/${proximo.tripId}?desde=${proximo.from}&hacia=${proximo.to}`}
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink-200 px-3.5 py-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:border-accent hover:text-accent-ink"
          >
            Ver viaje
          </Link>
          <SeguridadSheet
            from={cityName(proximo.from)}
            to={cityName(proximo.to)}
            cuando={cuando}
            driverName={proximo.driverName}
            point={proximo.point}
          />
        </div>
      </div>
    </section>
  );
}

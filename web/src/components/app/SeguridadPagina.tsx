"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { GlassIcon, type GlassTone } from "@/components/ui/GlassIcon";
import { ALL_CITIES } from "@/lib/corridors";
import { formatDayLabel, formatTime, localIso } from "@/lib/trips";
import { useSession } from "@/lib/session";
import { useAhora } from "@/lib/reloj";

/**
 * SEGURIDAD — l'écran, version app.
 *
 * La différence avec la page du site n'est pas de mise en page : c'est
 * qu'ici on est censé POUVOIR AGIR. Sur le site, seguridad est un
 * argument avant l'inscription ; dans l'app, c'est l'écran qu'on ouvre
 * quand quelque chose ne va pas — donc le 911 est en haut, en grand,
 * et l'explication vient après.
 *
 * RÈGLE, tirée d'une douleur réelle : une fonction de sécurité qui
 * n'alerte personne est PIRE que son absence — elle donne un sentiment
 * de protection qui n'existe pas. Tout ce qui est ici marche sans nos
 * serveurs : `tel:` et la feuille de partage du téléphone. La page du
 * site promet en plus « ubicación en vivo » ; tant que ça ne marche pas
 * de bout en bout, cet écran ne le répète pas.
 */

const nombre = (slug: string) =>
  ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;

/** Ce que nous faisons, et qui est vrai aujourd'hui. */
const HECHOS: {
  icon: IconName;
  tono: GlassTone;
  titulo: string;
  texto: string;
}[] = [
  {
    icon: "id",
    tono: "green",
    titulo: "La cédula se verifica fuera de aquí",
    texto:
      "Un proveedor certificado confirma que es real y que corresponde a la persona. Nosotros recibimos dos cosas: si pasó o no, y una referencia. La foto del documento y el número nunca llegan a nuestros servidores.",
  },
  {
    icon: "chat",
    tono: "teal",
    titulo: "Nadie da su número",
    texto:
      "La coordinación pasa por el chat de la reserva. Queda escrita y ninguno de los dos puede cambiar un mensaje después de enviarlo — por eso sirve de prueba.",
  },
  {
    icon: "star",
    tono: "amber",
    titulo: "Las calificaciones no se borran",
    texto:
      "Al terminar se califican los dos, y el historial se queda en el perfil. Un conductor que cancela tarde varias veces deja de poder publicar: la consecuencia es de reputación, nunca una multa.",
  },
  {
    icon: "users",
    tono: "naranja",
    titulo: "Modo solo mujeres",
    texto:
      "Una conductora puede marcar su viaje como exclusivo para mujeres, y una pasajera puede buscar solo esos. Es opcional en los dos sentidos y no cambia el aporte.",
  },
];

export function SeguridadPagina() {
  const { session } = useSession();
  const ahora = useAhora();

  /* LE VIAJE DU JOUR, s'il y en a un : c'est LUI qu'on partage. Un
     bouton « compartir mi viaje » qui ne sait pas de quel viaje il
     parle ne sert à rien. */
  const reserva = useMemo(() => {
    if (ahora === null) return null;
    return (
      [...(session?.bookings ?? [])]
        .filter((b) => new Date(b.boardingAt).getTime() > ahora - 8 * 3_600_000)
        .sort((a, b) => a.boardingAt.localeCompare(b.boardingAt))[0] ?? null
    );
  }, [session?.bookings, ahora]);

  async function compartir() {
    if (!reserva) return;
    const texto =
      `Voy en un viaje compartido de ${nombre(reserva.from)} a ${nombre(reserva.to)} ` +
      `(${formatDayLabel(localIso(new Date(reserva.boardingAt)))} ${formatTime(reserva.boardingAt)}) ` +
      `con ${reserva.driverName}, por Partimos. Me recoge en: ${reserva.point}.`;
    try {
      if (navigator.share) {
        await navigator.share({ text: texto });
        return;
      }
      await navigator.clipboard.writeText(texto);
    } catch {
      /* Partage annulé : pas une erreur. */
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-4">
      <p className="font-display text-[28px] leading-[1.08] font-extrabold tracking-[-0.035em]">
        Seguridad
      </p>
      <p className="mt-1.5 text-[13.5px] leading-snug text-ink-500">
        Lo de arriba funciona ahora mismo, sin depender de nosotros. Lo de
        abajo es lo que hacemos y lo que deliberadamente no guardamos.
      </p>

      {/* LE 911 EN PREMIER. C'est le seul canal qui marche sans données,
          sans compte et sans nous — donc il ne partage la place avec
          rien. */}
      <a
        href="tel:911"
        className="mt-4 flex items-center justify-center gap-2.5 rounded-[16px] bg-ink-900 px-5 py-4 font-display text-[17px] font-bold text-white transition-colors hover:bg-ink-800"
      >
        <Icon name="phone" className="size-5" />
        Llamar al 911
      </a>

      {reserva ? (
        <>
          <button
            type="button"
            onClick={() => void compartir()}
            className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-[16px] border-[1.5px] border-ink-200 bg-white px-5 py-4 font-display text-[15.5px] font-bold transition-colors hover:border-naranja"
          >
            <Icon name="users" className="size-5" />
            Compartir mi viaje
          </button>
          <p className="mt-2 px-1 text-[12.5px] leading-snug text-ink-500">
            Manda por WhatsApp o SMS, a quien tú elijas: {nombre(reserva.from)} →{" "}
            {nombre(reserva.to)}, {formatTime(reserva.boardingAt)}, con{" "}
            {reserva.driverName}, y dónde te recoge.
          </p>
        </>
      ) : (
        <p className="mt-2 rounded-[16px] border border-ink-200 bg-white px-4 py-3.5 text-[13px] leading-snug text-ink-500">
          Cuando tengas un viaje reservado, aquí aparece el botón para
          compartirlo con quien tú quieras — ruta, hora, conductor y punto de
          recogida.
        </p>
      )}

      <Link
        href="/ayuda"
        className="mt-2 flex items-center justify-center gap-2 rounded-[16px] border border-ink-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-ink-600 transition-colors hover:border-naranja"
      >
        Reportar un problema
      </Link>

      <ul className="mt-5 grid gap-2.5">
        {HECHOS.map((h) => (
          <li
            key={h.titulo}
            className="rounded-[18px] border border-ink-200 bg-white p-4"
          >
            <p className="flex items-center gap-3 font-display text-[15.5px] leading-tight font-bold">
              <GlassIcon name={h.icon} tone={h.tono} size="sm" />
              {h.titulo}
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">
              {h.texto}
            </p>
          </li>
        ))}
      </ul>

      {/* CE QUE NOUS NE GARDONS PAS. C'est la moitié la plus utile de
          n'importe quelle page de sécurité, et presque personne ne
          l'écrit. */}
      <div className="mt-3 rounded-[18px] bg-verde-suave p-4">
        <p className="font-display text-[15.5px] font-bold text-verde-ok">
          Lo que no guardamos
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">
          Ni imágenes de cédula ni números de documento. Ni números de tarjeta:
          si pagas en la app lo procesa una pasarela certificada y a nosotros
          nunca nos llega. No vendemos datos, y tu número no se usa para
          publicidad.
        </p>
      </div>
    </div>
  );
}

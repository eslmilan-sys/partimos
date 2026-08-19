"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { ALL_CITIES } from "@/lib/corridors";
import { formatUsd } from "@/lib/pricing";
import { saveLastSearch, useHydrated, useLastSearch } from "@/lib/lastsearch";
import { formatTime, localIso, searchTrips, type TripMatch } from "@/lib/trips";

/**
 * BUSCAR — l'onglet de recherche de l'app.
 *
 * DEUX PORTES, UNE SEULE RECHERCHE. L'accueil pose la question à qui
 * ouvre l'app sans idée précise ; cet écran est celui où l'on revient
 * quand on cherche pour de bon. La différence n'est pas cosmétique :
 * ici les résultats apparaissent SANS bouton, à mesure qu'on choisit.
 * Choisir, c'est chercher — c'est ce qui fait tomber le temps
 * jusqu'au viaje à deux gestes.
 *
 * L'ADRESSE EXACTE EST LE POINT DE CET ÉCRAN. Le champ ne cherche pas
 * que des villes : on tape son PH, son mall, son coin de rue, la ville
 * se résout toute seule et l'adresse VOYAGE jusqu'au point de recogida
 * proposé au conducteur. C'est `CityCombobox` qui fait ça — le même
 * composant que partout ailleurs, avec ses trois corrections de bugs
 * durement gagnées ; le dupliquer aurait dupliqué les bugs.
 *
 * Sans clé de géocodage au build, le champ retombe sur la liste des
 * villes : moins précis, jamais cassé.
 */

const nombre = (slug: string) =>
  ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;

function isoConDesfase(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return localIso(d);
}

/** Une ligne de résultat, réduite à ce qui départage : l'heure, qui
 *  conduit, ce qu'on aporte. Le reste est sur la fiche. */
function Linea({ m, desde, hacia }: { m: TripMatch; desde: string; hacia: string }) {
  return (
    <li>
      <Link
        href={`/viaje/${m.trip.id}?desde=${desde}&hacia=${hacia}`}
        className="flex items-center gap-3 rounded-[16px] border border-ink-200 bg-white px-3.5 py-3 transition-colors hover:border-naranja"
      >
        <span className="tnum shrink-0 font-display text-[15px] font-bold text-naranja">
          {formatTime(m.boardingAt)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold">
            {m.trip.driver.firstName} {m.trip.driver.lastInitial}.
          </span>
          <span className="flex items-center gap-1 text-[12.5px] text-ink-500">
            <Icon name="star" className="size-[12px] text-action" />
            <span className="tnum">{m.trip.driver.rating.toFixed(1)}</span>
            <span>
              ·{" "}
              {m.seatsFree === 1 ? "1 puesto" : `${m.seatsFree} puestos`}
            </span>
          </span>
        </span>
        <span className="tnum shrink-0 font-display text-[17px] font-extrabold">
          {formatUsd(m.priceCents)}
        </span>
      </Link>
    </li>
  );
}

export function Ya() {
  const ultima = useLastSearch();
  const hidratado = useHydrated();

  const [desdeElegido, setDesdeElegido] = useState<string | null>(null);
  const [haciaElegido, setHaciaElegido] = useState<string | null>(null);
  const [puestosElegidos, setPuestosElegidos] = useState<number | null>(null);
  const [cuando, setCuando] = useState<0 | 1>(0);
  const [puntoDesde, setPuntoDesde] = useState("");

  /* La mémoire courte de la dernière recherche faite N'IMPORTE OÙ dans
     l'app : on ne recommence pas de zéro à chaque ouverture. Dérivée,
     jamais recopiée dans l'état — sinon elle se figerait. */
  const desde = desdeElegido ?? ultima?.from ?? "panama-city";
  const hacia = haciaElegido ?? ultima?.to ?? "";
  const puestos = puestosElegidos ?? ultima?.seats ?? 1;

  const fecha = isoConDesfase(cuando);
  const valido = Boolean(hacia) && desde !== hacia;

  /* Les résultats se calculent EN RENDANT. La barrière d'hydratation
     les retient dans le HTML prérendu : ils dépendent de l'heure
     réelle, que le build ne peut pas connaître. */
  const matches = hidratado && valido ? searchTrips(desde, hacia, fecha, puestos) : [];

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-4">
      <p className="font-display text-[28px] leading-[1.08] font-extrabold tracking-[-0.035em]">
        ¿A dónde <span className="text-naranja">vas?</span>
      </p>
      <p className="mt-1.5 text-[13.5px] leading-snug text-ink-500">
        Escribe tu punto exacto — un PH, un mall, una esquina. La ciudad se
        resuelve sola y el punto viaja hasta el conductor.
      </p>

      <div className="mt-4 rounded-[20px] border border-ink-200 bg-white p-1.5 shadow-card">
        <div className="flex items-center gap-3 px-3.5 pt-3 pb-2">
          <span className="mt-4 size-[9px] shrink-0 rounded-full bg-verde-ok" />
          <span className="min-w-0 flex-1">
            <label
              htmlFor="ya-desde"
              className="block text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase"
            >
              Desde
            </label>
            <CityCombobox
              id="ya-desde"
              value={desde}
              exclude={hacia || undefined}
              variant="desnudo"
              onChange={(slug) => {
                setDesdeElegido(slug);
                saveLastSearch({ from: slug, to: hacia, seats: puestos });
              }}
              onPlace={(lugar) => setPuntoDesde(lugar)}
            />
          </span>
        </div>

        <div className="mx-3.5 h-px bg-ink-200" />

        <div className="flex items-center gap-3 px-3.5 pt-2 pb-3">
          <span className="mt-4 size-[9px] shrink-0 rounded-full border-[2.5px] border-naranja" />
          <span className="min-w-0 flex-1">
            <label
              htmlFor="ya-hacia"
              className="block text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase"
            >
              Hacia
            </label>
            <CityCombobox
              id="ya-hacia"
              value={hacia}
              exclude={desde}
              tone="destination"
              variant="desnudo"
              placeholder="¿A dónde quieres ir?"
              onChange={(slug) => {
                setHaciaElegido(slug);
                saveLastSearch({ from: desde, to: slug, seats: puestos });
              }}
            />
          </span>
        </div>
      </div>

      {/* CE QU'ON A COMPRIS DE TON ADRESSE. Le taire donnerait
          l'impression que le champ n'a rien retenu. */}
      {puntoDesde && (
        <p className="mt-2 px-1 text-[12.5px] leading-snug text-ink-500">
          Te recogen por{" "}
          <b className="font-semibold text-ink-900">«{puntoDesde}»</b> — se lo
          proponemos al conductor.
        </p>
      )}

      {/* QUAND ET COMBIEN — deux rangées, jamais une. Sur 390 px, une
          seule rangée casse au « 4 », qui tombe seul à la ligne : un
          retour accidentel se lit comme un bug. */}
      <div className="mt-3 flex gap-1.5">
        {([0, 1] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setCuando(d)}
            aria-pressed={cuando === d}
            className={`flex-1 rounded-[14px] border py-2.5 text-[14px] font-semibold transition-colors ${
              cuando === d
                ? "border-naranja bg-naranja text-white"
                : "border-ink-200 bg-white text-ink-600"
            }`}
          >
            {d === 0 ? "Hoy" : "Mañana"}
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setPuestosElegidos(n);
              saveLastSearch({ from: desde, to: hacia, seats: n });
            }}
            aria-pressed={puestos === n}
            aria-label={n === 1 ? "1 pasajero" : `${n} pasajeros`}
            className={`tnum flex-1 rounded-[14px] border py-2.5 text-[14px] font-semibold transition-colors ${
              puestos === n
                ? "border-naranja bg-naranja text-white"
                : "border-ink-200 bg-white text-ink-600"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* LES RÉSULTATS, SANS BOUTON. */}
      <div className="mt-5">
        {!valido ? (
          <p className="px-1 text-[13.5px] leading-relaxed text-ink-500">
            Escoge a dónde vas y los viajes aparecen aquí mismo.
          </p>
        ) : matches.length === 0 ? (
          <div className="rounded-[18px] border border-ink-200 bg-white px-5 py-7 text-center">
            <p className="font-display text-[16px] font-bold">
              Nadie va por ahí {cuando === 0 ? "hoy" : "mañana"}
            </p>
            <p className="mx-auto mt-1.5 max-w-[32ch] text-[13.5px] leading-relaxed text-ink-500">
              Mira otras fechas en la búsqueda completa, o publica tu viaje si
              eres tú quien maneja.
            </p>
            <Link
              href={`/buscar?desde=${desde}&hacia=${hacia}&fecha=${fecha}&puestos=${puestos}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-naranja px-5 py-2.5 text-[14px] font-bold text-white"
            >
              Ver otras fechas
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[16px] font-bold">
                {nombre(desde)} → {nombre(hacia)}
              </h2>
              <span className="tnum text-[13px] text-ink-500">
                {matches.length}{" "}
                {matches.length === 1 ? "viaje" : "viajes"}
              </span>
            </div>
            <ul className="grid gap-2">
              {matches.slice(0, 4).map((m) => (
                <Linea
                  key={`${m.trip.id}-${m.segment.to.citySlug}`}
                  m={m}
                  desde={desde}
                  hacia={hacia}
                />
              ))}
            </ul>
            {/* La recherche complète garde les filtres, le tri et la
                carte : cet écran est la voie rapide, pas un doublon. */}
            <Link
              href={`/buscar?desde=${desde}&hacia=${hacia}&fecha=${fecha}&puestos=${puestos}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-[16px] border border-ink-200 bg-white py-3 text-[14px] font-bold transition-colors hover:border-naranja"
            >
              Ver los {matches.length} con filtros y mapa
              <Icon name="arrowRight" className="size-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

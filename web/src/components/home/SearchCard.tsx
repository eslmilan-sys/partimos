"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { irArriba } from "@/lib/navegar";
import { ALL_CITIES,  } from "@/lib/corridors";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { localIso, SEARCH_HORIZON_DAYS } from "@/lib/trips";
import { saveLastSearch, useHydrated, useLastSearch } from "@/lib/lastsearch";

/** L'horizon de recherche, libellé en espagnol du Panama. */
function nextDays(count = SEARCH_HORIZON_DAYS) {
  const out: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = localIso(d);
    const label =
      i === 0
        ? "Hoy"
        : i === 1
          ? "Mañana"
          : new Intl.DateTimeFormat("es-PA", {
              weekday: "long",
              day: "numeric",
              month: "short",
            }).format(d);
    out.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return out;
}

const FIELD_LABEL =
  "block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase";
const FIELD_INPUT =
  "w-full cursor-pointer appearance-none border-none bg-transparent py-px text-[16.5px] font-semibold text-ink-900 focus:outline-none";

export function SearchCard() {
  const router = useRouter();
  const { session } = useSession();
  const days = useMemo(() => nextDays(), []);

  const [mode, setMode] = useState<"buscar" | "ofrecer">("buscar");
  /* La mémoire courte du site : tant que l'utilisateur n'a pas touché un
     champ, il montre sa DERNIÈRE recherche — l'accueil, /ya et la
     publication racontent la même histoire. Valeur dérivée, jamais
     copiée : pas d'état rance possible. */
  const last = useLastSearch();
  const [fromChoice, setFromChoice] = useState<string | null>(null);
  const [toChoice, setToChoice] = useState<string | null>(null);
  const [seatsChoice, setSeatsChoice] = useState<number | null>(null);
  const from = fromChoice ?? last?.from ?? "panama-city";
  const to = toChoice ?? last?.to ?? "chitre";
  const seats = seatsChoice ?? last?.seats ?? 1;
  /* LA DATE NE PEUT PAS S'INITIALISER AVEC L'HEURE.
     Le HTML est fabriqué au build : « Hoy » y vaut la date du build,
     et dans le navigateur la date d'aujourd'hui. Deux textes
     différents au même endroit — c'est l'erreur d'hydratation React
     #418, et elle traînait sur l'accueil depuis un moment. La liste
     complète n'apparaît donc qu'APRÈS l'hydratation ; avant, une seule
     entrée, identique des deux côtés. */
  const hydrated = useHydrated();
  const [dateChoice, setDateChoice] = useState<string | null>(null);
  const date = dateChoice ?? days[0].value;
  const sameCity = from === to;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sameCity || !from || !to) return;
    saveLastSearch({ from, to, seats, date });

    if (mode === "ofrecer") {
      irArriba();
      router.push(`/publicar/nuevo?desde=${from}&hacia=${to}`);
      return;
    }

    /* TOUTE paire de villes se cherche : la ruta s'arme sur le réseau
       routier (buildRoute), et la page de résultats sait dire « rien
       pour cette date » avec l'alerte. L'ancien barrage « esa ruta no
       está abierta » datait des corridors fermés — supprimé. */
    irArriba();
    router.push(
      `/buscar?desde=${from}&hacia=${to}&fecha=${date}&puestos=${seats}`,
    );
  }

  const routine = session?.routine ?? null;

  return (
    <div className="glass liquid rounded-[20px] p-2.5 shadow-float [--glass-alpha:0.82]">
      {/* La voie express, pour qui a une rutina : la carte de recherche
          reste, mais le raccourci passe devant — c'est lui qui réduit le
          temps-jusqu'au-viaje à deux taps. */}
      {routine && (
        <Link
          href="/ya"
          className="mx-3 mt-2.5 flex items-center gap-2.5 rounded-[14px] bg-ink-900 px-4 py-3 text-white transition-colors hover:bg-ink-800"
        >
          <Icon name="route" className="size-4.5 shrink-0" />
          <span className="min-w-0 flex-1 text-[14.5px] font-semibold">
            Tu rutina:{" "}
            {ALL_CITIES.find((c) => c.slug === routine.from)?.shortName} →{" "}
            {ALL_CITIES.find((c) => c.slug === routine.to)?.shortName}
            <span className="block text-[12.5px] font-normal text-white/70">
              Tu próximo puesto ya está buscado
            </span>
          </span>
          <Icon name="arrowRight" className="size-4 shrink-0" />
        </Link>
      )}
      <div className="px-5 pt-2.5 pb-2">
        <div
          role="group"
          aria-label="¿Qué quieres hacer?"
          className="flex rounded-xl bg-ink-50 p-0.5"
        >
          {(
            [
              ["buscar", "Busco puesto"],
              ["ofrecer", "Ofrezco puestos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={`flex-1 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                mode === value
                  ? "bg-white text-ink-900 shadow-[0_1px_4px_rgb(14_42_53/0.12)]"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* LE SEGMENTÉ « Escribir / Mapa » A DISPARU AVEC LA CARTE.

          Il n'existait que pour choisir entre deux façons de remplir les
          mêmes deux champs. La carte partie, il ne restait qu'un bouton
          qui ne fait rien — et un segmenté à une seule option est un
          bouton qui ment sur son rôle. Écrire est le seul chemin, donc
          il n'a plus besoin d'être annoncé. */}

      <form onSubmit={handleSubmit} noValidate>
        <CityCombobox
          id="desde"
          label="Desde"
          value={from}
          exclude={to}
          tone="origin"
          onChange={(slug) => setFromChoice(slug)}
        />

        <div className="border-t border-ink-200">
          <CityCombobox
            id="hacia"
            label="Hacia"
            value={to}
            exclude={from}
            tone="destination"
            onChange={(slug) => setToChoice(slug)}
          />
        </div>

        {/* La fecha et les puestos ne nourrissent QUE la recherche : en mode
            « Ofrezco », les montrer promettait un formulaire qui n'existait
            pas — le flux de publication pose ses propres questions (audit C3). */}
        {mode === "buscar" && (
        <div className="flex border-t border-ink-200">
          <div className="flex flex-1 items-center rounded-[14px] px-5 py-3 transition-colors hover:bg-ink-50">
            <div className="min-w-0 flex-1">
              <label htmlFor="fecha" className={FIELD_LABEL}>
                Fecha
              </label>
              <select
                id="fecha"
                value={date}
                onChange={(e) => setDateChoice(e.target.value)}
                className={FIELD_INPUT}
              >
                {(hydrated ? days : days.slice(0, 1)).map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex max-w-[176px] items-center rounded-[14px] border-l border-ink-200 py-3 pr-5 pl-5 transition-colors hover:bg-ink-50">
            <div className="min-w-0 flex-1">
              <label htmlFor="puestos" className={FIELD_LABEL}>
                Puestos
              </label>
              <select
                id="puestos"
                value={seats}
                onChange={(e) => setSeatsChoice(Number(e.target.value))}
                className={FIELD_INPUT}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "puesto" : "puestos"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        )}


        {sameCity && (
          <p
            role="alert"
            className="mt-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13.5px] font-medium text-danger"
          >
            El origen y el destino no pueden ser el mismo.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          full
          className="mt-2"
          disabled={sameCity || !from || !to}
        >
          {mode === "buscar" ? "Buscar viaje" : "Publicar mi viaje"}
        </Button>

        <p className="px-1.5 pt-3 pb-1 text-center text-[12.5px] text-ink-500">
          {mode === "buscar" ? (
            <>
              Pagas como prefieras:{" "}
              <b className="text-ink-900">Yappy, tarjeta o efectivo</b>,
              directo a la persona.
            </>
          ) : (
            <>
              Un minuto, cuatro pasos: tu ruta ya va puesta y la app calcula
              el aporte máximo por puesto.
            </>
          )}
        </p>
      </form>

    </div>
  );
}

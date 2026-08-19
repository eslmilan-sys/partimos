"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_CITIES, buildRoute } from "@/lib/corridors";
import {
  AVERAGE_TOLL_CENTS,
  computePriceCap,
  formatUsd,
  VEHICLE_LABELS,
  type VehicleCategory,
} from "@/lib/pricing";

/**
 * Un montant qui ROULE vers sa nouvelle valeur au lieu de sauter.
 *
 * C'est le seul endroit du site où un chiffre change sous les doigts de
 * l'utilisateur : le voir courir de $17.50 à $23.30 dit « ceci est un
 * calcul », là où un saut sec dit « ceci est un autre écran ». 240 ms en
 * décélération — assez pour être vu, trop court pour être attendu.
 *
 * Trois garde-fous :
 *   · `prefers-reduced-motion` → la valeur s'affiche directement ;
 *   · le premier rendu ne roule pas — rien de plus agaçant qu'une page qui
 *     compte toute seule à l'arrivée ;
 *   · l'animation vit dans un `requestAnimationFrame` annulé à chaque
 *     changement : deux coups de curseur rapides ne se battent pas.
 */
function useMontoRodante(targetCents: number): number {
  /* Hors animation, la valeur affichée EST la cible — aucun état à
     synchroniser, donc pas de `setState` dans le corps de l'effet (la règle
     React a raison : c'est comme ça qu'on fabrique des rendus en cascade).
     L'état n'existe que pendant les 240 ms du roulement, alimenté par les
     ticks du `requestAnimationFrame`, puis retombe à `null`. */
  const [rolling, setRolling] = useState<number | null>(null);
  const prev = useRef(targetCents);

  useEffect(() => {
    const from = prev.current;
    prev.current = targetCents;
    if (from === targetCents) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const start = performance.now();
    const DURATION = 240;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      if (t >= 1) {
        setRolling(null);
        return;
      }
      const eased = 1 - (1 - t) ** 3;
      setRolling(Math.round(from + (targetCents - from) * eased));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetCents]);

  return rolling ?? targetCents;
}

/**
 * Calculateur d'aporte — Formule A.
 *
 * Il ne « propose » pas un prix : il montre un PLAFOND et, juste en dessous,
 * ce que le conducteur continue de payer de sa poche. Les deux chiffres
 * doivent être lus ensemble — c'est la démonstration visuelle que personne
 * ne gagne d'argent (R1, R5).
 *
 * Le péage retenu est une moyenne de corridor ($3,00). Sur une page corridor,
 * le péage réel de la table `corridors` est utilisé à la place.
 */

const CATEGORIES: VehicleCategory[] = ["economy", "standard", "suv"];

export function Calculadora({
  initialKm = 250,
  tollCents = AVERAGE_TOLL_CENTS,
  compact = false,
  conRuta = false,
}: {
  initialKm?: number;
  tollCents?: number;
  compact?: boolean;
  /** Choisir DEUX VILLES au lieu de deviner des kilomètres. Personne ne
   *  sait que Panamá → Chitré fait 250 km : on demandait donc au
   *  conducteur d'inventer le chiffre qui décide de son aporte. */
  conRuta?: boolean;
}) {
  const [desde, setDesde] = useState(conRuta ? "panama-city" : "");
  const [hacia, setHacia] = useState(conRuta ? "chitre" : "");
  const [kmChoice, setKmChoice] = useState<number | null>(null);
  const [seats, setSeats] = useState(3);
  const [category, setCategory] = useState<VehicleCategory>("standard");

  /* La ruta commande : elle donne les kilomètres ET les péages réels.
     Le curseur reste en dessous pour affiner — dérivé, jamais recopié
     dans un état par un effet. */
  const ruta = conRuta ? buildRoute(desde, hacia) : null;
  const km = kmChoice ?? ruta?.distanceKm ?? initialKm;
  const peaje = ruta?.tollCents ?? tollCents;

  const result = useMemo(
    () => computePriceCap(km, peaje, category, seats),
    [km, peaje, category, seats],
  );

  const tope = useMontoRodante(result.maxPriceCents);
  const costo = useMontoRodante(result.costTotalCents);
  const recupera = useMontoRodante(result.recoveredCents);
  const pone = useMontoRodante(result.driverShareCents);

  return (
    <div
      className={`rounded-[20px] border border-ink-200 bg-white ${compact ? "p-5" : "p-6.5"} shadow-lift`}
    >
      <h3 className="mb-1.5 font-display text-xl font-bold tracking-[-0.02em]">
        ¿Cuánto pueden aportar?
      </h3>
      <p className="mb-5 text-[13.5px] text-ink-500">
        El tope se calcula solo. No se puede pasar de ahí.
      </p>

      {conRuta && (
        <div className="mb-5 grid gap-2.5 min-[420px]:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
              Desde
            </span>
            <select
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setKmChoice(null);
              }}
              className="w-full cursor-pointer rounded-[14px] border border-ink-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
            >
              {ALL_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
              Hacia
            </span>
            <select
              value={hacia}
              onChange={(e) => {
                setHacia(e.target.value);
                setKmChoice(null);
              }}
              className="w-full cursor-pointer rounded-[14px] border border-ink-200 px-3.5 py-2.5 text-[15px] font-semibold focus:border-accent focus:outline-none"
            >
              {ALL_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {!ruta && desde !== hacia && (
            <p className="text-[12.5px] text-ink-500 min-[420px]:col-span-2">
              Esa ruta todavía no la tenemos medida. Ajusta los kilómetros
              abajo y el cálculo sigue funcionando igual.
            </p>
          )}
        </div>
      )}

      <div className="mb-5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <label
            htmlFor="calc-km"
            className="text-[12.5px] font-bold tracking-[0.09em] text-ink-500 uppercase"
          >
            Distancia
          </label>
          <b className="tnum font-display text-[17px] font-bold">{km} km</b>
        </div>
        <input
          id="calc-km"
          type="range"
          min={60}
          max={450}
          step={5}
          value={km}
          onChange={(e) => setKmChoice(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgb(14_42_53/0.22)]"
        />
      </div>

      <fieldset className="mb-5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <legend className="text-[12.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
            Puestos que ofreces
          </legend>
          <b className="tnum font-display text-[17px] font-bold">{seats}</b>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={seats === n}
              onClick={() => setSeats(n)}
              className={pillClass(seats === n)}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="mb-2.5 text-[12.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
          Tu carro
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={category === code}
              onClick={() => setCategory(code)}
              className={pillClass(category === code)}
            >
              {VEHICLE_LABELS[code]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="rounded-[20px] bg-ink-50 p-5" aria-live="polite">
        <div className="mb-3.5 border-b border-dashed border-ink-200 pb-4 text-center">
          <p className="text-[11.5px] font-bold tracking-[0.13em] text-ink-500 uppercase">
            Tope por puesto
          </p>
          <p className="tnum font-display text-5xl leading-tight font-extrabold tracking-[-0.045em] text-action-deep">
            {formatUsd(tope)}
          </p>
          <p className="text-[13.5px] text-ink-500">
            Puedes pedir menos, nunca más
          </p>
        </div>

        <dl className="text-sm">
          <Row label="Costo estimado del viaje">{formatUsd(costo)}</Row>
          <Row label="Se divide entre">
            {result.occupants} ocupantes (tú incluido)
          </Row>
          <Row label="Recuperas con todo lleno">{formatUsd(recupera)}</Row>
          <Row label="Sigues poniendo de tu bolsillo" emphasis>
            {formatUsd(pone)}
          </Row>
        </dl>
      </div>

      <p className="mt-4 border-t border-ink-200 pt-3.5 text-[13.5px] leading-relaxed text-ink-500">
        Incluye gasolina, peajes y desgaste, más un margen del 10 % por los
        desvíos de recogida.{" "}
        <b className="font-semibold text-ink-900">
          Aunque llenes el carro, siempre pones parte del viaje
        </b>{" "}
        — por eso esto es compartir gastos y no cobrar un pasaje.
      </p>
    </div>
  );
}

function pillClass(active: boolean) {
  return [
    "rounded-[10px] border-[1.5px] px-4 py-2.5 text-[14.5px] font-semibold transition-colors",
    active
      ? "border-ink-900 bg-ink-900 text-white"
      : "border-ink-200 text-ink-500 hover:border-accent hover:text-accent-ink",
  ].join(" ");
}

function Row({
  label,
  children,
  emphasis = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 py-1.5">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={`tnum text-right font-semibold ${emphasis ? "text-ink-900" : ""}`}
      >
        {children}
      </dd>
    </div>
  );
}

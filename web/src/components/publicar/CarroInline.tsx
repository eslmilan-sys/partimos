"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { carsOf, useSession, type SavedCar } from "@/lib/session";
import {
  CAR_MAKES,
  CAR_YEARS,
  agedConsumption,
  findCar,
  modelsForMake,
  rateFromConsumption,
} from "@/lib/cars";
import { formatUsd } from "@/lib/pricing";

/**
 * LE CARRO SE DÉCLARE LÀ OÙ ON LE DEMANDE.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LE REPROCHE, MOT POUR MOT : « quand on veut publier, on demande les
 * infos du carro, mais il devrait y avoir l'option de mettre le carro
 * qu'il a au lieu de l'emmener sur une autre page. »
 *
 * C'est exact, et le défaut est classique : la porte disait « il te
 * manque ton carro » et offrait un lien vers Mi cuenta. Ce lien est un
 * ABANDON déguisé. On quitte le formulaire, on arrive sur un écran de
 * réglages qu'on n'avait pas demandé, on remplit, et il faut retrouver
 * tout seul le chemin du retour — en ayant perdu ce qu'on avait commencé
 * à saisir. À ce moment précis du parcours, chaque écran traversé coûte
 * des conducteurs.
 *
 * Ce composant est LE formulaire du carro, et il vit partout où la
 * question se pose : dans la porte du conducteur, à l'étape « ¿con qué
 * carro vas? », et dans Mi cuenta. Trois endroits, une seule vérité —
 * dupliquer le formulaire aurait dupliqué ses règles (le taux au km sort
 * du modèle et de l'année, la placa se met en majuscules, le premier
 * carro reste synchronisé sur le champ hérité).
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QU'ON DEMANDE, ET CE QU'ON NE DEMANDE PAS.
 *
 * Marca, modelo, año — ils fixent le coût au kilomètre, donc le tope. Un
 * carro qui consomme plus peut demander plus : c'est le COÛT qui décide,
 * jamais la demande (R3).
 *
 * Color et placa — pour se reconnaître au point de rencontre. La placa
 * ne se montre JAMAIS en public : seulement au passager dont la reserva
 * est confirmée, comme le numéro de téléphone.
 *
 * Aucune photo. Garder les photos des carros de nos utilisateurs, ce
 * serait se constituer une base d'images à protéger, à expliquer et à
 * supprimer sur demande — pour un bénéfice que marca + modelo + color +
 * placa rendent déjà au point de rencontre.
 */

export function CarroInline({
  onGuardado,
  titulo = "Tu carro",
  ayuda = "Marca, modelo y placa. Se pide una sola vez y queda listo para todos tus viajes.",
  compacto = false,
}: {
  /** Appelé après l'enregistrement — l'appelant referme, avance, recalcule. */
  onGuardado?: (carro: SavedCar) => void;
  titulo?: string;
  ayuda?: string;
  /** Sans titre ni aide : le composant s'insère dans un écran qui les porte. */
  compacto?: boolean;
}) {
  const { session, updateSession } = useSession();
  const cars = carsOf(session);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2020);
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [tocado, setTocado] = useState(false);

  const ref = findCar(make, model);
  const l100 = ref ? agedConsumption(ref.l100, year) : null;
  const rate = l100 !== null ? rateFromConsumption(l100) : null;

  /* CE QUI REND LE CARRO « COMPLET » — la même règle que la porte du
     conducteur, écrite une seule fois. Sans la placa, publier reste
     bloqué et personne ne comprend pourquoi : on l'exige donc ICI, avec
     son message, plutôt que de laisser l'écran d'après refuser. */
  const placaOk = plate.trim().length >= 4;
  /* SANS SESSION, ON NE PEUT RIEN GARDER — et il faut le DIRE.
     `updateSession` écrit dans les préférences du compte ; sans compte
     il ne fait rien du tout. Laisser le bouton actif produisait le pire
     défaut possible : on remplit cinq champs, on appuie, il ne se passe
     rien, et rien n'explique pourquoi. */
  const hayCuenta = Boolean(session);
  const listo =
    hayCuenta && Boolean(ref) && color.trim().length >= 3 && placaOk;

  const guardar = () => {
    if (!listo || !ref) {
      setTocado(true);
      return;
    }
    const carro: SavedCar = {
      make,
      model,
      year,
      color: color.trim(),
      plate: plate.trim().toUpperCase(),
      photoDataUrl: null,
    };
    const next = [...cars, carro];
    /* `car` reste synchronisé sur le premier : les vieilles sessions et
       tout code qui lirait encore le champ hérité voient la même chose. */
    updateSession({ cars: next, car: next[0] ?? null });
    setMake("");
    setModel("");
    setColor("");
    setPlate("");
    setTocado(false);
    onGuardado?.(carro);
  };

  return (
    <div>
      {!compacto && (
        <>
          <h3 className="mb-1 font-display text-[16px] font-bold">{titulo}</h3>
          <p className="mb-3 text-[13.5px] leading-relaxed text-ink-500">
            {ayuda}
          </p>
        </>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={make}
          onChange={(e) => {
            setMake(e.target.value);
            setModel("");
          }}
          aria-label="Marca del carro"
          className={campo()}
        >
          <option value="">Marca…</option>
          {CAR_MAKES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!make}
          aria-label="Modelo del carro"
          className={campo()}
        >
          <option value="">Modelo…</option>
          {modelsForMake(make).map((m) => (
            <option key={m.model} value={m.model}>
              {m.model}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          disabled={!ref}
          aria-label="Año del carro"
          className={campo()}
        >
          {CAR_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Color del carro"
          placeholder="Color — ej. gris"
          className={campo()}
        />
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          aria-label="Placa del carro"
          placeholder="Placa — ej. AB1234"
          autoCapitalize="characters"
          spellCheck={false}
          className={`tnum ${campo()}`}
        />
      </div>

      {ref && rate !== null && l100 !== null && (
        <p className="tnum mt-2.5 rounded-[14px] bg-sol-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-600">
          <b className="font-semibold text-ink-900">
            {ref.make} {ref.model} {year}
          </b>
          {" — consumo de referencia ~"}
          {l100.toFixed(1).replace(".", ",")} L/100 km, o sea{" "}
          <b className="font-semibold text-ink-900">{formatUsd(rate)} por km</b>.
          El tope de tu aporte sale de ahí.
        </p>
      )}

      {!hayCuenta && (
        <p className="mt-3 rounded-[14px] bg-sol-50 px-4 py-3 text-[13px] leading-snug text-ink-600">
          Para guardar tu carro necesitas tu cuenta — la creas al final del
          viaje y no pierdes nada de lo que llevas escrito.
        </p>
      )}

      {tocado && hayCuenta && !listo && (
        <p
          role="alert"
          className="mt-2.5 flex items-start gap-2 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13.5px] leading-snug text-danger"
        >
          <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
          {!ref
            ? "Escoge marca y modelo — de ahí sale tu costo por kilómetro."
            : color.trim().length < 3
              ? "Falta el color: es lo primero que se busca en el punto."
              : "Falta la placa. No se muestra en público — solo la ve quien ya tiene su puesto confirmado."}
        </p>
      )}

      <button
        type="button"
        onClick={guardar}
        disabled={!listo}
        className="cta-naranja mt-3 flex h-[50px] w-full items-center justify-center rounded-full px-6 font-display text-[15.5px] font-bold"
      >
        Guardar mi carro
      </button>

      <p className="mt-2 text-[12px] leading-snug text-ink-400">
        La placa no se muestra en público: solo la ve el pasajero que ya tiene
        su puesto confirmado, para reconocerte en el punto.
      </p>
    </div>
  );
}

function campo() {
  return [
    "w-full appearance-none rounded-[14px] border-[1.5px] border-ink-200 bg-white",
    "px-3.5 py-2.5 text-[14.5px] font-semibold text-ink-900 transition-colors",
    "placeholder:font-normal placeholder:text-ink-400",
    "hover:border-sol-300 focus:border-sol-600 focus:ring-4 focus:ring-sol-100 focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");
}

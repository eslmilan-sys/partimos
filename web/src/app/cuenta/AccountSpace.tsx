"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AuthDialog } from "@/components/site/AuthDialog";
import {
  bookingKey,
  carsOf,
  useSession,
  type Booking,
  type PublishedTrip,
  type SavedCar,
} from "@/lib/session";
import { ChatThread } from "@/components/trip/ChatThread";
import {
  getVerificationState,
  isSupabaseConfigured,
  abrirVerificacion,
  type DocKind,
  type VerificationState,
} from "@/lib/didit";
import { connectLinkedIn, hasLinkedIn } from "@/lib/linkedin";
import { getSupabase } from "@/lib/supabase";
import { useHydrated } from "@/lib/lastsearch";
import { PayChannelPicker } from "@/components/ui/PayChannelPicker";
import { ALL_CITIES, buildRoute } from "@/lib/corridors";
import { computePriceCap, formatUsd } from "@/lib/pricing";
import { formatDayLabel, formatTime, localIso } from "@/lib/trips";
import { RutinaDaysPicker, DAY_CHIPS } from "@/components/ui/RutinaDays";
import { TRIPS_ARE_DEMO } from "@/lib/config";
import {
  CAR_MAKES,
  CAR_YEARS,
  agedConsumption,
  findCar,
  modelsForMake,
  rateFromConsumption,
} from "@/lib/cars";

/**
 * ESPACE COMPTE
 *
 * Quatre onglets, qui correspondent aux quatre tables où vit un utilisateur :
 * ses réservations, son profil, ses véhicules, sa vérification d'identité.
 *
 * Déconnecté, la page ne redirige pas : elle explique ce qu'on y trouve et
 * propose d'entrer. Une redirection sèche vers l'accueil fait perdre le fil à
 * qui a cliqué exprès sur « Mi cuenta ».
 */

type Tab = "viajes" | "perfil" | "carro" | "verificacion";

const TABS_VALIDOS: Tab[] = ["viajes", "perfil", "carro", "verificacion"];

/**
 * L'onglet demandé par l'adresse — `?panel=verificacion`.
 *
 * Le formulaire de publication envoie ici quand il manque la cédula, le
 * permis ou le carro… et on atterrissait sur « Mis viajes ». Le bouton
 * disait « Verificar » et menait ailleurs : la personne devait deviner
 * qu'il fallait encore chercher un onglet.
 */
function panelDeLaUrl(): Tab | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search).get("panel");
  return TABS_VALIDOS.includes(p as Tab) ? (p as Tab) : null;
}

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "viajes", label: "Mis viajes", icon: "route" },
  { id: "perfil", label: "Mi perfil", icon: "users" },
  { id: "carro", label: "Mi carro", icon: "car" },
  { id: "verificacion", label: "Verificación", icon: "shield" },
];

export function AccountSpace() {
  const { session, isDemo, signOut } = useSession();
  /* DÉRIVÉ : ce que la personne a choisi, sinon ce que l'adresse demande,
     sinon « Mis viajes ». L'adresse ne s'applique qu'après hydratation —
     le HTML pré-rendu montre toujours le premier onglet. */
  const [tabChoice, setTab] = useState<Tab | null>(null);
  const [panelPedido] = useState<Tab | null>(panelDeLaUrl);
  const hydrated = useHydrated();
  const tab: Tab = tabChoice ?? (hydrated ? (panelPedido ?? "viajes") : "viajes");

  if (!session) {
    return (
      <Container className="pt-10">
        <div className="mx-auto max-w-[520px] rounded-[20px] border border-ink-200 bg-white p-7">
          <h1 className="mb-2 font-display text-[26px] font-extrabold tracking-[-0.03em]">
            Tu cuenta
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-500">
            Aquí ves tus viajes reservados y publicados, tu perfil, tu carro y
            el estado de tu verificación. Conectarte toma diez segundos: te
            mandamos un código por SMS, sin contraseña.
          </p>

          <ul className="mb-6 grid gap-2.5">
            {TABS.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-[14px] bg-ink-50 px-4 py-3 text-[14.5px] font-medium"
              >
                <Icon name={t.icon} className="size-5 shrink-0 text-ink-500" />
                {t.label}
              </li>
            ))}
          </ul>

          <AuthDialog
            trigger={
              <button className="w-full rounded-[14px] bg-ink-900 px-7 py-4 font-display text-[17px] font-bold text-white transition-colors hover:bg-ink-800">
                Conectarme o crear cuenta
              </button>
            }
          />
          <p className="mt-4 text-center text-[13.5px] text-ink-500">
            Buscar viajes y calcular el aporte no necesita cuenta.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="pt-6">
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-[20px] border border-ink-200 bg-white p-5">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full font-display text-[22px] font-bold text-ink-50 bg-ink-900"
        >
          {session.firstName.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.03em]">
            Hola, {session.firstName}
          </h1>
          <p className="tnum text-[13.5px] text-ink-500">{session.contact}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-[14px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[14.5px] font-semibold transition-colors hover:border-accent hover:text-accent-ink"
        >
          Salir
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Secciones de la cuenta"
        className="mb-5 flex gap-1.5 overflow-x-auto pb-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border-[1.5px] px-4 py-2.5 text-[14.5px] font-semibold transition-colors ${
              tab === t.id
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 bg-white text-ink-500 hover:border-accent"
            }`}
          >
            <Icon name={t.icon} className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="rounded-[20px] border border-ink-200 bg-white p-5 sm:p-6"
      >
        {tab === "viajes" && (
          <>
            <RutinaCard />
            {(session.bookings?.length ?? 0) > 0 && (
              <BookingsList bookings={session.bookings!} />
            )}
            {(session.published?.length ?? 0) > 0 ? (
              <PublishedList published={session.published!} />
            ) : (
              (session.bookings?.length ?? 0) === 0 && (
                <Empty
                  icon="route"
                  title="Todavía no tienes viajes"
                  body="Cuando reserves un puesto o publiques un viaje, aparecen aquí con la hora, el punto de recogida y el chat para coordinar."
                  actions={
                    <>
                      <ButtonLink href="/ya">Buscar un viaje</ButtonLink>
                      <ButtonLink href="/publicar/nuevo" variant="secondary">
                        Publicar un viaje
                      </ButtonLink>
                    </>
                  }
                />
              )
            )}
          </>
        )}

        {tab === "perfil" && (
          <>
            <h2 className="mb-4 font-display text-[19px] font-bold">
              Mi perfil
            </h2>
            <dl className="grid gap-3">
              <Field
                label="Nombre"
                value={`${session.firstName} ${session.lastName}`.trim()}
                note={`En público apareces como ${session.firstName} ${session.lastInitial}.`}
              />
              <Field
                label="Contacto"
                value={session.contact}
                note="No es público hasta que tengas una reserva confirmada"
              />
              <Field
                label="Trabajo o universidad"
                value={session.affiliation ?? "Sin conectar"}
                note="Da una insignia y un filtro de búsqueda, no privilegios"
              />
              <Field label="Ciudad" value="Sin definir" />
              <Field label="Sobre mí" value="Sin definir" />
            </dl>

            <PayPrefRow />

            <LinkedInRow />

            <p className="mt-4 text-[13.5px] leading-relaxed text-ink-500">
              Tu celular queda oculto hasta que tengas una reserva confirmada.
              Es una regla de la base de datos, no de la pantalla.
            </p>
          </>
        )}

        {tab === "carro" && <CarPanel />}

        {tab === "verificacion" && (
          <>
            <ContrasenaPanel />
            <VerificacionPanel sessionVerified={session.isVerified} />
          </>
        )}
      </div>

      {(isDemo || TRIPS_ARE_DEMO) && (
        <p className="mt-5 text-center text-[12.5px] leading-snug text-ink-500">
          {isDemo
            ? "Modo demostración: esta sesión vive solo en tu navegador y no crea ninguna cuenta. "
            : "Tu cuenta es real. Tus viajes y reservas todavía se guardan en este dispositivo, no en la base — por eso no los verás desde otro teléfono. "}
          <Link
            href="/ayuda"
            className="font-semibold text-accent-ink hover:underline"
          >
            Cómo funcionará de verdad
          </Link>
        </p>
      )}
    </Container>
  );
}

/**
 * Onglet Mi carro — le véhicule se déclare UNE fois, ici.
 *
 * Marque, modèle et année sortent du catalogue : c'est ce qui fixe le taux
 * au km à la publication (un carro qui consomme plus a un tope plus haut —
 * le coût, jamais la demande). La photo rassure le passager qui cherche le
 * bon carro au point de rencontre. Elle est compressée côté client (~800 px
 * JPEG) avant d'entrer en session : en démonstration elle vit dans le
 * navigateur, avec Supabase elle partira dans le bucket Storage `carros`.
 */
function CarPanel() {
  const { session, updateSession } = useSession();
  const cars = carsOf(session);
  const [editing, setEditing] = useState(cars.length === 0);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2020);
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");

  const ref = findCar(make, model);
  const l100 = ref ? agedConsumption(ref.l100, year) : null;
  const rate = l100 !== null ? rateFromConsumption(l100) : null;

  const saveCars = (next: SavedCar[]) => {
    /* `car` reste synchronisé sur le premier : les vieilles sessions et
       tout code qui lirait encore le champ hérité voient la même chose. */
    updateSession({ cars: next, car: next[0] ?? null });
  };

  const addCar = () => {
    saveCars([
      ...cars,
      {
        make,
        model,
        year,
        color: color.trim(),
        plate: plate.trim().toUpperCase(),
        /* PLUS DE PHOTO CHEZ NOUS. Décision du propriétaire : garder les
           photos des carros de nos utilisateurs, c'est se constituer une
           base d'images qu'il faut protéger, expliquer et supprimer sur
           demande — pour un bénéfice qu'un vérificateur certifié rend
           mieux. Ce qui reste est du TEXTE : marca, modelo, año, color y
           placa, assez pour reconnaître le carro au point de rencontre. */
        photoDataUrl: null,
      },
    ]);
    setMake("");
    setModel("");
    setColor("");
    setPlate("");
    setEditing(false);
  };

  return (
    <>
      <h2 className="mb-1.5 font-display text-[19px] font-bold">
        {cars.length === 1 ? "Mi carro" : "Mis carros"}
      </h2>
      <p className="mb-4 text-[14.5px] leading-relaxed text-ink-500">
        Se registran una vez y quedan listos para publicar. Al publicar eliges
        cuál llevas; si tienes uno solo, va ese. El modelo y el año fijan tu
        costo por kilómetro.
      </p>

      {cars.length > 0 && (
        <ul className="mb-5 grid gap-3">
          {cars.map((c, i) => {
            const cRef = findCar(c.make, c.model);
            const cRate = cRef
              ? rateFromConsumption(agedConsumption(cRef.l100, c.year))
              : null;
            return (
              <li
                key={`${c.make}-${c.model}-${c.year}-${i}`}
                className="flex flex-wrap items-center gap-4 rounded-[14px] border border-ink-200 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">
                    {c.make} {c.model} {c.year}
                  </p>
                  <p className="tnum text-[13.5px] text-ink-500 capitalize">
                    {c.color}
                    {c.plate ? ` · ${c.plate}` : ""}
                    {cRate !== null &&
                      ` · $${(cRate / 100).toFixed(2)} por km`}
                  </p>
                </div>
                <button
                  onClick={() => saveCars(cars.filter((_, j) => j !== i))}
                  className="text-[13.5px] font-semibold text-ink-500 transition-colors hover:text-danger"
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
        >
          {cars.length === 0 ? "Registrar mi carro" : "Agregar otro carro"}
        </button>
      ) : (
        <div className={cars.length > 0 ? "border-t border-ink-200 pt-5" : ""}>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel("");
              }}
              aria-label="Marca del carro"
              className={accountSelect()}
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
              className={accountSelect()}
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
              className={accountSelect()}
            >
              {CAR_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Color (gris, blanco…)"
              aria-label="Color del carro"
              className="w-full rounded-[14px] border-[1.5px] border-ink-200 px-3.5 py-2.5 text-[14.5px] font-semibold placeholder:font-normal placeholder:text-ink-400 focus:border-accent focus:outline-none"
            />
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Placa (AB1234)"
              aria-label="Placa del carro"
              maxLength={10}
              className="tnum w-full rounded-[14px] border-[1.5px] border-ink-200 px-3.5 py-2.5 text-[14.5px] font-semibold uppercase placeholder:font-normal placeholder:normal-case placeholder:text-ink-400 focus:border-accent focus:outline-none"
            />
          </div>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-500">
            La placa NO se muestra en público. Solo la ve el pasajero cuando
            su reserva queda confirmada, para reconocer el carro en el punto
            de encuentro.
          </p>

          {ref && l100 !== null && rate !== null && (
            <p className="tnum mt-2.5 rounded-[14px] bg-ink-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-500">
              <b className="font-semibold text-ink-900">
                {make} {model} {year}
              </b>
              {" — consumo de referencia ~"}
              {l100.toFixed(1).replace(".", ",")} L/100 km, o sea{" "}
              <b className="font-semibold text-ink-900">
                ${(rate / 100).toFixed(2)} por km
              </b>
              .
            </p>
          )}

          <p className="mt-4 rounded-[14px] bg-ink-50 px-4 py-3 text-[12.5px] leading-relaxed text-ink-500">
            No te pedimos fotos de tu carro. Con la marca, el modelo, el color
            y la placa alcanza para reconocerte en el punto — y así no
            guardamos ninguna imagen tuya. La placa no aparece en público:
            solo la ve quien ya tiene la reserva confirmada contigo.
          </p>

          <div className="mt-5 flex gap-3">
            <button
              disabled={!ref || plate.trim().length < 4}
              onClick={addCar}
              className="rounded-[14px] bg-ink-900 px-6 py-3 font-display text-[15px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
            >
              Guardar este carro
            </button>
            {cars.length > 0 && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold transition-colors hover:border-accent"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function accountSelect() {
  return [
    "w-full appearance-none rounded-[14px] border-[1.5px] border-ink-200 bg-white",
    "px-3.5 py-2.5 text-[14.5px] font-semibold text-ink-900 transition-colors",
    "hover:border-accent focus:border-accent focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");
}


/**
 * LES PUESTOS RÉSERVÉS — la moitié passager de « Mis viajes ».
 *
 * Chaque reserva arrive ici À L'INSTANT où le panneau de réservation
 * l'écrit, avec son état : `pendiente` (le conducteur a 24 h pour
 * répondre) ou `confirmado`. La ligne renvoie vers la page du viaje —
 * l'endroit où tout se recoordonne.
 */
function BookingsList({ bookings }: { bookings: Booking[] }) {
  const cityName = (slug: string) =>
    ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;
  return (
    <div className="mb-6">
      <h3 className="mb-2.5 font-display text-[16.5px] font-bold">
        Tus puestos reservados
      </h3>
      <ul className="grid gap-2.5">
        {bookings.map((b, i) => (
          <li
            key={`${b.tripId}-${b.boardingAt}-${i}`}
            className="rounded-[14px] border border-ink-200 px-4 py-3"
          >
            {/* Le lien ne couvre PLUS toute la carte : le chat vit dedans,
                et un bouton dans un lien n'est pas cliquable de façon
                fiable — c'est du HTML invalide, et Safari en particulier
                suit le lien au lieu d'ouvrir le fil. */}
            <Link
              href={`/viaje/${b.tripId}?desde=${b.from}&hacia=${b.to}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[10px] transition-colors hover:text-accent-ink"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">
                  {cityName(b.from)} → {cityName(b.to)}
                </span>
                <span className="tnum block text-[12.5px] text-ink-500">
                  {formatDayLabel(localIso(new Date(b.boardingAt)))} ·{" "}
                  {formatTime(b.boardingAt)} · {b.seats}{" "}
                  {b.seats === 1 ? "puesto" : "puestos"} · con {b.driverName}
                </span>
                <span className="block truncate text-[12.5px] text-ink-500">
                  Te recoge: {b.point}
                </span>
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap ${
                  b.status === "confirmado"
                    ? "bg-ink-900 text-white"
                    : "bg-accent-soft text-accent-ink"
                }`}
              >
                {b.status === "confirmado"
                  ? "Confirmado"
                  : "Esperando respuesta"}
              </span>
              <span className="tnum font-display text-[16.5px] font-bold">
                {formatUsd(b.totalCents + b.feeCents)}
              </span>
            </Link>
            <ChatThread
              bookingId={bookingKey(b)}
              otherName={b.driverName.split(" ")[0] ?? b.driverName}
              ruta={`${cityName(b.from)} → ${cityName(b.to)} · ${formatDayLabel(
                localIso(new Date(b.boardingAt)),
              )} ${formatTime(b.boardingAt)}`}
            />
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[12.5px] leading-snug text-ink-500">
        «Esperando respuesta» significa que el conductor tiene 24 horas para
        aceptar. Te avisamos apenas decida — y el cobro sale solo si acepta.
      </p>
    </div>
  );
}

/**
 * LES VIAJES PUBLIÉS + LE COMPTEUR QUI S'EMPILE.
 *
 * Chaque publication ajoute sa ligne, et le bandeau du haut fait la
 * somme du mois : un viaje récurrent pèse chaque occurrence (diario
 * ×30, semanal ×4,3, mensual ×1). Le chiffre est un « hasta » — le
 * prix demandé × puestos offerts, s'ils se llenan — jamais une
 * promesse : c'est ce que le conducteur RÉCUPÈRE de ce qu'il allait
 * dépenser (R5).
 */
const OCCURRENCES_PER_MONTH = {
  "una-vez": 1,
  diario: 30,
  semanal: 4.3,
  mensual: 1,
} as const;

const RECURRENCE_LABEL = {
  "una-vez": "",
  diario: "cada día",
  semanal: "cada semana",
  mensual: "cada mes",
} as const;

function PublishedList({ published }: { published: PublishedTrip[] }) {
  const cityName = (slug: string) =>
    ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;
  const monthlyCents = published.reduce(
    (sum, p) =>
      sum + p.priceCents * p.seats * OCCURRENCES_PER_MONTH[p.recurrence],
    0,
  );

  return (
    <div>
      <div className="mb-4 rounded-[14px] bg-accent-soft px-5 py-4">
        <p className="text-[12.5px] font-bold tracking-[0.12em] text-accent-ink uppercase">
          Recuperas hasta
        </p>
        <p className="tnum font-display text-[32px] leading-tight font-extrabold tracking-[-0.03em] text-accent-ink">
          {formatUsd(Math.round(monthlyCents), { compact: true })}
          <span className="text-[15px] font-bold"> al mes</span>
        </p>
        <p className="text-[12.5px] leading-snug text-accent-ink/80">
          De gasolina y peajes, con los puestos llenos al aporte que pediste.
          Nunca más que eso: es reparto de costos, no un ingreso.
        </p>
      </div>
      <ul className="grid gap-2.5">
        {published.map((p, i) => (
          <li
            key={`${p.from}-${p.to}-${p.date}-${i}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[14px] border border-ink-200 px-4 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">
                {cityName(p.from)} → {cityName(p.to)}
              </span>
              <span className="tnum block text-[12.5px] text-ink-500">
                {formatDayLabel(p.date)} · {p.hour} · {p.seats}{" "}
                {p.seats === 1 ? "puesto" : "puestos"}
                {p.recurrence !== "una-vez" &&
                  ` · ${RECURRENCE_LABEL[p.recurrence]}`}
              </span>
            </span>
            <span className="tnum font-display text-[16.5px] font-bold">
              {formatUsd(p.priceCents)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <ButtonLink href="/publicar/nuevo" variant="secondary">
          Publicar otro viaje
        </ButtonLink>
      </div>
      <p className="mt-3 text-[12.5px] leading-snug text-ink-500">
        Modo demostración: estos viajes viven en tu navegador. Con la base
        conectada, aquí verás también las reservas recibidas, viaje por viaje.
      </p>
    </div>
  );
}

/**
 * LA RUTINA — le trajet qui revient chaque semaine.
 *
 * C'est le mécanisme d'habitude : on déclare une fois « La Chorrera →
 * Panamá, lunes a viernes, 6:15 » et la plateforme le retient. Pour un
 * conducteur, la carte fait le calcul qui séduit : combien il RÉCUPÈRE
 * par mois en publiant cette rutina — « recuperas », jamais « ganas »
 * (R5), et le chiffre sort du tope, donc du coût réel, avec « hasta »
 * parce qu'il suppose les puestos llenos.
 */
function RutinaCard() {
  const { session, updateSession } = useSession();
  const routine = session?.routine ?? null;
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState(routine?.from ?? "panama-city");
  const [to, setTo] = useState(routine?.to ?? "coronado");
  const [days, setDays] = useState<number[]>(routine?.days ?? [1, 2, 3, 4, 5]);
  const [hour, setHour] = useState(routine?.hour ?? "06:15");

  const shown = editing ? { from, to, days, hour } : routine;
  const route = shown ? buildRoute(shown.from, shown.to) : null;

  /* L'estimation : le tope du carro enregistré (ou la catégorie
     estándar), 3 puestos, × jours par semaine × 4,3 semaines. */
  const car = carsOf(session)[0];
  const carRef = car ? findCar(car.make, car.model) : null;
  const rate = carRef
    ? rateFromConsumption(agedConsumption(carRef.l100, car!.year))
    : null;
  const cap = route
    ? computePriceCap(route.distanceKm, route.tollCents, rate ?? "standard", 3)
    : null;
  const monthlyCents =
    cap && shown ? Math.round(cap.maxPriceCents * 3 * shown.days.length * 4.3) : 0;

  const cityName = (slug: string) =>
    ALL_CITIES.find((c) => c.slug === slug)?.shortName ?? slug;

  return (
    <div className="mb-6 rounded-[20px] border border-ink-200 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[16.5px] font-bold">Tu rutina</h3>
        {routine && !editing && (
          <button
            onClick={() => {
              /* Réamorcer depuis la rutina COURANTE : l'état local date
                 du montage, la rutina a pu changer depuis (/ya, autre
                 onglet) — même famille que le bug de publication. */
              setFrom(routine.from);
              setTo(routine.to);
              setDays(routine.days);
              setHour(routine.hour);
              setEditing(true);
            }}
            className="text-[13.5px] font-semibold text-accent-ink hover:underline"
          >
            Cambiar
          </button>
        )}
      </div>

      {!routine && !editing ? (
        <>
          <p className="mt-1 mb-3 text-[14.5px] leading-relaxed text-ink-500">
            El viaje que haces cada semana, declarado una vez: lo publicas o
            lo buscas con un toque, y te avisamos cuando salga un puesto.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="rounded-[14px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[14.5px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
          >
            Crear mi rutina
          </button>
        </>
      ) : editing ? (
        <div className="mt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="Salgo de"
              className={accountSelect()}
            >
              {ALL_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.shortName}
                </option>
              ))}
            </select>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="Voy a"
              className={accountSelect()}
            >
              {ALL_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.shortName}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2.5">
            <RutinaDaysPicker
              days={days}
              hour={hour}
              onDays={setDays}
              onHour={setHour}
            />
          </div>
          <div className="mt-3.5 flex gap-2.5">
            <button
              disabled={from === to || days.length === 0}
              onClick={() => {
                updateSession({ routine: { from, to, days, hour } });
                setEditing(false);
              }}
              className="rounded-[14px] bg-ink-900 px-4 py-2.5 text-[14.5px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-[14px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[14.5px] font-bold transition-colors hover:border-accent"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        routine &&
        route && (
          <>
            <p className="tnum mt-1 text-[15px] font-semibold">
              {cityName(routine.from)} → {cityName(routine.to)}
              <span className="ml-2 font-normal text-ink-500">
                {routine.days
                  .map((d) => DAY_CHIPS.find(([v]) => v === d)?.[1])
                  .join(" ")}{" "}
                · {routine.hour}
              </span>
            </p>
            {monthlyCents > 0 && (
              <p className="tnum mt-2 rounded-[14px] bg-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-accent-ink">
                Publicando esta rutina recuperas hasta{" "}
                <b className="font-display text-[16.5px] font-bold">
                  {formatUsd(monthlyCents, { compact: true })}
                </b>{" "}
                al mes de gasolina y peajes — con 3 puestos llenos, al tope de{" "}
                {carRef ? `tu ${carRef.make} ${carRef.model}` : "un carro estándar"}
                . Nunca más que eso: es reparto de costos, no un ingreso.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Link
                href={`/publicar/nuevo?desde=${routine.from}&hacia=${routine.to}`}
                className="rounded-[14px] bg-ink-900 px-4 py-2.5 text-[14.5px] font-bold text-white transition-colors hover:bg-ink-800"
              >
                Publicar mi rutina
              </Link>
              <Link
                href={`/buscar?desde=${routine.from}&hacia=${routine.to}`}
                className="rounded-[14px] border-[1.5px] border-ink-200 px-4 py-2.5 text-[14.5px] font-bold transition-colors hover:border-accent hover:text-accent-ink"
              >
                Buscar puesto
              </Link>
            </div>
          </>
        )
      )}
    </div>
  );
}

/**
 * Le moyen de paiement favori — choisi à l'inscription, modifiable ici.
 *
 * Il présélectionne le canal à la réservation, rien de plus : les trois
 * moyens restent proposés à chaque reserva, et l'efectivo reste gratuit
 * (R2). Pour qui conduit, la note dit l'essentiel : quel que soit le
 * canal du passager, l'aporte arrive complet.
 */
function PayPrefRow() {
  const { session, updateSession } = useSession();
  const value = session?.payPref ?? "yappy";
  return (
    <div className="mt-4 rounded-[14px] border border-ink-200 px-4 py-3">
      <p className="text-[14.5px] font-semibold">Cómo prefieres pagar</p>
      <p className="mb-3 text-[12.5px] leading-snug text-ink-500">
        Preseleccionamos este medio al reservar. Los tres siguen disponibles
        en cada viaje.
      </p>
      <PayChannelPicker
        idBase="cuenta-pago"
        value={value}
        onChange={(channel) => updateSession({ payPref: channel })}
      />
      <div className="mt-4 border-t border-ink-200 pt-3.5">
        <p className="text-[14.5px] font-semibold">
          Si manejas: cómo aceptas el aporte
        </p>
        <p className="mb-2.5 text-[12.5px] leading-snug text-ink-500">
          El cobro por la app siempre está activo — te llega completo, la
          tarifa la paga el pasajero. Lo de afuera lo decides tú.
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["yappy", "Yappy directo a mi número"],
              ["efectivo", "Efectivo en la mano"],
            ] as const
          ).map(([method, label]) => {
            const accepted = session?.acceptsOutside ?? ["yappy", "efectivo"];
            const active = accepted.includes(method);
            return (
              <button
                key={method}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateSession({
                    acceptsOutside: active
                      ? accepted.filter((m) => m !== method)
                      : [...accepted, method],
                  })
                }
                className={`rounded-full border-[1.5px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
                  active
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-200 text-ink-500 hover:border-accent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {(session?.acceptsOutside ?? ["yappy", "efectivo"]).length === 0 && (
          <p className="mt-2 text-[12.5px] leading-snug text-ink-500">
            Solo por la app: nadie te paga en la mano y todo queda con
            comprobante.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * LinkedIn au profil — une insigne, pas un privilège.
 *
 * Avec Supabase configuré, `linkIdentity` attache l'identité LinkedIn au
 * compte déjà connecté (OTP) et redirige vers l'OAuth. En démonstration,
 * on l'annonce comme à venir — sans le simuler.
 */
function LinkedInRow() {
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    hasLinkedIn().then((v) => {
      if (!cancelled) setConnected(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = async () => {
    setBusy(true);
    setError(null);
    const result = await connectLinkedIn();
    if (result?.error) {
      setBusy(false);
      setError("No se pudo conectar LinkedIn. Intenta de nuevo.");
    }
    // Sin error: el navegador ya va camino a LinkedIn.
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-ink-200 px-4 py-3">
      <Icon name="briefcase" className="size-5 shrink-0 text-ink-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold">
          LinkedIn
          {connected && (
            <span className="ml-2 rounded-full bg-ink-900 px-2 py-0.5 text-[11.5px] font-bold text-white">
              Conectado
            </span>
          )}
        </p>
        <p className="text-[12.5px] leading-snug text-ink-500">
          {connected
            ? "Tu perfil muestra la insignia profesional."
            : "Da una insignia en tu perfil público. No copiamos nada de tu perfil de LinkedIn — solo que está conectado."}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-[12.5px] font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
      {!connected &&
        (isSupabaseConfigured ? (
          <button
            onClick={connect}
            disabled={busy}
            className="rounded-[14px] border-[1.5px] border-ink-200 px-4 py-2 text-[13.5px] font-semibold transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-60"
          >
            {busy ? "Abriendo…" : "Conectar"}
          </button>
        ) : (
          <span className="text-[12.5px] font-semibold text-ink-500">
            Disponible al conectar la base
          </span>
        ))}
    </div>
  );
}

/**
 * Onglet Verificación — la cédula pasa por Didit, nunca por nosotros.
 *
 * Con Supabase configurado, el botón pide a la función Edge `didit-start`
 * una sesión de verificación y redirige al recorrido alojado de Didit ;
 * el veredicto vuelve por webhook y aquí solo se lee un estado. En modo
 * demostración no hay backend : el panel lo dice tal cual, sin fingir.
 */
/**
 * PONERLE UNA CONTRASEÑA A LA CUENTA.
 *
 * Quien entró por un enlace del correo no tiene contraseña: la próxima
 * vez vuelve a depender del correo, que es justo el eslabón que falla
 * (dos envíos por hora, enlaces que vencen). Una contraseña rompe esa
 * dependencia para siempre, y ponerla toma diez segundos — pero solo se
 * puede desde adentro, que es exactamente donde estamos aquí.
 */
function ContrasenaPanel() {
  const [valor, setValor] = useState("");
  const [ver, setVer] = useState(false);
  const [estado, setEstado] = useState<"idle" | "guardando" | "listo">("idle");
  const [error, setError] = useState("");

  if (!isSupabaseConfigured) return null;

  const guardar = async () => {
    if (valor.length < 8) {
      setError("Necesita al menos ocho caracteres.");
      return;
    }
    setError("");
    setEstado("guardando");
    const supabase = getSupabase()!;
    const { error: authError } = await supabase.auth.updateUser({
      password: valor,
    });
    if (authError) {
      setEstado("idle");
      setError("No se pudo guardar. Vuelve a entrar y prueba otra vez.");
      return;
    }
    setEstado("listo");
    setValor("");
  };

  return (
    <section className="mb-4 rounded-[18px] border border-ink-200 p-4">
      <h3 className="font-display text-[16.5px] font-bold">
        Tu contraseña
      </h3>
      <p className="mt-1 mb-3 text-[13.5px] leading-relaxed text-ink-500">
        {estado === "listo"
          ? "Lista. La próxima vez entras con tu correo y tu contraseña, sin esperar ningún correo."
          : "Ponle una contraseña y no vuelves a depender del correo para entrar."}
      </p>
      {estado !== "listo" && (
        <>
          <div className="flex gap-2">
            <input
              type={ver ? "text" : "password"}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="min-w-0 flex-1 rounded-[14px] border border-ink-200 px-3.5 py-2.5 text-[15px] focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              className="shrink-0 px-2 text-[13.5px] font-semibold text-accent-ink hover:underline"
            >
              {ver ? "ocultar" : "ver"}
            </button>
          </div>
          <Button
            className="mt-3"
            onClick={guardar}
            disabled={estado === "guardando" || valor.length < 8}
          >
            {estado === "guardando" ? "Guardando…" : "Guardar mi contraseña"}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

function VerificacionPanel({ sessionVerified }: { sessionVerified: boolean }) {
  return (
    <>
      <h2 className="mb-1.5 font-display text-[19px] font-bold">Verificación</h2>
      <p className="mb-4 text-[14px] leading-relaxed text-ink-500">
        Para viajar de pasajero no hace falta nada de esto. Para publicar
        sí: quien maneja demuestra quién es y que puede conducir.
      </p>
      <ul className="mb-5 grid gap-2.5">
        <Status
          done
          label="Celular o correo confirmado"
          detail="Con el código que usaste para entrar"
        />
      </ul>
      <div className="grid gap-3">
        <DocumentoRow
          kind="cedula"
          titulo="Cédula"
          porQue="Dice quién eres. La verifica Didit, un proveedor certificado."
          yaVerificado={sessionVerified}
        />
        <DocumentoRow
          kind="licencia"
          titulo="Licencia de conducir"
          porQue="Dice que puedes conducir. Solo hace falta si vas a publicar viajes."
        />
      </div>
      <p className="mt-4 rounded-[14px] bg-ink-50 px-4 py-3 text-[13px] leading-relaxed text-ink-500">
        <b className="font-semibold text-ink-900">
          Nunca guardamos tus documentos.
        </b>{" "}
        Ni la foto, ni el número — y en Panamá el número de la licencia es el
        de la cédula, así que tampoco ese. De Didit solo nos llega
        «verificado» o «rechazado».
      </p>
    </>
  );
}

/**
 * UNE LIGNE PAR DOCUMENT.
 *
 * Le même composant sert à la cédula et à la licencia : même parcours
 * Didit, même façon de n'en garder que le verdict. Ce qui change est le
 * workflow appelé et la raison affichée — parce qu'un conducteur a le
 * droit de savoir POURQUOI on lui demande un papier de plus.
 */
function DocumentoRow({
  kind,
  titulo,
  porQue,
  yaVerificado = false,
}: {
  kind: DocKind;
  titulo: string;
  porQue: string;
  yaVerificado?: boolean;
}) {
  const [remote, setRemote] = useState<VerificationState | null>(null);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    getVerificationState(kind).then((state) => {
      if (!cancelled) setRemote(state);
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const status = remote?.status ?? "none";
  const verified = yaVerificado || status === "verified";
  const pending = status === "pending";

  const launch = async () => {
    setLaunching(true);
    setError(null);
    /* Le repli du parcours hébergé, comme partout ailleurs : une session
       liée qui ne s'ouvre pas ne doit pas fermer la porte à une
       vérification qui, elle, marche. */
    const result = await abrirVerificacion(kind);
    if ("url" in result) {
      window.location.assign(result.url);
      return;
    }
    setLaunching(false);
    /* On DIT ce qui a échoué. « Intenta de nuevo en un momento » sur une
       panne de configuration fait réessayer mille fois pour rien — et
       nous prive de la seule information utile pour la réparer. */
    const causa = result.error;
    setError(
      causa === "already_verified"
        ? "Ese documento ya está verificado."
        : causa === "not_configured"
          ? "La verificación todavía no está conectada."
          : causa === "http_401" || causa === "http_403"
            ? "Tu sesión venció. Vuelve a entrar y prueba otra vez."
            : `No se pudo abrir la verificación (${causa}). Escríbenos con ese detalle si sigue igual.`,
    );
  };

  return (
    <div className="rounded-[14px] border border-ink-200 px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          aria-hidden
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
            verified
              ? "bg-ink-900 text-white"
              : pending
                ? "bg-action-soft text-action-ink"
                : "border-2 border-ink-200 text-ink-400"
          }`}
        >
          <Icon name={verified ? "check" : "id"} className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">
            {titulo}
            <span className="sr-only">
              {verified ? " — verificado" : pending ? " — en revisión" : " — pendiente"}
            </span>
          </span>
          <span className="block text-[12.5px] leading-snug text-ink-500">
            {verified
              ? "Verificado"
              : pending
                ? "En revisión — el resultado aparece aquí solo"
                : porQue}
          </span>
        </span>
        {!verified && !pending && isSupabaseConfigured && (
          <button
            onClick={launch}
            disabled={launching}
            className="rounded-[14px] bg-ink-900 px-4 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
          >
            {launching ? "Abriendo…" : "Verificar"}
          </button>
        )}
      </div>
      {!verified && !pending && (
        <p className="mt-2 text-[12.5px] leading-snug text-ink-500">
          {isSupabaseConfigured
            ? "Dos minutos: foto del documento y una selfie, en el recorrido seguro de Didit."
            : "Disponible al conectar la base."}
          {status === "rejected" && " Tu intento anterior no pasó; puedes volver a intentarlo."}
          {status === "expired" && " Tu intento anterior expiró; puedes volver a empezar."}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[12.5px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Empty({
  icon,
  title,
  body,
  actions,
}: {
  icon: IconName;
  title: string;
  body: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="py-4 text-center">
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-ink-50 text-ink-500">
        <Icon name={icon} className="size-6" />
      </span>
      <h2 className="mb-2 font-display text-[19px] font-bold">{title}</h2>
      <p className="mx-auto mb-5 max-w-[46ch] text-[14.5px] leading-relaxed text-ink-500">
        {body}
      </p>
      <div className="flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}

function Field({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-200 pb-2.5 last:border-0">
      <dt className="text-[13.5px] text-ink-500">{label}</dt>
      <dd className="text-right">
        <span className="block text-[15px] font-semibold">{value}</span>
        {note && <span className="block text-[12.5px] text-ink-500">{note}</span>}
      </dd>
    </div>
  );
}

function Status({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-[14px] border border-ink-200 px-4 py-3">
      <span
        aria-hidden
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-ink-900 text-white" : "border-2 border-ink-200"
        }`}
      >
        {done && <Icon name="check" className="size-3.5" />}
      </span>
      <span>
        <span className="block text-[15px] font-semibold">
          {label}
          <span className="sr-only">
            {done ? " — completado" : " — pendiente"}
          </span>
        </span>
        <span className="block text-[13.5px] leading-snug text-ink-500">
          {detail}
        </span>
      </span>
    </li>
  );
}

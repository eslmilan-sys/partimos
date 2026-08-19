"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { irArriba } from "@/lib/navegar";
import { Icon } from "@/components/ui/Icon";
import { GlassIcon, type GlassTone } from "@/components/ui/GlassIcon";
import { LogoMark } from "@/components/site/Logo";
import { useSession } from "@/lib/session";
import { useAhora } from "@/lib/reloj";
import { ALL_CITIES } from "@/lib/corridors";
import { localIso } from "@/lib/trips";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { aParams, type PlaceRef } from "@/lib/place";
import { Hoy } from "./Hoy";

/**
 * INICIO — l'écran d'accueil de l'app, d'après la maquette du
 * propriétaire.
 *
 * Il ne partage PAS la carte de recherche du site, et c'est délibéré :
 * les deux surfaces ne posent pas la même question. Le site doit
 * convaincre quelqu'un qui ne connaît pas le produit, donc sa carte
 * s'entoure d'arguments ; l'app sert quelqu'un qui a déjà décidé, donc
 * la sienne va droit au trajet — d'où à où, quand, combien de puestos.
 *
 * Conséquence technique qu'il faut connaître : les deux cartes portent
 * des `id` de champ DIFFÉRENTS (`app-desde` ici, `desde` sur le site).
 * Les deux existent dans le même HTML servi — le mode app ne masque qu'à
 * l'affichage — et deux `id` identiques casseraient les `label` des deux.
 *
 * Le contrat de navigation reste celui du site :
 * `/buscar?desde=&hacia=&fecha=&puestos=`. Une seule page de résultats,
 * deux portes d'entrée.
 */

/** Les routes les plus demandées, avec leur aporte le plus bas observé.
 *  « desde » n'est pas un prix d'appel : c'est le plancher réel des
 *  trajets publiés sur cette route, et il monte avec la distance et le
 *  véhicule — jamais avec la demande. */
/* Trois routes, trois tons de verre — les mêmes que les trois tuiles de
   la page d'accueil du site. C'est le seul endroit de l'écran d'accueil
   où le geste de marque revient, et c'est voulu : répété sur chaque
   ligne de chaque liste, il cesserait d'être une signature. */
const RUTAS: { from: string; to: string; label: string; desde: number; tono: GlassTone }[] = [
  { from: "panama-city", to: "david", label: "Panamá → David", desde: 15, tono: "naranja" },
  { from: "panama-city", to: "chitre", label: "Panamá → Chitré", desde: 11, tono: "amber" },
  { from: "panama-city", to: "santiago", label: "Panamá → Santiago", desde: 12, tono: "teal" },
];

const nombreCiudad = (slug: string) =>
  ALL_CITIES.find((c) => c.slug === slug)?.name ?? slug;

export function Inicio() {
  const router = useRouter();
  const { session } = useSession();
  const ahora = useAhora();

  const [desde, setDesde] = useState("panama-city");
  const [hacia, setHacia] = useState("");
  const [puestos, setPuestos] = useState(1);

  /* LE LIEU CHOISI, à côté de la ville — et pas à sa place.
     La ville fait le matching (c'est elle que le moteur comprend), le
     lieu porte l'intention. Les garder tous les deux est exactement ce
     qui manquait : « Multiplaza » disparaissait à la seconde où il était
     résolu en « panama-city ». Voir lib/place.ts. */
  const [desdeLugar, setDesdeLugar] = useState<PlaceRef | null>(null);
  const [haciaLugar, setHaciaLugar] = useState<PlaceRef | null>(null);

  const hoy = ahora === null ? "" : localIso(new Date(ahora));
  const [fecha, setFecha] = useState<string | null>(null);
  const fechaUsada = fecha ?? hoy;

  const nombre = session?.firstName?.trim();

  function buscar() {
    if (!hacia) return;
    /* LE LIEU PART DANS L'URL. C'est ce qui lui permet de survivre au
       changement d'écran ET au bouton retour — et accessoirement de se
       partager par WhatsApp, ce qui compte au Panama. Les anciens
       paramètres restent : les liens déjà envoyés continuent de
       marcher. */
    const params = new URLSearchParams({
      desde,
      hacia,
      fecha: fechaUsada,
      puestos: String(puestos),
      ...aParams(desdeLugar, "o"),
      ...aParams(haciaLugar, "d"),
    });
    irArriba();
    router.push(`/buscar?${params}`);
  }

  /* « Hoy, 15 ago » — la date longue ne tient pas dans la moitié d'une
     ligne sur 390 px, et une date tronquée ne se lit pas. */
  const fechaCorta =
    ahora === null
      ? ""
      : fechaUsada === hoy
        ? `Hoy, ${new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short" }).format(new Date(ahora))}`
        : new Intl.DateTimeFormat("es-PA", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(new Date(`${fechaUsada}T12:00:00`));

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pt-[calc(12px+env(safe-area-inset-top))]">
      {/* EN-TÊTE — marque à gauche, avis et compte à droite. */}
      <header className="entra-app flex items-center justify-between gap-3 py-2">
        <span className="flex items-center gap-2">
          <LogoMark gradientId="brand-app" className="h-[26px] w-[22px]" />
          <span className="font-display text-[19px] font-extrabold tracking-[-0.03em]">
            Partimos
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          {/* LA CLOCHE MÈNE À MIS VIAJES — décision du propriétaire, et
              elle est juste : nos seules notifications parlent d'une
              reserva (le conducteur a accepté, un message est arrivé, le
              départ approche). Un écran d'avis séparé qui ne ferait que
              renvoyer vers le viaje serait un détour de plus. */}
          <Link
            href="/cuenta"
            aria-label="Mis viajes y avisos"
            className="flex size-10 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100"
          >
            <Icon name="bell" className="size-[21px]" />
          </Link>
          {/* SANS COMPTE, PAS D'INITIALE INVENTÉE. Un rond vert avec un
              « ? » se lit comme un compte cassé ; une silhouette se lit
              comme « entre ». Le lien est le même — la porte s'occupe du
              reste. */}
          <Link
            href="/cuenta/perfil"
            aria-label={nombre ? "Mi perfil" : "Entrar en mi cuenta"}
            className={`flex size-10 items-center justify-center rounded-full font-display text-[15px] font-bold ${
              nombre
                ? "bg-verde-perfil text-white"
                : "border-[1.5px] border-ink-200 bg-white text-ink-500"
            }`}
          >
            {nombre ? (
              nombre[0].toUpperCase()
            ) : (
              <Icon name="user" className="size-[19px]" />
            )}
          </Link>
        </span>
      </header>

      {/* LE TITRE — le salut d'abord, la question ensuite et en grand.
          Aucun émoji : le jeu d'icônes est au trait, c'est la marque. */}
      <div className="entra-app mt-3" style={{ ["--paso" as string]: 1 }}>
        {nombre && (
          <p className="text-[15.5px] font-semibold text-ink-500">
            ¡Hola, {nombre}!
          </p>
        )}
        {/* UN `p`, PAS UN `h1`. Le HTML servi contient les DEUX accueils —
            le mode app ne masque qu'à l'affichage — et deux `h1` mettraient
            le titre de l'app en concurrence avec celui que Google lit. La
            garde `un seul h1` de verify-app.mjs a attrapé exactement ça. */}
        <p className="mt-0.5 font-display text-[32px] leading-[1.06] font-extrabold tracking-[-0.035em]">
          ¿A dónde
          <br />
          <span className="text-naranja">vas hoy?</span>
        </p>
      </div>

      {/* LA CARTE DE RECHERCHE */}
      <div
        className="entra-app mt-4 rounded-[20px] border border-ink-200 bg-white p-1.5 shadow-card"
        style={{ ["--paso" as string]: 2 }}
      >
        {/* Les deux points reprennent le vocabulaire d'un trajet : un
            point plein d'où l'on part, un anneau où l'on va. C'est la
            même grammaire que la timeline de la fiche viaje. */}
        <div className="flex items-center gap-3 px-3.5 pt-3 pb-2">
          <span className="mt-4 size-[9px] shrink-0 rounded-full bg-verde-ok" />
          <span className="min-w-0 flex-1">
            <label
              htmlFor="app-desde"
              className="block text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase"
            >
              Desde
            </label>
            <CityCombobox
              id="app-desde"
              value={desde}
              lugar={desdeLugar}
              onChange={(slug) => {
                setDesde(slug);
                /* Choisir une VILLE efface le lieu précis : garder
                   « Multiplaza » sous « David » serait un mensonge. */
                setDesdeLugar(null);
              }}
              onPlaceRef={setDesdeLugar}
              variant="desnudo"
            />
          </span>
        </div>

        <div className="mx-3.5 h-px bg-ink-200" />

        <div className="flex items-center gap-3 px-3.5 pt-2 pb-3">
          <span className="mt-4 size-[9px] shrink-0 rounded-full border-[2.5px] border-naranja" />
          <span className="min-w-0 flex-1">
            <label
              htmlFor="app-hacia"
              className="block text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase"
            >
              Hacia
            </label>
            <CityCombobox
              id="app-hacia"
              value={hacia}
              lugar={haciaLugar}
              onChange={(slug) => {
                setHacia(slug);
                setHaciaLugar(null);
              }}
              onPlaceRef={setHaciaLugar}
              variant="desnudo"
              placeholder="¿A dónde quieres ir?"
            />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <label className="flex items-center gap-2.5 rounded-[14px] bg-ink-50 px-3.5 py-2.5">
            <Icon name="calendar" className="size-[18px] shrink-0 text-ink-400" />
            <span className="min-w-0">
              <span className="block text-[11px] text-ink-400">Cuándo</span>
              <input
                type="date"
                aria-label="Fecha del viaje"
                value={fechaUsada}
                min={hoy || undefined}
                onChange={(e) => setFecha(e.target.value)}
                className="peer sr-only"
              />
              <span className="block truncate text-[14px] font-semibold">
                {fechaCorta || "Hoy"}
              </span>
            </span>
          </label>

          <label className="flex items-center gap-2.5 rounded-[14px] bg-ink-50 px-3.5 py-2.5">
            <Icon name="user" className="size-[18px] shrink-0 text-ink-400" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-ink-400">Pasajeros</span>
              <select
                aria-label="Cuántos puestos"
                value={puestos}
                onChange={(e) => setPuestos(Number(e.target.value))}
                className="w-full appearance-none bg-transparent text-[14px] font-semibold outline-none"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "pasajero" : "pasajeros"}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={buscar}
        disabled={!hacia}
        className="cta-naranja entra-app mt-3 flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] font-display text-[16.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
        style={{ ["--paso" as string]: 3 }}
      >
        Buscar viajes
        <Icon name="arrowRight" className="size-[18px]" />
      </button>

      {/* TON PROCHAIN VIAJE — s'il y en a un, il passe avant les rutas :
          un état vrai vaut mieux qu'une suggestion. */}
      <Hoy />

      {/* RUTAS POPULARES */}
      <section
        className="entra-app mt-6 pb-4"
        style={{ ["--paso" as string]: 4 }}
      >
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="font-display text-[16.5px] font-bold">
            Rutas populares
          </h2>
          <Link
            href="/ya"
            className="text-[13.5px] font-semibold text-naranja hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <ul className="grid gap-2">
          {RUTAS.map((r) => (
            <li key={r.label}>
              <Link
                href={`/buscar?desde=${r.from}&hacia=${r.to}&fecha=${fechaUsada}&puestos=1`}
                className="flex items-center gap-3 rounded-[16px] border border-ink-200 bg-white px-3.5 py-3 transition-colors hover:border-naranja"
              >
                <GlassIcon name="route" tone={r.tono} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">
                  {r.label}
                </span>
                <span className="tnum shrink-0 text-[13.5px] text-ink-500">
                  desde{" "}
                  <b className="font-display text-[15px] font-bold text-ink-900">
                    ${r.desde}
                  </b>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-[12px] leading-snug text-ink-400">
          El aporte sube con la distancia y el carro, nunca con la demanda ni
          con la fecha. {nombreCiudad("panama-city")} es tu salida por defecto.
        </p>
      </section>
    </div>
  );
}

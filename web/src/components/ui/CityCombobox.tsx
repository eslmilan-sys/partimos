"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import { ALL_CITIES } from "@/lib/corridors";
import { nearestCity, searchPlaces } from "@/lib/places";
import { retrievePlace } from "@/lib/mapbox";
import { adivinarKind, contextoDe, type PlaceRef } from "@/lib/place";
import {
  searchEverywhere,
  GEOSEARCH_ENABLED,
} from "@/lib/geosearch";
import { Icon } from "@/components/ui/Icon";

/**
 * Saisie de ville au clavier, avec liste filtrée.
 *
 * Une liste déroulante native oblige à connaître d'avance le nom exact et à
 * parcourir sept entrées ; on tape « chit » et on obtient Chitré. La
 * recherche ignore les accents, parce que personne ne tape « Penonomé » avec
 * l'accent sur un clavier de téléphone.
 *
 * `cmdk` fournit le comportement de liste ARIA (rôles, activedescendant,
 * navigation aux flèches). Le réécrire à la main serait trois fois plus de
 * code pour une accessibilité moins sûre.
 */

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type Props = {
  id: string;
  /** Absent en variante `desnudo` : l'app pose son propre libellé et sa
   *  propre pastille, parce que sa carte de recherche n'a pas la même
   *  grammaire visuelle que celle du site. */
  label?: string;
  value: string;
  onChange: (slug: string) => void;
  /** Ville à exclure — on ne va pas d'une ville à elle-même. */
  exclude?: string;
  tone?: "origin" | "destination";
  /** Le LIEU précis choisi (PH, mall, adresse) en plus de sa ville — ou
   *  "" quand une ville nue est choisie. C'est ce qui permet à /ya de
   *  porter l'adresse exacte jusqu'au point de recogida proposé. */
  onPlace?: (place: string, citySlug: string) => void;
  /** LE LIEU CHOISI, tel que la personne l'a choisi.
   *
   *  C'EST LA CORRECTION DU BUG LE PLUS SIGNALÉ. Le champ affichait
   *  `selected?.name`, c'est-à-dire le nom de la VILLE déduite du slug :
   *  on tapait « Multiplaza », on validait, et le champ se redessinait
   *  en « Ciudad de Panamá ». Le lieu était résolu puis jeté à l'écran
   *  même où on venait de le choisir.
   *
   *  Quand cette prop est fournie, c'est ELLE qui s'affiche, et la ville
   *  passe en dessous, en petit. La ville reste la valeur de `value` —
   *  c'est elle qui fait le matching — mais elle n'usurpe plus le
   *  libellé. Voir lib/place.ts. */
  lugar?: PlaceRef | null;
  /** Le lieu choisi, ENTIER. `onPlace` ne rendait qu'un nom et un slug —
   *  assez pour un point de rendez-vous, pas assez pour réafficher le
   *  choix, le classer ou le mettre dans l'URL. */
  onPlaceRef?: (lugar: PlaceRef | null) => void;
  /** `desnudo` retire le libellé, la pastille et le rembourrage : le
   *  champ se glisse alors dans une composition qui les fournit
   *  elle-même. Toute la logique — réouverture au clic, géocodage,
   *  sélection au clavier — reste la même, et c'est tout l'intérêt :
   *  dupliquer ce composant aurait dupliqué ses trois corrections de
   *  bugs. */
  variant?: "completo" | "desnudo";
  placeholder?: string;
};

export function CityCombobox({
  id,
  label,
  lugar,
  onPlaceRef,
  value,
  onChange,
  exclude,
  tone = "origin",
  onPlace,
  variant = "completo",
  placeholder = "Escribe tu ciudad",
}: Props) {
  const desnudo = variant === "desnudo";
  const [open, setOpen] = useState(false);
  /* LE MINUTEUR DE FERMETURE, retenu pour pouvoir l'ANNULER.
     `onBlur` programme la fermeture 120 ms plus tard — le temps qu'un tap
     sur une suggestion aboutisse. Sans référence, ce minuteur survivait au
     retour du doigt : on retouchait le champ, la liste s'ouvrait, et 120 ms
     après le minuteur d'AVANT la refermait. Le champ gardant le focus,
     aucun nouvel événement ne venait jamais la rouvrir : la recherche
     paraissait morte dès le deuxième essai. */
  const cierre = useRef<number>(0);
  const [query, setQuery] = useState("");

  const selected = ALL_CITIES.find((c) => c.slug === value);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return ALL_CITIES.filter((city) => {
      if (city.slug === exclude) return false;
      if (!q) return true;
      return (
        normalize(city.name).includes(q) || normalize(city.province).includes(q)
      );
    });
  }, [query, exclude]);

  /* Les LIEUX connus aussi : taper « multiplaza » ou « machetazo » doit
     marcher — les gens pensent en repères, pas en municipios. Choisir un
     lieu sélectionne sa ville. */
  const placeResults = useMemo(
    () =>
      searchPlaces(query).filter(
        (p) =>
          p.citySlug !== exclude &&
          ALL_CITIES.some((c) => c.slug === p.citySlug),
      ),
    [query, exclude],
  );

  /* LES VRAIS LIEUX, tous : quand ni les villes ni le catalogue ne
     répondent, le géocodeur Mapbox prend le relais — une barriada, un
     restaurant, une école. Chaque résultat est rattaché à la ville
     desservie la plus proche : chercher « Boquete » propose David,
     parce que c'est le corridor qui y mène. Débouncé, annulable,
     silencieux sans jeton. */
  const [remote, setRemote] = useState<PlaceRef[]>([]);

  /* LA MÉMOIRE DU LIEU CHOISI, DANS LE COMPOSANT LUI-MÊME.
     ─────────────────────────────────────────────────────────────────
     Corriger ça dans l'écran d'accueil ne corrigeait qu'UN écran sur
     six : le site, /ya, la publication et le résumé de recherche
     gardaient chacun leur état, et aucun ne rangeait le lieu. Résultat,
     le bug « je tape une adresse exacte et ça affiche la grande ville »
     survivait partout ailleurs — signalé, à juste titre.

     Un composant qui perd l'information qu'on vient de lui donner est
     fautif, quel que soit son appelant. Il la garde donc lui-même. Les
     écrans qui veulent la piloter passent `lugar` et gagnent ; les
     autres n'ont rien à faire. */
  const [elegido, setElegido] = useState<PlaceRef | null>(null);
  /* Si l'écran change la ville de l'extérieur (échange origine/
     destination, retour, valeur par défaut), le lieu mémorisé ne
     correspond plus : on l'oublie plutôt que d'afficher « Multiplaza »
     au-dessus de « David ». */
  const mostrado = lugar ?? (elegido && elegido.citySlug === value ? elegido : null);
  const [resolving, setResolving] = useState<string | null>(null);
  /* Jamais un clic qui ne fait rien : quand un lieu ne peut pas devenir
     une ville (échec de résolution, ou même ville que l'autre champ),
     on le DIT sous le champ au lieu d'avaler le clic. */
  const [notice, setNotice] = useState<string | null>(null);
  const debounce = useRef<number>(0);
  useEffect(() => {
    if (!open || !GEOSEARCH_ENABLED || query.trim().length < 3) return;
    const controller = new AbortController();
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      /* TomTom + LocationIQ + Mapbox en parallèle — voir geosearch.ts. */
      searchEverywhere(query, undefined, controller.signal).then(setRemote);
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(debounce.current);
    };
  }, [query, open]);

  const remoteResults = useMemo(() => {
    if (query.trim().length < 3) return [];
    return remote
      .filter(
        (r) =>
          /* Déjà proposé en ville ou en lieu connu : inutile en double. */
          !results.some((c) => normalize(c.name) === normalize(r.nombre)) &&
          !placeResults.some((p) => normalize(p.name) === normalize(r.nombre)),
      )
      .slice(0, 4);
  }, [remote, query, results, placeResults]);

  /* LE CHOIX D'UN LIEU, ET CE QUI SURVIT AU CLIC.

     La ville devient la valeur du champ, parce que c'est elle que le
     moteur de recherche comprend. Mais le NOM CHOISI part avec, entier,
     par `onPlace`. Sans cette seconde information, choisir « Multiplaza »
     affichait « Ciudad de Panamá » à l'écran suivant : le lieu était
     résolu, puis jeté. La ville est un complément d'adresse, jamais un
     remplaçant — voir l'en-tête de lib/place.ts. */
  const pickRemote = async (r: PlaceRef) => {
    setResolving(r.fuenteId || r.nombre);
    setNotice(null);
    /* Mapbox « suggest » ne rend pas de coordonnées : on les demande au
       clic. Les autres fournisseurs les ont déjà données. */
    const coords =
      r.lat !== null && r.lng !== null
        ? { lat: r.lat, lng: r.lng }
        : r.fuenteId
          ? await retrievePlace(r.fuenteId)
          : null;
    setResolving(null);
    if (!coords) {
      setNotice("No pudimos ubicar ese lugar. Elige una ciudad de la lista.");
      return;
    }
    const city = nearestCity(coords.lat, coords.lng, ALL_CITIES);
    if (city.slug === exclude) {
      setNotice(
        `Ese lugar queda por ${city.name}, que ya es tu otro punto.`,
      );
      return;
    }
    onChange(city.slug);
    onPlace?.(r.nombre, city.slug);
    /* L'OBJET ENTIER, avec les coordonnées enfin résolues : c'est lui
       qui sera réaffiché dans le champ et transporté dans l'URL. */
    const escogido = { ...r, citySlug: city.slug, lat: coords.lat, lng: coords.lng };
    setElegido(escogido);
    onPlaceRef?.(escogido);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* UNE SEULE COLONNE DE TEXTE, comme sur les bons formulaires de
          voyage. La pastille ronde/carrée poussait le libellé 35 px vers
          la droite : dans la même carte, « DESDE » commençait à 55 px
          quand les onglets étaient à 24 et le bouton à 10. Quatre bords
          gauches pour un seul objet — c'est ça qui fait « tas ».
          La pastille passe donc en position ABSOLUE dans la gouttière :
          elle marque toujours l'origine et la destination, mais elle ne
          décale plus rien. */}
      <div
        className={
          desnudo
            ? "relative flex items-center"
            : "relative flex items-center rounded-[14px] px-5 py-3 transition-colors hover:bg-ink-50"
        }
      >
        {!desnudo && (
          <span
            aria-hidden
            className={`absolute top-1/2 left-1.5 size-2.5 -translate-y-1/2 border-[3px] ${
              tone === "origin"
                ? "rounded-full border-accent"
                : "rounded-[4px] border-brand-green-deep"
            }`}
          />
        )}
        <div className="min-w-0 flex-1">
          {!desnudo && label && (
            <label
              htmlFor={id}
              className="block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase"
            >
              {label}
            </label>
          )}
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            autoComplete="off"
            /* CE QUE LA PERSONNE A CHOISI, pas ce qu'on en a déduit.
               `lugar?.nombre` d'abord ; la ville seulement quand aucun
               lieu précis n'a été choisi — c'est-à-dire quand la ville
               EST le choix, le seul cas où l'afficher est honnête. */
            value={open ? query : (mostrado?.nombre ?? selected?.name ?? "")}
            placeholder={placeholder}
            /* ROUVRIR AU CLIC, pas seulement au focus. Après avoir choisi une
               ville, le champ GARDE le focus : le retoucher n'émettait donc
               aucun `focus`, la liste restait fermée pour toujours et la
               recherche paraissait morte dès le deuxième essai. */
            onClick={() => {
              window.clearTimeout(cierre.current);
              setOpen(true);
            }}
            onFocus={() => {
              window.clearTimeout(cierre.current);
              setQuery("");
              setOpen(true);
            }}
            onChange={(e) => {
              /* Écrire ouvre la liste, toujours : c'est le geste qui dit
                 « je cherche ». */
              window.clearTimeout(cierre.current);
              setOpen(true);
              setQuery(e.target.value);
              setNotice(null);
            }}
            onBlur={() => {
              window.clearTimeout(cierre.current);
              cierre.current = window.setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              /* LE bug du téléphone : la touche « intro » du clavier ne
                 sélectionnait RIEN — la liste restait ouverte et le tap
                 suivant tombait dedans, choisissant une ville au hasard.
                 Entrée prend le premier résultat, dans l'ordre d'affichage :
                 ville, puis lieu connu, puis lieu du géocodeur. */
              if (e.key === "Enter" && open) {
                e.preventDefault();
                if (results[0]) {
                  onChange(results[0].slug);
                  onPlace?.("", results[0].slug);
                  onPlaceRef?.(null);
                  setElegido(null);
                  setOpen(false);
                } else if (placeResults[0]) {
                  onChange(placeResults[0].citySlug);
                  onPlace?.(placeResults[0].name, placeResults[0].citySlug);
                  setOpen(false);
                } else if (remoteResults[0]) {
                  void pickRemote(remoteResults[0]);
                }
              }
            }}
            className="w-full border-none bg-transparent py-px text-[16.5px] font-semibold text-ink-900 placeholder:font-medium placeholder:text-ink-500 focus:outline-none"
          />

          {/* LA VILLE SOUS LE LIEU. Elle reste lisible — on veut savoir
              d'où part le viaje — mais en secondaire, parce qu'elle est
              un complément d'adresse et pas l'intention. */}
          {!open && mostrado && mostrado.contexto && (
            <span className="mt-0.5 block truncate text-[12px] leading-tight text-ink-400">
              {mostrado.contexto}
            </span>
          )}
        </div>
        <Icon
          name="search"
          className={`size-4 shrink-0 text-ink-300 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      {open && (
        <Command
          id={`${id}-list`}
          shouldFilter={false}
          className="lista-lugares absolute inset-x-0 top-full mt-1 overflow-hidden rounded-[14px] border border-ink-200 bg-white shadow-lift"
        >
          <Command.List className="max-h-64 overflow-y-auto p-1.5">
            {results.length === 0 &&
              placeResults.length === 0 &&
              remoteResults.length === 0 && (
              <Command.Empty className="px-3 py-3 text-[14.5px] text-ink-500">
                Todavía no llegamos a esa ciudad. Escríbela igual y te avisamos
                cuando abramos la ruta.
              </Command.Empty>
            )}
            {results.map((city) => (
              <Command.Item
                key={city.slug}
                value={city.slug}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => {
                  onChange(city.slug);
                  onPlace?.("", city.slug);
                  onPlaceRef?.(null);
                  setElegido(null);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[15px] data-[selected=true]:bg-ink-50"
              >
                <span className="font-semibold">{city.name}</span>
                <span className="text-[12.5px] text-ink-500">
                  {city.province}
                </span>
              </Command.Item>
            ))}
            {placeResults.map((place) => {
              const placeCity = ALL_CITIES.find(
                (c) => c.slug === place.citySlug,
              )!;
              return (
                <Command.Item
                  key={`place-${place.name}`}
                  value={`place-${place.name}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onChange(place.citySlug);
                    onPlace?.(place.name, place.citySlug);
                    /* LE CATALOGUE LOCAL AUSSI. C'est lui qui rend
                       « Albrook Mall » : sans cette ligne, le lieu le
                       plus sûr de tous était justement celui qui se
                       faisait remplacer par sa ville. */
                    const delCatalogo = {
                      nombre: place.name,
                      kind: adivinarKind(place.name),
                      citySlug: place.citySlug,
                      contexto: contextoDe(place.citySlug),
                      lat: placeCity.lat,
                      lng: placeCity.lng,
                      fuente: "catalogo" as const,
                    };
                    setElegido(delCatalogo);
                    onPlaceRef?.(delCatalogo);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[15px] data-[selected=true]:bg-ink-50"
                >
                  <span className="font-semibold">{place.name}</span>
                  <span className="text-[12.5px] text-ink-500">
                    {placeCity.shortName}
                  </span>
                </Command.Item>
              );
            })}
            {remoteResults.map((r) => (
              <Command.Item
                key={`geo-${r.fuenteId || r.nombre}`}
                value={`geo-${r.fuenteId || r.nombre}`}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => void pickRemote(r)}
                className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[15px] data-[selected=true]:bg-ink-50"
              >
                {/* LA HIÉRARCHIE QUI PORTE L'INTENTION : le nom choisi
                    domine, la ville n'est qu'un complément d'adresse.
                    « Multiplaza » au-dessus, « Panamá · Panamá » en
                    dessous — jamais l'inverse, jamais l'un à la place
                    de l'autre. */}
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {r.nombre}
                  </span>
                  <span className="block truncate text-[12.5px] text-ink-500">
                    {r.contexto}
                  </span>
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold text-accent-ink">
                  {resolving === (r.fuenteId || r.nombre)
                    ? "…"
                    : r.citySlug
                      ? `→ ${(ALL_CITIES.find((c) => c.slug === r.citySlug)?.shortName ?? "")}`
                      : "→ elegir"}
                </span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      )}

      {notice && (
        <p role="alert" className="mt-1.5 px-1 text-[12.5px] font-medium text-danger">
          {notice}
        </p>
      )}
    </div>
  );
}

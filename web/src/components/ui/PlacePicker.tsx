"use client";

import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { Icon } from "@/components/ui/Icon";
import { placesForCity, searchPlaces, KIND_LABELS } from "@/lib/places";
import { searchEverywhere, GEOSEARCH_ENABLED } from "@/lib/geosearch";
import type { PlaceRef } from "@/lib/place";
import { ALL_CITIES } from "@/lib/corridors";
import { nearestCity } from "@/lib/places";
import { retrievePlace } from "@/lib/mapbox";

/**
 * SÉLECTEUR DE LIEU EXACT — « ¿dónde exactamente? »
 *
 * Trois sources, dans l'ordre où elles servent :
 *   1. le CATALOGUE local des lieux connus de la ville (malls, parques,
 *      Machetazo…) — instantané, hors ligne, à la première frappe ;
 *   2. le GÉOCODEUR Mapbox pour tout le reste (une adresse, un coin de
 *      rue), centré sur la ville, si le jeton est là ;
 *   3. la SAISIE LIBRE : ce que l'utilisateur a tapé reste toujours
 *      valable tel quel — un lieu qu'aucune base ne connaît (« frente a
 *      la casa amarilla ») est quand même un rendez-vous panaméen.
 *
 * La valeur est un LIBELLÉ, pas des coordonnées : le produit organise
 * des rencontres entre humains, et les humains se retrouvent sur un nom.
 */

export function PlacePicker({
  id,
  label,
  citySlug,
  value,
  onChange,
  onCityResolved,
  onCoords,
  placeholder = "Escribe el lugar…",
}: {
  id: string;
  label: string;
  citySlug: string;
  value: string;
  onChange: (place: string) => void;
  /** Les COORDONNÉES du lieu choisi, quand on les connaît — c'est ce qui
   *  permet de mesurer le détour au lieu de le faire deviner au passager.
   *  `null` veut dire « on ne sait pas » : l'appelant retombe alors sur
   *  son estimation manuelle. Un lieu tapé à la main n'a pas de point. */
  onCoords?: (coords: { lat: number; lng: number } | null) => void;
  /** Le lieu choisi appartient à une AUTRE ville desservie : l'appelant
   *  peut déplacer la ruta. C'est ce qui fait qu'écrire « Coronado
   *  Escapes » dans le point exact CHANGE la destination — et donc les
   *  paradas, la carte, le tope. */
  onCityResolved?: (citySlug: string) => void;
  placeholder?: string;
}) {
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
  const [remote, setRemote] = useState<PlaceRef[]>([]);
  const debounce = useRef<number>(0);

  const city = ALL_CITIES.find((c) => c.slug === citySlug);
  const local = placesForCity(citySlug).filter(
    (p) =>
      !query.trim() ||
      p.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(
          query
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        ),
  );

  /* Géocodage débouncé : une requête au repos de la frappe, jamais une
     par touche. L'AbortController coupe la requête périmée. */
  useEffect(() => {
    /* Sous le seuil ou fermé : rien à chercher. L'affichage est DÉRIVÉ
       (remoteShown) — pas de setState de purge ici, React 19 le refuse
       à raison : un setState synchrone dans l'effet recasque un rendu. */
    if (!open || !GEOSEARCH_ENABLED || query.trim().length < 3) return;
    const controller = new AbortController();
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      const near = city ? { lat: city.lat, lng: city.lng } : undefined;
      /* TomTom + LocationIQ + Mapbox en parallèle : le lieu n'a besoin
         d'exister que dans UNE des trois bases pour sortir. */
      searchEverywhere(query, near, controller.signal, citySlug).then(setRemote);
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(debounce.current);
    };
  }, [query, open, city, citySlug]);

  const remoteShown = query.trim().length >= 3 ? remote : [];

  /* Les lieux connus des AUTRES villes desservies : « El Rey de
     Coronado » tapé depuis un trajet vers Chitré doit sortir, avec sa
     ville — le choisir déplace la ruta (onCityResolved), catalogue
     local, zéro réseau. */
  const elsewhere =
    onCityResolved && query.trim().length >= 3
      ? searchPlaces(query)
          .filter((p) => p.citySlug !== citySlug)
          .slice(0, 3)
      : [];

  /* Un lieu du catalogue n'a pas de coordonnées propres, mais il est
     NOTOIRE dans sa ville : le centre de la ville est la meilleure
     approximation qu'on ait, et elle est bonne — ces repères sont sur le
     chemin, pas au bout d'une route de terre. */
  const cityCoords = (slug: string) => {
    const c = ALL_CITIES.find((x) => x.slug === slug);
    return c ? { lat: c.lat, lng: c.lng } : null;
  };

  const pick = (place: string, coords: { lat: number; lng: number } | null) => {
    onChange(place);
    onCoords?.(coords);
    setOpen(false);
  };

  /* Un lieu du géocodeur : ses coordonnées disent SA ville. Si elle n'est
     pas celle du champ, on prévient l'appelant — la ruta suit le lieu. */
  const pickRemote = async (r: PlaceRef) => {
    /* `null` veut dire « on ne sait pas où c'est », pas « à l'équateur » :
       Mapbox suggest rend les noms sans point, on le demande au clic. */
    const coords =
      r.lat !== null && r.lng !== null
        ? { lat: r.lat, lng: r.lng }
        : r.fuenteId
          ? await retrievePlace(r.fuenteId)
          : null;
    if (coords && onCityResolved) {
      const cityOfPlace = nearestCity(coords.lat, coords.lng, ALL_CITIES);
      if (cityOfPlace.slug !== citySlug) onCityResolved(cityOfPlace.slug);
    }
    pick(r.nombre, coords);
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase"
      >
        {label}
      </label>
      <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-ink-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-accent">
        <Icon name="pin" className="size-4 shrink-0 text-ink-400" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          value={open ? query : value}
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
            setQuery(value);
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            /* La frappe EST la valeur : pas besoin de choisir dans la
               liste pour que le texte compte. */
            onChange(e.target.value);
            /* …mais retaper ANNULE le point mesuré : le texte ne
               correspond plus aux coordonnées d'avant. */
            onCoords?.(null);
          }}
          onBlur={() => {
            window.clearTimeout(cierre.current);
            cierre.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            /* La touche « intro » du clavier du téléphone valide le
               premier résultat — même remède que le sélecteur de villes. */
            if (e.key === "Enter" && open) {
              e.preventDefault();
              if (local[0]) pick(local[0].name, cityCoords(citySlug));
              else if (elsewhere[0]) {
                onCityResolved?.(elsewhere[0].citySlug);
                pick(elsewhere[0].name, cityCoords(elsewhere[0].citySlug));
              } else if (remoteShown[0]) void pickRemote(remoteShown[0]);
              else if (query.trim()) pick(query.trim(), null);
            }
          }}
          className="w-full border-none bg-transparent text-[14.5px] font-semibold placeholder:font-normal placeholder:text-ink-400 focus:outline-none"
        />
      </div>

      {open && query.trim().length > 0 && (
        <Command
          id={`${id}-list`}
          shouldFilter={false}
          className="lista-lugares absolute inset-x-0 top-full mt-1 overflow-hidden rounded-[14px] border border-ink-200 bg-white shadow-lift"
        >
          <Command.List className="max-h-60 overflow-y-auto p-1.5">
            {local.map((p) => (
              <Command.Item
                key={`local-${p.name}`}
                value={`local-${p.name}`}
                onMouseDown={(e) => e.preventDefault()}
                onSelect={() => pick(p.name, cityCoords(citySlug))}
                className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] data-[selected=true]:bg-ink-50"
              >
                <span className="font-semibold">{p.name}</span>
                <span className="shrink-0 text-[12.5px] text-ink-500">
                  {KIND_LABELS[p.kind]}
                </span>
              </Command.Item>
            ))}
            {elsewhere.map((p) => {
              const placeCity = ALL_CITIES.find((c) => c.slug === p.citySlug);
              return (
                <Command.Item
                  key={`otra-${p.citySlug}-${p.name}`}
                  value={`otra-${p.citySlug}-${p.name}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onCityResolved?.(p.citySlug);
                    pick(p.name, cityCoords(p.citySlug));
                  }}
                  className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] data-[selected=true]:bg-ink-50"
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="shrink-0 text-[12.5px] font-semibold text-accent-ink">
                    → {placeCity?.shortName ?? p.citySlug}
                  </span>
                </Command.Item>
              );
            })}
            {remoteShown
              .filter((r) => !local.some((l) => l.name === r.nombre))
              .map((r) => (
                <Command.Item
                  key={`geo-${r.nombre}-${r.contexto}`}
                  value={`geo-${r.nombre}-${r.contexto}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => void pickRemote(r)}
                  className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] data-[selected=true]:bg-ink-50"
                >
                  <span className="font-semibold">{r.nombre}</span>
                  <span className="min-w-0 shrink truncate text-[12.5px] text-ink-500">
                    {r.contexto}
                  </span>
                </Command.Item>
              ))}
            {/* La saisie libre, en clair : un lieu qu'aucune base ne
                connaît reste un rendez-vous valable. */}
            <Command.Item
              key="libre"
              value="libre"
              onMouseDown={(e) => e.preventDefault()}
              onSelect={() => pick(query.trim(), null)}
              className="flex cursor-pointer items-baseline justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] data-[selected=true]:bg-ink-50"
            >
              <span className="font-semibold">
                Usar «{query.trim()}» tal cual
              </span>
              <span className="shrink-0 text-[12.5px] text-ink-500">
                Punto libre
              </span>
            </Command.Item>
          </Command.List>
        </Command>
      )}
    </div>
  );
}

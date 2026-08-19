"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ALL_CITIES } from "@/lib/corridors";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatDayLabel, localIso, SEARCH_HORIZON_DAYS } from "@/lib/trips";

/**
 * Résumé de recherche collant, ouvrant une feuille d'édition.
 *
 * C'est le motif des applications de voyage, et il tient à une raison :
 * sur une page de résultats, la recherche doit rester LISIBLE en permanence
 * (« qu'est-ce que je regarde ? ») mais ne pas occuper l'écran. Un formulaire
 * complet en haut de liste mange la moitié d'un téléphone.
 */

type Criteria = { from: string; to: string; date: string; seats: number };

function nextDays(count = SEARCH_HORIZON_DAYS) {
  const out: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = localIso(d);
    out.push({ value, label: formatDayLabel(value) });
  }
  return out;
}

export function SearchSummary({
  criteria,
  onApply,
}: {
  criteria: Criteria;
  onApply: (next: Criteria) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(criteria);
  const days = nextDays();

  const from = ALL_CITIES.find((c) => c.slug === criteria.from);
  const to = ALL_CITIES.find((c) => c.slug === criteria.to);
  const sameCity = draft.from === draft.to;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(criteria);
        setOpen(next);
      }}
    >
      {/* Verre et non blanc opaque : les cartes de résultats passent
          derrière en défilant, comme sous la barre de navigation — deux
          objets flottants, une seule matière. Le liseré bleu reste : c'est
          lui qui dit « ceci se modifie ». */}
      <Dialog.Trigger className="glass liquid flex w-full items-center gap-3 rounded-[14px] border-[1.5px] border-accent px-4 py-3 text-left transition-colors hover:bg-white">
        <Icon name="search" className="size-5 shrink-0 text-ink-500" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[16.5px] font-bold tracking-[-0.02em]">
            {from?.shortName} → {to?.shortName}
          </span>
          <span className="block truncate text-[13.5px] text-ink-500">
            {formatDayLabel(criteria.date)} ·{" "}
            {criteria.seats === 1
              ? "1 pasajero"
              : `${criteria.seats} pasajeros`}
          </span>
        </span>
        <span className="shrink-0 text-[13.5px] font-semibold text-accent-ink">
          Cambiar
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-night-950/55 motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[120] max-h-[92vh] overflow-y-auto rounded-t-[28px] glass liquid [--glass-alpha:0.93] p-5 shadow-float motion-safe:animate-[sheet-in_0.24s_cubic-bezier(0.2,0.9,0.3,1)] sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:w-[min(480px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="font-display text-[24px] font-extrabold tracking-[-0.035em]">
              ¿A dónde vas?
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar"
              className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <Icon name="cross" className="size-4.5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Cambia el origen, el destino, la fecha o el número de pasajeros.
          </Dialog.Description>

          <div className="relative rounded-[20px] border border-ink-200">
            <CityCombobox
              id="sheet-desde"
              label="Desde"
              value={draft.from}
              exclude={draft.to}
              tone="origin"
              onChange={(slug) => setDraft((d) => ({ ...d, from: slug }))}
            />
            {/* Inverser en un geste : le retour est la moitié des recherches,
                le retaper en deux listes était la vraie friction. */}
            <button
              type="button"
              aria-label="Invertir origen y destino"
              onClick={() =>
                setDraft((d) => ({ ...d, from: d.to, to: d.from }))
              }
              className="absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition-colors hover:border-accent hover:text-accent-ink"
            >
              <Icon name="swap" className="size-4" />
            </button>
            <div className="border-t border-ink-200">
              <CityCombobox
                id="sheet-hacia"
                label="Hacia"
                value={draft.to}
                exclude={draft.from}
                tone="destination"
                onChange={(slug) => setDraft((d) => ({ ...d, to: slug }))}
              />
            </div>
            <div className="flex border-t border-ink-200">
              <label className="flex flex-1 items-center gap-3 px-3.5 py-3">
                <Icon
                  name="calendar"
                  className="size-[19px] shrink-0 text-ink-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                    Fecha
                  </span>
                  <select
                    value={draft.date}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, date: e.target.value }))
                    }
                    className="w-full cursor-pointer appearance-none border-none bg-transparent text-[16.5px] font-semibold focus:outline-none"
                  >
                    {days.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="flex max-w-[140px] items-center gap-3 border-l border-ink-200 px-3.5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
                    Pasajeros
                  </span>
                  <select
                    value={draft.seats}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, seats: Number(e.target.value) }))
                    }
                    className="w-full cursor-pointer appearance-none border-none bg-transparent text-[16.5px] font-semibold focus:outline-none"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
          </div>

          {/* LA DERNIÈRE CARTE DE L'APPLICATION A ÉTÉ RETIRÉE.

              Elle servait à choisir origine et destination en tapant sur
              des villes, avec un état invisible « je choisis laquelle ? »
              qui alternait tout seul. Les deux champs au-dessus font la
              même chose en le disant. Aucune carte ne subsiste nulle
              part — vérifié par la batterie des lieux. */}

          {sameCity && (
            <p
              role="alert"
              className="mt-3 text-[13.5px] font-medium text-danger"
            >
              El origen y el destino no pueden ser el mismo.
            </p>
          )}

          <Button
            size="lg"
            full
            className="mt-4"
            disabled={sameCity || !draft.from || !draft.to}
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Buscar
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

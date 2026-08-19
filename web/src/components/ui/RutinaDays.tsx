"use client";

/**
 * L'ORGANE « QUELS JOURS, À QUELLE HEURE » — partagé.
 *
 * La rutina s'édite à deux endroits (/ya et Mi cuenta) et l'audit a montré
 * deux UI qui divergeaient à force de copies. Un seul organe : les mêmes
 * pastilles de jours, le même champ d'heure, le même comportement — les
 * boutons Guardar/Cancelar restent aux appelants, eux seuls savent où
 * écrire.
 */

export const DAY_CHIPS = [
  [1, "L"],
  [2, "M"],
  [3, "X"],
  [4, "J"],
  [5, "V"],
  [6, "S"],
  [7, "D"],
] as const;

export function RutinaDaysPicker({
  days,
  hour,
  onDays,
  onHour,
}: {
  days: number[];
  hour: string;
  onDays: (days: number[]) => void;
  onHour: (hour: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DAY_CHIPS.map(([value, label]) => {
        const active = days.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={
              ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"][value]
            }
            onClick={() =>
              onDays(
                active
                  ? days.filter((x) => x !== value)
                  : [...days, value].sort(),
              )
            }
            className={`flex size-9 items-center justify-center rounded-full border-[1.5px] text-[13.5px] font-bold transition-colors ${
              active
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 text-ink-500 hover:border-accent"
            }`}
          >
            {label}
          </button>
        );
      })}
      <input
        type="time"
        value={hour}
        onChange={(e) => onHour(e.target.value)}
        aria-label="Hora de salida"
        className="tnum ml-1 rounded-[10px] border-[1.5px] border-ink-200 px-2.5 py-1.5 text-[14.5px] font-semibold focus:border-accent focus:outline-none"
      />
    </div>
  );
}

"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * Formulaire de préinscription — la boucle de croissance du §7 du brief.
 *
 * Toute recherche sans résultat écrit une ligne dans `demand_signals`, qui
 * sert à la fois à alerter les conducteurs du corridor (« 3 personas buscan
 * Panamá → Chitré el viernes ») et à décider quel corridor ouvrir ensuite.
 * C'est le mécanisme qui résout le démarrage à froid.
 */

type Props = {
  originSlug: string;
  destinationSlug: string;
  corridorSlug?: string;
  requestedDate: string;
  seats?: number;
  source: string;
  /** Variante sur fond sombre. */
  onDark?: boolean;
};

type State = "idle" | "sending" | "done" | "error";

/**
 * L'export statique n'a pas de route d'API. Le formulaire le dit au lieu de
 * poster dans le vide et d'afficher une erreur technique.
 */
const IS_STATIC_PREVIEW = process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1";

export function AvisameForm({
  originSlug,
  destinationSlug,
  corridorSlug,
  requestedDate,
  seats = 1,
  source,
  onDark = false,
}: Props) {
  const id = useId();
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;

    // Validation permissive : un numéro panaméen tient en 7 ou 8 chiffres,
    // avec ou sans +507, avec ou sans tiret. On refuse ce qui ne peut pas
    // être un numéro, pas ce qui n'est pas mis en forme comme on l'espère.
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 13) {
      setState("error");
      setMessage("Escribe un número de celular válido, por ejemplo 6123-4567.");
      return;
    }

    if (IS_STATIC_PREVIEW) {
      setState("error");
      setMessage(
        "Esta es una vista previa: el número no se guarda todavía. En la versión publicada, aquí te confirmamos el aviso.",
      );
      return;
    }

    setState("sending");
    try {
      const response = await fetch("/api/demanda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits,
          originSlug,
          destinationSlug,
          corridorSlug,
          requestedDate,
          seats,
          source,
        }),
      });

      if (!response.ok) throw new Error(String(response.status));
      setState("done");
    } catch {
      setState("error");
      setMessage(
        "No pudimos guardar tu número. Inténtalo otra vez en un momento.",
      );
    }
  }

  if (state === "done") {
    return (
      <p
        role="status"
        className={`flex items-start gap-2.5 rounded-[14px] px-4 py-3.5 text-[14.5px] leading-relaxed ${
          onDark ? "bg-white/8 text-ink-200" : "bg-ink-50 text-ink-500"
        }`}
      >
        <Icon
          name="check"
          className={`mt-0.5 size-[18px] shrink-0 ${onDark ? "text-white" : "text-ink-900"}`}
        />
        <span>
          Listo. Te escribimos por WhatsApp apenas alguien publique este viaje.
          No te vamos a mandar nada más.
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={id} className="sr-only">
            Tu número de celular
          </label>
          <div
            className={`flex items-center gap-2.5 rounded-[14px] border px-3.5 py-3 ${
              onDark
                ? "border-white/15 bg-white/6 focus-within:border-accent"
                : "border-ink-200 bg-white focus-within:border-accent"
            }`}
          >
            <Icon
              name="phone"
              className={`size-[18px] shrink-0 ${onDark ? "text-night-200" : "text-ink-500"}`}
            />
            <input
              id={id}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="6123-4567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (state === "error") setState("idle");
              }}
              aria-invalid={state === "error"}
              aria-describedby={state === "error" ? `${id}-error` : undefined}
              className={`tnum w-full border-none bg-transparent text-[16.5px] font-semibold focus:outline-none ${
                onDark
                  ? "text-white placeholder:text-night-300"
                  : "text-ink-900 placeholder:text-ink-500"
              }`}
            />
          </div>
        </div>
        <Button
          type="submit"
          variant={onDark ? "onDark" : "primary"}
          disabled={state === "sending"}
        >
          {state === "sending" ? "Guardando…" : "Avísame"}
        </Button>
      </div>

      {state === "error" && (
        <p
          id={`${id}-error`}
          role="alert"
          className={`text-[13.5px] font-medium ${onDark ? "text-[#FF9C90]" : "text-danger"}`}
        >
          {message}
        </p>
      )}

      <p
        className={`text-[12.5px] leading-relaxed ${onDark ? "text-night-200" : "text-ink-500"}`}
      >
        Solo lo usamos para avisarte de este viaje. Nada de publicidad.
      </p>
    </form>
  );
}

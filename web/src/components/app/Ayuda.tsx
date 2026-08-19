"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { HELP_FAQ } from "@/lib/content";

/**
 * AYUDA — l'écran, version app.
 *
 * Une page d'aide sur un site se parcourt ; dans une app, on y arrive
 * avec UNE question précise et souvent pressée. D'où le champ de
 * filtre en haut : il ne cherche pas sur le web, il réduit la liste à
 * mesure qu'on tape, sur la question ET sur la réponse — parce qu'on se
 * souvient rarement du titre exact, mais souvent d'un mot du contenu.
 *
 * Les réponses viennent de `HELP_FAQ`, la même source que le site. Les
 * recopier ici aurait garanti que les deux divergent au premier
 * changement de règle.
 */

/** `\u0300-\u036f` est le bloc des diacritiques combinants : après
 *  `NFD`, « á » devient « a » + l'accent, et on jette l'accent. */
const sinAcentos = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function Ayuda() {
  const [q, setQ] = useState("");

  /* Sans accents des deux côtés : personne ne tape « cuánto » avec
     l'accent sur un clavier de téléphone, et une recherche qui ne
     trouve rien pour cette raison passe pour cassée. */
  const aguja = sinAcentos(q.trim());
  const visibles = aguja
    ? HELP_FAQ.filter(
        (f) => sinAcentos(f.q).includes(aguja) || sinAcentos(f.a).includes(aguja),
      )
    : HELP_FAQ;

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-4">
      <p className="font-display text-[28px] leading-[1.08] font-extrabold tracking-[-0.035em]">
        Ayuda
      </p>
      <p className="mt-1.5 text-[13.5px] leading-snug text-ink-500">
        Y si falta algo, escríbenos: contestan personas, no un formulario.
      </p>

      <label className="mt-4 flex items-center gap-2.5 rounded-[16px] border border-ink-200 bg-white px-3.5 py-3">
        <Icon name="search" className="size-[18px] shrink-0 text-ink-400" />
        <span className="sr-only">Buscar en la ayuda</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="¿Qué quieres saber?"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-400"
        />
      </label>

      {visibles.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-ink-200 bg-white px-5 py-7 text-center">
          <p className="font-display text-[16px] font-bold">
            Nada con esas palabras
          </p>
          <p className="mx-auto mt-1.5 max-w-[32ch] text-[13.5px] leading-relaxed text-ink-500">
            Escríbenos y te contestamos — es más rápido que seguir buscando.
          </p>
        </div>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-[18px] border border-ink-200 bg-white">
          {visibles.map((f, i) => (
            <li key={f.q} className={i > 0 ? "border-t border-ink-100" : ""}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 font-display text-[14.5px] font-bold [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">{f.q}</span>
                  <span
                    aria-hidden
                    className="mt-1 size-2 shrink-0 rotate-45 border-r-[2.5px] border-b-[2.5px] border-naranja transition-transform duration-200 group-open:rotate-225"
                  />
                </summary>
                <p className="px-4 pb-4 text-[13.5px] leading-relaxed text-ink-600">
                  {f.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 rounded-[18px] bg-naranja-suave p-4">
        <p className="font-display text-[15.5px] font-bold text-naranja-hondo">
          Escríbenos
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">
          A{" "}
          <a
            href="mailto:hola@partimos.com"
            className="font-semibold text-naranja underline"
          >
            hola@partimos.com
          </a>
          . Si es sobre un viaje en curso, dinos la ruta y la fecha para
          ubicarlo rápido.
        </p>
      </div>

      <Link
        href="/seguridad"
        className="mt-3 flex items-center justify-center gap-2 rounded-[16px] border border-ink-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-ink-600 transition-colors hover:border-naranja"
      >
        <Icon name="shield" className="size-4" />
        Seguridad y reportes
      </Link>
    </div>
  );
}

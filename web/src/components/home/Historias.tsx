"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";

/**
 * CARROUSEL ÉDITORIAL
 *
 * Trois choses le font fonctionner, et deux sont invisibles :
 *
 * 1. Le défilement est NATIF, avec `scroll-snap`. Les flèches ne font
 *    qu'appeler `scrollBy` — pas de librairie de carrousel, pas de gestion du
 *    toucher à réécrire, et le geste reste celui du système. Une librairie
 *    coûterait 15 à 30 Ko pour reproduire, moins bien, ce que le navigateur
 *    fait déjà.
 * 2. C'est une LISTE de liens. Le clavier la parcourt dans l'ordre, un
 *    lecteur d'écran annonce « 1 sur 4 », et le contenu est dans le HTML servi.
 * 3. Les flèches se désactivent en bout de course au lieu de disparaître :
 *    un contrôle qui s'évapore fait douter de ce qu'on vient de cliquer.
 */

type Story = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  /** Deux traitements : une photo assombrie, ou un aplat de marque. */
  photo?: keyof typeof PHOTOS;
  tone: "photo" | "ink" | "gradient";
};

const STORIES: Story[] = [
  {
    eyebrow: "La ruta",
    title: "El viernes de Azuero",
    body: "Entre las 4 y las 7 de la tarde sale más gente hacia Chitré que en todo el resto de la semana. Así se llena un carro.",
    href: "/viajes/panama-chitre",
    photo: "carroLleno",
    tone: "photo",
  },
  {
    eyebrow: "El aporte",
    title: "Por qué nadie gana plata",
    body: "El costo se divide entre los ocupantes, y el conductor cuenta como uno más. Esa suma es todo el modelo.",
    href: "/como-funciona",
    tone: "ink",
  },
  {
    eyebrow: "La ciudad",
    title: "Salir de la ciudad sin dar vueltas",
    body: "Costa del Este, Albrook, Vía Centenario. Los conductores ya pasan por ahí: te montas de camino, no al otro lado de la ciudad.",
    href: "/ya",
    photo: "panamaCity",
    tone: "photo",
  },
  {
    eyebrow: "La confianza",
    title: "Cuatro horas con un desconocido",
    body: "Cédula verificada, calificaciones de ida y vuelta, modo solo mujeres y ubicación en vivo con quien tú quieras.",
    href: "/seguridad",
    tone: "gradient",
  },
];

export function Historias() {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    sync();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  function nudge(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card
      ? card.getBoundingClientRect().width + 16
      : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    /* LA seule section de nuit de la page — deux écrans sombres à la suite
       faisaient un tunnel. Les cartes éditoriales sans photo sont des vitres
       posées sur ce fond ; les cartes à photo restent des photos — une image
       floutée derrière une vitre n'est plus une image. */
    <section className="noche py-16 text-white md:py-[76px]">
      <Container>
        <div className="mb-7 flex items-end justify-between gap-6">
          <h2 className="max-w-[16ch] text-[clamp(28px,5.2vw,44px)] leading-[1.05] font-extrabold">
            Cómo se mueve el país.
          </h2>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <Arrow
              direction="prev"
              disabled={atStart}
              onClick={() => nudge(-1)}
            />
            <Arrow direction="next" disabled={atEnd} onClick={() => nudge(1)} />
          </div>
        </div>
      </Container>

      {/* La piste déborde volontairement du conteneur : la carte suivante se
          devine au bord de l'écran, ce qui dit « ça défile » sans le écrire. */}
      <ul
        ref={track}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        /* `scroll-padding` EN PLUS de `padding`, et c'est tout le bug.
           `scroll-snap-align: start` aligne la carte sur le bord du
           SCROLLPORT, pas sur la boîte de contenu : le padding tenait la
           première carte à sa place au repos, puis la deuxième venait se
           coller au bord de l'écran dès le premier glissement. Il faut dire
           séparément au défilement où commence la marge. */
        /* 20 px, LA MÊME GOUTTIÈRE QUE LE TEXTE. On avait mis 24 pour
           compenser optiquement le bord visible d'une carte pleine — le
           propriétaire voit le décalage à l'œil nu, et il a raison : sur un
           téléphone, quatre pixels d'écart entre le titre et la carte
           en dessous se lisent comme un défaut, pas comme une intention. */
        style={{
          paddingInline: "max(20px, calc((100vw - 1120px) / 2))",
          scrollPaddingInline: "max(20px, calc((100vw - 1120px) / 2))",
        }}
      >
        {STORIES.map((story, index) => (
          <li
            key={story.title}
            className="w-[min(64vw,268px)] shrink-0 snap-start"
            aria-label={`${index + 1} de ${STORIES.length}`}
          >
            <Card story={story} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Card({ story }: { story: Story }) {
  const photo = story.photo ? PHOTOS[story.photo] : null;

  return (
    <Link
      href={story.href}
      className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[20px] p-6 text-white transition-transform duration-300 hover:-translate-y-1 ${
        photo ? "bg-night-900" : "glass-noche border border-white/20"
      }`}
    >
      {photo && (
        <>
          <Photo
            photo={photo}
            sizes="(min-width: 640px) 340px, 78vw"
            fill
            imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {/* Le dégradé n'est pas décoratif : sans lui, le texte blanc passe
              sur les zones claires de la photo et devient illisible. */}
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_32_42/0.15)_0%,rgb(8_32_42/0.55)_52%,rgb(8_32_42/0.92)_100%)]"
          />
        </>
      )}

      {/* Plus d'aplat pour les cartes sans photo : le verre suffit, l'aplat
          par-dessus annulerait justement sa transparence. */}

      <span className="relative z-[2]">
        <span className="mb-2 block text-[11.5px] font-bold tracking-[0.14em] text-white/70 uppercase">
          {story.eyebrow}
        </span>
        <span className="mb-2 block font-display text-[22px] leading-[1.1] font-extrabold tracking-[-0.03em]">
          {story.title}
        </span>
        <span className="block text-[14.5px] leading-relaxed text-white/80">
          {story.body}
        </span>
        <span className="mt-4 inline-flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-ink-900">
          <Icon name="arrowRight" className="size-4.5" />
        </span>
      </span>
    </Link>
  );
}

function Arrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Anterior" : "Siguiente"}
      className="glass-noche flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-35"
    >
      <Icon
        name="arrowRight"
        className={`size-5 ${direction === "prev" ? "rotate-180" : ""}`}
      />
    </button>
  );
}

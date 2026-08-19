import Link from "next/link";
import { Section, Eyebrow, SectionTitle } from "@/components/site/Section";
import { Icon, type IconName } from "@/components/ui/Icon";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";

/**
 * CONFIANCE — grille asymétrique plutôt que quatre cartes identiques.
 *
 * Les quatre cartes de même taille, même bordure, même icône grise, se
 * lisaient comme une liste de fonctionnalités : l'œil n'avait aucune raison
 * de s'arrêter, et le message le plus important — on ne stocke pas la cédula —
 * pesait autant que le reste.
 *
 * Ici une carte porte la photo et l'argument principal, les trois autres
 * suivent en plus petit. La hiérarchie visuelle dit enfin quelque chose de
 * vrai sur l'importance relative des quatre points.
 */

export const TRUST_ITEMS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "id",
    title: "Cédula verificada",
    body: "Un proveedor certificado confirma la identidad. Nosotros no guardamos las fotos, solo el resultado.",
  },
  {
    icon: "star",
    title: "Calificaciones de ida y vuelta",
    body: "Conductores y pasajeros se califican. El historial se queda en el perfil y lo ves antes de reservar.",
  },
  {
    icon: "users",
    title: "Modo solo mujeres",
    body: "Las conductoras pueden ofrecer viajes únicamente para mujeres. Las pasajeras pueden filtrar solo esos.",
  },
  {
    icon: "pin",
    title: "Comparte tu viaje",
    body: "Manda tu ubicación en vivo a quien tú quieras mientras vas en camino, y avisa automático al llegar.",
  },
];

export function TrustCard({
  icon,
  title,
  body,
}: {
  icon: IconName;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[20px] border border-ink-200 bg-white p-5.5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent">
      <GlassIcon name={icon} size="sm" className="mb-3.5" />
      <h3 className="mb-1.5 font-display text-[16.5px] font-bold tracking-[-0.015em]">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-ink-500">{body}</p>
    </div>
  );
}

export function Confianza() {
  const [lead, ...rest] = TRUST_ITEMS;

  return (
    <Section id="seguridad" className="bg-ink-50">
      <Eyebrow>Confianza y seguridad</Eyebrow>
      <SectionTitle>Sabes con quién viajas antes de subirte</SectionTitle>

      <div className="mt-9 grid gap-3.5 min-[900px]:grid-cols-[1.15fr_1fr]">
        {/* La carte maîtresse : photo, argument principal, et la seule chose
            que les gens retiennent vraiment — ce qu'on ne garde PAS. */}
        <article className="relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-[20px] bg-night-900 p-7 text-white">
          <Photo
            photo={PHOTOS.carroLleno}
            sizes="(min-width: 900px) 600px, 100vw"
            fill
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_32_42/0.25)_0%,rgb(8_32_42/0.7)_55%,rgb(8_32_42/0.95)_100%)]"
          />
          <div className="relative z-[2]">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11.5px] font-bold tracking-[0.12em] uppercase backdrop-blur-sm">
              <Icon name={lead.icon} className="size-3.5" />
              {lead.title}
            </span>
            <h3 className="mb-2.5 max-w-[16ch] font-display text-[clamp(24px,3.6vw,32px)] leading-[1.08] font-extrabold tracking-[-0.03em]">
              Cuatro horas de carretera con un desconocido es mucho tiempo.
            </h3>
            <p className="max-w-[42ch] text-[15px] leading-relaxed text-white/85">
              {lead.body}
            </p>
          </div>
        </article>

        <div className="grid gap-3.5">
          {rest.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-[20px] border border-ink-200 bg-white p-5 transition-[border-color] hover:border-accent"
            >
              <GlassIcon
                name={item.icon}
                tone="teal"
                size="sm"
              />
              <div className="min-w-0">
                <h3 className="mb-1 font-display text-[16.5px] font-bold tracking-[-0.015em]">
                  {item.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-ink-500">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/seguridad"
        className="mt-6 inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline"
      >
        Cómo cuidamos cada viaje
        <Icon name="arrowRight" className="size-4.5" />
      </Link>
    </Section>
  );
}

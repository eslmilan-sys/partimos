import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/site/Section";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { CORRIDORS, corridorCap } from "@/lib/corridors";
import { formatDuration, formatUsd } from "@/lib/pricing";
import { canonical } from "@/lib/site";

/**
 * L'INDEX DES RUTAS — la page qui manquait, et qui était déjà liée.
 *
 * ─────────────────────────────────────────────────────────────────────
 * COMMENT ON L'A TROUVÉE.
 *
 * L'audit du site l'a signalée en une ligne : chaque page corridor
 * portait un lien « Todas las rutas » vers `/viajes`, et `/viajes`
 * n'existait pas. Douze pages, toutes avec la même impasse en pied de
 * page — invisible à la lecture, fatale au référencement : un moteur qui
 * suit ce lien tombe sur un 404 depuis la page même qu'on veut faire
 * remonter.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POURQUOI UNE VRAIE PAGE PLUTÔT QUE RETIRER LE LIEN.
 *
 * Retirer le lien aurait fait disparaître le symptôme et rien d'autre.
 * Un index de rutas a une utilité propre, et elle est double :
 *
 *   · pour un moteur, c'est le HUB qui relie les douze pages corridor
 *     entre elles — sans lui, chacune ne se rejoint que par l'accueil ;
 *   · pour quelqu'un qui ne sait pas encore où il va, c'est la seule
 *     page qui répond à « qu'est-ce que vous couvrez, au juste ».
 *
 * Elle n'invente aucune donnée : distance, durée et tope sortent du même
 * référentiel que les pages corridor, avec la même formule. Le tope
 * affiché est celui d'un carro standard à trois puestos — c'est un
 * REPÈRE, et la page le dit, parce qu'un chiffre sans son hypothèse est
 * une promesse déguisée.
 */

export const metadata: Metadata = {
  title: "Todas las rutas de carro compartido en Panamá",
  description:
    "Las rutas que ya tienen viajes: distancia, tiempo de camino y el tope del aporte por puesto. De Ciudad de Panamá al interior, y de vuelta.",
  alternates: { canonical: canonical("/viajes") },
};

/* Les allers d'abord, les retours ensuite : douze lignes mélangées se
   lisent comme du bruit, alors que « ida » puis « vuelta » se parcourt. */
const IDA = CORRIDORS.filter((c) => !c.isReturn);
const VUELTA = CORRIDORS.filter((c) => c.isReturn);

export default function RutasPage() {
  return (
    <main id="contenido" className="bg-ink-50 pb-16">
      <Container className="cima-app pt-8 sm:pt-12">
        <div className="mx-auto max-w-[760px]">
          <Eyebrow>Rutas</Eyebrow>
          <h1 className="mt-2 mb-3 font-display text-[clamp(28px,5.6vw,42px)] leading-[1.06] font-extrabold tracking-[-0.035em]">
            A dónde se va, y cuánto cuesta el puesto
          </h1>
          <p className="max-w-[56ch] text-[16px] leading-relaxed text-ink-500">
            Cada ruta tiene su página con los puntos de recogida, las paradas
            del camino y los próximos viajes. El aporte sale de la distancia y
            del carro — nunca de la fecha ni de cuánta gente esté buscando.
          </p>

          <Lista titulo="Desde Ciudad de Panamá" rutas={IDA} />
          <Lista titulo="De regreso a la capital" rutas={VUELTA} />

          {/* CE QUI N'EST PAS DANS LA LISTE — et ce n'est pas un détail.
              Les douze corridors sont les pages éditoriales ; la
              recherche, elle, marche entre N'IMPORTE quelles deux villes
              du réseau. Ne pas le dire ici ferait croire à un catalogue
              fermé, et c'est le contraire de ce que fait le produit. */}
          <div className="superficie-sol mt-8 rounded-[20px] p-5 sm:p-6">
            <h2 className="font-display text-[18px] font-bold text-sol-800">
              ¿Tu ruta no está en la lista?
            </h2>
            <p className="mt-1.5 max-w-[52ch] text-[14.5px] leading-relaxed text-ink-600">
              Estas son las rutas con página propia, no las únicas que
              funcionan. La búsqueda arma el camino entre cualquier par de
              ciudades del país, con sus paradas — Penonomé a Soná también
              cuenta.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <ButtonLink href="/ya">Buscar mi ruta</ButtonLink>
              <ButtonLink href="/publicar" variant="secondary">
                Publicar un viaje
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

function Lista({
  titulo,
  rutas,
}: {
  titulo: string;
  rutas: typeof CORRIDORS;
}) {
  if (rutas.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[11.5px] font-bold tracking-[0.11em] text-ink-500 uppercase">
        {titulo}
      </h2>
      <ul className="grid gap-2.5">
        {rutas.map((c) => {
          /* Trois puestos et un carro standard : l'hypothèse est écrite
             sous la liste, jamais laissée à deviner. */
          const cap = corridorCap(c, "standard", 3);
          return (
            <li key={c.slug}>
              <Link
                href={`/viajes/${c.slug}`}
                className="group flex items-center gap-4 rounded-[18px] border border-ink-200 bg-white px-4 py-3.5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sol-300 hover:shadow-card sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[16.5px] font-bold tracking-[-0.015em]">
                    {c.origin.shortName} → {c.destination.shortName}
                  </span>
                  <span className="tnum mt-0.5 block text-[13px] text-ink-500">
                    {c.distanceKm} km · {formatDuration(c.typicalDurationMin)}
                    {c.waypoints.length > 2 && (
                      <>
                        {" "}
                        · pasa por {c.waypoints.length - 2}{" "}
                        {c.waypoints.length === 3 ? "ciudad" : "ciudades"}
                      </>
                    )}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="tnum block font-display text-[17px] font-extrabold tracking-[-0.02em] text-sol-800">
                    {formatUsd(cap.maxPriceCents)}
                  </span>
                  <span className="block text-[11.5px] text-ink-500">
                    tope por puesto
                  </span>
                </span>
                <Icon
                  name="arrowRight"
                  className="size-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sol-600"
                />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-2.5 text-[12.5px] leading-snug text-ink-500">
        Tope calculado con un carro estándar y tres puestos. Con tu carro y tus
        puestos puede ser otro — y siempre puedes pedir menos.
      </p>
    </section>
  );
}

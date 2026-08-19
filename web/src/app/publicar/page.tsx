import type { Metadata } from "next";
import { Container } from "@/components/site/Section";
import { Calculadora } from "@/components/Calculadora";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RutaCard } from "@/components/home/Rutas";
import { CORRIDORS } from "@/lib/corridors";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Publica tu viaje y comparte los gastos",
  description:
    "¿Vas al interior este fin de semana? Publica los puestos vacíos de tu carro y recupera parte de la gasolina y los peajes. El aporte te llega completo.",
  alternates: { canonical: canonical("/publicar") },
};

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "route",
    title: "Marca tu ruta",
    body: "De dónde sales, a dónde vas y por qué puntos ya ibas a pasar. Máximo cuatro paradas, ninguna en terminal.",
  },
  {
    icon: "clock",
    title: "Pon la hora y los puestos",
    body: "Tú decides a qué hora sales y cuántos puestos ofreces. Nadie te asigna un viaje ni te cambia el recorrido.",
  },
  {
    icon: "cash",
    title: "Elige el aporte",
    body: "La app calcula el tope según tu carro y la distancia. Puedes pedir menos; más no se puede.",
  },
  {
    icon: "users",
    title: "Acepta a quién llevas",
    body: "Ves el perfil, la verificación y las calificaciones de cada persona antes de confirmarle el puesto.",
  },
];

export default function PublicarPage() {
  return (
    <>
      <main id="contenido">
        {/* LA PAGE COMMENCE PAR LE CHIFFRE.
            On y arrive avec UNE question — « combien je récupère ? » — et
            on tombait sur quatre écrans d'explications avant la calculette.
            Elle passe donc en haut, à côté du titre, avec les mêmes couleurs
            que l'accueil : le même ambre sur le même titre en trois temps,
            pour que la page ne ressemble pas à un autre site. */}
        <div className="relative cima-app overflow-hidden pt-9 pb-12">
          {/* La lueur ambre de la maison, la même que sous la carte de
              recherche de l'accueil. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 -left-10 size-56 rotate-[10deg] rounded-[40px] bg-[linear-gradient(135deg,#fde68a,#f59e0b_58%,#d97706)] opacity-25 blur-2xl"
          />
          <Container className="relative">
            <div className="grid items-start gap-8 min-[960px]:grid-cols-[1.05fr_1fr] min-[960px]:gap-12">
              <div>
                <p className="glass mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12.5px] font-semibold text-ink-600">
                  <span className="font-display font-bold tracking-wide text-action-deep uppercase">
                    Conductores
                  </span>
                  El viaje ya lo ibas a hacer
                </p>
                <h1 className="mb-5 overflow-hidden text-[clamp(32px,6.4vw,52px)] leading-[1.02] font-extrabold tracking-[-0.04em]">
                  <span className="linea">
                    <em className="text-action-deep not-italic">Maneja</em>{" "}
                    igual.
                  </span>
                  <span className="linea linea-2">Gasta la mitad.</span>
                  <span className="linea linea-3">
                    <em className="text-action-deep not-italic">Comparte</em> el
                    camino.
                  </span>
                </h1>
                <p className="max-w-[48ch] text-[16.5px] leading-[1.38] font-light text-ink-600 md:text-[18px]">
                  No ganas dinero manejando: recuperas parte de lo que ibas a
                  gastar igual. La gasolina cuesta lo mismo vayas solo o
                  acompañado — la diferencia es con quién.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink href="/publicar/nuevo" size="lg">
                    Quiero proponer un viaje
                  </ButtonLink>
                  <ButtonLink href="#como" variant="secondary" size="lg">
                    Cómo funciona
                  </ButtonLink>
                </div>
              </div>

            </div>
          </Container>
        </div>

        <div>
          {/* CUÁNTO RECUPERAS Y CÓMO — remis à plat.

              Avant : la calculette et un mur d'explication juridique
              côte à côte, sous un titre (« Por qué hay un tope ») qui
              répondait à une question que personne ne s'était encore
              posée. On expliquait la règle avant d'avoir montré le
              chiffre.

              Maintenant, l'ordre de la curiosité : combien → comment →
              pourquoi il y a une limite → et le bouton, à portée de
              pouce au moment où l'envie est là. Le « pourquoi » reste,
              raccourci : c'est la garantie juridique du produit, la
              retirer serait perdre la seule chose qui distingue Partimos
              d'un service de transport. */}
          <section id="tope" className="scroll-mt-24 bg-ink-50 py-12 md:py-16">
            <Container>
              <div className="mx-auto max-w-[640px]">
                <h2 className="mb-2 max-w-[18ch] text-[clamp(26px,4.4vw,36px)] leading-[1.04] font-extrabold tracking-[-0.035em]">
                  Cuánto recuperas, y cómo
                </h2>
                <p className="mb-7 max-w-[50ch] text-[16.5px] leading-relaxed text-ink-600">
                  Escoge tu ruta y tu carro. El tope sale del costo real del
                  recorrido — no de la demanda, ni de la fecha, ni de lo lleno
                  que vaya el carro.
                </p>

                <Calculadora conRuta />

                {/* LE BOUTON ICI, pas en bas de page : c'est l'instant où
                    quelqu'un vient de voir son chiffre. Le faire défiler
                    encore pour agir, c'est perdre exactement les gens
                    qu'on venait de convaincre. */}
                <ButtonLink
                  href="/publicar/nuevo"
                  size="lg"
                  className="mt-4 w-full"
                >
                  Proponer este viaje
                </ButtonLink>
                <p className="mt-2 text-center text-[13px] text-ink-500">
                  Publicar toma menos de un minuto.
                </p>

                <div className="mt-9 border-t border-ink-200 pt-6">
                  <h3 className="mb-2.5 font-display text-[18px] font-bold">
                    Por qué hay un tope
                  </h3>
                  <div className="space-y-3.5 text-[14.5px] leading-relaxed text-ink-500">
                    <p>
                      Compartir los gastos de un viaje que ya ibas a hacer es
                      una cosa. Cobrar un pasaje es otra, y para eso hace falta
                      un permiso de transporte que ni tú ni nosotros tenemos.
                    </p>
                    <p>
                      La diferencia está en un detalle del cálculo: el costo se
                      divide entre{" "}
                      <b className="font-semibold text-ink-900">
                        los puestos que ofreces más uno
                      </b>
                      . Ese «uno» eres tú. Por eso, aunque lleves el carro
                      lleno, siempre terminas poniendo una parte.
                    </p>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          <section id="como" className="scroll-mt-24 py-12 md:py-16">
            <Container>
              <h2 className="mb-8 max-w-[20ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                Publicar toma menos de un minuto
              </h2>
              <ol className="grid gap-3.5 min-[680px]:grid-cols-2 min-[1000px]:grid-cols-4">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="relative overflow-hidden rounded-[20px] border border-ink-200 p-5.5"
                  >
                    <span
                      aria-hidden
                      className="absolute top-3 right-4 font-display text-[40px] leading-none font-extrabold text-transparent [-webkit-text-stroke:2px_var(--color-ink-200)]"
                    >
                      {index + 1}
                    </span>
                    <span className="mb-3.5 flex size-10.5 items-center justify-center rounded-xl bg-ink-50 text-ink-900">
                      <Icon name={step.icon} className="size-5.5" />
                    </span>
                    <h3 className="mb-1.5 font-display text-[16.5px] font-bold">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-500">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </Container>
          </section>

          {/* LA SÉCURITÉ DU COBRO, côté conducteur d'abord : c'est lui
              qu'il faut convaincre — sans carros publiés il n'y a pas de
              plateforme. Quatre garanties concrètes, pas des slogans. */}
          {/* LE COBRO — QUATRE CARTES DEVENUES QUATRE LIGNES.

              Elles disaient quatre choses justes dans quatre boîtes de
              cent quarante mots. Sur téléphone, ça faisait quatre écrans
              de défilement pour une idée qui tient en une phrase : tu
              pars payé, et on ne te retient rien.

              Titre, sous-titre, quatre lignes, une phrase de clôture.
              Même rythme que le haut de page — c'est ce qui manquait :
              la section était conçue comme une grille de features de
              SaaS, pas comme la suite d'un argumentaire. */}
          <section className="py-12 md:py-16">
            <Container>
              <h2 className="mb-2 max-w-[22ch] text-[clamp(24px,4vw,34px)] leading-[1.06] font-extrabold tracking-[-0.03em]">
                El cobro, asegurado antes de salir
              </h2>
              <p className="mb-7 max-w-[52ch] text-[16px] leading-relaxed text-ink-600">
                Manejar ya es poner el carro, la gasolina y el volante. Cobrar
                no debería ser otro trabajo.
              </p>

              <ul className="max-w-[62ch] divide-y divide-ink-200 border-y border-ink-200">
                {[
                  {
                    icon: "shield" as const,
                    que: "Sales con el cobro hecho",
                    como: "Si pagó en la app, su aporte quedó cobrado al confirmar. Sin «te pago llegando».",
                  },
                  {
                    icon: "cash" as const,
                    que: "Tu aporte llega completo",
                    como: "La tarifa la paga quien elige pagar en la app. De lo tuyo no se descuenta nada, nunca.",
                  },
                  {
                    icon: "check" as const,
                    que: "Tú eliges cómo te pagan",
                    como: "Yappy directo y efectivo solo si los aceptas. Puedes manejar sin tocar plata.",
                  },
                  {
                    icon: "id" as const,
                    que: "Sabes a quién llevas",
                    como: "Nadie reserva sin cédula verificada. Hablan por el chat, sin dar tu celular.",
                  },
                ].map((f) => (
                  <li key={f.que} className="flex items-start gap-3.5 py-4">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-ink-50 text-ink-900">
                      <Icon name={f.icon} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <b className="block font-display text-[15.5px] font-bold">
                        {f.que}
                      </b>
                      <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-500">
                        {f.como}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-400">
                El pasajero tiene las mismas garantías al revés: cobro
                protegido con la tarifa a la vista, comprobante y reembolso
                según las reglas de cancelación.
              </p>
            </Container>
          </section>


          <section className="py-12 md:py-16">
            <Container>
              <h2 className="mb-5 font-display text-xl font-bold">
                Rutas con gente esperando
              </h2>
              <div className="grid gap-2.5 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
                {CORRIDORS.filter((c) => c.isPriority).map((corridor) => (
                  <RutaCard key={corridor.slug} slug={corridor.slug} />
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/ya" size="lg">
                  Publicar mi viaje
                </ButtonLink>
                <ButtonLink href="/ayuda" variant="secondary" size="lg">
                  Preguntas frecuentes
                </ButtonLink>
              </div>
            </Container>
          </section>
        </div>
      </main>
    </>
  );
}

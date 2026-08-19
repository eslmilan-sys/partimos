import type { Metadata } from "next";
import { Container } from "@/components/site/Section";
import { Descubre } from "@/components/app/Descubre";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { FaqList, FaqJsonLd } from "@/components/home/Faq";
import { canonical } from "@/lib/site";
import type { Faq } from "@/lib/content";

export const metadata: Metadata = {
  title: "Cómo se paga un viaje, paso a paso",
  description:
    "Del primer clic al pago: buscas, reservas, se abre el chat con el conductor, coordinan el punto y le pagas a la persona el día del viaje, en efectivo o por Yappy.",
  alternates: { canonical: canonical("/como-funciona") },
};

/**
 * PAGE « CÓMO SE PAGA »
 *
 * Elle existe parce que la question la plus fréquente d'un modèle sans
 * paiement en ligne est « alors je paie quand, et à qui ? ». Tant qu'elle
 * n'a pas de réponse en un seul endroit, le doute reste, et le doute ne
 * réserve pas.
 *
 * Le parcours est présenté comme une suite d'étapes numérotées : ici la
 * numérotation porte une vraie information — l'ordre est celui du temps, et
 * l'étape du paiement arrive délibérément en cinquième position.
 */

type Step = {
  icon: IconName;
  when: string;
  title: string;
  body: string;
  money: string;
};

const STEPS: Step[] = [
  {
    icon: "search",
    when: "Ahora",
    title: "Buscas tu ruta",
    body: "Escribes de dónde sales y a dónde vas, o los tocas en el mapa. Ves quién sale ese día, a qué hora y con cuántos puestos libres.",
    money: "No pagas nada",
  },
  {
    icon: "pin",
    when: "Ahora",
    title: "Escoges dónde te recogen",
    body: "Cada conductor marca de dos a cuatro puntos por donde ya va a pasar. Si ninguno te queda, propones el tuyo y él decide si le queda de paso.",
    money: "No pagas nada",
  },
  {
    icon: "chat",
    when: "Ahora",
    title: "Reservas tu puesto",
    body: "Pagas como prefieras: por Yappy o con tarjeta en la app, con cobro protegido, o en efectivo en la mano el día del viaje. Al confirmar, se abre el chat con el conductor.",
    money: "No pagas nada",
  },
  {
    icon: "phone",
    when: "Antes del viaje",
    title: "Coordinan por chat o llamada",
    body: "Con el número afinan la esquina exacta del encuentro y acuerdan cómo le vas a pagar: efectivo o Yappy. La hora de salida es la que el conductor publicó. Partimos no participa en esa conversación.",
    money: "No pagas nada",
  },
  {
    icon: "cash",
    when: "El día del viaje",
    title: "Le pagas a la persona",
    body: "En el carro, o por Yappy a su número. El monto es el que viste al reservar: no cambia por la hora, ni por el día, ni porque quede un solo puesto.",
    money: "Aquí es donde pagas",
  },
  {
    icon: "star",
    when: "Al llegar",
    title: "Se califican los dos",
    body: "Tú al conductor y el conductor a ti. Queda en el perfil y lo ve quien reserve después.",
    money: "No pagas nada",
  },
];

const FAQ: Faq[] = [
  {
    q: "¿Puedo pagar con tarjeta en la app?",
    a: "Sí, si quieres. Al reservar eliges entre tres: Yappy en la app (recomendado, tarifa de servicio del 5%), tarjeta en la app (tarifa del 8%) o efectivo en la mano, sin tarifa. La tarifa paga la reserva protegida — comprobante, soporte y reembolso según las reglas de cancelación. El conductor recibe su aporte completo en los tres casos.",
  },
  {
    q: "¿Y si el conductor me quiere cobrar más el día del viaje?",
    a: "El monto queda registrado al reservar y los dos lo ven. Si te piden más, no lo pagues y repórtalo desde el viaje: cada reporte queda asociado a la reserva y una persona lo revisa. Cobrar por encima del tope es motivo de suspensión.",
  },
  {
    q: "¿Puedo pagarle antes por Yappy?",
    a: "Directo al conductor, puedes si los dos están de acuerdo — pero para adelantar plata con alguien que no conoces, mejor usa el pago en la app: queda comprobante y el reembolso es automático si el viaje se cancela.",
  },
  {
    q: "¿Qué pasa si no aparezco?",
    a: "Si pagaste en efectivo, no hay plata retenida ni reembolso que pedir. Si pagaste en la app — Yappy o tarjeta —, el reembolso sigue las reglas de cancelación: completo con más de 24 horas, el aporte entre 24 y 2 horas, y con menos de 2 horas se retiene la mitad. Del otro lado hay alguien que te esperó: dos ausencias sin avisar y dejas de poder reservar por un tiempo.",
  },
  {
    q: "¿El precio sube si reservo el último puesto?",
    a: "No, nunca. El aporte sale del costo del recorrido dividido entre todos los ocupantes, y ese cálculo no mira la demanda ni la fecha. El último puesto de un viernes de Carnaval cuesta igual que el primero de un martes.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <>
      <main id="contenido">
        {/* L'APP a sa version de cette page : six choses qui marchent
            déjà, chacune menant à l'écran où elles servent. Le site
            garde son parcours en étapes, qui parle à un inconnu. */}
        <div className="solo-app">
          <Descubre />
        </div>

        <div className="solo-web">
        <div className="noche pt-10 pb-11 text-white">
          <Container>
            <h1 className="mb-4 max-w-[18ch] text-[clamp(32px,6.4vw,50px)] leading-[1.03] font-extrabold tracking-[-0.04em]">
              Pagas una sola vez, y no es en la app
            </h1>
            <p className="max-w-[56ch] text-[16.5px] leading-relaxed text-night-200">
              El dinero cambia de manos una sola vez, el día del viaje,
              entre tú y el conductor. Aquí está todo
              el recorrido.
            </p>
          </Container>
        </div>

        <section className="py-12 md:py-16">
          <Container>
            <ol className="relative">
              <span
                aria-hidden
                className="absolute top-6 bottom-6 left-[19px] w-0.5 rounded-full bg-ink-200 md:left-[23px]"
              />
              {STEPS.map((step, index) => {
                const paying = step.money.startsWith("Aquí");
                return (
                  <li
                    key={step.title}
                    className="relative flex gap-4 pb-8 last:pb-0 md:gap-6"
                  >
                    <span
                      aria-hidden
                      className={`relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-white md:size-12 ${
                        paying
                          ? "bg-ink-900 text-white"
                          : "bg-ink-50 text-ink-900"
                      }`}
                    >
                      <Icon name={step.icon} className="size-5" />
                    </span>

                    <div className="min-w-0 flex-1 pt-1">
                      <p className="mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-bold tracking-[0.13em] uppercase">
                        <span className="text-ink-500">
                          {index + 1} · {step.when}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 ${
                            paying
                              ? "bg-ink-900 text-white"
                              : "bg-ink-50 text-ink-500"
                          }`}
                        >
                          {step.money}
                        </span>
                      </p>
                      <h2 className="mb-1.5 font-display text-[19px] font-bold tracking-[-0.02em]">
                        {step.title}
                      </h2>
                      <p className="max-w-[58ch] text-[15px] leading-relaxed text-ink-500">
                        {step.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Container>
        </section>

        <section className="bg-ink-50 py-12 md:py-16">
          <Container>
            <div className="grid gap-8 min-[900px]:grid-cols-2 min-[900px]:gap-12">
              <div>
                <h2 className="mb-4 max-w-[20ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                  Lo que nunca te vamos a pedir
                </h2>
                <ul className="grid gap-2.5">
                  {[
                    "Tu tarjeta por WhatsApp, correo o llamada",
                    "Un pago fuera de la app o de la mano al conductor",
                    "Un descuento sobre el aporte del conductor",
                    "Tu cédula — la ve solo el verificador certificado",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-[14px] border border-ink-200 bg-white px-4 py-3"
                    >
                      <Icon
                        name="cross"
                        className="size-4 shrink-0 text-danger"
                      />
                      <span className="text-[15px] font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 max-w-[46ch] text-[13.5px] leading-relaxed text-ink-500">
                  El único cobro de Partimos ocurre dentro de la app, al
                  reservar, con la tarifa a la vista. Cualquier otro cobro a
                  nombre de Partimos es un fraude: repórtalo.
                </p>
              </div>

              <div>
                <h2 className="mb-4 max-w-[20ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                  Cuánto se aporta, y por qué ese monto
                </h2>
                <div className="max-w-[50ch] space-y-4 text-[15px] leading-relaxed text-ink-500">
                  <p>
                    El costo real del recorrido — gasolina, peajes y desgaste,
                    más un margen del 10 % por los desvíos de recogida — se
                    divide entre todos los ocupantes del carro,{" "}
                    <b className="font-semibold text-ink-900">
                      incluido el conductor
                    </b>
                    .
                  </p>
                  <p>
                    Ese «incluido» es lo que hace que nadie gane plata: aunque
                    lleve el carro lleno, el conductor termina poniendo su
                    parte. Es la diferencia entre compartir gastos y cobrar un
                    pasaje.
                  </p>
                  <p>
                    Y como el cálculo solo mira el recorrido, el aporte no sube
                    un viernes, ni en Carnaval, ni cuando queda un solo puesto.
                  </p>
                </div>
                <ButtonLink href="/publicar#calculadora" className="mt-5">
                  Ver el cálculo en vivo
                </ButtonLink>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 md:py-16">
          <Container>
            <h2 className="text-[clamp(24px,4vw,34px)] font-extrabold">
              Sobre el pago, en corto
            </h2>
            <FaqList items={FAQ} />

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/ya" size="lg">
                Buscar mi viaje
              </ButtonLink>
              <ButtonLink href="/seguridad" variant="secondary" size="lg">
                Con quién voy a viajar
              </ButtonLink>
            </div>
          </Container>
        </section>
        </div>
      </main>

      <FaqJsonLd items={FAQ} />
    </>
  );
}

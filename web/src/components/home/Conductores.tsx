import {
  Section,
  Eyebrow,
  SectionTitle,
  Lead,
} from "@/components/site/Section";
import { Calculadora } from "@/components/Calculadora";
import { TrustCard } from "./Confianza";

const DRIVER_POINTS = [
  {
    icon: "compass" as const,
    title: "Tú pones la ruta",
    body: "Marcas los puntos por donde ya vas a pasar. Si alguien propone otro sitio, tú decides si te queda de paso o no.",
  },
  {
    icon: "cash" as const,
    title: "Recibes el aporte completo",
    body: "En efectivo o por Yappy. Tu aporte te llega completo — lo que acordaste es lo que recibes.",
  },
  {
    icon: "users" as const,
    title: "Sabes quién se sube",
    body: "Todos los pasajeros tienen cédula verificada, foto y calificaciones de viajes anteriores.",
  },
];

export function Conductores() {
  return (
    <Section id="conductores">
      <Eyebrow>Para conductores</Eyebrow>
      <SectionTitle>El viaje ya lo ibas a hacer</SectionTitle>
      <Lead>
        La gasolina te cuesta lo mismo vayas solo o con tres personas atrás. Lo
        único que cambia es entre cuántos se reparte. Mueve los controles.
      </Lead>

      <div
        id="calculadora"
        className="mt-9 grid scroll-mt-24 gap-6.5 min-[900px]:grid-cols-[1.04fr_0.96fr] min-[900px]:items-start min-[900px]:gap-10"
      >
        <Calculadora />
        <div className="grid gap-3.5">
          {DRIVER_POINTS.map((point) => (
            <TrustCard key={point.title} {...point} />
          ))}
        </div>
      </div>
    </Section>
  );
}

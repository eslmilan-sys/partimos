import type { Metadata } from "next";
import { Container } from "@/components/site/Section";
import { FaqList, FaqJsonLd } from "@/components/home/Faq";
import { HELP_FAQ } from "@/lib/content";
import { canonical } from "@/lib/site";
import { Ayuda } from "@/components/app/Ayuda";

export const metadata: Metadata = {
  title: "Ayuda y preguntas frecuentes",
  description:
    "Cómo se paga, cómo hablas con el conductor, dónde te recogen, qué pasa si alguien cancela. Todo lo que se pregunta antes del primer viaje.",
  alternates: { canonical: canonical("/ayuda") },
};

export default function AyudaPage() {
  return (
    <>
      <main id="contenido">
        {/* DANS L'APP, on arrive ici avec UNE question et souvent
            pressé : la liste se filtre à mesure qu'on tape. */}
        <div className="solo-app">
          <Ayuda />
        </div>

        <div className="solo-web">
        <div className="noche pt-10 pb-11 text-white">
          <Container>
            <h1 className="mb-4 max-w-[16ch] text-[clamp(32px,6.4vw,50px)] leading-[1.03] font-extrabold tracking-[-0.04em]">
              Lo que todo el mundo pregunta
            </h1>
            <p className="max-w-[54ch] text-[16.5px] leading-relaxed text-night-200">
              Y si falta algo, escríbenos: contestamos personas, no un
              formulario.
            </p>
          </Container>
        </div>

        <div className="py-12 md:py-16">
          <Container>
            <FaqList items={HELP_FAQ} />

            <div
              id="contacto"
              className="mt-12 max-w-[640px] scroll-mt-24 rounded-[20px] bg-ink-50 px-6 py-6"
            >
              <h2 className="mb-2.5 font-display text-xl font-bold">
                Contacto
              </h2>
              <p className="text-[15px] leading-relaxed text-ink-500">
                Escríbenos a{" "}
                <a
                  href="mailto:hola@partimos.com"
                  className="font-semibold text-accent-ink hover:underline"
                >
                  hola@partimos.com
                </a>
                . Si es sobre un viaje en curso, dinos la ruta y la fecha para
                ubicarlo rápido.
              </p>
            </div>
          </Container>
        </div>
        </div>
      </main>

      <FaqJsonLd items={HELP_FAQ} />
    </>
  );
}

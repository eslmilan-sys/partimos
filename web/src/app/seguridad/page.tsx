import type { Metadata } from "next";
import { Container } from "@/components/site/Section";
import { TrustCard, TRUST_ITEMS } from "@/components/home/Confianza";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { canonical } from "@/lib/site";
import { SeguridadPagina } from "@/components/app/SeguridadPagina";

export const metadata: Metadata = {
  title: "Seguridad: con quién viajas y cómo te cuidamos",
  description:
    "Cédula verificada por un proveedor certificado, calificaciones de ida y vuelta, modo solo mujeres y ubicación en vivo. Así funciona la confianza en Partimos.",
  alternates: { canonical: canonical("/seguridad") },
};

const DETAILS = [
  {
    title: "Verificación de identidad",
    body: "Antes de publicar o reservar, un proveedor certificado de la región confirma que la cédula es real y que corresponde a la persona. Nosotros recibimos solo dos cosas: si pasó o no, y una referencia del expediente. La foto del documento y el número de cédula nunca llegan a nuestros servidores ni a nuestra base de datos.",
  },
  {
    title: "Tu número no es público",
    body: "El celular del conductor y el tuyo quedan ocultos hasta que hay una reserva confirmada. No es una regla de la pantalla: es una política de la base de datos, así que ninguna versión de la app puede saltársela por error.",
  },
  {
    title: "Calificaciones que no se borran",
    body: "Al terminar el viaje se califican los dos. El historial se queda en el perfil y lo ves antes de reservar. Un conductor que cancela tarde tres veces en 90 días deja de poder publicar — la consecuencia es de reputación, nunca una multa.",
  },
  {
    title: "Modo solo mujeres",
    body: "Una conductora puede marcar su viaje como exclusivo para mujeres, y una pasajera puede filtrar solo esos viajes. Es opcional en los dos sentidos y no cambia el aporte.",
  },
  {
    title: "Comparte tu viaje en vivo",
    body: "Desde la app puedes mandarle tu ubicación a quien tú quieras mientras vas en camino, y avisar automáticamente al llegar. El enlace caduca solo cuando termina el viaje.",
  },
  {
    title: "Reportar es rápido",
    body: "Si algo no estuvo bien, lo reportas desde el viaje. Cada reporte queda asociado a la reserva, con su gravedad y su seguimiento, y una persona lo revisa.",
  },
];

export default function SeguridadPage() {
  return (
    <>
      <main id="contenido">
        {/* DANS L'APP, seguridad n'est pas un argument : c'est l'écran
            qu'on ouvre quand ça ne va pas. Le 911 passe donc en haut, et
            l'explication après. */}
        <div className="solo-app">
          <SeguridadPagina />
        </div>

        <div className="solo-web">
        <div className="noche pt-10 pb-11 text-white">
          <Container>
            <h1 className="mb-4 max-w-[18ch] text-[clamp(32px,6.4vw,50px)] leading-[1.03] font-extrabold tracking-[-0.04em]">
              Sabes con quién viajas antes de subirte
            </h1>
            <p className="max-w-[56ch] text-[16.5px] leading-relaxed text-night-200">
              La carretera se hace larga con un desconocido. Esto es lo que
              hacemos para que no lo sea — y lo que deliberadamente no
              guardamos.
            </p>
          </Container>
        </div>

        <div>
          <section className="py-12 md:py-16">
            <Container>
              <h2 className="mb-8 max-w-[22ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                Cuatro cosas que revisamos en cada viaje
              </h2>
              <div className="grid gap-3.5 min-[680px]:grid-cols-2 min-[1000px]:grid-cols-4">
                {TRUST_ITEMS.map((item) => (
                  <TrustCard key={item.title} {...item} />
                ))}
              </div>
            </Container>
          </section>

          <section className="bg-ink-50 py-12 md:py-16">
            <Container>
              <h2 className="mb-8 max-w-[20ch] text-[clamp(24px,4vw,34px)] font-extrabold">
                En detalle
              </h2>
              <div className="grid gap-x-10 gap-y-8 min-[860px]:grid-cols-2">
                {DETAILS.map((item) => (
                  <div key={item.title}>
                    <h3 className="mb-2 font-display text-[19px] font-bold tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-500">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </Container>
          </section>

          <section className="py-12 md:py-16">
            <Container>
              <div className="flex max-w-[720px] items-start gap-4 rounded-[20px] border border-ink-200 px-6 py-5.5">
                <Icon
                  name="shield"
                  className="mt-0.5 size-6 shrink-0 text-ink-500"
                />
                <div>
                  <h2 className="mb-2 font-display text-[19px] font-bold">
                    Lo que no hacemos
                  </h2>
                  <p className="text-[15px] leading-relaxed text-ink-500">
                    No guardamos imágenes de cédula ni números de documento.
                    No guardamos números de tarjeta: si pagas en la app, la
                    procesa una pasarela certificada y a nosotros nunca nos
                    llega. No vendemos datos. Y no usamos tu número para
                    publicidad: solo para avisarte de los viajes que buscaste.
                  </p>
                </div>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/ya" size="lg">
                  Buscar viaje
                </ButtonLink>
                <ButtonLink href="/ayuda" variant="secondary" size="lg">
                  Preguntas frecuentes
                </ButtonLink>
              </div>
            </Container>
          </section>
        </div>
        </div>
      </main>
    </>
  );
}

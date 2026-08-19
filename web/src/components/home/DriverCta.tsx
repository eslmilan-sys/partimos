import { Container } from "@/components/site/Section";
import { ButtonLink } from "@/components/ui/Button";

export function DriverCta() {
  return (
    <section className="pb-16 md:pb-[76px]">
      <Container>
        <div>
          <div className="relative overflow-hidden rounded-[28px] bg-ink-50 px-7 py-9.5 min-[860px]:px-12 min-[860px]:py-13">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-22 -bottom-22 size-75 rounded-full bg-[radial-gradient(circle,rgb(160_216_56/0.2),transparent_68%)]"
            />
            <div className="relative z-[2] max-w-[52ch]">
              <h2 className="mb-3.5 text-[clamp(26px,4.6vw,38px)] leading-[1.06] font-extrabold">
                ¿Bajas al interior esta semana?
              </h2>
              <p className="mb-6 text-[16.5px] leading-relaxed text-ink-500">
                Publicar toma menos de un minuto. Tres puestos vacíos en la
                Panamericana no le sirven a nadie — y hay gente buscando ese
                mismo viaje ahora mismo.
              </p>
              <div className="flex flex-wrap gap-3">
                {/* Le bouton d'ACTION va au formulaire, pas à la page
                    vitrine : « Publicar » qui atterrit sur de l'explication
                    déroute. La vitrine garde son lien, nommé pour ce
                    qu'elle est. */}
                <ButtonLink href="/publicar/nuevo" size="lg">
                  Publicar mi viaje
                </ButtonLink>
                <ButtonLink href="/publicar" variant="secondary" size="lg">
                  Cómo funciona para conductores
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

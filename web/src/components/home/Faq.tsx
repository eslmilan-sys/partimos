import { Section, Eyebrow, SectionTitle } from "@/components/site/Section";
import type { Faq as FaqItem } from "@/lib/content";

/**
 * FAQ en `<details>` natif : accessible au clavier, extensible sans
 * JavaScript, et le contenu est dans le HTML servi — donc indexable.
 * Un accordéon en React n'apporterait rien ici et coûterait du bundle.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="mt-8 max-w-[800px]">
      {items.map((item) => (
        <details
          key={item.q}
          className="group border-b border-ink-200"
        >
          <summary className="relative cursor-pointer list-none py-5 pr-10 font-display text-[17px] font-bold tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden
              className="absolute top-1/2 right-2 size-2.5 -translate-y-[70%] rotate-45 border-r-[2.5px] border-b-[2.5px] border-accent transition-transform duration-200 group-open:-translate-y-[30%] group-open:rotate-225"
            />
          </summary>
          <p className="max-w-[66ch] pr-3 pb-5.5 text-[15px] leading-relaxed text-ink-500">
            {item.a}
          </p>
        </details>
      ))}
      {/* Le reste des réponses n'a pas disparu : elle est là où on la
          cherche vraiment. */}
      <a
        href="/ayuda"
        className="mt-5 inline-flex items-center gap-2 text-[14.5px] font-semibold text-accent-ink hover:underline"
      >
        Ver todas las preguntas
      </a>
    </div>
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <Section id="faq" className="pt-5 md:pt-5">
      <Eyebrow>Preguntas</Eyebrow>
      <SectionTitle>Lo que todo el mundo pregunta</SectionTitle>
      <FaqList items={items} />
    </Section>
  );
}

/** Bloc JSON-LD FAQPage. Le contenu doit être identique à celui affiché. */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

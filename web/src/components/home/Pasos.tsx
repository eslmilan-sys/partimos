import { Section, SectionTitle, Lead } from "@/components/site/Section";
import { type IconName } from "@/components/ui/Icon";
import { GlassIcon } from "@/components/ui/GlassIcon";

/**
 * COMMENT ÇA MARCHE — une route, pas trois cartes.
 *
 * L'ancienne version alignait trois cartes identiques avec un grand chiffre
 * en filigrane dans le coin. Deux problèmes, et le second est le vrai :
 *
 *   · Le chiffre était tracé en `-webkit-text-stroke` de `ink-200`. Depuis le
 *     passage à la palette chaude, `ink-200` est un crème — donc un chiffre
 *     crème sur un fond crème, presque invisible. Et posé en absolu dans le
 *     coin droit, il n'avait aucun rapport avec l'icône à gauche : sur
 *     téléphone les deux flottaient sans se répondre.
 *
 *   · Surtout : TROIS CARTES NE RACONTENT PAS UNE SÉQUENCE. Une carte est un
 *     objet indépendant. Or ici l'ordre porte du sens — on ne réserve pas
 *     avant de chercher, on ne paie pas avant de monter. La forme doit dire
 *     « ceci mène à cela », pas « voici trois choses ».
 *
 * D'où la route. Le trait relie les trois arrêts, les numéros sont DANS le
 * trait et pas à côté, et le marquage au sol se dessine au défilement.
 * C'est aussi la métaphore du produit — un site de covoiturage a le droit de
 * dessiner une route.
 *
 * Le tracé est décoratif : `aria-hidden`. La séquence reste un `<ol>`, donc
 * un lecteur d'écran l'annonce comme une liste ordonnée de trois éléments,
 * ce qui est exactement l'information que la route donne à l'œil.
 */
const PASOS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "search",
    title: "Busca tu ruta",
    body: "Ves quién sale, a qué hora y por dónde pasa. Cada conductor marca los puntos donde puede recoger sin desviarse de su camino.",
  },
  {
    icon: "chat",
    title: "Reserva y coordinen",
    body: "Reservar no cuesta nada. Al confirmar se abre el chat con el conductor, y entre ustedes afinan la esquina exacta del encuentro.",
  },
  {
    icon: "car",
    title: "Viaja y aporta",
    body: "Le pagas a la persona el día del viaje, en efectivo o por Yappy. Al bajarte se califican los dos.",
  },
];

export function Pasos() {
  return (
    <Section id="como">
      <SectionTitle>Tres pasos y ya vas en camino</SectionTitle>
      <Lead>
        Alguien ya hizo el plan de manejar. Tú te sumas al carro y el costo del
        camino se reparte entre todos.
      </Lead>

      <ol className="ruta mt-10 grid gap-0 min-[860px]:grid-cols-3 min-[860px]:gap-x-7">
        {PASOS.map((paso, index) => (
          <li
            key={paso.title}
            className="ruta-paso relative grid grid-cols-[56px_1fr] gap-x-5 pb-8 min-[860px]:grid-cols-1 min-[860px]:gap-y-0 min-[860px]:pt-[72px] min-[860px]:pb-0"
          >
            {/* L'arrêt : le numéro EST le repère sur la route. Il ne flotte
                plus dans un coin — il occupe la position que la route lui
                donne, et c'est ce qui aligne tout le reste. */}
            <span
              aria-hidden
              className="ruta-arret relative z-[2] flex size-14 items-center justify-center rounded-full border-[2.5px] border-ink-900 bg-ink-50 font-display text-[19px] font-extrabold min-[860px]:absolute min-[860px]:top-0 min-[860px]:left-0"
            >
              {index + 1}
            </span>

            <div className="min-w-0 pt-2 min-[860px]:pt-0">
              <GlassIcon
                name={paso.icon}
                tone="amber"
                className="mb-3 ml-2.5"
              />
              <h3 className="mb-2 font-display text-[19px] font-bold tracking-[-0.02em]">
                {paso.title}
              </h3>
              <p className="max-w-[46ch] text-[14.5px] leading-relaxed text-ink-500">
                {paso.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

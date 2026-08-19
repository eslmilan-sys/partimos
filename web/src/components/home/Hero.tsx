import { SearchCard } from "./SearchCard";
import { LiveStrip } from "./LiveStrip";
import { type IconName } from "@/components/ui/Icon";
import { GlassIcon, type GlassTone } from "@/components/ui/GlassIcon";
import { HeroScene } from "./HeroScene";

/**
 * LE PREMIER ÉCRAN
 *
 * Quatre décisions, chacune tirée d'une règle plutôt que d'une intuition.
 *
 * 1. LA RECHERCHE EST LE CTA. Sur une place de marché, la barre de recherche
 *    est l'action principale — pas un bouton à côté d'un argumentaire. Elle
 *    passait sous la ligne de flottaison sur téléphone, derrière les quatre
 *    preuves ; elle est maintenant juste après le titre, et les preuves
 *    viennent après. Sur grand écran elle reprend sa colonne de droite, où
 *    elle est visible de toute façon.
 *
 * 2. LE PREMIER ÉCRAN EST CLAIR. Une bande sombre en haut de page ferme la
 *    page au lieu de l'ouvrir — c'est ce qu'il y a de moins gai. Depuis que la
 *    page est blanche, la lumière ambre du coin haut droit se voit vraiment :
 *    sur le crème d'avant, elle se noyait dans un fond déjà jaune. Un reflet
 *    froid en bas à gauche lui répond, plus un grain très fin. On lit « beau
 *    temps », pas « logiciel ».
 *
 * 3. L'ENTRÉE EST CHORÉGRAPHIÉE. Une séquence décalée à l'ouverture plutôt
 *    que des effets au survol dispersés — et rien au survol sur un téléphone,
 *    justement.
 *
 * 4. LA HIÉRARCHIE SE FAIT À LA GRAISSE, pas seulement à la taille. Titre en
 *    800, texte d'accroche en 300 : l'écart se voit même en plissant les yeux,
 *    ce qui est le test.
 */
/**
 * Les quatre preuves, dans l'ordre où la question se pose : où je monte, à
 * quoi ressemble le trajet, avec qui, et ce que ça m'engage.
 *
 * La deuxième a remplacé « Pagas en el carro / Efectivo o Yappy » : le
 * paiement était déjà dit deux lignes plus haut sous le bouton, et redit
 * ensuite sur toute une section. Le confort du trajet, lui, n'était écrit
 * nulle part — alors que c'est la vraie différence vécue.
 */
const PROOF: {
  icon: IconName;
  tone: GlassTone;
  title: string;
  detail: string;
}[] = [
  {
    icon: "pin",
    tone: "amber",
    title: "Te recogen donde quieras",
    detail: "Escoges el punto al reservar",
  },
  {
    icon: "car",
    tone: "amber",
    title: "Vas sentado y con espacio",
    detail: "Tu maleta atrás, sin transbordos",
  },
  {
    icon: "id",
    tone: "amber",
    title: "Sabes quién maneja",
    detail: "Cédula verificada",
  },
  {
    icon: "check",
    tone: "amber",
    title: "Pagas una sola vez",
    detail: "Yappy, tarjeta o efectivo",
  },
];

export function Hero() {
  return (
    <div className="sky grain relative overflow-hidden border-b border-ink-200">
      {/* Ce que la barre en verre floute. Un flou n'a de sens que s'il a
          quelque chose à flouter : sans ces deux halos, la vitre floute un
          aplat, et un aplat flouté reste un aplat. */}
      <span aria-hidden className="halos" />
      {/* Les orbes WebGL par-dessus les halos : c'est ce que le verre floute.
          Sous 768 px et sans WebGL, les halos seuls font le travail.
          Coupés dans l'app : une scène WebGL qui tourne pour décorer un
          écran qu'on ouvre vingt fois par jour, c'est de la batterie
          dépensée à ne rien dire. Les halos CSS restent. */}
      <div className="solo-web">
        <HeroScene />
      </div>

      <div className="relative z-[2] mx-auto w-full max-w-[1120px] px-5 pt-6 md:pt-20">
        {/* DANS L'APP, IL NE RESTE QUE LA CARTE DE RECHERCHE.
            Le titre, l'accroche et les quatre preuves sont de la vente :
            utiles à qui découvre, du remplissage à qui a installé. La
            carte, elle, est l'outil — elle garde sa place, et une seule
            question la précède. Un mot sur la carte de recherche ELLE-MÊME
            plutôt qu'un second exemplaire : ses champs ont des `id` fixes
            (`desde`, `hacia`, `fecha`), et deux exemplaires dans la même
            page casseraient les `label` des deux. */}
        <div className="flex flex-col min-[960px]:grid min-[960px]:grid-cols-[1.08fr_0.92fr] min-[960px]:items-start min-[960px]:gap-x-16 min-[960px]:gap-y-8">
          <div className="solo-web order-1 min-[960px]:col-start-1 min-[960px]:row-start-1">
            {/* La pilule est revenue avec une RAISON d'exister : annoncer le
                lancement. La version d'avant disait une évidence permanente
                (« salidas todos los días ») — un badge sans nouvelle est du
                bruit ; un badge de lancement est une information, et il
                partira quand le lancement sera vieux. Pas de nombre de
                routes : les conducteurs publient les leurs, la carte des
                rutas est ouverte. */}
            {/* Trois couches de profondeur : le badge est le plus « loin »
                (il traîne le plus au défilement), le titre au milieu, le
                texte d'accroche devant. Le parallaxe vit sur ces conteneurs
                — les éléments `.enter` gardent leur transform d'entrée. */}
            <div className="para-lejos">
              <p className="glass enter enter-1 mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12.5px] font-semibold text-ink-600">
                <span className="font-display font-bold tracking-wide text-action-deep uppercase">
                  Lanzamiento
                </span>
                Rutas ilimitadas por todo el país
              </p>
            </div>

            <div className="para-medio">
              {/* TROIS LIGNES, DEUX COULEURS, TROIS ENTRÉES.
                  Le mot d'action est en ambre, le reste en encre : la
                  couleur ne décore pas, elle marque le verbe. Chaque ligne
                  entre d'un côté différent — droite, gauche, droite. */}
              <h1 className="mb-5 overflow-hidden text-[clamp(42px,9.2vw,78px)] leading-[0.94] font-extrabold tracking-[-0.045em]">
                <span className="linea">
                  <em className="text-action-deep not-italic">Viaja</em> mejor.
                </span>
                <span className="linea linea-2">Gasta menos.</span>
                <span className="linea linea-3">
                  <em className="text-action-deep not-italic">Conecta</em> más.
                </span>
              </h1>
            </div>

            <div className="para-cerca">
              <p className="enter enter-2 max-w-[44ch] text-[16.5px] leading-[1.38] font-light text-ink-600 md:text-[19px]">
                Partimos te conecta con personas que van a tu mismo destino.
                Viajes cómodos, compartidos y directos: sin terminal, sin
                trasbordos y con una sola parada — la tuya.
              </p>
            </div>
          </div>

          {/* La recherche : deuxième sur téléphone, colonne de droite ensuite. */}
          <div
            id="buscar"
            className="enter enter-3 relative order-2 mt-7 scroll-mt-24 min-[960px]:col-start-2 min-[960px]:row-span-2 min-[960px]:row-start-1 min-[960px]:mt-[52px]"
          >
            {/* UNE forme de couleur pleine glissée SOUS la carte : là où le
                verre la recouvre, il la fond en lumière ; le coin qui
                dépasse reste net. Un seul objet, IMMOBILE — décision du
                propriétaire : l'animation de roulage distrayait plus
                qu'elle ne racontait. */}
            <span
              aria-hidden
              className="absolute -top-5 -left-6 size-24 rotate-[10deg] rounded-[20px] bg-[linear-gradient(135deg,#fde68a,#f59e0b_58%,#d97706)] opacity-90"
            />
            <div className="relative">
              <SearchCard />
            </div>
          </div>

          <ul className="solo-web enter enter-4 order-3 mt-8 grid grid-cols-2 border-t border-ink-200 min-[960px]:col-start-1 min-[960px]:row-start-2 min-[960px]:mt-0">
            {PROOF.map((item, index) => (
              <li
                key={item.title}
                className={[
                  "py-6",
                  index % 2 === 0 ? "border-r border-ink-200 pr-5" : "pl-5",
                  index > 1 ? "border-t border-ink-200" : "",
                ].join(" ")}
              >
                <GlassIcon
                  name={item.icon}
                  tone={item.tone}
                  size="sm"
                  className="mb-3 ml-2.5"
                />
                <b className="block font-display text-[15px] leading-tight font-bold tracking-[-0.02em] md:text-[17px]">
                  {item.title}
                </b>
                <span className="mt-1 block text-[13.5px] font-light text-ink-500">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="solo-web">
          <LiveStrip />
        </div>
      </div>
    </div>
  );
}

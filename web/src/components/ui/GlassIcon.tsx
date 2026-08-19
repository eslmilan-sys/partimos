import { Icon, type IconName } from "./Icon";

/**
 * ICÔNE EN VERRE — la signature du glassmorphisme de référence.
 *
 * Deux gouttes de couleur vive vivent DERRIÈRE une tuile de verre dépoli.
 * Là où la tuile les recouvre, son `backdrop-blur` les fond en lumière ;
 * là où elles dépassent, elles restent nettes. C'est ce contraste
 * net/flouté sur le même objet qui fait « verre » — pas la transparence
 * seule.
 *
 * Les couleurs sont celles de la maison — la rampe chaude, le vert lima,
 * le teal — jamais les violets des maquettes d'inspiration : on emprunte
 * la TECHNIQUE, pas la palette. Elles décorent, et rien d'autre : aucune
 * ne signale une action, un lien ou un état.
 *
 * Toujours `aria-hidden` : l'icône décore un titre qui porte déjà le
 * sens. Un lecteur d'écran n'a rien à faire de deux gouttes floutées.
 */

export type GlassTone =
  | "amber"
  | "naranja"
  | "tostado"
  | "green"
  | "teal";

/** UN rectangle de couleur, incliné, à moitié sous le verre — le même
 *  geste que le grand carré ambre de la carte de recherche, en petit.
 *  Un seul objet par icône : le motif vaut par sa rareté. */
/* LES GOUTTES DE COULEUR — CINQ TONS, ET UN RÔLE UNIQUE : DÉCORER.
   ─────────────────────────────────────────────────────────────────────
   Ces rectangles vivent DERRIÈRE du verre dépoli. Ce ne sont pas des
   couleurs d'interface : elles ne disent jamais « appuie ici », elles ne
   distinguent jamais un état. Elles donnent au produit ce qu'aucune
   grille de gris ne donne — une identité qu'on reconnaît d'un coup d'œil.

   ELLES AVAIENT ÉTÉ RAMENÉES À L'ORANGE, ET C'ÉTAIT UNE ERREUR.
   En unifiant la palette, j'ai fait glisser le ton `sky` dans la rampe
   chaude, au motif qu'« on ne varie pas en changeant de famille ». Le
   raisonnement vaut pour les couleurs qui PORTENT UN SENS — un lien, une
   action, une alerte. Il ne vaut pas ici : sous un flou, une goutte
   colorée n'est plus une couleur d'interface, c'est de la lumière. Trois
   oranges derrière du verre donnent trois fois la même lumière, et le
   propriétaire a vu exactement ça disparaître : « avant il y avait des
   éléments bleus, verts et d'autres couleurs derrière le glassmorphisme,
   ça donnait une identité ».

   Ce qui reste vrai de la correction : elles doivent s'ACCORDER. Le vert
   lima et le teal choisis ici sont les deux complémentaires naturelles de
   l'orange (opposées sur la roue), à saturation et à clarté comparables
   à celles de la rampe — donc elles chantent avec elle au lieu de se
   disputer. Un bleu roi ou un violet, eux, feraient revenir l'impression
   de deux produits mélangés.

   Chaque ton est un dégradé à trois arrêts : clair en haut à gauche,
   saturé au milieu, sombre en bas à droite. C'est cette diagonale qui
   fait qu'une goutte a du volume sous le verre au lieu d'être un aplat. */
const RECT: Record<GlassTone, string> = {
  /* Le jaune du matin — le plus clair de la rampe. */
  amber:
    "bg-[linear-gradient(135deg,var(--color-sol-200),var(--color-sol-400)_62%,var(--color-sol-600))]",
  /* L'orange de la maison. */
  naranja:
    "bg-[linear-gradient(135deg,var(--color-sol-300),var(--color-sol-500)_62%,var(--color-sol-700))]",
  /* Le brûlé du soir — le plus profond. */
  tostado:
    "bg-[linear-gradient(135deg,var(--color-sol-400),var(--color-sol-600)_62%,var(--color-sol-900))]",
  /* Le vert lima de la marque. Il porte AUSSI un sens ailleurs
     (« vérifié ») ; ici il ne fait que respirer. */
  green: "bg-[linear-gradient(135deg,#d9f99d,#84cc16_62%,#4d7c0f)]",
  /* Le teal — le froid qui répond à l'orange. Verdi plutôt que bleuté
     exprès : il tient la main au vert lima d'un côté et à l'ambre de
     l'autre, là où un bleu franc casserait la chaîne. */
  teal: "bg-[linear-gradient(135deg,#a7ede4,#16b3a4_62%,#0d6f6a)]",
};

export function GlassIcon({
  name,
  tone = "amber",
  size = "md",
  className = "",
}: {
  name: IconName;
  tone?: GlassTone;
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "size-10" : "size-12";
  const glyph = size === "sm" ? "size-[18px]" : "size-[22px]";
  const rect = `${size === "sm" ? "size-7" : "size-8"} rounded-[10px]`;
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 ${box} ${className}`}
    >
      <span
        className={`absolute -top-2 -left-2.5 rotate-[10deg] ${rect} ${RECT[tone]} opacity-90`}
      />
      <span className="relative z-[1] flex flex-1 items-center justify-center rounded-[14px] border border-white/60 bg-white/30 shadow-[inset_1px_1px_1px_rgb(255_255_255/0.65),0_10px_22px_-10px_rgb(23_56_76/0.25)] backdrop-blur-[7px] backdrop-saturate-150">
        <Icon name={name} className={`${glyph} text-ink-800`} />
      </span>
    </span>
  );
}

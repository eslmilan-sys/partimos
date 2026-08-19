import type { Photo as PhotoMeta } from "@/lib/photos";
import { asset } from "@/lib/site";

/**
 * Image responsive, sans `next/image`.
 *
 * L'export statique désactive l'optimisation d'images de Next : `next/image`
 * n'apporterait alors qu'une couche de JavaScript pour servir le fichier tel
 * quel. Un `<picture>` fait mieux, sans bundle : WebP d'abord, JPEG en repli,
 * `srcset` pour que le navigateur choisisse la largeur.
 *
 * Trois détails qui évitent les défauts classiques :
 * · `aspect-ratio` réserve la place avant le chargement — CLS nul sans
 *   rectangle gris ;
 * · la vignette floue en base64 sert de fond pendant ce temps ;
 * · `priority` bascule en `eager` + `fetchPriority=high` pour l'image du haut
 *   de page, qui est presque toujours le LCP.
 */
export function Photo({
  photo,
  sizes,
  className = "",
  imgClassName = "",
  priority = false,
  fill = false,
}: {
  photo: PhotoMeta;
  /** Indice de largeur pour le navigateur, ex. "(min-width: 960px) 50vw, 100vw". */
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /**
   * Mode « calque de fond » : l'image remplit son parent positionné au lieu
   * d'imposer son propre rapport de forme. Sans ce mode, l'`aspect-ratio` posé
   * en style inline l'emporte sur toute classe utilitaire — c'est la règle du
   * CSS, pas un caprice de Tailwind — et la photo s'affiche en bandeau au lieu
   * de couvrir la carte.
   */
  fill?: boolean;
}) {
  const widths = photo.widths.filter((w) => w <= photo.intrinsicWidth);
  const usable = widths.length > 0 ? widths : [photo.widths[0]];
  const largest = usable[usable.length - 1];

  const srcSet = (ext: string) =>
    usable
      .map((w) => `${asset(`/img/${photo.name}-${w}.${ext}`)} ${w}w`)
      .join(", ");

  return (
    <div
      className={`overflow-hidden bg-ink-100 ${fill ? "absolute inset-0 size-full" : "relative"} ${className}`}
      style={{
        ...(fill ? {} : { aspectRatio: photo.aspect }),
        backgroundImage: `url(data:image/webp;base64,${photo.blur})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <picture>
        <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
        <img
          src={asset(`/img/${photo.name}-${largest}.jpg`)}
          srcSet={srcSet("jpg")}
          sizes={sizes}
          alt={photo.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
          className={`size-full object-cover ${imgClassName}`}
        />
      </picture>
    </div>
  );
}

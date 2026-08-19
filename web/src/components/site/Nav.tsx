import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { AccountButton } from "./AccountButton";
import { Icon } from "@/components/ui/Icon";
import { PRIMARY_LINKS } from "./navigation";

/**
 * BARRE DE NAVIGATION
 *
 * Deux compositions, pas une seule qui se comprime.
 *
 * · Mobile : marque, compte, menu. Trois cibles, de l'air entre elles.
 *   Chercher et publier vivent dans la barre d'action basse et dans le menu —
 *   les empiler aussi en haut donnait cinq contrôles sur 390 px, dont un
 *   bouton texte qui passait sur deux lignes et gonflait l'en-tête à 85 px.
 * · À partir de 900 px : les destinations apparaissent, et les deux actions
 *   reviennent en haut, là où il y a la place de les lire.
 *
 * Les éléments qui apparaissent selon la taille sont ENVELOPPÉS dans un
 * élément porteur de la règle d'affichage. Poser `hidden` directement sur un
 * bouton dont la classe de base contient `inline-flex` ne masque rien : les
 * deux utilitaires visent `display` et c'est l'ordre de la feuille de style
 * qui gagne. C'est exactement le bug qui déformait cette barre.
 *
 * ---------------------------------------------------------------------------
 * ELLE FLOTTE, DÉTACHÉE DU BORD.
 *
 * C'est le geste qui change tout : la barre n'est plus un bandeau collé en
 * haut mais un objet posé SUR la page, qui laisse voir le premier écran
 * passer dessous. Deux précautions vont avec, et ce sont elles qu'on voit
 * casser partout où ce geste est copié sans réfléchir :
 *
 *   · ELLE RESTE DANS LE FLUX (`sticky`). Sa place est donc réservée par
 *     elle-même, pour toutes les pages — pas un `padding-top` recopié page
 *     par page qu'on oublierait sur la septième. Et cette place ne bouge PAS
 *     quand la barre se contracte au défilement, sinon le contenu sauterait
 *     au premier pixel.
 *
 *   · LE FOND TIENT LE CONTRASTE SUR N'IMPORTE QUOI. La barre survole le
 *     premier écran clair, mais aussi la section de paiement, qui est sombre.
 *     Le verre est translucide : sa valeur composite descend avec ce qui
 *     passe dessous. D'où `--on-glass-muted` (voir `globals.css`) plutôt
 *     qu'un `text-ink-500` qui serait juste ici et faux trois écrans plus
 *     bas — il y tomberait à 3,6:1.
 */
export function Nav() {
  return (
    <>
      {/* `sticky`, PAS `fixed`. Les deux tiennent dans un navigateur — mais le
          fichier autonome se regarde aussi dans des lecteurs embarqués (l'app
          claude.ai sur téléphone, des visionneuses WebView) qui font défiler
          un conteneur EXTERNE : un `fixed` ne s'y accroche jamais et la barre
          part avec la page. C'est le bug remonté par le client. `sticky`
          reste dans le flux, donc plus besoin de réservoir de hauteur. */}
      <header className="pointer-events-none sticky top-0 z-50 px-3 pt-[var(--nav-gap)] pb-[var(--nav-gap)]">
        <nav
          aria-label="Principal"
          className="glass nav-pill pointer-events-auto mx-auto flex h-[var(--nav-h)] max-w-[1120px] items-center gap-3 rounded-full pr-2.5 pl-4 sm:pr-3 sm:pl-6"
        >
          <Logo gradientId="brand-nav" />

          <ul className="ml-4 hidden items-center gap-7 text-[14.5px] font-medium text-[var(--on-glass-muted)] min-[900px]:flex">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-2 transition-colors hover:text-ink-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden min-[900px]:block">
              <Link
                href="/publicar/nuevo"
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14.5px] font-semibold text-[var(--on-glass-muted)] transition-colors hover:bg-white/70 hover:text-ink-900"
              >
                <Icon name="plus" className="size-4" />
                Publicar
              </Link>
            </span>

            <span className="hidden min-[900px]:block">
              <ButtonLink href="/buscar" size="sm" className="rounded-full!">
                Buscar viaje
              </ButtonLink>
            </span>

            {/* Sur mobile, compte et menu partagent UNE capsule — un seul
                objet à droite, qui répond à la marque à gauche. Deux cercles
                indépendants (avatar plein + hamburger cerclé) se lisaient
                comme deux boutons dépareillés. À partir de 900 px la capsule
                s'efface : le menu disparaît, l'avatar vit seul. */}
            <div className="flex items-center gap-0.5 rounded-full border-[1.5px] border-ink-200/80 bg-white/60 p-[3px] min-[900px]:border-0 min-[900px]:bg-transparent min-[900px]:p-0">
              <AccountButton />
              <MobileMenu />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}

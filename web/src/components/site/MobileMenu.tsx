"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import { AuthDialog } from "./AuthDialog";
import { NAV_SECTIONS } from "./navigation";
import { useSession } from "@/lib/session";

/**
 * Menu mobile — un panneau, pas un accordéon caché derrière trois traits.
 *
 * Il liste TOUTES les pages, groupées par intention (voyager / conduire /
 * la plateforme), parce que la critique de fond était : « on ne sait pas
 * quelles pages existent ». Une barre de navigation qui cache le plan du site
 * derrière une icône ne répond pas à cette question.
 */
export function MobileMenu() {
  /* Le menu doit savoir QUI le lit. Il proposait « Conectarme » à
     quelqu'un déjà connecté — la première chose qu'on voit en ouvrant le
     menu, et elle dit le contraire de la vérité. */
  const { session, signOut } = useSession();

  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label="Abrir el menú"
        className="flex size-9 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-ink-50 min-[900px]:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-night-950/55 motion-safe:animate-[fade-in_0.18s_ease-out]" />
        <Dialog.Content className="glass liquid fixed inset-y-0 right-0 z-[120] flex w-[min(360px,88vw)] flex-col [--glass-alpha:0.93] shadow-float motion-safe:animate-[drawer-in_0.24s_cubic-bezier(0.2,0.9,0.3,1)]">
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
            <Dialog.Title className="font-display text-[17px] font-bold">
              Menú
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar el menú"
              className="flex size-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <Icon name="cross" className="size-4.5" />
            </Dialog.Close>
          </div>

          {/* Une ligne = un lien, rien d'autre. Les sous-titres
              expliquaient chaque page ET noyaient toutes les pages :
              un menu se scanne, il ne se lit pas. La hiérarchie tient
              en deux niveaux typographiques — l'étiquette de groupe en
              petites capitales grises, le lien en un seul corps. */}
          <nav
            aria-label="Todas las páginas"
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {NAV_SECTIONS.map((section) => (
              <div
                key={section.title}
                className="mb-2 border-b border-ink-200/60 pb-2 last:mb-0 last:border-0 last:pb-0"
              >
                <h3 className="px-3 pt-2 pb-1.5 text-[11.5px] font-bold tracking-[0.16em] text-ink-400 uppercase">
                  {section.title}
                </h3>
                <ul>
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Dialog.Close asChild>
                        <Link
                          href={link.href}
                          className="flex items-center gap-3.5 rounded-[14px] px-3 py-3 text-[16.5px] font-semibold tracking-[-0.01em] transition-colors hover:bg-ink-50"
                        >
                          <Icon
                            name={link.icon}
                            className="size-[19px] shrink-0 text-ink-400"
                          />
                          {link.label}
                        </Link>
                      </Dialog.Close>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* UN SEUL GESTE AU PIED DU MENU, et il dépend de qui lit.
              Déconnecté : entrer. Connecté : son nom et la sortie —
              proposer « Conectarme » à quelqu'un qui est déjà dedans, c'est
              la première ligne du menu qui ment. */}
          <div className="flex flex-col gap-2.5 border-t border-ink-200 px-5 py-4">
            {session ? (
              <>
                <Dialog.Close asChild>
                  <Link
                    href="/cuenta"
                    className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-ink-200 px-4 py-3 transition-colors hover:border-accent"
                  >
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-[14.5px] font-bold text-ink-50"
                    >
                      {session.firstName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[15px] font-bold">
                        {session.firstName}
                      </span>
                      <span className="block text-[12.5px] text-ink-500">
                        Mi cuenta y mis viajes
                      </span>
                    </span>
                  </Link>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <button
                    onClick={signOut}
                    className="w-full rounded-[14px] px-5 py-2.5 text-[14.5px] font-semibold text-ink-500 transition-colors hover:text-ink-900"
                  >
                    Salir de mi cuenta
                  </button>
                </Dialog.Close>
              </>
            ) : (
              <AuthDialog
                trigger={
                  <button className="w-full rounded-[14px] border-[1.5px] border-ink-200 px-5 py-3 font-display text-[15px] font-bold transition-colors hover:border-accent hover:text-accent-ink">
                    Conectarme
                  </button>
                }
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { Icon } from "@/components/ui/Icon";

/**
 * Avatar de compte, toujours visible.
 *
 * Déconnecté, il mène quand même à `/cuenta`, qui explique ce qu'on y trouve
 * et propose d'entrer. Un bouton qui ouvre un modal de connexion sans dire ce
 * qu'il y a derrière se fait ignorer.
 *
 * Les deux états ont la même taille, donc le passage de « déconnecté » à
 * « connecté » après lecture du stockage ne décale rien.
 */
export function AccountButton() {
  const { session } = useSession();

  return (
    <Link
      href="/cuenta"
      aria-label={
        session ? `Mi cuenta, ${session.firstName}` : "Entrar a mi cuenta"
      }
      className="flex size-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-85"
    >
      {session ? (
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-ink-900 font-display text-[14.5px] font-bold text-ink-50"
        >
          {session.firstName.charAt(0).toUpperCase()}
        </span>
      ) : (
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-ink-50 text-ink-600"
        >
          <Icon name="user" className="size-5" />
        </span>
      )}
    </Link>
  );
}

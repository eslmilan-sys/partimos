"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useProveedores } from "./proveedores";

/**
 * « ¿CÓMO QUIERES CREAR TU CUENTA? » — le choix du canal, à part.
 *
 * Demande du propriétaire, exemple à l'appui. Ce n'est pas un écran de
 * plus pour le plaisir : sur la porte, le titre, la photo, les trois
 * arguments ET quatre boutons de connexion se disputaient le même
 * écran. Ici la question est seule, et les canaux ont la même taille —
 * celui qui n'a pas de compte Google ne doit pas avoir l'impression
 * d'emprunter la porte de service.
 *
 * LE COURRIEL EN PREMIER, et c'est réfléchi : c'est le seul qui marche
 * quel que soit l'état de la base.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ON N'AFFICHE QUE CE QUI EXISTE.
 *
 * Le site montrait Google et Apple, l'app Google et LinkedIn : deux
 * listes écrites à la main, dans deux fichiers, dont aucune ne
 * correspondait forcément au projet. Un bouton qui mène à « provider is
 * not enabled » au milieu d'un écran de connexion est pire qu'un bouton
 * absent — c'est une impasse au moment précis où l'on s'engage.
 *
 * La configuration publique de Supabase dit la vérité ; on la lit. En
 * cas de doute (réseau coupé, réponse illisible) on n'affiche AUCUN
 * bouton social : le courriel, lui, marche toujours.
 */

type Estado = { texto: string } | null;

type Puerta = {
  id: "google" | "apple" | "linkedin_oidc";
  nombre: string;
  glifo: React.ReactNode;
};

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="size-[20px]" aria-hidden>
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.5-4.5 6.3l6.9 5.4c4.1-3.8 6.6-9.4 6.6-15z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 9.9l7.1-5.5z" />
      <path fill="#EA4335" d="M24 10.5c4.1 0 6.9 1.8 8.5 3.3l6.1-6C34.9 4.4 29.9 2 24 2 15.4 2 8.1 6.9 4.4 14.1l7.1 5.5c1.8-5.3 6.7-9.1 12.5-9.1z" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 384 512" className="size-[19px]" aria-hidden>
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[20px]" aria-hidden>
      <path fill="#0A66C2" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

const PUERTAS: Puerta[] = [
  { id: "google", nombre: "Google", glifo: <GoogleGlyph /> },
  { id: "apple", nombre: "Apple", glifo: <AppleGlyph /> },
  { id: "linkedin_oidc", nombre: "LinkedIn", glifo: <LinkedInGlyph /> },
];

export function ComoEntrar({
  onCorreo,
  onAcceder,
  onCerrar,
  pantallaCompleta = true,
}: {
  onCorreo: () => void;
  onAcceder: () => void;
  onCerrar: () => void;
  pantallaCompleta?: boolean;
}) {
  const [estado, setEstado] = useState<Estado>(null);
  const [cargando, setCargando] = useState<string | null>(null);
  const { proveedores } = useProveedores();

  const disponibles = PUERTAS.filter((p) => proveedores?.[p.id]);

  async function social(p: Puerta) {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      setEstado({
        texto: `${p.nombre} necesita la base conectada. Con tu correo funciona ahora mismo.`,
      });
      return;
    }
    setCargando(p.id);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: p.id,
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) {
      setCargando(null);
      setEstado({
        texto: /not enabled|disabled/i.test(error.message)
          ? `${p.nombre} todavía no está activado. Con tu correo funciona ahora mismo.`
          : `${p.nombre} no respondió: ${error.message}`,
      });
    }
  }

  const marco = pantallaCompleta
    ? "flex min-h-[100dvh] flex-col bg-white px-6 pt-[calc(14px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))]"
    : "flex flex-col px-1 pb-1";

  return (
    <div className={marco}>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="glass -ml-1 flex size-11 shrink-0 items-center justify-center rounded-full"
      >
        <Icon name="cross" className="size-5" />
      </button>

      <div className="flex-1 pt-8">
        <h1 className="font-display text-[28px] leading-[1.12] font-extrabold tracking-[-0.035em]">
          ¿Cómo quieres crear tu cuenta?
        </h1>

        <div className="mt-7 grid gap-2.5">
          <button
            type="button"
            onClick={onCorreo}
            className="cta-naranja flex h-[56px] items-center justify-center gap-3 rounded-full px-6 font-display text-[16px] font-bold"
          >
            <Icon name="mail" className="size-5" />
            Continuar con mi correo
          </button>

          {disponibles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => void social(p)}
              disabled={cargando !== null}
              className="flex h-[56px] items-center justify-center gap-3 rounded-full border-[1.5px] border-ink-200 bg-white px-6 text-[15.5px] font-semibold transition-colors hover:border-ink-300 disabled:opacity-60"
            >
              {p.glifo}
              {cargando === p.id
                ? `Abriendo ${p.nombre}…`
                : `Continuar con ${p.nombre}`}
            </button>
          ))}

          {estado && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13.5px] leading-snug text-danger"
            >
              <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
              {estado.texto}
            </p>
          )}
        </div>

        <p className="mt-8 font-display text-[17px] font-bold">¿Ya tienes cuenta?</p>
        <button
          type="button"
          onClick={onAcceder}
          className="mt-1 text-[15px] font-bold text-sol-700 underline-offset-2 hover:underline"
        >
          Iniciar sesión
        </button>

        {/* LE TEXTE LÉGAL EST ICI, où l'on s'engage — et nulle part
            ailleurs dans l'app. C'est le moment exact où il veut dire
            quelque chose : on accepte en créant le compte, pas en
            regardant une liste de viajes. */}
        <p className="mt-8 text-[12.5px] leading-relaxed text-ink-400">
          Al crear tu cuenta aceptas los{" "}
          <Link href="/terminos" className="font-semibold text-ink-600 underline">
            términos de uso
          </Link>{" "}
          y el{" "}
          <Link href="/privacidad" className="font-semibold text-ink-600 underline">
            aviso de privacidad
          </Link>
          . Partimos conecta a particulares que comparten los gastos de un viaje;
          no es una empresa de transporte y no fija precios de pasaje.
        </p>
      </div>
    </div>
  );
}

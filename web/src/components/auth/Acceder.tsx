"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/lib/session";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { huella } from "@/lib/clave";
import { readPastedAuth } from "@/lib/otp-link";
import { useInstalada } from "@/lib/instalada";

/**
 * ENTRER — DEUX CHEMINS, ET LES DEUX SONT DES BOUTONS.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QUE ÇA RÉPARE.
 *
 * Il y avait DEUX écrans de connexion dans le même produit. Celui de
 * l'app : blanc, orange, mot de passe seul — un compte créé par lien
 * magique n'y entrait jamais, il n'y avait simplement pas de porte.
 * Celui du site : une carte bleu nuit, avec le lien caché derrière une
 * ligne de texte souligné (« No tengo contraseña »). Deux dessins, deux
 * palettes, deux comportements, un seul produit.
 *
 * Ici il n'y en a qu'un, et les deux chemins sont des BOUTONS :
 *
 *   · LE MOT DE PASSE. C'est le chemin normal : il n'attend rien, ne
 *     dépend d'aucun serveur de courriel, marche hors ligne et sur
 *     n'importe quel appareil.
 *   · LE LIEN PAR COURRIEL. Ce n'est pas un repli honteux — c'est la
 *     SEULE porte pour qui a créé son compte avec Google ou par un lien,
 *     et n'a donc jamais choisi de mot de passe. Le cacher derrière du
 *     texte souligné, c'est l'enfermer dehors.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ET QUAND LE LIEN NE REVIENT PAS.
 *
 * Le chemin réel de nos gens est un iPhone : on demande le lien dans
 * Safari, Mail l'ouvre dans son propre navigateur. Le champ « colle le
 * lien ici » n'est donc pas un pansement de développeur, c'est le
 * rattrapage d'un cas qui arrive tous les jours (`lib/otp-link.ts` sait
 * lire les quatre formes que Supabase peut envoyer).
 */

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Un prénom présentable tiré du courriel, faute de mieux : « milan.r »
 *  devient « Milan ». Il sera remplacé dès que la personne le corrige
 *  dans son profil — mais un « Tú » générique en tête d'app est pire. */
function nombreDesde(correo: string): string {
  const bruto = correo.split("@")[0].split(/[._-]/)[0] ?? "";
  if (!bruto) return "Tú";
  return bruto.charAt(0).toUpperCase() + bruto.slice(1).toLowerCase();
}

type Vista = "formulario" | "enlace";

export function Acceder({
  onListo,
  onAtras,
  onRegistro,
  /** `false` retire l'écran plein et la marge d'encoche : le composant se
   *  glisse alors dans la feuille du site, qui les fournit elle-même. */
  pantallaCompleta = true,
}: {
  /** La session est ouverte. C'est un ÉVÉNEMENT, pas une fermeture :
   *  l'app laisse passer, le site referme sa feuille. Les confondre
   *  faisait sortir du parcours quelqu'un qui voulait juste revenir. */
  onListo: () => void;
  /** La croix. Revenir d'où l'on vient, sans avoir rien obtenu. */
  onAtras: () => void;
  onRegistro: () => void;
  pantallaCompleta?: boolean;
}) {
  const { session, signIn } = useSession();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<
    "clave" | "enlace" | "pegado" | "codigo" | null
  >(null);
  const [vista, setVista] = useState<Vista>("formulario");
  const [pegado, setPegado] = useState("");
  /* LES SIX CHIFFRES. Ils étaient partis avec l'ancien dialogue du site,
     et c'est exactement ce qui manquait : « quand j'envoie le code par
     courriel, ça ouvre le SITE, donc je ne peux pas entrer dans l'app ».
     C'est vrai et c'est structurel — une app installée sur iPhone a son
     propre bac à sable ; le lien ouvert par Mail atterrit dans Safari, et
     la session ouverte là-bas n'y sera jamais visible. Un CODE, lui, se
     recopie à la main dans l'app, et il n'a besoin d'aucun navigateur. */
  const [codigo, setCodigo] = useState("");
  const [puedeReenviar, setPuedeReenviar] = useState(true);
  const reenvio = useRef<number>(0);
  /* Installée, l'app montre le code EN PREMIER — c'est le seul chemin qui
     marche chez elle (voir lib/instalada.ts). Dans un navigateur, le lien
     reste le geste le plus court : un tap au lieu de six chiffres. */
  const instalada = useInstalada();

  const correoValido = CORREO.test(correo.trim());
  const puedeEntrar = correoValido && clave.length > 0;

  /* ── Le mot de passe ──────────────────────────────────────────────── */
  async function entrarConClave() {
    if (!puedeEntrar) {
      setTocado(true);
      return;
    }
    setFallo(null);
    setOcupado("clave");

    const supabase = getSupabase();
    if (isSupabaseConfigured && supabase) {
      /* LE SERVEUR VÉRIFIE. C'est lui qui sait si le mot de passe est
         bon, et lui seul : la session naît de sa réponse. */
      const { error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: clave,
      });
      setOcupado(null);
      if (!error) {
        onListo();
        return;
      }
      /* LA VRAIE CAUSE, jamais « inténtalo de nuevo ». Un compte non
         confirmé, un mot de passe faux et un compte SANS mot de passe
         sont trois problèmes différents, et chacun a sa sortie. */
      if (/email not confirmed/i.test(error.message)) {
        setFallo(
          "Tu cuenta existe pero falta confirmar el correo. Ábrelo desde el enlace que te mandamos — si no lo encuentras, mira en spam.",
        );
        return;
      }
      if (/invalid login credentials/i.test(error.message)) {
        setFallo(
          "Ese correo y esa contraseña no coinciden. Si nunca escogiste una contraseña, entra con el enlace por correo — es el botón de abajo.",
        );
        return;
      }
      setFallo(`El servidor no respondió bien: ${error.message}`);
      return;
    }

    /* SANS BASE : on recompare l'empreinte gardée sur ce téléphone. Ce
       n'est pas de la sécurité (voir lib/clave.ts) — c'est le parcours
       rendu fidèlement, avec un vrai refus quand le mot de passe ne
       correspond pas. */
    const marca = await huella(clave);
    setOcupado(null);
    if (session?.claveHuella && session.contact === correo.trim()) {
      if (session.claveHuella !== marca) {
        setFallo("Esa contraseña no corresponde. Vuelve a intentar.");
        return;
      }
      onListo();
      return;
    }
    if (session?.claveHuella) {
      setFallo(
        "En este teléfono no hay ninguna cuenta con ese correo. Crea una, o entra con el correo que usaste aquí.",
      );
      return;
    }
    signIn(correo.trim(), nombreDesde(correo.trim()), "");
    onListo();
  }

  /* ── Le lien par courriel ─────────────────────────────────────────── */
  async function mandarEnlace() {
    if (!correoValido) {
      setTocado(true);
      setFallo("Escribe tu correo y te mandamos el enlace.");
      return;
    }
    setFallo(null);
    setOcupado("enlace");

    const supabase = getSupabase();
    if (!isSupabaseConfigured || !supabase) {
      setOcupado(null);
      setFallo(
        "En esta demostración todavía no mandamos correos. Entra con tu contraseña.",
      );
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: {
        /* « Entrar » n'invente jamais de compte. Sans ça, se tromper
           d'adresse en se connectant créait silencieusement un deuxième
           compte vide — et la personne jurait avoir perdu ses viajes. */
        shouldCreateUser: false,
        /* Où le lien doit RETOMBER. Sans ça, Supabase renvoie sur son
           « Site URL » — resté sur localhost, le lien meurt dans le
           téléphone de la personne. */
        emailRedirectTo: window.location.href,
      },
    });
    setOcupado(null);

    if (error) {
      const codigo = (error as { code?: string }).code ?? "";
      const status = (error as { status?: number }).status ?? 0;
      if (codigo === "over_email_send_rate_limit" || status === 429) {
        setFallo(
          "El servidor de correo llegó a su tope de envíos por hora. No sirve volver a intentar ahora: espera un rato, o revisa si ya te llegó un correo de antes — todavía sirve.",
        );
        return;
      }
      if (/signup|not found|user.*exist/i.test(error.message)) {
        setFallo(
          "No hay cuenta con ese correo. Créala aquí abajo, toma menos de un minuto.",
        );
        return;
      }
      setFallo("No pudimos mandar el correo. Espera un momento y vuelve a intentar.");
      return;
    }

    /* Un envoi réussi ferme la porte une minute : le quota est petit et
       partagé par TOUT le site — chaque « reenviar » impatient le brûlait
       pour la personne suivante. */
    setPuedeReenviar(false);
    window.clearTimeout(reenvio.current);
    reenvio.current = window.setTimeout(() => setPuedeReenviar(true), 60_000);
    setVista("enlace");
  }

  /** Les six chiffres du courriel. Le chemin de l'app installée. */
  async function usarCodigo() {
    const limpio = codigo.replace(/\D/g, "");
    if (limpio.length !== 6) {
      setFallo("El código tiene seis dígitos.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setFallo(null);
    setOcupado("codigo");
    const { error } = await supabase.auth.verifyOtp({
      email: correo.trim(),
      token: limpio,
      type: "email",
    });
    setOcupado(null);
    if (error) {
      setFallo("Ese código no es correcto o ya venció. Pide otro.");
      return;
    }
    onListo();
  }

  /** Le lien collé à la main, quand toucher le lien n'a pas ramené ici. */
  async function usarPegado() {
    const leido = readPastedAuth(pegado);
    if (leido.kind === "nada") {
      setFallo(
        "Eso no parece el enlace del correo. Copia el enlace completo, empezando por https://",
      );
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setFallo(null);
    setOcupado("pegado");

    let error = null;
    if (leido.kind === "hash") {
      ({ error } = await supabase.auth.verifyOtp({
        token_hash: leido.tokenHash,
        type: leido.type as "email",
      }));
    } else if (leido.kind === "session") {
      ({ error } = await supabase.auth.setSession({
        access_token: leido.accessToken,
        refresh_token: leido.refreshToken,
      }));
    } else if (leido.kind === "pkce") {
      ({ error } = await supabase.auth.exchangeCodeForSession(leido.code));
    } else {
      ({ error } = await supabase.auth.verifyOtp({
        email: correo.trim(),
        token: leido.token,
        type: "email",
      }));
    }
    setOcupado(null);
    if (error) {
      setFallo("Ese enlace ya se usó o venció. Pide otro y pega el nuevo.");
      return;
    }
    onListo();
  }

  const marco = pantallaCompleta
    ? "flex min-h-[100dvh] flex-col bg-white px-6 pt-[calc(14px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))]"
    : "flex flex-col px-1 pb-1";

  /* ── L'écran « revisa tu correo » ─────────────────────────────────── */
  if (vista === "enlace") {
    return (
      <div className={marco}>
        <button
          type="button"
          onClick={() => {
            setVista("formulario");
            setFallo(null);
          }}
          aria-label="Atrás"
          className="glass -ml-1 flex size-11 shrink-0 items-center justify-center rounded-full"
        >
          <Icon name="arrowRight" className="size-5 rotate-180" />
        </button>

        <div className="flex-1 pt-8">
          <span className="superficie-sol mb-5 flex size-14 items-center justify-center rounded-[18px] text-sol-700">
            <Icon name="mail" className="size-6" />
          </span>
          <h1 className="font-display text-[28px] leading-[1.12] font-extrabold tracking-[-0.035em]">
            Revisa tu correo
          </h1>
          <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-ink-500">
            Le mandamos un correo a{" "}
            <b className="font-semibold text-ink-900">{correo.trim()}</b>.
            {instalada
              ? " Trae un código de seis dígitos: escríbelo aquí y entras."
              : " Toca el enlace y quedas dentro — no tienes que volver aquí."}
          </p>

          {/* ── LES SIX CHIFFRES ──────────────────────────────────────
              POURQUOI ILS EXISTENT, ET POURQUOI ILS PASSENT DEVANT DANS
              L'APP INSTALLÉE.

              « Quand j'envoie le code par courriel, ça ouvre le site,
              donc je ne peux pas entrer dans l'app. » C'est exact, et ce
              n'est pas un réglage à corriger : sur iPhone, une app
              installée a son propre bac à sable. Mail ouvre le lien dans
              Safari, la session naît là-bas, et l'app ne la verra
              jamais.

              Un code, lui, ne dépend d'aucun navigateur : on le recopie
              où l'on veut entrer. C'est le SEUL chemin par courriel qui
              marche dans une app installée, donc c'est celui qu'elle
              montre en premier. */}
          <div
            className={`mt-6 rounded-[18px] border-[1.5px] p-4 ${
              instalada
                ? "border-sol-300 bg-sol-50"
                : "border-ink-200 bg-white"
            }`}
          >
            <label
              htmlFor="acc-codigo"
              className="mb-1.5 block text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase"
            >
              Código de seis dígitos
            </label>
            <input
              id="acc-codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus={instalada}
              value={codigo}
              onChange={(e) =>
                setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className={`tnum text-center text-[24px] font-bold tracking-[0.34em] ${campo()}`}
            />
            <button
              type="button"
              onClick={() => void usarCodigo()}
              disabled={codigo.length !== 6 || ocupado !== null}
              className="cta-naranja mt-3 flex h-[50px] w-full items-center justify-center rounded-full px-6 font-display text-[15.5px] font-bold"
            >
              {ocupado === "codigo" ? "Entrando…" : "Entrar con el código"}
            </button>
            <p className="mt-2 text-[12px] leading-snug text-ink-500">
              {instalada
                ? "El enlace del correo abre el navegador, no la app — por eso aquí se usa el código."
                : "Si tu correo trae seis dígitos en vez de un enlace, escríbelos aquí."}
            </p>
          </div>

          {/* LE LIEN COLLÉ — le rattrapage du navigateur. Sur iPhone, Mail
              ouvre le lien dans SON navigateur, où la session ne sert à
              rien. Ce champ existe pour ce cas précis. */}
          <details className="mt-4" open={!instalada}>
            <summary className="cursor-pointer text-[13.5px] font-semibold text-sol-700 underline-offset-2 hover:underline">
              Tengo un enlace, no un código
            </summary>
            <label htmlFor="acc-pegar" className="mt-3 block">
              <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
                ¿Tocarlo no te trajo de vuelta?
              </span>
              <input
                id="acc-pegar"
                type="url"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={pegado}
                onChange={(e) => setPegado(e.target.value)}
                placeholder="Pega aquí el enlace completo"
                className={campo()}
              />
            </label>
            <button
              type="button"
              onClick={() => void usarPegado()}
              disabled={!pegado.trim() || ocupado !== null}
              className="mt-3 flex h-[48px] w-full items-center justify-center rounded-full border-[1.5px] border-sol-200 bg-sol-50 px-6 font-display text-[15px] font-bold text-sol-800 transition-colors hover:border-sol-300 hover:bg-sol-100 disabled:opacity-50"
            >
              {ocupado === "pegado" ? "Entrando…" : "Entrar con este enlace"}
            </button>
          </details>

          {fallo && <Aviso>{fallo}</Aviso>}

          <p className="mt-5 text-center text-[13.5px] text-ink-500">
            {puedeReenviar ? "¿No te llegó? " : "Puedes pedir otro en un minuto. "}
            <button
              type="button"
              onClick={() => void mandarEnlace()}
              disabled={!puedeReenviar || ocupado !== null}
              className="font-bold text-sol-700 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Reenviar el correo
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ── L'écran de connexion ─────────────────────────────────────────── */
  return (
    <div className={marco}>
      <button
        type="button"
        onClick={onAtras}
        aria-label="Cerrar"
        className="glass -ml-1 flex size-11 shrink-0 items-center justify-center rounded-full"
      >
        <Icon name="cross" className="size-5" />
      </button>

      <form
        className="flex-1 pt-8"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void entrarConClave();
        }}
      >
        <h1 className="font-display text-[28px] leading-[1.12] font-extrabold tracking-[-0.035em]">
          Entra a tu cuenta
        </h1>
        <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-500">
          Con tu contraseña, o con un enlace que te mandamos por correo. Los dos
          abren la misma puerta.
        </p>

        <label htmlFor="acc-correo" className="mt-6 block">
          <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
            Correo
          </span>
          <input
            id="acc-correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu@correo.com"
            className={campo()}
          />
        </label>

        <label htmlFor="acc-clave" className="mt-4 block">
          <span className="mb-1.5 flex items-center justify-between text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
            Contraseña
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              className="text-[11.5px] font-bold tracking-[0.09em] text-sol-700 uppercase underline-offset-2 hover:underline"
            >
              {verClave ? "ocultar" : "ver"}
            </button>
          </span>
          <input
            id="acc-clave"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="••••••••"
            className={campo()}
          />
        </label>

        {((tocado && !puedeEntrar) || fallo) && (
          <Aviso>
            {fallo ??
              (correoValido
                ? "Escribe tu contraseña."
                : "Revisa el correo — falta la arroba o el punto.")}
          </Aviso>
        )}

        <button
          type="submit"
          disabled={ocupado !== null}
          className="cta-naranja mt-5 flex h-[54px] w-full items-center justify-center rounded-full px-6 font-display text-[16.5px] font-bold"
        >
          {ocupado === "clave" ? "Entrando…" : "Entrar"}
        </button>

        {/* LE SÉPARATEUR — il dit que ce qui suit est une ALTERNATIVE, pas
            une consolation. Sans lui, le deuxième bouton se lit comme une
            action secondaire du premier. */}
        <div
          aria-hidden
          className="my-4 flex items-center gap-3 text-[11.5px] font-bold tracking-[0.11em] text-ink-400 uppercase"
        >
          <span className="h-px flex-1 bg-ink-200" />o
          <span className="h-px flex-1 bg-ink-200" />
        </div>

        <button
          type="button"
          onClick={() => void mandarEnlace()}
          disabled={ocupado !== null}
          className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-sol-200 bg-sol-50 px-6 font-display text-[15.5px] font-bold text-sol-800 transition-colors hover:border-sol-300 hover:bg-sol-100 disabled:opacity-50"
        >
          <Icon name="mail" className="size-5" />
          {ocupado === "enlace" ? "Mandando…" : "Mándame un enlace"}
        </button>
        <p className="mt-2 text-center text-[12.5px] leading-snug text-ink-500">
          Útil si entraste con Google o si nunca escogiste una contraseña.
        </p>

        {!isSupabaseConfigured && (
          <p className="mt-4 rounded-[14px] bg-ink-50 px-4 py-3 text-[12.5px] leading-snug text-ink-500">
            En esta demostración la cuenta vive en este teléfono: comparamos una
            huella de tu contraseña guardada aquí. Todavía no mandamos correos.
          </p>
        )}

        <p className="mt-6 border-t border-ink-200 pt-4 text-center text-[13.5px] text-ink-500">
          ¿Todavía no tienes cuenta?{" "}
          <button
            type="button"
            onClick={onRegistro}
            className="font-bold text-sol-700 underline-offset-2 hover:underline"
          >
            Crear cuenta
          </button>
        </p>
      </form>
    </div>
  );
}

/** Le champ de la maison — une seule définition pour les deux moitiés. */
function campo() {
  return [
    "w-full rounded-[16px] border-[1.5px] border-ink-200 bg-ink-50 px-4 py-3.5",
    "text-[16px] text-ink-900 placeholder:text-ink-400 outline-none transition-colors",
    "focus:border-sol-600 focus:bg-white focus:ring-4 focus:ring-sol-100",
  ].join(" ");
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-2 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13.5px] leading-snug text-danger"
    >
      <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

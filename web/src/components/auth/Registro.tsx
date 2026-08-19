"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/lib/session";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { huella, LARGO_MINIMO } from "@/lib/clave";

/**
 * L'INSCRIPTION — UNE QUESTION PAR ÉCRAN.
 *
 * Demande explicite du propriétaire, exemple à l'appui : « il prend une
 * page par protocole. Je m'inscris d'abord nom prénom, ensuite âge et
 * sexe, ensuite num tel et mail ». C'est la forme qu'ont tous les
 * onboardings qui convertissent, et elle a une raison mesurable : un
 * formulaire de six champs se regarde comme un mur et se remplit à
 * moitié ; six écrans d'un champ se remplissent, parce qu'à chaque
 * instant on ne doit répondre qu'à une chose.
 *
 * TROIS CHOSES QUI FONT LA DIFFÉRENCE ENTRE CETTE FORME ET SA CARICATURE :
 *
 *   · ON PEUT REVENIR. Une flèche en haut à gauche à chaque étape, et le
 *     champ garde ce qui était écrit. Un tunnel sans marche arrière fait
 *     abandonner à la première faute de frappe.
 *   · L'ERREUR EST SOUS LE CHAMP, PAS APRÈS LA VALIDATION. On ne laisse
 *     pas quelqu'un traverser trois écrans pour apprendre que sa date de
 *     naissance ne va pas.
 *   · LE BOUTON SUIVANT NE MENT PAS. Il est éteint tant que la réponse
 *     n'est pas valable — pas actif puis refusé.
 *
 * CE QU'ELLE DEMANDE, ET POURQUOI CHAQUE CHOSE :
 *   1. nom et prénom — le passager voit « Milan R. », jamais le nom entier ;
 *   2. date de naissance — pour la MAJORITÉ, rien d'autre. On n'affiche
 *      pas d'âge : celui d'un passager ne regarde personne ;
 *   3. traitement — parce que le mode « solo mujeres » a besoin d'un
 *      choix déclaré, jamais d'une déduction sur le prénom. D'où la
 *      troisième porte, « prefiero no decirlo » ;
 *   4. correo — c'est la clé du compte ;
 *   5. celular — OBLIGATOIRE depuis le 2026-08-17, décision du
 *      propriétaire. Il ne sert toujours PAS à la mise en relation — le
 *      chat s'en charge et personne ne donne son numéro à personne — mais
 *      il est le seul canal qui atteigne quelqu'un le jour du viaje quand
 *      la notification n'arrive pas : un conducteur qui annule à 5 h du
 *      matin ne peut pas laisser un passager sur le trottoir faute de
 *      moyen de le prévenir.
 */

type Paso = 0 | 1 | 2 | 3 | 4 | 5;

const TRATOS = [
  { id: "senora", label: "Señora" },
  { id: "senor", label: "Señor" },
  { id: "sin-decir", label: "Prefiero no decirlo" },
] as const;

const MAYORIA = 18;

/** L'âge en années révolues à la date du jour. */
function edad(iso: string, hoy: Date): number {
  const n = new Date(`${iso}T12:00:00`);
  let a = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) a -= 1;
  return a;
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Registro({
  onListo,
  onAtras,
  /** `false` retire l'écran plein et la marge d'encoche : le composant se
   *  glisse alors dans la feuille du site, qui les fournit elle-même. */
  pantallaCompleta = true,
}: {
  /** Le compte est créé ET la session ouverte. */
  onListo: () => void;
  /** « Atrás » depuis la première question : on remonte d'un cran dans le
   *  parcours, on ne quitte pas le produit. Les deux étaient le MÊME
   *  rappel, et revenir en arrière fermait donc tout. */
  onAtras: () => void;
  pantallaCompleta?: boolean;
}) {
  const { signIn, updateSession } = useSession();

  const [paso, setPaso] = useState<Paso>(0);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [nacimiento, setNacimiento] = useState("");
  const [trato, setTrato] = useState<(typeof TRATOS)[number]["id"] | null>(null);
  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");
  const [clave, setClave] = useState("");
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState(false);
  const [degradado, setDegradado] = useState<string | null>(null);

  /* La date du jour est lue AU MOMENT DE VALIDER, jamais pendant le
     rendu : `new Date()` en corps de composant est impur, et le
     compilateur React le refuse. */
  const errorNacimiento = () => {
    if (!nacimiento) return "Escribe tu fecha de nacimiento.";
    const a = edad(nacimiento, new Date());
    if (Number.isNaN(a)) return "Esa fecha no se entiende.";
    if (a < MAYORIA)
      return `Hay que tener ${MAYORIA} años para usar Partimos. Es una condición legal, no una regla nuestra.`;
    if (a > 110) return "Revisa el año.";
    return null;
  };

  const valido: Record<Paso, boolean> = {
    0: nombre.trim().length >= 2 && apellido.trim().length >= 2,
    1: Boolean(nacimiento) && errorNacimiento() === null,
    2: trato !== null,
    3: CORREO.test(correo.trim()),
    /* Le celular est OBLIGATOIRE : au moins sept chiffres — le format
       un vrai numéro. Un champ obligatoire de plus ici coûterait plus
       d'inscriptions qu'il n'apporterait de contacts. */
    4: celular.replace(/\D/g, "").length >= 7,
    5: clave.length >= LARGO_MINIMO,
  };

  function siguiente() {
    if (!valido[paso]) {
      setTocado(true);
      return;
    }
    setTocado(false);
    if (paso < 5) {
      setPaso((paso + 1) as Paso);
      return;
    }
    void terminar();
  }

  /** Le compte local — le chemin de la démonstration, quand il n'y a
   *  pas de base du tout. */
  async function abrirLocal() {
    const marca = await huella(clave);
    signIn(correo.trim(), nombre.trim(), apellido.trim(), null);
    updateSession({
      birthDate: nacimiento,
      trato,
      phone: celular.trim(),
      claveHuella: marca,
    });
  }

  async function terminar() {
    setEnviando(true);
    setDegradado(null);

    const supabase = getSupabase();
    if (isSupabaseConfigured && supabase) {
      /* LE VRAI COMPTE. Supabase crée l'utilisateur et envoie le courriel
         de confirmation ; la session n'existera qu'une fois le lien
         ouvert. On ne l'ouvre donc PAS nous-mêmes — le faire ferait
         croire à une connexion que le serveur ne connaît pas.

         Les données du parcours partent dans `options.data` : elles
         atterrissent dans `raw_user_meta_data`, d'où le déclencheur de
         la base compose le profil. */
      const { data, error } = await supabase.auth.signUp({
        email: correo.trim(),
        password: clave,
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
          data: {
            first_name: nombre.trim(),
            last_name: apellido.trim(),
            birth_date: nacimiento,
            trato,
            phone: celular.trim(),
          },
        },
      });
      setEnviando(false);

      if (!error) {
        /* Session immédiate = confirmation par courriel désactivée côté
           projet. Sinon, on attend le lien, et on le dit. */
        if (data.session) {
          onListo();
          return;
        }
        setCorreoEnviado(true);
        return;
      }

      /* ÇA N'A PAS MARCHÉ — ON LE DIT, ET ON S'ARRÊTE LÀ.
         J'ai d'abord voulu ouvrir un compte local en repli. C'était une
         mauvaise idée : dès que Supabase est branché, la session vient
         de LUI, et une session locale posée à côté ne serait lue par
         personne — on aurait affiché « c'est bon » devant un compte qui
         n'existe nulle part. Un message exact et un bouton qu'on peut
         réessayer valent mieux qu'un faux succès. */
      const ya = /already registered|already exists|User already/i.test(error.message);
      const red = /Failed to fetch|NetworkError|load failed/i.test(error.message);
      setDegradado(
        ya
          ? "Ese correo ya tiene cuenta. Vuelve atrás y entra con « Iniciar sesión »."
          : red
            ? "No pudimos hablar con el servidor. Revisa tu conexión y vuelve a intentar."
            : `El servidor no pudo crear la cuenta: ${error.message}`,
      );
      return;
    }

    setEnviando(false);
    await abrirLocal();
    onListo();
  }

  function atras() {
    setTocado(false);
    if (paso === 0) {
      onAtras();
      return;
    }
    setPaso((paso - 1) as Paso);
  }

  const errores: Record<Paso, string | null> = {
    0:
      nombre.trim().length > 0 && nombre.trim().length < 2
        ? "Tu nombre, tal como te llaman."
        : null,
    1: nacimiento ? errorNacimiento() : null,
    2: null,
    3:
      correo.trim().length > 0 && !CORREO.test(correo.trim())
        ? "Revisa el correo — falta la arroba o el punto."
        : null,
    4:
      celular.trim().length > 0 && celular.replace(/\D/g, "").length < 7
        ? "Ese número parece corto — faltan dígitos."
        : null,
    5:
      clave.length > 0 && clave.length < LARGO_MINIMO
        ? `Al menos ${LARGO_MINIMO} caracteres. Una frase que recuerdes vale más que un signo raro.`
        : null,
  };
  const error = tocado || errores[paso] ? errores[paso] : null;

  return (
    <div
      className={
        pantallaCompleta
          ? "flex min-h-[100dvh] flex-col bg-white px-6 pt-[calc(14px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))]"
          : "flex flex-col px-1 pb-1"
      }
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={atras}
          aria-label={paso === 0 ? "Cerrar" : "Atrás"}
          className="glass -ml-1 flex size-11 shrink-0 items-center justify-center rounded-full"
        >
          <Icon
            name={paso === 0 ? "cross" : "arrowRight"}
            className={`size-5 ${paso === 0 ? "" : "rotate-180"}`}
          />
        </button>
        {/* LA PROGRESSION — cinq segments, pas une barre continue : on
            doit pouvoir COMPTER ce qui reste. « Encore trois » se
            supporte, « 60 % » ne veut rien dire dans un formulaire. */}
        <ol className="flex flex-1 gap-1.5" aria-label={`Paso ${paso + 1} de 6`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= paso ? "bg-naranja" : "bg-ink-200"
              }`}
            />
          ))}
        </ol>
      </div>

      <div className="flex-1 pt-8">
        {paso === 0 && (
          <Pregunta titulo="¿Cómo te llamas?" ayuda="Los demás verán tu nombre y la inicial de tu apellido — nunca el apellido completo.">
            <Campo
              id="reg-nombre"
              label="Nombre"
              value={nombre}
              onChange={setNombre}
              autoComplete="given-name"
              autoFocus
            />
            <Campo
              id="reg-apellido"
              label="Apellido"
              value={apellido}
              onChange={setApellido}
              autoComplete="family-name"
            />
            {nombre.trim() && apellido.trim() && (
              <p className="mt-2 text-[13px] text-ink-500">
                Aparecerás como{" "}
                <b className="font-semibold text-ink-900">
                  {nombre.trim()} {apellido.trim().charAt(0).toUpperCase()}.
                </b>
              </p>
            )}
          </Pregunta>
        )}

        {paso === 1 && (
          <Pregunta
            titulo="¿Cuándo naciste?"
            ayuda="Solo sirve para confirmar que eres mayor de edad. No mostramos tu edad a nadie."
          >
            <Campo
              id="reg-nacimiento"
              label="Fecha de nacimiento"
              type="date"
              value={nacimiento}
              onChange={setNacimiento}
              autoComplete="bday"
            />
          </Pregunta>
        )}

        {paso === 2 && (
          <Pregunta
            titulo="¿Cómo prefieres que te llamemos?"
            ayuda="Lo usamos para hablarte bien, y para el modo « solo mujeres » — que es opcional en los dos sentidos."
          >
            <ul className="grid gap-0 overflow-hidden rounded-[18px] border border-ink-200">
              {TRATOS.map((t, i) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTrato(t.id);
                      setTocado(false);
                    }}
                    aria-pressed={trato === t.id}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left text-[15.5px] font-semibold transition-colors ${
                      i > 0 ? "border-t border-ink-100" : ""
                    } ${trato === t.id ? "bg-naranja-suave text-naranja-hondo" : "bg-white"}`}
                  >
                    <span className="min-w-0 flex-1">{t.label}</span>
                    <Icon
                      name={trato === t.id ? "check" : "arrowRight"}
                      className={`size-[18px] shrink-0 ${
                        trato === t.id ? "text-naranja" : "text-ink-300"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Pregunta>
        )}

        {paso === 3 && (
          <Pregunta
            titulo="¿Cuál es tu correo?"
            ayuda="Es la llave de tu cuenta. Ahí te avisamos cuando un conductor acepta."
          >
            <Campo
              id="reg-correo"
              label="Correo"
              type="email"
              value={correo}
              onChange={setCorreo}
              autoComplete="email"
              inputMode="email"
              autoFocus
            />
          </Pregunta>
        )}

        {paso === 4 && (
          <Pregunta
            titulo="¿Cuál es tu celular?"
            ayuda="No se lo damos a nadie y la coordinación sigue pasando por el chat. Lo usamos solo para avisarte de tu viaje si falla la notificación."
          >
            <Campo
              id="reg-celular"
              label="Celular"
              type="tel"
              value={celular}
              onChange={setCelular}
              autoComplete="tel"
              inputMode="tel"
              placeholder="6000-0000"
            />
          </Pregunta>
        )}

        {paso === 5 && (
          <Pregunta
            titulo="Crea tu contraseña"
            ayuda="Con ella entras la próxima vez. Una frase que recuerdes vale más que un signo raro."
          >
            <Campo
              id="reg-clave"
              label="Contraseña"
              type="password"
              value={clave}
              onChange={setClave}
              autoComplete="new-password"
              autoFocus
            />
            {/* LE TEXTE LÉGAL VIT ICI AUSSI, et il le faut.
                Il n'était que sur « ¿cómo quieres crear tu cuenta? » —
                un écran qu'on saute désormais quand il n'y a qu'une
                porte. Une mention d'acceptation qui dépend d'un écran
                facultatif n'est pas une mention d'acceptation. Elle est
                à sa place : juste au-dessus du geste qui engage. */}
            <p className="mt-1 text-[12px] leading-relaxed text-ink-400">
              Al crear tu cuenta aceptas los{" "}
              <Link href="/terminos" className="font-semibold text-ink-600 underline">
                términos de uso
              </Link>{" "}
              y el{" "}
              <Link href="/privacidad" className="font-semibold text-ink-600 underline">
                aviso de privacidad
              </Link>
              .
            </p>
            {!isSupabaseConfigured && (
              /* CE QUE CETTE ÉTAPE FAIT VRAIMENT. La base n'est pas
                 branchée : on garde une empreinte sur le téléphone et on
                 la recompare à la connexion. Ça reproduit fidèlement le
                 parcours, ça ne protège de personne — et le dire vaut
                 mieux que laisser croire à un compte gardé ailleurs. */
              <p className="mt-2 rounded-[14px] bg-ink-50 px-4 py-3 text-[12.5px] leading-snug text-ink-500">
                En esta demostración tu cuenta vive en este teléfono: guardamos
                una huella de tu contraseña aquí mismo, nunca la contraseña. No
                mandamos correos todavía.
              </p>
            )}
          </Pregunta>
        )}

        {correoEnviado && (
          <div className="mt-5 rounded-[18px] bg-verde-suave p-4">
            <p className="font-display text-[16px] font-bold text-verde-ok">
              Revisa tu correo
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">
              Le mandamos un enlace a{" "}
              <b className="font-semibold text-ink-900">{correo.trim()}</b>.
              Ábrelo en este teléfono y tu cuenta queda lista. Si no llega en
              un minuto, mira en spam.
            </p>
          </div>
        )}

        {degradado && (
          <p
            role="alert"
            className="mt-3 rounded-[12px] bg-naranja-suave px-3.5 py-2.5 text-[13.5px] leading-snug text-ink-600"
          >
            {degradado}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13.5px] leading-snug text-danger"
          >
            <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {/* LE BOUTON SUIVANT — rond, en bas à droite, comme dans l'exemple.
          Il est là où tombe le pouce d'une main droite, et il ne bouge
          pas d'un écran à l'autre : c'est ce qui rend la suite
          d'écrans rapide au lieu de laborieuse. */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <span className="text-[13px] text-ink-400">Paso {paso + 1} de 6</span>
        <button
          type="button"
          onClick={siguiente}
          disabled={!valido[paso] || enviando || correoEnviado}
          aria-label={paso === 5 ? "Crear mi cuenta" : "Siguiente"}
          className="cta-naranja flex size-[58px] items-center justify-center rounded-full disabled:cursor-not-allowed"
        >
          <Icon name={paso === 5 ? "check" : "arrowRight"} className="size-6" />
        </button>
      </div>
    </div>
  );
}

function Pregunta({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-[28px] leading-[1.12] font-extrabold tracking-[-0.035em]">
        {titulo}
      </h1>
      <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-500">
        {ayuda}
      </p>
      <div className="mt-6 grid gap-3">{children}</div>
    </div>
  );
}

function Campo({
  id,
  label,
  value,
  onChange,
  type = "text",
  ...resto
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  /* On retire ce qu'on gère nous-mêmes : sans `Omit`, le `onChange` de
     React (qui reçoit un évènement) et le nôtre (qui reçoit une chaîne)
     s'intersectent en un type impossible à satisfaire. */
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "value" | "onChange"
>) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[16px] border-[1.5px] border-ink-200 bg-ink-50 px-4 py-3.5 text-[16px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-sol-600 focus:bg-white focus:ring-4 focus:ring-sol-100"
        {...resto}
      />
    </label>
  );
}

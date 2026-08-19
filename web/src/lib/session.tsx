"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { PayChannel } from "./pricing";

/**
 * SESSION
 *
 * Deux modes, un seul contrat pour les composants.
 *
 * · Supabase configuré : la vraie session, OTP par SMS (§3 du brief).
 * · Sinon : une session de DÉMONSTRATION en `localStorage`, pour que l'espace
 *   compte, la réservation et la publication soient explorables.
 *
 * Le mode démonstration est annoncé partout où il change ce que voit
 * l'utilisateur. Simuler une connexion sans le dire ferait croire qu'un compte
 * existe, et la première déception d'un produit se paie très cher.
 *
 * `localStorage` est une source de vérité EXTÉRIEURE à React : on la lit avec
 * `useSyncExternalStore` plutôt qu'avec un effet qui appellerait `setState`.
 * L'effet produirait un rendu de plus à chaque montage, et surtout React ne
 * garantirait pas la cohérence entre deux composants abonnés.
 */

/** Le carro enregistré du conducteur. Choisi dans le catalogue : c'est lui
 *  qui fixe le taux au km à la publication, et sa photo rassure le passager
 *  qui cherche le bon véhicule au point de rencontre. */
export type SavedCar = {
  make: string;
  model: string;
  year: number;
  color: string;
  /** La placa. Elle ne s'affiche JAMAIS en public — seulement au
   *  passager dont la reserva est confirmée, comme le numéro de
   *  téléphone. C'est ce qui lui permet de reconnaître le carro au point
   *  de rencontre sans exposer le conducteur à toute la plateforme. */
  plate?: string;
  /** Photo compressée (JPEG ~800 px) en data URL — mode démonstration.
   *  Avec Supabase, elle partira dans le bucket Storage `carros`. */
  photoDataUrl: string | null;
};

export type Session = {
  /** Téléphone en E.164 ou adresse e-mail, selon le canal choisi. */
  contact: string;
  firstName: string;
  lastName: string;
  /** Initiale affichée en public — jamais le nom complet (« Ana M. »). */
  lastInitial: string;
  isVerified: boolean;
  /** Date de naissance, ISO court. Sert à une seule chose : vérifier la
   *  majorité. On ne l'affiche nulle part et on n'en tire pas d'âge
   *  public — l'âge d'un passager ne regarde personne. */
  birthDate?: string | null;
  /** Comment la personne veut qu'on s'adresse à elle. Trois valeurs, dont
   *  « ne pas le dire » : demander le genre sans laisser cette porte
   *  force à mentir, et le mode « solo mujeres » a besoin d'un choix
   *  déclaré, pas d'une déduction sur le prénom. */
  trato?: "senora" | "senor" | "sin-decir" | null;
  /** Celular, si la personne l'a donné. Jamais public — il sert aux
   *  avis de reserva, pas à la mise en relation : le chat s'en charge. */
  phone?: string | null;
  /** Empreinte SHA-256 du mot de passe, en DÉMONSTRATION seulement (voir
   *  `lib/clave.ts`). Avec Supabase branché, c'est le serveur qui garde
   *  et vérifie — ce champ n'est alors jamais écrit. */
  claveHuella?: string | null;
  /** ISO du moment où un dossier de vérification est parti chez Didit.
   *  Ce n'est PAS un verdict : c'est « envoyé ». Le verdict vient du
   *  webhook, jamais du navigateur. */
  verificacionEnviada?: string | null;
  /** Insigne employeur ou université, si l'utilisateur l'a connecté. */
  affiliation: string | null;
  since: string;
  /** Héritage : premier carro enregistré (les anciens comptes de démo
   *  n'en avaient qu'un). Lire via carsOf(), écrire via cars. */
  car?: SavedCar | null;
  /** Les carros enregistrés. À la publication on choisit lequel ; s'il
   *  n'y en a qu'un, c'est lui d'office. */
  cars?: SavedCar[] | null;
  /** Moyen de paiement favori, choisi à l'inscription et modifiable dans
   *  Mi cuenta. Il présélectionne le canal à la réservation — il ne
   *  l'impose jamais : les trois restent visibles à chaque reserva. */
  payPref?: PayChannel | null;
  /** CONDUCTEUR : comment il accepte l'aporte HORS app. Le cobro dans
   *  l'app est toujours accepté (l'argent lui arrive en versement, il
   *  n'a rien à gérer) ; ici il déclare s'il prend aussi le Yappy directo
   *  et/ou l'efectivo en main. Vide = « solo por la app ». */
  acceptsOutside?: ("yappy" | "efectivo")[] | null;
  /** La RUTINA : le trajet qui revient chaque semaine. C'est l'habitude
   *  qui rend la plateforme vitale — un clic pour republier ou pour
   *  chercher, et la base du matching récurrent (migration 0012). */
  routine?: {
    from: string;
    to: string;
    /** Jours ISO : 1 = lundi … 7 = dimanche. */
    days: number[];
    hour: string;
  } | null;
  /** Le dernier viaje publié — la matière du bouton « repetir » : on ne
   *  redemande jamais ce qu'on sait déjà. */
  lastPublish?: PublishedTrip | null;
  /** Tous les viajes publiés (démo : dans le navigateur). C'est sur eux
   *  que le compteur « recuperas hasta » s'empile. */
  published?: PublishedTrip[];
  /** Les puestos réservés côté passager — ce que « Mis viajes » liste
   *  en premier. Sans lui, réserver était un geste sans lendemain. */
  bookings?: Booking[];
};

/** Une reserva del pasajero — en démonstration elle vit dans le navigateur.
 *  `pendiente` = le conducteur doit encore répondre (24 h) ; `confirmado` =
 *  le puesto est acquis. Avec Supabase, la table `bookings` prendra le
 *  relais avec les mêmes états. */
export type Booking = {
  /** L'identité de la reserva — c'est à ELLE que pend le fil de discussion,
   *  jamais au viaje (deux personnes qui réservent le même viaje ont deux
   *  conversations séparées avec le conducteur). En démonstration c'est un
   *  id fabriqué ici ; avec Supabase ce sera l'UUID de `bookings`, et
   *  `transportFor()` distingue les deux sur cette seule forme.
   *  Optionnel : les reservas d'avant ce champ existent encore en session. */
  id?: string;
  tripId: string;
  from: string;
  to: string;
  /** ISO complet de la montée — la date ET l'heure sortent de lui. */
  boardingAt: string;
  seats: number;
  totalCents: number;
  feeCents: number;
  channel: PayChannel;
  driverName: string;
  /** Point de recogida choisi ou proposé. */
  point: string;
  status: "pendiente" | "confirmado";
};

/**
 * La clé du fil d'une reserva.
 *
 * Les reservas écrites avant l'arrivée du chat n'ont pas d'`id`. Les
 * ignorer aurait été le choix facile — et leur propriétaire aurait vu ses
 * viajes sans bulle, sans savoir pourquoi. On dérive donc une clé stable
 * de ce qui les identifie déjà de façon unique : le viaje et l'heure de
 * montée. Ce n'est pas un UUID, donc `transportFor()` la traite comme
 * locale, ce qui est exactement juste.
 */
export function bookingKey(b: Booking): string {
  return b.id ?? `demo-${b.tripId}-${b.boardingAt}`;
}

/**
 * L'id d'une nouvelle reserva de démonstration.
 *
 * Vit ICI, hors de tout composant, et pas seulement par propreté : le
 * compilateur React refuse `Date.now()` et `Math.random()` dans le corps
 * d'un composant (règle `react-hooks/purity`), même appelés depuis un
 * gestionnaire de clic — il ne peut pas prouver que ça n'arrive pas au
 * rendu.
 *
 * Le préfixe `demo-` n'est pas décoratif : il garantit que cet id n'a
 * jamais la forme d'un UUID, donc que `transportFor()` du chat le range
 * en local et n'essaie pas d'écrire dans `bookings`, où il n'existe pas.
 */
export function newDemoBookingId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `demo-${crypto.randomUUID()}`;
  }
  /* Safari < 15.4, ou contexte non sécurisé. */
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type PublishedTrip = {
  from: string;
  to: string;
  cityStops: string[];
  pickups: string[];
  date: string;
  hour: string;
  seats: number;
  recurrence: "una-vez" | "diario" | "semanal" | "mensual";
  priceCents: number;
  /** Le conducteur a ouvert TOUT son chemin : il dépose où ça lui reste
   *  de paso, sans négocier point par point. */
  dropAnywhere?: boolean;
};

/** La liste des carros, quel que soit l'âge de la session. */
export function carsOf(session: Session | null): SavedCar[] {
  if (!session) return [];
  if (session.cars && session.cars.length > 0) return session.cars;
  return session.car ? [session.car] : [];
}

const STORAGE_KEY = "partimos.demo-session";
const EVENT = "partimos:session";

const listeners = new Set<() => void>();

/**
 * L'IDENTITÉ VIENT DE SUPABASE, LES PRÉFÉRENCES DU NAVIGATEUR.
 *
 * Depuis que la base existe, « être connecté » ne se décide plus dans le
 * navigateur : c'est la session Supabase qui fait foi, et le profil
 * (`profiles`, créé par le déclencheur de la migration 0017) qui donne
 * le nom. Personne ne peut plus se déclarer connecté en écrivant dans
 * son propre stockage.
 *
 * Le reste — moyen de paiement favori, rutina, carros, viajes publiés,
 * reservas — vit encore dans le navigateur, sous une clé PAR compte :
 * ces tables existent en base mais le site ne les écrit pas encore.
 * C'est la prochaine étape, et elle est annoncée telle quelle dans
 * l'interface plutôt que maquillée.
 */
type RemoteIdentity = {
  userId: string;
  contact: string;
  firstName: string;
  lastInitial: string;
  isVerified: boolean;
  since: string;
};

let remote: RemoteIdentity | null = null;
let authStarted = false;
/** Le cache du snapshot : `useSyncExternalStore` exige que deux lectures
 *  sans changement rendent la MÊME chaîne, sinon React reboucle. */
let merged: string | null = null;
let dirty = true;

function emit() {
  dirty = true;
  listeners.forEach((listener) => listener());
}

/** La clé des préférences : une par compte, pour que deux personnes sur
 *  le même téléphone ne héritent pas des réglages de l'autre. */
function prefsKey(): string {
  return remote ? `partimos.prefs.${remote.userId}` : STORAGE_KEY;
}

function readLocal(): string | null {
  try {
    return window.localStorage.getItem(prefsKey());
  } catch {
    // Stockage refusé (navigation privée stricte) : on reste déconnecté.
    return null;
  }
}

/** Branche la session Supabase une seule fois, au premier abonnement. */
function startAuth(): void {
  if (authStarted || !isSupabaseConfigured) return;
  authStarted = true;
  const client = getSupabase();
  if (!client) return;

  const apply = async (user: {
    id: string;
    email?: string | null;
    phone?: string | null;
  /** Empreinte SHA-256 du mot de passe, en DÉMONSTRATION seulement (voir
   *  `lib/clave.ts`). Avec Supabase branché, c'est le serveur qui garde
   *  et vérifie — ce champ n'est alors jamais écrit. */
  claveHuella?: string | null;
  /** ISO du moment où un dossier de vérification est parti chez Didit.
   *  Ce n'est PAS un verdict : c'est « envoyé ». Le verdict vient du
   *  webhook, jamais du navigateur. */
  verificacionEnviada?: string | null;
    created_at?: string;
    /* Le numéro donné à l'inscription vit ICI : on ne l'enregistre pas
       comme identité téléphonique (ça coûterait un SMS de vérification
       pour un numéro qu'on ne vérifie pas). */
    user_metadata?: { phone?: string | null } | null;
  } | null) => {
    if (!user) {
      remote = null;
      emit();
      return;
    }
    /* Le profil porte le nom affiché. S'il n'est pas encore là (la
       toute première milliseconde après l'inscription), on n'invente
       rien : le prénom arrivera au prochain événement.
       Réseau coupé ? On garde la session — être connecté ne dépend pas
       d'avoir pu lire son prénom. */
    let profile: {
      first_name?: string | null;
      last_initial?: string | null;
      is_id_verified?: boolean | null;
    } | null = null;
    try {
      const { data } = await client
        .from("profiles")
        .select("first_name, last_initial, is_id_verified")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    } catch {
      profile = null;
    }
    /* Le profil n'a pas répondu (réseau) ? On ne montre pas « Hola, »
       tout seul : on retombe sur la même règle que le déclencheur en
       base — la première partie de l'adresse — pour que le prénom
       affiché soit celui qui existe côté serveur. */
    const contact =
      user.phone || user.email || user.user_metadata?.phone || "";
    const local = (user.email ?? "").split("@")[0].split(".")[0];
    const deLAdresse = local
      ? local.charAt(0).toUpperCase() + local.slice(1)
      : "Viajero";
    remote = {
      userId: user.id,
      contact,
      firstName: profile?.first_name || deLAdresse,
      lastInitial: profile?.last_initial ?? "",
      isVerified: Boolean(profile?.is_id_verified),
      since: user.created_at ?? new Date().toISOString(),
    };
    emit();
  };

  /* Supabase injoignable (3G qui tombe, coupure) : on reste
     déconnecté sans lever d'exception — le site continue de marcher. */
  client.auth
    .getSession()
    .then(({ data }) => apply(data.session?.user ?? null))
    .catch(() => apply(null));
  client.auth.onAuthStateChange((_event, session) =>
    apply(session?.user ?? null),
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  startAuth();
  // `storage` couvre les autres onglets ; l'événement maison couvre celui-ci.
  window.addEventListener("storage", emit);
  window.addEventListener(EVENT, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", emit);
    window.removeEventListener(EVENT, listener);
  };
}

function getSnapshot(): string | null {
  if (!dirty) return merged;
  dirty = false;

  if (!isSupabaseConfigured) {
    merged = readLocal();
    return merged;
  }

  /* BASE BRANCHÉE, MAIS PAS DE SESSION SERVEUR.
     La règle stricte — « personne n'est connecté, quoi que dise le
     stockage local » — est la bonne pour de vrais comptes : une session
     locale posée à côté ferait croire à une connexion que le serveur ne
     connaît pas.

     Elle a pourtant un angle mort qui a failli coûter cher : le jour où
     l'on branche le serveur, tout compte ouvert AVANT disparaît sans
     préavis, et si l'inscription serveur échoue pour une raison
     quelconque (réglage de confirmation, adresse de retour non
     autorisée, réseau), il ne reste AUCUNE porte d'entrée.

     On garde donc une session locale préexistante, et une seule
     condition : qu'elle ait été écrite avant. On n'en crée jamais de
     nouvelle dans ce mode (`signIn` s'y refuse). C'est un filet, pas un
     chemin — et il s'efface dès que le serveur répond. */
  if (!remote) {
    merged = readLocal();
    return merged;
  }
  let prefs: Partial<Session> = {};
  const raw = readLocal();
  if (raw) {
    try {
      prefs = JSON.parse(raw) as Partial<Session>;
    } catch {
      prefs = {};
    }
  }
  merged = JSON.stringify({
    ...prefs,
    contact: remote.contact,
    firstName: remote.firstName,
    lastName: prefs.lastName ?? "",
    lastInitial: remote.lastInitial,
    isVerified: remote.isVerified,
    affiliation: prefs.affiliation ?? null,
    since: remote.since,
  } satisfies Session);
  return merged;
}

/** Sur le serveur, personne n'est connecté — et le rendu doit correspondre
 *  au premier rendu client, sinon l'hydratation échoue. */
function getServerSnapshot(): string | null {
  return null;
}

export function useSession() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const session = useMemo<Session | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }, [raw]);

  const signIn = useCallback(
    (
      contact: string,
      firstName = "Tú",
      lastName = "",
      payPref: PayChannel | null = null,
    ) => {
      /* Avec la base branchée, on n'ouvre PAS de session soi-même : c'est
         le courriel de confirmation qui la crée. Écrire ici ferait croire
         à une connexion que le serveur ne connaît pas — et elle ne serait
         même pas lue, puisque la session vient alors de Supabase. */
      if (isSupabaseConfigured) return;
      const next: Session = {
        contact,
        firstName,
        lastName,
        lastInitial: lastName.charAt(0).toUpperCase(),
        isVerified: false,
        affiliation: null,
        since: new Date().toISOString(),
        payPref,
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Sans stockage, la session ne survit pas au rechargement. Acceptable.
      }
      emit();
    },
    [],
  );

  /** Met à jour la session en place — le carro, plus tard d'autres champs.
   *  Écrit puis émet : tous les composants abonnés voient le même état. */
  const updateSession = useCallback(
    (patch: Partial<Session>) => {
      const raw = getSnapshot();
      if (!raw) return;
      try {
        const current = JSON.parse(raw) as Session;
        window.localStorage.setItem(
          prefsKey(),
          JSON.stringify({ ...current, ...patch }),
        );
      } catch {
        return; // stockage refusé : rien à mettre à jour
      }
      emit();
    },
    [],
  );

  const signOut = useCallback(() => {
    /* Les préférences du compte restent : se déconnecter n'est pas
       oublier son moyen de paiement favori. C'est la SESSION qu'on
       ferme, et côté serveur quand il y en a un. */
    const client = isSupabaseConfigured ? getSupabase() : null;
    if (client) {
      void client.auth.signOut().then(() => {
        remote = null;
        /* ON EFFACE AUSSI LE FILET LOCAL. Sans cette ligne, se
           déconnecter fermait la session serveur et laissait la session
           locale de secours prendre le relais : on restait connecté
           après avoir cliqué « Cerrar sesión ». Le filet sert à ne
           jamais rester dehors, jamais à empêcher de sortir. */
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // rien à nettoyer
        }
        emit();
      });
      return;
    }
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // rien à nettoyer
    }
    emit();
  }, []);

  // Pas de drapeau « prêt » : il vaudrait false sur le serveur et true dans
  // le navigateur, ce qui casserait l'hydratation. Le premier rendu est celui
  // d'un visiteur déconnecté, et React le corrige dès la lecture du stockage.
  return { session, isDemo: !isSupabaseConfigured, signIn, signOut, updateSession };
}

/** Conservé pour que l'arbre reste explicite : la session n'a pas d'état
 *  React propre, mais le fournisseur documente où elle est disponible. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

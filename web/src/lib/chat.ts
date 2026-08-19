/**
 * CHAT — le fil d'une RÉSERVATION.
 *
 * Ce fichier a changé de nature. Il portait un fil accroché au VIAJE,
 * ouvert avant toute réservation, « pour demander ¿sales puntual? ».
 * C'était l'inverse de la règle : sans reserva, pas de conversation
 * possible — sinon on peut écrire au conducteur pour arranger le paiement
 * par-dehors, et la plateforme ne sert plus à rien. La policy
 * `messages_write_parties` (0021) le fait respecter en base ; ici on ne
 * fait que ne pas mentir sur ce que l'écran propose.
 *
 * Deux transports derrière une seule API :
 *
 *   · SUPABASE quand la reserva existe vraiment en base (son id est un
 *     UUID). Lecture, insertion, et `postgres_changes` pour le temps
 *     réel — la publication `supabase_realtime` a été ajoutée par 0021.
 *   · LE NAVIGATEUR sinon. Tant que `TRIPS_ARE_DEMO` est vrai, les
 *     reservas vivent dans la session locale : il n'y a pas de ligne
 *     `bookings` à laquelle rattacher un message, et la policy refuserait
 *     l'insertion. Le fil vit alors dans `localStorage`, et se synchronise
 *     entre les onglets du même appareil.
 *
 * Ce qu'on ne fait dans AUCUN des deux : inventer une réponse. Aucun
 * conducteur fictif n'écrit, aucun accusé de lecture n'apparaît tout seul.
 * Faire croire qu'un humain a lu, c'est le mensonge qui coûte la confiance
 * entière du produit.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type ChatMessage = {
  id: string;
  body: string;
  /** Écrit par la personne connectée. */
  mine: boolean;
  at: string;
  readAt: string | null;
};

/** Le fil est-il servi par la base (donc partagé avec l'autre personne) ou
 *  seulement par ce navigateur ? L'écran le dit, il ne le devine pas. */
export type ChatTransport = "supabase" | "local";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Quel transport pour cette reserva.
 *
 * Le test porte sur l'id : une reserva de démonstration a un id fabriqué
 * dans le navigateur, pas un UUID de `bookings`. Tenter Supabase avec lui
 * ne donnerait pas une erreur visible — la policy renverrait simplement un
 * refus, et le message disparaîtrait sans explication.
 */
export function transportFor(bookingId: string): ChatTransport {
  return isSupabaseConfigured && UUID.test(bookingId) ? "supabase" : "local";
}

/* ------------------------------------------------------------------ */
/* Le fil local — un appareil, plusieurs onglets                       */
/* ------------------------------------------------------------------ */

const keyFor = (bookingId: string) => `partimos.chat.${bookingId}`;
const EVENT = "partimos:chat";

/** Diffusion entre onglets. `storage` ne se déclenche que dans les AUTRES
 *  onglets, donc il faut aussi l'événement maison pour celui qui écrit. */
function anunciar(bookingId: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: bookingId }));
}

function leerLocal(bookingId: string): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(keyFor(bookingId));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function escribirLocal(bookingId: string, messages: ChatMessage[]) {
  try {
    window.localStorage.setItem(keyFor(bookingId), JSON.stringify(messages));
  } catch {
    /* stockage refusé (mode privé) : le fil vivra le temps de la page */
  }
  anunciar(bookingId);
}

/* ------------------------------------------------------------------ */
/* L'API commune                                                       */
/* ------------------------------------------------------------------ */

function ordenar(a: ChatMessage, b: ChatMessage) {
  return a.at.localeCompare(b.at);
}

/** Les messages d'une reserva, du plus ancien au plus récent. */
export async function fetchMessages(
  bookingId: string,
  myId: string | null,
): Promise<ChatMessage[]> {
  if (transportFor(bookingId) === "local") {
    return leerLocal(bookingId).sort(ordenar);
  }

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at, read_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    body: row.body as string,
    mine: (row.sender_id as string) === myId,
    at: row.created_at as string,
    readAt: (row.read_at as string | null) ?? null,
  }));
}

/**
 * Envoyer. La limite de 2000 caractères n'est pas décorative : c'est la
 * contrainte `messages_body_razonable`, et un message plus long serait
 * refusé par la base après coup — donc on coupe avant, côté écran.
 */
export const MAX_BODY = 2000;

export async function sendMessage(
  bookingId: string,
  myId: string | null,
  body: string,
): Promise<ChatMessage | null> {
  const texto = body.trim().slice(0, MAX_BODY);
  if (!texto) return null;

  if (transportFor(bookingId) === "local") {
    const mensaje: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      body: texto,
      mine: true,
      at: new Date().toISOString(),
      readAt: null,
    };
    escribirLocal(bookingId, [...leerLocal(bookingId), mensaje]);
    return mensaje;
  }

  const supabase = getSupabase();
  if (!supabase || !myId) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({ booking_id: bookingId, sender_id: myId, body: texto })
    .select("id, body, sender_id, created_at, read_at")
    .single();

  if (error || !data) return null;

  return {
    id: String(data.id),
    body: data.body as string,
    mine: true,
    at: data.created_at as string,
    readAt: (data.read_at as string | null) ?? null,
  };
}

/**
 * Marquer comme lus les messages REÇUS. Le trigger `messages_inmutables`
 * garantit que seul `read_at` bouge : inutile de se retenir ici, la base
 * refuserait tout le reste.
 */
export async function markRead(
  bookingId: string,
  myId: string | null,
): Promise<void> {
  if (transportFor(bookingId) === "local") {
    const ahora = new Date().toISOString();
    const actuales = leerLocal(bookingId);
    if (!actuales.some((m) => !m.mine && !m.readAt)) return;
    escribirLocal(
      bookingId,
      actuales.map((m) => (m.mine || m.readAt ? m : { ...m, readAt: ahora })),
    );
    return;
  }

  const supabase = getSupabase();
  if (!supabase || !myId) return;
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .neq("sender_id", myId)
    .is("read_at", null);
}

/**
 * S'abonner aux nouveautés. Renvoie la fonction de désabonnement.
 *
 * En Supabase : `postgres_changes` filtré sur la reserva. En local :
 * l'événement maison (même onglet) et `storage` (les autres).
 */
export function subscribe(
  bookingId: string,
  myId: string | null,
  onChange: () => void,
): () => void {
  if (transportFor(bookingId) === "local") {
    const propio = (e: Event) => {
      if ((e as CustomEvent).detail === bookingId) onChange();
    };
    const otro = (e: StorageEvent) => {
      if (e.key === keyFor(bookingId)) onChange();
    };
    window.addEventListener(EVENT, propio);
    window.addEventListener("storage", otro);
    return () => {
      window.removeEventListener(EVENT, propio);
      window.removeEventListener("storage", otro);
    };
  }

  const supabase = getSupabase();
  if (!supabase) return () => {};

  const canal = supabase
    .channel(`chat:${bookingId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `booking_id=eq.${bookingId}`,
      },
      () => onChange(),
    )
    .subscribe();

  void myId;
  return () => {
    void supabase.removeChannel(canal);
  };
}

/** Combien de messages reçus pas encore lus — le chiffre de la pastille. */
export function countUnread(messages: ChatMessage[]): number {
  return messages.filter((m) => !m.mine && !m.readAt).length;
}

/** Les questions que tout le monde pose. Un appui au lieu de dix frappes —
 *  et elles montrent d'emblée à quoi sert le fil. */
export const QUICK_QUESTIONS = [
  "¿A qué hora exacta sales?",
  "¿Dónde nos encontramos?",
  "¿Cabe una maleta grande?",
  "¿Puedes recogerme un poco más adelante?",
];

/**
 * DIDIT-WEBHOOK — reçoit le verdict et ne garde que le verdict.
 *
 * Didit appelle cette fonction à chaque changement d'état. Nous lisons le
 * statut, la référence et les dates. LE RESTE EST IGNORÉ DÉLIBÉRÉMENT :
 * règle R6, jamais de numéro de cédula, d'image ni de selfie chez nous.
 * Le badge `profiles.is_id_verified` se met à jour tout seul par le
 * trigger `trg_sync_id_verified` (migration 0003).
 *
 * Authentification : PAS de JWT (c'est Didit qui appelle) — déployé avec
 * `verify_jwt: false`. À la place, la signature HMAC-SHA256.
 * Secret attendu : DIDIT_WEBHOOK_SECRET (secret_shared_key de la
 * destination, dans la console Didit).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LE BUG QUE CETTE FONCTION A CAUSÉ, ET QU'ELLE NE CAUSERA PLUS.
 *
 * La console Didit affichait « Échec de l'envoi du webhook — status code
 * 500 » sur le bouton « Tester ». Deux fautes, et la seconde est la plus
 * grave.
 *
 * 1. UNE SEULE SIGNATURE LUE. On ne lisait que `X-Signature`. Didit
 *    envoie `X-Signature-V2` (HMAC sur le JSON canonique trié),
 *    `X-Signature-Simple` (HMAC sur « timestamp:session:statut:type ») et
 *    parfois `X-Signature` (HMAC sur les octets bruts). On accepte
 *    maintenant les trois : il suffit qu'UNE corresponde. Trois variantes
 *    n'affaiblissent rien — elles sont toutes calculées avec le même
 *    secret, et une signature fausse reste fausse.
 *
 * 2. UN 500 SUR UN ÉVÉNEMENT QU'ON NE POURRA JAMAIS TRAITER. Le webhook
 *    de test porte un `vendor_data` fabriqué qui ne correspond à aucun
 *    profil : l'insertion violait la clé étrangère, on rendait 500, et
 *    Didit RÉESSAYAIT — deux fois, puis abandonnait. Un 500 veut dire
 *    « réessaie, ça peut marcher ». Ici ça ne pouvait pas.
 *
 *    La règle qui remplace ça : on ne rend 5xx QUE si un nouvel essai a
 *    une chance d'aboutir (base indisponible, panne passagère). Un
 *    événement inattribuable est acquitté par 200 et journalisé. Mieux
 *    vaut un accusé honnête qu'une file de reprises qui ne finira jamais.
 * ═══════════════════════════════════════════════════════════════════════
 */

import { createClient } from "npm:@supabase/supabase-js@2";

/** Statuts Didit → notre énumération `verification_status`.
 *  La liste complète de la documentation, y compris les deux qui
 *  manquaient et qui tombaient donc dans « ignoré ». */
const STATUS_MAP: Record<string, "pending" | "verified" | "rejected" | "expired"> = {
  "Not Started": "pending",
  "In Progress": "pending",
  "In Review": "pending",
  Resubmitted: "pending",
  Approved: "verified",
  Declined: "rejected",
  Abandoned: "expired",
  Expired: "expired",
  "KYC Expired": "expired",
};

/** Les familles d'événements qui nous concernent. Les autres (entités,
 *  transactions, activité) sont acquittées sans écriture : nous n'avons
 *  ni entreprises ni transactions chez Didit. */
const TIPOS_TRATADOS = new Set(["status.updated", "data.updated"]);

const encoder = new TextEncoder();

async function hmacHex(secret: string, mensaje: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(mensaje));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparaison en temps constant : pas d'oracle de préfixe. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** LE JSON CANONIQUE de la variante V2 : clés triées à tous les niveaux,
 *  séparateurs compacts, Unicode préservé (jamais d'échappement \\uXXXX).
 *  `JSON.stringify` ne réordonne pas les clés — il faut reconstruire. */
function canonico(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(canonico);
  if (valor && typeof valor === "object") {
    const salida: Record<string, unknown> = {};
    for (const clave of Object.keys(valor as Record<string, unknown>).sort()) {
      salida[clave] = canonico((valor as Record<string, unknown>)[clave]);
    }
    return salida;
  }
  return valor;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("DIDIT_WEBHOOK_SECRET");
  if (!secret) {
    console.error("DIDIT_WEBHOOK_SECRET ausente");
    /* 503 : celle-là se répare de notre côté, un nouvel essai peut
       aboutir une fois le secret posé. */
    return new Response("not configured", { status: 503 });
  }

  const rawBody = await req.text();

  /* 1. FRAÎCHEUR. Un événement signé mais vieux de plus de cinq minutes
     est un rejeu, pas une émission. On le vérifie AVANT la signature :
     c'est le contrôle le moins cher des deux. */
  const timestamp = Number(req.headers.get("x-timestamp"));
  if (
    Number.isFinite(timestamp) &&
    Math.abs(Date.now() / 1000 - timestamp) > 300
  ) {
    return new Response("stale event", { status: 401 });
  }

  /* 2. SIGNATURE. Trois variantes, une seule doit correspondre. On lit le
     corps BRUT et on ne le re-sérialise jamais pour la variante `raw` :
     re-stringifier après analyse change les octets, donc le HMAC. */
  let evento: {
    event_id?: string;
    session_id?: string;
    status?: string;
    webhook_type?: string;
    vendor_data?: string;
  };
  try {
    evento = JSON.parse(rawBody);
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  const firmas = {
    v2: (req.headers.get("x-signature-v2") ?? "").toLowerCase(),
    raw: (req.headers.get("x-signature") ?? "").toLowerCase(),
    simple: (req.headers.get("x-signature-simple") ?? "").toLowerCase(),
  };

  let valida = false;
  if (firmas.v2) {
    const esperada = await hmacHex(secret, JSON.stringify(canonico(evento)));
    valida = timingSafeEqual(firmas.v2, esperada);
  }
  if (!valida && firmas.raw) {
    valida = timingSafeEqual(firmas.raw, await hmacHex(secret, rawBody));
  }
  if (!valida && firmas.simple) {
    const mensaje = `${req.headers.get("x-timestamp") ?? ""}:${evento.session_id ?? ""}:${evento.status ?? ""}:${evento.webhook_type ?? ""}`;
    valida = timingSafeEqual(firmas.simple, await hmacHex(secret, mensaje));
  }
  if (!valida) {
    /* Le corps brut aide à diagnostiquer une canonicalisation qui
       diffère — il ne contient rien de sensible, seulement des
       identifiants de session et un statut. */
    console.error("firma invalida", {
      tiene: Object.entries(firmas).filter(([, v]) => v).map(([k]) => k),
      cuerpo: rawBody.slice(0, 300),
    });
    return new Response("invalid signature", { status: 401 });
  }

  /* 3. EST-CE POUR NOUS ? Les familles « entité », « transaction » et
     « activité » existent chez Didit et pas chez nous. On les acquitte
     sans écriture — un 4xx ferait réessayer pour rien. */
  const tipo = evento.webhook_type ?? "status.updated";
  if (!TIPOS_TRATADOS.has(tipo)) {
    return new Response(JSON.stringify({ ok: true, ignorado: tipo }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!evento.session_id || !evento.status) {
    return new Response("missing fields", { status: 400 });
  }

  const status = STATUS_MAP[evento.status];
  if (!status) {
    /* Statut inconnu (nouveau chez Didit) : accusé sans écriture. */
    console.warn("estado desconocido", evento.status);
    return new Response(JSON.stringify({ ok: true, ignorado: evento.status }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  /* 4. LE VERDICT — et rien que lui.
     IDEMPOTENCE : la clé de conflit est (provider, provider_ref), donc
     rejouer le même événement réécrit la même ligne avec la même valeur.
     Didit peut livrer deux fois sans conséquence. */
  const ahora = new Date().toISOString();
  const verdicto = {
    status,
    verified_at: status === "verified" ? ahora : null,
    updated_at: ahora,
  };

  /* On met à jour la ligne ouverte par `didit-start`. C'est le chemin
     normal, et il ne touche jamais `profile_id` — donc aucune clé
     étrangère à violer. */
  const { data: actualizadas, error: errorUpdate } = await supabase
    .from("identity_verifications")
    .update(verdicto)
    .eq("provider", "didit")
    .eq("provider_ref", evento.session_id)
    .select("id");

  if (errorUpdate) {
    console.error("fallo al escribir el veredicto", errorUpdate.message);
    /* Celle-là mérite un nouvel essai : la base était indisponible. */
    return new Response("storage failed", { status: 500 });
  }

  if (actualizadas && actualizadas.length > 0) {
    return new Response(JSON.stringify({ ok: true, actualizado: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  /* 5. AUCUNE LIGNE. Deux cas très différents, et c'est ici que le 500
     naissait.

     · Session créée hors de l'app (console Didit, ou webhook de TEST) :
       `vendor_data` ne désigne aucun profil réel. Rien à rattacher, et
       aucun nouvel essai n'y changera quoi que ce soit → 200.
     · Session légitime dont la ligne manque : on la crée, à condition
       que `vendor_data` soit bien un profil existant. */
  if (!evento.vendor_data) {
    return new Response(
      JSON.stringify({ ok: true, ignorado: "sin vendor_data" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", evento.vendor_data)
    .maybeSingle();

  if (!perfil) {
    /* LE WEBHOOK DE TEST TOMBE ICI. On l'acquitte : c'est exactement ce
       que la console attend pour dire « intégration correcte ». */
    console.warn("vendor_data sin perfil", evento.vendor_data);
    return new Response(
      JSON.stringify({ ok: true, ignorado: "perfil desconocido" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const { error: errorInsert } = await supabase
    .from("identity_verifications")
    .upsert(
      {
        profile_id: perfil.id,
        provider: "didit",
        provider_ref: evento.session_id,
        document_country: "PA",
        ...verdicto,
      },
      { onConflict: "provider,provider_ref" },
    );

  if (errorInsert) {
    console.error("fallo al crear el expediente", errorInsert.message);
    return new Response("storage failed", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, creado: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

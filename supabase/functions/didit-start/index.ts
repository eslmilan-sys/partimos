/**
 * DIDIT-START — ouvre une session de vérification d'identité.
 *
 * Le site est un export statique : il ne peut détenir aucun secret. La clé
 * API Didit vit donc ICI, dans les secrets du projet Supabase, et le
 * navigateur ne voit passer que l'URL du parcours hébergé par Didit.
 *
 *   navigateur ──(JWT Supabase)──▶ didit-start ──(x-api-key)──▶ Didit
 *             ◀────────── { url } ◀──────────────── { session_id, url }
 *
 * Règle R6 : on n'envoie à Didit que l'identifiant du compte (vendor_data)
 * et on n'enregistre chez nous que la référence du dossier. La cédula, ses
 * images et son numéro ne transitent jamais par la plateforme.
 *
 * Déploiement : `supabase functions deploy didit-start` (JWT vérifié par
 * défaut — c'est voulu : seul un utilisateur connecté démarre un dossier).
 * Secrets attendus : DIDIT_API_KEY, DIDIT_WORKFLOW_ID, SITE_URL.
 * Voir supabase/DIDIT.md pour le pas-à-pas complet.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const DIDIT_API = "https://verification.didit.me/v2/session/";

/* L'export statique appelle depuis le domaine GitHub Pages ; en local,
   depuis localhost. Le JWT fait l'authentification — CORS ne fait que
   laisser passer l'en-tête.
   ────────────────────────────────────────────────────────────────────────
   LE BUG QUE CETTE FONCTION A CAUSÉ, ET QU'ELLE NE CAUSERA PLUS.

   L'en-tête valait `Deno.env.get("SITE_ORIGIN") ?? "*"`, c'est-à-dire un
   secret recopié à la main. Un secret qui contient l'ADRESSE du site
   (« https://exemple.github.io/test/partimos/ ») au lieu de son ORIGINE
   (« https://exemple.github.io ») est refusé par le navigateur — et le
   symptôme est atroce à diagnostiquer : côté serveur tout réussit, la
   session Didit est bien créée, la ligne est bien écrite, la fonction
   répond 200 sans une seule erreur dans les journaux ; côté téléphone on
   lit « Failed to send a request to the Edge Function ». Le travail est
   fait, la réponse est jetée par le navigateur avant d'être lue.

   La parade : on ne fait plus confiance à la forme du secret. On le
   NORMALISE (on n'en garde que le schéma + l'hôte), on accepte plusieurs
   origines séparées par des virgules, et on RENVOIE L'ORIGINE DEMANDÉE
   quand elle est connue. `Vary: Origin` évite qu'un cache serve à un
   domaine la réponse taillée pour un autre.

   Refléter l'origine n'ouvre rien : l'authentification est le JWT dans
   l'en-tête, pas un cookie. Un site tiers qui appellerait cette fonction
   depuis le navigateur de quelqu'un n'aurait toujours pas son jeton. */

/** « https://x.github.io/test/ » → « https://x.github.io ». Rend au
 *  secret la forme que le navigateur exige, quelle que soit celle qu'on
 *  lui a donnée. */
function soloOrigen(valor: string): string | null {
  const limpio = valor.trim();
  if (!limpio) return null;
  try {
    return new URL(limpio).origin;
  } catch {
    return null;
  }
}

const PERMITIDAS = new Set(
  [
    /* Ce que le projet déclare, sous n'importe quelle forme, et autant
       d'entrées qu'on veut : « a.com, b.com ». */
    ...(Deno.env.get("SITE_ORIGIN") ?? "").split(","),
    /* Et ce qu'on sait déjà : le site publié et le développement. Les
       écrire ici évite qu'un secret oublié casse la vérification. */
    Deno.env.get("SITE_URL") ?? "",
    "https://eslmilan-sys.github.io",
    "http://localhost:3000",
    "http://localhost:3100",
  ]
    .map(soloOrigen)
    .filter((o): o is string => o !== null),
);

function cors(req: Request): Record<string, string> {
  const origen = req.headers.get("Origin");
  return {
    /* Une origine connue : on la renvoie telle quelle. Inconnue ou
       absente (appel serveur à serveur, curl) : `*`, qui suffit puisque
       rien ici ne repose sur un cookie. */
    "Access-Control-Allow-Origin":
      origen && PERMITIDAS.has(origen) ? origen : "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST")
    return json(req, 405, { error: "method_not_allowed" });

  const apiKey = Deno.env.get("DIDIT_API_KEY");

  /* QUEL DOCUMENT. Chaque type a son parcours chez Didit : la cédula ne
     se vérifie pas comme un permis, et le document du véhicule encore
     moins. Sans `kind`, on garde la cédula — c'est le cas d'avant. */
  let kind = "cedula";
  try {
    const body = await req.json();
    if (body && typeof body.kind === "string") kind = body.kind;
  } catch {
    /* Corps vide : la cédula. */
  }
  const WORKFLOWS: Record<string, string | undefined> = {
    cedula: Deno.env.get("DIDIT_WORKFLOW_ID"),
    licencia: Deno.env.get("DIDIT_WORKFLOW_LICENCIA"),
    vehiculo: Deno.env.get("DIDIT_WORKFLOW_VEHICULO"),
  };
  const DOC_TYPE: Record<string, string> = {
    cedula: "ID",
    licencia: "DL",
    vehiculo: "VEHICLE",
  };
  const docType = DOC_TYPE[kind];
  const workflowId = WORKFLOWS[kind];
  if (!apiKey || !docType) return json(req, 503, { error: "didit_not_configured" });
  if (!workflowId) return json(req, 503, { error: `sin_flujo_${kind}` });

  /* Qui demande ? Le JWT du porteur, vérifié par Supabase avant d'arriver
     ici, redevient un utilisateur via le client anon + en-tête. */
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );
  const { data: userData, error: userError } =
    await supabaseAuth.auth.getUser();
  if (userError || !userData.user) return json(req, 401, { error: "unauthorized" });
  const userId = userData.user.id;

  /* Écritures : la clé service. `identity_verifications` n'a aucune policy
     d'INSERT côté client — c'est volontaire, seul ce chemin crée un dossier. */
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  /* Un dossier déjà vérifié et valide ? Rien à rouvrir — MAIS pour CE
     document-là. Sans le filtre sur `document_type`, une cédula vérifiée
     bloquait la vérification du permis et du véhicule : le bouton
     répondait « already_verified » pour un document jamais présenté. */
  const { data: existing } = await supabase
    .from("identity_verifications")
    .select("status, expires_at")
    .eq("profile_id", userId)
    .eq("document_type", docType)
    .eq("status", "verified")
    .or("expires_at.is.null,expires_at.gt.now()")
    .limit(1);
  if (existing && existing.length > 0) {
    return json(req, 409, { error: "already_verified" });
  }

  /* La session Didit. `vendor_data` = notre identifiant de profil : c'est
     la seule donnée que nous fournissons, et c'est elle qui revient dans le
     webhook pour rattacher le verdict au bon compte. */
  const callback = Deno.env.get("SITE_URL")
    ? `${Deno.env.get("SITE_URL")!.replace(/\/$/, "")}/cuenta/`
    : undefined;

  const diditRes = await fetch(DIDIT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      workflow_id: workflowId,
      vendor_data: userId,
      ...(callback ? { callback } : {}),
    }),
  });
  if (!diditRes.ok) {
    console.error("didit session creation failed", diditRes.status);
    return json(req, 502, { error: "didit_unavailable" });
  }
  const diditSession = (await diditRes.json()) as {
    session_id: string;
    url: string;
  };

  /* Le dossier chez nous : référence + statut. Rien d'autre (R6). */
  const { error: insertError } = await supabase
    .from("identity_verifications")
    .upsert(
      {
        profile_id: userId,
        provider: "didit",
        provider_ref: diditSession.session_id,
        status: "pending",
        /* LE TYPE DE DOCUMENT, sans quoi le dossier du permis serait
           indiscernable de celui de la cédula et l'écran afficherait
           « pendiente » pour un document déjà présenté. */
        document_type: docType,
        document_country: "PA",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,provider_ref" },
    );
  if (insertError) {
    console.error("kyc row upsert failed", insertError.message);
    return json(req, 500, { error: "storage_failed" });
  }

  return json(req, 200, { url: diditSession.url });
});

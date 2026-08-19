/**
 * CE QUE LA PERSONNE COLLE — code à six chiffres OU lien du courriel.
 *
 * Le dialogue demande six chiffres. Le courriel, lui, envoie ce que le
 * gabarit de Supabase contient : par défaut un LIEN, pas un code. Résultat,
 * on demandait quelque chose que le courriel ne donnait pas — et personne
 * ne pouvait entrer.
 *
 * Le gabarit se corrige dans le tableau de bord (une ligne, `{{ .Token }}`).
 * Mais tant qu'il n'est pas corrigé — et pour tous ceux dont le client
 * courriel n'affiche que le lien — l'écran doit accepter LES DEUX. Ce
 * module lit ce qui a été collé et dit quoi en faire :
 *
 *   · six chiffres              → un code, `verifyOtp({ token })`
 *   · un lien /auth/v1/verify   → son `token` EST le token_hash
 *   · une URL de retour         → `token_hash` ou `code` dans la query
 *   · une redirection en dièse  → `#access_token=…`, la session est là
 *
 * On ne devine jamais : ce qui ne rentre dans aucun cas ressort en
 * « rien », et l'écran le dit franchement plutôt que de tenter un appel
 * qui échouera avec un message incompréhensible.
 */

export type PastedAuth =
  | { kind: "code"; token: string }
  | { kind: "hash"; tokenHash: string; type: string }
  | { kind: "pkce"; code: string }
  | { kind: "session"; accessToken: string; refreshToken: string }
  | { kind: "nada" };

/** Les types d'OTP que Supabase met dans ses liens de courriel. */
const TIPOS = new Set([
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email",
  "email_change",
]);

export function readPastedAuth(raw: string): PastedAuth {
  const value = raw.trim();
  if (!value) return { kind: "nada" };

  /* Le cas courant d'abord : six chiffres, éventuellement collés avec des
     espaces ou des tirets par le presse-papier du téléphone. */
  const digits = value.replace(/[\s-]/g, "");
  if (/^\d{6}$/.test(digits)) return { kind: "code", token: digits };

  /* Tout le reste doit ressembler à une URL. Un lien collé depuis Mail
     traîne parfois des chevrons ou un point final de phrase. */
  const cleaned = value.replace(/^[<("']+|[>)"'.,]+$/g, "");
  let url: URL;
  try {
    url = new URL(cleaned);
  } catch {
    return { kind: "nada" };
  }

  /* La redirection déjà effectuée : les jetons vivent dans le dièse. */
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken)
    return { kind: "session", accessToken, refreshToken };

  const q = url.searchParams;

  /* Le lien du courriel : .../auth/v1/verify?token=…&type=magiclink
     Le paramètre s'appelle `token`, mais c'est bien un token_hash. */
  const tokenHash = q.get("token_hash") ?? q.get("token");
  const type = q.get("type") ?? "email";
  if (tokenHash && TIPOS.has(type))
    return { kind: "hash", tokenHash, type };

  /* Le flux PKCE renvoie un code à échanger. */
  const code = q.get("code");
  if (code) return { kind: "pkce", code };

  return { kind: "nada" };
}

/** Ce qui a été collé peut-il servir à entrer ? */
export function isUsable(p: PastedAuth): boolean {
  return p.kind !== "nada";
}

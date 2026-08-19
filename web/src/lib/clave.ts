"use client";

/**
 * LE MOT DE PASSE, EN DÉMONSTRATION.
 *
 * Le propriétaire a raison de le réclamer : entrer un courriel et se
 * retrouver connecté sans rien d'autre ne ressemble à aucun service
 * sérieux. Avec la base branchée, c'est Supabase qui vérifie — ici il
 * n'y a pas de serveur, et il faut le dire au lieu de le simuler à
 * moitié.
 *
 * CE QUI EST FAIT, EXACTEMENT : on garde une empreinte SHA-256 salée du
 * mot de passe dans le stockage du téléphone, et on la recompare à la
 * connexion. Le mot de passe lui-même n'est jamais écrit nulle part.
 *
 * CE QUE ÇA NE VAUT PAS : de la sécurité. Une empreinte posée sur
 * l'appareil qui la vérifie ne protège de personne — qui ouvre le
 * téléphone ouvre les deux. C'est une maquette FIDÈLE du parcours, pas
 * une authentification, et l'écran l'écrit noir sur blanc. Le jour où la
 * base est branchée, ce fichier disparaît : Supabase fait ça pour de
 * vrai, avec un serveur qui, lui, ne se laisse pas lire.
 */

/** Le sel est constant et public : il ne sert qu'à éviter qu'une
 *  empreinte soit reconnaissable dans une table toute faite. Un vrai sel
 *  est aléatoire et stocké à part — impossible sans serveur. */
const SAL = "partimos-demo-v1:";

export async function huella(clave: string): Promise<string> {
  const datos = new TextEncoder().encode(SAL + clave);
  const bruto = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(bruto)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Ce qu'on exige : huit caractères. Pas de majuscule obligatoire, pas
 *  de chiffre imposé — ces règles-là font écrire « Panama1! » à tout le
 *  monde, ce qui est plus faible qu'une phrase longue. */
export const LARGO_MINIMO = 8;

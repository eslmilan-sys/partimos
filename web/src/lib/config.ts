/**
 * CE QUI EST VRAI, ET CE QUI NE L'EST PAS ENCORE.
 *
 * Le jour où la base a été branchée, un piège s'est ouvert : les comptes
 * sont devenus réels — un vrai code, un vrai utilisateur, un vrai profil
 * — alors que les VIAJES affichés restent une démonstration engendrée
 * dans le navigateur. Si le site avait simplement arrêté de dire
 * « démonstration » parce que la base répond, il aurait présenté des
 * conducteurs inventés comme de vraies personnes prêtes à passer te
 * prendre. C'est le seul mensonge que ce projet ne peut pas se
 * permettre.
 *
 * D'où ce drapeau, séparé de la présence de Supabase. Il passera à
 * `false` le jour où publier écrira dans `trips` et où chercher lira la
 * base — pas avant, et le même jour pour les deux.
 */
export const TRIPS_ARE_DEMO = true;

/** La phrase à afficher partout où l'on montre un viaje engendré. Une
 *  seule formulation : c'est ce qui la rend crédible plutôt que
 *  bavarde. */
export const DEMO_TRIPS_NOTICE =
  "Los viajes que ves son de demostración: los generamos para que puedas recorrer la app. Todavía no hay conductores publicando de verdad.";

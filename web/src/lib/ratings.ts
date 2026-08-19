/**
 * CALIFICATION DU CONDUCTEUR — cinq critères, une note.
 *
 * Les critères couvrent les cinq moments où un trajet se gagne ou se
 * perd, dans l'ordre où on les vit. Chacun se note de 1 à 5 d'un appui ;
 * la note globale est la moyenne — pas une sixième question.
 *
 * Ce qui n'y est PAS est aussi voulu : pas de critère « prix » (le tope
 * est la règle de la plateforme, pas un mérite du conducteur — le noter
 * réintroduirait la pression tarifaire par la petite porte), et pas de
 * critère fourre-tout « expérience générale » qui écraserait les autres.
 */

export type RatingCriterion = {
  key: string;
  /** Le libellé court, celui des étoiles. */
  label: string;
  /** La question concrète qu'on se pose en notant. */
  detail: string;
};

export const DRIVER_RATING_CRITERIA: RatingCriterion[] = [
  {
    key: "puntualidad",
    label: "Puntualidad",
    detail: "¿Salió a la hora que publicó?",
  },
  {
    key: "manejo",
    label: "Manejo seguro",
    detail: "¿Manejó con calma y sin sustos?",
  },
  {
    key: "trato",
    label: "Trato",
    detail: "¿Fue amable y respetuoso durante el camino?",
  },
  {
    key: "carro",
    label: "Carro como en la foto",
    detail: "¿El carro estaba limpio y era el registrado?",
  },
  {
    key: "encuentro",
    label: "Punto de encuentro",
    detail: "¿Llegó al punto acordado y fue fácil encontrarse?",
  },
];

/** La note globale : moyenne simple, arrondie au dixième. */
export function overallRating(scores: number[]): number {
  const valid = scores.filter((s) => s >= 1 && s <= 5);
  if (valid.length === 0) return 0;
  return (
    Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
  );
}

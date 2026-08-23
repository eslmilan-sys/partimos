/**
 * COMMENT S'APPELLE UN BOUT DE TRAJET — et à quelle finesse selon l'écran.
 *
 * ───────────────────────────────────────────────────────────────────────
 * LA RÈGLE, décidée par l'utilisateur le 23-08-2026 :
 *
 *   · on part et on arrive N'IMPORTE OÙ — un point libre, pas une ville ;
 *   · dans les blocs qui font DÉCOUVRIR (destinations populaires, prochains
 *     départs, voyages récemment publiés) on écrit la **ville** ;
 *   · dans la page qui OFFRE les courses, et dans le détail, on écrit
 *     **ville · point exact**.
 *
 * Pourquoi : une liste de découverte se lit d'un coup d'œil et « Albrook »
 * ne dit rien à qui n'habite pas la capitale. Une fois qu'on choisit une
 * course, en revanche, le point exact EST l'information — c'est là qu'on
 * doit se tenir à 6 h du matin.
 * ───────────────────────────────────────────────────────────────────────
 *
 * Ça complète `lugar.ts`, qui pose la règle mère : « la ciudad es un
 * complemento de dirección, jamás un reemplazo ». Ici on ne remplace rien
 * non plus — on choisit lequel des deux l'écran a besoin de lire.
 *
 * Pur, sans IO : la ville et l'étiquette arrivent en arguments.
 */

/** Le séparateur historique d'une étiquette : « Chitré · Parque Unión ». */
const SEPARADOR = ' · ';

/** Le premier morceau d'une étiquette, qui est le lieu et pas la ville. */
function primerTrozo(etiqueta: string): string {
  return etiqueta.split(SEPARADOR)[0]?.trim() ?? '';
}

/**
 * LA VILLE, SEULE. Pour les blocs de découverte.
 *
 * Sans ville connue —une vieille ligne, une route libre pas encore résolue—
 * on retombe sur le premier morceau de l'étiquette. C'est moins bon, mais
 * c'est ce que l'app affichait avant, donc jamais pire.
 */
export function soloCiudad(ciudad: string | null | undefined, etiqueta: string | null | undefined): string {
  const c = (ciudad ?? '').trim();
  if (c) return c;
  return primerTrozo(etiqueta ?? '');
}

/**
 * VILLE · POINT EXACT. Pour la page d'offres et le détail.
 *
 * Trois cas, et un seul comportement à retenir : **la ville n'apparaît
 * jamais deux fois**.
 *
 *   « Albrook »              + Ciudad de Panamá → Ciudad de Panamá · Albrook
 *   « Chitré · Parque Unión » + Chitré          → Chitré · Parque Unión
 *   « Coronado »             + Coronado         → Coronado
 *
 * Le dernier cas est celui qu'on oublie : quand le conducteur a choisi la
 * ville elle-même comme point, répéter donnerait « Coronado · Coronado ».
 */
export function ciudadYPunto(
  ciudad: string | null | undefined,
  etiqueta: string | null | undefined,
): string {
  const c = (ciudad ?? '').trim();
  const e = (etiqueta ?? '').trim();
  if (!c) return e;
  if (!e) return c;

  const trozos = e.split(SEPARADOR).map((x) => x.trim()).filter(Boolean);
  // L'étiquette porte déjà la ville en tête : elle est complète telle quelle.
  if (trozos[0] === c) return trozos.join(SEPARADOR);
  // Le point EST la ville : un seul nom suffit.
  if (trozos.length === 1 && trozos[0] === c) return c;
  // Le cas ordinaire : la ville, puis le lieu tel qu'il a été écrit.
  return `${c}${SEPARADOR}${trozos[0]}`;
}

/**
 * LE POINT SEUL, sans sa ville. Pour la ligne qui vit DÉJÀ sous un nom de
 * ville — le rail d'un itinéraire, par exemple, où la ville est au-dessus.
 */
export function soloPunto(
  ciudad: string | null | undefined,
  etiqueta: string | null | undefined,
): string {
  const c = (ciudad ?? '').trim();
  const trozos = (etiqueta ?? '').split(SEPARADOR).map((x) => x.trim()).filter(Boolean);
  if (!trozos.length) return '';
  if (trozos[0] === c) return trozos.slice(1).join(SEPARADOR) || c;
  return trozos[0];
}

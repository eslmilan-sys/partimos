/**
 * MONTER EN COURS DE ROUTE — CE QU'ON DOIT DIRE, ET AVEC QUELLE HONNÊTETÉ.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LE PROBLÈME, TEL QU'IL A ÉTÉ POSÉ.
 *
 * « Si une personne est prise en milieu de trajet, elle doit savoir que
 * ça vient d'un voyage qui a déjà des points de ramassage avant — il
 * faut montrer le segment complet — et il faut lui dire qu'il pourrait
 * arriver en retard, avec une indication d'heure approximative. »
 *
 * C'est le trou le plus dangereux du produit. Quelqu'un qui lit « 08:05 »
 * sur une carte comprend « le carro est là à 08:05 ». Sauf que ce carro
 * est parti de Panamá deux heures plus tôt, qu'il a peut-être ramassé
 * deux personnes en chemin, et qu'un embouteillage à La Chorrera décale
 * tout. À 08:20, le passager croit qu'on lui a posé un lapin. Il annule,
 * il note mal, et il ne revient pas. Le conducteur n'a rien fait de mal.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QU'ON N'A PAS LE DROIT DE FAIRE.
 *
 * · Inventer une précision. On n'a pas de trafic en direct, pas de
 *   position GPS du conducteur. Afficher « 08:05 » tout court est un
 *   engagement qu'on ne peut pas tenir. On affiche donc une FRANJA.
 * · Transformer ça en promesse de la plateforme. Le conducteur reste
 *   maître de son horaire (R4) : on dit « suele pasar sobre las 08:05 »,
 *   jamais « llega a las 08:05 ».
 * · Faire peur pour se couvrir. Un bandeau rouge sur chaque trajet de
 *   passage ferait fuir de l'offre parfaitement bonne. Le ton est celui
 *   d'un fait, pas d'un avertissement.
 *
 * ─────────────────────────────────────────────────────────────────────
 * LE MODÈLE D'INCERTITUDE, ET POURQUOI CELUI-LÀ.
 *
 * Deux composantes, parce qu'il y a deux causes :
 *
 *   · un SOCLE de 5 minutes — le temps de se garer, de se reconnaître,
 *     de charger une valise. Il existe même au kilomètre zéro… sauf que
 *     là, c'est le conducteur qui attend chez lui : on ne l'annonce pas.
 *   · une part PROPORTIONNELLE au temps déjà roulé — 10 %. Le retard
 *     d'un trajet s'accumule : plus on monte tard, plus l'écart possible
 *     est grand. Une heure de route déjà faite, c'est six minutes
 *     d'incertitude en plus.
 *
 * Arrondi à 5 minutes, borné à 40. Le plafond n'est pas de la prudence :
 * au-delà, le chiffre cesse d'être une information et devient un aveu
 * d'ignorance — mieux vaut dire « la hora es aproximada » que « ±1 h ».
 *
 * Les 10 % ne sortent pas d'une mesure : c'est une hypothèse déclarée,
 * et elle est ici plutôt que dispersée dans trois composants, précisément
 * pour qu'on puisse la corriger le jour où l'on aura des vraies données.
 */

const SOCLE_MIN = 5;
const PART_DEL_TRAYECTO = 0.1;
const TOPE_MIN = 40;

/** Minutes de route déjà faites par le conducteur avant ce point de montée. */
export function minutosDesdeLaSalida(args: {
  departureAt: string;
  boardingAt: string;
}): number {
  const salida = new Date(args.departureAt).getTime();
  const subida = new Date(args.boardingAt).getTime();
  if (!Number.isFinite(salida) || !Number.isFinite(subida)) return 0;
  return Math.max(0, Math.round((subida - salida) / 60_000));
}

/**
 * L'incertitude à annoncer, en minutes, ou `null` quand il n'y en a pas
 * à annoncer — c'est-à-dire quand le passager monte là où le conducteur
 * démarre. Ce cas mérite le silence : le conducteur est chez lui, il
 * part à l'heure qu'il a écrite, et poser une marge dessus ferait douter
 * de la seule heure du produit qui soit ferme.
 */
export function margenDeEspera(args: {
  departureAt: string;
  boardingAt: string;
  /** Faux quand la montée est le départ même du conducteur. */
  enRuta: boolean;
}): number | null {
  if (!args.enRuta) return null;
  const rodado = minutosDesdeLaSalida(args);
  const bruto = SOCLE_MIN + rodado * PART_DEL_TRAYECTO;
  const redondeado = Math.round(bruto / 5) * 5;
  return Math.min(TOPE_MIN, Math.max(5, redondeado));
}

/** « 08:05 » — l'heure locale, deux chiffres, sans date. */
export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * La fenêtre à afficher : « 08:05 – 08:20 ».
 *
 * Elle commence à l'heure estimée et ne va QUE vers l'avant. C'est
 * délibéré : un passager qui lit « 07:50 – 08:20 » comprend qu'il doit
 * être là à 07:50, donc attendre trente minutes. Un conducteur n'arrive
 * pratiquement jamais en avance à un point intermédiaire — il arrive à
 * l'heure ou plus tard. La fenêtre dit donc la vérité utile : « sois là à
 * 08:05, il peut arriver jusqu'à 08:20 ».
 */
export function franja(boardingAt: string, margenMin: number | null): string {
  if (margenMin === null) return hora(boardingAt);
  const fin = new Date(new Date(boardingAt).getTime() + margenMin * 60_000);
  return `${hora(boardingAt)} – ${hora(fin.toISOString())}`;
}

/** Ce qu'on écrit sous la fenêtre. Une phrase, jamais un paragraphe. */
export function explicacion(args: {
  conductor: string;
  origen: string;
  margenMin: number | null;
}): string {
  if (args.margenMin === null)
    return `${args.conductor} sale de aquí a esa hora.`;
  return `${args.conductor} viene desde ${args.origen}, así que la hora del punto es aproximada: puede llegar hasta ${args.margenMin} minutos después. Te escribimos cuando vaya en camino.`;
}

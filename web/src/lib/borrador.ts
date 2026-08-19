/**
 * LE BROUILLON DE PUBLICATION — ce qui survit à une fermeture d'onglet.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POURQUOI IL EXISTE.
 *
 * Le flux de publication pose maintenant UNE question par écran, sur la
 * MÊME adresse (décision du propriétaire : « ça peut être la même url et
 * ça devrait d'ailleurs »). C'est le bon choix — une adresse par étape
 * aurait rempli l'historique de douze entrées et rendu le partage d'un
 * lien absurde — mais il a un coût : rien dans l'URL ne dit où on en
 * était. Un appel qui arrive, un onglet qui se recharge, et onze
 * réponses disparaissent.
 *
 * Ce module est la contrepartie. Il garde le brouillon dans le
 * navigateur, l'étape comprise, et le rend au retour.
 *
 * ─────────────────────────────────────────────────────────────────────
 * DEUX RÈGLES.
 *
 * · IL PÉRIME. Sept jours. Un brouillon d'il y a trois semaines contient
 *   une date de départ passée et une envie oubliée : le rendre serait
 *   proposer de publier un viaje que personne n'a voulu.
 * · IL NE SURVIT PAS À LA PUBLICATION. `olvidar()` est appelé dès que le
 *   viaje part — sinon le suivant s'ouvrirait pré-rempli avec le
 *   précédent, et « repetir mi último viaje » existe déjà pour ça, en
 *   plus honnête.
 *
 * Les horodatages vivent ICI, hors de tout composant : le compilateur
 * React refuse `Date.now()` dans le corps d'un composant (règle de
 * pureté), même appelé depuis un gestionnaire de clic.
 */

const CLAVE = "partimos.borrador-publicar";
const DIAS_DE_VIDA = 7;

export type Borrador = {
  paso: number;
  from: string;
  to: string;
  /** Le lieu exact, sérialisé tel quel — `PlaceRef` est du JSON pur. */
  origen: unknown;
  destino: unknown;
  exactFrom: string | null;
  exactTo: string | null;
  cityStops: string[];
  pickups: string[];
  dropAnywhere: boolean;
  date: string;
  hour: string;
  seats: number;
  recurrence: string;
  priceCents: number | null;
  aceptaFuera: string[] | null;
  carMake: string;
  carModel: string;
  carYear: number;
  category: string;
  useSavedCar: boolean;
  carIndex: number;
  /** ISO de la dernière écriture — c'est ce qui fait périmer. */
  guardadoEn: string;
};

export function guardar(b: Omit<Borrador, "guardadoEn">): void {
  try {
    window.localStorage.setItem(
      CLAVE,
      JSON.stringify({ ...b, guardadoEn: new Date().toISOString() }),
    );
  } catch {
    /* Stockage refusé (navigation privée stricte). Le flux marche quand
       même — il ne survit simplement pas à un rechargement. */
  }
}

export function leer(): Borrador | null {
  try {
    const bruto = window.localStorage.getItem(CLAVE);
    if (!bruto) return null;
    const b = JSON.parse(bruto) as Borrador;
    if (!b || typeof b.paso !== "number" || !b.guardadoEn) return null;
    const edadDias =
      (Date.now() - new Date(b.guardadoEn).getTime()) / 86_400_000;
    if (!Number.isFinite(edadDias) || edadDias > DIAS_DE_VIDA) {
      olvidar();
      return null;
    }
    return b;
  } catch {
    return null;
  }
}

export function olvidar(): void {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    /* rien à nettoyer */
  }
}

/** L'horodatage du moment — isolé ici pour la même raison que ci-dessus. */
export function ahoraIso(): string {
  return new Date().toISOString();
}

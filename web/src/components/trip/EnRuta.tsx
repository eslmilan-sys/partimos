import { Icon } from "@/components/ui/Icon";
import { franja, margenDeEspera, hora } from "@/lib/enRuta";
import type { TripMatch } from "@/lib/trips";

/**
 * « ESTE VIAJE YA VIENE EN CAMINO » — le bloc qui manquait.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QU'IL EMPÊCHE.
 *
 * Un passager qui monte à Penonomé voyait « 08:05 » et rien d'autre. Ce
 * qu'on ne lui disait pas : le carro est parti de Panamá à 06:00, il a
 * peut-être deux personnes à bord et deux points de ramassage derrière
 * lui, et un bouchon à La Chorrera décale tout le reste. À 08:20 il croit
 * qu'on lui a posé un lapin — il annule, il note mal, il ne revient pas.
 * Le conducteur, lui, n'a rien fait de travers.
 *
 * Trois choses à dire, et dans cet ordre :
 *
 *   1. D'OÙ ÇA VIENT. Le trajet entier, avec le point de montée marqué
 *      dedans. C'est ce qui transforme « 08:05 » en « il roule depuis
 *      deux heures » — et un fait qu'on comprend ne fait plus peur.
 *   2. QUAND, HONNÊTEMENT. Une fenêtre, pas une heure. On n'a ni trafic
 *      en direct ni position du conducteur : afficher une minute exacte
 *      serait un engagement qu'on ne peut pas tenir.
 *   3. CE QUI SE PASSE ENSUITE. « Te escribimos cuando vaya en camino » —
 *      sans cette phrase, la fenêtre laisse quelqu'un seul avec son doute.
 *
 * ─────────────────────────────────────────────────────────────────────
 * IL NE S'AFFICHE PAS QUAND IL N'A RIEN À DIRE.
 *
 * Au départ du conducteur, il n'y a ni amont ni incertitude : le bloc
 * disparaît. Un avertissement affiché partout cesse d'être lu, et il
 * ferait douter du seul horaire ferme du produit.
 */

export function EnRuta({
  match,
  variante = "completo",
}: {
  match: TripMatch;
  /** `linea` : une phrase pour une carte de résultat. `completo` : le
   *  recorrido amont, la fenêtre et la suite — pour la fiche du viaje. */
  variante?: "completo" | "linea";
}) {
  const { trip, segment } = match;
  const vieneDeAntes = segment.fromIndex > 0;
  if (!vieneDeAntes) return null;

  const margen = margenDeEspera({
    departureAt: trip.departureAt,
    boardingAt: match.boardingAt,
    enRuta: true,
  });
  const antes = trip.servedStops.slice(0, segment.fromIndex + 1);
  const origen = antes[0];
  const ventana = franja(match.boardingAt, margen);

  if (variante === "linea") {
    return (
      <p className="flex items-start gap-1.5 text-[12.5px] leading-snug text-ink-500">
        <Icon name="route" className="mt-px size-3.5 shrink-0 text-sol-600" />
        <span>
          Viene desde <b className="font-semibold text-ink-700">{origen.name}</b>{" "}
          — pasa por tu punto sobre las{" "}
          <b className="tnum font-semibold text-ink-700">{ventana}</b>
        </span>
      </p>
    );
  }

  return (
    <section className="superficie-sol rounded-[18px] p-4">
      <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-sol-800">
        <Icon name="route" className="size-4 shrink-0" />
        Este viaje ya viene en camino
      </h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">
        {trip.driver.firstName} sale de{" "}
        <b className="font-semibold text-ink-900">{origen.name}</b> a las{" "}
        <b className="tnum font-semibold text-ink-900">
          {hora(trip.departureAt)}
        </b>
        {antes.length > 2 && (
          <>
            {" "}
            y para en{" "}
            {antes
              .slice(1, -1)
              .map((s) => s.name)
              .join(", ")}
          </>
        )}
        . Tú te subes en{" "}
        <b className="font-semibold text-ink-900">{segment.from.name}</b>.
      </p>

      {/* LE RECORRIDO AMONT, DESSINÉ. Une liste de noms se lit ; une
          ligne verticale se COMPREND — on voit d'un coup combien de
          route est déjà faite avant soi. Le point de montée est le seul
          plein : c'est celui qui concerne le lecteur. */}
      <ol className="relative mt-3.5 ml-1">
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-[5px] w-0.5 rounded-full bg-sol-200"
        />
        {antes.map((stop, i) => {
          const esMio = i === antes.length - 1;
          return (
            <li
              key={stop.citySlug}
              className="relative flex items-center gap-3 py-1 pl-6"
            >
              <span
                aria-hidden
                className={`absolute left-0 size-3 rounded-full ${
                  esMio
                    ? "bg-sol-600 ring-4 ring-sol-100"
                    : "border-2 border-sol-300 bg-white"
                }`}
              />
              <span
                className={`text-[13.5px] ${
                  esMio ? "font-bold text-ink-900" : "text-ink-500"
                }`}
              >
                {stop.name}
                {esMio && " — tu punto"}
              </span>
            </li>
          );
        })}
      </ol>

      {/* LA FENÊTRE. Elle ne va QUE vers l'avant : « 07:50 – 08:20 »
          ferait arriver quelqu'un une demi-heure trop tôt, et un
          conducteur n'arrive pratiquement jamais en avance à un point
          intermédiaire. */}
      <div className="mt-3.5 rounded-[14px] bg-white px-4 py-3">
        <p className="text-[11.5px] font-bold tracking-[0.09em] text-ink-500 uppercase">
          Pasa por tu punto
        </p>
        <p className="tnum font-display text-[22px] leading-tight font-extrabold tracking-[-0.02em] text-ink-900">
          {ventana}
        </p>
        {margen !== null && (
          <p className="mt-1 text-[12.5px] leading-snug text-ink-500">
            La hora es aproximada: {trip.driver.firstName} lleva{" "}
            {Math.round(
              (new Date(match.boardingAt).getTime() -
                new Date(trip.departureAt).getTime()) /
                60_000,
            )}{" "}
            minutos de camino y el tráfico manda. Puede llegar hasta {margen}{" "}
            minutos después de la primera hora.
          </p>
        )}
      </div>

      <p className="mt-2.5 text-[12.5px] leading-snug text-ink-600">
        Te escribimos por el chat cuando vaya en camino, y si se atrasa más de
        lo previsto puedes cancelar sin costo.
      </p>
    </section>
  );
}

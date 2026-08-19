import { strict as assert } from "node:assert";
import { test } from "node:test";
import { detourKm, routePoints } from "./desvio.ts";

/**
 * LE DÉTOUR COMMANDE LE PRIX.
 *
 * S'il se trompe, le passager paie un chiffre inventé — c'est exactement
 * ce que le curseur manuel faisait. Ces tests fixent ce qui compte : un
 * point SUR la route ne coûte rien, un point à côté coûte l'aller-retour,
 * et la mesure se fait contre le SEGMENT, pas contre les villes.
 *
 * La route d'essai est une ligne droite vers l'ouest à 9° de latitude,
 * en coordonnées rondes, pour que chaque chiffre se vérifie à la main.
 */

const RUTA = [
  { lat: 9.0, lng: -79.5 },
  { lat: 9.0, lng: -79.8 },
  { lat: 9.0, lng: -80.0 },
];

test("un punto sobre el camino no desvía", () => {
  assert.equal(detourKm({ lat: 9.0, lng: -79.7 }, RUTA), 0);
});

test("cuenta la ida Y la vuelta", () => {
  /* Un degré de latitude ≈ 111,2 km ; 0,05° ≈ 5,56 km de distance,
     donc ≈ 11,1 km aller-retour, arrondi au demi-kilomètre. */
  assert.equal(detourKm({ lat: 9.05, lng: -79.7 }, RUTA), 11);
});

test("mide contra el segmento, no contra las ciudades", () => {
  /* Ce point est à 11 km de la ville la plus proche mais posé pile sur
     le trait entre deux : le mesurer contre les villes ferait payer des
     kilomètres qui n'existent pas. */
  assert.equal(detourKm({ lat: 9.0, lng: -79.65 }, RUTA), 0);
});

test("más allá del final del camino, mide hasta la punta", () => {
  /* Après le dernier point, la perpendiculaire tombe hors du segment :
     la distance est celle du bout, jamais un raccourci imaginaire. */
  assert.ok(detourKm({ lat: 9.0, lng: -80.1 }, RUTA) > 15);
});

test("sin ruta, no inventa nada", () => {
  assert.equal(detourKm({ lat: 9.0, lng: -79.5 }, []), 0);
});

test("una ruta de un solo punto sigue midiendo", () => {
  const d = detourKm({ lat: 9.05, lng: -79.5 }, [{ lat: 9.0, lng: -79.5 }]);
  assert.equal(d, 11);
});

test("traduce los slugs servidos en coordenadas", () => {
  const pts = routePoints(["panama-city", "la-chorrera"]);
  assert.equal(pts.length, 2);
  assert.ok(pts[0].lat > 8 && pts[0].lat < 10);
  assert.ok(pts[0].lng < -78);
});

test("ignora un slug que no existe en vez de romperse", () => {
  assert.equal(routePoints(["panama-city", "no-existe"]).length, 1);
});

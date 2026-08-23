# La base de lugares — geolocalización en casa

## La pregunta

> ¿Podemos bajarnos todas las localizaciones y guardarlas en tablas
> nuestras, y así no depender de un tercero?

**Sí, con la fuente correcta.** Y hay una fuente que NO sirve:

| Fuente | ¿Se puede guardar? |
| --- | --- |
| Google Places | **No.** Sus términos prohíben almacenar los resultados; solo se permite conservar el `place_id`. |
| Mapbox | **No de forma permanente.** Solo caché temporal (30 días) y con restricciones. |
| TomTom | **No** para redistribuir; caché limitada. |
| **OpenStreetMap** (extracto Geofabrik) | **Sí.** Licencia ODbL: copiar, transformar y servir, con atribución «© OpenStreetMap contributors» y *share-alike* sobre la base derivada. |
| **Overture Maps** (capa *places*) | **Sí.** CDLA-Permissive 2.0, más libre todavía. Su capa *buildings* viene de OSM y sigue ODbL. |

Así que el plan es OSM (+ Overture si hace falta) **como base propia**, y
los geocodificadores comerciales solo como red de seguridad para lo que
todavía no tengamos.

## Lo que ya está en el repositorio

| Pieza | Qué hace |
| --- | --- |
| `supabase/migrations/0013_lugares.sql` | Tabla `places` (PostGIS + trigramas), políticas RLS, función `search_places(q, near_city, max)` y `bump_place(id)`. |
| `supabase/migrations/0032_catalogo_de_arranque.sql` | El catálogo escrito a mano: unos setenta lugares que la gente cita de verdad, al punto de su ciudad. Funciona sin ninguna llave. |
| `scripts/importar-lugares.mjs` | Trae **todas** las direcciones de OpenStreetMap por Overpass y las sube. Solo pide Node. Sustituye al importador viejo, que exigía `osmium-tool`. |
| `app/src/servicios/geobusqueda.ts` | Consulta las cuatro fuentes **a la vez**, la nuestra primero. Cada una que falle desaparece en silencio. |

## Por qué hoy no encuentra nada — y las tres salidas

**El diagnóstico, 23-08-2026.** La tabla `places` existe con su índice
trigrama y su función `search_places`, y la app la consulta **primero** en
cada tecla. Pero está vacía, y las tres llaves de geocodificación comercial
—TomTom, LocationIQ, Mapbox— no están puestas. Así que se escribe
«Multiplaza» y no sale nada: la búsqueda solo conoce las 32 ciudades.

Había además un fallo propio: `HAY_BUSQUEDA` contaba las tres llaves y **no
contaba la nuestra**. Con el catálogo lleno y sin llaves, la pantalla seguía
anunciando «solo buscamos entre las ciudades que servimos». Corregido.

### Salida 1 · El catálogo de arranque (ya hecho, sin llaves)

`0032_catalogo_de_arranque.sql` mete unos setenta lugares que los panameños
citan de verdad: Albrook Mall, Multiplaza, Metromall, Costa del Este, Vía
España, Punta Chame, Playa Blanca, Chiriquí Mall, Zona Libre… Sin llave, sin
red, sin factura.

**Cada entrada lleva el punto de SU ciudad**, no una coordenada escrita de
memoria. Una coordenada inventada entra en el cálculo de la distancia, del
costo y del tope, y nadie vería el error. La ciudad sí es exacta: viene de
`cities`. Albrook queda a 3,7 km del centro de la capital — sobre un viaje de
250 km, un 1,5 % de diferencia. El importador de abajo la sustituye por la
verdadera.

**No hay ni un terminal de bus, a propósito.** `PRODUCT.md` lo hace condición
jurídica y el conflicto sigue abierto en `CLAUDE.md`. Este archivo no lo
tranca solo.

### Salida 2 · Todas las direcciones, de OpenStreetMap (una vez, gratis)

```bash
export SUPABASE_URL=https://xxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...        # nunca en el repositorio

node scripts/importar-lugares.mjs --seco     # cuenta, no escribe nada
node scripts/importar-lugares.mjs            # escribe de verdad
```

`scripts/importar-lugares.mjs` reemplaza al importador viejo, que pedía
`osmium-tool` y 120 MB de extracto. Este habla con **Overpass**: solo hace
falta Node. Trae centros comerciales, supermercados, bombas, hospitales,
universidades, parques, hoteles, aeropuertos y barrios; descarta lo que no
tiene nombre y lo que queda a más de 40 km de una ciudad servida. Se puede
correr las veces que sea: escribe por `(source, source_id)`.

Los datos son **nuestros** desde ese momento: ODbL permite copiarlos,
transformarlos y servirlos. La única condición es la atribución.

### Salida 3 · Mapbox, si se quiere red de seguridad (5 minutos)

Para lo que OSM no tenga todavía. Cuenta gratis en mapbox.com, un token
público, y:

```bash
gh secret set MAPBOX_TOKEN --body "pk.ey..."   # o desde la web de GitHub
```

El código ya lo espera en `EXPO_PUBLIC_MAPBOX_TOKEN` y el flujo de CI ya lo
pasa al exportar. **Restringirlo por dominio en la consola de Mapbox**: un
token público sin restricción lo usa cualquiera y la factura llega aquí.

Las tres salidas se suman: `buscarEnTodas` pregunta a todas a la vez y funde
lo que vuelva. Una fuente de menos degrada la lista; nunca la rompe.

## El problema del PH que no aparece

Que un PH no salga hoy **no siempre es culpa del proveedor**: si nadie lo
ha cartografiado en OSM y no está en el índice comercial, no existe para
nadie. Por eso la tabla tiene una tercera fuente, `source = 'usuario'`:

- cuando alguien escribe un punto exacto y **confirma una reserva** con
  él, ese punto entra en `places` y queda buscable para el siguiente;
- `used_count` sube con el uso real (`bump_place`), no con las búsquedas,
  así que el ranking lo escribe la gente que de verdad se sube al carro.

En seis meses eso es un índice de puntos de recogida panameños que
ningún proveedor tiene. Es el activo que se construye solo.

## Lo que falta para encenderlo

1. Proyecto Supabase creado y `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` en
   el entorno (hoy la demo corre sin base).
2. Correr la migración y el importador (arriba).
3. Escribir el punto del pasajero en `places` al confirmar la reserva —
   el gancho va donde hoy se guarda la reserva
   (`BookingPanel.confirmBooking`), en cuanto exista la tabla `bookings`
   real.
4. **Atribución obligatoria**: «© OpenStreetMap contributors» visible en
   la pantalla que muestre los datos (pie de página del buscador basta).
   Es condición de la licencia ODbL, no un detalle.

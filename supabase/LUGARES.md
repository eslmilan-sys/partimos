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
| `scripts/import-places.mjs` | Baja el extracto de Panamá, filtra lo que sirve como punto de encuentro, lo asigna a la ciudad servida más cercana y lo sube. |
| `src/lib/geosearch.ts` | Ahora consulta **primero** nuestra tabla; TomTom, LocationIQ y Mapbox quedan de respaldo. Sin Supabase configurado se comporta igual que antes. |

## Cómo se corre (una vez)

**Atajo — un solo comando.** Con las cuatro claves en `.env.local`
(`SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`):

```bash
bash scripts/setup-lugares.sh
```

Hace lo mismo que los pasos de abajo, en orden, y se puede correr dos
veces sin romper nada.

### Paso a paso, si prefieres verlo

```bash
# 1. herramienta de extracción
brew install osmium-tool          # o: apt install osmium-tool

# 2. centros de las ciudades servidas (los lee el importador)
node -e "import('./src/lib/corridors.ts').then(m=>console.log(JSON.stringify(
  m.ALL_CITIES.map(c=>({slug:c.slug,lat:c.lat,lng:c.lng})))))" \
  > scripts/city-centers.json

# 3. la migración
supabase db push

# 4. prueba en seco: extrae y cuenta, no sube nada
node scripts/import-places.mjs --dry

# 5. la buena
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-places.mjs
```

Órdenes de magnitud: el extracto de Panamá pesa unos **60 MB**, salen del
orden de **100 000–200 000 lugares con nombre**, y en Postgres son unos
**40 MB con índices**. Cabe en el plan pequeño de Supabase. Refrescarlo
cada mes o dos es suficiente: OSM en Panamá no cambia a diario.

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

# Partimos — app móvil

Recreación del traspaso de diseño (`design_handoff_partimos_app/`) en Expo.
Un solo código para el navegador y para el teléfono con Expo Go.

## Correrla en el teléfono

El QR no lo imprime este repositorio: lo imprime `npx expo start` en la máquina
que sirve la app, y el teléfono lo escanea para conectarse a ella. Así que el QR
tiene que nacer en tu computadora, en tu misma red wifi que el teléfono.

La app vive en la rama `claude/partimos-app-design-9hzmqb`, no en `main`, así
que la carpeta `partimos-app/` no existe hasta después del `checkout`. Por eso se
clona la rama directamente, y las órdenes van encadenadas con `&&` para que un
fallo pare la fila en vez de dejar corriendo las demás en la carpeta equivocada:

```bash
git clone --branch claude/partimos-app-design-9hzmqb https://github.com/eslmilan-sys/test.git
cd test/partimos-app && npm install && npx expo start
```

Si ya tenías el repositorio clonado, no lo vuelvas a clonar:

```bash
cd ~/test && git checkout claude/partimos-app-design-9hzmqb && cd partimos-app && npm install && npx expo start
```

En la terminal aparece el QR y debajo una dirección `exp://192.168.x.x:8081`.
Instala **Expo Go** (App Store o Play Store), ábrela y escanea:

- **Android** — se escanea desde la propia Expo Go, con «Scan QR code».
- **iPhone** — se escanea con la cámara del sistema, no desde Expo Go.

Si el teléfono no encuentra la computadora, es la wifi: tienen que estar en la
misma red y sin aislamiento de clientes. La salida es `npx expo start --tunnel`,
que pasa por internet en vez de por la red local y funciona desde cualquier
parte.

Expo Go tiene que ser la versión del SDK 57, que es la que usa el proyecto.

Y sin teléfono, `npx expo start --web` abre lo mismo en `localhost:8081`; el
índice de las 58 pantallas está en la raíz.

## Publicada, sin instalar nada

`/app` en la raíz del repositorio es la app exportada como sitio estático: las 58
pantallas prerenderizadas, sin servidor. Publicada con GitHub Pages se abre desde
el teléfono con un enlace, sin Expo Go y sin clonar nada:

    https://eslmilan-sys.github.io/test/app/

Para rehacerla después de tocar una pantalla:

```bash
npm run export:web
```

El subcamino `/test/app` entra por `PARTIMOS_BASE_URL` en `app.config.js` y solo
al exportar, para que `npx expo start` siga sirviendo desde la raíz. Si algún día
la app cambia de carpeta o de dominio, ese es el único sitio que se toca.

Es una carpeta nueva: no toca `partimos/`, que sigue siendo el sitio de siempre.

Las 58 pantallas del traspaso, hechas:

**A · Pasajero: buscar y entrar**

| Id | Pantalla | Ruta |
| --- | --- | --- |
| `4a` | Apertura | `/(cuenta)/apertura` |
| `1a` | Bienvenida | `/(cuenta)/bienvenida` |
| `3a` | Inicio | `/(pasajero)` |
| `1b` `3b` | Resultados | `/(pasajero)/resultados` |
| `3c` | Resultados con el destino de fondo | `/(pasajero)/destino` |
| `5a` | Detalle del viaje | `/(pasajero)/viaje` |
| `6b` | Perfil público | `/(pasajero)/perfil` |
| `1c` | La puerta | `/(cuenta)/puerta` |
| `4b`–`4d` | Registro | `/(cuenta)/registro` |
| `4e` | Entrar | `/(cuenta)/entrar` |
| `14e` | Entrar · versión larga | `/(cuenta)/acceso` |

**B · Pasajero: pagar y viajar**

| Id | Pantalla | Ruta |
| --- | --- | --- |
| `7a` | Reserva | `/(pasajero)/reservar` |
| `7b` | Pago del aporte | `/(pasajero)/pagar` |
| `9a` | Métodos de pago | `/(pasajero)/metodos` |
| `14c` | Añadir método | `/(pasajero)/metodo-nuevo` |
| `12a` | Pantalla bloqueada | `/(avisos)/bloqueada` |
| `11b` | Bandeja de avisos | `/(avisos)/avisos` |
| `6c` | Chat del viaje | `/(pasajero)/chat` |
| `16a` | Conversaciones | `/(pasajero)/conversaciones` |
| `1d` | Ya · lista | `/(pasajero)/ya` |
| `1e` | Ya · mapa | `/(pasajero)/ya-mapa` |
| `1f` | Código de abordaje | `/(pasajero)/codigo` |
| `1h` | En ruta | `/(pasajero)/ruta` |
| `1i` | Llegada y liberación | `/(pasajero)/llegada` |
| `1j` | Calificar | `/(pasajero)/calificar` |

**C · Conductor: de la cédula al pago**

| Id | Pantalla | Ruta |
| --- | --- | --- |
| `6d` | Verificación de cédula | `/(conductor)/cedula` |
| `6a` | Tu cuenta | `/(cuenta)/cuenta` |
| `14b` | Registrar el carro | `/(conductor)/carro` |
| `5c` | Publicar | `/(conductor)/publicar` |
| `5d` | El tope | `/(conductor)/tope` |
| `7c` | Puestos y maletas | `/(conductor)/puestos` |
| `10a` | Panel del conductor | `/(conductor)/panel` |
| `5b` | Mis viajes | `/(conductor)/misviajes` |
| `14d` | Editar el viaje | `/(conductor)/editar` |
| `11a` | Solicitudes de puesto | `/(conductor)/solicitudes` |
| `15e` | Quién pide puesto | `/(conductor)/solicitante` |
| `1g` | Código de abordaje · conductor | `/(conductor)/abordaje` |
| `10b` | Lo que te han aportado | `/(conductor)/aportes` |

**D · Deshacer, reclamar, preguntar**

| Id | Pantalla | Ruta |
| --- | --- | --- |
| `14a` | Cancelar el puesto | `/(ayuda)/cancelar` |
| `7d` | Reembolso | `/(ayuda)/reembolso` |
| `15c` | Estado del reembolso | `/(ayuda)/estado` |
| `15b` | Ayuda | `/(ayuda)` |
| `15d` | Reportar | `/(ayuda)/reportar` |
| `15a` | Rutas guardadas | `/(pasajero)/rutas` |
| `8a` | Ajustes | `/(cuenta)/ajustes` |
| `16b` | Cómo se paga | `/(ayuda)/pagos` |
| `16c` | Comprobante | `/(pasajero)/comprobante` |
| `16d` | Permiso de avisos | `/(avisos)/permiso` |

El tablero E del traspaso son documentos —los dos recorridos, el mapa de eventos
y las tres pruebas de rojo—, no pantallas.

## Cómo está montada

```
app/                    una ruta por pantalla del diseño
src/
  servicios/            lo ÚNICO que habla con datos
    _fuente/            el interruptor simulado ⇄ producción
      simulado/         filas con la forma exacta de las tablas
      supabase/         vacío por ahora
  dominio/              reglas puras, sin IO, con pruebas
  tipos/base.ts         generado desde el proyecto Supabase del sitio
  ui/                   el design system portado
```

Las pantallas no ven datos falsos: llaman a `servicios/*` y reciben filas con
la forma de las tablas reales. `src/tipos/base.ts` está generado desde la base
de producción, así que si una columna cambia, el simulado deja de compilar.

```bash
npm test        # las reglas de negocio contra el viaje de referencia
npm run typecheck
```

## Decisiones tomadas

**El costo del viaje** — gasolina, no un baremo kilométrico:

```
costo = distancia × (consumo_L/100km ÷ 100 × precio_litro) × (1 + 10 % desvío) + peajes
```

Consumo por categoría: económico 7,0 · estándar 8,0 · SUV 11,0 L/100 km.
Precio de la gasolina: 0,80 $/L — es un dato, cambia cada quincena en Panamá.
Albrook → Chitré (250 km, peaje 3 $, sedán) da **20,60 $**, el número del diseño.

**El tope** es de la ruta, no del viaje: `ceil(costo_con_carro_de_referencia / 3)`,
que en Chitré da **7 $**. No sube porque el conductor maneje una camioneta.

**El aporte por defecto**: `ceil(costo / (puestos + 1))` — el conductor cuenta
como uno más que paga — limitado a `[3 $, tope]`.

**Las tarifas** se calculan sobre el aporte y se suman encima: Yappy 5 %,
tarjeta 8 %, efectivo 0 %. El conductor recibe el aporte completo siempre.

**Los reembolsos**: la tarifa se retiene solo cuando la cancelación es tuya
(6,00 $ de 6,30 $). Si falla el otro, vuelve todo (6,30 $). A menos de 2 h de
la salida, el conductor se queda 1 $ por el puesto que ya no vende.

## Lo que la base todavía no tiene

Está en `src/tipos/index.ts`, bajo «pendiente de migración», con nombre propio
para que la migración sea mecánica:

- `trips.accepts_luggage` — el booleano de maletas de `5c`.
- `corridors.max_price_cents` — el tope por ruta.
- `bookings`: `boarding_code` y `arrival_code` (son dos códigos distintos: uno
  abre el viaje en `1f`/`1g` y otro lo cierra en `1i`), `boarded_at`,
  `released_at`, `expires_at` para las 4 h de `11a`, `detour_minutes`, y
  `mochilas` / `maletas`.
- `booking_status` necesita «rechazada»: hoy no hay estado para que el conductor
  diga que no sin cancelar una reserva confirmada.

No se ha tocado la base de producción.

/**
 * `5e` Repaso — lo que vas a publicar, entero y en una pantalla.
 *
 * **Por qué existe.** `5c` publicaba de golpe: el último toque de una pantalla
 * con tres steppers, cuatro interruptores y una ruta escribía un viaje en la
 * base y ya. Publicar es un compromiso con desconocidos —te van a esperar en
 * una esquina a una hora— y el único momento para leerlo entero es antes.
 *
 * No se decide nada aquí: todo lo que sale es lo que ya elegiste. Es una
 * lectura, con una sola acción al final y la puerta de atrás para corregir.
 *
 * ── La refundición del 30-08-2026 ────────────────────────────────────────
 *
 * Cuatro cosas, las cuatro vistas por el dueño en su teléfono.
 *
 * 1. **El comentario no salía.** Lo escribes en el octavo paso, viaja en los
 *    parámetros, se guarda en `trips.notes`… y la pantalla que existe para
 *    leerlo todo antes de comprometerse era la única que no lo enseñaba. Lo
 *    único que el conductor escribe con sus palabras.
 *
 * 2. **La bolita de la llegada no caía al final de la línea.** La línea era
 *    un `View` absoluto sobre toda la columna, con `top: 10, bottom: 22`:
 *    dos números a ojo contra una altura de fila que depende de la
 *    tipografía. Ahora **no hay línea suelta**: cada parada dibuja el tramo
 *    que baja hacia la siguiente, y la última no dibuja ninguno porque no
 *    tiene siguiente. Es exacto por construcción, no por medida.
 *
 * 3. **«Un cuadrado blanco roto encima de un degradado. ¿Por qué?»** Tenía
 *    razón y no había respuesta. La pantalla llevaba una `Bandera` —el campo
 *    rojo con el dibujo del destino— y encima una `hoja` de esquinas
 *    redondeadas subida 30 px… **del mismo color que la página**. El truco
 *    de la hoja que sube sólo se lee si la hoja es de otro color; siendo el
 *    mismo, lo único que se veía era un canto redondeado cortando un
 *    degradado sin motivo. Y de fondo: este es el paso NUEVE del asistente
 *    de publicar, no la ficha de un destino que hay que vender. Ahora lleva
 *    la misma cabecera que los ocho pasos anteriores y ni hoja ni bandera.
 *
 * 4. **«Si todos ponen 7, ¿por qué yo pago 4,86?»** Era verdad y era un
 *    defecto del cálculo, no de la pantalla: está arreglado en
 *    `dominio/aporte.ts` — y arreglado dos veces, porque el primer arreglo
 *    dejaba la diferencia del otro lado. Hoy el reparto va al centavo y las
 *    dos cifras de abajo salen iguales. Aquí lo que cambia es que el
 *    dinero **se dice como un reparto** —entre cuántos, cuánto cada quien—
 *    en vez de tres cifras de las que había que deducir la suya restando.
 *
 * Y una sola superficie en vez de cuatro tarjetas flotando: esto es un
 * documento que se lee de arriba abajo antes de firmarlo, con filetes entre
 * sus partes. Menos cantos, más tipografía.
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';
import { deParams } from '@/dominio/lugar';
import { ciudadesConocidas } from '@/servicios/lugares';

import { aporteCalculado, elTopeMuerde } from '@/dominio/aporte';
import {
  type PublicacionPreparada,
  prepararPublicacion,
  publicarViaje,
  repartoDelCosto,
} from '@/servicios/viajes';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo, motivoDe } from '@/ui/CampoRojo';
import { NoEsta } from '@/ui/NoEsta';
import { Boton, Epigrafe } from '@/ui/controles';
import { formatearDinero, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaLargo, hora, mas } from '@/ui/fechas';
import { Atras, Carro, Maleta, Mascota, Persona, SinHumo } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio, texto } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

/** Lo que cuesta desviarse a recoger en cada parada. Igual que en `5c`. */
const MINUTOS_POR_PARADA = 5;

export default function Repaso() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const p = useLocalSearchParams<{
    ruta?: string;
    o?: string;
    oNom?: string;
    oTipo?: string;
    oPos?: string;
    d?: string;
    dNom?: string;
    dTipo?: string;
    dPos?: string;
    salida?: string;
    paradas?: string;
    puestos?: string;
    aporte?: string;
    maletas?: string;
    mujeres?: string;
    mascotas?: string;
    fumar?: string;
    adelante?: string;
    atras?: string;
    comentario?: string;
  }>();

  const [datos, setDatos] = useState<PublicacionPreparada | null>(null);
  const [noEsta, setNoEsta] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [quePaso, setQuePaso] = useState<string | null>(null);

  /* Los índices de las paradas elegidas — «0,2» — no una cuenta. */
  /* Todas las que vengan: el `.slice(0, 2)` que había aquí recortaba el
     repaso a dos paradas mientras la pantalla anterior dejaba poner las que
     quisiera, así que el resumen que se lee antes de publicar enseñaba menos
     camino del que se iba a publicar (01-09-2026). */
  const indicesParadas = (p.paradas ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0);
  const paradas = indicesParadas.length;
  const puestos = Number(p.puestos ?? 3);
  const aporteElegido = p.aporte ? Number(p.aporte) : null;
  const comentario = (p.comentario ?? '').trim();

  /* Los dos extremos, si vinieron: en ruta libre son lo único que dice qué
     se publica. `deParams` es el mismo des-serializador de resultados. */
  const desde = useMemo(() => deParams(ciudadesConocidas(), p, 'o'), [p.o, p.oNom, p.oPos]);
  const hacia = useMemo(() => deParams(ciudadesConocidas(), p, 'd'), [p.d, p.dNom, p.dPos]);
  const libre = !p.ruta && desde && hacia ? { desde, hacia } : undefined;

  useEffect(() => {
    if (!yo || !p.salida) return;
    if (!p.ruta && !libre) return;
    prepararPublicacion(yo, p.ruta ?? '', p.salida, libre)
      .then(setDatos)
      .catch(() => setNoEsta(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yo, p.ruta, p.salida, desde, hacia]);

  if (noEsta || (!p.ruta && !libre && !datos))
    return (
      <NoEsta
        titulo="Falta lo que ibas a publicar"
        explicacion="Vuelve a la pantalla de publicar y elige la ruta, el día y la hora."
      />
    );
  if (!datos) return <Cargando />;

  const aporte = aporteElegido ?? aporteCalculado(datos.costoCentavos, puestos, datos.topeCentavos);
  const cuenta = repartoDelCosto(datos.costoCentavos, aporte, puestos);
  /* ¿La cifra sale del reparto o del tope de la ruta? Las dos razones por las
     que el conductor pone más que ellos son distintas, y decir la que no es
     deja la pantalla mintiendo. */
  const topeMuerde = elTopeMuerde(datos.costoCentavos, puestos, datos.topeCentavos);
  const salida = new Date(datos.salida);
  const llegada = mas(salida, datos.duracionMin + paradas * MINUTOS_POR_PARADA);
  const enMedio = indicesParadas.map((i) => datos.paradasOfrecidas[i]).filter(Boolean);

  const condiciones: { texto: string; icono: React.ReactNode }[] = [
    {
      texto: p.maletas ? 'Acepta maletas' : 'Solo mochila',
      icono: <Maleta tamano={15} tinta={color.ink500} />,
    },
    {
      texto: p.mascotas ? 'Acepta mascotas' : 'Sin mascotas',
      icono: <Mascota tamano={15} tinta={color.ink500} />,
    },
    {
      texto: p.fumar ? 'Se puede fumar' : 'No se fuma',
      icono: <SinHumo tamano={15} tinta={color.ink500} />,
    },
  ];
  if (p.mujeres) {
    condiciones.push({
      texto: 'Solo mujeres',
      icono: <Persona tamano={15} tinta={color.ink500} />,
    });
  }

  /* El recorrido, ya montado. Cada parada sabe si es la última: la última no
     dibuja hilo, y por eso la línea no puede pasarse de su bolita. */
  const delCamino = [
    { que: 'Salida', nombre: datos.origen, cuando: hora(salida), tipo: 'salida' as const },
    ...enMedio.map((x) => ({
      que: 'Parada',
      nombre: x.nombre,
      /* Vacío cuando no sabemos a qué hora se pasa por ahí — una parada del
         tramo final. Ver `ParadaOfrecida.minutos`. */
      cuando: x.minutos == null ? '' : hora(mas(salida, x.minutos)),
      tipo: 'media' as const,
    })),
    { que: 'Llegada', nombre: datos.destino, cuando: hora(llegada), tipo: 'llegada' as const },
  ];

  return (
    <View style={estilos.pantalla}>
      {/* La misma cabecera que los ocho pasos anteriores: este es el noveno.
          Antes llevaba `Bandera` —el campo rojo con el dibujo del destino—
          y encima una hoja redondeada del color de la página. */}
      <CampoRojo altura={206} motivo={motivoDe(slugDe(datos.destino))} />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás, corregir"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>Antes de publicar</Text>
        </View>

        <Text style={estilos.titular} numberOfLines={2}>
          {`${datos.origen} → ${datos.destino}`}
        </Text>
        <Text style={estilos.subtitulo}>{`${diaLargo(datos.salida)} · ${hora(salida)}`}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* UNA SOLA SUPERFICIE. Eran cuatro tarjetas blancas con borde, una
            por tema; leídas seguidas, tres cantos de más entre cosas que se
            leen del tirón. Un documento, con filetes entre sus partes. */}
        <View style={estilos.pliego}>
          <View style={estilos.seccion}>
            <Epigrafe>El camino</Epigrafe>
            <View style={estilos.recorrido}>
              {delCamino.map((x, i) => (
                <Parada
                  key={`${x.nombre}-${i}`}
                  que={x.que}
                  nombre={x.nombre}
                  cuando={x.cuando}
                  tipo={x.tipo}
                  ultima={i === delCamino.length - 1}
                />
              ))}
            </View>
          </View>

          <View style={estilos.filete} />

          <View style={estilos.seccion}>
            <Epigrafe>Quién viene, y en qué</Epigrafe>
            <View style={estilos.filaCarro}>
              <View style={estilos.cuadroCarro}>
                <Carro tamano={26} tinta={color.ink600} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.textoCarro} numberOfLines={1}>
                  {[datos.carro.make, datos.carro.model, datos.carro.color?.toLowerCase()]
                    .filter(Boolean)
                    .join(' ')}
                </Text>
                <Text style={estilos.detalleCarro}>
                  {`${puestos} ${puestos === 1 ? 'puesto' : 'puestos'} de ${datos.puestosMaximos}`}
                </Text>
              </View>
            </View>

            <View style={estilos.condiciones}>
              {condiciones.map((c) => (
                <View key={c.texto} style={estilos.condicion}>
                  {c.icono}
                  <Text style={estilos.condicionTexto}>{c.texto}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={estilos.filete} />

          {/* EL DINERO, DICHO COMO UN REPARTO. Antes eran tres renglones
              —costo, lo que recuperas, de tu bolsillo— de los que había que
              deducir restando cuánto pone cada quien. La pregunta del dueño
              («si todos ponen 7, ¿por qué yo pago 4,86?») nacía justo ahí. */}
          <View style={estilos.seccion}>
            <Epigrafe>El aporte</Epigrafe>

            <Text style={estilos.repartoEntre}>
              {topeMuerde
                ? `El viaje cuesta ${formatearDinero(cuenta.costoCentavos)}. Van ${puestos + 1} personas, contándote a ti.`
                : `El viaje cuesta ${formatearDinero(cuenta.costoCentavos)} y se reparte entre ${puestos + 1}, contándote a ti.`}
            </Text>

            <View style={estilos.reparto}>
              <View style={estilos.parte}>
                <Text style={estilos.parteQuien}>
                  {puestos === 1 ? 'El pasajero' : 'Cada pasajero'}
                </Text>
                <Text style={[estilos.parteCifra, tabular]}>
                  {formatearDineroRedondo(aporte)}
                </Text>
              </View>
              <View style={estilos.parteFilete} />
              <View style={estilos.parte}>
                <Text style={estilos.parteQuien}>Tú</Text>
                <Text style={[estilos.parteCifra, tabular]}>
                  {formatearDinero(cuenta.deTuBolsilloCentavos)}
                </Text>
              </View>
            </View>

            {/* LA REGLA, con su razón al lado (invariante 7), y las dos
                razones son distintas: hay que decir la que toca.

                Con el tope mordiendo, «se redondea» es falso — de 16,43 a 11
                no hay redondeo, hay un tope (pregunta del dueño del 30-08:
                «¿por qué si son 30 $ pagan 11?»).

                Y sin tope, la frase también cambió el 01-09: decía «pones más
                que ellos porque el aporte se redondea al dólar de abajo», y
                eran 2,19 $ de diferencia dentro del mismo carro. El reparto
                va ahora al centavo, así que lo que hay que decir es lo
                contrario — que todos ponen lo mismo — y por qué eso no
                significa que el viaje salga gratis. */}
            <Text style={estilos.porQue}>
              {topeMuerde
                ? `Entre ${puestos + 1} saldría a ${formatearDinero(Math.round(cuenta.costoCentavos / (puestos + 1)))} cada uno, pero el tope de esta ruta es ${formatearDinero(datos.topeCentavos)} por puesto: nadie paga de más por ser el único que va contigo. El resto lo pones tú, y nadie gana dinero con esto.`
                : `El costo se parte entre los ${puestos + 1} que van y todos ponen lo mismo, tú incluido. Por eso el carro lleno nunca cubre el viaje entero: tu parte siempre se queda dentro.`}
            </Text>
          </View>

          {/* LO QUE ESCRIBISTE, que era lo único que no salía. Va al final
              porque es lo último que se escribe y lo primero que ellos leen
              en la ficha: cerrar el repaso con tus propias palabras es lo
              más parecido a releer un mensaje antes de mandarlo. */}
          {comentario ? (
            <>
              <View style={estilos.filete} />
              <View style={estilos.seccion}>
                <Epigrafe>Lo que les dices</Epigrafe>
                <Text style={estilos.comentario}>{comentario}</Text>
              </View>
            </>
          ) : null}
        </View>

        {quePaso ? <Text style={estilos.error}>{quePaso}</Text> : null}
      </ScrollView>

      <View style={estilos.pie}>
        <Boton
          desactivado={publicando}
          alPulsar={async () => {
            if (!yo || !p.salida || (!p.ruta && !libre)) return;
            setPublicando(true);
            setQuePaso(null);
            try {
              await publicarViaje({
                conductorId: yo,
                carroId: datos.carro.id,
                corredorSlug: p.ruta ?? '',
                desde: libre?.desde ?? null,
                hacia: libre?.hacia ?? null,
                salida: p.salida,
                paradas: indicesParadas,
                puestos,
                aporteCentavos: aporteElegido,
                aceptaMaletas: !!p.maletas,
                soloMujeres: !!p.mujeres,
                aceptaMascotas: !!p.mascotas,
                sePuedeFumar: !!p.fumar,
                adelante: p.adelante ? Number(p.adelante) : null,
                atras: p.atras ? Number(p.atras) : null,
                comentario: p.comentario ?? null,
              });
              // Al panel del conductor, NO al detalle del pasajero: quien
              // acaba de publicar no tiene que pedirse un puesto en su
              // propio carro. Aquí ve su viaje y las solicitudes que lleguen.
              router.replace('/(conductor)/panel');
            } catch (e) {
              setQuePaso(e instanceof Error ? e.message : 'No se pudo publicar. Prueba otra vez.');
            } finally {
              setPublicando(false);
            }
          }}
        >
          {`Publicar · ${puestos} ${puestos === 1 ? 'puesto a' : 'puestos a'} ${formatearDineroRedondo(aporte)}`}
        </Boton>
        <Text style={estilos.notaPie}>
          Puedes editarlo mientras nadie haya asegurado su puesto.
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Una parada del repaso: qué es, cómo se llama, a qué hora — y el hilo que
 * baja hasta la siguiente.
 *
 * **El hilo es de la parada, y la última no tiene.** Antes era un `View`
 * absoluto sobre toda la columna, con `top: 10, bottom: 22`: dos números a
 * ojo contra una altura de fila que depende de la tipografía, y que se
 * pasaba de la bolita de la llegada (visto por el dueño el 30-08-2026).
 * Ahora cada parada dibuja el tramo que va hacia la de abajo, y como la
 * última no dibuja ninguno, la línea **no puede** sobresalir.
 *
 * Los dos márgenes negativos de 5 meten el hilo dentro de las tapas hasta
 * tocar el borde de cada bolita: la tapa mide 20 y la bolita 10.
 */
function Parada({
  que,
  nombre,
  cuando,
  tipo,
  ultima,
}: {
  que: string;
  nombre: string;
  cuando: string;
  tipo: 'salida' | 'media' | 'llegada';
  ultima: boolean;
}) {
  return (
    <View style={estilos.parada}>
      <View style={estilos.columna}>
        {/* La bolita, centrada en una tapa de la altura de la primera línea:
            así cae a la altura del rótulo sin un `marginTop` a ojo. */}
        <View style={estilos.tapa}>
          <View
            style={
              tipo === 'salida'
                ? estilos.puntoLleno
                : tipo === 'llegada'
                  ? estilos.puntoFinal
                  : estilos.puntoMedio
            }
          />
        </View>
        {ultima ? null : <View style={estilos.hilo} />}
      </View>
      <View style={[estilos.textoParada, ultima && { paddingBottom: 0 }]}>
        <Text style={[estilos.paradaQue, tipo === 'salida' && { color: color.rojo600 }]}>
          {que}
        </Text>
        <Text style={estilos.paradaNombre}>{nombre}</Text>
      </View>
      <Text style={estilos.paradaHora}>{cuando}</Text>
    </View>
  );
}

/** El dibujo se elige por el slug, y aquí solo tenemos el nombre escrito. */
function slugDe(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },
  contenido: { paddingHorizontal: espacio.gutter, paddingTop: 18, paddingBottom: 190 },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { ...texto.titular, color: color.ink900, marginTop: 12 },
  subtitulo: {
    fontSize: 14,
    lineHeight: 20.3,
    color: color.campoTexto,
    marginTop: 6,
    fontFamily: familia,
  },

  /** El pliego: una sola superficie, con filetes entre sus partes. */
  pliego: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingHorizontal: 18,
  },
  seccion: { paddingVertical: 18 },
  filete: { height: 1, backgroundColor: color.bordeSutil },

  recorrido: { marginTop: 12 },
  /** `stretch`: la columna de la izquierda tiene que llegar hasta abajo del
      todo para que el hilo alcance la parada siguiente. */
  parada: { flexDirection: 'row', alignItems: 'stretch', gap: 13 },
  columna: { width: 10, alignItems: 'center' },
  textoParada: { flex: 1, minWidth: 0, paddingBottom: 18 },
  /** La altura de la primera línea del rótulo: la bolita se centra en ella. */
  tapa: { height: 20, justifyContent: 'center' },
  puntoLleno: { width: 10, height: 10, borderRadius: radio.pastilla, backgroundColor: color.rojo500 },
  puntoMedio: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.azul500,
  },
  /* Relleno y no aro: el aro en `ink200` sobre blanco casi no se veía, y es
     el punto donde el viaje TERMINA — lo que cierra la línea. */
  puntoFinal: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.ink900,
  },
  hilo: {
    flex: 1,
    width: 1.5,
    backgroundColor: color.rojo300,
    marginTop: -5,
    marginBottom: -5,
  },
  paradaQue: { fontSize: 12.5, lineHeight: 20, color: color.ink600, fontFamily: familia },
  paradaNombre: {
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '500',
    letterSpacing: -0.29,
    color: color.ink900,
    fontFamily: familia,
  },
  paradaHora: { fontSize: 14, lineHeight: 20, color: color.ink600, fontFamily: familia, ...tabular },

  filaCarro: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 12 },
  cuadroCarro: {
    width: 52,
    height: 40,
    borderRadius: radio.control,
    backgroundColor: color.sand100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCarro: {
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '500',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  detalleCarro: {
    fontSize: 13.5,
    lineHeight: 18.85,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },

  condiciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  condicion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand100,
  },
  condicionTexto: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
  },

  repartoEntre: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: interlinea(14),
    color: color.ink700,
    fontFamily: familia,
  },
  /** Las dos partes, una al lado de la otra: se comparan sin restar nada. */
  reparto: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 14,
    borderRadius: radio.control,
    backgroundColor: color.sand100,
    paddingVertical: 14,
  },
  parte: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  parteFilete: { width: 1, backgroundColor: color.bordeSutil },
  parteQuien: { fontSize: 12.5, lineHeight: 17, color: color.ink600, fontFamily: familia },
  parteCifra: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.84,
    color: color.ink900,
    fontFamily: familia,
  },
  porQue: {
    marginTop: 12,
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink600,
    fontFamily: familia,
  },

  comentario: {
    marginTop: 10,
    fontSize: 14.5,
    lineHeight: 21,
    color: color.ink900,
    fontFamily: familia,
  },

  error: {
    fontSize: 13.5,
    lineHeight: 20,
    color: color.rojo700,
    fontFamily: familia,
    marginTop: 12,
  },

  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espacio.gutter,
    paddingTop: 16,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  notaPie: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink600,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: familia,
  },
});

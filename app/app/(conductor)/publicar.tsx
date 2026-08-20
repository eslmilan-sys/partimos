/**
 * `5c` Publicar — una sola pantalla: el carro registrado, las paradas del camino,
 * el aporte calculado, los puestos, las maletas, solo mujeres, y publicar.
 *
 * Aquí vive el modelo entero. Mover el stepper de puestos recalcula el aporte,
 * reescribe el botón y reescribe la cuenta de abajo. La pastilla dice de dónde
 * sale la cifra: calculado, lo pusiste tú, o tope de la ruta.
 */

import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { aporteCalculado, origenDelAporte } from '@/dominio/aporte';
import { LO_QUE_FALTA, quePuedeHacer } from '@/dominio/permiso';
import {
  type PublicacionPreparada,
  type RutaPublicable,
  diaEnPanama,
  prepararPublicacion,
  repartoDelCosto,
  rutasPublicables,
} from '@/servicios/viajes';
import { type EstadoDeCedula, estadoDeCedula } from '@/servicios/seguridad';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { Brillo, CampoRojo } from '@/ui/CampoRojo';
import { type Opcion, HojaDeEleccion } from '@/ui/HojaDeEleccion';
import { Boton, Epigrafe, Interruptor, Pastilla, Stepper } from '@/ui/controles';
import { formatearDinero, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaCorto, hora, mas } from '@/ui/fechas';
import { Atras, Avanza, Carro, Cerrar, Escudo, Mas } from '@/ui/iconos';
import { familia, color, espacio, radio, texto } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';
/**
 * LA RUTA Y LA HORA ERAN DOS CONSTANTES DE ESTE ARCHIVO.
 *
 * `const RUTA = 'panama-chitre'` y una fecha de noviembre de 2026: un
 * conductor solo podía publicar Panamá → Chitré, ese día, a esa hora. Ahora
 * las tres se eligen, y la lista de rutas es la de los corredores abiertos.
 */
const HORAS = Array.from({ length: 19 }, (_, i) => `${String(i + 5).padStart(2, '0')}:00`);

/** Quince días, como en la búsqueda: los viajes se publican con dos o tres de antelación. */
const LOS_PROXIMOS_DIAS = (): Opcion[] =>
  Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dia = diaEnPanama(d);
    return { valor: dia, etiqueta: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : diaCorto(d) };
  });

/** Lo que cuesta desviarse a recoger en cada parada. */
const MINUTOS_POR_PARADA = 5;

export default function Publicar() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [rutas] = useState<RutaPublicable[]>(() => rutasPublicables());
  const [ruta, setRuta] = useState('');
  const [dia, setDia] = useState(() => diaEnPanama(new Date()));
  const [horaSalida, setHoraSalida] = useState('06:00');
  const [eligiendo, setEligiendo] = useState<'ruta' | 'dia' | 'hora' | null>(null);
  const [datos, setDatos] = useState<PublicacionPreparada | null>(null);
  const [cedula, setCedula] = useState<EstadoDeCedula | null>(null);
  const [paradas, setParadas] = useState(2);
  const [puestos, setPuestos] = useState(3);
  const [aporteElegido, setAporteElegido] = useState<number | null>(null);
  const [aceptaMaletas, setAceptaMaletas] = useState(true);
  const [soloMujeres, setSoloMujeres] = useState(false);
  const [aceptaMascotas, setAceptaMascotas] = useState(false);
  const [sePuedeFumar, setSePuedeFumar] = useState(false);

  /** La salida, ya montada: el día que elegiste a la hora que elegiste. */
  const salidaISO = `${dia}T${horaSalida}:00-05:00`;
  useEffect(() => {
    if (!yo) return;
    estadoDeCedula(yo).then(setCedula);
  }, [yo]);


  useEffect(() => {
    if (rutas.length > 0 && !ruta) setRuta(rutas[0].slug);
  }, [rutas, ruta]);

  useEffect(() => {
    if (!yo || !ruta) return;
    prepararPublicacion(yo, ruta, salidaISO)
      .then(setDatos)
      .catch(() => setDatos(null));
  }, [yo, ruta, salidaISO]);

  const calculado = useMemo(
    () => (datos ? aporteCalculado(datos.costoCentavos, puestos, datos.topeCentavos) : 0),
    [datos, puestos],
  );
  const aporte = aporteElegido ?? calculado;
  const cuenta = datos ? repartoDelCosto(datos.costoCentavos, aporte, puestos) : null;

  if (!datos || !cuenta) return <Cargando />;

  /**
   * QUÉ FALTA PARA PODER PUBLICAR — y por qué se enseña al final y no antes.
   *
   * Antes, quien no tenía carro chocaba con una pared —«Primero, tu carro»— y
   * quien no tenía la cédula verificada llegaba hasta el final para que se lo
   * dijeran allí. Las dos son la misma equivocación: pedir los papeles antes
   * de haber enseñado para qué sirven.
   *
   * Ahora la pantalla entera funciona sin nada de eso. Se elige la ruta, la
   * hora, los puestos, y se ve **cuánto se recupera**, que es la única razón
   * por la que alguien registraría un carro. El requisito aparece abajo,
   * cuando ya sabe qué se está perdiendo, con la puerta al lado.
   */
  const { falta } = quePuedeHacer({
    tieneCarroPropio: datos.carroPropio,
    estadoDeCedula: cedula?.estado ?? 'pendiente',
  });
  const queFalta = falta ? LO_QUE_FALTA[falta] : null;

  const laRuta = rutas.find((r) => r.slug === ruta);

  const origen = origenDelAporte(aporteElegido, aporte, datos.topeCentavos);
  const salida = new Date(datos.salida);
  const paradasVisibles = datos.paradasOfrecidas.slice(0, paradas);
  const siguienteParada = datos.paradasOfrecidas[paradas];

  // Cada parada cuesta unos minutos; la llegada se mueve con ellas.
  const llegada = hora(mas(salida, datos.duracionMin + paradas * MINUTOS_POR_PARADA));

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} motivo="palmera" />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {`Publicar · ${diaCorto(salida)}, ${hora(salida)} · ${datos.distanciaKm} km`}
          </Text>
        </View>
        <Text style={estilos.titular} numberOfLines={2}>
          {`${laRuta?.origen ?? datos.origen} → `}
          <Text style={texto.titularFuerte}>{laRuta?.destino ?? datos.destino}</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* La hoja blanca que monta sobre el borde del campo */}
        <View style={estilos.hoja}>
          {/* Ruta, día y hora: las tres estaban escritas a mano en el archivo. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ruta: ${laRuta?.origen} a ${laRuta?.destino}. Cambiar`}
            onPress={() => setEligiendo('ruta')}
            style={estilos.eleccion}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.eleccionEtiqueta}>Ruta</Text>
              <Text style={estilos.eleccionValor} numberOfLines={1}>
                {`${laRuta?.origen ?? ''} → ${laRuta?.destino ?? ''}`}
              </Text>
            </View>
            <Avanza />
          </Pressable>

          <View style={estilos.filaEleccion}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Día: ${diaCorto(salida)}. Cambiar`}
              onPress={() => setEligiendo('dia')}
              style={[estilos.eleccion, estilos.eleccionMitad]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.eleccionEtiqueta}>Día</Text>
                <Text style={estilos.eleccionValor} numberOfLines={1}>
                  {diaCorto(salida)}
                </Text>
              </View>
              <Avanza />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hora: ${horaSalida}. Cambiar`}
              onPress={() => setEligiendo('hora')}
              style={[estilos.eleccion, estilos.eleccionMitad]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.eleccionEtiqueta}>Hora</Text>
                <Text style={[estilos.eleccionValor, tabular]}>{horaSalida}</Text>
              </View>
              <Avanza />
            </Pressable>
          </View>

          <View style={estilos.separadorHoja} />

          <View style={estilos.filaCarro}>
            <Carro />
            <Text style={estilos.textoCarro} numberOfLines={1}>
              {`${datos.carro.model} ${datos.carro.color} · `}
              <Text style={tabular}>{datos.placa}</Text>
              <Text style={estilos.carroApagado}>{` · ${datos.puestosMaximos} puestos`}</Text>
            </Text>
            <Text style={estilos.cambiar}>Cambiar</Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <Epigrafe>Dónde paras en el camino</Epigrafe>
          </View>

          <View style={estilos.recorrido}>
            <View style={estilos.lineaRecorrido} />

            <View style={estilos.parada}>
              <View style={estilos.puntoLleno} />
              <Text style={estilos.paradaNombre}>{datos.origen}</Text>
              <Text style={estilos.paradaHora}>{hora(salida)}</Text>
            </View>

            {paradasVisibles.map((p) => (
              <View key={p.nombre} style={estilos.parada}>
                <View style={estilos.puntoIntermedio} />
                <Text style={estilos.paradaIntermedia}>{p.nombre}</Text>
                <Text style={estilos.paradaHora}>{hora(mas(salida, p.minutos))}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${p.nombre}`}
                  onPress={() => setParadas((n) => Math.max(0, n - 1))}
                  style={estilos.quitar}
                >
                  <View style={estilos.quitarCirculo}>
                    <Cerrar />
                  </View>
                </Pressable>
              </View>
            ))}

            <View style={[estilos.parada, { paddingBottom: 0 }]}>
              <View style={estilos.puntoFinal} />
              <Text style={estilos.paradaNombre}>{datos.destino}</Text>
              <Text style={estilos.paradaHora}>{llegada}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!siguienteParada}
            onPress={() => setParadas((n) => Math.min(datos.paradasOfrecidas.length, n + 1))}
            style={estilos.anadir}
          >
            <Mas tinta={siguienteParada ? color.azul700 : color.ink400} />
            <Text style={[estilos.anadirTexto, !siguienteParada && { color: color.ink500 }]}>
              {siguienteParada ? `Añadir ${siguienteParada.nombre}` : 'No hay más paradas en esta ruta'}
            </Text>
          </Pressable>
        </View>

        {/* El aporte, con el degradado que cierra la tarjeta */}
        <View style={estilos.tarjetaAporte}>
          <Brillo />
          {/* El epígrafe va en su propia línea, no al lado del stepper: en un
              teléfono de 390 le quedaban 180 px y «APORTE POR PUESTO» se
              partía en dos, chocando con los botones de al lado. */}
          <Epigrafe>Aporte por puesto</Epigrafe>
          <View style={estilos.filaAporte}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={estilos.cifraFila}>
                <Text style={[texto.precio, tabular, { color: color.ink900 }]}>
                  {formatearDineroRedondo(aporte)}
                </Text>
                <Pastilla estilo={{ marginBottom: 3 }}>{origen}</Pastilla>
              </View>
            </View>
            <Stepper
              valor={Math.round(aporte / 100)}
              alCambiar={(v) => setAporteElegido(v * 100)}
              min={3}
              max={Math.round(datos.topeCentavos / 100)}
              etiquetaAccesible="Aporte por puesto, en dólares"
            />
          </View>

          <View style={estilos.filaPuestos}>
            <Text style={estilos.textoPuestos}>
              Puestos libres
              <Text style={estilos.carroApagado}>{` · de ${datos.puestosMaximos}`}</Text>
            </Text>
            <Stepper
              valor={puestos}
              alCambiar={(v) => {
                setPuestos(v);
                setAporteElegido(null); // vuelve al calculado, como en el diseño
              }}
              min={1}
              max={datos.puestosMaximos}
              etiquetaAccesible="Puestos libres"
            />
          </View>

          <Text style={estilos.cuenta}>
            {`Gasolina y peajes: ${formatearDinero(cuenta.costoCentavos)}. Con ${puestos} ${
              puestos === 1 ? 'puesto recuperas' : 'puestos recuperas'
            } ${formatearDinero(cuenta.recuperasCentavos)}${
              cuenta.cubreElViaje ? ' y cubres el viaje.' : ` de ${formatearDinero(cuenta.costoCentavos)}.`
            }`}
          </Text>
        </View>

        <View style={estilos.tarjetaInterruptores}>
          <View style={{ paddingVertical: 9 }}>
            <Interruptor
              activo={aceptaMaletas}
              alCambiar={setAceptaMaletas}
              etiqueta="Acepto maletas"
            />
          </View>
          <View style={estilos.interruptorSeparado}>
            <Interruptor activo={soloMujeres} alCambiar={setSoloMujeres} etiqueta="Solo mujeres" />
          </View>
          {/* Las dos condiciones del carro que todo el mundo pregunta antes de
              subirse. Por defecto no se fuma y no van mascotas, que es lo que
              se espera si nadie dijo nada. */}
          <View style={estilos.interruptorSeparado}>
            <Interruptor
              activo={aceptaMascotas}
              alCambiar={setAceptaMascotas}
              etiqueta="Acepto mascotas"
            />
          </View>
          <View style={estilos.interruptorSeparado}>
            <Interruptor activo={sePuedeFumar} alCambiar={setSePuedeFumar} etiqueta="Se puede fumar" />
          </View>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        {queFalta ? (
          <View style={estilos.falta}>
            <View style={estilos.filaFalta}>
              <View style={estilos.cuadroFalta}>
                <Escudo tamano={17} tinta={color.rojo600} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.faltaTitulo}>{queFalta.titulo}</Text>
                <Text style={estilos.faltaTexto}>{queFalta.texto}</Text>
              </View>
            </View>
            <Boton tono="azul" tamano="md" alPulsar={() => router.push(queFalta.ruta as never)}>
              {queFalta.boton}
            </Boton>
          </View>
        ) : null}
        <Boton
          tono="azul"
          desactivado={!!queFalta}
          alPulsar={() =>
            router.push({
              pathname: '/(conductor)/repaso',
              params: {
                ruta,
                salida: salidaISO,
                paradas: String(paradas),
                puestos: String(puestos),
                aporte: aporteElegido == null ? '' : String(aporteElegido),
                maletas: aceptaMaletas ? '1' : '',
                mujeres: soloMujeres ? '1' : '',
                mascotas: aceptaMascotas ? '1' : '',
                fumar: sePuedeFumar ? '1' : '',
              },
            })
          }
        >
          Repasar y publicar
        </Boton>
        <Text style={estilos.notaPie}>
          {queFalta
            ? 'Puedes seguir calculando: nada de esto se publica.'
            : 'Nada se publica todavía: lo lees entero antes, en una pantalla.'}
        </Text>
      </View>

      <HojaDeEleccion
        abierta={eligiendo === 'ruta'}
        titulo="A dónde vas"
        opciones={rutas.map((r) => ({
          valor: r.slug,
          etiqueta: `${r.origen} → ${r.destino}`,
          debajo: `${r.distanciaKm} km`,
        }))}
        elegido={ruta}
        alElegir={(v) => {
          setRuta(v);
          setAporteElegido(null);
          setParadas(0);
          setEligiendo(null);
        }}
        alCerrar={() => setEligiendo(null)}
      />
      <HojaDeEleccion
        abierta={eligiendo === 'dia'}
        titulo="Qué día sales"
        opciones={LOS_PROXIMOS_DIAS()}
        elegido={dia}
        alElegir={(v) => {
          setDia(v);
          setEligiendo(null);
        }}
        alCerrar={() => setEligiendo(null)}
      />
      <HojaDeEleccion
        abierta={eligiendo === 'hora'}
        titulo="A qué hora sales"
        opciones={HORAS.map((h) => ({ valor: h, etiqueta: h }))}
        elegido={horaSalida}
        alElegir={(v) => {
          setHoraSalida(v);
          setEligiendo(null);
        }}
        alCerrar={() => setEligiendo(null)}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto, flex: 1 },
  titular: { ...texto.titular, color: '#fff', marginTop: 12 },

  hoja: {
    marginHorizontal: espacio.gutter,
    marginTop: 18,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  eleccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 58,
    paddingHorizontal: 14,
    borderRadius: radio.control,
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
  },
  eleccionMitad: { flex: 1, minWidth: 0 },
  filaEleccion: { flexDirection: 'row', gap: 9, marginTop: 9 },
  eleccionEtiqueta: { fontSize: 11.5, lineHeight: 16, color: color.ink500, fontFamily: familia },
  eleccionValor: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.23,
    color: color.ink900,
    fontFamily: familia,
  },
  separadorHoja: { height: 1, backgroundColor: color.bordeSutil, marginVertical: 16 },

  filaCarro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.bordeSutil,
  },
  textoCarro: { flex: 1, ...texto.fila, color: color.ink900 },
  carroApagado: { fontWeight: '400', color: color.ink500, fontFamily: familia },
  cambiar: { fontSize: 12.5, lineHeight: 18.12, fontWeight: '600', color: color.azul700, fontFamily: familia },

  recorrido: { marginTop: 10, position: 'relative' },
  lineaRecorrido: {
    position: 'absolute',
    left: 4.25,
    top: 8,
    bottom: 8,
    width: 1.5,
    backgroundColor: color.rojo300,
  },
  parada: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingBottom: 7 },
  puntoLleno: { width: 10, height: 10, borderRadius: radio.pastilla, backgroundColor: color.rojo500 },
  puntoIntermedio: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.azul500,
  },
  puntoFinal: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  paradaNombre: { flex: 1, fontSize: 14, lineHeight: 20.3, fontWeight: '500', letterSpacing: -0.21, color: color.ink900, fontFamily: familia },
  paradaIntermedia: { flex: 1, fontSize: 14, lineHeight: 20.3, letterSpacing: -0.21, color: color.ink900, fontFamily: familia },
  paradaHora: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, ...tabular, fontFamily: familia },
  /* 40 de toque con el círculo de 22 dentro: quitar una parada por error es
     peor que fallar el toque, pero fallarlo tres veces también molesta. */
  quitar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitarCirculo: {
    width: 22,
    height: 22,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  anadir: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: espacio.tap,
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  anadirTexto: { fontSize: 13.5, lineHeight: 19.57, fontWeight: '600', color: color.azul700, fontFamily: familia },

  tarjetaAporte: {
    marginHorizontal: espacio.gutter,
    marginTop: 8,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: color.blanco,
    overflow: 'hidden',
  },
  filaAporte: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  cifraFila: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  filaPuestos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  textoPuestos: { flex: 1, ...texto.fila, color: color.ink900 },
  cuenta: { fontSize: 12.5, lineHeight: 18.125, color: color.ink700, marginTop: 10, fontFamily: familia },

  tarjetaInterruptores: {
    marginHorizontal: espacio.gutter,
    marginTop: 8,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
  },
  interruptorSeparado: {
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },

  pie: {
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  falta: {
    gap: 14,
    padding: 16,
    marginBottom: 12,
    borderRadius: radio.l,
    backgroundColor: color.rojo50,
    borderWidth: 1,
    borderColor: color.rojo100,
  },
  filaFalta: { flexDirection: 'row', gap: 12 },
  cuadroFalta: {
    width: 34,
    height: 34,
    borderRadius: radio.control,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faltaTitulo: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.22,
    color: color.rojo700,
    fontFamily: familia,
  },
  faltaTexto: { fontSize: 13, lineHeight: 19.5, color: color.ink700, marginTop: 3, fontFamily: familia },
  notaPie: { textAlign: 'center', fontSize: 12.5, lineHeight: 18.125, color: color.ink500, marginTop: 10, fontFamily: familia },
});

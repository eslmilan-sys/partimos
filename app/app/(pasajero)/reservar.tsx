/**
 * `7a` Reserva — tu punto y tu equipaje.
 *
 * El formulario se adapta al booleano del conductor: si acepta maletas aparece
 * el stepper de maleta junto al de mochila; si no, solo mochila y la línea lo
 * dice con su nombre. La mochila siempre viaja y nunca cuenta.
 *
 * Pedir puesto no cobra nada: el cobro es cuando el conductor acepta (`11a`).
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import {
  type ClaseDeEquipaje,
  type Equipaje,
  CLASES,
  COMO_LO_DICE,
  SIN_EQUIPAJE,
  TOPE_POR_CLASE,
  aFilas,
  cambiar,
  cuantasPiezas,
  decideElMaletero,
} from '@/dominio/equipaje';
import { desvioDeRecogida, enKilometros } from '@/dominio/desvio';
import type { Lugar } from '@/dominio/lugar';
import { type ReservaPreparada, pedirPuesto, prepararReserva } from '@/servicios/reservas';
import { useMiId } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { NoEsta } from '@/ui/NoEsta';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe, Interruptor, Pastilla, Stepper } from '@/ui/controles';
import { BuscadorDeLugar } from '@/ui/BuscadorDeLugar';
import { formatearDinero, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaCorto, hora } from '@/ui/fechas';
import { Atras, Lupa, Maleta } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio, pulsado, zonaDeToque } from '@/ui/tokens';

const VIAJE_DEL_RECORRIDO = '55555555-5555-4555-8555-555555555555';
/** Sin sesión que preguntar —solo en simulado—. En producción la pide `1c`. */
const YO_DEL_RECORRIDO = '22222222-2222-4222-8222-222222222222';

export default function Reservar() {
  const router = useRouter();
  const volver = useVolver();
  // `/viaje/[id]` en cuanto exista el descubrimiento; hoy, el del simulado.
  const { viaje, pasajeros } = useLocalSearchParams<{ viaje?: string; pasajeros?: string }>();
  const viajeId = viaje ?? VIAJE_DEL_RECORRIDO;
  // Aquí no se manda a entrar: pedir puesto es justo donde el traspaso pide
  // la cuenta, y esa puerta es `1c`, que vuelve a esta pantalla con el viaje.
  const yo = useMiId(YO_DEL_RECORRIDO);
  const [datos, setDatos] = useState<ReservaPreparada | null>(null);
  /**
   * CUÁNTOS PUESTOS PIDES.
   *
   * Arranca en los que venías buscando (28-08-2026, visto por el dueño):
   * buscabas «2 pasajeros», la lista te enseñaba sólo los viajes con dos
   * sitios libres, entrabas… y salía una reserva de UN puesto. La otra
   * persona se quedaba fuera y nada lo decía. El número viajaba en la
   * búsqueda y se perdía al entrar en la ficha.
   */
  const [puestos, setPuestos] = useState(() =>
    Math.min(4, Math.max(1, Number(pasajeros) || 1)),
  );
  /* «Todavía no lo sé» y «no está» no son lo mismo: lo segundo dura para
     siempre, y en blanco no hay ni por dónde salir. */
  const [noEsta, setNoEsta] = useState(false);
  /**
   * **EL PUNTO PROPIO ARRANCA VACÍO** (01-09-2026, pedido del dueño: «de base
   * je dois aller au point d'où il part; puis en bas, option»). Estaba escrito
   * a mano —«Vía Argentina, Riba Smith»— así que todo el mundo abría esta
   * pantalla con una dirección puesta que no era la suya, en el renglón que
   * otra persona lee para saber dónde plantarse a las cinco de la mañana. Lo
   * normal es ir a donde sale el carro; pedir otro sitio es una opción.
   */
  const [direccion, setDireccion] = useState('');
  /** Una pregunta, no dos contadores: ¿llevas maleta? La mochila va
      contigo siempre y no se cuenta (pedido el 25-08). */
  /* El pasajero DICE lo que lleva; el conductor decide cuando le llegue la
     solicitud. Antes el viaje traía un booleano y esta pantalla se adaptaba
     a él — decidido en abstracto meses antes. Cambiado el 25-08-2026. */
  const [equipaje, setEquipaje] = useState<Equipaje>(SIN_EQUIPAJE);
  /** El punto elegido del buscador — con sus coordenadas si las trajo. */
  const [buscandoPunto, setBuscandoPunto] = useState(false);
  const [puntoElegido, setPuntoElegido] = useState<Lugar | null>(null);
  const [pidiendo, setPidiendo] = useState(false);

  useEffect(() => {
    prepararReserva(viajeId)
      .then((d) => {
        setDatos(d);
        /* Los que quedan mandan sobre los que traías: se puede llegar aquí
           con un enlace viejo de cuando había sitio para tres. */
        setPuestos((n) => Math.max(1, Math.min(n, d.puestosLibres || 1)));
      })
      .catch(() => setNoEsta(true));
  }, [viajeId]);

  if (noEsta) return <NoEsta />;
  if (!datos) return <Cargando />;

  /**
   * LO QUE CUESTA IR A BUSCARTE. Nulo mientras no hayas pedido otro punto —
   * que es el caso normal— y nulo también si no sabemos dónde cae uno de los
   * dos: entonces la pantalla no promete ningún número. Ver `dominio/desvio`.
   */
  const desvio =
    puntoElegido?.lat != null &&
    puntoElegido?.lng != null &&
    datos.origen.lat != null &&
    datos.origen.lng != null &&
    datos.destinoPunto &&
    datos.distanciaKm > 0
      ? desvioDeRecogida(
          { lat: datos.origen.lat, lng: datos.origen.lng },
          { lat: puntoElegido.lat, lng: puntoElegido.lng },
          datos.destinoPunto,
          datos.distanciaKm,
          datos.consumoL100km,
        )
      : null;

  // Si el conductor no lleva maletas, no hay maleta que contar.


  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 18 }}
        showsVerticalScrollIndicator={false}
      >

      <CampoRojo altura={214} />


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
            {`${datos.destino} · ${diaCorto(datos.salida)}, ${hora(datos.salida)}`}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'Tu punto y tu '}
          <Text style={estilos.titularFuerte}>equipaje</Text>
        </Text>
      </View>

        <View style={estilos.hoja}>
          <Epigrafe>Dónde te recogen</Epigrafe>

          {/* **POR DEFECTO, DONDE SALE EL CARRO.** El raíl dibujaba siempre
              dos puntos —el suyo y «Tu punto · +4 min»— aunque nadie hubiera
              pedido ningún desvío, y los cuatro minutos eran una constante del
              código. Sin punto propio hay UN sitio, y es el suyo. */}
          <View style={estilos.recorrido}>
            {desvio ? <View style={estilos.lineaRecorrido} /> : null}

            <View style={[estilos.parada, !desvio && { paddingBottom: 0 }]}>
              <View style={estilos.puntoLleno} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.paradaNombre}>{datos.origen.etiqueta}</Text>
                {!desvio ? (
                  <Text style={estilos.paradaPie}>
                    {`Es de donde sale ${datos.conductor}. Llegas ahí y listo.`}
                  </Text>
                ) : null}
              </View>
              <Text style={estilos.paradaHora}>{hora(datos.origen.hora)}</Text>
            </View>

            {desvio ? (
              <View style={[estilos.parada, { paddingBottom: 0 }]}>
                <View style={estilos.puntoTuyo} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[estilos.paradaNombre, { color: color.azul700 }]} numberOfLines={1}>
                    {direccion}
                  </Text>
                  <Text style={estilos.paradaPie}>
                    {`${datos.conductor} lo aprueba junto con el puesto.`}
                  </Text>
                </View>
                <Text style={estilos.paradaHora}>{`+${desvio.minutos} min`}</Text>
              </View>
            ) : null}
          </View>

          {/* LA OPCIÓN, ABAJO Y EN VOZ BAJA. Con un punto puesto se convierte
              en la cuenta de lo que ese punto cuesta, más la salida para
              quitarlo. */}
          {desvio ? (
            <View style={estilos.cajaDesvio}>
              <Text style={[estilos.desvioCuenta, tabular]}>
                {/* **KILÓMETROS, NO UN RECARGO.** `PRODUCT.md` es explícito:
                    un servicio de recogida tarifado es transporte comercial.
                    Aquí el viaje se ALARGA, y la gasolina de lo que se alarga
                    la pone quien pidió el desvío — misma fórmula, ni un
                    centavo más. Ver `dominio/desvio`. */}
                {`Tu punto alarga el viaje ${enKilometros(desvio.km)}. La gasolina de esos kilómetros la pones tú: ${formatearDinero(desvio.costoCentavos)}.`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar mi punto y salir desde donde sale el carro"
                onPress={() => {
                  setPuntoElegido(null);
                  setDireccion('');
                }}
                style={[{ alignSelf: 'flex-start', paddingVertical: 6 }, zonaDeToque]}
              >
                <Text style={estilos.quitarPunto}>Mejor voy a su punto</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pedir que me recoja en otro punto"
              onPress={() => setBuscandoPunto(true)}
              style={({ pressed }) => [
                estilos.campoPunto,
                pressed && { backgroundColor: color.lavadoChip },
              ]}
            >
              <Lupa tamano={16} tinta={color.ink400} grueso={2} />
              <Text style={estilos.campoPuntoTexto} numberOfLines={1}>
                Pedir otro punto de recogida
              </Text>
            </Pressable>
          )}

          {/* Cuando el desvío se pasa del garde-fou, se dice aquí y no se
              deja pedir: quince minutos de vuelta ya no es llevar a alguien
              de camino. */}
          {puntoElegido && desvio && !desvio.cabe ? (
            <Text style={estilos.desvioLargo}>
              {`Ese punto le añade ${desvio.minutos} minutos a ${datos.conductor}: demasiado para un viaje compartido. Elige otro más cerca de su ruta.`}
            </Text>
          ) : null}

          {puntoElegido && !desvio ? (
            <Text style={estilos.ayudaPunto}>
              {`No podemos medir cuánto se desvía. ${datos.conductor} lo aprueba junto con el puesto.`}
            </Text>
          ) : null}
        </View>

        {/* **CUÁNTOS PUESTOS**, con el mismo ± que el equipaje y que
            `publicar`. Va antes del equipaje porque decide el total, y el
            total es lo que se mira antes de pedir. */}
        <View style={estilos.tarjetaEquipaje}>
          <Epigrafe>Cuántos vamos</Epigrafe>
          <View style={[estilos.clase, { paddingTop: 10 }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.claseTitulo}>
                {puestos === 1 ? 'Un puesto' : `${puestos} puestos`}
              </Text>
              <Text style={estilos.claseDetalle}>
                {datos.puestosLibres <= 1
                  ? 'Es el único que queda en este carro'
                  : `Quedan ${datos.puestosLibres} en este carro`}
              </Text>
            </View>
            <Stepper
              valor={puestos}
              alCambiar={setPuestos}
              min={1}
              max={datos.puestosLibres}
              etiquetaAccesible="Cuántos puestos pido"
            />
          </View>
        </View>

        <View style={estilos.tarjetaEquipaje}>
          <Epigrafe>Qué llevo</Epigrafe>

          {/* **Se cuenta** (27-08-2026, pedido del dueño). Antes eran tres
              opciones sueltas —nada, un bolso, una maleta— con el argumento de
              que contar era una contabilidad de maletero. El argumento no veía
              lo que sí cambia la respuesta: dos maletas no son una, y una de
              cabina no es un baúl entero. El número ES el dato.

              Un contador por clase, con el mismo control de ±  que ya usa
              `publicar` para los puestos, y tope de tres: por encima de eso no
              es equipaje de pasajero, es una mudanza. */}
          <View style={estilos.clases}>
            {CLASES.map((cual: ClaseDeEquipaje, i: number) => (
              <View key={cual} style={[estilos.clase, i > 0 && estilos.claseConLinea]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.claseTitulo}>{COMO_LO_DICE[cual].titulo}</Text>
                  <Text style={estilos.claseDetalle}>{COMO_LO_DICE[cual].detalle}</Text>
                </View>
                <Stepper
                  valor={equipaje[cual]}
                  alCambiar={(n) => setEquipaje(cambiar(equipaje, cual, n - equipaje[cual]))}
                  min={0}
                  max={TOPE_POR_CLASE}
                  etiquetaAccesible={`Cuántos ${COMO_LO_DICE[cual].titulo.toLowerCase()} llevo`}
                />
              </View>
            ))}
          </View>

          <View style={estilos.nota}>
            <Maleta tamano={14} />
            <Text style={estilos.notaTexto}>
              {decideElMaletero(equipaje)
                ? `${datos.conductor} ve lo que llevas en la solicitud y decide si le cabe en el maletero.`
                : cuantasPiezas(equipaje) > 0
                  ? `${datos.conductor} lo ve en la solicitud. Un bolso va contigo y nunca estorba.`
                  : `Puedes dejarlo en cero: ${datos.conductor} lo ve igual en la solicitud.`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <BuscadorDeLugar
        abierto={buscandoPunto}
        titulo="Tu punto de recogida"
        alElegir={(l: Lugar) => {
          setPuntoElegido(l);
          setDireccion(l.nombre);
          setBuscandoPunto(false);
        }}
        alCerrar={() => setBuscandoPunto(false)}
      />

      <View style={estilos.pie}>
        {/* «8 $ por plaza» era de antes del sistema: el dinero se escribe
            B/8 —un solo sitio formatea (ui/dinero)— y aquí nadie dice
            «plaza»: es un puesto, como en todas las demás pantallas. */}
        {/* El TOTAL, y debajo de dónde sale. Con dos puestos el pie decía
            «B/6 por puesto» y quien pedía dos veía el precio de uno. */}
        {/* **EL DESVÍO ENTRA EN EL TOTAL**, y una sola vez: los kilómetros
            de ir a buscarte no dependen de cuántos puestos pidas. Es la misma
            fórmula de siempre sobre una distancia mayor — no un recargo por
            un servicio. Ver `dominio/desvio`. */}
        <View style={estilos.filaPrecio}>
          <Text style={[estilos.precio, tabular]}>
            {formatearDineroRedondo(datos.aporteCentavos * puestos + (desvio?.costoCentavos ?? 0))}
          </Text>
          <Pastilla estilo={{ marginBottom: 6 }}>
            {puestos === 1
              ? 'por puesto'
              : `${puestos} × ${formatearDineroRedondo(datos.aporteCentavos)}`}
          </Pastilla>
        </View>
        {desvio && desvio.cabe ? (
          <Text style={[estilos.notaPie, { marginTop: -2, marginBottom: 8 }]}>
            {`${formatearDineroRedondo(datos.aporteCentavos * puestos)} del viaje + ${formatearDinero(desvio.costoCentavos)} de los ${enKilometros(desvio.km)} que se desvía.`}
          </Text>
        ) : null}

        <Boton
         
          /* Un desvío que no cabe no se pide: el botón se apaga y la caja de
             arriba dice por qué. */
          desactivado={pidiendo || (!!desvio && !desvio.cabe)}
          alPulsar={async () => {
            if (!yo) {
              router.push({ pathname: '/(cuenta)/puerta', params: { viaje: viajeId } });
              return;
            }
            setPidiendo(true);
            try {
              const puesto = await pedirPuesto(
                viajeId,
                /* Sin punto propio no se propone ninguno: `proposed_point`
                   queda nulo y quien maneja recoge donde dijo que sale. Antes
                   se mandaba siempre la dirección que el código traía escrita
                   a mano, así que TODAS las reservas nacían pidiendo un
                   desvío que nadie había pedido. */
                direccion ? { direccionPropia: direccion } : { paradaId: '' },
                equipaje,
                { pasajeroId: yo, puestos },
              );
              // `7b` cobra sobre una reserva concreta: sin este identificador el
              // botón «Confirmar y pagar» no tenía nada que confirmar.
              router.push({
                pathname: '/(pasajero)/aportar',
                params: { viaje: viajeId, reserva: puesto.id },
              });
            } finally {
              setPidiendo(false);
            }
          }}
        >
          Pedir puesto
        </Boton>
        <Text style={estilos.notaPie}>{`No se cobra hasta que ${datos.conductor} acepte.`}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  campoPunto: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    backgroundColor: color.blanco,
  },
  campoPuntoTexto: {
    flex: 1,
    minWidth: 0,
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  ayudaPunto: {
    marginTop: 8,
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink500,
    fontFamily: familia,
  },
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    fontSize: 11.5, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    flex: 1,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 12, },
  titularFuerte: { fontWeight: '600' },

  hoja: {
    marginHorizontal: espacio.gutter,
    marginTop: 24,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    padding: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  recorrido: { marginTop: 12, position: 'relative' },
  lineaRecorrido: {
    position: 'absolute',
    left: 4.25,
    top: 9,
    bottom: 9,
    width: 1.5,
    backgroundColor: color.rojo300,
  },
  parada: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingBottom: 12 },
  puntoLleno: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    marginTop: 5,
  },
  puntoTuyo: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.azul500,
    marginTop: 5,
  },
  paradaNombre: {
    flex: 1,
    fontSize: 15.5, lineHeight: 22.47,
    fontWeight: '500',
    letterSpacing: -0.28,
    color: color.ink900,
    fontFamily: familia,
  },
  paradaHora: { fontSize: 13.5, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },
  /** El renglón de debajo de cada punto: qué es, o quién lo aprueba. */
  paradaPie: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink600,
    fontFamily: familia,
    marginTop: 2,
  },
  /** La cuenta del desvío: azul, informa; el rojo tiene sus cuatro sentidos. */
  cajaDesvio: {
    marginTop: 12,
    padding: 13,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.azul200,
    backgroundColor: color.azul50,
  },
  desvioCuenta: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink700,
    fontFamily: familia,
  },
  quitarPunto: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },
  desvioLargo: {
    marginTop: 10,
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.rojo700,
    fontFamily: familia,
  },

  /** Una fila por clase, separadas por un pelo: es una lista, no tarjetas. */
  clases: { marginTop: 8 },
  clase: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  claseConLinea: { borderTopWidth: 1, borderTopColor: color.bordeSutil },
  claseTitulo: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  claseDetalle: {
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 17,
    color: color.ink600,
    fontFamily: familia,
  },

  tarjetaEquipaje: {
    marginHorizontal: espacio.gutter,
    marginTop: 6,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 14,
  },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  etiquetaStepper: {
    flex: 1,
    fontSize: 14, lineHeight: 21.02,
    fontWeight: '500',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
  etiquetaApagada: { fontWeight: '400', color: color.ink600 },
  nota: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  notaTexto: { flex: 1, fontSize: 12.5, lineHeight: 18.125, color: color.ink500, fontFamily: familia },

  pie: {
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaPrecio: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginBottom: 12 },
  precio: {
    fontSize: 33,
    fontWeight: '700',
    letterSpacing: -1.44,
    lineHeight: 28.8,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  notaPie: { textAlign: 'center', fontSize: 12.5, lineHeight: 18.12, color: color.ink600, marginTop: 10, fontFamily: familia },
});

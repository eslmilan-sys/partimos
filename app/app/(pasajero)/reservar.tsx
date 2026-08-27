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
import type { Lugar } from '@/dominio/lugar';
import { type ReservaPreparada, pedirPuesto, prepararReserva } from '@/servicios/reservas';
import { useMiId } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { NoEsta } from '@/ui/NoEsta';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe, Interruptor, Pastilla } from '@/ui/controles';
import { BuscadorDeLugar } from '@/ui/BuscadorDeLugar';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaCorto, hora } from '@/ui/fechas';
import { Atras, Lupa, Maleta } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio, pulsado } from '@/ui/tokens';

const VIAJE_DEL_RECORRIDO = '55555555-5555-4555-8555-555555555555';
/** Sin sesión que preguntar —solo en simulado—. En producción la pide `1c`. */
const YO_DEL_RECORRIDO = '22222222-2222-4222-8222-222222222222';

export default function Reservar() {
  const router = useRouter();
  const volver = useVolver();
  // `/viaje/[id]` en cuanto exista el descubrimiento; hoy, el del simulado.
  const { viaje } = useLocalSearchParams<{ viaje?: string }>();
  const viajeId = viaje ?? VIAJE_DEL_RECORRIDO;
  // Aquí no se manda a entrar: pedir puesto es justo donde el traspaso pide
  // la cuenta, y esa puerta es `1c`, que vuelve a esta pantalla con el viaje.
  const yo = useMiId(YO_DEL_RECORRIDO);
  const [datos, setDatos] = useState<ReservaPreparada | null>(null);
  /* «Todavía no lo sé» y «no está» no son lo mismo: lo segundo dura para
     siempre, y en blanco no hay ni por dónde salir. */
  const [noEsta, setNoEsta] = useState(false);
  const [direccion, setDireccion] = useState('Vía Argentina, Riba Smith');
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
    prepararReserva(viajeId).then(setDatos).catch(() => setNoEsta(true));
  }, [viajeId]);

  if (noEsta) return <NoEsta />;
  if (!datos) return <Cargando />;

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

          <View style={estilos.recorrido}>
            <View style={estilos.lineaRecorrido} />

            <View style={estilos.parada}>
              <View style={estilos.puntoLleno} />
              <Text style={estilos.paradaNombre}>{datos.origen.etiqueta}</Text>
              <Text style={estilos.paradaHora}>{hora(datos.origen.hora)}</Text>
            </View>

            <View style={[estilos.parada, { paddingBottom: 0 }]}>
              <View style={estilos.puntoTuyo} />
              <Text style={[estilos.paradaNombre, { color: color.azul700 }]}>Tu punto</Text>
              <Text style={estilos.paradaHora}>{`+${datos.minutosDeDesvio} min`}</Text>
            </View>
          </View>

          {/* El campo ABRE EL BUSCADOR — el mismo motor de publicar, con el
              catálogo entero («ph metric» encuentra el PH). Antes era un
              campo suelto: se tecleaba y nada se proponía (visto en el
              teléfono, 25-08).

              Y desde el 26-08 lo tecleado YA NO VALE por sí solo: el punto
              se elige de la lista o no se elige. Aquí es donde más importa —
              esta línea es la que otra persona lee para saber dónde
              plantarse a las cinco de la mañana. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Elegir tu punto de recogida"
            onPress={() => setBuscandoPunto(true)}
            style={({ pressed }) => [estilos.campoPunto, pressed && { backgroundColor: color.lavadoChip }]}
          >
            <Lupa tamano={16} tinta={color.ink400} grueso={2} />
            <Text
              style={[estilos.campoPuntoTexto, !direccion && { color: color.ink400 }]}
              numberOfLines={1}
            >
              {direccion || 'Busca tu punto de recogida'}
            </Text>
          </Pressable>
          <Text style={estilos.ayudaPunto}>{`${datos.conductor} lo aprueba junto con el puesto.`}</Text>
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
                <View style={estilos.contador}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${COMO_LO_DICE[cual].uno}`}
                    disabled={equipaje[cual] === 0}
                    onPress={() => setEquipaje(cambiar(equipaje, cual, -1))}
                    style={({ pressed }) => [
                      estilos.paso,
                      equipaje[cual] === 0 && estilos.pasoApagado,
                      pressed && equipaje[cual] > 0 ? pulsado.celda : null,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.pasoSigno,
                        equipaje[cual] === 0 && estilos.pasoSignoApagado,
                      ]}
                    >
                      −
                    </Text>
                  </Pressable>
                  <Text style={estilos.cifra}>{equipaje[cual]}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Añadir ${COMO_LO_DICE[cual].uno}`}
                    disabled={equipaje[cual] === TOPE_POR_CLASE}
                    onPress={() => setEquipaje(cambiar(equipaje, cual, +1))}
                    style={({ pressed }) => [
                      estilos.paso,
                      equipaje[cual] === TOPE_POR_CLASE && estilos.pasoApagado,
                      pressed && equipaje[cual] < TOPE_POR_CLASE ? pulsado.celda : null,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.pasoSigno,
                        equipaje[cual] === TOPE_POR_CLASE && estilos.pasoSignoApagado,
                      ]}
                    >
                      +
                    </Text>
                  </Pressable>
                </View>
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
        <View style={estilos.filaPrecio}>
          <Text style={[estilos.precio, tabular]}>{formatearDineroRedondo(datos.aporteCentavos)}</Text>
          <Pastilla estilo={{ marginBottom: 6 }}>por puesto</Pastilla>
        </View>

        <Boton
         
          desactivado={pidiendo}
          alPulsar={async () => {
            if (!yo) {
              router.push({ pathname: '/(cuenta)/puerta', params: { viaje: viajeId } });
              return;
            }
            setPidiendo(true);
            try {
              const puesto = await pedirPuesto(
                viajeId,
                { direccionPropia: direccion },
                equipaje,
                { pasajeroId: yo },
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
    color: color.ink600,
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
  paradaHora: { fontSize: 13.5, lineHeight: 18.85, color: color.ink500, fontFamily: familia, ...tabular },

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
    color: color.ink500,
    fontFamily: familia,
  },
  /** El mismo control de ± que usa `publicar` para los puestos. */
  contador: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  paso: {
    width: 34,
    height: 34,
    borderRadius: radio.icono,
    backgroundColor: color.lavado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Apagado sigue OPACO: lo que se apaga es el signo, no la superficie. */
  pasoApagado: { backgroundColor: color.inerteFondo },
  pasoSigno: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  pasoSignoApagado: { color: color.inerteTinta },
  cifra: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
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
  etiquetaApagada: { fontWeight: '400', color: color.ink500 },
  nota: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  notaTexto: { flex: 1, fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },

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
  notaPie: { textAlign: 'center', fontSize: 12.5, lineHeight: 18.12, color: color.ink500, marginTop: 10, fontFamily: familia },
});

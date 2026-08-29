/**
 * EL PUNTO DE RECOGIDA — sólo texto, y muy claro.
 *
 * Pedido por el dueño el 28-08-2026. Antes, «Ver el punto de recogida» abría
 * `ya-mapa`: un mapa DIBUJADO —no hay proveedor de mapas contratado— con
 * pastillas de carros encima, la barra de pestañas cayendo en mitad de la
 * página y ni una palabra del punto que se venía a mirar. Enseñaba un mapa
 * falso en el momento en que alguien está en la calle buscando un carro.
 *
 * Lo que hace falta ahí no es un mapa: es **dónde, a qué hora y con quién**,
 * en letra grande y sin nada más. Un mapa de verdad, el día que exista, se
 * añade DEBAJO de esto; no lo sustituye.
 *
 * Cada dato lleva su icono al trazo —los del sistema, 1,9 px— porque en la
 * calle se lee de un vistazo y el icono es lo que deja saltar al que buscas.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { type PuestoMio, misViajes } from '@/servicios/panel';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { NoEsta } from '@/ui/NoEsta';
import { Epigrafe } from '@/ui/controles';
import { diaLargo, hora } from '@/ui/fechas';
import { Atras, Carro, Chat, PinLleno, Calendario, Persona } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, pulsado, radio } from '@/ui/tokens';

/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, la reserva de
 *  Daniela, que es quien encarna esta pantalla y la única cuyo puesto sale de
 *  `misViajes(yo)`. Con la de otra persona la pantalla decía «no encontramos
 *  ese puesto», que es correcto y no enseña nada. */
const DEL_RECORRIDO = '77777777-7777-4777-8777-777777777700';
/** Sin sesión que preguntar —solo en simulado—, la pasajera del traspaso. */
const YO_DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

export default function PuntoDeRecogida() {
  const router = useRouter();
  const volver = useVolver();
  const { reserva } = useLocalSearchParams<{ reserva?: string }>();
  const reservaId = reserva ?? DEL_RECORRIDO;
  const yo = useMiIdOEntrar(YO_DEL_RECORRIDO);
  const [puesto, setPuesto] = useState<PuestoMio | null | undefined>(undefined);

  useEffect(() => {
    if (!yo) return;
    misViajes(yo)
      .then(({ proximos, pasados }) =>
        setPuesto([...proximos, ...pasados].find((p) => p.reservaId === reservaId) ?? null),
      )
      .catch(() => setPuesto(null));
  }, [yo, reservaId]);

  if (puesto === null) {
    return (
      <NoEsta
        titulo="No encontramos ese puesto"
        explicacion="Puede que la reserva se cancelara, o que el enlace sea de otra persona."
      />
    );
  }
  if (puesto === undefined) return <Cargando />;

  /* El sitio exacto si lo hay; si no, la ciudad. Nunca los dos pegados: en la
     calle lo que se busca es el sitio, y la ciudad ya se sabe. */
  const sitio = puesto.punto || puesto.origenSitio || puesto.origen;
  const carro = puesto.carro;

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atrás"
          onPress={() => volver()}
          style={estilos.circulo}
        >
          <Atras />
        </Pressable>
        <Text style={estilos.epigrafeCampo} numberOfLines={1}>
          {`${puesto.origen} → ${puesto.destino}`}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* LO PRIMERO Y LO MÁS GRANDE: dónde. Todo lo demás es contexto. */}
        <Epigrafe>Dónde te recogen</Epigrafe>
        <Text style={estilos.sitio}>{sitio}</Text>
        {sitio !== puesto.origen ? <Text style={estilos.ciudad}>{puesto.origen}</Text> : null}

        <View style={estilos.datos}>
          <Dato icono={<Calendario tamano={20} tinta={color.ink500} />} rotulo="Cuándo">
            {`${diaLargo(puesto.cuando)}, ${hora(puesto.cuando)}`}
          </Dato>

          <Dato icono={<Persona tamano={20} tinta={color.ink500} />} rotulo="Quién maneja">
            {puesto.conductor}
          </Dato>

          {carro ? (
            <Dato icono={<Carro tamano={20} tinta={color.ink500} />} rotulo="Qué carro">
              {[carro.modelo, carro.color].filter(Boolean).join(' ')}
              {carro.placa ? `\nPlaca ${carro.placa}` : ''}
            </Dato>
          ) : null}
        </View>

        {/* La regla, dicha donde se necesita: el punto no lo pone la app. */}
        <View style={estilos.nota}>
          <PinLleno tamano={17} tinta={color.ink600} />
          <Text style={estilos.notaTexto}>
            {`Este punto lo acordaste con ${puesto.conductor.split(' ')[0]} por el chat. Si algo cambia —una calle cerrada, un retraso— díselo ahí: lo que se escribe queda.`}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Escribirle a ${puesto.conductor}`}
          onPress={() =>
            router.push({ pathname: '/(pasajero)/chat', params: { reserva: puesto.reservaId } })
          }
          style={({ pressed }) => [estilos.escribir, pressed && pulsado.celda]}
        >
          <Chat tamano={19} tinta={color.ink900} />
          <Text style={estilos.escribirTexto}>{`Escribirle a ${puesto.conductor.split(' ')[0]}`}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** Un dato: su icono, su rótulo pequeño y el dato en grande debajo. */
function Dato({
  icono,
  rotulo,
  children,
}: {
  icono: React.ReactNode;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <View style={estilos.dato}>
      <View style={estilos.cuadroIcono}>{icono}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={estilos.rotulo}>{rotulo}</Text>
        <Text style={estilos.valor}>{children}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },
  contenido: { paddingHorizontal: espacio.gutter, paddingBottom: 40 },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: espacio.gutter,
    paddingTop: 6,
    paddingBottom: 18,
  },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },

  /** El sitio, en el cuerpo más grande de la app: se lee andando. */
  sitio: {
    marginTop: 8,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '600',
    letterSpacing: -0.9,
    color: color.ink900,
    fontFamily: familia,
  },
  ciudad: {
    marginTop: 4,
    fontSize: 15.5,
    lineHeight: 22,
    color: color.ink500,
    fontFamily: familia,
  },

  datos: {
    marginTop: 24,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingHorizontal: 16,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 15,
  },
  cuadroIcono: {
    width: 38,
    height: 38,
    borderRadius: radio.control,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotulo: {
    fontSize: 12,
    lineHeight: 17,
    color: color.ink600,
    fontFamily: familia,
  },
  valor: {
    marginTop: 2,
    fontSize: 16.5,
    lineHeight: 23,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },

  nota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
  },
  notaTexto: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: color.ink600,
    fontFamily: familia,
  },

  escribir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    height: 52,
    borderRadius: radio.boton,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  escribirTexto: {
    fontSize: 15.5,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
});

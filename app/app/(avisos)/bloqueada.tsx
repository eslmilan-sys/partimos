/**
 * `12a` Pantalla bloqueada — la única superficie de vidrio oscuro del producto.
 *
 * Es la única pantalla que no es nuestra: la dibuja el sistema sobre el fondo
 * del teléfono. Por eso aquí el vidrio va en tinta y no en blanco —el blanco
 * necesita algo claro debajo, y debajo hay noche— y por eso el campo rojo va
 * entero y apagado con un velo, como un fondo de pantalla y no como cabecera.
 *
 * Lo que de verdad se está enseñando es la segunda regla de los avisos: **si
 * hay acción, va dentro**. Aceptar un puesto sin desbloquear es la diferencia
 * entre esto y una notificación cualquiera, así que el aviso que lleva acción
 * se ancla arriba y el que no la lleva se queda sin botones.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';

import { type Aviso, avisoDeBloqueo, bandeja, marcarLeido } from '@/servicios/avisos';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { tabular } from '@/ui/dinero';
import { diaLargo, hora } from '@/ui/fechas';
import { Marca } from '@/ui/iconos';
import { useReloj } from '@/ui/reloj';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';
import { Vidrio } from '@/ui/Vidrio';

/** Mientras no haya sesión: la pasajera del recorrido del diseño. */
const DANIELA = '99999999-9999-4999-8999-999999999999';

/** Los que caben en la pantalla sin empujar el reloj. */
const CUANTOS_CABEN = 2;

export default function Bloqueada() {
  const router = useRouter();
  const [pila, setPila] = useState<Aviso[]>([]);

  // El reloj de la pantalla bloqueada es el del teléfono: se mueve solo.
  const ahora = useReloj(20_000);

  useEffect(() => {
    cargar().then(setPila);
  }, []);

  const refrescar = () => cargar().then(setPila);

  const abrir = (aviso: Aviso) => {
    marcarLeido(aviso.id).then(refrescar);
    if (aviso.accion) router.push(aviso.accion.ruta as Href);
  };

  const reloj = hora(ahora);

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={844} />
      {/* La noche encima del campo: sin este velo el vidrio de tinta no se lee. */}
      <LinearGradient
        colors={['rgba(18,9,12,.72)', 'rgba(18,9,12,.86)']}
        style={StyleSheet.absoluteFill}
      />

      <BarraDeEstado hora={reloj} />

      <View style={estilos.cabecera}>
        <Text style={estilos.fecha}>{diaLargo(ahora)}</Text>
        <Text style={estilos.horaGrande}>{reloj}</Text>
      </View>

      <View style={estilos.pila}>
        {pila.map((aviso) => (
          <Push
            key={aviso.id}
            aviso={aviso}
            sello={sello(aviso, ahora)}
            alActuar={() => abrir(aviso)}
            alSoltar={() => marcarLeido(aviso.id).then(refrescar)}
          />
        ))}

        <Text style={estilos.nota}>Si no hay acción que tomar, el push no lleva botones.</Text>
      </View>
    </View>
  );
}

/**
 * Lo que se apila en la pantalla: el aviso con acción arriba —es el que se
 * resuelve sin desbloquear— y debajo el más nuevo sin leer, que es el que la
 * bandeja devuelve como aviso de bloqueo.
 */
async function cargar(): Promise<Aviso[]> {
  const [ultimo, caja] = await Promise.all([avisoDeBloqueo(DANIELA), bandeja(DANIELA)]);
  const conAccion = caja.pideAccion.find((a) => !a.leido) ?? null;
  const suelto = ultimo && ultimo.id !== conAccion?.id ? ultimo : null;
  return [conAccion, suelto].filter((a): a is Aviso => a !== null).slice(0, CUANTOS_CABEN);
}

/** «ahora» el primer minuto; después, la hora a secas. */
function sello(aviso: Aviso, ahora: Date): string {
  const entro = new Date(aviso.cuando).getTime();
  return ahora.getTime() - entro < 60_000 ? 'ahora' : hora(aviso.cuando);
}

function Push({
  aviso,
  sello,
  alActuar,
  alSoltar,
}: {
  aviso: Aviso;
  sello: string;
  alActuar: () => void;
  alSoltar: () => void;
}) {
  return (
    <Vidrio tono="tinta" desenfoque="m" radioEsquina={22}>
      <View style={estilos.dentro}>
        <View style={estilos.filaMarca}>
          <Marca tamano={20} />
          <Text style={estilos.marca}>Partimos</Text>
          <Text style={estilos.sello}>{sello}</Text>
        </View>

        <Text style={estilos.titulo}>{aviso.titulo}</Text>
        <Text style={estilos.detalle}>{aviso.detalle}</Text>

        {aviso.accion ? (
          <View style={estilos.acciones}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${aviso.accion.etiqueta}: ${aviso.titulo}`}
              onPress={alActuar}
              style={estilos.principal}
            >
              <Text style={estilos.botonTexto}>{aviso.accion.etiqueta}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`No puedo: ${aviso.titulo}`}
              onPress={alSoltar}
              style={estilos.salida}
            >
              <Text style={estilos.botonTexto}>No puedo</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Vidrio>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.ink900,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingTop: 22, paddingHorizontal: espacio.gutter },
  fecha: {
    fontSize: 13,
    lineHeight: interlinea(13),
    fontWeight: '500',
    letterSpacing: 13 * TRACK_MICRO,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'rgba(255,255,255,.66)',
    fontFamily: familia,
  },
  horaGrande: {
    fontSize: 74,
    lineHeight: 74,
    fontWeight: '400',
    letterSpacing: -3.7,
    textAlign: 'center',
    color: '#fff',
    marginTop: 8,
    fontFamily: familia,
    ...tabular,
  },

  // Los avisos caen al pie: entre el reloj y ellos no va nada.
  pila: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: espacio.entreTarjetas,
    paddingHorizontal: 14,
    paddingBottom: 30,
  },

  dentro: { paddingVertical: 15, paddingHorizontal: 16 },

  filaMarca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marca: {
    flex: 1,
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,.7)',
    fontFamily: familia,
  },
  sello: {
    fontSize: 12,
    lineHeight: 17.4,
    color: 'rgba(255,255,255,.6)',
    fontFamily: familia,
    ...tabular,
  },

  titulo: {
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '600',
    letterSpacing: -0.32,
    color: '#fff',
    marginTop: 10,
    fontFamily: familia,
  },
  detalle: {
    fontSize: 14,
    lineHeight: 19.6,
    color: color.campoTexto,
    marginTop: 3,
    fontFamily: familia,
    ...tabular,
  },

  acciones: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,.16)',
  },
  // Sobre el vidrio de tinta el rojo sí es la acción: no hay azul que proteger.
  principal: {
    flex: 1,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salida: {
    height: espacio.controlS,
    paddingHorizontal: 18,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: {
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    letterSpacing: -0.21,
    color: '#fff',
    fontFamily: familia,
  },

  nota: {
    fontSize: 12.5,
    lineHeight: 18.75,
    color: 'rgba(255,255,255,.55)',
    textAlign: 'center',
    paddingTop: 4,
    paddingHorizontal: 12,
    fontFamily: familia,
  },
});

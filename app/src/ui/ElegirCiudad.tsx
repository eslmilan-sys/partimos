/**
 * La hoja de «¿de qué ciudad sales?».
 *
 * Dos cosas a la vez, y la segunda es la que importa:
 *
 * 1. Elegir entre las ciudades que servimos.
 * 2. **Pedir la que falta.** Si escribes un pueblo que no está, la hoja no
 *    se queda en blanco ni —peor— te deja inventártelo: te ofrece mandárnoslo
 *    para que lo agreguemos. Una ciudad inventada rompe la búsqueda para
 *    todos, y `lugar.ts` ya decía que una dirección no se inventa; pero un
 *    vacío mudo es cómo se pierde a la persona que más falta nos hace, la que
 *    vive donde todavía no llegamos.
 *
 * Pedido del dueño el 27-08-2026.
 */

import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  type MiCiudad,
  buscarCiudad,
  pedirQueAgreguenLaCiudad,
} from '@/servicios/miCiudad';

import { Cerrar, Lupa, Pin } from './iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio } from './tokens';

type Props = {
  abierto: boolean;
  /** Quién pide, para firmar la petición. Nulo si todavía no tiene cuenta. */
  yo: string | null;
  /** La que ya está elegida, para marcarla. */
  actual?: MiCiudad | null;
  alElegir: (ciudad: MiCiudad) => void;
  alCerrar: () => void;
};

export function ElegirCiudad({ abierto, yo, actual, alElegir, alCerrar }: Props) {
  const [texto, setTexto] = useState('');
  /** `null` mientras no se ha pedido nada; el nombre pedido cuando ya se mandó. */
  const [pedida, setPedida] = useState<string | null>(null);
  const [pidiendo, setPidiendo] = useState(false);

  /* Al abrir, la hoja empieza limpia: dejarla con lo que se escribió la vez
     anterior hacía que la lista arrancara filtrada sin que se viera por qué. */
  useEffect(() => {
    if (abierto) {
      setTexto('');
      setPedida(null);
    }
  }, [abierto]);

  const encontradas = buscarCiudad(texto);
  const escrito = texto.trim();

  const pedir = async () => {
    if (pidiendo || escrito.length < 2) return;
    setPidiendo(true);
    const ok = await pedirQueAgreguenLaCiudad(yo, escrito);
    setPidiendo(false);
    if (ok) setPedida(escrito);
  };

  return (
    <Modal visible={abierto} animationType="slide" transparent onRequestClose={alCerrar}>
      {/* El velo va DETRÁS y absoluto, no como hermano que empuja: puesto en
          la misma columna que la hoja, su superficie se solapaba con la lista
          y se comía los toques de las filas de abajo — «Chitré» no se podía
          elegir. Es el mismo montaje que usa `BuscadorDeLugar`. */}
      <Pressable accessibilityLabel="Cerrar" onPress={alCerrar} style={estilos.velo} />

      <View style={estilos.alFondo} pointerEvents="box-none">
        <View style={estilos.hoja}>
          <View style={estilos.cabecera}>
            <Text style={estilos.epigrafe}>De dónde salgo</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={alCerrar}
              style={estilos.cerrar}
            >
              <Cerrar tamano={16} tinta={color.ink700} />
            </Pressable>
          </View>

          <View style={estilos.campo}>
            <Lupa tamano={18} tinta={color.ink500} />
            <TextInput
              accessibilityLabel="Escribe tu ciudad"
              autoFocus
              value={texto}
              onChangeText={(v) => {
                setTexto(v);
                setPedida(null);
              }}
              placeholder="Escribe tu ciudad"
              placeholderTextColor={color.ink500}
              style={estilos.entrada}
            />
          </View>

          <ScrollView
            style={estilos.lista}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {encontradas.map((c) => {
              const puesta = actual?.id === c.id;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: puesta }}
                  accessibilityLabel={c.nombre}
                  onPress={() => alElegir(c)}
                  style={({ pressed }) => [
                    estilos.fila,
                    puesta && estilos.filaPuesta,
                    pressed && { backgroundColor: color.lavado },
                  ]}
                >
                  <View style={estilos.celdaPin}>
                    <Pin tamano={16} tinta={color.ink600} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.nombre} numberOfLines={1}>
                      {c.nombre}
                    </Text>
                    {c.provincia ? (
                      <Text style={estilos.provincia} numberOfLines={1}>
                        {c.provincia}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}

            {/* **Lo que no está.** No se ofrece «usarlo tal cual»: se ofrece
                pedírnoslo. La diferencia es que así la ciudad existe de
                verdad para todos la próxima vez, en vez de quedarse como un
                nombre suelto que ninguna búsqueda encuentra. */}
            {encontradas.length === 0 && escrito.length >= 2 ? (
              pedida ? (
                <View style={estilos.pedida}>
                  <Text style={estilos.pedidaTitulo}>{`Anotado: ${pedida}`}</Text>
                  <Text style={estilos.pedidaTexto}>
                    La buscamos y la agregamos. Mientras tanto puedes elegir la ciudad servida
                    más cercana.
                  </Text>
                </View>
              ) : (
                <View style={estilos.faltante}>
                  <Text style={estilos.faltanteTitulo}>{`No tenemos ${escrito} todavía`}</Text>
                  <Text style={estilos.faltanteTexto}>
                    Dinos que la agreguemos y la buscamos. No la ponemos nosotros a medias: una
                    ciudad mal puesta no la encuentra nadie.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Pedir que agreguemos ${escrito}`}
                    disabled={pidiendo}
                    onPress={pedir}
                    style={({ pressed }) => [
                      estilos.botonPedir,
                      pressed && { backgroundColor: color.ink800 },
                      pidiendo && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={estilos.botonPedirTexto}>Pedir que la agreguen</Text>
                  </Pressable>
                </View>
              )
            ) : null}

            {encontradas.length === 0 && escrito.length < 2 ? (
              <Text style={estilos.pista}>Escribe al menos dos letras.</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  velo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26,20,32,.34)',
  },
  /**
   * La columna que empuja la hoja abajo, transparente a los toques.
   *
   * `zIndex` no es decorativo: en la web, un elemento posicionado —el velo—
   * se pinta por encima de uno que no lo está, por mucho que vaya antes en
   * el árbol. Sin esto el velo tapaba la lista y las ciudades no se dejaban
   * elegir, aunque se vieran perfectamente.
   */
  alFondo: { flex: 1, justifyContent: 'flex-end', zIndex: 1 },
  hoja: {
    backgroundColor: color.sand100,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: espacio.gutter,
    paddingTop: 16,
    paddingBottom: 22,
    width: '100%',
    maxWidth: espacio.marco,
    alignSelf: 'center',
    maxHeight: '82%',
  },

  cabecera: { flexDirection: 'row', alignItems: 'center' },
  epigrafe: {
    flex: 1,
    fontFamily: familia,
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
  },
  cerrar: {
    width: 34,
    height: 34,
    borderRadius: radio.icono,
    backgroundColor: color.lavado,
    alignItems: 'center',
    justifyContent: 'center',
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: radio.control,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
  },
  entrada: {
    flex: 1,
    fontFamily: familia,
    /* 16 o más: por debajo, Safari acerca la página al enfocar el campo. */
    fontSize: 16,
    color: color.ink900,
    outlineStyle: 'none',
  } as never,

  lista: { marginTop: 10 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: radio.control,
  },
  filaPuesta: { backgroundColor: color.lavado },
  celdaPin: {
    width: 34,
    height: 34,
    borderRadius: radio.icono,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontSize: 15.5,
    lineHeight: interlinea(15.5),
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  provincia: {
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink500,
    fontFamily: familia,
  },

  faltante: {
    marginTop: 8,
    padding: 16,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
  },
  faltanteTitulo: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  faltanteTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: color.ink600,
    marginTop: 4,
    fontFamily: familia,
  },
  /* De tinta y no rojo: pedir una ciudad no es la acción primaria de la
     pantalla — elegir la tuya lo es (invariante 4). */
  botonPedir: {
    height: 46,
    marginTop: 12,
    borderRadius: radio.pastilla,
    backgroundColor: color.ink900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPedirTexto: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },

  pedida: {
    marginTop: 8,
    padding: 16,
    borderRadius: radio.l,
    backgroundColor: color.hechoFondo,
  },
  pedidaTitulo: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.hechoTinta,
    fontFamily: familia,
  },
  pedidaTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: color.ink700,
    marginTop: 4,
    fontFamily: familia,
  },

  pista: {
    fontSize: 13,
    lineHeight: 19,
    color: color.ink500,
    padding: 12,
    fontFamily: familia,
  },
});

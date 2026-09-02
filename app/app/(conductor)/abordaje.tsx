/**
 * `1g` Los dos códigos — lado conductor.
 *
 * El conductor teclea cuatro dígitos al subir a cada quien, y otros cuatro al
 * bajarlo. El primero prueba que el viaje pasó —sin él el reembolso por «el
 * conductor no llegó» se sostiene—; el segundo cierra el viaje y suelta el
 * aporte retenido.
 *
 * **El segundo no existía.** El pasajero veía su código de llegada en `1i` y
 * no había dónde teclearlo, así que ningún aporte se liberaba nunca. La misma
 * pantalla hace ahora los dos momentos, porque son el mismo gesto en dos
 * paradas: no hacía falta otra pantalla, hacía falta la segunda mitad.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import {
  type ListaDeAbordaje,
  listaDeAbordaje,
  marcarNoShow,
  verificarCodigo,
} from '@/servicios/abordaje';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Boton, Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { hora, mas } from '@/ui/fechas';
import { Borrar, Visto } from '@/ui/iconos';
import { color, espacio, familia, radio, TRACK_MICRO, zonaDeToque } from '@/ui/tokens';

/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, el del traspaso. */
const DEL_RECORRIDO = '55555555-5555-4555-8555-555555555557';
const FILAS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'borrar'],
] as const;

export default function Abordaje() {
  const { viaje } = useLocalSearchParams<{ viaje?: string }>();
  const viajeId = viaje ?? DEL_RECORRIDO;
  const [datos, setDatos] = useState<ListaDeAbordaje | null>(null);
  const [tecleado, setTecleado] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setDatos(await listaDeAbordaje(viajeId));
  }, [viajeId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!datos) return <Cargando />;

  const teclear = (t: string) => {
    setError(null);
    if (t === 'borrar') return setTecleado((c) => c.slice(0, -1));
    if (tecleado.length >= 4) return;
    setTecleado((c) => c + t);
  };

  /**
   * **YA NO SE TECLEA AL BAJAR** (27-08-2026). Había un segundo código y esta
   * misma pantalla lo pedía al final del viaje. Con la maleta en la mano y el
   * carro en doble fila nadie lo tecleaba, y sin ese tecleo la reserva se
   * quedaba abierta para siempre. Ahora cierra quien viajó —«todo bien»— o se
   * cierra sola a las 24 h. Aquí sólo queda el código de subir.
   */
  const esperando = datos.fase === 'esperando';
  const siguiente = esperando ? null : datos.siguiente;

  const confirmar = async () => {
    const resultado = await verificarCodigo(viajeId, tecleado);
    if (resultado.ok) {
      setTecleado('');
      await recargar();
    } else {
      setError(
        resultado.motivo === 'ya-abordo'
          ? 'Ese código ya se usó. Prueba con el de quien falta.'
          : 'Ese código no es de este viaje. Pídeselo otra vez.',
      );
    }
  };

  const digitos = [0, 1, 2, 3];

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >

      <CampoRojo altura={196} />

      <BarraDeEstado hora={hora(mas(datos.salida, -1))} />

      <View style={estilos.cabecera}>
        <Text style={estilos.epigrafeCampo}>
          {`${datos.parada} · ${hora(datos.salida)}`}
        </Text>
        <Text style={estilos.titular}>
          {'Suben '}
          <Text style={estilos.titularFuerte}>
            {datos.total === 1 ? '1 persona' : `${datos.total} personas`}
          </Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          <View style={estilos.filaTitulo}>
            <Epigrafe>
              {siguiente
                ? `Código de ${siguiente.nombre.split(' ')[0]}`
                : esperando
                  ? 'Todos a bordo'
                  : 'Viaje cerrado'}
            </Epigrafe>
            <Text style={estilos.contador}>
              {esperando
                ? `${datos.cerrados} de ${datos.total} confirmaron`
                : `${datos.abordados} de ${datos.total} abordaron`}
            </Text>
          </View>

          {!siguiente ? (
            <Text style={estilos.todosDentro}>
              {esperando
                ? 'Ya están todos dentro. Al llegar, cada quien confirma desde su teléfono; si no lo hace, el viaje se da por bueno solo a las 24 h.'
                : 'El viaje está cerrado. Cada aporte ya quedó registrado.'}
            </Text>
          ) : (
          <>
          <View style={estilos.casillas}>
            {digitos.map((i) => {
              const valor = tecleado[i];
              const activa = i === tecleado.length && siguiente != null;
              return (
                <View
                  key={i}
                  style={[
                    estilos.casilla,
                    valor != null
                      ? { backgroundColor: color.sand200 }
                      : activa
                        ? { backgroundColor: color.blanco, borderWidth: 2, borderColor: color.rojo500 }
                        : { backgroundColor: color.blanco, borderWidth: 1.5, borderColor: color.bordePorDefecto },
                  ]}
                >
                  {valor != null ? (
                    <Text style={estilos.casillaTexto}>{valor}</Text>
                  ) : activa ? (
                    <View style={estilos.cursor} />
                  ) : null}
                </View>
              );
            })}
          </View>

          {error ? <Text style={estilos.error}>{error}</Text> : null}

          <View style={estilos.teclado}>
            {FILAS.map((fila, f) => (
              <View key={`fila-${f}`} style={estilos.filaTeclas}>
                {fila.map((t, i) =>
                  t === '' ? (
                    <View key={`hueco-${f}-${i}`} style={estilos.tecla} />
                  ) : (
                    <Pressable
                      key={t}
                      accessibilityRole="button"
                      accessibilityLabel={t === 'borrar' ? 'Borrar' : t}
                      onPress={() => teclear(t)}
                      style={({ pressed }) => [
                        estilos.tecla,
                        t !== 'borrar' && estilos.teclaNumero,
                        pressed && { backgroundColor: color.sand300 },
                      ]}
                    >
                      {t === 'borrar' ? (
                        <Borrar tamano={21} tinta={color.ink700} />
                      ) : (
                        <Text style={estilos.teclaTexto}>{t}</Text>
                      )}
                    </Pressable>
                  ),
                )}
              </View>
            ))}
          </View>
          </>
          )}
        </View>

        <View style={estilos.lista}>
          {datos.pasajeros.map((p, i) => (
            <View
              key={p.reservaId}
              style={[
                estilos.filaPasajero,
                i > 0 && { borderTopWidth: 1, borderTopColor: color.bordeSutil, paddingTop: 14 },
                i < datos.pasajeros.length - 1 && { paddingBottom: 14 },
              ]}
            >
              <Avatar
                nombre={p.nombre}
                tamano={36}
                tono={p.abordado ? 'arena2' : 'azul'}
              />
              <Text style={[estilos.nombrePasajero, p.abordado && { color: color.ink600 }]}>
                {p.nombre}
              </Text>
              {p.cerrado || p.abordado ? (
                <View style={estilos.abordo}>
                  <Visto tamano={15} tinta={color.verde500} />
                  <Text style={estilos.abordoTexto}>{p.cerrado ? 'bajó' : 'abordó'}</Text>
                </View>
              ) : (
                <Text style={estilos.puestos}>
                  {p.puestos === 1 ? '1 puesto' : `${p.puestos} puestos`}
                </Text>
              )}
            </View>
          ))}
        </View>

      </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton desactivado={tecleado.length < 4 || !siguiente} alPulsar={confirmar}>
          Confirmar abordaje
        </Boton>
        {siguiente ? (
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await marcarNoShow(siguiente.reservaId);
              setTecleado('');
              await recargar();
            }}
            style={zonaDeToque}
          >
            <Text style={estilos.noShow}>
              {`${siguiente.nombre.split(' ')[0]} no aparece · marcar como no show`}
            </Text>
          </Pressable>
        ) : (
          <Text style={estilos.noShow}>
            {esperando
              ? /* «Queda registrado» (02-09-2026): la plataforma no mueve
                   plata; la frase vieja describía un giro inexistente. */
                'Al confirmar cada quien, su aporte queda registrado.'
              : 'Ya no queda nada por hacer aquí.'}
          </Text>
        )}
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

  cabecera: { paddingHorizontal: espacio.gutter },
  epigrafeCampo: {
    fontSize: 11.5, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 11, },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 26, paddingBottom: 16 },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  contador: { fontSize: 12.5, lineHeight: 18.12, color: color.ink600, fontFamily: familia },
  todosDentro: { fontSize: 13.5, lineHeight: 20, color: color.ink500, fontFamily: familia },

  casillas: { flexDirection: 'row', gap: 10 },
  casilla: {
    flex: 1,
    height: 74,
    borderRadius: radio.cuadrado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaTexto: {
    fontSize: 33, lineHeight: 49.3,
    fontWeight: '600',
    letterSpacing: -1.02,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  cursor: { width: 2, height: 30, backgroundColor: color.rojo500 },
  error: { marginTop: 12, fontSize: 12.5, lineHeight: 18.125, color: color.rojo700, fontFamily: familia },

  teclado: { gap: 9, marginTop: 18 },
  filaTeclas: { flexDirection: 'row', gap: 9 },
  tecla: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radio.m,
  },
  teclaNumero: {
    backgroundColor: color.sand100,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  teclaTexto: {
    fontSize: 23, lineHeight: 33.35,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  lista: {
    marginTop: 12,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 18,
  },
  filaPasajero: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  nombrePasajero: { flex: 1, fontSize: 15.5, lineHeight: 21.75, fontWeight: '500', color: color.ink900, fontFamily: familia },
  puestos: { fontSize: 13.5, lineHeight: 18.85, color: color.ink600, fontFamily: familia },
  abordo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  abordoTexto: { fontSize: 13.5, lineHeight: 18.85, fontWeight: '500', color: color.verde500, fontFamily: familia },

  pie: {
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    gap: 10,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  noShow: { textAlign: 'center', fontSize: 12.5, lineHeight: 18.12, color: color.ink600, fontFamily: familia },
});

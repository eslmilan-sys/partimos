/**
 * `1g` Código de abordaje — lado conductor.
 *
 * El conductor teclea los cuatro dígitos de cada pasajero al subirlo. Esa marca
 * es la prueba de que el viaje pasó: sin ella no se libera el aporte, y el
 * reembolso por «el conductor no llegó» se apoya en que no exista.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type ListaDeAbordaje, listaDeAbordaje, marcarNoShow, verificarCodigo } from '@/servicios/abordaje';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Boton, Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { hora, mas } from '@/ui/fechas';
import { Visto } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

const VIAJE = '55555555-5555-4555-8555-555555555557';
const FILAS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'borrar'],
] as const;

export default function Abordaje() {
  const [datos, setDatos] = useState<ListaDeAbordaje | null>(null);
  const [tecleado, setTecleado] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setDatos(await listaDeAbordaje(VIAJE));
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!datos) return <View style={estilos.pantalla} />;

  const teclear = (t: string) => {
    setError(null);
    if (t === 'borrar') return setTecleado((c) => c.slice(0, -1));
    if (tecleado.length >= 4) return;
    setTecleado((c) => c + t);
  };

  const confirmar = async () => {
    const resultado = await verificarCodigo(VIAJE, tecleado);
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

  const siguiente = datos.siguiente;
  const digitos = [0, 1, 2, 3];

  return (
    <View style={estilos.pantalla}>
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.hoja}>
          <View style={estilos.filaTitulo}>
            <Epigrafe>
              {siguiente ? `Código de ${siguiente.nombre.split(' ')[0]}` : 'Todos abordaron'}
            </Epigrafe>
            <Text style={estilos.contador}>
              {`${datos.abordados} de ${datos.total} abordaron`}
            </Text>
          </View>

          {!siguiente ? (
            <Text style={estilos.todosDentro}>
              Ya están todos dentro. El viaje puede empezar.
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
                      <Text style={t === 'borrar' ? estilos.teclaBorrar : estilos.teclaTexto}>
                        {t === 'borrar' ? '⌫' : t}
                      </Text>
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
              <Text style={[estilos.nombrePasajero, p.abordado && { color: color.ink500 }]}>
                {p.nombre}
              </Text>
              {p.abordado ? (
                <View style={estilos.abordo}>
                  <Visto tamano={15} tinta={color.verde500} />
                  <Text style={estilos.abordoTexto}>abordó</Text>
                </View>
              ) : (
                <Text style={estilos.puestos}>
                  {p.puestos === 1 ? '1 puesto' : `${p.puestos} puestos`}
                </Text>
              )}
            </View>
          ))}
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
          >
            <Text style={estilos.noShow}>
              {`${siguiente.nombre.split(' ')[0]} no aparece · marcar como no show`}
            </Text>
          </Pressable>
        ) : (
          <Text style={estilos.noShow}>Ya puedes salir.</Text>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter },
  epigrafeCampo: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 29,
    lineHeight: 31.9,
    letterSpacing: -1.16,
    fontWeight: '400',
    color: '#fff',
    marginTop: 11,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 16 },

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
  contador: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, fontFamily: familia },
  todosDentro: { fontSize: 13.5, lineHeight: 20, color: color.ink600, fontFamily: familia },

  casillas: { flexDirection: 'row', gap: 10 },
  casilla: {
    flex: 1,
    height: 74,
    borderRadius: radio.cuadrado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaTexto: {
    fontSize: 34, lineHeight: 49.3,
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
  teclaBorrar: { fontSize: 22, lineHeight: 31.9, color: color.ink600, fontFamily: familia },

  lista: {
    marginTop: 12,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 18,
  },
  filaPasajero: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  nombrePasajero: { flex: 1, fontSize: 15, lineHeight: 21.75, fontWeight: '500', color: color.ink900, fontFamily: familia },
  puestos: { fontSize: 13, lineHeight: 18.85, color: color.ink500, fontFamily: familia },
  abordo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  abordoTexto: { fontSize: 13, lineHeight: 18.85, fontWeight: '500', color: color.verde500, fontFamily: familia },

  pie: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 26,
    gap: 10,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  noShow: { textAlign: 'center', fontSize: 12.5, lineHeight: 18.12, color: color.ink500, fontFamily: familia },
});

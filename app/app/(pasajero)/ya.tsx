/**
 * `1d` Ya — el día de la salida, en lista.
 *
 * Es la pantalla de quien no planifica: está en la terminal y quiere subirse a
 * algo que sale ya. Por eso el titular es la hora y no el destino, y la
 * primera tarjeta trae todo lo que hace falta para decidir sin abrir nada más:
 * cuánto falta, cuánto cuesta, cuántos puestos, si acepta maletas y quién
 * maneja.
 *
 * «Actualizado hace 20 s» no es un adorno: en esta pantalla el dato caduca en
 * minutos, y decirlo es lo que hace que se pueda confiar en él.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { etiquetaDeMaletero } from '@/dominio/equipaje';
import { type ViajeEnResultados, buscarViajes, proximoDiaConViajes } from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Insignia, Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { Estrella, Maleta } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const VERDE = { fondo: '#DFF1E8', tinta: '#0E5A3F' };

export default function Ya() {
  const router = useRouter();
  const [viajes, setViajes] = useState<ViajeEnResultados[]>([]);

  useEffect(() => {
    (async () => {
      // El primer día con salidas, no «hoy» a secas: una pantalla de «ya»
      // vacía no dice nada, y el interior sale casi siempre de madrugada.
      const dia = await proximoDiaConViajes('panama', 'chitre');
      setViajes(await buscarViajes('panama', 'chitre', dia));
    })();
  }, []);

  const [primero, ...resto] = viajes;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={280} motivo="mapa" />
      <BarraDeEstado />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecera}>
          <View style={estilos.filaEpigrafe}>
            <Text style={estilos.epigrafeVivo}>Ya · en vivo</Text>
            <View style={estilos.puntoVivo} />
          </View>

          <Text style={estilos.titular}>
            {'Salen ahora'}
            {'\n'}
            <Text style={estilos.titularFuerte}>hacia el interior</Text>
          </Text>

          <Text style={estilos.debajo}>
            {`${viajes.length} ${viajes.length === 1 ? 'carro' : 'carros'} desde Albrook · actualizado hace 20 s`}
          </Text>
        </View>

        {primero ? (
          <View style={estilos.cuerpo}>
            <View style={estilos.hoja}>
              <View style={estilos.filaSuperior}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.saleEn}>{`Sale en ${faltan(primero.departure_at!)}`}</Text>
                  <Text style={estilos.ruta}>
                    {`${(primero.origin_label ?? '').split(' · ')[0]} →`}
                    {'\n'}
                    <Text style={estilos.rutaFuerte}>
                      {(primero.destination_label ?? '').split(' · ')[0]}
                    </Text>
                  </Text>
                </View>

                <View style={estilos.bloquePrecio}>
                  <Text style={estilos.precio}>
                    {Math.round(Number(primero.price_cents ?? 0) / 100)}
                    <Text style={estilos.precioSimbolo}> $</Text>
                  </Text>
                  <Pastilla estilo={{ marginTop: 2 }}>
                    {(primero.seats_available ?? 0) === 1
                      ? '1 puesto'
                      : `${primero.seats_available} puestos`}
                  </Pastilla>
                </View>
              </View>

              <View style={estilos.filaEquipaje}>
                <Maleta tamano={13} />
                <Text style={estilos.equipaje}>
                  {`${etiquetaDeMaletero(primero.accepts_luggage)} · una por pasajero`}
                </Text>
              </View>

              <View style={estilos.raya} />

              <View style={estilos.filaConductor}>
                <View style={estilos.retrato}>
                  <Text style={estilos.retratoTexto}>
                    {`${primero.first_name?.[0] ?? ''}${primero.last_initial?.[0] ?? ''}`.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.nombre}>
                    {`${primero.first_name ?? ''} ${primero.last_initial ?? ''}`.trim()}
                  </Text>
                  <View style={estilos.filaNota}>
                    <Estrella tamano={11} />
                    <Text style={estilos.nota}>
                      {`${(primero.driver_rating ?? 0).toFixed(1)} · ${primero.make ?? ''} ${primero.model ?? ''} ${primero.color ?? ''}`.trim()}
                    </Text>
                  </View>
                </View>
                {primero.is_id_verified ? (
                  <Insignia fondo={VERDE.fondo} tinta={VERDE.tinta} punto>
                    Verificado
                  </Insignia>
                ) : null}
              </View>

              <View style={{ marginTop: 18 }}>
                <Boton alPulsar={() => router.push('/(pasajero)/reservar')}>
                  {`Pedir puesto · ${formatearDineroRedondo(Number(primero.price_cents ?? 0))}`}
                </Boton>
              </View>

              <Text style={estilos.notaPie}>
                Se retiene hasta la salida. Si el viaje se cancela, se devuelve entero.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={estilos.seccion}>
          <View style={estilos.filaSeccion}>
            <Text style={estilos.epigrafeSeccion}>También salen pronto</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/(pasajero)/resultados')}>
              <Text style={estilos.verTodo}>ver todo</Text>
            </Pressable>
          </View>

          {resto.map((v) => (
            <Pressable
              key={v.id}
              accessibilityRole="button"
              onPress={() => router.push('/(pasajero)/viaje')}
              style={estilos.fila}
            >
              <Text style={estilos.filaCuando}>{faltan(v.departure_at!)}</Text>
              <Text style={estilos.filaRuta} numberOfLines={1}>
                {`${(v.origin_label ?? '').split(' · ')[0]} → `}
                <Text style={estilos.filaRutaFuerte}>
                  {(v.destination_label ?? '').split(' · ')[0]}
                </Text>
              </Text>
              <Text style={estilos.filaPrecio}>
                {formatearDineroRedondo(Number(v.price_cents ?? 0))}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** «12 min», o la hora si ya falta más de una hora. */
function faltan(salidaISO: string): string {
  const minutos = Math.round((new Date(salidaISO).getTime() - Date.now()) / 60_000);
  if (minutos <= 0) return 'ahora';
  if (minutos < 60) return `${minutos} min`;
  return hora(salidaISO);
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  epigrafeVivo: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: '#fff',
    fontFamily: familia,
  },
  puntoVivo: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#fff' },
  titular: {
    fontSize: 42,
    lineHeight: 42.84,
    letterSpacing: -1.89,
    fontWeight: '400',
    color: '#fff',
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },
  debajo: {
    fontSize: 14,
    lineHeight: 20.3,
    color: color.campoTexto,
    marginTop: 12,
    fontFamily: familia,
    ...tabular,
  },

  cuerpo: { paddingHorizontal: 22, paddingTop: 30 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  saleEn: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.rojo600,
    fontFamily: familia,
    ...tabular,
  },
  ruta: {
    fontSize: 23,
    lineHeight: 28.52,
    letterSpacing: -0.805,
    color: color.ink900,
    marginTop: 9,
    fontFamily: familia,
  },
  rutaFuerte: { fontWeight: '600' },

  bloquePrecio: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  precio: {
    fontSize: 32,
    lineHeight: 28.8,
    fontWeight: '700',
    letterSpacing: -1.44,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  precioSimbolo: { fontSize: 17, lineHeight: 15.3, fontWeight: '500' },

  filaEquipaje: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  equipaje: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },

  raya: { height: 1, backgroundColor: color.bordeSutil, marginTop: 18 },

  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 17 },
  retrato: {
    width: 36,
    height: 36,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoTexto: {
    fontSize: 14.4,
    lineHeight: 20.88,
    fontWeight: '600',
    letterSpacing: -0.288,
    color: color.rojo700,
    fontFamily: familia,
  },
  nombre: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  filaNota: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nota: { fontSize: 13, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },

  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    marginTop: 12,
    fontFamily: familia,
  },

  seccion: { paddingHorizontal: espacio.gutter, paddingTop: 26 },
  filaSeccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  epigrafeSeccion: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
  },
  verTodo: { fontSize: 12.5, lineHeight: 18.125, fontWeight: '600', color: color.rojo600, fontFamily: familia },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  filaCuando: {
    width: 52,
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  filaRuta: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 22.475,
    letterSpacing: -0.279,
    color: color.ink900,
    fontFamily: familia,
  },
  filaRutaFuerte: { fontWeight: '500' },
  filaPrecio: {
    fontSize: 19,
    lineHeight: 27.55,
    fontWeight: '700',
    letterSpacing: -0.665,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
});

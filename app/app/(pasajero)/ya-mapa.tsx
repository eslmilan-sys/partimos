/**
 * `1e` Ya — la misma pantalla sobre el mapa.
 *
 * La lista de `1d` responde «¿cuándo sale?». Esta responde «¿cuál me queda más
 * cerca?», que en una terminal es otra pregunta. Por eso los carros son
 * pastillas sobre el mapa con sus minutos, y la hoja de abajo detalla el más
 * cercano.
 *
 * Todo el cromo va en vidrio claro porque se sienta sobre el mapa, que tiene
 * color. Sobre la arena lisa sería una mancha gris — la regla del sistema, no
 * una preferencia.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { type ViajeEnResultados, buscarViajes, proximoDiaConViajes } from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Mapa } from '@/ui/Mapa';
import { Vidrio } from '@/ui/Vidrio';
import { Boton, Insignia } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Lupa } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

/** Dónde cae cada carro sobre el mapa. Con proveedor real esto son coordenadas. */
const SITIOS = [
  { top: 206, left: 96 },
  { top: 152, left: 224 },
  { top: 346, left: 52 },
  { top: 292, left: 262 },
];

export default function YaMapa() {
  const router = useRouter();
  const [viajes, setViajes] = useState<ViajeEnResultados[]>([]);

  useEffect(() => {
    (async () => {
      const dia = await proximoDiaConViajes('panama', 'chitre');
      setViajes(await buscarViajes('panama', 'chitre', dia));
    })();
  }, []);

  const [primero, ...resto] = viajes;

  return (
    <View style={estilos.pantalla}>
      <Mapa alto={460} />
      <BarraDeEstado tono="oscuro" />

      <View style={estilos.arriba}>
        <Vidrio radioEsquina={radio.control} estilo={{ flex: 1 }}>
          <View style={estilos.dentroBarra}>
            <View style={estilos.punto} />
            <Text style={estilos.origen}>Albrook · Terminal</Text>
            <Pressable accessibilityRole="button">
              <Text style={estilos.cambiar}>cambiar</Text>
            </Pressable>
          </View>
        </Vidrio>

        <Vidrio radioEsquina={radio.pastilla}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            onPress={() => router.push('/(pasajero)/resultados')}
            style={estilos.botonLupa}
          >
            <Lupa tamano={20} tinta={color.ink900} />
          </Pressable>
        </Vidrio>
      </View>

      {/* Cada carro, con lo único que importa desde aquí: cuánto tarda en llegar. */}
      <View style={estilos.chinchetas} pointerEvents="box-none">
        {viajes.slice(0, 4).map((v, i) => (
          <Pressable
            key={v.id}
            accessibilityRole="button"
            accessibilityLabel={`${faltan(v.departure_at!)}, ${formatearDineroRedondo(Number(v.price_cents ?? 0))}`}
            onPress={() => router.push('/(pasajero)/viaje')}
            style={[estilos.chincheta, SITIOS[i], i === 0 && estilos.chinchetaViva]}
          >
            <Text style={[estilos.chinchetaTexto, i === 0 && estilos.chinchetaTextoVivo]}>
              {i === 0
                ? `${faltan(v.departure_at!)} · ${formatearDineroRedondo(Number(v.price_cents ?? 0))}`
                : faltan(v.departure_at!)}
            </Text>
          </Pressable>
        ))}
      </View>

      {primero ? (
        <Vidrio tono="fuerte" radioEsquina={28} estilo={estilos.hoja}>
          <View style={estilos.dentroHoja}>
            <View style={estilos.filaEpigrafe}>
              <Text style={estilos.epigrafeVivo}>
                {`El más cercano · sale en ${faltan(primero.departure_at!)}`}
              </Text>
              <View style={estilos.puntoVivo} />
            </View>

            <View style={estilos.filaRuta}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.ruta}>
                  {`${(primero.origin_label ?? '').split(' · ')[0]} → `}
                  <Text style={estilos.rutaFuerte}>
                    {(primero.destination_label ?? '').split(' · ')[0]}
                  </Text>
                </Text>
                <Text style={estilos.aPie}>
                  {`3 min a pie · te espera en ${(primero.origin_label ?? '').split(' · ')[1] ?? 'el punto'}`}
                </Text>
              </View>
              <Text style={estilos.precio}>
                {Math.round(Number(primero.price_cents ?? 0) / 100)}
                <Text style={estilos.precioSimbolo}> $</Text>
              </Text>
            </View>

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
                <Text style={estilos.nota}>
                  {`${(primero.driver_rating ?? 0).toFixed(1)} · ${primero.seats_available} puestos libres`}
                </Text>
              </View>
              <Insignia fondo={color.rojo50} tinta={color.rojo700}>
                Yappy
              </Insignia>
            </View>

            <View style={{ marginTop: 18 }}>
              <Boton alPulsar={() => router.push('/(pasajero)/reservar')}>
                {`Pedir puesto · ${formatearDineroRedondo(Number(primero.price_cents ?? 0))}`}
              </Boton>
            </View>

            <View style={estilos.otros}>
              {resto.slice(0, 2).map((v) => (
                <Pressable
                  key={v.id}
                  accessibilityRole="button"
                  onPress={() => router.push('/(pasajero)/viaje')}
                  style={estilos.otro}
                >
                  <Text style={estilos.otroCuando}>{faltan(v.departure_at!)}</Text>
                  <Text style={estilos.otroDestino}>
                    {`${(v.destination_label ?? '').split(' · ')[0]} · ${formatearDineroRedondo(Number(v.price_cents ?? 0))}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Vidrio>
      ) : null}
    </View>
  );
}

function faltan(salidaISO: string): string {
  const minutos = Math.round((new Date(salidaISO).getTime() - Date.now()) / 60_000);
  if (minutos <= 0) return 'ahora';
  if (minutos < 60) return `${minutos} min`;
  return `${Math.round(minutos / 60)} h`;
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

  arriba: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4, paddingHorizontal: 22 },
  dentroBarra: { flexDirection: 'row', alignItems: 'center', gap: 11, height: 52, paddingHorizontal: 16 },
  punto: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.rojo500 },
  origen: {
    flex: 1,
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '500',
    letterSpacing: -0.225,
    color: color.ink900,
    fontFamily: familia,
  },
  cambiar: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },
  botonLupa: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },

  chinchetas: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  chincheta: {
    position: 'absolute',
    height: 30,
    paddingHorizontal: 11,
    borderRadius: radio.ficha,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#26232B',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  chinchetaViva: { height: 34, paddingHorizontal: 12, backgroundColor: color.rojo500 },
  chinchetaTexto: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  chinchetaTextoVivo: { fontSize: 13, lineHeight: 18.85, color: '#fff' },

  hoja: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  dentroHoja: { padding: 20 },

  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  epigrafeVivo: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.rojo600,
    fontFamily: familia,
  },
  puntoVivo: { width: 7, height: 7, borderRadius: 999, backgroundColor: color.rojo500 },

  filaRuta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
    marginTop: 14,
  },
  ruta: {
    fontSize: 22,
    lineHeight: 27.28,
    letterSpacing: -0.77,
    color: color.ink900,
    fontFamily: familia,
  },
  rutaFuerte: { fontWeight: '600' },
  aPie: { fontSize: 13.5, lineHeight: 19.575, color: color.ink700, marginTop: 7, fontFamily: familia },
  precio: {
    fontSize: 30,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -1.35,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  precioSimbolo: { fontSize: 16, lineHeight: 14.4, fontWeight: '500' },

  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16 },
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
    color: color.ink900,
    fontFamily: familia,
  },
  nota: { fontSize: 13, lineHeight: 18.85, color: color.ink700, fontFamily: familia, ...tabular },

  otros: { flexDirection: 'row', gap: 8, marginTop: 12 },
  otro: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,.72)',
    borderRadius: radio.ficha,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  otroCuando: {
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  otroDestino: { fontSize: 12, lineHeight: 17.4, color: color.ink600, fontFamily: familia, ...tabular },
});

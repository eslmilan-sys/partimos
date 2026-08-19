/**
 * `1h` En ruta.
 *
 * La única pantalla del producto que se mira **desde dentro de un carro en
 * movimiento**, y está construida para eso: mapa de noche, un solo dato
 * grande arriba —a qué hora llegas—, y la hoja blanca abajo con la parada
 * siguiente marcada.
 *
 * El vidrio aquí sí es vidrio: se sienta sobre el mapa, que tiene color. Y es
 * oscuro, porque encima de un mapa de noche el vidrio claro se lee como una
 * mancha.
 *
 * El aporte sigue visible mientras el viaje pasa. No es un detalle de
 * contabilidad: es la promesa de que el dinero está retenido y todavía no es
 * de nadie.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { type PuestoMio, misViajes } from '@/servicios/panel';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Mapa } from '@/ui/Mapa';
import { Vidrio } from '@/ui/Vidrio';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { Escudo } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const PASAJERA = 'aaaaaaa1-0000-4000-8000-000000000001';

type Parada = { nombre: string; cuando: string; estado: 'pasada' | 'ahora' | 'falta' };

export default function EnRuta() {
  const router = useRouter();
  const [puesto, setPuesto] = useState<PuestoMio | null>(null);

  useEffect(() => {
    misViajes(PASAJERA).then((m) => setPuesto(m.hoy ?? m.proximos[0] ?? null));
  }, []);

  if (!puesto) return <View style={estilos.pantalla} />;

  const llegada = new Date(new Date(puesto.cuando).getTime() + 210 * 60_000).toISOString();
  const paradas: Parada[] = [
    { nombre: puesto.punto, cuando: hora(puesto.cuando), estado: 'pasada' },
    { nombre: 'Divisa · parada de 10 min', cuando: 'ahora', estado: 'ahora' },
    { nombre: puesto.destino, cuando: hora(llegada), estado: 'falta' },
  ];

  return (
    <View style={estilos.pantalla}>
      <Mapa alto={560} noche />
      <BarraDeEstado />

      <View style={estilos.arriba}>
        <Vidrio tono="tinta" radioEsquina={radio.pastilla} estilo={estilos.pastillaLlegada}>
          <View style={estilos.dentroPastilla}>
            <Text style={estilos.epigrafeVidrio}>Llegas</Text>
            <Text style={estilos.horaLlegada}>{hora(llegada)}</Text>
            <View style={estilos.raya} />
            <Text style={estilos.faltaTexto}>{`${restante(llegada)} · ${puesto.distanciaKm} km`}</Text>
          </View>
        </Vidrio>
      </View>

      <View style={estilos.hoja}>
        <View style={estilos.filaEpigrafe}>
          <Text style={estilos.epigrafeVivo}>Vas en camino</Text>
          <Pressable accessibilityRole="button">
            <Text style={estilos.compartir}>Compartir mi llegada</Text>
          </Pressable>
        </View>

        <View style={estilos.paradas}>
          {paradas.map((p, i) => (
            <View key={p.nombre} style={i < paradas.length - 1 ? estilos.parada : estilos.paradaUltima}>
              {i < paradas.length - 1 ? (
                <View
                  style={[
                    estilos.hilo,
                    { backgroundColor: p.estado === 'pasada' ? color.rojo300 : color.ink200 },
                  ]}
                />
              ) : null}
              {/* La parada de ahora lleva un halo rosa alrededor del punto:
                  es lo único de la columna que se mira de un vistazo. */}
              <View style={estilos.hueco}>
                {p.estado === 'ahora' ? <View style={estilos.halo} /> : null}
                <View
                  style={[
                    estilos.punto,
                    p.estado === 'falta' ? estilos.puntoFalta : { backgroundColor: color.rojo500 },
                  ]}
                />
              </View>
              <Text style={[estilos.nombreParada, estilos[p.estado]]}>{p.nombre}</Text>
              <Text style={estilos.cuandoParada}>{p.cuando}</Text>
            </View>
          ))}
        </View>

        <View style={estilos.filaConductor}>
          <View style={estilos.retrato}>
            <Text style={estilos.retratoTexto}>{puesto.iniciales}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.nombreConductor}>{puesto.conductor}</Text>
            <Text style={estilos.carro}>{`Código ${puesto.codigo}`}</Text>
          </View>
        </View>

        {/* El aporte, visible durante todo el camino: sigue retenido. */}
        <View style={estilos.aporte}>
          <Escudo tamano={20} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.aporteCifra}>
              {formatearDineroRedondo(puesto.aporteCentavos)}
            </Text>
            <Text style={estilos.aporteNota}>Se le manda por Yappy al cerrar el viaje.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/** «1 h 38» — lo que falta, sin segundos ni precisión de cronómetro. */
function restante(llegadaISO: string): string {
  const minutos = Math.max(0, Math.round((new Date(llegadaISO).getTime() - Date.now()) / 60_000));
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h === 0 ? `${m} min` : `${h} h ${m}`;
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#17151A',
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  arriba: { paddingTop: 6, paddingHorizontal: 22, alignItems: 'center' },
  pastillaLlegada: { alignSelf: 'center' },
  dentroPastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  epigrafeVidrio: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,.72)',
    fontFamily: familia,
  },
  horaLlegada: {
    fontSize: 17,
    lineHeight: 24.65,
    fontWeight: '600',
    letterSpacing: -0.34,
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },
  raya: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,.24)' },
  faltaTexto: {
    fontSize: 14,
    lineHeight: 20.3,
    color: 'rgba(255,255,255,.8)',
    fontFamily: familia,
    ...tabular,
  },

  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 499.3,
    bottom: 0,
    backgroundColor: color.blanco,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 22,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 30,
    shadowColor: '#26232B',
    shadowOpacity: 0.14,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -12 },
    elevation: 12,
  },

  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  epigrafeVivo: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.rojo600,
    fontFamily: familia,
  },
  compartir: { fontSize: 12.5, lineHeight: 18.125, color: color.ink500, fontFamily: familia },

  paradas: { gap: 2, marginTop: 18 },
  parada: { flexDirection: 'row', gap: 14, paddingBottom: 14 },
  paradaUltima: { flexDirection: 'row', gap: 14 },
  // El hilo que une una parada con la siguiente: rojo si ya pasó.
  hilo: { position: 'absolute', left: 4.25, top: 14, width: 1.5, bottom: 0 },
  hueco: { width: 10, alignItems: 'center' },
  punto: { width: 10, height: 10, borderRadius: 999, marginTop: 4 },
  halo: {
    position: 'absolute',
    top: -1,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: color.rojo100,
  },
  puntoFalta: {
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  nombreParada: { flex: 1, fontSize: 16, lineHeight: 23.2, letterSpacing: -0.288, fontFamily: familia },
  pasada: { fontSize: 15.5, lineHeight: 22.475, letterSpacing: -0.279, color: color.ink600 },
  ahora: { fontWeight: '500', color: color.ink900 },
  falta: { color: color.ink900 },
  cuandoParada: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },

  filaConductor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  retrato: {
    width: 44,
    height: 44,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoTexto: {
    fontSize: 17.6,
    lineHeight: 25.52,
    fontWeight: '600',
    letterSpacing: -0.352,
    color: color.rojo700,
    fontFamily: familia,
  },
  nombreConductor: {
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.288,
    color: color.ink900,
    fontFamily: familia,
  },
  carro: { fontSize: 13, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },

  aporte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    backgroundColor: '#EEF3F8',
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.azul100,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  aporteCifra: {
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  aporteNota: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },
});

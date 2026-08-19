/**
 * `5b` Mis viajes — el lado del pasajero.
 *
 * El de hoy se come la pantalla, con el código de abordaje a 38 px y la cuenta
 * atrás hasta el punto. Los demás caben en una fila cada uno, porque un viaje
 * del sábado no necesita nada más que su hora y su destino.
 *
 * Es la misma idea que el panel del conductor al revés: lo que pasa hoy manda,
 * y lo que no, espera en silencio.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { NOMBRE_DEL_CANAL } from '@/dominio/tarifas';
import { type MisViajes, type PuestoMio, misViajes } from '@/servicios/panel';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Epigrafe } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaAbrev, hora } from '@/ui/fechas';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

/** Mientras no haya sesión, la pasajera del recorrido del diseño. */
const PASAJERA = '99999999-9999-4999-8999-999999999999';

type Pestana = 'proximos' | 'pasados';

export default function MisViajesPantalla() {
  const router = useRouter();
  const [datos, setDatos] = useState<MisViajes | null>(null);
  const [pestana, setPestana] = useState<Pestana>('proximos');

  useEffect(() => {
    misViajes(PASAJERA).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  const hoy = datos.hoy ?? datos.proximos[0] ?? null;
  const lista = (pestana === 'proximos' ? datos.proximos : datos.pasados).filter(
    (p) => p.reservaId !== hoy?.reservaId,
  );

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Text style={estilos.epigrafeCampo}>Mis viajes</Text>
        <Text style={estilos.titular}>
          {hoy ? 'Sales hoy' : 'Tus viajes'}
          {'\n'}
          <Text style={estilos.titularFuerte}>
            {hoy ? `a las ${hora(hoy.cuando)}` : 'guardados'}
          </Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        {hoy ? <Hoy puesto={hoy} alVerPunto={() => router.push('/(pasajero)/codigo')} /> : null}

        <View style={estilos.selector}>
          {(['proximos', 'pasados'] as const).map((p) => (
            <Pressable
              key={p}
              accessibilityRole="tab"
              accessibilityState={{ selected: pestana === p }}
              onPress={() => setPestana(p)}
              style={[estilos.opcion, pestana === p && estilos.opcionActiva]}
            >
              <Text style={[estilos.opcionTexto, pestana === p && estilos.opcionTextoActivo]}>
                {p === 'proximos' ? 'Próximos' : 'Pasados'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={estilos.lista}>
          {lista.map((p, i) => (
            <Pressable
              key={p.reservaId}
              accessibilityRole="button"
              accessibilityLabel={`${p.destino}, ${diaAbrev(p.cuando)} ${hora(p.cuando)}`}
              onPress={() => router.push('/(pasajero)/viaje')}
              style={[estilos.fila, i < lista.length - 1 && estilos.filaConRaya]}
            >
              <Avatar nombre={p.conductor} tamano={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.destino}>{p.destino}</Text>
                <Text style={estilos.detalle}>
                  {`${diaAbrev(p.cuando)} ${hora(p.cuando)} · ${p.conductor}`}
                </Text>
              </View>
              <Text style={estilos.aporte}>{formatearDineroRedondo(p.aporteCentavos)}</Text>
            </Pressable>
          ))}

          {lista.length === 0 ? (
            <Text style={estilos.vacio}>
              {pestana === 'proximos' ? 'No tienes más viajes por delante.' : 'Todavía nada aquí.'}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

/** El de hoy: el código grande y el punto con su cuenta atrás. */
function Hoy({ puesto, alVerPunto }: { puesto: PuestoMio; alVerPunto: () => void }) {
  const faltan = cuantoFalta(puesto.cuando);

  return (
    <View style={estilos.hoja}>
      <View style={estilos.filaPersona}>
        <Avatar nombre={puesto.conductor} tono="rojo" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={estilos.ruta}>{puesto.destino}</Text>
          <Text style={estilos.contexto}>
            {`${puesto.conductor} · ${formatearDineroRedondo(puesto.aporteCentavos)} · ${NOMBRE_DEL_CANAL[puesto.canal as keyof typeof NOMBRE_DEL_CANAL]}`}
          </Text>
        </View>
      </View>

      <View style={estilos.filaCodigo}>
        <View>
          <Epigrafe>Tu código</Epigrafe>
          <Text style={estilos.codigo}>{puesto.codigo}</Text>
        </View>
        <Text style={estilos.punto}>
          {`${puesto.punto}\n`}
          <Text style={estilos.faltan}>{faltan}</Text>
        </Text>
      </View>

      <View style={estilos.botones}>
        <Pressable accessibilityRole="button" onPress={alVerPunto} style={estilos.botonAzul}>
          <Text style={estilos.botonAzulTexto}>Ver el punto</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={estilos.botonQuieto}>
          <Text style={estilos.botonQuietoTexto}>Compartir</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** «en 2 h 20», o «ya salió» si la hora pasó. */
function cuantoFalta(cuandoISO: string): string {
  const minutos = Math.round((new Date(cuandoISO).getTime() - Date.now()) / 60_000);
  if (minutos <= 0) return 'ya salió';
  if (minutos < 60) return `en ${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `en ${h} h` : `en ${h} h ${m}`;
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
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    marginTop: 12,
    fontSize: 30,
    lineHeight: 31.8,
    letterSpacing: -1.35,
    fontWeight: '400',
    color: '#fff',
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 20 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  ruta: {
    fontSize: 16.5,
    lineHeight: 23.925,
    fontWeight: '500',
    letterSpacing: -0.33,
    color: color.ink900,
    fontFamily: familia,
  },
  contexto: {
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
    ...tabular,
  },

  filaCodigo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 14,
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  // 38 px: es lo que se enseña por la ventanilla sin que nadie tenga que
  // acercarse a leerlo.
  codigo: {
    fontSize: 38,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -1.33,
    color: color.ink900,
    marginTop: 7,
    fontFamily: familia,
    ...tabular,
  },
  punto: {
    textAlign: 'right',
    fontSize: 13.5,
    lineHeight: 18.9,
    color: color.ink600,
    fontFamily: familia,
  },
  faltan: { fontWeight: '600', color: color.rojo600 },

  botones: { flexDirection: 'row', gap: 9, marginTop: 20 },
  botonAzul: {
    flex: 1,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAzulTexto: {
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    letterSpacing: -0.14,
    color: '#fff',
    fontFamily: familia,
  },
  botonQuieto: {
    flex: 1,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonQuietoTexto: {
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    letterSpacing: -0.14,
    color: color.ink900,
    fontFamily: familia,
  },

  selector: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 16,
    marginHorizontal: 4,
    backgroundColor: color.sand200,
    borderRadius: radio.pastilla,
    padding: 4,
  },
  opcion: { flex: 1, height: 34, borderRadius: radio.pastilla, alignItems: 'center', justifyContent: 'center' },
  opcionActiva: {
    backgroundColor: color.blanco,
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  opcionTexto: {
    fontSize: 13,
    lineHeight: 18.85,
    fontWeight: '500',
    color: color.ink600,
    fontFamily: familia,
  },
  opcionTextoActivo: { fontWeight: '600', color: color.ink900 },

  lista: { paddingHorizontal: 4, paddingTop: 16 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 },
  filaConRaya: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  destino: {
    fontSize: 15.5,
    lineHeight: 22.475,
    fontWeight: '500',
    letterSpacing: -0.279,
    color: color.ink900,
    fontFamily: familia,
  },
  detalle: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },
  aporte: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  vacio: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink500,
    paddingVertical: 20,
    textAlign: 'center',
    fontFamily: familia,
  },
});

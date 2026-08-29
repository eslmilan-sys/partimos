/**
 * `3d` Salen pronto — todo lo que arranca en las próximas doce horas.
 *
 * Es a donde lleva «Ver todas» de la tira del inicio. La tira enseña seis
 * porque es una tira; aquí caben todas, con el aporte y quién maneja, y
 * partidas por franja para que «esta tarde» y «esta noche» no se lean como
 * una lista sola de veinte horas seguidas.
 *
 * No pide ruta ni fecha: es la pregunta contraria a la del inicio. Allí sabes
 * a dónde vas y buscas cuándo; aquí sabes que quieres salir ya y miras a
 * dónde puedes.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { NOMBRE_DE_FRANJA, type Franja, franjaDe } from '@/dominio/rutinas';
import { enTexto } from '@/dominio/notas';
import { type SalidaCercana, proximasSalidas } from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo, DibujoDelSitio } from '@/ui/CampoRojo';
import { Pestanas } from '@/ui/Pestanas';
import { Avatar, Boton, Epigrafe } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { Atras, Avanza, Estrella } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, radio } from '@/ui/tokens';

/** Doce horas: lo que sale hoy, sin llegar a ser «mañana». */
const VENTANA_MIN = 12 * 60;

export default function SalenPronto() {
  const router = useRouter();
  const volver = useVolver();
  const [salidas, setSalidas] = useState<SalidaCercana[] | null>(null);

  useEffect(() => {
    proximasSalidas(40, VENTANA_MIN).then(setSalidas);
  }, []);

  if (!salidas) return <Cargando altura={196} tarjetas={4} />;

  const porFranja = new Map<Franja, SalidaCercana[]>();
  for (const s of salidas) {
    /* La hora de Panamá, no la del aparato: `getHours()` da la del navegador,
       y con el servidor en UTC las nueve de la noche caían en «la mañana». */
    const f = franjaDe(Number(hora(s.hora).slice(0, 2)));
    const ya = porFranja.get(f);
    if (ya) ya.push(s);
    else porFranja.set(f, [s]);
  }

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

      <CampoRojo altura={196} motivo="tornillo" />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {salidas.length === 1 ? '1 salida' : `${salidas.length} salidas`}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'Salen '}
          <Text style={estilos.titularFuerte}>pronto</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        {salidas.length === 0 ? (
          /* UN VACÍO CON PUERTA. Decía «busca por ruta y día, o publica el
             tuyo» y no daba ninguna de las dos: el consejo y el botón
             estaban en pantallas distintas. Ahora la frase y la acción son
             la misma cosa — buscar arriba, porque quien llega aquí es
             pasajero; publicar debajo, en voz baja, por si no lo es. */
          <View style={estilos.vacio}>
            <Text style={estilos.vacioTitulo}>Nadie sale en las próximas doce horas.</Text>
            <Text style={estilos.vacioTexto}>
              Casi todo se publica con un día de anticipación. Di a dónde vas y mira los
              próximos días.
            </Text>
            <View style={{ marginTop: 14 }}>
              <Boton tamano="md" ancho alPulsar={() => router.replace('/')}>
                Buscar por ruta y día
              </Boton>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Publicar mi viaje"
              onPress={() => router.push('/(conductor)/publicar')}
              style={estilos.vacioEnlace}
            >
              <Text style={estilos.vacioEnlaceTexto}>¿Manejas tú? Publica el tuyo</Text>
              <Avanza tamano={14} tinta={color.ink500} />
            </Pressable>
          </View>
        ) : (
          [...porFranja.entries()].map(([franja, deLaFranja], i) => (
            <View key={franja} style={i > 0 ? { marginTop: 22 } : undefined}>
              <View style={estilos.filaSeccion}>
                <Epigrafe>{`Salen por ${NOMBRE_DE_FRANJA[franja]}`}</Epigrafe>
                <Text style={estilos.cuantos}>
                  {deLaFranja.length === 1 ? '1 viaje' : `${deLaFranja.length} viajes`}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {deLaFranja.map((s) => (
                  <Pressable
                    key={s.viajeId}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.destino} a las ${hora(s.hora)}, ${formatearDineroRedondo(s.aporteCentavos)} por puesto`}
                    onPress={() =>
                      router.push({ pathname: '/(pasajero)/viaje', params: { viaje: s.viajeId } })
                    }
                    style={({ pressed }) => [estilos.fila, pressed && { backgroundColor: color.sand100 }]}
                  >
                    <View style={estilos.cuadro}>
                      <DibujoDelSitio slug={s.foto} tamano={34} />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={estilos.filaHora}>
                        <Text style={estilos.horaSalida}>{hora(s.hora)}</Text>
                        <Text style={estilos.destino} numberOfLines={1}>
                          {s.destino}
                        </Text>
                      </View>
                      <View style={estilos.filaQuien}>
                        <Avatar nombre={s.conductor || '·'} tamano={20} />
                        <Text style={estilos.quien} numberOfLines={1}>
                          {s.conductor}
                        </Text>
                        {s.calificacion != null ? (
                          <>
                            <Estrella tamano={10} />
                            <Text style={estilos.nota}>{enTexto(s.calificacion)}</Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={estilos.precio}>
                        {formatearDineroRedondo(s.aporteCentavos)}
                      </Text>
                      <Text style={estilos.puestos}>
                        {s.puestosLibres === 1 ? '1 puesto' : `${s.puestosLibres} puestos`}
                      </Text>
                    </View>
                    <Avanza />
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
      </ScrollView>

      <Pestanas valor="Buscar" />
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

  /* El relleno de abajo empuja el cuerpo por debajo del campo: sin él, el
     epígrafe de la primera sección quedaba escrito sobre el rojo. */
  cabecera: { paddingHorizontal: espacio.gutter, paddingBottom: 6 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    fontSize: 11.5,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 14, },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 14, paddingBottom: 20 },
  filaSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  cuantos: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, fontFamily: familia },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  cuadro: {
    width: 48,
    height: 48,
    borderRadius: radio.control,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaHora: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  horaSalida: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.57,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  destino: { flex: 1, fontSize: 14, lineHeight: 21, color: color.ink700, fontFamily: familia },
  filaQuien: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  quien: { fontSize: 12.5, lineHeight: 18, color: color.ink600, fontFamily: familia },
  nota: { fontSize: 12.5, lineHeight: 18, color: color.ink600, fontFamily: familia, ...tabular },

  precio: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.63,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  puestos: { fontSize: 11.5, lineHeight: 16, color: color.ink500, fontFamily: familia },

  vacio: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    borderRadius: radio.l,
    padding: 20,
    gap: 4,
  },
  vacioTitulo: {
    fontSize: 15.5,
    lineHeight: 21.75,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  vacioTexto: { fontSize: 13.5, lineHeight: 20, color: color.ink600, fontFamily: familia },
  vacioEnlace: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  vacioEnlaceTexto: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    color: color.ink500,
    fontFamily: familia,
  },
});

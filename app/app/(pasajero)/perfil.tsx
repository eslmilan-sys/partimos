/**
 * `6b` Perfil público — lo que ve el otro antes de subirse.
 *
 * Reseñas de verdad, no una nota sola: la reputación se lee, no se resume.
 * «Cédula verificada» va como estado, nunca como filtro ni como distintivo que
 * separe a unos conductores de otros — todos la tienen para poder publicar.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';
import { enTexto } from '@/dominio/notas';

import { type PerfilPublico, perfilPublico } from '@/servicios/perfiles';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { NoEsta } from '@/ui/NoEsta';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Epigrafe, Insignia } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras, Estrella } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

const TONOS = {
  verde: { fondo: color.hechoFondo, tinta: color.hechoTinta, punto: true },
  rojo: { fondo: color.rojo50, tinta: color.rojo700, punto: false },
  neutro: { fondo: color.sand200, tinta: color.ink700, punto: false },
} as const;

export default function Perfil() {
  const router = useRouter();
  const volver = useVolver();
  const { perfil: perfilParam } = useLocalSearchParams<{ perfil?: string }>();
  const [datos, setDatos] = useState<PerfilPublico | null>(null);
  const [noEsta, setNoEsta] = useState(false);

  useEffect(() => {
    perfilPublico(perfilParam ?? DEL_RECORRIDO).then(setDatos).catch(() => setNoEsta(true));
  }, [perfilParam]);

  if (noEsta) return <NoEsta titulo="No encontramos ese perfil" explicacion="La cuenta pudo cerrarse, o el enlace es de otra persona." />;
  if (!datos) return <Cargando />;

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

      <CampoRojo altura={214} />

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
          <Text style={estilos.epigrafeCampo}>Perfil público</Text>
        </View>

        <View style={estilos.filaPersona}>
          <View style={estilos.retrato}>
            <Text style={estilos.retratoTexto}>{datos.iniciales}</Text>
          </View>
          <View style={{ minWidth: 0 }}>
            <Text style={estilos.nombre}>{datos.nombre}</Text>
            <Text style={estilos.resumen}>
              {[
                datos.calificacion != null ? enTexto(datos.calificacion) : null,
                `${datos.viajes} viajes`,
                `desde ${datos.desde}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          <View style={estilos.distintivos}>
            {datos.distintivos.map((d) => {
              const t = TONOS[d.tono];
              return (
                <Insignia key={d.texto} fondo={t.fondo} tinta={t.tinta} punto={t.punto}>
                  {d.texto}
                </Insignia>
              );
            })}
          </View>

          {datos.bio ? <Text style={estilos.bio}>{datos.bio}</Text> : null}

          {datos.bio ? null : (
            <Text style={estilos.sinNada}>
              Todavía no ha escrito nada sobre sí. Se conoce por sus viajes.
            </Text>
          )}

          {datos.carro ? (
            <View style={estilos.filaCarro}>
              <Text style={estilos.carroModelo}>{datos.carro.modelo}</Text>
              <Text style={estilos.carroPunto}>·</Text>
              <Text style={estilos.carroColor}>{datos.carro.color}</Text>
              <View style={estilos.placa}>
                <Text style={estilos.placaTexto}>{datos.carro.placa}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={estilos.seccionResenas}>
          <Epigrafe>Lo que dicen sus pasajeros</Epigrafe>

          {/* Una sección con el título y nada debajo se lee como un fallo. Sin
              reseñas la respuesta es decirlo: aquí nadie empieza con nota. */}
          {datos.resenas.length === 0 ? (
            <Text style={estilos.sinResenas}>
              {datos.viajes === 0
                ? 'Todavía no ha viajado con nadie. Todo el mundo empieza así.'
                : 'Nadie ha escrito todavía. Las reseñas se piden al bajar del carro.'}
            </Text>
          ) : null}

          {datos.resenas.map((r, i) => (
            <View
              key={r.id}
              style={[
                estilos.resena,
                i < datos.resenas.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: color.bordeSutil,
                },
              ]}
            >
              <Avatar nombre={r.autor} tamano={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={estilos.filaAutor}>
                  <Text style={estilos.autor}>{r.autor}</Text>
                  <View style={estilos.filaEstrella}>
                    <Estrella tamano={10} />
                    <Text style={estilos.nota}>{enTexto(r.estrellas)}</Text>
                  </View>
                </View>
                <Text style={estilos.textoResena}>{r.texto}</Text>
              </View>
            </View>
          ))}

          {datos.totalResenas > datos.resenas.length ? (
            <Text style={estilos.verTodas}>{`Ver las ${datos.totalResenas} reseñas`}</Text>
          ) : null}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  sinNada: {
    fontSize: 14,
    lineHeight: 21,
    color: color.ink500,
    fontFamily: familia,
    marginTop: 12,
  },
  sinResenas: {
    fontSize: 14,
    lineHeight: 21,
    color: color.ink500,
    fontFamily: familia,
    marginTop: 12,
  },
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingHorizontal: espacio.gutter },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },

  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 20 },
  retrato: {
    width: 66,
    height: 66,
    borderRadius: radio.cuadrado,
    backgroundColor: color.ink100,
    borderWidth: 1.5,
    borderColor: 'rgba(10,39,49,.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoTexto: { fontSize: 23, lineHeight: interlinea(23), fontWeight: '600', color: color.ink700, fontFamily: familia },
  nombre: {
    fontSize: 27,
    lineHeight: interlinea(26),
    fontWeight: '600',
    letterSpacing: -1.04,
    color: color.ink900,
    fontFamily: familia,
  },
  resumen: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.campoTexto,
    marginTop: 4,
    fontFamily: familia,
    ...tabular,
  },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 26, paddingBottom: 26 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    padding: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  distintivos: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  bio: { fontSize: 14, lineHeight: 21.75, color: color.ink700, marginTop: 16, fontFamily: familia },

  filaCarro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  carroModelo: { fontSize: 14, lineHeight: interlinea(14), fontWeight: '500', color: color.ink700, fontFamily: familia },
  carroPunto: { fontSize: 14, lineHeight: interlinea(14), color: color.ink500, fontFamily: familia },
  carroColor: { fontSize: 14, lineHeight: interlinea(14), color: color.ink700, fontFamily: familia },
  placa: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: color.sand200,
  },
  placaTexto: {
    fontSize: 13.5,
    lineHeight: interlinea(13),
    fontWeight: '500',
    letterSpacing: 0.26,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  seccionResenas: { paddingHorizontal: 4, paddingTop: 24 },
  resena: { flexDirection: 'row', gap: 13, paddingVertical: 16 },
  filaAutor: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  autor: { flex: 1, fontSize: 14, lineHeight: interlinea(14.5), fontWeight: '500', color: color.ink900, fontFamily: familia },
  filaEstrella: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nota: { fontSize: 12.5, lineHeight: interlinea(12.5), color: color.ink600, fontFamily: familia, ...tabular },
  textoResena: { fontSize: 13.5, lineHeight: 19.57, color: color.ink700, marginTop: 5, fontFamily: familia },
  verTodas: {
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    fontWeight: '600',
    color: color.rojo600,
    paddingTop: 6,
    fontFamily: familia,
  },
});

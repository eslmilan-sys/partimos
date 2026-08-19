/**
 * `3c` Resultados con el destino de fondo.
 *
 * La misma lista de `1b`, pero con la fotografía del destino detrás del bloque
 * rojo. La foto sólo aparece cuando el destino **ya está elegido**: ahí informa
 * —dice a qué se va— en vez de decorar. En la búsqueda abierta no hay foto,
 * porque todavía no hay destino que enseñar.
 *
 * El bloque rojo se recorta por la izquierda contra el borde de la pantalla,
 * como una banda que sale de la foto.
 */

import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { etiquetaDeMaletero } from '@/dominio/equipaje';
import {
  type ResumenDeRuta,
  type ViajeEnResultados,
  buscarViajes,
  proximoDiaConViajes,
  resumenDeRuta,
} from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { BarraDePestanas } from '@/ui/BarraDePestanas';
import { Insignia, Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaAbrev, diaCorto, hora } from '@/ui/fechas';
import { Atras, Carro, Chat, Estrella, Lupa, Maleta, Persona } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const FOTOS: Record<string, number> = {
  coronado: require('../../assets/playa-blanca.jpeg'),
  chitre: require('../../assets/chitre.jpeg'),
  david: require('../../assets/david.jpeg'),
  santiago: require('../../assets/boquete.jpeg'),
};

export default function Destino() {
  const router = useRouter();
  const [ruta, setRuta] = useState<ResumenDeRuta | null>(null);
  const [viajes, setViajes] = useState<ViajeEnResultados[]>([]);

  useEffect(() => {
    (async () => {
      setRuta(await resumenDeRuta('panama-coronado', 2));
      const fecha = await proximoDiaConViajes('panama', 'coronado');
      setViajes(await buscarViajes('panama', 'coronado', fecha));
    })();
  }, []);

  if (!ruta) return <View style={estilos.pantalla} />;

  const [primero, ...resto] = viajes;

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.foto}>
        {FOTOS[ruta.foto] ? (
          <Image source={FOTOS[ruta.foto]} style={estilos.imagen} resizeMode="cover" />
        ) : null}
        {/* La foto se oscurece sólo arriba, donde va la barra de estado. */}
        <LinearGradient
          colors={['rgba(23,21,26,.44)', 'rgba(23,21,26,0)']}
          locations={[0, 0.34]}
          style={estilos.velo}
        />
      </View>

      <BarraDeEstado />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecera}>
          <View style={estilos.filaSuperior}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atrás"
              onPress={() => router.back()}
              style={estilos.circulo}
            >
              <Atras />
            </Pressable>
            <View style={estilos.pastillaDia}>
              <Text style={estilos.pastillaDiaTexto}>
                {primero ? mayuscula(diaCorto(primero.departure_at!)) : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={estilos.banda}>
          <Text style={estilos.epigrafeBanda}>{ruta.contexto}</Text>
          <Text style={estilos.titular}>
            {`${ruta.origen} →`}
            {'\n'}
            <Text style={estilos.titularFuerte}>{ruta.destino}</Text>
          </Text>
          <Text style={estilos.debajo}>
            {`${ruta.distanciaKm} km · ${enHoras(ruta.duracionMin)} · ${ruta.cuantosViajes} viajes`}
          </Text>
        </View>

        <View style={estilos.lista}>
          {primero ? <Detallada viaje={primero} alPulsar={() => router.push('/(pasajero)/viaje')} /> : null}

          {resto.map((v) => (
            <Pressable
              key={v.id}
              accessibilityRole="button"
              onPress={() => router.push('/(pasajero)/viaje')}
              style={estilos.compacta}
            >
              <Text style={estilos.compactaCuando}>
                {`${diaAbrev(v.departure_at!)} ${hora(v.departure_at!)}`}
              </Text>
              <Text style={estilos.compactaRuta} numberOfLines={1}>
                {`${(v.origin_label ?? '').split(' · ')[0]} → `}
                <Text style={estilos.compactaRutaFuerte}>
                  {(v.destination_label ?? '').split(' · ')[0]}
                </Text>
              </Text>
              <Text style={estilos.compactaPrecio}>
                {formatearDineroRedondo(Number(v.price_cents ?? 0))}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <BarraDePestanas
          valor="Buscar"
          pestanas={[
            { valor: 'Buscar', etiqueta: 'Buscar', icono: (a) => <Lupa tinta={tinta(a)} /> },
            { valor: 'Mis viajes', etiqueta: 'Mis viajes', icono: (a) => <Carro tamano={21} tinta={tinta(a)} /> },
            { valor: 'Mensajes', etiqueta: 'Mensajes', icono: (a) => <Chat tinta={tinta(a)} /> },
            { valor: 'Perfil', etiqueta: 'Perfil', icono: (a) => <Persona tinta={tinta(a)} /> },
          ]}
        />
      </View>
    </View>
  );
}

const tinta = (activo: boolean) => (activo ? color.rojo600 : color.ink700);

/** La primera tarjeta va entera: puntos, equipaje y quién maneja. */
function Detallada({ viaje, alPulsar }: { viaje: ViajeEnResultados; alPulsar: () => void }) {
  const soloMujeres = viaje.gender_preference === 'women_only';
  const nombre = `${viaje.first_name ?? ''} ${viaje.last_initial ?? ''}`.trim();
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Pressable accessibilityRole="button" onPress={alPulsar} style={estilos.tarjeta}>
      <View style={estilos.filaPrecio}>
        <Text style={estilos.cuando}>
          {`${diaAbrev(viaje.departure_at!)} ${hora(viaje.departure_at!)} · ${duracion(viaje.departure_at!, viaje.arrival_estimate_at)}`}
        </Text>
        <View style={estilos.precioBloque}>
          <Text style={estilos.precio}>{formatearDineroRedondo(Number(viaje.price_cents ?? 0))}</Text>
          <Pastilla>{`${viaje.seats_available ?? 0} puestos`}</Pastilla>
        </View>
      </View>

      <View style={estilos.puntos}>
        <View style={estilos.filaPunto}>
          <View style={estilos.puntoLleno} />
          <Text style={estilos.punto}>{(viaje.origin_label ?? '').split(' · ')[0]}</Text>
        </View>
        <View style={estilos.filaPunto}>
          <View style={estilos.puntoVacio} />
          <Text style={estilos.punto}>{viaje.destination_label ?? ''}</Text>
          <Text style={[estilos.horaLlegada, { marginLeft: 'auto' }]}>
            {viaje.arrival_estimate_at ? hora(viaje.arrival_estimate_at) : ''}
          </Text>
        </View>
      </View>

      <View style={estilos.filaEquipaje}>
        <Maleta tamano={13} />
        <Text style={estilos.equipaje}>
          {`${etiquetaDeMaletero(viaje.accepts_luggage)}${soloMujeres ? ' · solo mujeres' : ''}`}
        </Text>
      </View>

      <View style={estilos.raya} />

      <View style={estilos.filaConductor}>
        <View style={estilos.retrato}>
          <Text style={estilos.retratoTexto}>{iniciales}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={estilos.nombre}>{nombre}</Text>
          <View style={estilos.filaNota}>
            <Estrella tamano={11} />
            <Text style={estilos.nota}>
              {`${(viaje.driver_rating ?? 0).toFixed(1)} · ${categoria(viaje.category_code)}`}
            </Text>
          </View>
        </View>
        {soloMujeres ? (
          <Insignia fondo={color.rojo50} tinta={color.rojo700}>
            Solo mujeres
          </Insignia>
        ) : null}
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function enHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

function duracion(salida: string, llegada: string | null): string {
  if (!llegada) return '';
  return enHoras(Math.round((new Date(llegada).getTime() - new Date(salida).getTime()) / 60_000));
}

function categoria(code: string | null): string {
  return code === 'suv' ? 'SUV' : code === 'economy' ? 'Económico' : 'Estándar';
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

  foto: { position: 'absolute', top: 0, left: 0, right: 0, height: 326 },
  imagen: { width: '100%', height: '100%' },
  velo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 2 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    // Aquí sí es vidrio: se sienta sobre una fotografía, que es algo con color.
    backgroundColor: 'rgba(255,255,255,.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastillaDia: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: radio.pastilla,
    backgroundColor: 'rgba(255,255,255,.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.16)',
    justifyContent: 'center',
  },
  pastillaDiaTexto: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },

  // La banda roja sale del borde izquierdo: sólo redondea por la derecha.
  banda: {
    width: 318,
    marginTop: 86,
    backgroundColor: color.rojo500,
    borderTopRightRadius: radio.l,
    borderBottomRightRadius: radio.l,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: espacio.gutter,
    shadowColor: 'rgb(140,10,34)',
    shadowOpacity: 0.6,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  epigrafeBanda: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 31,
    lineHeight: 32.55,
    letterSpacing: -1.395,
    fontWeight: '400',
    color: '#fff',
    marginTop: 9,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },
  debajo: {
    fontSize: 13,
    lineHeight: 18.85,
    color: 'rgba(255,255,255,.82)',
    marginTop: 8,
    fontFamily: familia,
    ...tabular,
  },

  lista: { paddingHorizontal: espacio.gutter, paddingTop: 18, gap: 10 },

  pie: { paddingTop: 8, paddingHorizontal: 14, paddingBottom: 22 },

  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 18,
    paddingHorizontal: 19,
  },
  filaPrecio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  cuando: { fontSize: 13, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },
  precioBloque: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  precio: {
    fontSize: 26,
    lineHeight: 24.7,
    fontWeight: '700',
    letterSpacing: -1.04,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  puntos: { gap: 9, marginTop: 14 },
  filaPunto: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  puntoLleno: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.azul700 },
  puntoVacio: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: color.blanco,
    borderWidth: 1.5,
    borderColor: color.ink200,
  },
  punto: {
    fontSize: 15.5,
    lineHeight: 22.475,
    fontWeight: '500',
    letterSpacing: -0.279,
    color: color.ink900,
    fontFamily: familia,
  },
  horaLlegada: {
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink400,
    fontFamily: familia,
    ...tabular,
  },

  filaEquipaje: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  equipaje: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },

  raya: { height: 1, backgroundColor: color.bordeSutil, marginTop: 14 },

  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 13 },
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

  compacta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 15,
    paddingHorizontal: 19,
  },
  compactaCuando: {
    width: 62,
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  compactaRuta: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 22.475,
    letterSpacing: -0.279,
    color: color.ink900,
    fontFamily: familia,
  },
  compactaRutaFuerte: { fontWeight: '500' },
  compactaPrecio: {
    fontSize: 19,
    lineHeight: 27.55,
    fontWeight: '700',
    letterSpacing: -0.665,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
});

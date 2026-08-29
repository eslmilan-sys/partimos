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

import { ciudadYPunto, soloCiudad } from '@/dominio/comoSeLlama';
import { enTexto } from '@/dominio/notas';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import {
  type ResumenDeRuta,
  type ViajeEnResultados,
  buscarViajes,
  proximoDiaConViajes,
  resumenDeRuta,
} from '@/servicios/viajes';
import { CIUDAD_POR_DEFECTO } from '@/servicios/lugares';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { Pestanas } from '@/ui/Pestanas';
import { Insignia, Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { duracionEntre as duracion, diaAbrev, diaCorto, enHoras, hora } from '@/ui/fechas';
import { Atras, Escudo, Estrella } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const FOTOS: Record<string, number> = {
  coronado: require('../../assets/playa-blanca.jpeg'),
  chitre: require('../../assets/chitre.jpeg'),
  david: require('../../assets/david.jpeg'),
  santiago: require('../../assets/boquete.jpeg'),
};

export default function Destino() {
  const router = useRouter();
  const volver = useVolver();
  const [ruta, setRuta] = useState<ResumenDeRuta | null>(null);
  const [viajes, setViajes] = useState<ViajeEnResultados[]>([]);

  useEffect(() => {
    (async () => {
      setRuta(await resumenDeRuta('panama-coronado', 2));
      const fecha = await proximoDiaConViajes(CIUDAD_POR_DEFECTO, 'coronado');
      setViajes(await buscarViajes(CIUDAD_POR_DEFECTO, 'coronado', fecha));
    })();
  }, []);

  if (!ruta) return <Cargando />;

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
              onPress={() => volver()}
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
          {primero ? <Detallada viaje={primero} alPulsar={() => router.push({ pathname: '/(pasajero)/viaje', params: { viaje: primero.id } })} /> : null}

          {resto.map((v) => (
            <Pressable
              key={v.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/(pasajero)/viaje', params: { viaje: v.id } })}
              style={estilos.compacta}
            >
              <Text style={estilos.compactaCuando}>
                {`${diaAbrev(v.departure_at!)} ${hora(v.departure_at!)}`}
              </Text>
              <Text style={estilos.compactaRuta} numberOfLines={1}>
                {`${soloCiudad(v.origin_city, v.origin_label)} → `}
                <Text style={estilos.compactaRutaFuerte}>
                  {soloCiudad(v.destination_city, v.destination_label)}
                </Text>
              </Text>
              <Text style={estilos.compactaPrecio}>
                {formatearDineroRedondo(Number(v.price_cents ?? 0))}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

        <Pestanas valor="Buscar" />
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
          <Text style={estilos.punto}>{ciudadYPunto(viaje.origin_city, viaje.origin_label)}</Text>
        </View>
        <View style={estilos.filaPunto}>
          <View style={estilos.puntoVacio} />
          <Text style={estilos.punto}>{viaje.destination_label ?? ''}</Text>
          <Text style={[estilos.horaLlegada, { marginLeft: 'auto' }]}>
            {viaje.arrival_estimate_at ? hora(viaje.arrival_estimate_at) : ''}
          </Text>
        </View>
      </View>

      {/* EL ICONO DICE LO MISMO QUE LA PALABRA. Iba una MALETA junto a
          «Cédula verificada» y junto a «Solo mujeres»: el icono del equipaje
          para hablar de identidad. El escudo es el que el sistema usa para
          lo verificado, y es el que sale en la ficha del viaje. */}
      <View style={estilos.filaEquipaje}>
        <Escudo tamano={13} tinta={color.ink500} />
        <Text style={estilos.equipaje}>
          {soloMujeres ? 'Solo mujeres' : 'Cédula verificada'}
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
            {/* LA ESTRELLA SÓLO SI HAY NOTA. Se pintaba siempre, y a un
                conductor sin calificar todavía le salía «★ SUV»: una estrella
                señalando a un modelo de carro. La estrella no es un adorno de
                la fila, es el símbolo de un número que aquí puede no existir. */}
            {viaje.driver_rating != null ? (
              <>
                <Estrella tamano={11} />
                <Text style={estilos.nota}>{enTexto(viaje.driver_rating)}</Text>
                <Text style={estilos.nota}>·</Text>
              </>
            ) : null}
            <Text style={estilos.nota}>{categoria(viaje.category_code)}</Text>
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


function categoria(code: string | null): string {
  return code === 'suv' ? 'SUV' : code === 'economy' ? 'Económico' : 'Estándar';
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
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
    // Aquí sí es vidrio: se sienta sobre una fotografía, que es algo con
    // color. Blanco, no tinta translúcida: ver `pastillaDia`.
    backgroundColor: 'rgba(255,255,255,.92)',
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * SOBRE UNA FOTO, EL CRISTAL TIENE QUE SER BLANCO, no tinta al 6 %. La
   * pastilla y el botón de atrás se sientan encima de una fotografía de playa
   * —cielo casi blanco arriba, palmeras oscuras abajo—, y `campoControl` es
   * tinta translúcida: sobre el cielo desaparecía y sobre las palmeras se
   * volvía un borrón. Un fondo blanco al 92 % da un contraste que no depende
   * de qué foto toque (29-08-2026).
   */
  pastillaDia: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: radio.pastilla,
    backgroundColor: 'rgba(255,255,255,.92)',
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
    justifyContent: 'center',
  },
  pastillaDiaTexto: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '600',
    color: color.ink700,
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
  /**
   * LOS TRES RENGLONES DE LA BANDA VAN EN BLANCO, y no era así.
   *
   * La banda sigue siendo ROJA —es la única pantalla donde el campo rojo del
   * sistema anterior sobrevive, porque aquí sale de una fotografía y tiene
   * sentido—, pero sus tres textos se quedaron con las tintas del lienzo
   * claro al que emigró el resto de la app: el epígrafe en `campoTexto`
   * (1,05:1 sobre el rojo), el titular en `ink900` y la línea de abajo en
   * `ink600` (1,30:1). Es decir: «FIN DE SEMANA · 2 PASAJEROS» y «85 km ·
   * 1 h 15 · 11 viajes» eran invisibles, y «Panamá → Coronado» casi.
   * Sobre rojo pleno la única tinta que se lee es el blanco (29-08-2026).
   */
  epigrafeBanda: {
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,.82)',
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.blanco, fontFamily: familia, marginTop: 9, },
  titularFuerte: { fontWeight: '600' },
  debajo: {
    fontSize: 13.5,
    lineHeight: 18.85,
    color: 'rgba(255,255,255,.88)',
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
  cuando: { fontSize: 13.5, lineHeight: 18.85, color: color.ink500, fontFamily: familia, ...tabular },
  precioBloque: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  precio: {
    fontSize: 27,
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
    fontSize: 13.5,
    lineHeight: 18.85,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },

  filaEquipaje: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  equipaje: { fontSize: 12.5, lineHeight: 18.125, color: color.ink500, fontFamily: familia },

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
    fontSize: 14,
    lineHeight: 21.025,
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  filaNota: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nota: { fontSize: 13.5, lineHeight: 18.85, color: color.ink500, fontFamily: familia, ...tabular },

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
    color: color.ink500,
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

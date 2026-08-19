/**
 * `3a` Inicio — la búsqueda, las rutas y el gancho de conductor.
 *
 * El campo rojo entero, con la silueta de la ciudad al pie. La hoja blanca
 * monta sobre su borde y lleva la única acción azul de la pantalla. El
 * degradado del amanecer aparece una sola vez, en la tarjeta que invita a
 * publicar.
 */

import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import {
  type GanchoDeConductor,
  type RutaPopular,
  ganchoDeConductor,
  rutasPopulares,
} from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { BarraDePestanas } from '@/ui/BarraDePestanas';
import { Amanecer, CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Carro, Chat, Lupa, Marca, Mas, Persona } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

const FOTOS: Record<string, number> = {
  chitre: require('../../assets/chitre.jpeg'),
  coronado: require('../../assets/playa-blanca.jpeg'),
  david: require('../../assets/david.jpeg'),
  'las-tablas': require('../../assets/venao.webp'),
};

/** Los puestos se escriben con letra: en una frase, «tres» se lee y «3» se cuenta. */
const LETRAS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
const enLetra = (n: number) => LETRAS[n] ?? String(n);

export default function Inicio() {
  const router = useRouter();
  const [rutas, setRutas] = useState<RutaPopular[]>([]);
  const [gancho, setGancho] = useState<GanchoDeConductor | null>(null);

  useEffect(() => {
    rutasPopulares().then(setRutas);
    ganchoDeConductor().then(setGancho);
  }, []);

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={326} motivo="skyline" />

      <BarraDeEstado />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecera}>
          <View style={estilos.filaSaludo}>
            <Text style={estilos.saludo}>
              {'Hola, '}
              <Text style={estilos.saludoFuerte}>Milan</Text>
            </Text>
            <Marca />
          </View>
          <Text style={estilos.titular}>
            {'¿A dónde'}
            {'\n'}
            <Text style={estilos.titularFuerte}>vas hoy?</Text>
          </Text>
        </View>

        <View style={estilos.hoja}>
          <View style={estilos.filaLugar}>
            <View style={estilos.puntoLleno} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.etiquetaLugar}>Desde</Text>
              <Text style={estilos.valorLugar}>Ciudad de Panamá</Text>
            </View>
          </View>

          <View style={[estilos.filaLugar, estilos.filaConLinea]}>
            <View style={estilos.puntoVacio} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.etiquetaLugar}>Hacia</Text>
              <Text style={[estilos.valorLugar, { color: color.ink400 }]}>
                Chitré, David, Santiago…
              </Text>
            </View>
          </View>

          <View style={estilos.filaCajas}>
            <View style={estilos.caja}>
              <Text style={estilos.etiquetaCaja}>Cuándo</Text>
              <Text style={estilos.valorCaja}>Hoy</Text>
            </View>
            <View style={estilos.caja}>
              <Text style={estilos.etiquetaCaja}>Pasajeros</Text>
              <Text style={[estilos.valorCaja, tabular]}>1 pasajero</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Boton tono="azul" alPulsar={() => router.push('/(pasajero)/resultados')}>
              Buscar viajes
            </Boton>
          </View>
        </View>

        <View style={estilos.seccionRutas}>
          <View style={estilos.filaSeccion}>
            <Epigrafe>Rutas populares</Epigrafe>
            <Text style={estilos.verTodas}>Ver todas</Text>
          </View>

          {rutas.map((r, i) => (
            <Pressable
              key={r.slug}
              accessibilityRole="button"
              accessibilityLabel={`Panamá a ${r.destino}`}
              onPress={() => router.push('/(pasajero)/resultados')}
              style={[estilos.filaRuta, i > 0 && estilos.filaRutaConLinea]}
            >
              <View style={estilos.miniatura}>
                {FOTOS[r.foto] ? (
                  <Image source={FOTOS[r.foto]} style={estilos.foto} resizeMode="cover" />
                ) : null}
              </View>
              <Text style={estilos.nombreRuta} numberOfLines={1}>
                {`${r.origen} → `}
                <Text style={estilos.nombreRutaFuerte}>{r.destino}</Text>
              </Text>
              <Text style={estilos.desde}>desde</Text>
              <Text style={estilos.precioRuta}>{formatearDineroRedondo(r.desdeCentavos)}</Text>
            </Pressable>
          ))}
        </View>

        {gancho ? (
          <View style={estilos.seccionGancho}>
            <View style={estilos.tarjetaGancho}>
              <Amanecer alto={140} />
              <View style={estilos.filaGancho}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.cifraGancho}>
                    {formatearDineroRedondo(gancho.recuperasCentavos)}
                  </Text>
                  <Text style={estilos.fraseGancho}>
                    {'Lo que '}
                    <Text style={estilos.fraseGanchoFuerte}>recuperas</Text>
                    {` llevando ${enLetra(gancho.puestos)} puestos a ${gancho.destino}`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(conductor)/publicar')}
                  style={estilos.botonPublicar}
                >
                  <Text style={estilos.botonPublicarTexto}>Publicar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
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
          fab={{
            etiqueta: 'Publicar un viaje',
            icono: <Mas tamano={20} tinta="#fff" />,
            alPulsar: () => router.push('/(conductor)/publicar'),
          }}
        />
      </View>
    </View>
  );
}

const tinta = (activo: boolean) => (activo ? color.rojo600 : color.ink700);

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 8 },
  filaSaludo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  saludo: { fontSize: 15.5, lineHeight: 22.47, fontWeight: '500', letterSpacing: -0.19, color: '#fff', fontFamily: familia },
  saludoFuerte: { fontWeight: '600' },
  titular: {
    fontSize: 36,
    lineHeight: 36.72,
    letterSpacing: -1.62,
    fontWeight: '400',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  hoja: {
    marginHorizontal: 22,
    marginTop: 22,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    padding: 18,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  filaLugar: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 8 },
  filaConLinea: { borderTopWidth: 1, borderTopColor: color.bordeSutil },
  puntoLleno: { width: 10, height: 10, borderRadius: radio.pastilla, backgroundColor: color.rojo500 },
  puntoVacio: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  etiquetaLugar: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink400,
    fontFamily: familia,
  },
  valorLugar: { fontSize: 16.5, lineHeight: 23.93, letterSpacing: -0.33, color: color.ink900, marginTop: 2, fontFamily: familia },

  filaCajas: { flexDirection: 'row', gap: 10, marginTop: 12 },
  caja: {
    flex: 1,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  etiquetaCaja: {
    fontSize: 10.5, lineHeight: 15.22,
    fontWeight: '600',
    letterSpacing: 10.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink400,
    fontFamily: familia,
  },
  valorCaja: { fontSize: 15, lineHeight: 21.75, fontWeight: '500', color: color.ink900, marginTop: 2, fontFamily: familia },

  seccionRutas: { paddingHorizontal: espacio.gutter, paddingTop: 18 },
  filaSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  verTodas: { fontSize: 13, lineHeight: 18.85, fontWeight: '500', color: color.rojo600, fontFamily: familia },
  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11 },
  filaRutaConLinea: { borderTopWidth: 1, borderTopColor: color.bordeSutil },
  miniatura: {
    width: 52,
    height: 40,
    borderRadius: radio.s,
    overflow: 'hidden',
    backgroundColor: color.sand200,
  },
  foto: { width: '100%', height: '100%' },
  nombreRuta: { flex: 1, fontSize: 16.5, lineHeight: 23.93, letterSpacing: -0.36, color: color.ink900, fontFamily: familia },
  nombreRutaFuerte: { fontWeight: '600' },
  desde: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, fontFamily: familia },
  precioRuta: {
    fontSize: 16, lineHeight: 23.2,
    fontWeight: '700',
    letterSpacing: -0.56,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  seccionGancho: { paddingHorizontal: 22, paddingTop: 16 },
  tarjetaGancho: {
    borderRadius: radio.hoja,
    paddingVertical: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: color.blanco,
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filaGancho: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  cifraGancho: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.35,
    lineHeight: 30,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  fraseGancho: {
    fontSize: 15,
    lineHeight: 20.25,
    marginTop: 8,
    maxWidth: 190,
    color: color.ink900,
    fontFamily: familia,
  },
  fraseGanchoFuerte: { fontWeight: '600' },
  botonPublicar: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPublicarTexto: {
    fontSize: 14, lineHeight: 20.3,
    fontWeight: '600',
    letterSpacing: -0.14,
    color: color.ink900,
    fontFamily: familia,
  },

  pie: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 22 },
});

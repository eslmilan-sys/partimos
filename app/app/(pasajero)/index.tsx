/**
 * `3a` Inicio — la búsqueda, las rutas y el gancho de conductor.
 *
 * El campo rojo entero, con la silueta de la ciudad al pie. La hoja blanca
 * monta sobre su borde y lleva la única acción azul de la pantalla. El
 * degradado del amanecer aparece una sola vez, en la tarjeta que invita a
 * publicar.
 */

import type { Lugar } from '@/dominio/lugar';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { aDondeSeVaDesde, ciudadesDeSalida, CIUDAD_POR_DEFECTO } from '@/servicios/lugares';
import {
  type GanchoDeConductor,
  type RutaPopular,
  diaEnPanama,
  ganchoDeConductor,
  rutasPopulares,
} from '@/servicios/viajes';
import { BuscadorDeLugar } from '@/ui/BuscadorDeLugar';
import { type Opcion, HojaDeEleccion } from '@/ui/HojaDeEleccion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Pestanas } from '@/ui/Pestanas';
import { Amanecer, Bandera } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaCorto, diaLargo } from '@/ui/fechas';
import { Marca, Pin } from '@/ui/iconos';
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

/**
 * Los quince días que se pueden elegir.
 *
 * Quince y no un calendario entero: los viajes se publican con dos o tres días
 * de antelación —lo dice PRODUCT.md—, así que un mes de casillas vacías sería
 * enseñar sobre todo días sin nadie. Se calcula al abrir, no al cargar el
 * módulo, para que «Hoy» siga siendo hoy si la app queda abierta.
 */
const LOS_PROXIMOS_DIAS = (): Opcion[] =>
  Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dia = diaEnPanama(d);
    return { valor: dia, etiqueta: comoSeLlamaElDia(dia), debajo: i === 0 ? undefined : diaLargo(d.toISOString()) };
  });

/** «Hoy» y «Mañana» tienen nombre; el resto se dice por su fecha. */
function comoSeLlamaElDia(dia: string): string {
  const hoy = diaEnPanama(new Date());
  if (dia === hoy) return 'Hoy';
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  if (dia === diaEnPanama(manana)) return 'Mañana';
  return diaCorto(`${dia}T12:00:00-05:00`);
}

/** Cuatro es el máximo: un carro de cinco plazas lleva cuatro pasajeros. */
const CUANTOS_PUESTOS: Opcion[] = [
  { valor: '1', etiqueta: '1 pasajero' },
  { valor: '2', etiqueta: '2 pasajeros' },
  { valor: '3', etiqueta: '3 pasajeros' },
  { valor: '4', etiqueta: '4 pasajeros' },
];

/** De dónde se sale por defecto: es de donde sale casi todo el mundo. */
const DESDE_POR_DEFECTO: Lugar = {
  nombre: 'Ciudad de Panamá',
  contexto: 'Panamá',
  citySlug: CIUDAD_POR_DEFECTO,
  tipo: 'ciudad',
  fuente: 'catalogo',
  lat: 8.9824,
  lng: -79.5199,
};

export default function Inicio() {
  const router = useRouter();
  const [rutas, setRutas] = useState<RutaPopular[]>([]);
  const [gancho, setGancho] = useState<GanchoDeConductor | null>(null);
  const [desde, setDesde] = useState<Lugar>(DESDE_POR_DEFECTO);
  const [hacia, setHacia] = useState<Lugar | null>(null);
  /** Cuál de los dos campos tiene la hoja abierta, o ninguno. */
  const [buscando, setBuscando] = useState<'desde' | 'hacia' | null>(null);
  /** Qué día sales, como 'AAAA-MM-DD' en hora de Panamá. */
  const [cuando, setCuando] = useState(() => diaEnPanama(new Date()));
  const [pasajeros, setPasajeros] = useState(1);
  const [eligiendo, setEligiendo] = useState<'cuando' | 'pasajeros' | null>(null);

  useEffect(() => {
    rutasPopulares().then(setRutas);
    ganchoDeConductor().then(setGancho);
  }, []);

  // Con el campo en blanco, la hoja de «Hacia» enseña a dónde hay corredor
  // desde donde estás: una lista vacía no dice a dónde llevamos.
  /* Se calcula al abrir la hoja, no al cargar el módulo: contra la base el
     almacén todavía está vacío cuando este archivo se evalúa, y la lista
     habría salido vacía para siempre. */
  const sugerencias =
    buscando === 'hacia'
      ? aDondeSeVaDesde(desde.citySlug ?? CIUDAD_POR_DEFECTO)
      : buscando === 'desde'
        ? ciudadesDeSalida()
        : [];

  const buscar = () => {
    /* Sin destino no se busca: mandar a resultados con la ruta del traspaso
       enseñaría viajes que nadie pidió. Se abre el campo que falta, que es lo
       que la persona iba a tener que hacer de todas formas. */
    if (!hacia) {
      setBuscando('hacia');
      return;
    }
    router.push({
      pathname: '/(pasajero)/resultados',
      params: {
        origen: desde.citySlug ?? CIUDAD_POR_DEFECTO,
        destino: hacia.citySlug ?? '',
        etiquetaDestino: hacia.nombre,
        dia: cuando,
        pasajeros: String(pasajeros),
      },
    });
  };

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* El campo y lo que va encima se desplazan juntos: fuera del
            ScrollView el campo se quedaba clavado y «RUTAS POPULARES»
            terminaba escrito sobre el rojo. */}
        <Bandera altura={326} motivo="skyline">
          <BarraDeEstado />
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Desde ${desde.nombre}. Cambiar`}
            onPress={() => setBuscando('desde')}
            style={estilos.filaLugar}
          >
            <View style={estilos.puntoLleno} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.etiquetaLugar}>Desde</Text>
              <Text style={estilos.valorLugar} numberOfLines={1}>
                {desde.nombre}
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hacia ? `Hacia ${hacia.nombre}. Cambiar` : 'Elegir a dónde vas'}
            onPress={() => setBuscando('hacia')}
            style={[estilos.filaLugar, estilos.filaConLinea]}
          >
            <View style={estilos.puntoVacio} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.etiquetaLugar}>Hacia</Text>
              <Text
                style={[estilos.valorLugar, !hacia && { color: color.ink400 }]}
                numberOfLines={1}
              >
                {hacia?.nombre ?? 'Chitré, David, Santiago…'}
              </Text>
            </View>
          </Pressable>

          <View style={estilos.filaCajas}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Cuándo sales: ${comoSeLlamaElDia(cuando)}. Cambiar`}
              onPress={() => setEligiendo('cuando')}
              style={estilos.caja}
            >
              <Text style={estilos.etiquetaCaja}>Cuándo</Text>
              <Text style={estilos.valorCaja}>{comoSeLlamaElDia(cuando)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${pasajeros} ${pasajeros === 1 ? 'pasajero' : 'pasajeros'}. Cambiar`}
              onPress={() => setEligiendo('pasajeros')}
              style={estilos.caja}
            >
              <Text style={estilos.etiquetaCaja}>Pasajeros</Text>
              <Text style={[estilos.valorCaja, tabular]}>
                {`${pasajeros} ${pasajeros === 1 ? 'pasajero' : 'pasajeros'}`}
              </Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 14 }}>
            <Boton tono="azul" alPulsar={buscar}>
              Buscar viajes
            </Boton>
          </View>
        </View>
        </Bandera>

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
              onPress={() =>
                router.push({
                  pathname: '/(pasajero)/resultados',
                  params: { origen: CIUDAD_POR_DEFECTO, destino: r.slug, etiquetaDestino: r.destino },
                })
              }
              style={[estilos.filaRuta, i > 0 && estilos.filaRutaConLinea]}
            >
              {/* Sin foto no se deja el hueco gris: un rectángulo vacío se lee
                  como una imagen que no cargó. Va un pin en arena, que es un
                  sitio sin retrato y no un fallo. */}
              <View style={[estilos.miniatura, !FOTOS[r.foto] && estilos.miniaturaSinFoto]}>
                {FOTOS[r.foto] ? (
                  <Image source={FOTOS[r.foto]} style={estilos.foto} resizeMode="cover" />
                ) : (
                  <Pin tamano={18} tinta={color.ink400} />
                )}
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
                  {/* «si llevas» y no «llevando»: la tarjeta es un ejemplo de
                      una ruta cualquiera, no un viaje que esta persona tenga
                      publicado. Sin el «si» se lee como si ya fuera a Chitré. */}
                  <Text style={estilos.fraseGancho}>
                    {'Lo que '}
                    <Text style={estilos.fraseGanchoFuerte}>recuperas</Text>
                    {` si llevas ${enLetra(gancho.puestos)} puestos a ${gancho.destino}`}
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
        <Pestanas valor="Buscar" conPublicar />
      </View>

      <BuscadorDeLugar
        abierto={buscando !== null}
        titulo={buscando === 'desde' ? 'Desde dónde sales' : 'A dónde vas'}
        sugerencias={sugerencias}
        alElegir={(d) => {
          if (buscando === 'desde') setDesde(d);
          else setHacia(d);
          setBuscando(null);
        }}
        alCerrar={() => setBuscando(null)}
      />

      <HojaDeEleccion
        abierta={eligiendo === 'cuando'}
        titulo="Cuándo sales"
        opciones={LOS_PROXIMOS_DIAS()}
        elegido={cuando}
        alElegir={setCuando}
        alCerrar={() => setEligiendo(null)}
      />

      <HojaDeEleccion
        abierta={eligiendo === 'pasajeros'}
        titulo="Cuántos van"
        opciones={CUANTOS_PUESTOS}
        elegido={String(pasajeros)}
        alElegir={(v) => setPasajeros(Number(v))}
        alCerrar={() => setEligiendo(null)}
      />
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
  miniaturaSinFoto: {
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

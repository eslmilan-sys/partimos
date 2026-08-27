/**
 * `5e` Repaso — lo que vas a publicar, entero y en una pantalla.
 *
 * **Por qué existe.** `5c` publicaba de golpe: el último toque de una pantalla
 * con tres steppers, cuatro interruptores y una ruta escribía un viaje en la
 * base y ya. Publicar es un compromiso con desconocidos —te van a esperar en
 * una esquina a una hora— y el único momento para leerlo entero es antes.
 *
 * No se decide nada aquí: todo lo que sale es lo que ya elegiste. Es una
 * lectura, con una sola acción al final y la puerta de atrás para corregir.
 *
 * La cuenta de abajo repite en voz alta lo que la ley exige que sea cierto:
 * el carro lleno no cubre el viaje entero, porque tú también pones tu parte.
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';
import { deParams } from '@/dominio/lugar';
import { ciudadesConocidas } from '@/servicios/lugares';

import { aporteCalculado } from '@/dominio/aporte';
import {
  type PublicacionPreparada,
  prepararPublicacion,
  publicarViaje,
  repartoDelCosto,
} from '@/servicios/viajes';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { Bandera, motivoDe } from '@/ui/CampoRojo';
import { NoEsta } from '@/ui/NoEsta';
import { Boton, Epigrafe } from '@/ui/controles';
import { formatearDinero, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaLargo, hora, mas } from '@/ui/fechas';
import { Atras, Carro, Escudo, Maleta, Mascota, Persona, SinHumo } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, radio } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

/** Lo que cuesta desviarse a recoger en cada parada. Igual que en `5c`. */
const MINUTOS_POR_PARADA = 5;

export default function Repaso() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const p = useLocalSearchParams<{
    ruta?: string;
    o?: string;
    oNom?: string;
    oTipo?: string;
    oPos?: string;
    d?: string;
    dNom?: string;
    dTipo?: string;
    dPos?: string;
    salida?: string;
    paradas?: string;
    puestos?: string;
    aporte?: string;
    maletas?: string;
    mujeres?: string;
    mascotas?: string;
    fumar?: string;
    adelante?: string;
    atras?: string;
    comentario?: string;
  }>();

  const [datos, setDatos] = useState<PublicacionPreparada | null>(null);
  const [noEsta, setNoEsta] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [quePaso, setQuePaso] = useState<string | null>(null);

  /* Los índices de las paradas elegidas — «0,2» — no una cuenta. */
  const indicesParadas = (p.paradas ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0)
    .slice(0, 2);
  const paradas = indicesParadas.length;
  const puestos = Number(p.puestos ?? 3);
  const aporteElegido = p.aporte ? Number(p.aporte) : null;

  /* Los dos extremos, si vinieron: en ruta libre son lo único que dice qué
     se publica. `deParams` es el mismo des-serializador de resultados. */
  const desde = useMemo(() => deParams(ciudadesConocidas(), p, 'o'), [p.o, p.oNom, p.oPos]);
  const hacia = useMemo(() => deParams(ciudadesConocidas(), p, 'd'), [p.d, p.dNom, p.dPos]);
  const libre = !p.ruta && desde && hacia ? { desde, hacia } : undefined;

  useEffect(() => {
    if (!yo || !p.salida) return;
    if (!p.ruta && !libre) return;
    prepararPublicacion(yo, p.ruta ?? '', p.salida, libre)
      .then(setDatos)
      .catch(() => setNoEsta(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yo, p.ruta, p.salida, desde, hacia]);

  if (noEsta || (!p.ruta && !libre && !datos))
    return (
      <NoEsta
        titulo="Falta lo que ibas a publicar"
        explicacion="Vuelve a la pantalla de publicar y elige la ruta, el día y la hora."
      />
    );
  if (!datos) return <Cargando />;

  const aporte = aporteElegido ?? aporteCalculado(datos.costoCentavos, puestos, datos.topeCentavos);
  const cuenta = repartoDelCosto(datos.costoCentavos, aporte, puestos);
  const salida = new Date(datos.salida);
  const llegada = mas(salida, datos.duracionMin + paradas * MINUTOS_POR_PARADA);
  const enMedio = indicesParadas.map((i) => datos.paradasOfrecidas[i]).filter(Boolean);

  const condiciones: { texto: string; icono: React.ReactNode }[] = [
    {
      texto: p.maletas ? 'Acepta maletas' : 'Solo mochila',
      icono: <Maleta tamano={15} tinta={color.ink600} />,
    },
    {
      texto: p.mascotas ? 'Acepta mascotas' : 'Sin mascotas',
      icono: <Mascota tamano={15} tinta={color.ink600} />,
    },
    {
      texto: p.fumar ? 'Se puede fumar' : 'No se fuma',
      icono: <SinHumo tamano={15} tinta={color.ink600} />,
    },
  ];
  if (p.mujeres) {
    condiciones.push({
      texto: 'Solo mujeres',
      icono: <Persona tamano={15} tinta={color.ink600} />,
    });
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Bandera altura={230} motivo={motivoDe(slugDe(datos.destino))}>
          <BarraDeEstado />
          <View style={estilos.chrome}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atrás, corregir"
              onPress={() => volver()}
              style={estilos.circulo}
            >
              <Atras />
            </Pressable>
          </View>
          <View style={estilos.cabecera}>
            <Text style={estilos.epigrafeCampo}>Antes de publicar</Text>
            <Text style={estilos.titular} numberOfLines={2}>
              {`${datos.origen} → `}
              <Text style={estilos.titularFuerte}>{datos.destino}</Text>
            </Text>
            <Text style={estilos.subtitulo}>
              {`${diaLargo(datos.salida)} · ${hora(salida)}`}
            </Text>
          </View>
        </Bandera>

        <View style={estilos.hoja}>
          <View style={estilos.tarjeta}>
            <Epigrafe>Ruta del viaje</Epigrafe>
            <View style={estilos.recorrido}>
              <View style={estilos.linea} />
              <Parada que="Salida" nombre={datos.origen} cuando={hora(salida)} primera />
              {enMedio.map((x) => (
                <Parada
                  key={x.nombre}
                  que="Parada"
                  nombre={x.nombre}
                  cuando={hora(mas(salida, x.minutos))}
                />
              ))}
              <Parada que="Llegada" nombre={datos.destino} cuando={hora(llegada)} ultima />
            </View>
          </View>

          <View style={estilos.tarjeta}>
            <View style={estilos.filaCarro}>
              <View style={estilos.cuadroCarro}>
                <Carro tamano={26} tinta={color.ink500} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.textoCarro} numberOfLines={1}>
                  {`${datos.carro.make ?? ''} ${datos.carro.model ?? ''} ${datos.carro.color ?? ''}`.trim()}
                </Text>
                <Text style={estilos.detalleCarro}>
                  {`${puestos} ${puestos === 1 ? 'puesto libre' : 'puestos libres'} de ${datos.puestosMaximos}`}
                </Text>
              </View>
            </View>

            <View style={estilos.separador} />

            <View style={estilos.condiciones}>
              {condiciones.map((c) => (
                <View key={c.texto} style={estilos.condicion}>
                  {c.icono}
                  <Text style={estilos.condicionTexto}>{c.texto}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* El dinero, y lo que la ley exige que sea verdad. */}
          <View style={estilos.tarjeta}>
            <View style={estilos.filaAporte}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Epigrafe>Aporte por puesto</Epigrafe>
                <Text style={estilos.precio}>{formatearDineroRedondo(aporte)}</Text>
              </View>
              <View style={estilos.tope}>
                <Text style={estilos.topeTexto}>
                  {`Tope de la ruta ${formatearDineroRedondo(datos.topeCentavos)}`}
                </Text>
              </View>
            </View>

            <View style={estilos.separador} />

            <Fila etiqueta="Gasolina y peajes" valor={formatearDinero(cuenta.costoCentavos)} />
            <Fila
              etiqueta={`Con ${puestos} ${puestos === 1 ? 'puesto' : 'puestos'} recuperas`}
              valor={formatearDinero(cuenta.recuperasCentavos)}
            />
            <Fila
              etiqueta="De tu bolsillo"
              valor={formatearDinero(cuenta.deTuBolsilloCentavos)}
              fuerte
            />

            <View style={estilos.aviso}>
              <Escudo tamano={18} tinta={color.azul500} />
              <Text style={estilos.avisoTexto}>
                Tú también pones tu parte del viaje, así que el carro lleno nunca cubre el costo
                entero. Nadie gana dinero con esto.
              </Text>
            </View>
          </View>

          {quePaso ? <Text style={estilos.error}>{quePaso}</Text> : null}
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton
         
          desactivado={publicando}
          alPulsar={async () => {
            if (!yo || !p.salida || (!p.ruta && !libre)) return;
            setPublicando(true);
            setQuePaso(null);
            try {
              const viaje = await publicarViaje({
                conductorId: yo,
                carroId: datos.carro.id,
                corredorSlug: p.ruta ?? '',
                desde: libre?.desde ?? null,
                hacia: libre?.hacia ?? null,
                salida: p.salida,
                paradas: indicesParadas,
                puestos,
                aporteCentavos: aporteElegido,
                aceptaMaletas: !!p.maletas,
                soloMujeres: !!p.mujeres,
                aceptaMascotas: !!p.mascotas,
                sePuedeFumar: !!p.fumar,
                adelante: p.adelante ? Number(p.adelante) : null,
                atras: p.atras ? Number(p.atras) : null,
                comentario: p.comentario ?? null,
              });
              // Al panel del conductor, NO al detalle del pasajero: quien
              // acaba de publicar no tiene que pedirse un puesto en su
              // propio carro. Aquí ve su viaje y las solicitudes que lleguen.
              router.replace('/(conductor)/panel');
            } catch (e) {
              setQuePaso(e instanceof Error ? e.message : 'No se pudo publicar. Prueba otra vez.');
            } finally {
              setPublicando(false);
            }
          }}
        >
          {`Publicar · ${puestos} ${puestos === 1 ? 'puesto a' : 'puestos a'} ${formatearDineroRedondo(aporte)}`}
        </Boton>
        <Text style={estilos.notaPie}>
          Puedes editarlo mientras nadie haya asegurado su puesto.
        </Text>
      </View>
    </View>
  );
}

/** Una parada del repaso: qué es, cómo se llama y a qué hora. */
function Parada({
  que,
  nombre,
  cuando,
  primera = false,
  ultima = false,
}: {
  que: string;
  nombre: string;
  cuando: string;
  primera?: boolean;
  ultima?: boolean;
}) {
  return (
    <View style={[estilos.parada, ultima && { paddingBottom: 0 }]}>
      <View style={primera ? estilos.puntoLleno : ultima ? estilos.puntoFinal : estilos.puntoMedio} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[estilos.paradaQue, primera && { color: color.rojo600 }]}>{que}</Text>
        <Text style={estilos.paradaNombre}>{nombre}</Text>
      </View>
      <Text style={estilos.paradaHora}>{cuando}</Text>
    </View>
  );
}

function Fila({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <View style={estilos.fila}>
      <Text style={[estilos.filaEtiqueta, fuerte && { color: color.ink900, fontWeight: '600' }]}>
        {etiqueta}
      </Text>
      <Text style={[estilos.filaValor, fuerte && { fontWeight: '700' }]}>{valor}</Text>
    </View>
  );
}

/** El dibujo se elige por el slug, y aquí solo tenemos el nombre escrito. */
function slugDe(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },
  contenido: { paddingBottom: 190 },

  chrome: { paddingHorizontal: espacio.gutter, paddingTop: 10 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 14, paddingBottom: 6 },
  epigrafeCampo: {
    fontSize: 11.5,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 12, },
  titularFuerte: { fontWeight: '600' },
  subtitulo: { fontSize: 14, lineHeight: 20.3, color: color.campoTexto, marginTop: 8, fontFamily: familia },

  hoja: {
    marginTop: -30,
    backgroundColor: color.sand100,
    borderTopLeftRadius: radio.hoja,
    borderTopRightRadius: radio.hoja,
    paddingHorizontal: espacio.gutter,
    paddingTop: 22,
  },
  tarjeta: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },

  recorrido: { position: 'relative', marginTop: 14 },
  linea: { position: 'absolute', left: 4.25, top: 10, bottom: 22, width: 1.5, backgroundColor: color.rojo300 },
  parada: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, paddingBottom: 16 },
  puntoLleno: { width: 10, height: 10, borderRadius: radio.pastilla, backgroundColor: color.rojo500, marginTop: 6 },
  puntoMedio: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.azul500,
    marginTop: 6,
  },
  puntoFinal: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
    marginTop: 6,
  },
  paradaQue: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, fontFamily: familia },
  paradaNombre: {
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '500',
    letterSpacing: -0.29,
    color: color.ink900,
    fontFamily: familia,
  },
  paradaHora: { fontSize: 14, lineHeight: 23, color: color.ink500, fontFamily: familia, ...tabular },

  filaCarro: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  cuadroCarro: {
    width: 52,
    height: 40,
    borderRadius: radio.control,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCarro: {
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '500',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  detalleCarro: { fontSize: 13.5, lineHeight: 18.85, color: color.ink500, fontFamily: familia, ...tabular },
  separador: { height: 1, backgroundColor: color.bordeSutil, marginVertical: 15 },

  condiciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  condicion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
  },
  condicionTexto: { fontSize: 12.5, lineHeight: 17, fontWeight: '500', color: color.ink700, fontFamily: familia },

  filaAporte: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  precio: {
    fontSize: 33,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.53,
    color: color.ink900,
    marginTop: 6,
    fontFamily: familia,
    ...tabular,
  },
  tope: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul100,
    maxWidth: 150,
  },
  topeTexto: { fontSize: 12.5, lineHeight: 17, fontWeight: '600', color: color.azul700, fontFamily: familia },

  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 6 },
  filaEtiqueta: { flex: 1, fontSize: 14, lineHeight: 20.3, color: color.ink600, fontFamily: familia },
  filaValor: { fontSize: 14, lineHeight: 20.3, fontWeight: '500', color: color.ink900, fontFamily: familia, ...tabular },

  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginTop: 14,
    padding: 14,
    borderRadius: radio.l,
    backgroundColor: color.azul50,
  },
  avisoTexto: { flex: 1, fontSize: 13.5, lineHeight: 19.5, color: color.azul700, fontFamily: familia },

  error: { fontSize: 13.5, lineHeight: 20, color: color.rojo700, fontFamily: familia, marginBottom: 12 },

  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espacio.gutter,
    paddingTop: 16,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  notaPie: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink500,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: familia,
  },
});

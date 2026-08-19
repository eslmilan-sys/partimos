/**
 * `7c` Puestos y maletas — el paso 3 de publicar.
 *
 * Mover el contador **recalcula el aporte delante de los ojos**, y debajo
 * está la vista previa de cómo va a quedar el anuncio. Es la misma idea que
 * `5c` en pequeño: el conductor no rellena un formulario a ciegas y luego
 * descubre el precio, lo ve moverse mientras decide.
 *
 * El tope va escrito bajo el aporte, no como error al guardar. Un límite que
 * sólo aparece cuando lo cruzas se lee como un castigo; escrito antes, se lee
 * como lo que es: la regla que impide que esto sea un taxi.
 */

import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { aporteCalculado } from '@/dominio/aporte';
import { etiquetaDeMaletero } from '@/dominio/equipaje';
import { type PublicacionPreparada, prepararPublicacion } from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Interruptor, Pastilla, Stepper } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { Maleta } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const CONDUCTOR = '11111111-1111-4111-8111-111111111111';

export default function Puestos() {
  const router = useRouter();
  const [datos, setDatos] = useState<PublicacionPreparada | null>(null);
  const [puestos, setPuestos] = useState(3);
  const [maletas, setMaletas] = useState(true);
  /** null mientras lo lleve el cálculo; en cuanto lo tocas, manda tu número. */
  const [aporteElegido, setAporte] = useState<number | null>(null);

  useEffect(() => {
    prepararPublicacion(CONDUCTOR, 'panama-chitre', new Date().toISOString()).then((p) => {
      setDatos(p);
      setPuestos(Math.min(3, p.puestosMaximos));
    });
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  const aporte = aporteElegido ?? aporteCalculado(datos.costoCentavos, puestos, datos.topeCentavos);

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <View style={estilos.circulo} />
          <Text style={estilos.epigrafeCampo}>Publicar · paso 3 de 4</Text>
        </View>
        <Text style={estilos.titular}>
          {'¿Cuánto '}
          <Text style={estilos.titularFuerte}>cabe</Text>
          {'?'}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.hoja}>
          <View style={estilos.filaControl}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.etiqueta}>Puestos libres</Text>
              <Text style={estilos.ayuda}>Sin contarte a ti</Text>
            </View>
            <Stepper
              valor={puestos}
              alCambiar={setPuestos}
              min={1}
              max={datos.puestosMaximos}
              etiquetaAccesible="Puestos que ofreces"
            />
          </View>

          <View style={estilos.filaControlConRaya}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.etiqueta}>Aporte por puesto</Text>
              <Text style={estilos.ayuda}>
                {`Tope de la ruta: ${formatearDineroRedondo(datos.topeCentavos)}`}
              </Text>
            </View>
            <Stepper
              valor={Math.round(aporte / 100)}
              alCambiar={(v) => setAporte(v * 100)}
              min={3}
              max={Math.round(datos.topeCentavos / 100)}
              sufijo="$"
              etiquetaAccesible="Aporte por puesto, en dólares"
            />
          </View>

          <View style={estilos.filaInterruptor}>
            <Interruptor
              activo={maletas}
              alCambiar={setMaletas}
              etiqueta="Acepto maletas"
              descripcion="Si lo apagas, solo pueden pedir puesto con mochila."
            />
          </View>
        </View>

        <View style={estilos.previa}>
          <Text style={estilos.epigrafePrevia}>Así lo verán los pasajeros</Text>

          <View style={estilos.tarjeta}>
            <View style={estilos.filaPrecio}>
              <Text style={estilos.cuando}>
                {`${hora(datos.salida)} · ${enHoras(datos.duracionMin)}`}
              </Text>
              <View style={estilos.bloquePrecio}>
                <Text style={estilos.precio}>
                  {Math.round(aporte / 100)}
                  <Text style={estilos.precioSimbolo}> $</Text>
                </Text>
                <Pastilla estilo={{ marginTop: 2 }}>
                  {puestos === 1 ? '1 puesto' : `${puestos} puestos`}
                </Pastilla>
              </View>
            </View>

            <View style={estilos.filaRuta}>
              <View style={estilos.puntoAzul} />
              <Text style={estilos.ruta}>
                {`${datos.origen.split(' · ')[0]} → ${datos.destino.split(' · ')[0]}`}
              </Text>
            </View>

            <View style={estilos.filaEquipaje}>
              <Maleta tamano={13} />
              <Text style={estilos.equipaje}>{etiquetaDeMaletero(maletas)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton alPulsar={() => router.push('/(conductor)/publicar')}>
          {`Publicar · ${puestos} ${puestos === 1 ? 'puesto' : 'puestos'} a ${formatearDineroRedondo(aporte)}`}
        </Boton>
        <Text style={estilos.notaPie}>
          {`Tope del aporte: ${formatearDineroRedondo(datos.topeCentavos)} por plaza en esta ruta.`}
        </Text>
      </View>
    </View>
  );
}

function enHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
  },
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
    fontSize: 33,
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '400',
    color: '#fff',
    marginTop: 16,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 12 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  filaControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
  },
  filaControlConRaya: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaInterruptor: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  etiqueta: {
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.288,
    color: color.ink900,
    fontFamily: familia,
  },
  ayuda: { fontSize: 12.5, lineHeight: 18.125, color: color.ink500, marginTop: 2, fontFamily: familia, ...tabular },
  aporte: {
    fontSize: 24,
    lineHeight: 22.8,
    fontWeight: '700',
    letterSpacing: -0.96,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  // La vista previa va sobre arena y con borde: se lee como «esto es una
  // muestra», no como un control más de la hoja.
  previa: {
    backgroundColor: color.sand100,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    padding: 18,
    marginTop: 10,
  },
  epigrafePrevia: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
  },
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 16,
    marginTop: 12,
  },
  filaPrecio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  cuando: { fontSize: 13, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },
  bloquePrecio: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  precio: {
    fontSize: 24,
    lineHeight: 22.8,
    fontWeight: '700',
    letterSpacing: -0.96,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  precioSimbolo: { fontSize: 14, lineHeight: 13.3, fontWeight: '500' },

  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12 },
  puntoAzul: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.azul700 },
  ruta: {
    flex: 1,
    fontSize: 15,
    lineHeight: interlinea(15),
    letterSpacing: -0.27,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },

  filaEquipaje: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  equipaje: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },

  pie: { paddingHorizontal: espacio.gutter, paddingTop: 14, paddingBottom: 26 },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    marginTop: 10,
    fontFamily: familia,
  },
});

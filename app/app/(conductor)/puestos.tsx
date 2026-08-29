/**
 * `7c` Puestos — el paso 3 de publicar.
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
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { aporteCalculado } from '@/dominio/aporte';
import { type PublicacionPreparada, prepararPublicacion } from '@/servicios/viajes';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Interruptor, Pastilla, Stepper } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { enHoras, hora } from '@/ui/fechas';
import { Atras, Maleta } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, pulsado, radio } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

export default function Puestos() {
  const router = useRouter();
  const volver = useVolver();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [datos, setDatos] = useState<PublicacionPreparada | null>(null);
  const [puestos, setPuestos] = useState(3);
  /** null mientras lo lleve el cálculo; en cuanto lo tocas, manda tu número. */
  const [aporteElegido, setAporte] = useState<number | null>(null);

  useEffect(() => {
    if (!yo) return;
    prepararPublicacion(yo, 'panama-chitre', new Date().toISOString()).then((p) => {
      setDatos(p);
      setPuestos(Math.min(3, p.puestosMaximos));
    });
  }, [yo]);

  if (!datos) return <Cargando />;

  const aporte = aporteElegido ?? aporteCalculado(datos.costoCentavos, puestos, datos.topeCentavos);

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

      <CampoRojo altura={196} />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          {/* **AQUÍ NO HABÍA BOTÓN**: era un círculo gris vacío, con la forma
              del de atrás y sin nada dentro ni nada detrás. Desde esta
              pantalla no se podía volver (29-08-2026). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={({ pressed }) => [estilos.circulo, pressed && pulsado.celda]}
          >
            <Atras />
          </Pressable>
          {/* **NI ES «PUBLICAR» NI ES EL PASO 3 DE 4.** El asistente de
              publicar tiene ocho pasos desde el 27-08, y a esta pantalla se
              llega desde «editar un viaje publicado»: quien venía a cambiar
              los puestos de un viaje que ya está en la calle leía que estaba
              publicando, y en un paso que no existe. El epígrafe dice ahora
              la ruta, como en todas las demás. */}
          <Text style={estilos.epigrafeCampo} numberOfLines={1}>
            {`${datos.origen} → ${datos.destino}`}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'Puestos y '}
          <Text style={estilos.titularFuerte}>aporte</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
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
              /* **`B/`, NO `$`.** El sistema escribe el dinero con el prefijo
                 balboa, y esta misma pantalla ya lo hacía bien tres veces
                 —«Tope de la ruta: B/10», «Publicar · 3 puestos a B/8»—: el
                 stepper y la vista previa eran los dos únicos sitios de la
                 app con el símbolo detrás. Dos formatos de dinero en una
                 pantalla es un formato de menos. */
              prefijo="B/"
              etiquetaAccesible="Aporte por puesto, en balboas"
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
                <Text style={estilos.precio}>{formatearDineroRedondo(aporte)}</Text>
                <Pastilla estilo={{ marginTop: 2 }}>
                  {puestos === 1 ? '1 puesto' : `${puestos} puestos`}
                </Pastilla>
              </View>
            </View>

            <View style={estilos.filaRuta}>
              <View style={estilos.puntoAzul} />
              <Text style={estilos.ruta}>
                {`${datos.origen} → ${datos.destino}`}
              </Text>
            </View>

          </View>

          {/* **ESTA FRASE NO IBA DENTRO DE LA PREVIA.**
              Decía «Cada pasajero dice qué lleva; tú decides al recibir su
              solicitud» DENTRO de la tarjeta rotulada «Así lo verán los
              pasajeros» — y está escrita al conductor: «tú decides». O sea,
              la previa enseñaba al pasajero una frase que el pasajero no ve
              nunca, y encima hablándole de usted a otra persona. Nadie podía
              entenderla, y así lo dijo el dueño el 29-08-2026.
              La previa se queda con lo que el pasajero ve de verdad; la
              advertencia baja aquí, fuera de la tarjeta y en su voz. */}
          <View style={estilos.notaEquipaje}>
            <Maleta tamano={14} />
            <Text style={estilos.notaEquipajeTexto}>
              Cada quien te dice qué equipaje lleva cuando pide su puesto. Tú
              decides si te cabe antes de aceptar.
            </Text>
          </View>
        </View>
      </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton alPulsar={() => router.push('/(conductor)/publicar')}>
          {`Publicar · ${puestos} ${puestos === 1 ? 'puesto' : 'puestos'} a ${formatearDineroRedondo(aporte)}`}
        </Boton>
        {/* **EL TOPE, UNA VEZ.** Ya está escrito arriba, bajo el aporte —«Tope
            de la ruta: B/10»—, que es donde sirve: junto al control que puede
            cruzarlo. Repetirlo aquí no enseñaba nada nuevo, y encima lo decía
            con otra palabra: «plaza», que no sale en ninguna otra pantalla de
            la app. Aquí va lo que este botón no hace. */}
        <Text style={estilos.notaPie}>
          Todavía no se publica nada: en el siguiente paso lo repasas entero.
        </Text>
      </View>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
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
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 16, },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 22, paddingBottom: 12 },
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
    fontSize: 15.5,
    lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.288,
    color: color.ink900,
    fontFamily: familia,
  },
  ayuda: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, marginTop: 2, fontFamily: familia, ...tabular },
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
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink600,
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
  cuando: { fontSize: 13.5, lineHeight: 18.85, color: color.ink500, fontFamily: familia, ...tabular },
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

  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12 },
  puntoAzul: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.azul700 },
  ruta: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: interlinea(15),
    letterSpacing: -0.27,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },

  notaEquipaje: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 14 },
  notaEquipajeTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: color.ink500,
    fontFamily: familia,
  },

  pie: { paddingHorizontal: espacio.gutter, paddingTop: 14, paddingBottom: 26 },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    marginTop: 10,
    fontFamily: familia,
  },
});

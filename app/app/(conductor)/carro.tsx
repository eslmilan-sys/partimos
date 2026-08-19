/**
 * `14b` Registrar el carro — lo mínimo que hace falta para reconocerlo al subir.
 *
 * No hay una sola caja de texto libre: marca, modelo y año se eligen del
 * catálogo y los puestos los pone el modelo. No es comodidad de formulario, es
 * lo que hace que dos anuncios del mismo carro se lean igual y que «Hyundai
 * Elantra gris» signifique siempre lo mismo. Por eso cambiar de marca reinicia
 * el modelo: un Elantra de Kia no existe, y dejarlo puesto sería un carro que
 * nadie va a encontrar en la terminal.
 *
 * La foto por detrás va en su propia tarjeta y marcada como obligatoria porque
 * es lo único de esta pantalla que el pasajero ve de verdad: sin la placa
 * legible, «un Elantra gris» no identifica ningún carro.
 */

import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  type BorradorDeCarro,
  borradorInicial,
  cambiarMarca,
  cambiarModelo,
  catalogo,
  guardarCarro,
  puestosDe,
  resumen,
  sePuedeGuardar,
} from '@/servicios/carros';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe, Stepper } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras, Carro } from '@/ui/iconos';
import { color, espacio, familia, interlinea, radio, sombra, texto } from '@/ui/tokens';

/** Mientras no haya sesión, el conductor del recorrido del diseño. */
const CONDUCTOR = '11111111-1111-4111-8111-111111111111';

/**
 * El proyecto no trae módulo de cámara. Aquí volvería el archivo que deja la
 * toma, que es lo que `guardarCarro` escribe tal cual en `photo_path`.
 */
const FOTO_POR_DETRAS = 'carros/por-detras.jpg';

/** Sin pantalla de lista, cada fila del catálogo avanza al siguiente valor. */
const siguiente = <T,>(lista: readonly T[], actual: T): T =>
  lista[(lista.indexOf(actual) + 1) % lista.length];

export default function RegistrarCarro() {
  const router = useRouter();
  const [borrador, setBorrador] = useState<BorradorDeCarro>(borradorInicial);
  const [faltaLaFoto, setFaltaLaFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cat = catalogo(borrador.marca);
  const elegido = cat.colores.find((c) => c.nombre === borrador.color) ?? cat.colores[0];
  const resumido = resumen(borrador);

  const guardar = async () => {
    // El botón nunca se apaga: lo que falta se señala donde falta.
    if (!sePuedeGuardar(borrador)) {
      setFaltaLaFoto(true);
      return;
    }
    setGuardando(true);
    try {
      await guardarCarro(CONDUCTOR, borrador);
      router.back();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>Antes de publicar</Text>
        </View>
        <Text style={estilos.titular}>
          {'Tu '}
          <Text style={texto.titularFuerte}>carro</Text>
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={estilos.hoja}>
          <FilaDeCatalogo
            etiqueta="Marca"
            valor={borrador.marca}
            contador={`${cat.marcas.indexOf(borrador.marca) + 1} de ${cat.marcas.length}`}
            alPulsar={() =>
              setBorrador((b) => cambiarMarca(b, siguiente(catalogo().marcas, b.marca)))
            }
          />
          <FilaDeCatalogo
            etiqueta="Modelo"
            valor={borrador.modelo}
            contador={`${cat.modelos.indexOf(borrador.modelo) + 1} de ${cat.modelos.length}`}
            alPulsar={() =>
              setBorrador((b) => cambiarModelo(b, siguiente(catalogo(b.marca).modelos, b.modelo)))
            }
          />
          <FilaDeCatalogo
            etiqueta="Año"
            valor={borrador.anio}
            alPulsar={() =>
              setBorrador((b) => ({ ...b, anio: siguiente(catalogo().anios, b.anio) }))
            }
          />

          <View style={[estilos.fila, estilos.filaColor]}>
            <View style={estilos.bloque}>
              <Epigrafe>Color</Epigrafe>
              <View style={estilos.linea}>
                <Text style={estilos.valor}>{borrador.color}</Text>
              </View>
            </View>
            <View style={estilos.muestras}>
              {cat.colores.map((c) => {
                const puesto = c.nombre === borrador.color;
                return (
                  <Pressable
                    key={c.nombre}
                    accessibilityRole="button"
                    accessibilityLabel={c.nombre}
                    accessibilityState={{ selected: puesto }}
                    onPress={() => setBorrador((b) => ({ ...b, color: c.nombre }))}
                    style={[estilos.muestra, { backgroundColor: c.muestra }]}
                  >
                    {puesto ? (
                      <>
                        <View style={estilos.anilloAzul} pointerEvents="none" />
                        <View style={estilos.anilloBlanco} pointerEvents="none" />
                      </>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[estilos.fila, estilos.filaPlaca]}>
            <View style={estilos.bloque}>
              <Epigrafe>Placa y puestos</Epigrafe>
              <View style={estilos.linea}>
                <Text style={estilos.valor}>{borrador.placa}</Text>
              </View>
            </View>
            {/* El modelo pone el techo; el conductor solo puede ofrecer menos. */}
            <Stepper
              valor={borrador.puestos}
              alCambiar={(v) => setBorrador((b) => ({ ...b, puestos: v }))}
              min={1}
              max={puestosDe(borrador.modelo)}
              etiquetaAccesible="Puestos que ofreces"
            />
          </View>
        </View>

        <View style={[estilos.tarjeta, estilos.tarjetaFoto]}>
          <View style={estilos.filaTitulo}>
            <Text style={estilos.tituloFoto}>Foto del carro por detrás</Text>
            <Text style={estilos.obligatoria}>Obligatoria</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tomar la foto del carro por detrás"
            accessibilityState={{ selected: Boolean(borrador.foto) }}
            onPress={() => {
              setFaltaLaFoto(false);
              setBorrador((b) => ({ ...b, foto: FOTO_POR_DETRAS }));
            }}
            style={[estilos.zona, faltaLaFoto && estilos.zonaFalta]}
          >
            <View style={estilos.cuadroIcono}>
              <Camara />
            </View>
            <View style={estilos.bloque}>
              <View style={estilos.linea0}>
                <Text style={estilos.tituloZona}>
                  {borrador.foto ? 'Cambiar la foto' : 'Tomar la foto'}
                </Text>
              </View>
              <Text style={estilos.textoZona}>
                De atrás y con la placa legible. Así el pasajero reconoce el carro al subir.
              </Text>
            </View>
            <Seguir />
          </Pressable>
        </View>

        <View style={[estilos.tarjeta, estilos.tarjetaResumen]}>
          <View style={[estilos.cuadroCarro, { backgroundColor: elegido.muestra }]}>
            <Carro tamano={18} tinta={color.ink700} />
          </View>
          <View style={estilos.bloque}>
            <View style={estilos.linea0}>
              <Text style={estilos.lineaResumen}>{resumido.linea}</Text>
            </View>
            <View style={estilos.linea1}>
              <Text style={estilos.detalleResumen}>{resumido.detalle}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton tono="azul" desactivado={guardando} alPulsar={guardar}>
          Guardar el carro
        </Boton>
        <Text style={estilos.notaPie}>Puedes tener más de uno y elegir al publicar.</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

function FilaDeCatalogo({
  etiqueta,
  valor,
  contador,
  alPulsar,
}: {
  etiqueta: string;
  valor: string;
  contador?: string;
  alPulsar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ text: valor }}
      onPress={alPulsar}
      style={estilos.fila}
    >
      <View style={estilos.bloque}>
        <Epigrafe>{etiqueta}</Epigrafe>
        <View style={estilos.linea}>
          <Text style={estilos.valor}>{valor}</Text>
        </View>
      </View>
      {/* El año no lleva cuenta, pero sigue ocupando su hueco en la fila. */}
      <Text style={estilos.contador}>{contador ?? ''}</Text>
      <Bajar />
    </Pressable>
  );
}

/** Los tres iconos que esta pantalla necesita y `@/ui/iconos` todavía no tiene. */
function Bajar() {
  return (
    <Svg viewBox="0 0 24 24" width={17} height={17} fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color.ink400}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Seguir() {
  return (
    <Svg viewBox="0 0 24 24" width={17} height={17} fill="none">
      <Path
        d="M9 5l7 7-7 7"
        stroke={color.ink400}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Camara() {
  return (
    <Svg viewBox="0 0 24 24" width={20} height={20} fill="none">
      <Path
        d="M4 8.5h3l1.4-2h7.2L17 8.5h3v10H4z"
        stroke={color.ink600}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13.2} r={3.2} stroke={color.ink600} strokeWidth={1.7} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto },
  titular: { ...texto.titular, color: color.blanco, marginTop: 12 },

  hoja: {
    marginHorizontal: 22,
    marginTop: 20,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 10,
    ...sombra.hoja,
  },

  // Cada fila del catálogo se separa por la línea de arriba, no por hueco.
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaColor: { paddingVertical: 13 },
  filaPlaca: { paddingTop: 13, paddingBottom: 0 },
  bloque: { flex: 1 },
  // El valor va en su propia fila para que ocupe lo que mide, no la columna.
  linea: { flexDirection: 'row', marginTop: 3 },
  valor: { ...texto.tituloTarjeta, color: color.ink900, ...tabular },
  contador: {
    fontSize: 11.5,
    lineHeight: interlinea(11.5),
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },

  muestras: { flexDirection: 'row', gap: 6, overflow: 'visible' },
  muestra: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(38,35,43,0.14)',
    overflow: 'visible',
  },
  anilloBlanco: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.blanco,
  },
  anilloAzul: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.azul500,
  },

  tarjeta: {
    marginHorizontal: 22,
    marginTop: espacio.entreTarjetas,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
  },

  tarjetaFoto: { paddingHorizontal: 18, paddingVertical: 16 },
  filaTitulo: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  tituloFoto: { ...texto.fila, color: color.ink900, flex: 1 },
  obligatoria: {
    fontSize: 11.5,
    lineHeight: interlinea(11.5),
    fontWeight: '600',
    color: color.rojo600,
    fontFamily: familia,
  },

  zona: {
    marginTop: 10,
    height: 72,
    borderRadius: radio.m,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    backgroundColor: color.sand100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  zonaFalta: { borderColor: color.rojo500 },
  cuadroIcono: {
    width: 40,
    height: 40,
    borderRadius: radio.cuadrado,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linea0: { flexDirection: 'row' },
  linea1: { flexDirection: 'row', marginTop: 1 },
  tituloZona: {
    fontSize: 14,
    lineHeight: interlinea(14),
    fontWeight: '500',
    letterSpacing: -0.21,
    color: color.ink900,
    fontFamily: familia,
  },
  textoZona: {
    fontSize: 12,
    lineHeight: 16.2,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
  },

  tarjetaResumen: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cuadroCarro: {
    width: 34,
    height: 34,
    borderRadius: radio.cuadrado,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(38,35,43,0.12)',
  },
  lineaResumen: { ...texto.fila, color: color.ink900 },
  detalleResumen: {
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },

  pie: {
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink500,
    marginTop: 10,
    fontFamily: familia,
  },
});

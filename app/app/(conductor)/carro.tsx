/**
 * `14b` Registrar el carro — lo mínimo que hace falta para reconocerlo al subir.
 *
 * REHECHA EL 25-08-2026 tras la auditoría del dueño en su teléfono. Lo que
 * había era un formulario a medias que parecía roto, y lo parecía porque lo
 * estaba:
 *
 * - **La placa venía puesta** («AB-1234») y no se podía escribir: era un
 *   Text, no un TextInput. Ahora es un campo de verdad, vacío, en mayúsculas.
 * - **Marca, modelo y año «giraban»**: cada toque saltaba al siguiente valor
 *   del catálogo — para llegar de Hyundai a Toyota había que pasar por todas —
 *   y el chevron prometía una lista que nunca se abría. Ahora se abre: una
 *   hoja con las opciones, se toca la que es, se cierra.
 * - **La foto era mentira**: el botón escribía un camino fijo sin tomar nada.
 *   Ahora abre la cámara o la galería del navegador, reduce la imagen y la
 *   enseña; al guardar sube de verdad (`subirFotoDelCarro`, bucket 0038).
 * - **«Cómo prefieres que te aporten» se fue**: registrar un carro es el
 *   carro. La preferencia de canal vive en el perfil y en las pantallas de
 *   pago, donde ya estaba.
 *
 * Sin texto libre salvo la placa: marca, modelo y año se eligen del catálogo
 * y los puestos los pone el modelo. Es lo que hace que «Hyundai Elantra gris»
 * signifique siempre lo mismo. La placa entera no se guarda — a la base van
 * sus tres últimos y la foto donde se lee (R6 de cerca: mínimo dato).
 */

import { useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useDecir } from '@/ui/Nota';

import { useVolver } from '@/ui/salidas';
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
  subirFotoDelCarro,
} from '@/servicios/carros';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe, Stepper } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras, Carro } from '@/ui/iconos';
import { color, espacio, familia, interlinea, pulsado, radio, sombra, texto } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

/** Qué hoja de opciones está abierta, si alguna. */
type Eligiendo = 'marca' | 'modelo' | 'anio' | null;

export default function RegistrarCarro() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [borrador, setBorrador] = useState<BorradorDeCarro>(borradorInicial);
  const decir = useDecir();
  const [faltaLaFoto, setFaltaLaFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eligiendo, setEligiendo] = useState<Eligiendo>(null);
  /** El archivo reducido, listo para subir al guardar. La vista previa va en
      `borrador.foto` como `data:` URI — así la tarjeta la enseña al momento. */
  const laFoto = useRef<Blob | null>(null);

  const cat = catalogo(borrador.marca);
  const elegido = cat.colores.find((c) => c.nombre === borrador.color) ?? cat.colores[0];
  const resumido = resumen(borrador);

  /** Qué falta, dicho — no solo un borde rojo fuera de pantalla. */
  const queFalta = (): string | null => {
    if (!borrador.marca) return 'Falta la marca del carro.';
    if (!borrador.modelo) return 'Falta el modelo.';
    if (!borrador.anio) return 'Falta el año.';
    if (!borrador.color) return 'Falta el color.';
    if (!borrador.placa.trim()) return 'Falta la placa.';
    if (borrador.placa.trim().length < 5) return 'Esa placa se ve corta. Escríbela completa.';
    if (!borrador.foto) return 'Falta la foto del carro por detrás.';
    return null;
  };

  /**
   * LA CÁMARA DEL NAVEGADOR. La app corre en web — el enlace que se manda a
   * los amigos — y ahí la foto se pide con un `<input type="file">` de
   * imagen: el teléfono ofrece cámara o galería, el navegador de escritorio
   * abre el selector. La imagen se reduce a 1280 px y ~80 % antes de nada:
   * una foto de placa no necesita 4 MB, y el bucket los rechaza.
   */
  const pedirFoto = () => {
    if (Platform.OS !== 'web') {
      decir('Desde el teléfono instala la app cuando salga; por ahora usa el navegador.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    const soltar = () => {
      if (input.parentNode) document.body.removeChild(input);
    };
    input.onchange = async () => {
      const archivo = input.files?.[0];
      soltar();
      if (!archivo) return;
      try {
        const { datos, vista } = await reducir(archivo);
        laFoto.current = datos;
        setFaltaLaFoto(false);
        setBorrador((b) => ({ ...b, foto: vista }));
      } catch {
        decir('No se pudo leer esa imagen. Prueba con otra.');
      }
    };
    input.oncancel = soltar;
    input.click();
  };

  const guardar = async () => {
    const falta = queFalta();
    if (falta || !yo) {
      setFaltaLaFoto(!borrador.foto);
      decir(falta);
      return;
    }
    setGuardando(true);
    try {
      let foto = borrador.foto as string;
      if (laFoto.current) foto = await subirFotoDelCarro(yo, laFoto.current, foto);
      await guardarCarro(yo, { ...borrador, foto });
      volver();
    } catch (e) {
      decir(e instanceof Error ? e.message : 'No se pudo guardar. Prueba otra vez.');
    } finally {
      setGuardando(false);
    }
  };

  /** Lo que la hoja abierta enseña y hace. */
  const hoja =
    eligiendo === 'marca'
      ? {
          titulo: 'La marca',
          opciones: cat.marcas,
          puesta: borrador.marca,
          elegir: (m: string) => setBorrador((b) => cambiarMarca(b, m)),
        }
      : eligiendo === 'modelo'
        ? {
            titulo: 'El modelo',
            opciones: cat.modelos,
            puesta: borrador.modelo,
            elegir: (m: string) => setBorrador((b) => cambiarModelo(b, m)),
          }
        : eligiendo === 'anio'
          ? {
              titulo: 'El año',
              opciones: cat.anios,
              puesta: borrador.anio,
              elegir: (a: string) => setBorrador((b) => ({ ...b, anio: a })),
            }
          : null;

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <CampoRojo altura={206} />

        <View style={estilos.cabecera}>
          <View style={estilos.filaEpigrafe}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atrás"
              onPress={() => volver()}
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

        {/* ── El carro: marca, modelo, año, color ─────────────────────── */}
        <View style={estilos.hoja}>
          <FilaQueElige
            etiqueta="Marca"
            valor={borrador.marca}
            alPulsar={() => setEligiendo('marca')}
          />
          <FilaQueElige
            etiqueta="Modelo"
            valor={borrador.modelo}
            alPulsar={() => setEligiendo('modelo')}
          />
          <FilaQueElige
            etiqueta="Año"
            valor={borrador.anio}
            alPulsar={() => setEligiendo('anio')}
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
                    style={estilos.tocaMuestra}
                  >
                    <View style={[estilos.muestra, { backgroundColor: c.muestra }]}>
                      {puesto ? (
                        <>
                          <View style={estilos.anilloAzul} pointerEvents="none" />
                          <View style={estilos.anilloBlanco} pointerEvents="none" />
                        </>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── La placa y los puestos, cada cual con su fila ───────────── */}
        <View style={[estilos.hoja, estilos.hojaSegunda]}>
          <View style={[estilos.fila, estilos.filaPrimera]}>
            <View style={estilos.bloque}>
              <Epigrafe>Placa</Epigrafe>
              <TextInput
                value={borrador.placa}
                onChangeText={(v) => setBorrador((b) => ({ ...b, placa: v.toUpperCase() }))}
                placeholder="AB-1234"
                placeholderTextColor={color.ink300}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                accessibilityLabel="La placa del carro"
                style={estilos.entradaPlaca}
              />
            </View>
            <Text style={estilos.notaLado}>Solo guardamos{'\n'}sus últimos 3</Text>
          </View>

          <View style={estilos.fila}>
            <View style={estilos.bloque}>
              <Epigrafe>Puestos que ofreces</Epigrafe>
              <Text style={estilos.notaFila}>El modelo pone el techo; puedes ofrecer menos.</Text>
            </View>
            <Stepper
              valor={borrador.puestos}
              alCambiar={(v) => setBorrador((b) => ({ ...b, puestos: v }))}
              min={1}
              max={puestosDe(borrador.modelo)}
              etiquetaAccesible="Puestos que ofreces"
            />
          </View>
        </View>

        {/* ── La foto, la única que el pasajero ve de verdad ──────────── */}
        <View style={[estilos.tarjeta, estilos.tarjetaFoto]}>
          <View style={estilos.filaTitulo}>
            <Text style={estilos.tituloFoto}>Foto del carro por detrás</Text>
            <Text style={estilos.obligatoria}>Obligatoria</Text>
          </View>

          {borrador.foto ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar la foto del carro"
              onPress={pedirFoto}
              style={estilos.marcoFoto}
            >
              <Image source={{ uri: borrador.foto }} resizeMode="cover" style={estilos.laFoto} />
              <View style={estilos.cambiarFoto}>
                <Text style={estilos.cambiarFotoTexto}>Cambiar</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tomar o elegir la foto del carro por detrás"
              onPress={pedirFoto}
              style={[estilos.zona, faltaLaFoto && estilos.zonaFalta]}
            >
              <View style={estilos.cuadroIcono}>
                <Camara />
              </View>
              <Text style={estilos.tituloZona}>Tomar o elegir la foto</Text>
              <Text style={estilos.textoZona}>
                De atrás y con la placa legible. Así el pasajero reconoce el carro al subir.
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── El resumen, que se arma solo ────────────────────────────── */}
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
        <Boton desactivado={guardando} alPulsar={guardar}>
          {guardando ? 'Guardando…' : 'Guardar el carro'}
        </Boton>
        <Text style={estilos.notaPie}>Puedes tener más de uno y elegir al publicar.</Text>
      </View>

      {/* ── La hoja de opciones: se abre, se toca, se cierra ──────────── */}
      <Modal
        visible={hoja != null}
        animationType="slide"
        transparent
        onRequestClose={() => setEligiendo(null)}
      >
        <Pressable style={estilos.fondoHoja} onPress={() => setEligiendo(null)} />
        <View style={estilos.hojaDeOpciones}>
          <View style={estilos.asa} />
          <Text style={estilos.tituloHoja}>{hoja?.titulo}</Text>
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {hoja?.opciones.map((opcion) => {
              const puesta = opcion === hoja.puesta;
              return (
                <Pressable
                  key={opcion}
                  accessibilityRole="button"
                  accessibilityState={{ selected: puesta }}
                  onPress={() => {
                    hoja.elegir(opcion);
                    setEligiendo(null);
                  }}
                  style={({ pressed }) => [estilos.opcion, pressed && pulsado.celda]}
                >
                  <Text style={[estilos.opcionTexto, puesta && estilos.opcionPuesta]}>
                    {opcion}
                  </Text>
                  {puesta ? <Palomita /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------------------------------------------------------ */

/**
 * La imagen, reducida antes de enseñarla o subirla: 1280 px de lado mayor y
 * JPEG al 82 %. Una placa se lee igual y pesa veinte veces menos.
 */
async function reducir(archivo: File): Promise<{ datos: Blob; vista: string }> {
  const mapa = await createImageBitmap(archivo);
  const escala = Math.min(1, 1280 / Math.max(mapa.width, mapa.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(mapa.width * escala);
  lienzo.height = Math.round(mapa.height * escala);
  const pincel = lienzo.getContext('2d');
  if (!pincel) throw new Error('sin lienzo');
  pincel.drawImage(mapa, 0, 0, lienzo.width, lienzo.height);
  mapa.close();
  const datos = await new Promise<Blob>((listo, fallo) =>
    lienzo.toBlob((b) => (b ? listo(b) : fallo(new Error('sin blob'))), 'image/jpeg', 0.82),
  );
  return { datos, vista: lienzo.toDataURL('image/jpeg', 0.72) };
}

function FilaQueElige({
  etiqueta,
  valor,
  alPulsar,
}: {
  etiqueta: string;
  valor: string;
  alPulsar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ text: valor }}
      onPress={alPulsar}
      style={({ pressed }) => [estilos.fila, pressed && pulsado.celda]}
    >
      <View style={estilos.bloque}>
        <Epigrafe>{etiqueta}</Epigrafe>
        <View style={estilos.linea}>
          <Text style={estilos.valor}>{valor}</Text>
        </View>
      </View>
      <Bajar />
    </Pressable>
  );
}

/** Los iconos que esta pantalla necesita y `@/ui/iconos` todavía no tiene. */
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

function Palomita() {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path
        d="M5 12.5 10 17.5 19 7"
        stroke={color.rojo500}
        strokeWidth={2.2}
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
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
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
  titular: { ...texto.titular, color: color.ink900, marginTop: 12 },

  hoja: {
    marginHorizontal: espacio.gutter,
    marginTop: 20,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 4,
    ...sombra.hoja,
  },
  hojaSegunda: { marginTop: espacio.entreTarjetas, paddingBottom: 10 },

  // Cada fila se separa por la línea de arriba, no por hueco.
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaPrimera: { borderTopWidth: 0 },
  filaColor: { paddingVertical: 13 },

  bloque: { flex: 1 },
  linea: { flexDirection: 'row', marginTop: 3 },
  valor: { ...texto.tituloTarjeta, color: color.ink900, ...tabular },

  /** La placa se escribe: campo de verdad, en mayúsculas, con su marcador. */
  entradaPlaca: {
    marginTop: 3,
    ...texto.tituloTarjeta,
    color: color.ink900,
    fontFamily: familia,
    letterSpacing: 0.5,
    ...tabular,
    paddingVertical: 2,
    outlineStyle: 'none',
  } as never,
  notaLado: {
    fontSize: 11.5,
    lineHeight: 15,
    color: color.ink500,
    textAlign: 'right',
    fontFamily: familia,
  },
  notaFila: {
    fontSize: 12,
    lineHeight: 17,
    color: color.ink500,
    marginTop: 3,
    fontFamily: familia,
  },

  muestras: { flexDirection: 'row', gap: 0, overflow: 'visible' },
  tocaMuestra: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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
    marginHorizontal: espacio.gutter,
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

  /** Sin foto: una zona amplia que invita, no una franja que se pasa de largo. */
  zona: {
    marginTop: 12,
    minHeight: 148,
    borderRadius: radio.m,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    backgroundColor: color.sand100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  zonaFalta: { borderColor: color.rojo500 },
  cuadroIcono: {
    width: 44,
    height: 44,
    borderRadius: radio.cuadrado,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloZona: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: interlinea(14),
    fontWeight: '600',
    letterSpacing: -0.21,
    color: color.ink900,
    fontFamily: familia,
  },
  textoZona: {
    fontSize: 12.5,
    lineHeight: 17,
    color: color.ink600,
    marginTop: 3,
    textAlign: 'center',
    fontFamily: familia,
  },

  /** Con foto: la foto ES la tarjeta, con «Cambiar» encima. */
  marcoFoto: {
    marginTop: 12,
    height: 176,
    borderRadius: radio.m,
    overflow: 'hidden',
    backgroundColor: color.sand100,
  },
  laFoto: { width: '100%', height: '100%' },
  cambiarFoto: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(10,39,49,.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cambiarFotoTexto: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    color: color.blanco,
    fontFamily: familia,
  },

  linea0: { flexDirection: 'row' },
  linea1: { flexDirection: 'row', marginTop: 1 },

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

  /* ── La hoja de opciones ── */
  fondoHoja: { flex: 1, backgroundColor: 'rgba(10,39,49,.4)' },
  hojaDeOpciones: {
    backgroundColor: color.blanco,
    borderTopLeftRadius: radio.hoja,
    borderTopRightRadius: radio.hoja,
    paddingHorizontal: 20,
    paddingBottom: 26,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },
  asa: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.ink200,
    marginTop: 10,
    marginBottom: 12,
  },
  tituloHoja: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.26,
    color: color.ink900,
    fontFamily: familia,
    marginBottom: 6,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  opcionTexto: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },
  opcionPuesta: { color: color.ink900, fontWeight: '600' },
});

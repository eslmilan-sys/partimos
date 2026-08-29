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

import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
  categoriaDe,
  guardarCarro,
  guardarVencimientoDeLicencia,
  vencimientoDeLicencia,
  puestosDe,
  resumen,
  subirFotoDelCarro,
} from '@/servicios/carros';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { aTexto, comoSeDice, deTexto } from '@/dominio/licencia';
import { Boton, Epigrafe, Stepper, Interruptor } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, interlinea, pulsado, radio, sombra, texto } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

/** Qué lista está abierta, y DÓNDE cae la fila que la abrió. */
type Eligiendo = 'marca' | 'modelo' | 'anio';
type Sitio = { x: number; y: number; ancho: number; alto: number };
type Menu = { cual: Eligiendo; sitio: Sitio };

export default function RegistrarCarro() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [borrador, setBorrador] = useState<BorradorDeCarro>(borradorInicial);
  /** Cuándo se vence la licencia, tal y como se teclea (0047). */
  const [licencia, setLicencia] = useState('');
  useEffect(() => {
    if (yo) vencimientoDeLicencia(yo).then((v) => setLicencia(aTexto(v)));
  }, [yo]);
  /* Lo que se le dice mientras escribe. Sólo cuando ya hay una fecha: con el
     campo vacío lo que importa es la promesa —sólo la fecha, nada más—, no
     una relanza que el epígrafe de encima ya está pidiendo. */
  const fechaDeLicencia = deTexto(licencia);
  const avisoDeLicencia = fechaDeLicencia ? comoSeDice({ vence: fechaDeLicencia }) : null;
  const decir = useDecir();
  const [faltaLaFoto, setFaltaLaFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  /**
   * EL FALLO SE QUEDA EN PANTALLA.
   *
   * Guardar iba a un aviso pasajero: si la subida de la foto fallaba —el
   * cubo `carros` de la 0038 sin crear, por ejemplo— el carro NO se
   * guardaba, el aviso se iba solo, y el formulario quedaba idéntico. Desde
   * fuera parecía que había funcionado. Ahora el motivo se queda escrito
   * junto al botón hasta que se vuelve a intentar.
   */
  const [fallo, setFallo] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  /** El archivo reducido, listo para subir al guardar. La vista previa va en
      `borrador.foto` como `data:` URI — así la tarjeta la enseña al momento. */
  const laFoto = useRef<Blob | null>(null);

  /* El menú se abre DONDE se tocó, no al pie de la pantalla: la fila mide
     su sitio en la ventana y la lista cae pegada a ella. Si abajo no cabe,
     sube y se apoya en el borde de arriba de la misma fila. */
  const abrirMenu = (cual: Eligiendo, sitio: Sitio) => setMenu({ cual, sitio });

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
      /* También lo que falta se queda escrito: un aviso que se va solo
         deja el formulario idéntico y parece que guardó. */
      setFallo(falta);
      decir(falta);
      return;
    }
    setGuardando(true);
    setFallo(null);
    try {
      let foto = borrador.foto as string;
      if (laFoto.current) foto = await subirFotoDelCarro(yo, laFoto.current, foto);
      await guardarCarro(yo, { ...borrador, foto });
      /* La licencia va aparte: es del perfil, no del carro. Se guarda sólo
         cuando lo escrito ES una fecha; a medio teclear no se toca nada. */
      if (fechaDeLicencia || licencia.trim() === '') {
        await guardarVencimientoDeLicencia(yo, fechaDeLicencia).catch(() => {});
      }
      volver();
    } catch (e) {
      const porque = e instanceof Error ? e.message : 'No se pudo guardar. Prueba otra vez.';
      setFallo(porque);
      decir(porque);
    } finally {
      setGuardando(false);
    }
  };

  /** Lo que la lista abierta enseña y hace. */
  const lista =
    menu?.cual === 'marca'
      ? {
          opciones: cat.marcas,
          puesta: borrador.marca,
          elegir: (m: string) => setBorrador((b) => cambiarMarca(b, m)),
        }
      : menu?.cual === 'modelo'
        ? {
            opciones: cat.modelos,
            puesta: borrador.modelo,
            elegir: (m: string) => setBorrador((b) => cambiarModelo(b, m)),
          }
        : menu?.cual === 'anio'
          ? {
              opciones: cat.anios,
              puesta: borrador.anio,
              elegir: (a: string) => setBorrador((b) => ({ ...b, anio: a })),
            }
          : null;

  /* Dónde cae la lista. `alto` se estima por las opciones —una fila mide
     46— con su techo; si no cabe debajo, se ancla arriba de la fila. */
  const ventana = Dimensions.get('window');
  const altoLista = lista ? Math.min(lista.opciones.length * 46 + 10, 300) : 0;
  const cabeDebajo = menu ? menu.sitio.y + menu.sitio.alto + altoLista + 16 < ventana.height : true;

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
            primera
            alPulsar={(sitio) => abrirMenu('marca', sitio)}
          />
          <FilaQueElige
            etiqueta="Modelo"
            valor={borrador.modelo}
            alPulsar={(sitio) => abrirMenu('modelo', sitio)}
          />
          <FilaQueElige
            etiqueta="Año"
            valor={borrador.anio}
            alPulsar={(sitio) => abrirMenu('anio', sitio)}
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
          {/* La placa se ESCRIBE, y tiene que parecerlo: un texto suelto
              sobre la hoja no se lee como campo — el dueño no supo dónde
              tocar (25-08). Ahora es una caja con su borde, como todo
              campo del sistema. */}
          <View style={[estilos.fila, estilos.filaPrimera, estilos.filaPlaca]}>
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
            <Text style={estilos.notaCampo}>
              Guardamos solo sus tres últimos. La placa entera vive en la foto.
            </Text>
          </View>

          {/* **CUÁNDO SE VENCE TU LICENCIA** (0047, 28-08-2026). Va aquí
              porque es donde vive el papeleo de quien maneja, pero se guarda
              en el PERFIL: la licencia es de la persona, y quien tiene dos
              carros no tiene dos licencias.

              Se pide en DD/MM/AAAA, que es como está impresa — copiarla no
              debería obligar a nadie a reordenar nada. **Sólo la fecha**: ni
              foto ni número, igual que la cédula (R6). */}
          <View style={[estilos.fila, estilos.filaPlaca]}>
            <Epigrafe>Tu licencia se vence</Epigrafe>
            <TextInput
              value={licencia}
              onChangeText={setLicencia}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={color.ink300}
              keyboardType="number-pad"
              maxLength={10}
              accessibilityLabel="Cuándo se vence tu licencia de conducir"
              style={estilos.entradaPlaca}
            />
            <Text style={estilos.notaCampo}>
              {avisoDeLicencia ??
                'Solo la fecha: ni la foto ni el número salen de tu teléfono. Te avisamos un mes antes.'}
            </Text>
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

        {/* ── LO QUE TIENE EL CARRO (0045) ────────────────────────────
            Pedido del dueño el 27-08-2026: que quien maneja pueda decir qué
            ofrece su carro. Va aquí y no en cada publicación porque el aire
            no se instala el viernes y se quita el domingo. */}
        <View style={estilos.tarjeta}>
          <Text style={estilos.tituloFoto}>Lo que tiene tu carro</Text>
          <Text style={estilos.ayudaComodidad}>
            Se ve en la ficha del viaje, junto al modelo. Sólo se anuncia lo que hay.
          </Text>
          <View style={{ marginTop: 14 }}>
            <Interruptor
              activo={borrador.aire}
              alCambiar={(v) => setBorrador((b) => ({ ...b, aire: v }))}
              etiqueta="Aire acondicionado"
              descripcion="Tres horas de carretera se notan."
            />
          </View>
          <View style={{ marginTop: 14 }}>
            <Interruptor
              activo={borrador.usb}
              alCambiar={(v) => setBorrador((b) => ({ ...b, usb: v }))}
              etiqueta="Enchufe USB"
              descripcion="Para que puedan cargar el teléfono."
            />
          </View>
        </View>

        {/* ── El resumen, que se arma solo ────────────────────────────── */}
        <View style={[estilos.tarjeta, estilos.tarjetaResumen]}>
          <View style={estilos.cuadroCarro}>
            <Silueta forma={categoriaDe(borrador.modelo)} tinta={elegido.muestra} />
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
        {fallo ? (
          <View style={estilos.fallo}>
            <Text style={estilos.falloTexto}>{fallo}</Text>
          </View>
        ) : null}
        <Boton desactivado={guardando} alPulsar={guardar}>
          {guardando ? 'Guardando…' : fallo ? 'Intentar otra vez' : 'Guardar el carro'}
        </Boton>
        <Text style={estilos.notaPie}>
          {fallo ? 'Nada se perdió: lo que escribiste sigue aquí.' : 'Puedes tener más de uno y elegir al publicar.'}
        </Text>
      </View>

      {/* ── La lista, anclada a la fila que la abrió ──────────────── */}
      <Modal visible={menu != null} animationType="fade" transparent onRequestClose={() => setMenu(null)}>
        <Pressable style={estilos.fondoMenu} onPress={() => setMenu(null)} />
        {menu && lista ? (
          <View
            style={[
              estilos.menu,
              {
                left: menu.sitio.x,
                width: menu.sitio.ancho,
                maxHeight: altoLista,
                ...(cabeDebajo
                  ? { top: menu.sitio.y + menu.sitio.alto + 6 }
                  : { top: Math.max(12, menu.sitio.y - altoLista - 6) }),
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {lista.opciones.map((opcion, i) => {
                const puesta = opcion === lista.puesta;
                return (
                  <Pressable
                    key={opcion}
                    accessibilityRole="button"
                    accessibilityState={{ selected: puesta }}
                    onPress={() => {
                      lista.elegir(opcion);
                      setMenu(null);
                    }}
                    style={({ pressed }) => [
                      estilos.opcion,
                      i === 0 && estilos.opcionPrimera,
                      pressed && pulsado.celda,
                    ]}
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
        ) : null}
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
  primera = false,
  alPulsar,
}: {
  etiqueta: string;
  valor: string;
  /** La de arriba no estrena línea: la hoja ya tiene su borde. */
  primera?: boolean;
  alPulsar: (sitio: { x: number; y: number; ancho: number; alto: number }) => void;
}) {
  const caja = useRef<View>(null);
  return (
    <Pressable
      ref={caja}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ text: valor }}
      onPress={() =>
        caja.current?.measureInWindow((x, y, ancho, alto) => alPulsar({ x, y, ancho, alto }))
      }
      style={({ pressed }) => [
        estilos.fila,
        primera && estilos.filaPrimera,
        pressed && pulsado.celda,
      ]}
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

/**
 * LA SILUETA, POR CARROCERÍA.
 *
 * Una fotografía de cada modelo no se puede enviar: las de los fabricantes
 * y las de los bancos de imágenes tienen dueño, y son cientos de modelos.
 * Lo que sí distingue de un vistazo es la FORMA — un hatchback no se
 * confunde con una SUV —, y el catálogo ya sabe la categoría de cada
 * modelo. Dibujada aquí, es nuestra, y se tiñe del color elegido.
 */
function Silueta({ forma, tinta }: { forma: 'economy' | 'standard' | 'suv'; tinta: string }) {
  const cuerpo =
    forma === 'suv'
      ? 'M4 15c0-2 .8-3.3 2.4-3.9L12 9l3.4-4.2C16.3 3.7 17.5 3 19 3h9.6c1.6 0 2.8.7 3.7 1.9L35.6 9l5 1.6C42.4 11.3 44 12.9 44 15v3.3c0 .6-.4 1-1 1h-2.3a4.4 4.4 0 0 0-8.8 0H16.1a4.4 4.4 0 0 0-8.8 0H5c-.6 0-1-.4-1-1V15Z'
      : forma === 'economy'
        ? 'M5 16.2c0-1.9.8-3.1 2.3-3.7l5.4-2 3.2-3.6C16.8 5.7 18 5.1 19.4 5.1h7c1.4 0 2.5.5 3.4 1.5l4 4.5 3.4 1.1c1.6.6 2.8 1.8 2.8 3.7v2.4c0 .6-.4 1-1 1h-2.2a4.4 4.4 0 0 0-8.8 0H16.1a4.4 4.4 0 0 0-8.8 0H6c-.6 0-1-.4-1-1v-1.6Z'
        : 'M4 16.4c0-2 .7-3.3 2.3-3.9l6-2.2 3.3-3.3C16.6 5.9 17.8 5.3 19.3 5.3h9c1.6 0 2.6.5 3.5 1.5l3.4 3.8 5.4 1.4C43 12.6 44 14 44 16.4v2.2c0 .6-.4 1-1 1h-2.3a4.4 4.4 0 0 0-8.8 0H16.1a4.4 4.4 0 0 0-8.8 0H5c-.6 0-1-.4-1-1v-2.2Z';
  return (
    <Svg viewBox="0 0 48 24" width={44} height={22} fill="none">
      <Path d={cuerpo} fill={tinta} />
      <Circle cx={11.7} cy={19.3} r={3} fill={color.ink900} opacity={0.34} />
      <Circle cx={35.9} cy={19.3} r={3} fill={color.ink900} opacity={0.34} />
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

  filaPlaca: { flexDirection: 'column', alignItems: 'stretch', gap: 0 },
  /** La placa se escribe: caja con borde, como todo campo del sistema. */
  entradaPlaca: {
    marginTop: 8,
    height: 52,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
    paddingHorizontal: 14,
    ...texto.tituloTarjeta,
    color: color.ink900,
    fontFamily: familia,
    letterSpacing: 0.5,
    ...tabular,
    outlineStyle: 'none',
  } as never,
  notaCampo: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    color: color.ink500,
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
  ayudaComodidad: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink500,
    fontFamily: familia,
  },
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
    width: 56,
    height: 40,
    borderRadius: radio.cuadrado,
    backgroundColor: color.sand100,
    alignItems: 'center',
    justifyContent: 'center',
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
  fallo: {
    marginBottom: 12,
    backgroundColor: color.rojo100,
    borderRadius: radio.m,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  falloTexto: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink500,
    marginTop: 10,
    fontFamily: familia,
  },

  /* ── La lista anclada ── */
  fondoMenu: { flex: 1, backgroundColor: 'rgba(10,39,49,.18)' },
  menu: {
    position: 'absolute',
    backgroundColor: color.blanco,
    borderRadius: radio.m,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    paddingHorizontal: 14,
    overflow: 'hidden',
    ...sombra.l,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  opcionPrimera: { borderTopWidth: 0 },
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

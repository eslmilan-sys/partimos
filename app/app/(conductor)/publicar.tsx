/**
 * `5c` Publicar — una sola pantalla: el carro registrado, las paradas del camino,
 * el aporte calculado, los puestos, las maletas, solo mujeres, y publicar.
 *
 * Aquí vive el modelo entero. Mover el stepper de puestos recalcula el aporte,
 * reescribe el botón y reescribe la cuenta de abajo. La pastilla dice de dónde
 * sale la cifra: sugerido, lo cambiaste, o tope de la ruta.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import {
  APORTE_MINIMO_CENTAVOS,
  CONSUMO_L_100KM,
  aporteCalculado,
  costoDelViaje,
  elTopeMuerde,
  origenDelAporte,
} from '@/dominio/aporte';
import {
  type Reparto,
  comodidadDeAtras,
  cuantosPuestos,
  puedeOfrecerSoloMujeres,
  repartoDeUnTotal,
  repartoPorDefecto,
} from '@/dominio/puestos';
import { desdeCadaParada } from '@/dominio/tramos';
import { carrosDe } from '@/servicios/carros';
import { miGenero } from '@/servicios/perfiles';
import type { Vehicle } from '@/tipos';
import { type Lugar, aParams } from '@/dominio/lugar';
import { LO_QUE_FALTA, quePuedeHacer } from '@/dominio/permiso';
import {
  type PublicacionPreparada,
  type RutaPublicable,
  diaEnPanama,
  prepararPublicacion,
  repartoDelCosto,
  estimarRuta,
  rutasPublicables,
} from '@/servicios/viajes';
import { plantillaDeViaje } from '@/servicios/panel';
import { aDondeSeVaDesde, ciudadesDeSalida } from '@/servicios/lugares';
import { guardarRutaBuscada } from '@/servicios/rutas';
import type { Licencia } from '@/dominio/licencia';
import { type EstadoDeCedula, estadoDeCedula, licenciaDe } from '@/servicios/seguridad';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { BuscadorDeLugar } from '@/ui/BuscadorDeLugar';
import { Cargando } from '@/ui/Cargando';
import { Regula } from '@/ui/Regula';
import { CarroConPuestos } from '@/ui/CarroConPuestos';
import { Brillo, CampoRojo } from '@/ui/CampoRojo';
import { type Opcion, HojaDeEleccion } from '@/ui/HojaDeEleccion';
import { ElegirDia, diaEnChip } from '@/ui/ElegirDia';
import { ElegirHora, franjaDelDia } from '@/ui/ElegirHora';
import { Boton, Epigrafe, Interruptor, Pastilla, Stepper } from '@/ui/controles';
import { cifraRedonda, formatearDinero, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaCorto, hora, mas } from '@/ui/fechas';
import { Atras, Avanza, Carro, Cerrar, Escudo, Mas } from '@/ui/iconos';
import { familia, color, espacio, radio, texto, zonaDeToque } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';
/**
 * LA RUTA Y LA HORA ERAN DOS CONSTANTES DE ESTE ARCHIVO.
 *
 * `const RUTA = 'panama-chitre'` y una fecha de noviembre de 2026: un
 * conductor solo podía publicar Panamá → Chitré, ese día, a esa hora. Ahora
 * las tres se eligen, y la lista de rutas es la de los corredores abiertos.
 */
/**
 * LA HORA DE PANAMÁ, en 'HH:MM'. Es el suelo del selector cuando el viaje
 * sale hoy: el teléfono puede estar en cualquier huso y la salida no.
 */
function horaDePanama(): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Panama',
  }).format(new Date());
}


/** Lo que cuesta desviarse a recoger en cada parada. */
const MINUTOS_POR_PARADA = 5;

/** Una ciudad del catálogo, con la forma que esperan los campos de lugar. */
function lugarDeCiudad(nombre: string, slug: string): Lugar {
  return {
    nombre,
    citySlug: slug || null,
    tipo: 'ciudad',
    fuente: 'catalogo',
    contexto: 'Panamá',
    lat: null,
    lng: null,
  };
}

/**
 * LOS PASOS, EN EL ORDEN EN QUE SE DECIDEN.
 *
 * **Por qué en pasos** (27-08-2026, pedido del dueño con capturas de
 * BlaBlaCar). Esta pantalla era un formulario entero de una vez: ruta, día,
 * hora, carro, paradas, aporte y cuatro interruptores, todo a la vez y con
 * el botón de publicar al final. Quien publica por primera vez no sabe por
 * dónde empezar, y quien ya sabe se pierde el aporte de las paradas porque
 * está a tres desplazamientos de distancia.
 *
 * Una pantalla, una decisión. Y en ESTE orden porque es el orden en que se
 * piensa un viaje: a dónde voy, por dónde paso, qué día, a qué hora, en qué
 * carro y con cuántos puestos, cuánto aporta cada quien, cuánto aporta el
 * que sube a mitad de camino, en qué condiciones, y qué quiero decirles.
 */
const PASOS = [
  'ruta',
  'paradas',
  'dia',
  'hora',
  'carro',
  'aporte',
  'tramos',
  'condiciones',
  'comentario',
] as const;
type Paso = (typeof PASOS)[number];

/** El rótulo del campo rojo, por paso. Dice DÓNDE estás, no qué hacer. */
/**
 * Los peajes del viaje, deducidos de lo que ya se calculó.
 *
 * `PublicacionPreparada` trae el costo y la distancia pero no los peajes por
 * separado, y los tramos los necesitan: son de la carretera y se reparten
 * como el camino. Se despejan de la misma fórmula en vez de añadir un campo
 * que habría que mantener en dos sitios.
 */
function peajeDelViaje(d: { costoCentavos: number; distanciaKm: number }): number {
  const gasolina = costoDelViaje({
    distanciaKm: d.distanciaKm,
    peajeCentavos: 0,
    consumoL100km: CONSUMO_L_100KM.standard,
  });
  return Math.max(0, d.costoCentavos - gasolina);
}

const COMO_SE_LLAMA_EL_PASO: Record<Paso, string> = {
  ruta: '¿De dónde a dónde?',
  paradas: '¿Por dónde pasas?',
  dia: '¿Qué día sales?',
  hora: '¿A qué hora sales?',
  carro: '¿Con qué carro y cuántos puestos?',
  aporte: '¿Cuánto aporta cada quien?',
  tramos: '¿Y quien sube en el camino?',
  condiciones: 'Las condiciones del viaje',
  comentario: '¿Algo que decirles?',
};

export default function Publicar() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [rutas] = useState<RutaPublicable[]>(() => rutasPublicables());
  const [ruta, setRuta] = useState('');
  /**
   * LA RUTA EN DOS CAMPOS — de dónde sales y a dónde vas — porque alguien
   * irá a un punto que la lista no trae y merece saber su aporte exacto.
   * Cuando el par casa con un corredor abierto, todo sigue igual que
   * siempre; cuando no, la pantalla calcula con la misma fórmula y ofrece
   * guardar la ruta.
   */
  const [desde, setDesde] = useState<Lugar | null>(null);
  const [hacia, setHacia] = useState<Lugar | null>(null);
  const [buscandoLugar, setBuscandoLugar] = useState<'desde' | 'hacia' | null>(null);
  const [rutaGuardada, setRutaGuardada] = useState(false);
  const [dia, setDia] = useState(() => diaEnPanama(new Date()));
  const [horaSalida, setHoraSalida] = useState('06:00');
  const [eligiendo, setEligiendo] = useState<'dia' | 'hora' | null>(null);
  const [datos, setDatos] = useState<PublicacionPreparada | null>(null);
  /**
   * VOLVER TIENE QUE VOLVER A MIRAR.
   *
   * «Falta registrar tu carro» manda a `carro`, y `useVolver` hace
   * `router.back()`: esta pantalla NO se desmonta, sigue viva detrás. Sus
   * efectos dependen de la ruta y la hora —nada de eso cambió al registrar
   * el carro—, así que al volver seguía enseñando el `datos` de antes y
   * pedía el carro OTRA VEZ, aunque estuviera guardado. Medido en el
   * teléfono del dueño el 25-08.
   *
   * Este contador sube cada vez que la pantalla VUELVE al frente —no la
   * primera— y entra en las dependencias: volver es preguntar de nuevo.
   *
   * En web la pantalla se remonta al volver, así que allí ya se preguntaba
   * de nuevo; esto es para el teléfono, donde sigue viva detrás. Medido con
   * una sonda el 25-08: sin saltar la primera vez, montar preparaba dos
   * veces seguidas.
   */
  const [vueltas, setVueltas] = useState(0);
  const yaSeMonto = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!yaSeMonto.current) {
        yaSeMonto.current = true;
        return;
      }
      setVueltas((n) => n + 1);
    }, []),
  );
  const [cedula, setCedula] = useState<EstadoDeCedula | null>(null);
  /** Lo que Didit dice de la licencia de quien publica (28-08-2026). */
  const [licencia, setLicencia] = useState<Licencia>({ vence: null });
  /**
   * LAS PARADAS ELEGIDAS, por índice — no un contador. Con el contador solo
   * se podía añadir «la siguiente»: quien quería parar en Penonomé pero NO
   * en La Chorrera no tenía cómo decirlo (pedido el 25-08). Máximo dos:
   * cuatro puntos de recogida por viaje es regla del producto.
   */
  const [elegidas, setElegidas] = useState<number[]>([]);
  /**
   * SI SE VE EL CAMINO ENTERO O SÓLO SU PRINCIPIO.
   *
   * Panamá → Las Tablas atraviesa DIECISÉIS ciudades del catálogo, y de ellas
   * caben dos. Enseñar las dieciséis de golpe es empujar el resto de la
   * pantalla —el recorrido, la llegada, el botón— fuera de la vista para
   * elegir dos. Se abren las primeras del camino, que son las que un viaje
   * desde Panamá recoge de verdad, y las demás quedan a un toque, contadas.
   */
  const [verTodasLasParadas, setVerTodasLasParadas] = useState(false);
  /* `puestos` YA NO ES ESTADO: se deriva del reparto adelante/atrás (0045).
     Dos fuentes para el mismo número acaban contradiciéndose. */
  /**
   * CUÁL DE MIS CARROS. `null` es «el primero», que es lo que hacía siempre.
   * Quien tiene dos —el sedán entre semana y la camioneta el fin de semana—
   * no podía publicar con el segundo: «Cambiar» sólo llevaba a registrar otro.
   */
  const [carroId, setCarroId] = useState<string | null>(null);
  const [misCarros, setMisCarros] = useState<Vehicle[]>([]);
  const [eligiendoCarro, setEligiendoCarro] = useState(false);
  const [aporteElegido, setAporteElegido] = useState<number | null>(null);
  /** Lo que el conductor deja puesto en cada tramo, por índice de parada. */
  const [aportesDeTramo, setAportesDeTramo] = useState<Record<number, number>>({});
  /** En qué paso vas. Uno por decisión: ver `PASOS`. */
  const [paso, setPaso] = useState<Paso>('ruta');
  /**
   * DÓNDE VA SENTADA LA GENTE (0045). `seats_offered` decía cuántos y no
   * dónde, y el sitio importa: tres atrás van apretados, dos van cómodos.
   * `puestos` sigue existiendo porque el cálculo del aporte sólo necesita
   * el total; aquí se deriva de las dos filas.
   */
  const [reparto, setReparto] = useState<Reparto>({ adelante: 1, atras: 2 });
  /** Lo que el conductor quiere decirles. Va a `trips.notes`. */
  const [comentario, setComentario] = useState('');
  /** Si quien maneja puede ofrecer «solo mujeres»: sólo si es mujer. */
  const [soyMujer, setSoyMujer] = useState(false);
  const [aceptaMaletas, setAceptaMaletas] = useState(true);
  const [soloMujeres, setSoloMujeres] = useState(false);
  const [aceptaMascotas, setAceptaMascotas] = useState(false);
  const [sePuedeFumar, setSePuedeFumar] = useState(false);

  /** La salida, ya montada: el día que elegiste a la hora que elegiste. */
  const puestos = cuantosPuestos(reparto);
  const salidaISO = `${dia}T${horaSalida}:00-05:00`;
  /**
   * **UNA SALIDA EN EL PASADO NO SE PUBLICA.** Visto en la captura del
   * dueño: BlaBlaCar lo rechaza al final, con una franja roja. Aquí se
   * dice en el paso de la hora, que es donde se puede arreglar.
   */
  const saleEnElPasado = new Date(salidaISO).getTime() < Date.now();
  useEffect(() => {
    if (!yo) return;
    estadoDeCedula(yo).then(setCedula);
    licenciaDe(yo).then(setLicencia);
  }, [yo]);


  /**
   * PUBLICAR DE NUEVO. `?deViaje=<id>` llega del panel — «Para repetir» — y
   * rellena el formulario con aquel viaje: la ruta a nivel de ciudad, la
   * hora a la que saliste y los puestos que ofreciste. La fecha nace en hoy
   * y el punto exacto se vuelve a elegir: es lo único que cambia de una
   * semana a otra. Dos toques en vez del formulario entero.
   */
  const { deViaje } = useLocalSearchParams<{ deViaje?: string }>();
  useEffect(() => {
    if (!deViaje) return;
    plantillaDeViaje(deViaje).then((t) => {
      if (!t) return;
      setDesde(t.origen);
      setHacia(t.destino);
      setHoraSalida(t.hora);
      setReparto(repartoDeUnTotal(t.puestos));
    });
  }, [deViaje]);

  useEffect(() => {
    if (rutas.length === 0 || desde || hacia || deViaje) return;
    const primera = rutas[0];
    setRuta(primera.slug);
    setDesde(lugarDeCiudad(primera.origen, primera.origenSlug));
    setHacia(lugarDeCiudad(primera.destino, primera.destinoSlug));
  }, [rutas, desde, hacia, deViaje]);

  /** El par elegido manda: corredor abierto si casa, ruta libre si no. */
  const estimacion = desde && hacia ? estimarRuta(desde, hacia, puestos) : null;
  useEffect(() => {
    if (!desde || !hacia) return;
    const slug = estimarRuta(desde, hacia)?.corredorSlug ?? '';
    setRuta(slug);
    if (!slug) setDatos(null);
    setAporteElegido(null);
    setElegidas([]);
    setRutaGuardada(false);
  }, [desde, hacia]);

  useEffect(() => {
    if (!yo) return;
    /* Ruta libre (24-08-2026): sin corredor también se prepara — con los
       dos lugares elegidos. Sin par completo no hay nada que preparar. */
    if (!ruta && !(desde && hacia)) return;
    prepararPublicacion(
      yo,
      ruta,
      salidaISO,
      !ruta && desde && hacia ? { desde, hacia } : undefined,
      carroId ?? undefined,
    )
      .then(setDatos)
      .catch(() => setDatos(null));
  }, [yo, ruta, salidaISO, desde, hacia, vueltas, carroId]);

  useEffect(() => {
    if (!yo) return;
    carrosDe(yo).then(setMisCarros).catch(() => setMisCarros([]));
    /* «Solo mujeres» sólo se ofrece a una conductora: la etiqueta promete un
       carro donde todas a bordo son mujeres, y con un hombre al volante la
       promesa no se sostiene. Sin saberlo, no se ofrece. */
    miGenero(yo)
      .then((g) => setSoyMujer(puedeOfrecerSoloMujeres(g)))
      .catch(() => setSoyMujer(false));
  }, [yo, vueltas]);

  /* El reparto arranca en lo que el carro da: quien elige otro carro no tiene
     que volver a decir cuántos puestos ofrece. */
  useEffect(() => {
    if (!datos) return;
    setReparto(repartoPorDefecto(datos.carro.seats_total));
  }, [datos?.carro.id]);

  /* Una condición que ya no se puede sostener no se queda encendida: si el
     perfil deja de decir que es mujer, el interruptor se apaga solo. */
  useEffect(() => {
    if (!soyMujer && soloMujeres) setSoloMujeres(false);
  }, [soyMujer, soloMujeres]);

  const calculado = useMemo(
    () => (datos ? aporteCalculado(datos.costoCentavos, puestos, datos.topeCentavos) : 0),
    [datos, puestos],
  );
  const aporte = aporteElegido ?? calculado;
  const cuenta = datos ? repartoDelCosto(datos.costoCentavos, aporte, puestos) : null;
  /** ¿La cifra que se enseña es el tope y no el reparto? La pantalla lo dice. */
  const topeMuerde = !!datos && elTopeMuerde(datos.costoCentavos, puestos, datos.topeCentavos);

  /** El buscador de los dos campos, común a los dos modos de la pantalla. */
  const buscador = (
    <BuscadorDeLugar
      abierto={buscandoLugar !== null}
      titulo={buscandoLugar === 'desde' ? 'Desde dónde sales' : 'A dónde vas'}
      sugerencias={
        buscandoLugar === 'hacia'
          ? aDondeSeVaDesde(desde?.citySlug ?? '')
          : ciudadesDeSalida()
      }
      alElegir={(l) => {
        if (buscandoLugar === 'desde') setDesde(l);
        else setHacia(l);
        setBuscandoLugar(null);
      }}
      alCerrar={() => setBuscandoLugar(null)}
    />
  );

  /**
   * TODA RUTA SE PUBLICA — decidido el 24-08-2026. El par que no casa con
   * ningún corredor sigue por el MISMO formulario de siempre: la distancia
   * sale de las coordenadas, los peajes van en cero, y la base lo acepta
   * desde 0022. Esta pantalla intermedia solo queda para el único caso que
   * de verdad no puede seguir: un par SIN coordenadas, al que no se le puede
   * calcular el aporte — y sin aporte calculado no hay tope que defender.
   */
  if (desde && hacia && !ruta && !estimacion) {
    return (
      <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 18 }}
          showsVerticalScrollIndicator={false}
        >

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
            <Text style={estilos.epigrafeCampo}>Publicar · ruta nueva</Text>
          </View>
          <Text style={estilos.titular} numberOfLines={2}>
            {`${desde.nombre} → `}
            <Text style={texto.titularFuerte}>{hacia.nombre}</Text>
          </Text>
        </View>

          <View style={estilos.hoja}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Salgo de ${desde.nombre}. Cambiar`}
              onPress={() => setBuscandoLugar('desde')}
              style={estilos.eleccion}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.eleccionEtiqueta}>Salgo de</Text>
                <Text style={estilos.eleccionValor} numberOfLines={1}>
                  {desde.nombre}
                </Text>
              </View>
              <Avanza tinta={color.ink300} />
            </Pressable>
            <View style={estilos.filete} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Voy a ${hacia.nombre}. Cambiar`}
              onPress={() => setBuscandoLugar('hacia')}
              style={estilos.eleccion}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.eleccionEtiqueta}>Voy a</Text>
                <Text style={estilos.eleccionValor} numberOfLines={1}>
                  {hacia.nombre}
                </Text>
              </View>
              <Avanza tinta={color.ink300} />
            </Pressable>

            <View style={estilos.separadorHoja} />

            {/* Aquí solo se llega SIN estimación: el resumen con cifras vive
                en el formulario normal, que ahora recibe también la ruta
                libre. */}
            <Text style={estilos.notaLibre}>
              A este par le faltan coordenadas para estimar la distancia. Elige
              los sitios desde las sugerencias del buscador.
            </Text>
          </View>

          <View style={estilos.pieLibre}>
            <Text style={estilos.notaPie}>
              A este par le faltan coordenadas para calcular el aporte, y sin
              cálculo no se publica. Elige los sitios desde las sugerencias del
              buscador — o guarda la ruta y te avisamos.
            </Text>
            {rutaGuardada ? (
              <Boton tono="blanco" desactivado>
                Guardada. Te avisamos
              </Boton>
            ) : (
              <Boton
                desactivado={!yo || !desde.citySlug || !hacia.citySlug}
                alPulsar={async () => {
                  if (!yo || !desde.citySlug || !hacia.citySlug) return;
                  await guardarRutaBuscada(yo, desde.citySlug, hacia.citySlug, dia);
                  setRutaGuardada(true);
                }}
              >
                Guardar esta ruta
              </Boton>
            )}
            {!desde.citySlug || !hacia.citySlug ? (
              <Text style={estilos.notaPie}>
                Para avisarte hace falta que los dos extremos sean ciudades que
                servimos; el cálculo de arriba vale igual.
              </Text>
            ) : null}
          </View>
        </ScrollView>

        {buscador}
      </View>
    );
  }

  if (!datos || !cuenta) return <Cargando />;

  /**
   * QUÉ FALTA PARA PODER PUBLICAR — y por qué se enseña al final y no antes.
   *
   * Antes, quien no tenía carro chocaba con una pared —«Primero, tu carro»— y
   * quien no tenía la cédula verificada llegaba hasta el final para que se lo
   * dijeran allí. Las dos son la misma equivocación: pedir los papeles antes
   * de haber enseñado para qué sirven.
   *
   * Ahora la pantalla entera funciona sin nada de eso. Se elige la ruta, la
   * hora, los puestos, y se ve **cuánto se recupera**, que es la única razón
   * por la que alguien registraría un carro. El requisito aparece abajo,
   * cuando ya sabe qué se está perdiendo, con la puerta al lado.
   */
  const { falta } = quePuedeHacer({
    tieneCarroPropio: datos.carroPropio,
    estadoDeCedula: cedula?.estado ?? 'pendiente',
    /* La licencia vencida cierra la publicación (0047). Nula no cierra nada:
       nadie pierde el acceso por una columna que no existía cuando abrió su
       cuenta. */
    licencia,
  });
  const queFalta = falta ? LO_QUE_FALTA[falta] : null;

  const laRuta = rutas.find((r) => r.slug === ruta);

  const origen = origenDelAporte(aporteElegido, aporte, datos.topeCentavos);
  const salida = new Date(datos.salida);
  const MAX_INTERMEDIAS = 2;
  const enOrden = [...elegidas].sort((a, b) => a - b).slice(0, MAX_INTERMEDIAS);
  const paradas = enOrden.length;
  const paradasVisibles = enOrden
    .map((i) => ({ indice: i, ...datos.paradasOfrecidas[i] }))
    .filter((p) => p.nombre != null);
  const porElegir = datos.paradasOfrecidas
    .map((p, i) => ({ indice: i, ...p }))
    .filter((p) => !enOrden.includes(p.indice));
  const hayHueco = paradas < MAX_INTERMEDIAS;
  /** Cuántas se abren sin pedirlo. Ver `verTodasLasParadas`. */
  const A_LA_VISTA = 6;
  const seVen = verTodasLasParadas ? porElegir : porElegir.slice(0, A_LA_VISTA);
  const escondidas = porElegir.length - seVen.length;

  // Cada parada cuesta unos minutos; la llegada se mueve con ellas.
  const llegada = hora(mas(salida, datos.duracionMin + paradas * MINUTOS_POR_PARADA));

  /* El paso de los tramos sólo existe si hay paradas: preguntar «¿y quien
     sube en el camino?» en un viaje directo es una pantalla que no decide
     nada. Los pasos se cuentan sobre los que de verdad se van a ver. */
  const losPasos = PASOS.filter((x) => x !== 'tramos' || paradas > 0);
  const indiceDelPaso = Math.max(0, losPasos.indexOf(paso));
  const esElUltimo = indiceDelPaso === losPasos.length - 1;

  const nombreDeParada = (i: number): string =>
    i === 0 ? datos.origen : (paradasVisibles[i - 1]?.nombre ?? datos.destino);

  /* Las fracciones de camino de cada parada, que es de donde salen los
     kilómetros de cada tramo. La última es el destino: el camino entero. */
  const fracciones = [
    0,
    ...paradasVisibles.map((p) => Math.min(0.99, p.minutos / Math.max(1, datos.duracionMin))),
    1,
  ];
  const tramos = desdeCadaParada(
    fracciones,
    datos.distanciaKm,
    peajeDelViaje(datos),
    puestos,
    datos.carro.consumption_l_100km ?? 7.5,
  ).filter((t) => t.desde > 0);

  /** Lo que impide seguir, dicho donde se puede arreglar. */
  const noSePuedeSeguir =
    paso === 'ruta' && !(desde && hacia)
      ? 'Dinos de dónde sales y a dónde vas.'
      : paso === 'hora' && saleEnElPasado
        ? 'La salida no puede quedar en el pasado. Elige otra hora, o el día siguiente.'
        : paso === 'carro' && puestos < 1
          ? 'Sin puestos no hay viaje que publicar.'
          : null;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} motivo="palmera" />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() =>
              indiceDelPaso === 0 ? volver() : setPaso(losPasos[indiceDelPaso - 1])
            }
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {`Paso ${indiceDelPaso + 1} de ${losPasos.length} · ${laRuta?.origen ?? datos.origen} → ${laRuta?.destino ?? datos.destino}`}
          </Text>
        </View>

        {/* El avance se VE, no sólo se lee: un segmento por paso, los hechos
            en tinta plena. Es el mismo lenguaje que el registro. */}
        <View style={estilos.avance}>
          {losPasos.map((clave, i) => (
            <View
              key={clave}
              style={[estilos.segmento, i <= indiceDelPaso && estilos.segmentoHecho]}
            />
          ))}
        </View>

        <Text style={estilos.titular} numberOfLines={2}>
          {COMO_SE_LLAMA_EL_PASO[paso]}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* La hoja blanca que monta sobre el borde del campo. Sólo la llevan
            los pasos que ponen algo dentro: en los demás dejaba una tarjeta
            blanca vacía flotando bajo el titular. */}
        {['ruta', 'dia', 'hora', 'carro', 'paradas'].includes(paso) ? (
        <View style={estilos.hoja}>
          {paso === 'ruta' ? (
          <>
          {/* De dónde sales y a dónde vas — FILAS con filete, no burbujas con
              borde: cuatro rectángulos delineados casi tocándose leían como
              un formulario ruidoso (visto en el teléfono, 25-08). Es el mismo
              lenguaje de la tarjeta de búsqueda del Inicio: la tarjeta ya es
              el contorno, dentro solo hacen falta líneas de pelo. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Salgo de ${desde?.nombre ?? ''}. Cambiar`}
            onPress={() => setBuscandoLugar('desde')}
            style={({ pressed }) => [estilos.eleccion, pressed && estilos.eleccionPulsada]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.eleccionEtiqueta}>Salgo de</Text>
              <Text style={estilos.eleccionValor} numberOfLines={1}>
                {desde?.nombre ?? ''}
              </Text>
            </View>
            <Avanza tinta={color.ink300} />
          </Pressable>
          <View style={estilos.filete} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Voy a ${hacia?.nombre ?? ''}. Cambiar`}
            onPress={() => setBuscandoLugar('hacia')}
            style={({ pressed }) => [estilos.eleccion, pressed && estilos.eleccionPulsada]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.eleccionEtiqueta}>Voy a</Text>
              <Text style={estilos.eleccionValor} numberOfLines={1}>
                {hacia?.nombre ?? ''}
              </Text>
            </View>
            <Avanza tinta={color.ink300} />
          </Pressable>
          </>
          ) : null}

          {paso === 'dia' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Día: ${diaEnChip(dia)}. Cambiar`}
              onPress={() => setEligiendo('dia')}
              style={({ pressed }) => [estilos.eleccion, pressed && estilos.eleccionPulsada]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                {/* «SALGO», NO «SALGO EL». La respuesta puede ser «Hoy» o
                    «Mañana», y entonces el rótulo daba «Salgo el Mañana»,
                    que no es español (visto por el dueño el 29-08-2026). Sin
                    la preposición el rótulo vale para las tres respuestas que
                    `diaEnChip` sabe dar: hoy, mañana y «vie 30 ago». */}
                <Text style={estilos.eleccionEtiqueta}>Salgo</Text>
                <Text style={[estilos.eleccionValorGrande, tabular]} numberOfLines={1}>
                  {diaEnChip(dia)}
                </Text>
              </View>
              <Avanza tinta={color.ink300} />
            </Pressable>
          ) : null}

          {paso === 'hora' ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hora: ${horaSalida}. Cambiar`}
              onPress={() => setEligiendo('hora')}
              style={({ pressed }) => [estilos.eleccion, pressed && estilos.eleccionPulsada]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.eleccionEtiqueta}>Recojo a las</Text>
                {/* La franja al lado de la cifra, no sólo dentro de la hoja:
                    en un reloj de 24 h «18:30» y «06:30» se confunden de
                    reojo, y aquí es donde se comprueba antes de seguir. */}
                <View style={estilos.filaValor}>
                  <Text style={[estilos.eleccionValorGrande, tabular]}>{horaSalida}</Text>
                  <Text style={estilos.franjaDelDia}>{franjaDelDia(horaSalida)}</Text>
                </View>
              </View>
              <Avanza tinta={color.ink300} />
            </Pressable>
            <Text style={estilos.notaParadas}>
              {saleEnElPasado
                ? 'Esa hora ya pasó. Elige una más tarde, o cambia el día.'
                : `Llegas sobre las ${llegada}. Es una estimación con las paradas que elegiste.`}
            </Text>
          </>
          ) : null}

          {paso === 'carro' ? (
          <>
          {/* LA TARJETA DEL CARRO, arriba y aparte (30-08-2026, pedido del
              dueño: «make it more like the blablacar infrastructure»). Era un
              renglón único —«Elantra gris · ··· · 4 puestos»— que mezclaba
              tres cosas de distinto peso en la misma línea, y donde faltaba
              una salía el hueco: la captura del dueño enseña «Elantra gris ·
              · 4 puestos», con el separador de la placa que no existe.
              Nombre arriba, lo demás debajo, y cada trozo que falta
              desaparece con su separador. */}
          <View style={estilos.tarjetaCarro}>
            <View style={estilos.iconoCarro}>
              <Carro />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.nombreCarro} numberOfLines={1}>
                {[datos.carro.make, datos.carro.model, datos.carro.color?.toLowerCase()]
                  .filter(Boolean)
                  .join(' ')}
              </Text>
              <Text style={[estilos.detalleCarro, tabular]} numberOfLines={1}>
                {[datos.placa, `${datos.carro.seats_total} plazas`]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            {/**
             * «Cambiar» era un `Text` suelto: no era pulsable en absoluto, ni
             * con el dedo ni con lector de pantalla. Es uno de los tres
             * controles muertos que apunta `app/README.md`, y a la vez el caso
             * exacto de la corrección 5 del turno 14 — una acción de texto sin
             * área táctil. Ahora es un control de verdad, con sus 44 px.
             */}
            {/* **Elegir, no añadir** (27-08-2026). Llevaba derecho a registrar
                otro carro, así que quien ya tenía dos no tenía forma de usar
                el segundo — y quien sólo quería mirar acababa dando de alta un
                carro que no quería. Con un solo carro no hay nada que elegir y
                sigue llevando a registrar. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                misCarros.length > 1 ? 'Elegir con qué carro voy' : 'Registrar otro carro'
              }
              onPress={() =>
                misCarros.length > 1
                  ? setEligiendoCarro(true)
                  : router.push('/(conductor)/carro')
              }
              style={[{ marginLeft: 'auto', paddingHorizontal: 10 }, zonaDeToque]}
            >
              <Text style={estilos.cambiar}>{misCarros.length > 1 ? 'Elegir' : 'Cambiar'}</Text>
            </Pressable>
          </View>

          {/* **CUÁNTOS PUESTOS Y DÓNDE**, sobre el carro dibujado (0045, y
              30-08-2026 el dibujo). Eran dos steppers, «Adelante −/+» y
              «Atrás −/+»: dos contadores sobre un carro que no se veía, con
              lo que cada quien aporta a dos pasos de distancia. Ahora se toca
              el asiento, y la cifra está escrita dentro. Ver
              `ui/CarroConPuestos`. */}
          <Epigrafe>Toca los puestos que ofreces</Epigrafe>
          <View style={estilos.dibujoDelCarro}>
            <CarroConPuestos
              maximos={datos.puestosMaximos}
              reparto={reparto}
              aporteCentavos={aporte}
              nota={comodidadDeAtras(reparto)}
              alCambiar={(r) => {
                setReparto(r);
                setAporteElegido(null);
              }}
            />
          </View>
          </>
          ) : null}

          {paso === 'paradas' ? (
          <>
          {/* El límite se ve SIEMPRE —«0 de 2»—, no sólo al chocar con él.
              Y «Añadir todas» aparece cuando de verdad caben todas: antes
              pedía que la ruta ofreciera como mucho dos paradas, así que con
              tres o cuatro candidatas no salía nunca. */}
          <View style={estilos.filaParadasTitulo}>
            <Epigrafe>Dónde paras en el camino</Epigrafe>
            <Text style={estilos.cuentaParadas}>{`${paradas} de ${MAX_INTERMEDIAS}`}</Text>
            {porElegir.length > 1 && porElegir.length <= MAX_INTERMEDIAS - paradas ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Añadir todas las paradas"
                onPress={() => setElegidas((xs) => [...xs, ...porElegir.map((p) => p.indice)])}
                style={[{ marginLeft: 'auto', paddingHorizontal: 6 }, zonaDeToque]}
              >
                <Text style={estilos.cambiar}>Añadir todas</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={estilos.recorrido}>
            <View style={estilos.lineaRecorrido} />

            <View style={estilos.parada}>
              <View style={estilos.puntoLleno} />
              <Text style={estilos.paradaNombre}>{datos.origen}</Text>
              <Text style={estilos.paradaHora}>{hora(salida)}</Text>
            </View>

            {paradasVisibles.map((p) => (
              <View key={p.nombre} style={estilos.parada}>
                <View style={estilos.puntoIntermedio} />
                <Text style={estilos.paradaIntermedia}>{p.nombre}</Text>
                <Text style={estilos.paradaHora}>{hora(mas(salida, p.minutos))}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${p.nombre}`}
                  onPress={() => setElegidas((xs) => xs.filter((i) => i !== p.indice))}
                  style={estilos.quitar}
                >
                  <View style={estilos.quitarCirculo}>
                    <Cerrar />
                  </View>
                </Pressable>
              </View>
            ))}

            <View style={[estilos.parada, { paddingBottom: 0 }]}>
              <View style={estilos.puntoFinal} />
              <Text style={estilos.paradaNombre}>{datos.destino}</Text>
              <Text style={estilos.paradaHora}>{llegada}</Text>
            </View>
          </View>

          {/* PASTILLAS, no filas. La ruta ofrece hasta doce ciudades y sólo
              caben dos: doce renglones a lo ancho obligaban a desplazar la
              pantalla entera para ver el camino. En pastillas, EN EL ORDEN
              EN QUE SE PASAN, el conductor lee su ruta de un vistazo y toca
              la que quiere. Con el cupo lleno no desaparecen —esconderlas
              dejaba la pantalla sin explicación—: se apagan. */}
          {porElegir.length > 0 ? (
            <>
              <View style={estilos.pastillas}>
                {seVen.map((p) => (
                  <Pressable
                    key={p.indice}
                    accessibilityRole="button"
                    accessibilityLabel={`Añadir ${p.nombre}, pasas sobre las ${hora(mas(salida, p.minutos))}`}
                    disabled={!hayHueco}
                    onPress={() =>
                      setElegidas((xs) => (xs.length < MAX_INTERMEDIAS ? [...xs, p.indice] : xs))
                    }
                    style={({ pressed }) => [
                      estilos.pastilla,
                      !hayHueco && estilos.pastillaLlena,
                      pressed && estilos.eleccionPulsada,
                    ]}
                  >
                    <Mas tamano={13} tinta={hayHueco ? color.azul700 : color.ink300} />
                    <Text
                      style={[estilos.pastillaTexto, !hayHueco && estilos.pastillaTextoLleno]}
                      numberOfLines={1}
                    >
                      {p.nombre}
                    </Text>
                    {/* LA HORA A LA QUE PASAS POR AHÍ, en la pastilla y no
                        después de añadirla. Sin ella son dieciséis nombres
                        sin orden aparente y hay que añadir una para saber si
                        cae a las siete o a las diez; con ella la lista se lee
                        como lo que es, el camino en orden. */}
                    <Text
                      style={[estilos.pastillaHora, !hayHueco && estilos.pastillaTextoLleno]}
                    >
                      {hora(mas(salida, p.minutos))}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {escondidas > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ver las otras ${escondidas} ciudades del camino`}
                  onPress={() => setVerTodasLasParadas(true)}
                  style={[{ alignSelf: 'flex-start', paddingVertical: 8 }, zonaDeToque]}
                >
                  {/* AZUL, NO ROJO. `cambiar` es rojo, y en este sistema el
                      rojo tiene cuatro significados contados y ninguno es
                      «abrir una lista». Va del azul de las pastillas que
                      despliega, que es de lo que habla. */}
                  <Text style={estilos.verLasOtras}>
                    {`Ver las otras ${escondidas} del camino`}
                  </Text>
                </Pressable>
              ) : null}

              <Text style={estilos.notaParadas}>
                {hayHueco
                  ? 'En el orden en que las pasas. El punto exacto lo acuerdas con cada pasajero.'
                  : 'Ya llevas dos paradas, el máximo del viaje: con la salida y la llegada son cuatro puntos de recogida. Quita una para cambiarla.'}
              </Text>
            </>
          ) : (
            /* SIN CANDIDATAS. Dice POR QUÉ no hay ninguna, no sólo que no las
               hay: el catálogo de ciudades es corto y en un tramo corto —o en
               una ruta que no atraviesa ninguna— es normal que salga vacío.
               La frase de antes, «esta ruta no pasa por ninguna otra ciudad de
               la lista», se enseñaba también cuando el defecto era nuestro:
               las rutas libres nunca consultaban la regla y TODAS decían eso. */
            <Text style={estilos.notaParadas}>
              No conocemos ninguna ciudad entre {datos.origen} y {datos.destino}. Publica directo:
              quien quiera subirse en el camino te lo pedirá por el chat.
            </Text>
          )}
          </>
          ) : null}
        </View>
        ) : null}

        {/* El aporte, con el degradado que cierra la tarjeta */}
        {paso === 'aporte' ? (
        <View style={estilos.tarjetaAporte}>
          <Brillo />
          {/* El epígrafe va en su propia línea, no al lado del stepper: en un
              teléfono de 390 le quedaban 180 px y «APORTE POR PUESTO» se
              partía en dos, chocando con los botones de al lado. */}
          <Epigrafe>Aporte por puesto</Epigrafe>
          <View style={estilos.cifraFila}>
            {/* La cifra del paso, no la de una tarjeta de resultados:
                `texto.precio` (22) es el precio dentro de una lista de
                viajes, donde compite con otros ocho. Aquí es LA respuesta
                de la pantalla y va como las demás respuestas del asistente. */}
            <Text style={[estilos.cifraDelAporte, tabular]}>
              {formatearDineroRedondo(aporte)}
            </Text>
            <Pastilla estilo={{ marginBottom: 3 }}>{origen}</Pastilla>
          </View>

          {/* LA REGLA, no el ±. Ver `ui/Regula`: enseña el recorrido entero
              —el suelo y el techo— en vez de descubrirlos al chocar. Los ±
              siguen en sus extremos.

              **El tope de la regla es `calculado`, no el tope de la ruta**
              (30-08-2026). El tope de la ruta se calcula sobre TRES puestos
              de referencia: un carro que ofrece cuatro podía ponerlo en los
              cuatro y recuperar 44 $ de un viaje de 32,86 $. Aquí sólo se
              baja, que es lo que el producto promete en todas partes:
              «puedes pedir menos, nunca más». */}
          <View style={estilos.regula}>
            <Regula
              valor={Math.round(aporte / 100)}
              /* El suelo cede ante el techo: en una ruta corta con el carro
                 lleno el reparto puede dar 2, y un mínimo de 3 por encima del
                 máximo dejaría el deslizador al revés. */
              min={Math.min(
                Math.round(APORTE_MINIMO_CENTAVOS / 100),
                Math.round(calculado / 100),
              )}
              max={Math.round(calculado / 100)}
              alCambiar={(v) => setAporteElegido(v * 100)}
              rotuloIzquierda={`Mínimo ${formatearDineroRedondo(Math.min(APORTE_MINIMO_CENTAVOS, calculado))}`}
              rotuloDerecha={`Tu parte ${formatearDineroRedondo(calculado)}`}
              etiquetaAccesible="Aporte por puesto"
              comoSeDice={(v) => `${v} balboas por puesto`}
            />
          </View>


          {/* EL REPARTO DICHO COMO UN REPARTO (30-08-2026, pregunta del
              dueño: «si todos ponen 7, ¿por qué yo pago 4,86?»). Decía
              «gasolina y peajes B/32,86 · con 4 puestos recuperas B/28,00»,
              que son dos cifras verdaderas de las que hay que deducir la
              tercera —la suya— restando. Ahora se dice entre cuántos se
              parte y cuánto pone cada quien, incluido él. */}
          <Text style={estilos.cuenta}>
            {`El viaje cuesta ${formatearDinero(cuenta.costoCentavos)} y se reparte entre ${puestos + 1}, contándote a ti.`}
          </Text>
          <Text style={estilos.cuenta}>
            {`Cada pasajero pone ${formatearDineroRedondo(aporte)}. Tú pones ${formatearDinero(cuenta.deTuBolsilloCentavos)}: el aporte se redondea al dólar de abajo, y la diferencia la pones tú.`}
          </Text>

          {/* **POR QUÉ EL APORTE NO SUBE AL QUITAR PUESTOS.** El reparto entre
              los ocupantes sí sube —con un puesto daría la mitad del costo—,
              pero el tope de la ruta lo corta. Y el tope es de la RUTA, no de
              este viaje: se calcula con una ocupación de referencia justo para
              que ofrecer menos puestos no encarezca el puesto. Si subiera,
              ofrecer uno solo sería cobrar el doble — un recargo por el último
              puesto, que es lo que no hacemos nunca (R3).

              Sin esta línea el número se quedaba quieto sin decir por qué, y
              parecía que el stepper estuviera roto (visto por el dueño). */}
          {topeMuerde ? (
            <View style={estilos.notaTope}>
              <Escudo tamano={17} tinta={color.azul500} />
              <Text style={estilos.notaTopeTexto}>
                {`Es el tope de esta ruta: ${formatearDinero(datos.topeCentavos)} por puesto. Ofrecer menos puestos no lo sube — el precio no depende de cuántos queden.`}
              </Text>
            </View>
          ) : null}
        </View>
        ) : null}

        {/* **LO QUE APORTA QUIEN SUBE EN EL CAMINO** (0045).

            BlaBlaCar deja poner a mano el precio de cada ciudad de paso, a
            lo que el conductor quiera. Aquí no puede ser: **cada tramo lleva
            su propio tope**, con la misma fórmula sobre SUS kilómetros y con
            el mismo `+1`. Sin eso, partir un viaje en trozos sería la puerta
            de atrás para cobrar de más — cuatro tramos al precio del viaje
            entero son cuatro veces el costo. El conductor puede bajarlo; no
            subirlo por encima de lo que ese tramo cuesta. */}
        {paso === 'tramos' ? (
        <View style={estilos.tarjetaAporte}>
          <Brillo />
          <Epigrafe>Quien sube en el camino</Epigrafe>
          {tramos.length === 0 ? (
            <Text style={estilos.cuenta}>
              Este viaje va directo, sin paradas: todos aportan lo mismo. Si añades una parada,
              aquí aparece lo que aporta quien suba ahí.
            </Text>
          ) : (
            <>
              {tramos.map((t) => (
                <View key={`${t.desde}-${t.hasta}`} style={estilos.filaPuestos}>
                  <Text style={estilos.textoPuestos} numberOfLines={1}>
                    {`Desde ${nombreDeParada(t.desde)}`}
                    <Text style={estilos.carroApagado}>{` · ${Math.round(t.km)} km`}</Text>
                  </Text>
                  <Stepper
                    valor={Math.round((aportesDeTramo[t.desde] ?? t.aporteCentavos) / 100)}
                    alCambiar={(v) =>
                      setAportesDeTramo((m) => ({ ...m, [t.desde]: v * 100 }))
                    }
                    min={1}
                    max={Math.round(t.topeCentavos / 100)}
                    etiquetaAccesible={`Aporte desde ${nombreDeParada(t.desde)}, en dólares`}
                  />
                </View>
              ))}
              <Text style={estilos.cuenta}>
                Menos camino, menos aporte. Cada tramo tiene su propio tope, calculado con sus
                kilómetros: nadie paga el viaje entero por medio camino.
              </Text>
            </>
          )}
        </View>
        ) : null}

        {/* Cada interruptor dice QUÉ cambia al encenderlo — invariante 7:
            una afirmación porta su razón. «Solo mujeres» suelto entre tres
            «acepto» leía raro (visto en el teléfono, 25-08): no es una
            comodidad del carro, decide QUIÉN puede pedir puesto, y ahora lo
            dice con todas sus letras. */}
        {paso === 'condiciones' ? (
        <View style={estilos.tarjetaInterruptores}>
          <Epigrafe>Condiciones del viaje</Epigrafe>
          <View style={estilos.interruptorPrimero}>
            <Interruptor
              activo={aceptaMaletas}
              alCambiar={setAceptaMaletas}
              etiqueta="Acepto maletas"
              descripcion="Con maleta grande, no solo mochila."
            />
          </View>
          {/* **SOLO PARA CONDUCTORAS** (27-08-2026, pedido del dueño). La
              etiqueta promete un carro donde todas las personas a bordo son
              mujeres, y quien la busca la busca justamente por eso. Con un
              hombre al volante la promesa no se sostiene, así que el
              interruptor ni se ofrece. */}
          {soyMujer ? (
            <View style={estilos.interruptorSeparado}>
              <Interruptor
                activo={soloMujeres}
                alCambiar={setSoloMujeres}
                etiqueta="Solo mujeres"
                descripcion="Únicamente mujeres podrán pedir puesto."
              />
            </View>
          ) : null}
          <View style={estilos.interruptorSeparado}>
            <Interruptor
              activo={aceptaMascotas}
              alCambiar={setAceptaMascotas}
              etiqueta="Acepto mascotas"
              descripcion="En su bolso o con correa."
            />
          </View>
          <View style={estilos.interruptorSeparado}>
            <Interruptor
              activo={sePuedeFumar}
              alCambiar={setSePuedeFumar}
              etiqueta="Se puede fumar"
              descripcion="Apagado, nadie fuma en el carro."
            />
          </View>
        </View>
        ) : null}

        {/* **EL COMENTARIO** — `trips.notes`, que existía en la base y no lo
            escribía nadie. Es donde se dicen las cosas que ninguna casilla
            cubre: que el baúl va medio lleno, que no vas por la autopista,
            que tienes flexibilidad con el punto de recogida. */}
        {paso === 'comentario' ? (
        <View style={estilos.tarjetaInterruptores}>
          <Epigrafe>Lo que quieras decirles</Epigrafe>
          <TextInput
            accessibilityLabel="Comentario para tus pasajeros"
            value={comentario}
            onChangeText={setComentario}
            multiline
            maxLength={300}
            placeholder="¿Tienes flexibilidad con el punto de recogida? ¿No vas por la autopista? ¿El baúl va medio lleno? Díselo aquí."
            placeholderTextColor={color.ink600}
            style={estilos.comentario}
          />
          <Text style={estilos.cuenta}>
            {comentario.trim()
              ? `${300 - comentario.length} caracteres de sobra. Se ve en la ficha del viaje.`
              : 'Puedes dejarlo en blanco: no todos los viajes necesitan explicación.'}
          </Text>
        </View>
        ) : null}
      </ScrollView>

      <View style={estilos.pie}>
        {queFalta && esElUltimo ? (
          <View style={estilos.falta}>
            <View style={estilos.filaFalta}>
              <View style={estilos.cuadroFalta}>
                <Escudo tamano={17} tinta={color.rojo600} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.faltaTitulo}>{queFalta.titulo}</Text>
                <Text style={estilos.faltaTexto}>{queFalta.texto}</Text>
              </View>
            </View>
            <Boton tamano="md" alPulsar={() => router.push(queFalta.ruta as never)}>
              {queFalta.boton}
            </Boton>
          </View>
        ) : null}
        {/* Lo que impide seguir, dicho DONDE se puede arreglar: la salida en
            el pasado en el paso de la hora, y no en una franja roja al final
            cuando ya no se sabe qué tocar (que es lo que hace BlaBlaCar). */}
        {noSePuedeSeguir ? (
          <View style={estilos.falta}>
            <View style={estilos.filaFalta}>
              <View style={estilos.cuadroFalta}>
                <Escudo tamano={17} tinta={color.rojo600} />
              </View>
              <Text style={[estilos.faltaTexto, { flex: 1 }]}>{noSePuedeSeguir}</Text>
            </View>
          </View>
        ) : null}

        {esElUltimo ? (
        <Boton
         
          desactivado={!!queFalta || !!noSePuedeSeguir}
          alPulsar={() =>
            router.push({
              pathname: '/(conductor)/repaso',
              params: {
                ruta,
                /* Los dos extremos viajan también: en ruta libre son lo único
                   que dice qué se publica. */
                ...aParams(desde, 'o'),
                ...aParams(hacia, 'd'),
                salida: salidaISO,
                /* Los ÍNDICES elegidos, no una cuenta: «0,2» dice qué
                   paradas van, no cuántas. */
                paradas: enOrden.join(','),
                puestos: String(puestos),
                adelante: String(reparto.adelante),
                atras: String(reparto.atras),
                aporte: aporteElegido == null ? '' : String(aporteElegido),
                /* Los tramos que el conductor tocó, «índice:centavos». Los
                   que no tocó se recalculan: guardar una copia de lo que la
                   fórmula ya sabe es guardarse una verdad que caduca. */
                tramos: Object.entries(aportesDeTramo)
                  .map(([i, c]) => `${i}:${c}`)
                  .join(','),
                comentario: comentario.trim(),
                maletas: aceptaMaletas ? '1' : '',
                mujeres: soloMujeres ? '1' : '',
                mascotas: aceptaMascotas ? '1' : '',
                fumar: sePuedeFumar ? '1' : '',
              },
            })
          }
        >
          Repasar y publicar
        </Boton>
        ) : (
          <Boton
            desactivado={!!noSePuedeSeguir}
            alPulsar={() => setPaso(losPasos[indiceDelPaso + 1])}
          >
            Continuar
          </Boton>
        )}
        <Text style={estilos.notaPie}>
          {queFalta && esElUltimo
            ? 'Puedes seguir calculando: nada de esto se publica.'
            : esElUltimo
              ? 'Nada se publica todavía: lo lees entero antes, en una pantalla.'
              : 'Nada se publica todavía. Puedes volver atrás en cualquier momento.'}
        </Text>
      </View>

      {buscador}

      <HojaDeEleccion
        abierta={eligiendoCarro}
        titulo="¿Con qué carro vas?"
        opciones={[
          ...misCarros.map((v) => ({
            valor: v.id,
            etiqueta: `${v.make} ${v.model}${v.color ? ` ${v.color.toLowerCase()}` : ''}`,
            debajo: `${v.plate_last3 ? `Placa ···${v.plate_last3} · ` : ''}${v.seats_total} puestos`,
          })),
          { valor: 'nuevo', etiqueta: 'Registrar otro carro', debajo: 'Se guarda en tu perfil' },
        ]}
        elegido={carroId ?? misCarros[0]?.id ?? ''}
        alElegir={(v) => {
          setEligiendoCarro(false);
          if (v === 'nuevo') router.push('/(conductor)/carro');
          else setCarroId(v);
        }}
        alCerrar={() => setEligiendoCarro(false)}
      />

      <ElegirDia
        abierta={eligiendo === 'dia'}
        titulo="Qué día sales"
        elegido={dia}
        alElegir={setDia}
        alCerrar={() => setEligiendo(null)}
      />
      <ElegirHora
        abierta={eligiendo === 'hora'}
        titulo="A qué hora sales"
        elegido={horaSalida}
        /* Sólo si sales HOY: entonces lo que ya pasó sale apagado en la
           rejilla, en vez de dejarse elegir para que el botón de seguir se
           apague dos líneas más abajo. Cualquier otro día, todas valen. */
        minimo={dia === diaEnPanama(new Date()) ? horaDePanama() : undefined}
        alElegir={setHoraSalida}
        alCerrar={() => setEligiendo(null)}
      />
    </View>
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
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto, flex: 1 },
  titular: { ...texto.titular, color: color.ink900, marginTop: 12 },

  /** La barra de avance: un segmento por paso, el mismo lenguaje del registro. */
  avance: { flexDirection: 'row', gap: 4, marginTop: 14 },
  segmento: { flex: 1, height: 3, borderRadius: 999, backgroundColor: 'rgba(10,39,49,.14)' },
  segmentoHecho: { backgroundColor: color.ink900 },

  comentario: {
    marginTop: 12,
    minHeight: 112,
    padding: 14,
    borderRadius: radio.control,
    backgroundColor: color.sand100,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    fontFamily: familia,
    /* 16 o más: por debajo, Safari acerca la página al enfocar el campo. */
    fontSize: 16,
    lineHeight: 23,
    color: color.ink900,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  } as never,

  hoja: {
    marginHorizontal: espacio.gutter,
    marginTop: 18,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  /**
   * Una FILA de la hoja, no una burbuja: la tarjeta ya es el contorno, y
   * dentro los campos se separan con filetes de pelo — el lenguaje de la
   * tarjeta de búsqueda del Inicio. Cuatro rectángulos con borde a 9 px
   * unos de otros leían como ruido.
   */
  eleccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    paddingHorizontal: 2,
    borderRadius: radio.anidado,
  },
  eleccionPulsada: { backgroundColor: color.lavadoChip },
  eleccionMitad: { flex: 1, minWidth: 0 },
  filaEleccion: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  /** El filete horizontal entre filas y el vertical entre Día y Hora. */
  filete: { height: 1, backgroundColor: color.divisor },
  fileteVertical: { width: 1, height: 34, backgroundColor: color.divisor },
  eleccionEtiqueta: { fontSize: 11.5, lineHeight: 16, color: color.ink600, fontFamily: familia },
  /**
   * Las respuestas LARGAS: nombres de lugar, que el conductor puede escribir
   * a mano y pueden ser cualquier cosa. A 22 se leen bien y siguen cabiendo:
   * medido en el navegador, el nombre más largo del catálogo —«La Concepción
   * (Bugaba)»— ocupa 233 px de los 284 que hay entre el borde y el chevrón.
   * A 32 se iría a 340 y saldría cortado, que es peor que pequeño.
   */
  eleccionValor: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '600',
    letterSpacing: -0.44,
    color: color.ink900,
    fontFamily: familia,
  },
  /**
   * LA RESPUESTA DEL PASO, EN GRANDE (29-08-2026, pedido del dueño).
   *
   * Un paso del asistente hace UNA pregunta y enseña UNA respuesta. La
   * respuesta iba a 16 puntos, el mismo cuerpo que el rótulo «Recojo a las»
   * de encima y que la nota gris de debajo: tres renglones del mismo tamaño
   * en una tarjeta que existe para enseñar uno. Media pantalla en blanco
   * abajo y el dato del que va todo, en letra de pie de página.
   *
   * A 32 la hora se lee sin acercar el teléfono y la tarjeta dice de un
   * vistazo qué contestaste. Cifras tabulares: cambiar de 06:00 a 09:00 no
   * mueve nada de sitio.
   *
   * Sólo para respuestas CORTAS —una hora, un día—. Los nombres de ciudad se
   * quedan en 16: «La Concepción (Bugaba)» a este cuerpo no cabe en 390 px y
   * saldría cortada, que es peor que pequeña.
   */
  eleccionValorGrande: {
    marginTop: 2,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '600',
    letterSpacing: -0.96,
    color: color.ink900,
    fontFamily: familia,
  },
  filaValor: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  franjaDelDia: { fontSize: 14, lineHeight: 20, color: color.ink500, fontFamily: familia },
  separadorHoja: { height: 1, backgroundColor: color.bordeSutil, marginVertical: 14 },

  cuentaParadas: {
    marginLeft: 8,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '600',
    color: color.ink600,
    fontFamily: familia,
  },
  pastillas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    /* 44, no 34: es el control MÁS pulsado de este paso —dieciséis ciudades
       para elegir dos— y era el único de la pantalla por debajo del mínimo
       de un dedo (Apple y Material piden 44). Medido con
       `herramientas/publicar-auditar.mjs`. */
    height: 44,
    paddingLeft: 9,
    paddingRight: 12,
    borderRadius: radio.ficha,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
  },
  pastillaLlena: { opacity: 0.5 },
  pastillaTexto: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.14,
    color: color.ink900,
    fontFamily: familia,
  },
  pastillaTextoLleno: { color: color.ink400 },
  /** La hora dentro de la pastilla: cifras tabulares y un peso menos que el
   *  nombre — se lee, pero el nombre sigue mandando. */
  pastillaHora: {
    fontSize: 12,
    lineHeight: 18,
    color: color.ink600,
    ...tabular,
    fontFamily: familia,
  },
  filaParadasTitulo: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  notaParadas: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: color.ink600,
    fontFamily: familia,
  },
  /** La tarjeta del carro: el icono en su cuadro, y dos renglones al lado. */
  tarjetaCarro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 16,
    borderRadius: radio.control,
    backgroundColor: color.sand100,
  },
  iconoCarro: {
    width: 42,
    height: 42,
    borderRadius: radio.icono,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreCarro: { ...texto.fila, fontWeight: '600', color: color.ink900 },
  detalleCarro: { fontSize: 12.5, lineHeight: 18, color: color.ink600, fontFamily: familia },
  dibujoDelCarro: { marginTop: 12 },
  carroApagado: { fontWeight: '400', color: color.ink600, fontFamily: familia },
  /** Small 12/17 en el acento de texto: en el v1 lo que actúa es rojo. */
  cambiar: { fontSize: 12, lineHeight: 17, fontWeight: '500', color: color.rojo700, fontFamily: familia },
  verLasOtras: { fontSize: 12.5, lineHeight: 17, fontWeight: '500', color: color.azul700, fontFamily: familia },

  recorrido: { marginTop: 10, position: 'relative' },
  lineaRecorrido: {
    position: 'absolute',
    left: 4.25,
    top: 8,
    bottom: 8,
    width: 1.5,
    backgroundColor: color.rojo300,
  },
  parada: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingBottom: 7 },
  puntoLleno: { width: 10, height: 10, borderRadius: radio.pastilla, backgroundColor: color.rojo500 },
  puntoIntermedio: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.azul500,
  },
  puntoFinal: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  paradaNombre: { flex: 1, fontSize: 14, lineHeight: 20.3, fontWeight: '500', letterSpacing: -0.21, color: color.ink900, fontFamily: familia },
  paradaIntermedia: { flex: 1, fontSize: 14, lineHeight: 20.3, letterSpacing: -0.21, color: color.ink900, fontFamily: familia },
  paradaHora: { fontSize: 12.5, lineHeight: 18.12, color: color.ink600, ...tabular, fontFamily: familia },
  /* 40 de toque con el círculo de 22 dentro: quitar una parada por error es
     peor que fallar el toque, pero fallarlo tres veces también molesta. */
  quitar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitarCirculo: {
    width: 22,
    height: 22,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  anadir: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: espacio.tap,
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  anadirTexto: { fontSize: 13.5, lineHeight: 19.57, fontWeight: '600', color: color.azul700, fontFamily: familia },

  tarjetaAporte: {
    marginHorizontal: espacio.gutter,
    marginTop: 8,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: color.blanco,
    overflow: 'hidden',
  },
  filaAporte: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  cifraFila: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, marginTop: 8 },
  regula: { marginTop: 12, marginBottom: 4 },
  cifraDelAporte: {
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '600',
    letterSpacing: -1.12,
    color: color.ink900,
    fontFamily: familia,
  },
  filaPuestos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  textoPuestos: { flex: 1, ...texto.fila, color: color.ink900 },
  cuenta: { fontSize: 12.5, lineHeight: 18.125, color: color.ink700, marginTop: 10, fontFamily: familia },
  /** Azul: informa, no reclama. El rojo tiene sus cuatro sentidos exactos. */
  notaTope: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 12,
    padding: 12,
    borderRadius: radio.control,
    backgroundColor: color.azul50,
  },
  notaTopeTexto: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.azul700,
    fontFamily: familia,
  },

  tarjetaInterruptores: {
    marginHorizontal: espacio.gutter,
    marginTop: 8,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 2,
  },
  /* La misma distancia del texto a la línea por ARRIBA y por ABAJO: antes
     el filete llevaba 9 debajo y nada encima, y quedaba pegado al renglón
     anterior — se veía sobre todo junto a «Solo mujeres» (25-08). */
  interruptorSeparado: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  interruptorPrimero: { paddingTop: 8, paddingBottom: 12 },

  pie: {
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  falta: {
    gap: 14,
    padding: 16,
    marginBottom: 12,
    borderRadius: radio.l,
    backgroundColor: color.rojo50,
    borderWidth: 1,
    borderColor: color.rojo100,
  },
  filaFalta: { flexDirection: 'row', gap: 12 },
  cuadroFalta: {
    width: 34,
    height: 34,
    borderRadius: radio.control,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faltaTitulo: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.22,
    color: color.rojo700,
    fontFamily: familia,
  },
  faltaTexto: { fontSize: 13.5, lineHeight: 19.5, color: color.ink700, marginTop: 3, fontFamily: familia },
  /* ── la ruta libre ── */
  filaLibre: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  libreEtiqueta: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: color.ink600, fontFamily: familia },
  libreValor: { fontSize: 15, lineHeight: 20, fontWeight: '600', letterSpacing: -0.22, color: color.ink900, fontFamily: familia },
  filaPrecioLibre: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  unidadLibre: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: color.ink500, fontFamily: familia },
  precioLibre: { fontSize: 22, lineHeight: 24, fontWeight: '600', letterSpacing: -0.77, color: color.ink900, fontFamily: familia },
  notaLibre: { fontSize: 12, lineHeight: 17, fontWeight: '400', color: color.ink600, marginTop: 10, fontFamily: familia },
  pieLibre: { paddingHorizontal: espacio.gutter, paddingTop: 16, gap: 12 },

  notaPie: { textAlign: 'center', fontSize: 12.5, lineHeight: 18.125, color: color.ink600, marginTop: 10, fontFamily: familia },
});

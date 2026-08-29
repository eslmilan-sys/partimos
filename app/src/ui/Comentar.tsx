/**
 * LE BOUTON DU TEST — ce qu'on dit de l'écran, sur l'écran.
 *
 * Monté une seule fois à la racine : il est donc sur les cinquante-huit
 * pantallas sans qu'aucune n'ait à le savoir, et il disparaîtra le jour où le
 * test se ferme en retirant une ligne de `_layout.tsx`.
 *
 * **Où il se pose, et pourquoi là.** Pas en bas à droite : c'est là que vivent
 * la barre d'onglets, le carré Publicar et les barres d'action fixes de
 * `viaje`, `reservar`, `repaso`. Pas en haut : cloche et portrait y sont. Le
 * bord droit à mi-hauteur est le seul endroit de l'app où rien n'habite —
 * l'ancre y est donc vraie partout, sans exception à gérer écran par écran.
 *
 * **Comment il se fait voir sans gêner.** Il s'ouvre en pastille avec son mot
 * pendant six secondes à la première pantalla, puis se replie en pastille
 * ronde. Une seule fois par session : quelqu'un qui parcourt vingt écrans ne
 * doit pas voir vingt fois la même invitation.
 *
 * L'écran d'où l'on parle est capturé tout seul. C'est tout l'intérêt : un
 * retour qui dit « le bouton ne se referme pas » vaut cent fois « ça marche
 * pas », et personne ne va recopier une route à la main.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { usePathname } from 'expo-router';

import { type Clase, enviarComentario } from '@/servicios/comentarios';
import { MODO } from '@/servicios/_fuente';
import { useSesion } from '@/servicios/sesion';

import { Cerrar, Chat, Visto } from './iconos';
import { color, espacio, familia, interlinea, radio, sombra } from './tokens';

/** Le halo bleu du navigateur autour d'un champ n'est pas de ce système. */
const SIN_CONTORNO = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as never) : null;

/** Une fois par session, pas une fois par écran. Hors du composant exprès. */
let yaSeAnuncio = false;

const CLASES: { valor: Clase; etiqueta: string }[] = [
  { valor: 'roto', etiqueta: 'No funciona' },
  { valor: 'raro', etiqueta: 'Se ve raro' },
  { valor: 'confuso', etiqueta: 'No entiendo' },
  { valor: 'idea', etiqueta: 'Se me ocurre' },
];

/**
 * Les écrans d'entrée n'ont pas d'ancre : denses en contrôles de haut en bas
 * — champs, CTA, liens de pied — il n'y a AUCUNE position où elle ne couvre
 * pas quelque chose (constaté sur téléphone : elle mordait le champ CORREO).
 * Et un testeur commente le produit, pas le formulaire de connexion.
 */
const SIN_ANCLA = /^\/(apertura|bienvenida|entrar|registro|puerta)/;

export function Comentar() {
  const pantalla = usePathname();
  /* En simulado personne n'est vraiment connecté : le commentaire part sans
     signature, et la base l'accepte avec profile_id à NULL. */
  const { id: sesion } = useSesion('');
  const yo = MODO === 'simulado' ? null : sesion;

  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState('');
  const [clase, setClase] = useState<Clase | null>(null);
  const [mandando, setMandando] = useState(false);
  const [quePaso, setQuePaso] = useState<string | null>(null);
  const [gracias, setGracias] = useState(false);

  const [anunciando, setAnunciando] = useState(!yaSeAnuncio);
  const ancho = useRef(new Animated.Value(yaSeAnuncio ? 0 : 1)).current;

  useEffect(() => {
    if (yaSeAnuncio) return;
    yaSeAnuncio = true;
    const t = setTimeout(() => {
      Animated.timing(ancho, { toValue: 0, duration: 260, useNativeDriver: false }).start(() =>
        setAnunciando(false),
      );
    }, 6000);
    return () => clearTimeout(t);
  }, [ancho]);

  const cerrar = () => {
    setAbierta(false);
    setQuePaso(null);
    setGracias(false);
  };

  const mandar = async () => {
    if (!texto.trim() || mandando) return;
    setMandando(true);
    setQuePaso(null);
    try {
      await enviarComentario({ pantalla, clase, texto, quien: yo });
      setGracias(true);
      setTexto('');
      setClase(null);
      setTimeout(cerrar, 1500);
    } catch (e) {
      setQuePaso(e instanceof Error ? e.message : 'No se pudo enviar.');
    } finally {
      setMandando(false);
    }
  };

  if (SIN_ANCLA.test(pantalla)) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Contar qué ves en esta pantalla"
        onPress={() => setAbierta(true)}
        style={({ pressed }) => [estilos.ancla, pressed ? estilos.anclaPulsada : null]}
      >
        <Chat tamano={15} tinta="#fff" />
        {anunciando ? (
          <Animated.View
            style={{
              opacity: ancho,
              maxWidth: ancho.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }),
              overflow: 'hidden',
            }}
          >
            <Text style={estilos.anclaTexto} numberOfLines={1}>
              Cuéntame
            </Text>
          </Animated.View>
        ) : null}
      </Pressable>

      <Modal visible={abierta} animationType="slide" transparent onRequestClose={cerrar}>
        <Pressable accessibilityLabel="Cerrar" onPress={cerrar} style={estilos.velo} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={estilos.hoja}>
            <View style={estilos.asa} pointerEvents="none" />

            <View style={estilos.cabecera}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.titulo}>¿Qué ves aquí?</Text>
                {/* La route, écrite : celui qui teste voit qu'elle part avec
                    son message, et ça évite d'avoir à la décrire. */}
                <Text style={estilos.donde} numberOfLines={1}>
                  {pantalla}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={cerrar}
                style={estilos.cerrar}
              >
                <Cerrar tamano={12} tinta={color.ink700} />
              </Pressable>
            </View>

            {gracias ? (
              <View style={estilos.gracias}>
                <View style={estilos.marca}>
                  <Visto tamano={15} tinta="#fff" />
                </View>
                <Text style={estilos.graciasTexto}>Llegó. Gracias.</Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={estilos.clases}>
                  {CLASES.map((c) => {
                    const activa = clase === c.valor;
                    return (
                      <Pressable
                        key={c.valor}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: activa }}
                        onPress={() => setClase(activa ? null : c.valor)}
                        style={[estilos.chip, activa && estilos.chipActivo]}
                      >
                        <Text style={[estilos.chipTexto, activa && estilos.chipTextoActivo]}>
                          {c.etiqueta}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  accessibilityLabel="Tu comentario"
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Lo que sea. Sin filtro — para eso es la prueba."
                  placeholderTextColor={color.ink400}
                  multiline
                  numberOfLines={5}
                  maxLength={2000}
                  style={[estilos.campo, SIN_CONTORNO]}
                />

                {quePaso ? <Text style={estilos.error}>{quePaso}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enviar el comentario"
                  disabled={!texto.trim() || mandando}
                  onPress={mandar}
                  style={({ pressed }) => [
                    estilos.enviar,
                    !texto.trim() || mandando
                      ? { backgroundColor: color.inerteFondo }
                      : { backgroundColor: pressed ? color.rojo600 : color.rojo500 },
                  ]}
                >
                  <Text
                    style={[
                      estilos.enviarTexto,
                      (!texto.trim() || mandando) && { color: color.inerteTinta },
                    ]}
                  >
                    {mandando ? 'Enviando…' : 'Enviar'}
                  </Text>
                </Pressable>

                <Text style={estilos.pie}>
                  Va con la pantalla, el tamaño de tu pantalla y la hora. Nada más.
                </Text>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  /** Bord droit, à mi-hauteur : le seul endroit libre des écrans du produit.
      (Les écrans d'entrée, où toute position couvrait un contrôle, n'ont
      simplement pas d'ancre — voir SIN_ANCLA.) */
  ancla: {
    position: 'absolute',
    right: 0,
    /* 52 % et pas 46 : plus bas, l'ancre tombait sur le prix de la carte
       mise en avant de `resultados`. Repliée elle ne montre qu'un onglet. */
    top: '52%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    /* Más chica y más callada (25-08): es una salida de emergencia del
       test, no un elemento de navegación — no tiene que competir con lo
       que la pantalla enseña. */
    height: 34,
    paddingLeft: 10,
    paddingRight: 8,
    opacity: 0.85,
    borderTopLeftRadius: radio.control,
    borderBottomLeftRadius: radio.control,
    backgroundColor: color.ink900,
    ...sombra.cta,
    ...(Platform.OS === 'web' ? { boxShadow: '0 6px 20px rgba(10,39,49,.28)' as never } : null),
  },
  anclaPulsada: { transform: [{ scale: 0.96 }] },
  anclaTexto: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },

  velo: { flex: 1, backgroundColor: 'rgba(10,39,49,.42)' },
  hoja: {
    backgroundColor: color.blanco,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: espacio.gutter,
    paddingTop: 10,
    paddingBottom: 30,
    maxHeight: 520,
    width: '100%',
    maxWidth: espacio.marco,
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 -20px 56px rgba(10,39,49,.24)' as never } : null),
  },
  asa: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.divisor,
    alignSelf: 'center',
    marginBottom: 12,
  },

  cabecera: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  titulo: {
    fontSize: 19,
    lineHeight: interlinea(20),
    fontWeight: '700',
    letterSpacing: -0.5,
    color: color.ink900,
    fontFamily: familia,
  },
  donde: {
    fontSize: 12,
    lineHeight: interlinea(12),
    color: color.ink600,
    marginTop: 3,
    fontFamily: familia,
  },
  cerrar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.lavado,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clases: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radio.ficha,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActivo: { backgroundColor: color.ink900 },
  chipTexto: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
  },
  chipTextoActivo: { color: '#fff', fontWeight: '600' },

  campo: {
    minHeight: 116,
    borderRadius: radio.control,
    backgroundColor: color.sand200,
    padding: 14,
    fontSize: 15,
    lineHeight: 21,
    color: color.ink900,
    fontFamily: familia,
    textAlignVertical: 'top',
  },

  error: {
    fontSize: 13,
    lineHeight: interlinea(13),
    color: color.rojo700,
    marginTop: 10,
    fontFamily: familia,
  },

  enviar: {
    height: 54,
    borderRadius: radio.boton,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  enviarTexto: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },

  pie: {
    fontSize: 11.5,
    lineHeight: interlinea(12),
    color: color.ink600,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: familia,
  },

  gracias: { alignItems: 'center', gap: 12, paddingVertical: 34 },
  marca: {
    width: espacio.tap,
    height: espacio.tap,
    borderRadius: 22,
    backgroundColor: color.hechoTinta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graciasTexto: {
    fontSize: 16,
    lineHeight: interlinea(16),
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
});

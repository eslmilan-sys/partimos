/**
 * El campo de texto de la cuenta: correo, contraseña, nombre.
 *
 * Es el mismo cajón que el traspaso dibuja para el celular en `4b` y `4e` —58
 * de alto, borde de un pelo, radio de control— con el borde en tinta cuando
 * está activo y en rojo cuando algo no cuadra. Vive aquí y no en cada pantalla
 * porque son cuatro las que lo usan y tienen que verse iguales.
 */

import { type ReactNode, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { familia, color, interlinea, radio } from './tokens';

export function Campo({
  etiqueta,
  valor,
  alEscribir,
  marcador,
  secreto = false,
  correo = false,
  mal = false,
  alTerminar,
  glifo,
}: {
  etiqueta: string;
  valor: string;
  alEscribir: (t: string) => void;
  marcador?: string;
  /** Contraseña: se tapa, y trae el ojo para destaparla. */
  secreto?: boolean;
  correo?: boolean;
  mal?: boolean;
  alTerminar?: () => void;
  /** Un dibujo pequeño a la izquierda —un sobre, un candado—. Es de adorno y
   *  por eso no se toca: la etiqueta de arriba es la que dice qué se escribe,
   *  y un icono no sustituye a una palabra. */
  glifo?: ReactNode;
}) {
  const [enfocado, setEnfocado] = useState(false);
  const [visible, setVisible] = useState(false);

  const borde = mal ? color.rojo500 : enfocado ? color.ink900 : color.bordePorDefecto;

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View style={[estilos.cajon, { borderColor: borde }]}>
        {glifo ? <View pointerEvents="none">{glifo}</View> : null}
        <TextInput
          accessibilityLabel={etiqueta}
          value={valor}
          onChangeText={alEscribir}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          onSubmitEditing={alTerminar}
          secureTextEntry={secreto && !visible}
          keyboardType={correo ? 'email-address' : 'default'}
          autoCapitalize={correo || secreto ? 'none' : 'words'}
          autoCorrect={false}
          // Le dice al llavero del teléfono qué guarda este campo.
          textContentType={correo ? 'emailAddress' : secreto ? 'password' : 'name'}
          placeholder={marcador}
          placeholderTextColor={color.ink400}
          style={estilos.entrada}
        />
        {secreto ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar la contraseña' : 'Ver la contraseña'}
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
          >
            <Text style={estilos.ojo}>{visible ? 'Ocultar' : 'Ver'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 7 },
  etiqueta: {
    fontFamily: familia,
    fontSize: 12.5,
    lineHeight: interlinea(12),
    fontWeight: '600',
    letterSpacing: 0.1 * 12,
    textTransform: 'uppercase',
    color: color.ink500,
  },
  cajon: {
    height: 58,
    borderRadius: radio.control,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  entrada: {
    flex: 1,
    /* Sin esto el campo no encoge por debajo de su ancho intrínseco —el
       navegador le da uno a `<input>`— y con el glifo delante y «Ver» detrás
       la fila se salía del cajón. Medido: «Ver» tres píxeles fuera del borde. */
    minWidth: 0,
    fontSize: 17,
    lineHeight: interlinea(17),
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  } as never,
  /* `hitSlop` no existe en react-native-web, así que la zona de toque tiene
     que ser relleno de verdad: 44 de alto, que es el mínimo del sistema. */
  ojo: {
    fontFamily: familia,
    fontSize: 13.5,
    lineHeight: interlinea(13),
    fontWeight: '600',
    color: color.ink500,
    paddingVertical: 13,
    paddingHorizontal: 10,
  },
});

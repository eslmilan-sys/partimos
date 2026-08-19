/**
 * El armazón HTML de la versión web.
 *
 * Sirve Inter Tight desde la propia app en vez de pedirla a Google, que es lo
 * que hace `design_system/tokens/fonts.css`. Misma cara, sin depender de la
 * red: en Apple manda Helvetica Neue y en el resto entra Inter Tight, que es
 * el orden del traspaso. Sin esto el navegador caía a Arial y ni la anchura de
 * los textos ni el interletrado se parecían a los del diseño.
 */

import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Html({ children }: PropsWithChildren) {
  return (
    <html lang="es-PA">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: estilos }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const pesos = [
  ['Regular', 400],
  ['Medium', 500],
  ['SemiBold', 600],
  ['Bold', 700],
] as const;

// Cuando la app se publica bajo un subcamino (GitHub Pages, por ejemplo), una
// ruta absoluta manda las fuentes a la raíz del dominio y no las encuentra.
const base = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');

const estilos = `
${pesos
  .map(
    ([archivo, peso]) => `@font-face {
  font-family: "Inter Tight";
  font-style: normal;
  font-weight: ${peso};
  font-display: swap;
  src: url("${base}/fuentes/InterTight-${archivo}.ttf") format("truetype");
}`,
  )
  .join('\n')}

/*
 * LA APP LLENA LA VENTANA, NI MÁS NI MENOS.
 *
 * Las pantallas llevaban «height: 844» en web —el marco con el que se
 * revisaba el diseño en el escritorio—. En un teléfono la ventana no mide
 * 844: mide menos, así que la página entera desbordaba, la barra de pestañas
 * se iba debajo del pliegue y al deslizar aparecía el fondo por detrás. Es lo
 * que se veía en la captura.
 *
 * «100dvh» y no «100vh»: la barra de Safari y Chrome en el teléfono aparece y
 * desaparece al deslizar, y «vh» cuenta la ventana grande siempre, así que
 * con «vh» la barra de abajo queda tapada por la del navegador. «dvh» es la
 * altura de verdad, la que cambia. El «vh» de reserva es para los navegadores
 * viejos que no conocen «dvh».
 */
html, body { height: 100%; margin: 0; }
body {
  background-color: #FAF7F3;
  /* Nada de rebote elástico: la app no es una página. */
  overscroll-behavior: none;
}
#root {
  display: flex;
  height: 100vh;
  height: 100dvh;
}
`;

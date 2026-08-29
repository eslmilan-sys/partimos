#!/usr/bin/env python3
"""
DIBUJA LA FLECHA «→» DENTRO DE SWITZER.

**Por qué existe este script.** El subconjunto de Switzer que servimos
(`app/public/fuentes/Switzer-{400,500,600,700}.woff2`, 385 glifos) NO trae
U+2192. Y la app escribe la dirección con esa flecha en veinticinco sitios
—«CIUDAD DE PANAMÁ → LAS TABLAS» es la cabecera de medio producto, y el
invariante 1 del sistema pide la dirección escrita dos veces—. Sin el glifo,
el navegador la saca de Helvetica: una flecha de trazo fino, de otra caja y
con otro peso, metida en mitad de una línea de Switzer 600. Medido a 46 px
salta a la vista, y es una de esas cosas que hacen que una pantalla «se vea
rara» sin que uno sepa señalar por qué.

Fontshare, de donde salió el subconjunto, no es alcanzable desde aquí, así
que la flecha se dibuja: es geometría, no tipografía de autor. Se construye
con las medidas de la PROPIA fuente y de cada peso, para que no se note que
es nuestra:

  · el grosor del asta = el del guion de ese peso (75, 91, 109, 131),
  · el eje vertical y el ancho = los del signo «+» de ese peso,
  · la punta a 45°, como en las grotescas de esta familia.

Se ejecuta a mano y su resultado se versiona (los .woff2). No es parte del
build: la fuente no cambia cada vez que alguien compila.

    python3 herramientas/flecha-en-la-fuente.py
"""

import math
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.boundsPen import BoundsPen

FUENTES = 'app/public/fuentes/Switzer-{peso}.woff2'
PESOS = (400, 500, 600, 700)
FLECHA = 0x2192
NOMBRE = 'arrowright'


def medidas(fuente):
    """El grosor del guion y la caja del «+», que es el eje de los signos."""
    cmap = fuente.getBestCmap()
    glifos = fuente.getGlyphSet()

    def caja(caracter):
        nombre = cmap[ord(caracter)]
        lapiz = BoundsPen(glifos)
        glifos[nombre].draw(lapiz)
        return lapiz.bounds

    _, y0, _, y1 = caja('-')
    grosor = y1 - y0
    px0, py0, px1, py1 = caja('+')
    return {
        'grosor': grosor,
        'centro': (py0 + py1) / 2,
        'izquierda': px0,
        'derecha': px1,
        'avance': fuente['hmtx'][cmap[ord('+')]][0],
    }


def area_con_signo(puntos):
    """El área con signo del polígono: positiva si va en sentido antihorario."""
    total = 0.0
    for (x0, y0), (x1, y1) in zip(puntos, puntos[1:] + puntos[:1]):
        total += x0 * y1 - x1 * y0
    return total / 2


def contorno(lapiz, puntos, sentido=1):
    """Traza un polígono en el sentido pedido.

    **Aquí estaba el error que costó tres intentos.** TrueType rellena por
    número de vueltas: dos contornos que se solapan se SUMAN si van en el
    mismo sentido y se RESTAN si van al revés. El asta y el galón se solapan
    a propósito —así no hay que calcular la unión de las dos figuras—, y con
    el galón trazado al revés el solape se restaba: la flecha salía con una
    cuña blanca entre el asta y la punta. En los números no se ve; se vio
    dibujando el glifo a 700 px."""
    if (area_con_signo(puntos) > 0) != (sentido > 0):
        puntos = list(reversed(puntos))
    lapiz.moveTo(puntos[0])
    for punto in puntos[1:]:
        lapiz.lineTo(punto)
    lapiz.closePath()


def barra(lapiz, x0, x1, y, grosor):
    """El asta: un rectángulo horizontal centrado en `y`."""
    mitad = grosor / 2
    contorno(lapiz, [(x0, y - mitad), (x1, y - mitad), (x1, y + mitad), (x0, y + mitad)])


def punta(lapiz, tip, alcance, grosor):
    """La punta: el galón «>», un solo contorno de seis puntos.

    Los dos brazos salen del vértice a 45 grados. El borde de dentro va
    desplazado `grosor` PERPENDICULARMENTE a cada brazo —hacia el asta—, que
    en coordenadas es `grosor/√2` en cada eje; y el vértice de dentro cae
    sobre la bisectriz, a `grosor·√2` del vértice de fuera, que es lo que
    mide la esquina en un ángulo de 90 grados.

    Se intentó primero desplazar el borde de dentro HACIA DELANTE, y el
    polígono se cruzaba consigo mismo: los dos brazos salían como un reloj de
    arena en vez de como una punta. Se vio a 120 px antes que en los números
    — por eso esto se mira siempre en pantalla y no sólo en la consola."""
    x, y = tip
    a = alcance
    sesgo = grosor / math.sqrt(2)   # el grosor, repartido en los dos ejes
    bisectriz = grosor * math.sqrt(2)  # del vértice de fuera al de dentro
    contorno(
        lapiz,
        [
            (x - a, y + a),
            (x, y),
            (x - a, y - a),
            (x - a - sesgo, y - a + sesgo),
            (x - bisectriz, y),
            (x - a - sesgo, y + a - sesgo),
        ],
    )


ANCHO = 820      # el avance del glifo
COSTADO = 140    # el aire a cada lado, para que no toque las palabras
ALCANCE = 0.46   # lo que sube cada brazo de la punta, en tanto por uno del asta
MAS_FINA = 0.85  # el asta, algo más fina que el guion: una flecha no pesa como un signo


def dibuja(m):
    """El asta y el galón de la punta, solapados a propósito: TrueType
    rellena por número de vueltas, así que dos contornos en el mismo sentido
    dan una sola figura sin tener que calcular la unión."""
    lapiz = TTGlyphPen(None)
    y = m['centro']
    grosor = m['grosor'] * MAS_FINA
    x0, x1 = COSTADO, ANCHO - COSTADO
    # EL ASTA NO LLEGA A LA PUNTA. Si el rectángulo acaba en el vértice, sus
    # dos esquinas asoman por delante de las diagonales y la flecha remata en
    # un muñoncito cuadrado en vez de en punta. Se corta donde el galón ya la
    # tapa: el vértice de dentro, más medio grosor para que no quede muesca.
    barra(lapiz, x0, x1 - grosor * (math.sqrt(2) - 0.5), y, grosor)
    punta(lapiz, (x1, y), (x1 - x0) * ALCANCE, grosor)
    return lapiz.glyph()


def main():
    for peso in PESOS:
        ruta = FUENTES.format(peso=peso)
        fuente = TTFont(ruta)
        if ord('→') in fuente.getBestCmap():
            print(f'{peso}: ya la tiene, no se toca')
            continue
        m = medidas(fuente)
        glifo = dibuja(m)

        fuente['glyf'][NOMBRE] = glifo
        fuente['hmtx'][NOMBRE] = (ANCHO, COSTADO)
        orden = fuente.getGlyphOrder()
        if NOMBRE not in orden:
            fuente.setGlyphOrder(list(orden) + [NOMBRE])
        for tabla in fuente['cmap'].tables:
            tabla.cmap[FLECHA] = NOMBRE
        fuente['maxp'].numGlyphs = len(fuente.getGlyphOrder())

        fuente.flavor = 'woff2'
        fuente.save(ruta)
        print(f'{peso}: flecha añadida — grosor {m["grosor"]:.0f}, avance {ANCHO}')


if __name__ == '__main__':
    sys.exit(main())

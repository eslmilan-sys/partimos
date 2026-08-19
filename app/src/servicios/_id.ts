/**
 * UN IDENTIFICADOR NUEVO, QUE NO CHOQUE CON EL DE NADIE.
 *
 * ───────────────────────────────────────────────────────────────────────
 * Lo que esto arregla. `reservas.ts` y `viajes.ts` tenían cada uno un
 * contador de módulo:
 *
 *     let contador = 0;
 *     const nuevoId = () => `aaaaaaaa-aaaa-4aaa-8aaa-${pad(++contador)}`;
 *
 * El contador nace en cero cada vez que se carga la página. Así que la
 * primera reserva de CUALQUIER persona es siempre
 * `aaaaaaaa-aaaa-4aaa-8aaa-000000000001`. Contra una base compartida, el
 * segundo que pide puesto choca con la clave primaria del primero y su
 * reserva no entra. Con datos simulados no se veía: cada quien tenía su
 * propia memoria.
 *
 * Es el fallo que impedía que más de una persona probara la app a la vez.
 * ───────────────────────────────────────────────────────────────────────
 *
 * `crypto.randomUUID` existe en el navegador —en contexto seguro— y en
 * Hermes moderno. Donde no esté, se arma un v4 con `getRandomValues`, y si
 * tampoco, con `Math.random`: peor aleatoriedad, pero 122 bits siguen
 * siendo suficientes para que dos personas no coincidan. Lo que no vale es
 * un contador.
 */

/** Un UUID v4. Los dígitos de versión y variante van donde manda el RFC. */
export function nuevoId(): string {
  const c = globalThis.crypto;

  if (typeof c?.randomUUID === 'function') return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof c?.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  // 4 en el nibble alto del byte 6; 10xx en el byte 8.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

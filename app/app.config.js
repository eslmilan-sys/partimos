// En local la app se sirve desde la raíz; publicada en GitHub Pages cuelga de un
// subcamino. El camino entra por PARTIMOS_BASE_URL y solo al exportar, para que
// `npx expo start` siga abriendo en la raíz como siempre.
const base = process.env.PARTIMOS_BASE_URL;

// «single» empaqueta la app como una sola página en vez de prerenderizar las 58.
// Es lo que permite servirla desde un solo archivo, sin carpeta ni servidor.
const salida = process.env.PARTIMOS_SALIDA;

module.exports = ({ config }) => ({
  ...config,
  web: { ...config.web, ...(salida ? { output: salida } : {}) },
  experiments: {
    ...config.experiments,
    ...(base ? { baseUrl: base } : {}),
  },
});

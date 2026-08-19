/**
 * PHOTOGRAPHIES
 *
 * Deux images, préparées hors ligne : trois largeurs en WebP et en JPEG, plus
 * une vignette floue de vingt pixels inlinée en base64. La vignette occupe la
 * place pendant le chargement, ce qui garde le CLS à zéro sans afficher un
 * rectangle gris.
 *
 * Elles ne sont pas décoratives. Une plateforme entre particuliers se vend sur
 * des visages et sur un lieu reconnaissable ; onze pages de texte, si soignées
 * soient-elles, ne créent pas cette confiance-là.
 */

export type Photo = {
  name: string;
  widths: number[];
  /** Largeur native du fichier source. Au-delà, on étirerait l'image. */
  intrinsicWidth: number;
  aspect: string;
  blur: string;
  alt: string;
};

export const PHOTOS = {
  carroLleno: {
    name: "carro-lleno",
    widths: [640, 1024, 1600],
    intrinsicWidth: 1284,
    aspect: "1284 / 642",
    blur: "UklGRl4AAABXRUJQVlA4IFIAAACwAwCdASoUAAoAPu1iqU2ppaOiMAgBMB2JQBYdhHqH5cCVivKsAAD+fm3Ub4Vg+sn96+eGgtdOc35w7ORHJ1ui1CHUSVGOU4M7U7t00FpL9eAA",
    alt: "Cuatro personas riéndose dentro de un carro, con el sol entrando por el parabrisas",
  },
  panamaCity: {
    name: "panama-city",
    widths: [640],
    intrinsicWidth: 588,
    aspect: "588 / 420",
    blur: "UklGRmIAAABXRUJQVlA4IFYAAACQAwCdASoUAA4APu1iqU2ppaQiMAgBMB2JQBUeg8y0mIqndO3gAP6Uy2sSzHlS06aMpLnq+LQUZAfakCx66Uhk9VutJ1WYQKfIoDtaZA1qzL7MIDoAAA==",
    alt: "Vista aérea de la Cinta Costera y los rascacielos de Ciudad de Panamá junto al mar",
  },
} as const satisfies Record<string, Photo>;

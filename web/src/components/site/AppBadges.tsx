/**
 * Badges de téléchargement — App Store et Google Play.
 *
 * Les applications ne sont pas encore dans les magasins : les badges le
 * DISENT (« Muy pronto ») au lieu de pointer vers une page qui n'existe
 * pas. Un lien mort ou un magasin vide coûte plus cher qu'une promesse
 * datée. Le jour où les fiches existent, il suffit de passer `href` aux
 * deux badges — tout le reste est prêt.
 *
 * Les glyphes sont des tracés Font Awesome Free (CC BY 4.0) embarqués en
 * ligne : aucune dépendance, aucune image externe, et pas de contrefaçon
 * des badges officiels — c'est notre bouton, avec leur pictogramme.
 */

const APPLE_PATH =
  "M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z";

const PLAY_PATH =
  "M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z";

function Badge({
  path,
  viewBox,
  small,
  big,
}: {
  path: string;
  viewBox: string;
  small: string;
  big: string;
}) {
  return (
    <span className="relative inline-flex items-center gap-2.5 rounded-[14px] border border-white/15 bg-white/8 px-4 py-2.5 text-left">
      <svg
        viewBox={viewBox}
        aria-hidden
        className="size-6 shrink-0 fill-current text-ink-50"
      >
        <path d={path} />
      </svg>
      <span className="leading-tight">
        <span className="block text-[11.5px] text-night-300">{small}</span>
        <span className="block font-display text-[15px] font-bold text-ink-50">
          {big}
        </span>
      </span>
      <span className="absolute -top-2 right-2.5 rounded-full bg-action px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] text-ink-900 uppercase">
        Muy pronto
      </span>
    </span>
  );
}

export function AppBadges() {
  return (
    <div className="mt-5">
      <p className="mb-2.5 text-[13.5px] text-night-300">
        La app viene en camino para iOS y Android — mientras tanto, el sitio
        hace todo desde el navegador.
      </p>
      <div className="flex flex-wrap gap-2.5">
        <Badge
          path={APPLE_PATH}
          viewBox="0 0 384 512"
          small="Descárgala en el"
          big="App Store"
        />
        <Badge
          path={PLAY_PATH}
          viewBox="0 0 512 512"
          small="Disponible en"
          big="Google Play"
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

/**
 * LA MATIÈRE DERRIÈRE LE VERRE — WebGL, chargé intelligemment.
 *
 * Le client veut un verre plus transparent. Un verre transparent n'a d'intérêt
 * que s'il y a quelque chose à voir au travers : cette scène est ce quelque
 * chose. Des orbes de lumière — ambre, ciel, crème, et une pointe de bleu
 * nuit — dérivent très lentement derrière le premier écran. La barre en verre
 * les floute, la carte de recherche translucide les laisse deviner.
 *
 * « Intelligemment », c'est-à-dire :
 *
 *   · CHARGÉ APRÈS COUP ET SEULEMENT OÙ ÇA VAUT. `import("three")` dans
 *     l'effet : la bibliothèque (~150 Ko) arrive dans un chunk séparé, après
 *     l'hydratation, et UNIQUEMENT au-dessus de 768 px. Sur un téléphone en
 *     données mobiles, les halos CSS font le travail pour zéro octet — la
 *     cible du produit passe avant l'effet.
 *   · `prefers-reduced-motion` : une seule image est rendue, à t = 0, puis
 *     plus rien ne bouge. La lumière est là, le mouvement non.
 *   · EN PAUSE dès que le premier écran sort du champ ou que l'onglet passe
 *     en arrière-plan : pas une image calculée pour personne.
 *   · DPR plafonné à 1,5 : sur un écran 3×, la différence est invisible sous
 *     20 px de flou, le coût GPU non.
 *   · Si WebGL manque, rien ne casse : les halos CSS restent en dessous.
 *
 * Le temps part de zéro à l'arrivée (pas d'horloge murale) : l'image de
 * départ est la même à chaque visite, et la version « une seule image » est
 * déterministe.
 */

type Orb = {
  color: [number, number, number];
  alpha: number;
  size: number;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  phase: number;
  speed: number;
};

const ORBS: Orb[] = [
  // La lumière principale, celle du coin du ciel.
  {
    color: [251, 191, 36],
    alpha: 0.5,
    size: 640,
    x: 0.78,
    y: 0.18,
    driftX: 0.08,
    driftY: 0.06,
    phase: 0.0,
    speed: 0.9,
  },
  {
    color: [245, 158, 11],
    alpha: 0.34,
    size: 420,
    x: 0.55,
    y: 0.05,
    driftX: 0.05,
    driftY: 0.05,
    phase: 1.7,
    speed: 1.2,
  },
  // La réponse froide — le bleu du site, éclairci.
  {
    color: [56, 189, 248],
    alpha: 0.3,
    size: 520,
    x: 0.12,
    y: 0.75,
    driftX: 0.07,
    driftY: 0.05,
    phase: 3.1,
    speed: 0.7,
  },
  {
    color: [255, 224, 138],
    alpha: 0.3,
    size: 380,
    x: 0.3,
    y: 0.35,
    driftX: 0.06,
    driftY: 0.07,
    phase: 4.4,
    speed: 1.05,
  },
  // Une pointe de nuit, presque invisible : la profondeur.
  {
    color: [23, 56, 76],
    alpha: 0.14,
    size: 560,
    x: 0.9,
    y: 0.85,
    driftX: 0.04,
    driftY: 0.04,
    phase: 5.6,
    speed: 0.55,
  },
];

function orbTexture(rgb: [number, number, number]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${rgb.join(",")},0.9)`);
  grad.addColorStop(0.55, `rgba(${rgb.join(",")},0.32)`);
  grad.addColorStop(1, `rgba(${rgb.join(",")},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return c;
}

export function HeroScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.innerWidth < 768) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      } catch {
        return; // Pas de WebGL : les halos CSS restent, rien ne casse.
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.domElement.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);

      const sprites = ORBS.map((orb) => {
        const texture = new THREE.CanvasTexture(orbTexture(orb.color));
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: orb.alpha,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(material);
        scene.add(sprite);
        return { sprite, texture, material, orb };
      });

      let w = 0;
      let h = 0;
      const resize = () => {
        w = el.clientWidth;
        h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.right = w;
        camera.bottom = h;
        camera.updateProjectionMatrix();
      };
      resize();

      const paint = (elapsedS: number) => {
        for (const { sprite, orb } of sprites) {
          const t = elapsedS * 0.10472 * orb.speed + orb.phase; // ~1 tour/min
          sprite.position.set(
            (orb.x + Math.sin(t) * orb.driftX) * w,
            (orb.y + Math.cos(t * 0.83) * orb.driftY) * h,
            0,
          );
          sprite.scale.set(orb.size, orb.size, 1);
        }
        renderer.render(scene, camera);
      };

      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      paint(0);

      let raf = 0;
      let running = false;
      let start = 0;
      const loop = (now: number) => {
        if (!running) return;
        if (!start) start = now;
        paint((now - start) / 1000);
        raf = requestAnimationFrame(loop);
      };
      const play = () => {
        if (still || running || disposed) return;
        running = true;
        raf = requestAnimationFrame(loop);
      };
      const pause = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      const io = new IntersectionObserver(([entry]) =>
        entry.isIntersecting ? play() : pause(),
      );
      io.observe(el);
      const onVisibility = () =>
        document.visibilityState === "visible" ? play() : pause();
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("resize", resize);

      cleanup = () => {
        pause();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", resize);
        for (const { texture, material } of sprites) {
          texture.dispose();
          material.dispose();
        }
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    />
  );
}

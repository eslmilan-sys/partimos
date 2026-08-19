"use client";

import { useEffect } from "react";

/**
 * INSTALLER L'APP — l'enregistrement du service worker.
 *
 * Trois précautions, chacune payée par un bug classique :
 *
 *   1. On enregistre APRÈS le chargement (`load`), pas pendant : le
 *      service worker se met en concurrence avec le premier rendu, et sur
 *      un téléphone d'entrée de gamme ça se voit.
 *   2. On demande une VÉRIFICATION de mise à jour à chaque ouverture.
 *      Sans ça, iOS peut garder l'ancien worker des jours entiers —
 *      exactement le genre de cache qui nous a coûté une nuit.
 *   3. Quand une nouvelle version prend la main, on RECHARGE une seule
 *      fois. Le drapeau évite la boucle de rechargement infinie, qui est
 *      le piège numéro un de `controllerchange`.
 *
 * Le chemin est relatif à la page : sur une Page de projet le site vit
 * sous /test/partimos, et un chemin absolu « /sw.js » viserait la racine
 * du domaine, où il n'y a rien.
 */
export function PWA() {
  /**
   * L'APP INSTALLÉE SE RECONNAÎT — pour les iPhone que la requête média
   * ne couvre pas.
   *
   * `@media (display-mode: standalone)` fait tout le travail sur Android,
   * sur Chrome de bureau et sur iOS ≥ 16.4. En dessous, Safari ne
   * l'implémente pas et ne connaît que `navigator.standalone`, une
   * propriété non standard qui n'existe que chez lui. Une classe sur
   * <html> rejoint les deux chemins sur les mêmes règles CSS.
   *
   * Posé dans un effet, donc après l'hydratation : le HTML rendu par le
   * serveur reste identique pour tout le monde — c'est ce qui garde le
   * SEO intact, et l'app mode ne coûte rien à personne d'autre.
   */
  useEffect(() => {
    const iosInstalada =
      "standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    /* VOIR L'APP SANS L'INSTALLER — `?app=1`, et `?app=0` pour en sortir.
       Sans ça, les deux versions ne sont pas comparables : le mode app ne
       se déclenche qu'une fois l'icône posée sur l'écran d'accueil, donc
       sur un ordinateur on ne le voit JAMAIS. C'est le seul moyen de
       regarder le site d'un côté et l'app de l'autre, côte à côte.

       Dans `sessionStorage`, pas dans l'adresse : la navigation interne de
       Next ne recharge pas la page et perdrait le paramètre au premier
       lien. Session et non `localStorage` — on ferme l'onglet, on retrouve
       le site normal, sans réglage caché qui traîne.

       Aucun effet sur ce qui est servi : le HTML est le même, seule une
       classe change après hydratation. Le SEO ne bouge pas d'un pouce. */
    const PREVIA = "partimos.previa-app";
    let previa = false;
    try {
      const pedido = new URLSearchParams(window.location.search).get("app");
      if (pedido === "1") window.sessionStorage.setItem(PREVIA, "1");
      else if (pedido === "0") window.sessionStorage.removeItem(PREVIA);
      previa = window.sessionStorage.getItem(PREVIA) === "1";
    } catch {
      /* stockage refusé : la prévisualisation ne survit pas au clic, le
         site marche exactement pareil */
    }

    document.documentElement.classList.toggle(
      "app-instalada",
      iosInstalada || previa,
    );
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const registrar = () => {
      navigator.serviceWorker
        .register(`${base}/sw.js`, { scope: `${base}/` })
        .then((reg) => {
          /* Une ouverture de l'app = une vérification de version. */
          reg.update().catch(() => {});
        })
        .catch(() => {
          /* Pas de service worker (mode privé, réglage du téléphone) :
             le site marche exactement pareil, sans le hors-ligne. */
        });
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });

    /* LA PREMIÈRE INSTALLATION N'EST PAS UNE MISE À JOUR.
       Au tout premier chargement il n'y a aucun contrôleur ; le worker
       s'installe, réclame la page, et `controllerchange` se déclenche.
       Recharger là, c'est effacer ce que la personne vient de taper — à la
       première visite, celle qui compte le plus. On ne recharge donc que
       s'il y avait DÉJÀ un contrôleur : ça, c'est une vraie nouvelle
       version. */
    const habiaControlador = Boolean(navigator.serviceWorker.controller);
    let recargando = false;
    const alCambiar = () => {
      if (!habiaControlador || recargando) return;
      recargando = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", alCambiar);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", alCambiar);
      window.removeEventListener("load", registrar);
    };
  }, []);

  return null;
}

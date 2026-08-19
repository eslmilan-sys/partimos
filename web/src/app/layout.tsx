import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Gabarito, Nunito_Sans } from "next/font/google";
import { Nav } from "@/components/site/Nav";
import { PageView } from "@/components/site/PageView";
import { AuthLanding } from "@/components/site/AuthLanding";
import { PWA } from "@/components/site/PWA";
import { SubirAlNavegar } from "@/components/site/SubirAlNavegar";
import { Footer } from "@/components/site/Footer";
import { TabBar } from "@/components/site/TabBar";
import { SessionProvider } from "@/lib/session";
import { SITE, canonical } from "@/lib/site";
import "./globals.css";

/**
 * Polices auto-hébergées par next/font : le CSS est inliné et les fichiers
 * servis depuis notre domaine. On supprime deux allers-retours vers Google
 * (fonts.googleapis + fonts.gstatic) sur le chemin critique, et `adjustFontFallback`
 * aligne les métriques de la police de repli pour qu'il n'y ait aucun décalage
 * visuel au chargement. C'est le principal levier Lighthouse de cette page.
 */
const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-gabarito",
  display: "swap",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

/* Le préfixe d'URL du dépôt, pour les ressources écrites en dur. */
const ICONO = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Partimos — Comparte el carro, comparte los gastos | Panamá",
    template: "%s | Partimos",
  },
  description: SITE.description,
  alternates: { canonical: canonical("/") },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "es_PA",
    title: "Partimos — Alguien ya va para allá",
    description:
      "Te recogen cerca, vas sentado todo el camino y pagas como prefieras: Yappy, tarjeta o efectivo. El aporte le llega completo al conductor.",
    url: canonical("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Partimos — Alguien ya va para allá",
    description:
      "Te recogen cerca, vas sentado todo el camino y pagas como prefieras: Yappy, tarjeta o efectivo. El aporte le llega completo al conductor.",
  },
  robots: { index: true, follow: true },
  /* iOS ne lit PAS le manifeste pour le mode plein écran ni pour l'icône :
     il lui faut ses propres balises. Sans elles, « Ajouter à l'écran
     d'accueil » produit un signet qui rouvre Safari, barre comprise —
     c'est-à-dire tout sauf une app. */
  appleWebApp: {
    capable: true,
    title: "Partimos",
    statusBarStyle: "default",
  },
  icons: {
    /* LE PRÉFIXE DU DÉPÔT, ÉCRIT À LA MAIN. Next n'applique pas le
       `basePath` aux URLs d'icônes : « /icono-180.png » viserait la racine
       du domaine, où il n'y a rien. Le test l'avait raté parce que le
       serveur d'essai servait les deux chemins — corrigé aussi. */
    icon: [
      { url: `${ICONO}/icono-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${ICONO}/icono-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: `${ICONO}/icono-180.png`, sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    /* iOS < 16.4 ne connaît QUE la balise préfixée `apple-`. Next n'émet
       plus que la version moderne ; sans celle-ci, un iPhone un peu ancien
       installe un signet qui rouvre Safari au lieu d'une app. */
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  /* Doit être le fond réel de la page : sur Android, la barre du navigateur
     prend cette couleur et un bleu résiduel d'une ancienne palette faisait un
     bandeau qui n'existe nulle part sur le site. */
  themeColor: "#faf9f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  areaServed: { "@type": "Country", name: "Panamá" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PA" className={`${gabarito.variable} ${nunito.variable}`}>
      <head>
        {/* L'OUVERTURE NE JOUE QU'UNE FOIS PAR SESSION.
            Le propriétaire l'a signalé : « à chaque fois que j'appuie sur
            Buscar j'ai l'animation du début ». Une chorégraphie d'entrée
            est un plaisir la première fois et un péage la vingtième.

            Ce script est INLINE ET SYNCHRONE, dans le `head`, et c'est la
            seule façon correcte : posée depuis un effet, la classe
            arriverait APRÈS la première peinture, et l'animation aurait
            déjà commencé — on verrait un début de mouvement se couper.
            Il ne fait rien d'autre que lire un drapeau et poser une
            classe ; sans JavaScript, l'animation joue, ce qui est le bon
            repli. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var k='partimos.abierta';if(sessionStorage.getItem(k)==='1'){document.documentElement.classList.add('ya-abierta')}else{sessionStorage.setItem(k,'1')}}catch(e){}",
          }}
        />
      </head>
      <body>
        <a
          href="#contenido"
          className="absolute top-2 left-[-999px] z-[200] rounded-lg bg-ink-900 px-4 py-2.5 text-white focus:left-3"
        >
          Saltar al contenido
        </a>
        {/* LA LENTILLE LIQUIDE. Un bruit très basse fréquence déplace de
            quelques pixels ce que les vitres floutent : l'ondulation d'une
            épaisseur d'eau, pas une déformation. Le filtre n'est référencé
            que par `backdrop-filter: url(#liquid-lens)` — les navigateurs
            qui ne le lisent pas gardent le flou net, par la cascade CSS.
            `seed` figé : la même eau à chaque visite. */}
        <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
          <filter id="liquid-lens">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.014"
              numOctaves="2"
              seed="7"
              result="ruido"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="ruido"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        <SessionProvider>
          {/* La barre haute est celle du SITE. Dans l'app, la barre
              d'onglets basse la remplace : deux navigations pour quatre
              destinations, c'est une de trop, et celle du haut est la
              moins atteignable au pouce. */}
          <div className="solo-web">
            <Nav />
          </div>
          {/* Le retour du lien du courriel : muet sur une visite normale. */}
          <AuthLanding />
          {children}
          {/* LE PIED DE PAGE EST UNE CONVENTION DU WEB, et il n'entre
              pas dans l'app : on n'y défile pas « jusqu'au bout » d'une
              page, on change d'écran. Ce qui doit rester atteignable —
              les pages légales, le texte de conformité — a son écran,
              Perfil → Legal. Le HTML servi ne change pas : c'est
              `.solo-web` qui décide, à l'affichage seulement. */}
          <div className="solo-web">
            <Footer />
          </div>
          {/* La mesure : muette sans Supabase, jamais bloquante. */}
          <Suspense fallback={null}>
            <PageView />
          </Suspense>
          {/* L'app installée : service worker, hors-ligne, mises à jour. */}
          <PWA />
          <SubirAlNavegar />
          {/* Toujours dans le HTML, montrée par CSS seulement une fois
              l'app installée — voir `.solo-app` dans globals.css.

              PAS de <Suspense> autour. Il y en avait un, par prudence mal
              placée : React rend alors la barre dans un <div hidden> que
              seule l'hydratation vient déplacer. Conséquence, mesurée —
              dans le fichier autonome (scripts sans React) la barre reste
              masquée POUR TOUJOURS, et sur le vrai site elle n'apparaît
              qu'après l'hydratation : la navigation principale de l'app
              arrive en retard sur un téléphone lent, ce qui est le pire
              endroit où la faire attendre.
              Seul `useSearchParams` impose une frontière Suspense ;
              `usePathname`, dont la barre se sert, n'en a jamais eu
              besoin. */}
          <TabBar />
        </SessionProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSONLD),
          }}
        />
      </body>
    </html>
  );
}

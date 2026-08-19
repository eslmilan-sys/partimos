/**
 * LE PLAN DU PRODUIT — UNE SEULE SOURCE, DEUX USAGES.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE PLUTÔT QU'UN JOLI SCHÉMA DESSINÉ À PART.
 *
 * Un plan de site dessiné à la main est faux le lendemain. On ajoute un
 * écran, on renomme une route, on retire un lien — et le schéma continue
 * de décrire un produit qui n'existe plus. Il devient alors pire
 * qu'absent : on prend des décisions dessus.
 *
 * Ce fichier est donc lu par DEUX choses :
 *
 *   · `verify-mapa.mjs`, qui ouvre un vrai navigateur et prouve que
 *     chaque nœud s'affiche et que chaque arête est réellement
 *     cliquable et mène là où il est écrit ;
 *   · le schéma publié, qui se dessine à partir des mêmes données.
 *
 * Conséquence : le schéma ne peut pas mentir sans que la batterie casse.
 * C'est tout l'intérêt, et c'est la seule façon de répondre honnêtement
 * à « vérifie que tous les chemins marchent ».
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QU'EST UN NŒUD, CE QU'EST UNE ARÊTE.
 *
 * Un NŒUD est un endroit où l'on se trouve : une page (`url`), ou un
 * état à l'intérieur d'une page (une vue du parcours d'entrée, une étape
 * du formulaire). Les seconds n'ont pas d'adresse — c'est délibéré, et
 * documenté là où ça compte (le flux de publication garde une seule URL).
 *
 * Une ARÊTE est un chemin qu'un humain peut emprunter, avec COMMENT :
 *
 *   · `enlace`  — un lien ou un bouton qui navigue. Vérifiable en
 *                 cherchant l'élément puis en cliquant.
 *   · `pestana` — un onglet de la barre du bas (app seulement).
 *   · `paso`    — une avancée à l'intérieur d'un écran, sans navigation.
 *   · `puerta`  — un passage conditionné par le compte.
 *
 * `prueba` dit à la batterie comment reconnaître qu'on est bien arrivé :
 * un texte qui n'existe QUE là. Un titre partagé par deux écrans ne
 * prouve rien.
 */

/* ═══════════════════════════════════════════════════════════════════
   LE SITE — le canal d'acquisition. Tout est consultable sans compte ;
   seul ce qui ENGAGE quelqu'un (réserver, publier, écrire) demande à
   s'identifier. Une page qui exige un compte avant de montrer quoi que
   ce soit ne se référence pas.
   ═══════════════════════════════════════════════════════════════════ */
export const SITIO = {
  titulo: "Sitio web",
  entrada: "inicio",
  grupos: [
    { id: "entrada", label: "Entrada" },
    { id: "viajar", label: "Viajar" },
    { id: "manejar", label: "Manejar" },
    { id: "cuenta", label: "Cuenta" },
    { id: "confianza", label: "Confianza y legal" },
  ],
  nodos: [
    {
      id: "inicio",
      label: "Inicio",
      grupo: "entrada",
      url: "/",
      prueba: /Viaja mejor/i,
      nota: "La carte de recherche, les rutas, le calcul de l'aporte et les preuves. C'est la page qui doit se référencer.",
    },
    {
      id: "ya",
      label: "Buscar un viaje",
      grupo: "viajar",
      url: "/ya",
      prueba: /A dónde vas|Buscar/i,
      nota: "Une seule porte de recherche — trois portes pour le même geste, c'en est deux de trop.",
    },
    {
      id: "resultados",
      label: "Resultados",
      grupo: "viajar",
      url: "/buscar?desde=panama-city&hacia=chitre",
      /* Trois états possibles, tous légitimes : des résultats, aucun, ou
         le bandeau qui dit que le catalogue est encore de démonstration.
         Une sonde qui n'en couvrirait qu'un ferait échouer la batterie
         le jour où le produit va bien. */
      prueba: /viajes? disponibles?|Nadie va|Viajes de ejemplo/i,
      nota: "Un résultat est un SEGMENT : les villes, l'heure et le montant sont ceux du bout de route demandé.",
    },
    {
      id: "viaje",
      label: "Ficha del viaje",
      grupo: "viajar",
      /* Une adresse par viaje : le plan la décrit par sa FORME, seule
         description honnête d'une page qui en a huit cents. */
      patron: "^/viaje/[^/]+$",
      url: null,
      prueba: /Pedir el puesto|Reservar/i,
      nota: "L'adresse porte le tronçon (?desde=&hacia=) — sans lui, la fiche afficherait le prix du trajet entier.",
    },
    {
      id: "rutas",
      label: "Todas las rutas",
      grupo: "viajar",
      url: "/viajes",
      prueba: /A dónde se va/i,
      nota: "Le hub qui relie les douze pages corridor entre elles. Il était lié partout et n'existait pas.",
    },
    {
      id: "corridor",
      label: "Página de ruta",
      grupo: "viajar",
      url: "/viajes/panama-chitre",
      prueba: /Panamá|Chitré/i,
      nota: "Une page par paire de villes : le canal d'acquisition n°1, avec son contenu propre.",
    },
    {
      id: "comoFunciona",
      label: "Cómo se paga",
      grupo: "viajar",
      url: "/como-funciona",
      prueba: /Pagas una sola vez/i,
      nota: "Du premier clic au paiement. Les trois canaux, et ce que coûte chacun.",
    },
    {
      id: "publicarInfo",
      label: "Cuánto recuperas",
      grupo: "manejar",
      url: "/publicar",
      prueba: /recuperas|aporte/i,
      nota: "L'explication et la calculadora. Jamais « gana dinero » : on recupera des frais (R5).",
    },
    {
      id: "publicarFlujo",
      label: "Publicar un viaje",
      grupo: "manejar",
      url: "/publicar/nuevo",
      prueba: /Paso 1 de|confirmemos quién eres|necesita tu cuenta/i,
      nota: "Douze écrans, une question chacun, sur la MÊME adresse. Le brouillon survit à un rechargement.",
    },
    {
      id: "cuenta",
      label: "Mi cuenta",
      grupo: "cuenta",
      url: "/cuenta",
      prueba: /Mis viajes|Tu cuenta|necesita tu cuenta/i,
      nota: "Sans session, le site propose d'entrer ; il ne ferme jamais la porte du reste.",
    },
    {
      id: "entrar",
      label: "Entrar o crear cuenta",
      grupo: "cuenta",
      url: null,
      prueba: /Alguien ya va/i,
      nota: "Le MÊME parcours que l'app, dans une feuille. Mot de passe ou lien par courriel, les deux en boutons.",
    },
    {
      id: "seguridad",
      label: "Seguridad",
      grupo: "confianza",
      url: "/seguridad",
      prueba: /Seguridad|verificad/i,
      nota: "Avec qui on voyage, et ce qu'on ne garde pas — aucune image de cédula, jamais (R6).",
    },
    {
      id: "ayuda",
      label: "Ayuda",
      grupo: "confianza",
      url: "/ayuda",
      prueba: /preguntas|Ayuda/i,
      nota: "Les questions de toujours, filtrables. « Rien trouvé » n'est jamais une page vide.",
    },
    {
      id: "terminos",
      label: "Términos de uso",
      grupo: "confianza",
      url: "/terminos",
      prueba: /Términos/i,
      nota: "Ce qu'est la plateforme et ce qu'elle n'est pas : elle ne transporte personne.",
    },
    {
      id: "privacidad",
      label: "Aviso de privacidad",
      grupo: "confianza",
      url: "/privacidad",
      prueba: /privacidad/i,
      nota: "Ce qu'on garde et ce qu'on refuse de garder.",
    },
  ],
  aristas: [
    { de: "inicio", a: "ya", como: "enlace", etiqueta: "Buscar" },
    { de: "inicio", a: "resultados", como: "enlace", etiqueta: "Buscar viaje" },
    { de: "inicio", a: "comoFunciona", como: "enlace", etiqueta: "Cómo se paga" },
    { de: "inicio", a: "seguridad", como: "enlace", etiqueta: "Seguridad" },
    { de: "inicio", a: "publicarFlujo", como: "enlace", etiqueta: "Publicar" },
    { de: "inicio", a: "corridor", como: "enlace", etiqueta: "Rutas populares" },
    { de: "inicio", a: "cuenta", como: "enlace", etiqueta: "Mi cuenta" },
    { de: "ya", a: "resultados", como: "enlace", etiqueta: "Otras fechas" },
    { de: "resultados", a: "viaje", como: "enlace", etiqueta: "Una tarjeta" },
    {
      de: "viaje",
      a: "entrar",
      como: "puerta",
      /* « CONECTARME Y RESERVAR », et pas « Pedir el puesto ».
         C'est ce que voit quelqu'un qui n'a pas de compte — et c'est
         justement le chemin que cette arête décrit. Le libellé « Pedir
         el puesto » n'apparaît qu'une fois connecté. Le plan disait le
         mauvais, la batterie l'a dit. */
      etiqueta: "Conectarme y reservar",
      /* On DÉCOUVRE une fiche vivante depuis les résultats : coder une
         adresse en dur ferait échouer la batterie chaque jour, puisque
         les identifiants portent la date du viaje. */
      arranque: "/buscar?desde=panama-city&hacia=chitre",
      seguirPatron: "^/viaje/[^/]+$",
      boton: "Conectarme y reservar",
    },
    { de: "rutas", a: "corridor", como: "enlace", etiqueta: "Una ruta" },
    { de: "corridor", a: "rutas", como: "enlace", etiqueta: "Todas las rutas" },
    { de: "corridor", a: "publicarFlujo", como: "enlace", etiqueta: "Publicar aquí" },
    { de: "publicarInfo", a: "publicarFlujo", como: "enlace", etiqueta: "Publicar mi viaje" },
    {
      de: "publicarFlujo",
      a: "entrar",
      como: "puerta",
      etiqueta: "Conectarme y publicar",
      /* Il faut TRAVERSER les douze écrans pour y arriver : la porte est
         au bout du formulaire, pas à son entrée. La batterie avance donc
         jusqu'à ce que le bouton existe — c'est exactement ce que fait
         un conducteur. */
      avanzar: true,
      boton: "Conectarme y publicar",
    },
    { de: "cuenta", a: "entrar", como: "puerta", etiqueta: "Conectarme o crear cuenta", boton: "Conectarme o crear cuenta" },
    { de: "inicio", a: "ayuda", como: "enlace", etiqueta: "Pie de página" },
    { de: "inicio", a: "terminos", como: "enlace", etiqueta: "Pie de página" },
    { de: "inicio", a: "privacidad", como: "enlace", etiqueta: "Pie de página" },
    { de: "inicio", a: "publicarInfo", como: "enlace", etiqueta: "Pie de página" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   L'APP — la même base de code, une autre disposition. Cinq onglets en
   bas, des écrans pleins, et une PORTE devant tout ce qui engage
   quelqu'un. Sans compte, seule la recherche reste entière : exiger
   l'inscription à l'entrée coûte plus de visiteurs qu'elle n'en
   qualifie.
   ═══════════════════════════════════════════════════════════════════ */
export const APP = {
  titulo: "App instalada",
  entrada: "portada",
  grupos: [
    { id: "puerta", label: "Puerta de entrada" },
    { id: "buscar", label: "Buscar y reservar" },
    { id: "publicar", label: "Publicar" },
    { id: "cuenta", label: "Mi cuenta" },
  ],
  nodos: [
    {
      id: "portada",
      label: "Portada",
      grupo: "puerta",
      url: null,
      /* PAS « Alguien ya va » : ce titre est remplacé par le MOTIF quand
         la porte s'interpose (« Publicar un viaje necesita tu cuenta »).
         Les trois arguments, eux, ne bougent jamais. */
      prueba: /Viaja a donde quieras/i,
      nota: "Photo, trois arguments, deux portes. La croix mène au mode invité — chercher ne demande pas de compte.",
    },
    {
      id: "comoEntrar",
      label: "¿Cómo crear tu cuenta?",
      grupo: "puerta",
      url: null,
      prueba: /Cómo quieres crear tu cuenta/i,
      nota: "N'apparaît QUE s'il y a plusieurs portes. Aucun fournisseur activé : on va droit aux questions.",
      condicional: true,
    },
    {
      id: "registro",
      label: "Registro — 6 preguntas",
      grupo: "puerta",
      url: null,
      prueba: /Cómo te llamas/i,
      nota: "Nombre, nacimiento, trato, correo, celular, contraseña. Une question par écran, marche arrière garantie.",
    },
    {
      id: "acceder",
      label: "Entrar a tu cuenta",
      grupo: "puerta",
      url: null,
      prueba: /Entra a tu cuenta/i,
      nota: "Contraseña OU enlace par courriel — les deux sont des boutons. Installée, l'app demande le code à six chiffres.",
    },
    {
      id: "codigo",
      label: "Código por correo",
      grupo: "puerta",
      url: null,
      prueba: /Revisa tu correo/i,
      nota: "Le seul chemin par courriel qui marche dans une app installée : le lien, lui, ouvre le navigateur.",
    },
    {
      id: "inicioApp",
      label: "Buscar",
      grupo: "buscar",
      url: "/",
      prueba: /A dónde vas|Buscar/i,
      nota: "Premier onglet. La carte de recherche, les rutas fréquentes, ce qui se passe aujourd'hui.",
    },
    {
      id: "resultadosApp",
      label: "Resultados",
      grupo: "buscar",
      url: "/buscar?desde=panama-city&hacia=chitre",
      prueba: /viajes? disponibles?|Nadie va|Viajes de ejemplo/i,
      nota: "Filtres, tri, et la garantie dite une fois : tous les conducteurs sont vérifiés.",
    },
    {
      id: "viajeApp",
      label: "Ficha del viaje",
      grupo: "buscar",
      patron: "^/viaje/[^/]+$",
      url: null,
      /* DEUX LIBELLÉS POUR UN MÊME BOUTON, et les deux sont vrais :
         « Reservar » quand le conducteur accepte à l'instant, « Pedir el
         puesto » quand il répond lui-même. Une sonde qui n'en connaît
         qu'un échoue une fois sur deux, au hasard du viaje tiré. */
      prueba: /Pedir el puesto|Reservar/i,
      nota: "Qui conduit, le recorrido, le prix du segment. Monter en cours de route s'annonce avec sa fenêtre d'heure.",
    },
    {
      id: "publicarApp",
      label: "Publicar",
      grupo: "publicar",
      url: "/publicar/nuevo",
      prueba: /Paso 1 de|confirmemos quién eres|necesita tu cuenta/i,
      nota: "Deuxième onglet. Derrière la porte : cédula, licencia et carro sont exigés avant le premier champ.",
    },
    {
      id: "misViajes",
      sesion: true,
      label: "Mis viajes",
      grupo: "cuenta",
      url: "/cuenta",
      prueba: /Mis viajes|necesita tu cuenta/i,
      nota: "Troisième onglet. Próximos, en curso, historial.",
    },
    {
      id: "mensajes",
      sesion: true,
      label: "Mensajes",
      grupo: "cuenta",
      url: "/cuenta/mensajes",
      prueba: /Mensajes|necesita tu cuenta/i,
      nota: "Quatrième onglet. Un fil par reserva — deux passagers du même viaje ont deux conversations.",
    },
    {
      id: "perfil",
      sesion: true,
      label: "Perfil",
      grupo: "cuenta",
      url: "/cuenta/perfil",
      /* « Perfil » n'apparaît nulle part sur l'écran du profil : le
         titre, c'est le NOM de la personne. Ce qui l'identifie de façon
         stable, ce sont ses deux onglets. */
      prueba: /Sobre ti|necesita tu cuenta/i,
      nota: "Cinquième onglet. Sobre ti (les chiffres) et Cuenta (les réglages), séparés.",
    },
    {
      id: "verificacion",
      sesion: true,
      label: "Verificación",
      grupo: "cuenta",
      url: "/cuenta/verificacion",
      prueba: /Verificación|necesita tu cuenta/i,
      nota: "Cédula et licencia passent par Didit et n'y laissent qu'un verdict. Aucune image chez nous (R6).",
    },
    {
      id: "legal",
      sesion: true,
      label: "Legal",
      grupo: "cuenta",
      url: "/cuenta/legal",
      prueba: /Legal|Términos|necesita tu cuenta/i,
      nota: "Les trois textes, atteignables depuis l'app sans passer par le site.",
    },
  ],
  aristas: [
    /* ── LE PARCOURS D'ENTRÉE ─────────────────────────────────────────
       Ces états n'ont pas d'adresse : ils vivent DANS un écran. Pour les
       vérifier quand même, chaque arête dit d'où partir (`arranque`, sans
       le drapeau invité — sinon la porte tombe et on ne voit rien) et
       quels gestes enchaîner (`camino`). La batterie les rejoue tels
       quels : c'est le parcours réel, pas une approximation.

       Deux transitions restent hors de portée d'ici, et on le DIT plutôt
       que de les compter comme réussies : ouvrir une session demande un
       serveur, et Supabase est injoignable depuis ce conteneur. */
    {
      de: "portada",
      a: "comoEntrar",
      como: "paso",
      etiqueta: "Crear cuenta",
      arranque: "/",
      sinInvitado: true,
      camino: ["Crear cuenta"],
      /* L'écran du canal ne s'affiche QUE si un fournisseur social est
         activé. Aucun ne l'est ici, donc on atterrit directement sur la
         première question — et c'est le comportement voulu. */
      opcional: true,
    },
    {
      de: "portada",
      a: "registro",
      como: "paso",
      etiqueta: "Crear cuenta (sin otras puertas)",
      arranque: "/",
      sinInvitado: true,
      camino: ["Crear cuenta"],
    },
    {
      de: "portada",
      a: "acceder",
      como: "paso",
      etiqueta: "Iniciar sesión",
      arranque: "/",
      sinInvitado: true,
      camino: ["Iniciar sesión"],
    },
    {
      de: "portada",
      a: "inicioApp",
      como: "paso",
      etiqueta: "Solo quiero buscar",
      arranque: "/",
      sinInvitado: true,
      camino: ["Solo quiero buscar viajes"],
    },
    {
      de: "comoEntrar",
      a: "registro",
      como: "paso",
      etiqueta: "Con mi correo",
      arranque: "/",
      sinInvitado: true,
      camino: ["Crear cuenta", "Continuar con mi correo"],
      opcional: true,
    },
    {
      de: "comoEntrar",
      a: "acceder",
      como: "paso",
      etiqueta: "Ya tengo cuenta",
      arranque: "/",
      sinInvitado: true,
      camino: ["Crear cuenta", "Iniciar sesión"],
      opcional: true,
    },
    {
      de: "acceder",
      a: "codigo",
      como: "paso",
      etiqueta: "Mándame un enlace",
      arranque: "/",
      sinInvitado: true,
      camino: ["Iniciar sesión"],
      /* Le bouton part chercher un courriel chez Supabase : injoignable
         d'ici. On vérifie donc qu'il EXISTE et qu'il est utilisable —
         cliquer ne prouverait rien de plus sans serveur. */
      soloPresencia: "Mándame un enlace",
    },
    {
      de: "acceder",
      a: "registro",
      como: "paso",
      etiqueta: "Crear cuenta",
      arranque: "/",
      sinInvitado: true,
      camino: ["Iniciar sesión", "Crear cuenta"],
    },
    {
      de: "codigo",
      a: "inicioApp",
      como: "puerta",
      etiqueta: "Código correcto",
      necesitaServidor: "ouvrir une session demande Supabase, injoignable depuis ce conteneur",
    },
    {
      de: "registro",
      a: "inicioApp",
      como: "puerta",
      etiqueta: "Cuenta creada",
      necesitaServidor: "créer un compte demande Supabase, injoignable depuis ce conteneur",
    },
    { de: "inicioApp", a: "resultadosApp", como: "enlace", etiqueta: "Buscar" },
    { de: "resultadosApp", a: "viajeApp", como: "enlace", etiqueta: "Una tarjeta" },
    { de: "inicioApp", a: "publicarApp", como: "pestana", etiqueta: "Publicar" },
    { de: "inicioApp", a: "misViajes", como: "pestana", etiqueta: "Mis viajes" , sesion: true },
    { de: "inicioApp", a: "mensajes", como: "pestana", etiqueta: "Mensajes" , sesion: true },
    { de: "inicioApp", a: "perfil", como: "pestana", etiqueta: "Perfil" , sesion: true },
    { de: "perfil", a: "verificacion", como: "enlace", etiqueta: "Verificación", sesion: true, antes: "Cuenta" },
    {
      de: "perfil",
      a: "legal",
      como: "enlace",
      etiqueta: "Legal (pestaña « Cuenta »)",
      sesion: true,
      /* Le profil est coupé en deux : « Sobre ti » (les chiffres) et
         « Cuenta » (les réglages). Legal vit dans la seconde — le plan
         le dit plutôt que de faire croire à un lien de premier niveau. */
      antes: "Cuenta",
    },
    { de: "publicarApp", a: "portada", como: "puerta", etiqueta: "Sin cuenta", sinSesion: true },
    { de: "misViajes", a: "portada", como: "puerta", etiqueta: "Sin cuenta", sinSesion: true },
  ],
};

export const MAPAS = [SITIO, APP];

"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { DOC_TYPE, type DocKind } from "./didit";

/**
 * L'ÉTAT DE LA VÉRIFICATION — six états, pas deux.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CE QUI MANQUAIT, ET CE QUE ÇA COÛTAIT.
 *
 * L'app ne connaissait que `isVerified` (un booléen) et
 * `verificacionEnviada` (un horodatage rangé dans la session LOCALE).
 * Trois conséquences, toutes vécues :
 *
 *   · un REFUS ressemblait à une attente. On attendait un verdict déjà
 *     tombé, sans savoir qu'il fallait recommencer.
 *   · une EXPIRATION ressemblait à une attente. Pareil.
 *   · changer de téléphone effaçait « j'ai envoyé mes papiers », puisque
 *     l'information ne vivait nulle part ailleurs.
 *
 * La base, elle, a toujours su : `identity_verifications.status` porte
 * `pending / verified / rejected / expired`. C'est le produit qui ne la
 * lisait pas. Ce module est le pont — et il ne ment jamais : tant que le
 * serveur n'a pas dit « verificado », l'écran ne le dit pas non plus.
 * ─────────────────────────────────────────────────────────────────────
 */

export type EstadoVerificacion =
  /** Rien n'a jamais été envoyé. */
  | "sin_empezar"
  /** Le dossier est parti, Didit ne s'est pas encore prononcé. */
  | "en_proceso"
  /** Didit a dit oui. Le seul état qui autorise à publier. */
  | "verificado"
  /** Didit a dit non. Récupérable : on peut recommencer. */
  | "rechazado"
  /** Le dossier a vieilli. Récupérable aussi. */
  | "vencido"
  /** La base n'est pas joignable — on ne sait pas, et on le dit. */
  | "desconocido";

export type Verificacion = {
  estado: EstadoVerificacion;
  /** Quand le serveur a changé d'avis pour la dernière fois. */
  actualizado: string | null;
  /** Peut-on relancer un dossier ? Un dossier en cours ne se relance pas
   *  — ce serait en ouvrir un deuxième et embrouiller le verdict. */
  puedeReintentar: boolean;
};

const DESCONOCIDO: Verificacion = {
  estado: "desconocido",
  actualizado: null,
  puedeReintentar: true,
};

/** La traduction depuis l'énumération SQL. Un statut que nous ne
 *  connaissons pas devient « en cours » plutôt que « refusé » : dans le
 *  doute, on ne condamne pas quelqu'un dont le dossier est peut-être
 *  bon. */
function desdeSql(sql: string | null): EstadoVerificacion {
  switch (sql) {
    case "verified":
      return "verificado";
    case "rejected":
      return "rechazado";
    case "expired":
      return "vencido";
    case "pending":
      return "en_proceso";
    default:
      return sql ? "en_proceso" : "sin_empezar";
  }
}

export function puedeReintentar(estado: EstadoVerificacion): boolean {
  return estado === "rechazado" || estado === "vencido" || estado === "sin_empezar";
}

/**
 * L'état d'un document, lu chez le serveur. La RLS (`kyc_own_only`)
 * garantit qu'on ne voit que le sien — la requête n'a donc pas besoin de
 * filtrer sur l'utilisateur, et ne peut pas se tromper de personne.
 */
export async function leerVerificacion(kind: DocKind): Promise<Verificacion> {
  const supabase = getSupabase();
  if (!isSupabaseConfigured || !supabase) return DESCONOCIDO;
  try {
    /* UNE ATTENTE BORNÉE. Sans ça, une requête qui « pend » — réseau en
       bord de couverture, base injoignable — ne se termine jamais : le
       bouton reste sur « Consultando… » indéfiniment et la page ne se
       stabilise plus. Huit secondes, la même philosophie que le délai du
       service worker : au-delà, on considère que le réseau ment, et on
       rend « desconocido », qui est la vérité. */
    const { data, error } = await supabase
      .from("identity_verifications")
      .select("status, updated_at")
      .eq("document_type", DOC_TYPE[kind])
      .order("created_at", { ascending: false })
      .limit(1)
      .abortSignal(AbortSignal.timeout(8000));
    if (error) return DESCONOCIDO;
    if (!data || data.length === 0) {
      return { estado: "sin_empezar", actualizado: null, puedeReintentar: true };
    }
    const estado = desdeSql((data[0].status as string | null) ?? null);
    return {
      estado,
      actualizado: (data[0].updated_at as string | null) ?? null,
      puedeReintentar: puedeReintentar(estado),
    };
  } catch {
    return DESCONOCIDO;
  }
}

/**
 * L'état, dans un composant, avec relecture.
 *
 * POURQUOI PAS DE SONDAGE AUTOMATIQUE. Un `setInterval` qui interroge la
 * base toutes les dix secondes coûte de la batterie et des requêtes pour
 * un événement qui arrive une fois dans la vie d'un compte. On relit à
 * deux moments où c'est utile — au montage, et quand l'onglet redevient
 * visible, c'est-à-dire quand la personne revient de chez Didit — et on
 * laisse un bouton pour forcer. C'est ce dernier point qui compte : on
 * ne prétend pas que l'écran se mettra à jour tout seul.
 */
export function useVerificacion(kind: DocKind) {
  const [estado, setEstado] = useState<Verificacion>(DESCONOCIDO);
  const [cargando, setCargando] = useState(true);

  const releer = useCallback(async () => {
    setCargando(true);
    const v = await leerVerificacion(kind);
    setEstado(v);
    setCargando(false);
  }, [kind]);

  useEffect(() => {
    let vivo = true;
    void leerVerificacion(kind).then((v) => {
      if (!vivo) return;
      setEstado(v);
      setCargando(false);
    });

    /* LE RETOUR DE CHEZ DIDIT. Le parcours s'ouvre dans un autre onglet ;
       quand celui-ci redevient visible, le verdict est peut-être tombé.
       C'est le seul moment où une relecture a de vraies chances de
       trouver du nouveau. */
    const alVolver = () => {
      if (document.visibilityState === "visible") void releer();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [kind, releer]);

  return { ...estado, cargando, releer };
}

/* ══════════════════════════════════════════════════════════════════════
   CE QUE L'ÉCRAN DIT — un seul endroit, pour que les cinq écrans qui
   parlent de vérification racontent la même histoire.
   ══════════════════════════════════════════════════════════════════════ */

export type Copia = {
  etiqueta: string;
  detalle: string;
  tono: "neutro" | "espera" | "bien" | "problema";
};

export const COPIA: Record<EstadoVerificacion, Copia> = {
  sin_empezar: {
    etiqueta: "Sin verificar",
    detalle: "Toma unos minutos y se hace una sola vez.",
    tono: "neutro",
  },
  en_proceso: {
    etiqueta: "Verificación en proceso",
    /* TROIS CHOSES, DANS CET ORDRE : c'est arrivé, ça prend ce
       temps-là, et vous n'avez rien à faire. La dernière est la plus
       importante — sans elle, on reste devant l'écran à attendre. */
    detalle:
      "Didit está revisando tus documentos. Normalmente toma unos minutos. Te avisamos apenas esté lista — no tienes que hacer nada.",
    tono: "espera",
  },
  verificado: {
    etiqueta: "Identidad verificada",
    detalle: "Ya puedes publicar viajes.",
    tono: "bien",
  },
  rechazado: {
    etiqueta: "No pudimos verificarte",
    /* Un refus doit dire quoi faire. « Rechazado » tout seul renvoie la
       personne à réessayer à l'identique, donc à échouer à l'identique. */
    detalle:
      "Didit no pudo confirmar tu documento. Suele ser por una foto borrosa o un documento vencido. Puedes intentarlo de nuevo.",
    tono: "problema",
  },
  vencido: {
    etiqueta: "Tu verificación venció",
    detalle: "Las verificaciones caducan. Repite el proceso para seguir publicando.",
    tono: "problema",
  },
  desconocido: {
    etiqueta: "No pudimos consultar tu estado",
    /* On ne prétend pas que tout va bien quand on ne sait pas. */
    detalle: "Revisa tu conexión y vuelve a intentar.",
    tono: "neutro",
  },
};

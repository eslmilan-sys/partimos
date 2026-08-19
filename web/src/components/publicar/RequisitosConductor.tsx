"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { abrirVerificacion, type DocKind } from "@/lib/didit";
import { CarroInline } from "./CarroInline";

/**
 * CE QU'IL FAUT POUR PUBLIER — annoncé AU DÉBUT, pas à la fin.
 *
 * Le verrou existait déjà, mais il n'apparaissait qu'à la dernière étape :
 * on choisissait sa route, ses paradas, son heure, ses puestos, son
 * aporte… et là seulement on apprenait qu'il fallait vérifier sa cédula.
 * Vingt champs remplis pour rien. Personne ne revient après ça.
 *
 * Donc : la liste s'affiche dès le premier écran, et chaque ligne PORTE
 * SON GESTE. Vérifier la cédula se fait ici même, sans quitter le
 * formulaire — parce qu'un lien vers une autre page, à ce moment-là,
 * c'est un abandon de plus.
 *
 * Deux tons pour le même contenu : « aviso » au début (on prévient, on
 * ne bloque pas — le conducteur peut préparer son viaje pendant que la
 * vérification tourne), « bloqueo » à la fin (là, c'est la règle).
 */

export type Requisito = {
  que: string;
  porQue: string;
  /** Le document à vérifier chez Didit. */
  doc?: DocKind;
  /** Le carro : il se saisit ICI MÊME, plus jamais sur une autre page.
   *  Le champ `donde` a disparu avec le lien qu'il portait — voir la note
   *  sur le geste, juste en dessous. */
  carro?: true;
};

export function RequisitosConductor({
  faltantes,
  tono,
}: {
  faltantes: Requisito[];
  tono: "aviso" | "bloqueo";
}) {
  const [abriendo, setAbriendo] = useState<DocKind | null>(null);
  const [error, setError] = useState("");
  const faltaCarro = faltantes.some((f) => f.carro);
  /* Ouvert d'office quand le carro est le seul obstacle restant. */
  const [abrirCarro, setAbrirCarro] = useState(
    faltaCarro && faltantes.length === 1,
  );

  if (faltantes.length === 0) return null;

  const verificar = async (doc: DocKind) => {
    setError("");
    setAbriendo(doc);
    /* `abrirVerificacion` PLUTÔT QUE `startIdVerification`. La différence
       n'est pas cosmétique : la seconde échoue sèchement si la session
       liée ne s'ouvre pas, la première retombe sur le parcours hébergé de
       Didit. C'est exactement ce qui manquait le jour où la fonction Edge
       répondait bien mais où le navigateur refusait sa réponse : le
       document POUVAIT être vérifié, et l'écran disait le contraire. */
    const r = await abrirVerificacion(doc);
    if ("url" in r) {
      window.location.assign(r.url);
      return;
    }
    setAbriendo(null);
    setError(
      r.error === "already_verified"
        ? "Ese documento ya está verificado."
        : `No se pudo abrir la verificación (${r.error}).`,
    );
  };

  return (
    <div
      className={`rounded-[20px] px-4 py-4 sm:px-5 ${
        tono === "bloqueo"
          ? "border-[1.5px] border-action bg-action-soft"
          : "border border-ink-200 bg-ink-50/70"
      }`}
    >
      <h2 className="mb-1 font-display text-[16.5px] font-bold text-action-ink">
        {tono === "bloqueo"
          ? "Antes de publicar, falta poco"
          : "Para publicar vas a necesitar esto"}
      </h2>
      <p
        className={`mb-3 text-[13.5px] leading-relaxed ${
          tono === "bloqueo" ? "text-action-ink/85" : "text-ink-500"
        }`}
      >
        {tono === "bloqueo"
          ? "Alguien va a subirse a tu carro. Esto es lo que lo hace posible — se pide una sola vez."
          : "Te lo decimos ahora para que no llenes todo el viaje y te frenes al final. Puedes empezarlo aquí mismo y seguir armando tu viaje mientras tanto."}
      </p>

      <ul className="grid gap-2">
        {faltantes.map((f) => (
          <li
            key={f.que}
            className="flex items-start gap-3 rounded-[14px] bg-white px-4 py-3"
          >
            <span
              aria-hidden
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-ink-200"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold">{f.que}</span>
              <span className="block text-[12.5px] leading-snug text-ink-500">
                {f.porQue}
              </span>
            </span>
            {/* LE GESTE EST SUR LA LIGNE, ET IL Y RESTE.
                Un document se vérifie d'ici. Le carro, lui, menait à
                `/cuenta?panel=carro` — un lien vers une autre page, à cet
                instant précis, est un abandon déguisé : on quitte le
                formulaire, on remplit un écran de réglages qu'on n'avait
                pas demandé, et il faut retrouver seul le chemin du
                retour. Il se déclare donc ICI, sous la ligne. */}
            {f.doc ? (
              <button
                type="button"
                onClick={() => void verificar(f.doc!)}
                disabled={abriendo !== null}
                className="shrink-0 self-center rounded-full bg-ink-900 px-4 py-2 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {abriendo === f.doc ? "Abriendo…" : "Verificar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAbrirCarro((v) => !v)}
                aria-expanded={abrirCarro}
                className="flex shrink-0 self-center items-center gap-1 rounded-full border-[1.5px] border-ink-200 px-4 py-2 text-[13.5px] font-bold transition-colors hover:border-accent"
              >
                {abrirCarro ? "Cerrar" : "Agregar"}
                <Icon
                  name="arrowRight"
                  className={`size-3.5 transition-transform ${abrirCarro ? "-rotate-90" : ""}`}
                />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* LE FORMULAIRE, DANS LA MÊME PAGE. Il s'ouvre tout seul quand le
          carro est la SEULE chose qui manque : à ce moment-là il n'y a
          rien d'autre à faire, et un panneau replié serait une porte de
          plus à pousser. */}
      {faltaCarro && abrirCarro && (
        <div className="mt-2.5 rounded-[14px] bg-white px-4 py-4">
          <CarroInline compacto />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2.5 text-[13px] text-danger">
          {error}
        </p>
      )}

      <p
        className={`mt-3 text-[12.5px] leading-snug ${
          tono === "bloqueo" ? "text-action-ink/85" : "text-ink-500"
        }`}
      >
        Los documentos los revisa Didit y nunca los guardamos: solo nos llega
        «verificado». Buscar y reservar como pasajero no necesita nada de esto.
      </p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import { getSupabase } from "@/lib/supabase";
import {
  MAX_BODY,
  QUICK_QUESTIONS,
  countUnread,
  fetchMessages,
  markRead,
  sendMessage,
  subscribe,
  transportFor,
  type ChatMessage,
} from "@/lib/chat";

/**
 * LE FIL D'UNE RESERVA — un écran à lui, pas un pli dans la liste.
 *
 * Il remplace le numéro de téléphone, et c'est tout le propos : donner le
 * celular du conducteur, c'était sortir la coordination de la plateforme
 * dès la première minute. Le fil garde la preuve : `messages_inmutables`
 * interdit de réécrire un message après coup, des deux côtés.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN PANNEAU ET NON UN DÉPLIANT.
 *
 * La version précédente s'ouvrait DANS la carte de la reserva : même fond,
 * même largeur, sous la même liste. Signalé tel quel par le propriétaire —
 * « on ne voit pas vraiment que c'est une fonction distincte de la page
 * Mis viajes ». Il avait raison, et la cause est une règle de base : deux
 * choses de nature différente qui partagent le même plan se lisent comme
 * une seule.
 *
 * Le fil arrive donc PAR LA DROITE, pleine hauteur, avec son propre
 * en-tête sombre — trois signaux au lieu d'un. La direction du mouvement
 * n'est pas décorative : elle dit d'où l'écran vient, donc où il retourne
 * quand on le ferme. Sur le web, l'ancre reste la liste ; dans l'app, c'est
 * un écran à part entière.
 *
 * L'en-tête sombre est le SEUL de ce panneau — la maison n'autorise qu'une
 * section sombre par écran, et celle-ci sert à séparer, pas à décorer.
 */

/** L'id du compte connecté côté base — sert à savoir quels messages sont
 *  les miens. Nul en démonstration : le fil local est mono-utilisateur. */
function useMyId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let vivo = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (vivo) setId(data.user?.id ?? null);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);
  return id;
}

function hora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-PA", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ChatThread({
  bookingId,
  otherName,
  /** Le contexte affiché en tête : « Panamá → Chitré · Mañana ». */
  ruta,
  /** Une reserva annulée ne se discute plus — la policy d'écriture le
   *  refuse en base, l'écran doit le dire au lieu de laisser taper. */
  closed = false,
}: {
  bookingId: string;
  otherName: string;
  ruta?: string;
  closed?: boolean;
}) {
  const myId = useMyId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const finDelHilo = useRef<HTMLDivElement | null>(null);

  const transport = transportFor(bookingId);
  const unread = countUnread(messages);

  const recargar = useCallback(() => {
    void fetchMessages(bookingId, myId).then(setMessages);
  }, [bookingId, myId]);

  /* Charger + écouter. L'abonnement vit même fil FERMÉ : sans ça la
     pastille ne pourrait pas s'allumer, et il faudrait recharger la page
     pour savoir qu'on a reçu une réponse. */
  useEffect(() => {
    recargar();
    return subscribe(bookingId, myId, recargar);
  }, [bookingId, myId, recargar]);

  /* Ouvrir, c'est lire. */
  useEffect(() => {
    if (!open || unread === 0) return;
    void markRead(bookingId, myId).then(recargar);
  }, [open, unread, bookingId, myId, recargar]);

  /* Le dernier message doit être visible sans faire défiler. */
  useEffect(() => {
    if (open) finDelHilo.current?.scrollIntoView({ block: "nearest" });
  }, [open, messages.length]);

  async function enviar(texto: string) {
    if (!texto.trim() || sending || closed) return;
    setSending(true);
    setFailed(false);
    const escrito = await sendMessage(bookingId, myId, texto);
    setSending(false);
    if (!escrito) {
      /* Un message qui disparaît sans rien dire est pire que pas de chat :
         on garde le brouillon et on l'annonce. */
      setFailed(true);
      return;
    }
    setDraft("");
    recargar();
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink-200 px-3 py-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:border-accent hover:text-accent-ink"
        >
          <Icon name="chat" className="size-4" />
          {messages.length === 0
            ? `Escribir a ${otherName}`
            : `Chat con ${otherName}`}
          {unread > 0 && (
            <span
              className="tnum inline-flex min-w-[19px] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white"
              aria-label={`${unread} sin leer`}
            >
              {unread}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="panel-fondo fixed inset-0 z-[90] bg-ink-900/45 backdrop-blur-[3px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="panel-derecha fixed inset-y-0 right-0 z-[100] flex w-full max-w-[520px] flex-col bg-ink-50 shadow-[-12px_0_48px_rgba(0,0,0,0.22)] focus:outline-none"
        >
          {/* L'EN-TÊTE SOMBRE : ce qui dit, avant toute lecture, qu'on a
              changé d'écran. */}
          <header className="glass-noche flex items-start gap-3 bg-night-900 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-4 text-white">
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Volver"
                className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon name="arrowRight" className="size-5 rotate-180" />
              </button>
            </Dialog.Close>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-[19px] leading-tight font-bold">
                {otherName}
              </Dialog.Title>
              {ruta && (
                <p className="mt-0.5 truncate text-[13px] text-white/70">
                  {ruta}
                </p>
              )}
            </div>
          </header>

          {/* LE BANDEAU DE SÉCURITÉ — ce qu'il dit et ce qu'il NE dit pas.
              Il ne dit pas « ne payez jamais hors de l'application » :
              chez nous payer le conducteur en main est un canal
              légitime, et l'interdire serait mentir sur le produit. Il
              dit ce qui est vrai et utile : la conversation reste écrite
              et non modifiable, donc elle sert de preuve — à condition
              de ne pas la déplacer ailleurs. */}
          <p className="flex items-start gap-2 border-b border-ink-200 bg-verde-suave px-4 py-2.5 text-[12.5px] leading-snug text-ink-600">
            <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-verde-ok" />
            <span>
              Todo lo que acuerden aquí queda escrito y nadie puede cambiarlo
              después. No hace falta dar tu número ni tu dirección exacta.
            </span>
          </p>

          {/* LE FIL */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid gap-2">
              {messages.length === 0 ? (
                <p className="px-1 py-2 text-[14px] leading-relaxed text-ink-500">
                  Aquí coordinas la hora y el punto exacto con {otherName}.
                  Queda escrito: ninguno de los dos puede cambiar un mensaje
                  después.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-[16px] px-3.5 py-2.5 text-[14.5px] leading-snug ${
                        m.mine
                          ? "rounded-br-[6px] bg-ink-900 text-white"
                          : "rounded-bl-[6px] border border-ink-200 bg-white"
                      }`}
                    >
                      <span className="block break-words whitespace-pre-wrap">
                        {m.body}
                      </span>
                      <span
                        className={`tnum mt-1 block text-[11px] ${
                          m.mine ? "text-white/55" : "text-ink-400"
                        }`}
                      >
                        {hora(m.at)}
                        {m.mine && m.readAt ? " · Leído" : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={finDelHilo} />
            </div>
          </div>

          {/* LA BARRE D'ÉCRITURE — en verre, posée sur le fil qui passe
              dessous. `safe-area-inset-bottom` tient compte de la barre
              d'accueil de l'iPhone : un champ posé dessus est inatteignable. */}
          <div className="glass border-t border-ink-200 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            {/* LES QUESTIONS TOUTES FAITES restent tant que je n'ai rien
                écrit MOI. Les retirer au premier message reçu privait de
                la béquille exactement au moment où l'on hésite à
                répondre ; elles partent quand on n'en a plus besoin. */}
            {!messages.some((m) => m.mine) && !closed && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void enviar(q)}
                    disabled={sending}
                    className="rounded-full border border-ink-200 bg-white/80 px-2.5 py-1.5 text-[12.5px] text-ink-500 transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {closed ? (
              <p className="text-[12.5px] leading-snug text-ink-500">
                Esta reserva está cancelada: la conversación queda para
                consulta, pero ya no se puede escribir.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void enviar(draft);
                }}
                className="flex items-end gap-2"
              >
                <label htmlFor={`chat-${bookingId}`} className="sr-only">
                  Mensaje para {otherName}
                </label>
                <textarea
                  id={`chat-${bookingId}`}
                  rows={1}
                  value={draft}
                  maxLength={MAX_BODY}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    /* Entrée envoie, Maj+Entrée saute une ligne : c'est ce
                       que font tous les chats, donc ce que les doigts font. */
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void enviar(draft);
                    }
                  }}
                  placeholder="Escribe un mensaje"
                  className="min-h-[44px] flex-1 resize-none rounded-[14px] border-[1.5px] border-ink-200 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-ink-900 text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <Icon name="arrowRight" className="size-4" />
                </button>
              </form>
            )}

            {failed && (
              <p className="mt-2 text-[12.5px] leading-snug text-ink-900">
                No se pudo enviar. Tu mensaje sigue escrito arriba: vuelve a
                intentar.
              </p>
            )}

            {/* CE QUE CET ÉCRAN EST VRAIMENT. Tant que les reservas vivent
                dans le navigateur, le fil aussi : le conducteur ne le reçoit
                pas. Le taire ferait attendre une réponse qui ne viendra
                jamais. */}
            {transport === "local" && (
              <p className="mt-2 text-[12px] leading-snug text-ink-400">
                Demostración: este hilo se guarda en tu teléfono y {otherName}{" "}
                no lo recibe todavía.
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

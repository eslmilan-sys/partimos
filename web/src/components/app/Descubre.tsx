"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { GlassIcon, type GlassTone } from "@/components/ui/GlassIcon";

/**
 * TODO LO QUE NECESITAS PARA VIAJAR MEJOR — l'écran de découverte.
 *
 * C'est la seule page de l'app qui explique au lieu de servir, et elle a
 * une règle : chaque ligne décrit quelque chose qui EXISTE dans l'écran
 * d'à côté. Une page de promesses dans une app installée est la pire
 * espèce de remplissage — la personne a déjà installé, elle n'a plus
 * besoin d'être convaincue, elle a besoin de savoir quoi faire.
 *
 * D'où l'ordre : ce qu'on peut faire tout de suite d'abord, ce qui
 * rassure ensuite. Et chaque carte mène quelque part.
 */

/* LE TON DE VERRE de chaque carte. Il ne code aucune information — c'est
   de la variété, comme les six tuiles de la page d'accueil du site. On
   alterne pour que deux cartes voisines ne portent jamais le même
   rectangle : c'est ce qui empêche une liste d'icônes de ressembler à un
   tableau de bord. */
const COSAS: {
  icon: IconName;
  tono: GlassTone;
  titulo: string;
  texto: string;
  href: string;
  accion: string;
}[] = [
  {
    icon: "search",
    tono: "naranja",
    titulo: "Te recogen donde quieras",
    texto:
      "Escoges el punto exacto al reservar, o propones el tuyo si le queda de paso al conductor. Sin terminal y sin trasbordos.",
    href: "/",
    accion: "Buscar un viaje",
  },
  {
    icon: "cash",
    tono: "amber",
    titulo: "El aporte sale de los kilómetros",
    texto:
      "De la distancia, del carro y de los peajes, repartidos entre los ocupantes. No sube con la demanda, ni con la hora, ni con la fecha.",
    href: "/como-funciona",
    accion: "Ver cómo se calcula",
  },
  {
    icon: "phone",
    tono: "tostado",
    titulo: "Tres formas de pagar",
    texto:
      "Yappy o tarjeta dentro de la app, con comprobante y reembolso según las reglas de cancelación. O en la mano el día del viaje.",
    href: "/como-funciona",
    accion: "Ver las tres",
  },
  {
    icon: "id",
    tono: "green",
    titulo: "Sabes quién maneja",
    texto:
      "La cédula se verifica con un proveedor externo. En público solo se ve el nombre y la inicial del apellido — nunca el apellido completo.",
    href: "/cuenta/perfil",
    accion: "Verificar la mía",
  },
  {
    icon: "chat",
    tono: "teal",
    titulo: "El chat queda escrito",
    texto:
      "Coordinas la hora y el punto sin dar tu número. Ninguno de los dos puede cambiar un mensaje después de enviarlo.",
    href: "/cuenta/mensajes",
    accion: "Ver mis mensajes",
  },
  {
    icon: "shield",
    tono: "naranja",
    titulo: "Seguridad a un toque",
    texto:
      "Desde tu viaje del día llamas al 911 o compartes con quien tú quieras a dónde vas, con quién y a qué hora.",
    href: "/seguridad",
    accion: "Ver seguridad",
  },
];

export function Descubre() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-4">
      <p className="font-display text-[28px] leading-[1.08] font-extrabold tracking-[-0.035em]">
        Todo lo que necesitas
        <br />
        para <span className="text-naranja">viajar mejor</span>
      </p>
      <p className="mt-2 text-[13.5px] leading-snug text-ink-500">
        Seis cosas que ya funcionan en la app. Cada una lleva a donde se usa.
      </p>

      <ul className="mt-4 grid gap-2.5">
        {COSAS.map((c) => (
          <li key={c.titulo}>
            <Link
              href={c.href}
              className="block rounded-[18px] border border-ink-200 bg-white p-4 transition-colors hover:border-naranja"
            >
              <span className="flex items-center gap-3">
                <GlassIcon name={c.icon} tone={c.tono} size="sm" />
                <span className="min-w-0 flex-1 font-display text-[16px] leading-tight font-bold">
                  {c.titulo}
                </span>
              </span>
              <span className="mt-2 block text-[13.5px] leading-relaxed text-ink-600">
                {c.texto}
              </span>
              <span className="mt-2 flex items-center gap-1.5 text-[13.5px] font-semibold text-naranja">
                {c.accion}
                <Icon name="arrowRight" className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* CE QUE NOUS NE SOMMES PAS. Le dire ici, une fois, vaut mieux que
          de le laisser découvrir le jour d'un problème. */}
      <p className="mt-4 px-1 text-[12px] leading-snug text-ink-400">
        Partimos conecta a particulares que comparten los gastos de un viaje
        que el conductor ya iba a hacer. No es una empresa de transporte, no
        emplea conductores y no fija precios de pasaje.
      </p>
    </div>
  );
}

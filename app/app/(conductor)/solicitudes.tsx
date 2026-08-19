/**
 * `11a` Solicitudes de puesto — donde se cobra.
 *
 * Aceptar convierte la tarjeta en un recibo, descuenta el puesto y recuenta la
 * cabecera. Rechazar no pide motivo: la tarjeta desaparece. Una solicitud a
 * menos de una hora de caducar lleva la pastilla en rojo sólido; el resto, en
 * rojo pálido.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  type ResumenDeSolicitudes,
  aceptarSolicitud,
  listarSolicitudes,
  rechazarSolicitud,
} from '@/servicios/solicitudes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Boton, Epigrafe, Insignia } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Atras, Maleta, Pin, Visto } from '@/ui/iconos';
import { cuando } from '@/ui/fechas';
import { familia, color, espacio, radio, texto } from '@/ui/tokens';

const VIAJE = '55555555-5555-4555-8555-555555555555';

/** Lo que la pantalla recuerda de lo que acabas de aceptar, para el recibo. */
type Recibo = { nombre: string; aporteCentavos: number };

export default function Solicitudes() {
  const [datos, setDatos] = useState<ResumenDeSolicitudes | null>(null);
  const [recibos, setRecibos] = useState<Record<string, Recibo>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setDatos(await listarSolicitudes(VIAJE));
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!datos) return <View style={estilos.pantalla} />;

  const aceptar = async (id: string, nombre: string, aporteCentavos: number) => {
    setOcupado(id);
    try {
      await aceptarSolicitud(id);
      setRecibos((r) => ({ ...r, [id]: { nombre, aporteCentavos } }));
      await recargar();
    } finally {
      setOcupado(null);
    }
  };

  const rechazar = async (id: string) => {
    setOcupado(id);
    try {
      await rechazarSolicitud(id);
      await recargar();
    } finally {
      setOcupado(null);
    }
  };

  const aceptadas = Object.entries(recibos);
  const sinSolicitudes = datos.solicitudes.length === 0 && aceptadas.length === 0;
  // quien acaba de aceptarse ya se ve arriba como recibo: no se repite abajo
  const yaVanContigo = datos.confirmados.filter((c) => !recibos[c.reservaId]);

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <View style={estilos.circulo}>
            <Atras />
          </View>
          <Text style={estilos.epigrafeCampo}>
            {`${cuando(datos.viaje.salida)} · ${datos.viaje.origen} → ${datos.viaje.destino}`}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'Piden '}
          <Text style={texto.titularFuerte}>puesto</Text>
        </Text>
        <Text style={estilos.subtitulo}>{datos.texto}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 26 }}
        showsVerticalScrollIndicator={false}
      >
        {datos.solicitudes.map((s) => (
          <View key={s.id} style={estilos.tarjeta}>
            <View style={estilos.filaPersona}>
              <Avatar nombre={s.pasajero.nombre} tono={s.urgente ? 'rojo' : 'azul'} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.nombre}>{s.pasajero.nombre}</Text>
                <Text style={estilos.reputacion}>{s.pasajero.reputacion}</Text>
              </View>
              <View
                style={[
                  estilos.pastillaExpira,
                  { backgroundColor: s.urgente ? color.rojo500 : color.rojo100 },
                ]}
              >
                <Text
                  style={[
                    estilos.pastillaExpiraTexto,
                    { color: s.urgente ? color.blanco : color.rojo700 },
                  ]}
                >
                  {s.expiraEn}
                </Text>
              </View>
            </View>

            <View style={estilos.filaPunto}>
              <Pin />
              <Text style={estilos.punto} numberOfLines={1}>
                {s.punto}
              </Text>
              {s.minutosDeDesvio != null ? (
                <Text style={estilos.desvio}>{`+${s.minutosDeDesvio} min`}</Text>
              ) : null}
            </View>

            <View style={estilos.filaEquipaje}>
              <Maleta />
              <Text style={estilos.equipaje}>{s.equipaje}</Text>
              <Text style={estilos.aporte}>{formatearDineroRedondo(s.aporteCentavos)}</Text>
            </View>

            <View style={estilos.acciones}>
              <Boton
                tamano="md"
                ancho
                desactivado={ocupado === s.id}
                alPulsar={() => aceptar(s.id, s.pasajero.nombre, s.aporteCentavos)}
              >
                {`Aceptar · ${formatearDineroRedondo(s.aporteCentavos)}`}
              </Boton>
              <Boton
                tono="contorno"
                tamano="md"
                desactivado={ocupado === s.id}
                alPulsar={() => rechazar(s.id)}
              >
                No puedo
              </Boton>
            </View>
          </View>
        ))}

        {aceptadas.map(([id, r]) => (
          <View key={id} style={estilos.tarjeta}>
            <View style={estilos.filaPersona}>
              <Avatar nombre={r.nombre} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.nombre}>{r.nombre}</Text>
                <Text style={estilos.reputacion}>Confirmado</Text>
              </View>
            </View>
            <View style={estilos.recibo}>
              <View style={estilos.circuloVerde}>
                <Visto />
              </View>
              <Text style={estilos.reciboTexto}>
                {`Aceptado · le cobramos ${formatearDineroRedondo(r.aporteCentavos)}`}
              </Text>
              <Text style={estilos.escribir}>Escribir</Text>
            </View>
          </View>
        ))}

        {sinSolicitudes ? (
          <View style={estilos.vacio}>
            <Text style={estilos.vacioTexto}>
              Sin solicitudes por ahora. Te avisamos en cuanto alguien pida puesto.
            </Text>
          </View>
        ) : null}

        {yaVanContigo.length > 0 ? (
          <View style={estilos.seccionConfirmados}>
            <View style={{ marginBottom: 10 }}>
              <Epigrafe>Ya van contigo</Epigrafe>
            </View>
            {yaVanContigo.map((c) => (
              <View key={c.reservaId} style={estilos.filaConfirmado}>
                <Avatar nombre={c.nombre} tamano={36} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.nombreConfirmado}>{c.nombre}</Text>
                  <Text style={estilos.detalleConfirmado} numberOfLines={1}>
                    {`${c.punto} · ${c.equipaje}`}
                  </Text>
                </View>
                <Insignia
                  punto
                  fondo={c.pagado ? '#DFF1E8' : color.sand200}
                  tinta={c.pagado ? '#0E5A3F' : color.ink700}
                >
                  {c.pagado ? 'Pagado' : 'Paga al subir'}
                </Insignia>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto, flex: 1 },
  titular: { fontSize: 33, lineHeight: 34.65, letterSpacing: -1.32, fontWeight: '400', color: '#fff', marginTop: 12, fontFamily: familia },
  subtitulo: {
    fontSize: 14.5,
    lineHeight: 21,
    letterSpacing: -0.12,
    color: color.campoTexto,
    marginTop: 8,
    fontFamily: familia,
    ...tabular,
  },

  tarjeta: {
    marginHorizontal: 22,
    marginTop: 14,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    padding: 18,
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nombre: { fontSize: 16, lineHeight: 23.2, fontWeight: '500', letterSpacing: -0.32, color: color.ink900, fontFamily: familia },
  reputacion: { fontSize: 12.5, lineHeight: 18.12, color: color.ink600, marginTop: 1, fontFamily: familia, ...tabular },
  pastillaExpira: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radio.pastilla },
  pastillaExpiraTexto: { fontSize: 11, lineHeight: 15.95, fontWeight: '600', fontFamily: familia },

  filaPunto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  punto: { flex: 1, fontSize: 13.5, lineHeight: 19.57, fontWeight: '500', letterSpacing: -0.2, color: color.ink900, fontFamily: familia },
  desvio: { fontSize: 13.5, lineHeight: 19.57, color: color.ink500, fontFamily: familia, ...tabular },

  filaEquipaje: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  equipaje: { flex: 1, fontSize: 13.5, lineHeight: 19.57, color: color.ink700, fontFamily: familia },
  aporte: { fontSize: 19, lineHeight: 27.55, fontWeight: '700', letterSpacing: -0.67, color: color.ink900, fontFamily: familia, ...tabular },

  acciones: { flexDirection: 'row', gap: 9, marginTop: 15 },

  recibo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: color.sand100,
  },
  circuloVerde: {
    width: 22,
    height: 22,
    borderRadius: radio.pastilla,
    backgroundColor: color.verde500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reciboTexto: { flex: 1, fontSize: 13.5, lineHeight: 19.57, fontWeight: '500', letterSpacing: -0.2, color: color.ink900, fontFamily: familia },
  escribir: { fontSize: 12.5, lineHeight: 18.12, fontWeight: '600', color: color.azul700, fontFamily: familia },

  vacio: {
    marginHorizontal: 22,
    marginTop: 14,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    borderRadius: radio.l,
    padding: 20,
  },
  vacioTexto: { fontSize: 13.5, lineHeight: 20, color: color.ink600, fontFamily: familia },

  seccionConfirmados: { marginHorizontal: 22, marginTop: 16 },
  filaConfirmado: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nombreConfirmado: { fontSize: 14.5, lineHeight: 21.02, fontWeight: '500', letterSpacing: -0.22, color: color.ink900, fontFamily: familia },
  detalleConfirmado: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, marginTop: 1, fontFamily: familia },
});

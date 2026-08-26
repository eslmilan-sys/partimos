import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type Hechos,
  type ReservaAvisable,
  type ViajeAvisable,
  avisosDeLosHechos,
  cuandoDelViaje,
  yaEstaEscrito,
} from './avisar.ts';

/* Un mediodía cualquiera, en UTC. Panamá va cinco horas detrás. */
const AHORA = new Date('2026-08-26T17:00:00Z');
const dentroDe = (min: number) => new Date(AHORA.getTime() + min * 60_000).toISOString();

const VIAJE: ViajeAvisable = {
  id: 'v1',
  driver_id: 'andres',
  status: 'published',
  departure_at: dentroDe(60),
  origin_label: 'Albrook · bahía 4',
  destination_label: 'Chitré · parque Unión',
};

const RESERVA: ReservaAvisable = {
  id: 'r1',
  trip_id: 'v1',
  passenger_id: 'daniela',
  status: 'pending',
  seats: 1,
  unit_price_cents: 600,
  created_at: dentroDe(-30),
  confirmed_at: null,
  completed_at: null,
  cancelled_at: null,
  released_at: null,
  updated_at: dentroDe(-30),
};

const hechosCon = (r: Partial<ReservaAvisable>, v: Partial<ViajeAvisable> = {}): Hechos => ({
  reservas: [{ ...RESERVA, ...r }],
  viajes: [{ ...VIAJE, ...v }],
  nombreDe: (id) => (id === 'andres' ? 'Andrés M.' : 'Daniela L.'),
  yaCalifico: () => false,
  ahora: AHORA,
});

test('alguien pidió puesto: el conductor lo sabe, con la acción dentro', () => {
  const [aviso] = avisosDeLosHechos('andres', hechosCon({ status: 'pending' }));
  assert.equal(aviso.kind, 'solicitud_recibida');
  assert.equal(aviso.title, 'Daniela L. pidió puesto');
  assert.equal(aviso.action_route, '/(conductor)/solicitudes?viaje=v1');
  // el pasajero no recibe el eco de su propio acto
  const delPasajero = avisosDeLosHechos('daniela', hechosCon({ status: 'pending' }));
  assert.equal(delPasajero.filter((a) => a.kind === 'solicitud_recibida').length, 0);
});

test('el conductor aceptó: el pasajero recibe su código', () => {
  const avisos = avisosDeLosHechos(
    'daniela',
    hechosCon({ status: 'confirmed', confirmed_at: dentroDe(-10) }),
  );
  const aceptada = avisos.find((a) => a.kind === 'solicitud_aceptada');
  assert.ok(aceptada, 'falta el aviso de aceptación');
  assert.equal(aceptada.title, 'Andrés aceptó tu puesto'); // nombre corto: es una frase, no una ficha
  assert.equal(aceptada.action_route, '/(pasajero)/codigo?reserva=r1');
});

test('el conductor no puede: el pasajero recibe la puerta de buscar otro', () => {
  const [aviso] = avisosDeLosHechos(
    'daniela',
    hechosCon({ status: 'cancelled_driver', cancelled_at: dentroDe(-5) }),
  );
  assert.equal(aviso.kind, 'viaje_cancelado');
  assert.equal(aviso.title, 'Andrés no puede llevarte');
  assert.equal(aviso.action_label, 'Buscar otro');
});

test('viaje hecho y sin calificar: se pide una vez, y calificado ya no', () => {
  const hechos = hechosCon({ status: 'completed', completed_at: dentroDe(-100) });
  const [aviso] = avisosDeLosHechos('daniela', hechos);
  assert.equal(aviso.kind, 'califica_tu');
  assert.equal(aviso.title, 'Califica a Andrés M.');

  const yaCalificado = { ...hechos, yaCalifico: () => true };
  assert.equal(avisosDeLosHechos('daniela', yaCalificado).length, 0);
});

test('el aporte liberado avisa al conductor con la cifra en balboas', () => {
  const avisos = avisosDeLosHechos(
    'andres',
    hechosCon({ status: 'completed', released_at: dentroDe(-1), unit_price_cents: 650 }),
  );
  const aporte = avisos.find((a) => a.kind === 'aporte_recibido');
  assert.ok(aporte, 'falta el aviso del aporte');
  assert.equal(aporte.title, 'Te aportaron B/6.50');
});

test('el recordatorio existe desde 24 h antes, y ni antes ni después de salir', () => {
  const confirmada = { status: 'confirmed' as const, confirmed_at: dentroDe(-2000) };

  // a una hora de salir: «Sales pronto»
  const pronto = avisosDeLosHechos('daniela', hechosCon(confirmada));
  const aviso = pronto.find((a) => a.kind === 'sales_pronto');
  assert.ok(aviso, 'falta el recordatorio');
  assert.equal(aviso.title, 'Sales pronto');
  assert.equal(aviso.action_route, '/(pasajero)/viaje?viaje=v1');

  // a tres días: todavía no existe
  const lejos = avisosDeLosHechos(
    'daniela',
    hechosCon(confirmada, { departure_at: dentroDe(3 * 1440) }),
  );
  assert.equal(lejos.filter((a) => a.kind === 'sales_pronto').length, 0);

  // ya salió: tampoco
  const pasado = avisosDeLosHechos(
    'daniela',
    hechosCon(confirmada, { departure_at: dentroDe(-10) }),
  );
  assert.equal(pasado.filter((a) => a.kind === 'sales_pronto').length, 0);
});

test('«mañana» solo se dice cuando la salida cae en otro día de Panamá', () => {
  const confirmada = { status: 'confirmed' as const, confirmed_at: dentroDe(-2000) };

  // Son las 12:00 en Panamá; salir a las 20:00 del mismo día es «hoy».
  const hoy = avisosDeLosHechos('daniela', hechosCon(confirmada, { departure_at: dentroDe(8 * 60) }));
  assert.equal(hoy.find((a) => a.kind === 'sales_pronto')?.title, 'Hoy viajas');

  // Salir en 20 horas cruza la medianoche: «mañana».
  const manana = avisosDeLosHechos(
    'daniela',
    hechosCon(confirmada, { departure_at: dentroDe(20 * 60) }),
  );
  assert.equal(manana.find((a) => a.kind === 'sales_pronto')?.title, 'Mañana viajas');
});

test('al conductor se le recuerda solo si alguien va con él', () => {
  const conGente = avisosDeLosHechos(
    'andres',
    hechosCon({ status: 'confirmed', confirmed_at: dentroDe(-500) }),
  );
  const aviso = conGente.find((a) => a.kind === 'sales_pronto');
  assert.ok(aviso, 'falta el recordatorio del conductor');
  assert.equal(aviso.body.startsWith('1 persona va contigo'), true, aviso.body);

  // sin reservas confirmadas, no hay cita que recordar
  const solo = avisosDeLosHechos('andres', hechosCon({ status: 'pending' }));
  assert.equal(solo.filter((a) => a.kind === 'sales_pronto').length, 0);
});

test('la segunda línea dice hora de Panamá y los lugares sin su detalle', () => {
  const texto = cuandoDelViaje({ ...VIAJE, departure_at: '2026-08-26T18:00:00Z' });
  assert.equal(texto, '13:00 · Albrook → Chitré');
});

test('una fila escrita por la base suprime el derivado del mismo hecho', () => {
  const [derivado] = avisosDeLosHechos('andres', hechosCon({ status: 'pending' }));
  assert.equal(
    yaEstaEscrito(derivado, [{ kind: 'solicitud_recibida', booking_id: 'r1', trip_id: 'v1' }]),
    true,
  );
  // otro hecho sobre la misma reserva no lo suprime
  assert.equal(
    yaEstaEscrito(derivado, [{ kind: 'solicitud_aceptada', booking_id: 'r1', trip_id: 'v1' }]),
    false,
  );
});

test('los avisos salen del más nuevo al más viejo', () => {
  const hechos: Hechos = {
    reservas: [
      { ...RESERVA, id: 'r1', created_at: dentroDe(-300), updated_at: dentroDe(-300) },
      { ...RESERVA, id: 'r2', passenger_id: 'otra', created_at: dentroDe(-5), updated_at: dentroDe(-5) },
    ],
    viajes: [VIAJE],
    nombreDe: () => 'Alguien',
    yaCalifico: () => false,
    ahora: AHORA,
  };
  const avisos = avisosDeLosHechos('andres', hechos);
  assert.deepEqual(
    avisos.map((a) => a.id),
    ['av-pidio-r2', 'av-pidio-r1'],
  );
});

-- 0014 — LAS 32 CIUDADES QUE LA APP SIRVE DE VERDAD
--
-- `0001_schema.sql` sembró siete ciudades: las del primer corredor. La
-- app creció a 32 (src/lib/corridors.ts) y arma rutas entre cualquier
-- par de ellas. La base tiene que conocerlas, si no la tabla `places`
-- rechaza todo lo que no sea una de las siete originales — y el
-- importador de OpenStreetMap se queda a medias.
--
-- Coordenadas: las mismas del catálogo de la app, ninguna inventada.
-- `on conflict do nothing` deja intactas las siete que ya existen.

insert into cities (country_code, name, slug, province, lat, lng) values
  ('PA','Ciudad de Panamá','panama-city','Panamá',8.9824,-79.5199),
  ('PA','Chitré','chitre','Herrera',7.9614,-80.4297),
  ('PA','Las Tablas','las-tablas','Los Santos',7.7667,-80.2833),
  ('PA','David','david','Chiriquí',8.4333,-82.4333),
  ('PA','Santiago','santiago','Veraguas',8.1,-80.9833),
  ('PA','Penonomé','penonome','Coclé',8.5194,-80.3572),
  ('PA','Coronado','coronado','Panamá Oeste',8.5333,-79.95),
  ('PA','La Chorrera','la-chorrera','Panamá Oeste',8.8803,-79.7833),
  ('PA','Arraiján','arraijan','Panamá Oeste',8.9553,-79.6633),
  ('PA','Capira','capira','Panamá Oeste',8.7592,-79.8825),
  ('PA','Chame','chame','Panamá Oeste',8.5762,-79.8879),
  ('PA','San Carlos','san-carlos','Panamá Oeste',8.4726,-79.9575),
  ('PA','Río Hato','rio-hato','Coclé',8.3781,-80.1672),
  ('PA','Antón','anton','Coclé',8.3925,-80.2603),
  ('PA','Natá','nata','Coclé',8.3333,-80.5167),
  ('PA','Aguadulce','aguadulce','Coclé',8.2422,-80.5442),
  ('PA','El Valle de Antón','el-valle','Coclé',8.6,-80.1272),
  ('PA','Parita','parita','Herrera',8.0011,-80.5217),
  ('PA','La Villa de Los Santos','los-santos','Los Santos',7.9358,-80.4194),
  ('PA','Guararé','guarare','Los Santos',7.8158,-80.2847),
  ('PA','Pedasí','pedasi','Los Santos',7.5289,-80.0247),
  ('PA','Soná','sona','Veraguas',8.0119,-81.3211),
  ('PA','Tolé','tole','Chiriquí',8.2333,-81.6667),
  ('PA','Las Lajas','las-lajas','Chiriquí',8.2436,-81.8703),
  ('PA','La Concepción (Bugaba)','la-concepcion','Chiriquí',8.5121,-82.6194),
  ('PA','Paso Canoas','paso-canoas','Chiriquí',8.5333,-82.8383),
  ('PA','Boquete','boquete','Chiriquí',8.7803,-82.4408),
  ('PA','Volcán','volcan','Chiriquí',8.7681,-82.6394),
  ('PA','Colón','colon','Colón',9.3592,-79.9014),
  ('PA','Chepo','chepo','Panamá Este',9.1706,-79.1017),
  ('PA','Almirante','almirante','Bocas del Toro',9.3,-82.4028),
  ('PA','Changuinola','changuinola','Bocas del Toro',9.4319,-82.5182)
on conflict (country_code, slug) do nothing;

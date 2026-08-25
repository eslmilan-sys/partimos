-- =====================================================================
--  MIGRATION 0038 — La foto del carro tiene dónde vivir.
--
--  La pantalla de registrar el carro toma una foto de verdad desde el
--  25-08 (antes el botón escribía un camino fijo sin tomar nada). La
--  imagen llega ya reducida —1280 px, JPEG— y necesita un bucket.
--
--  DECISIONES:
--
--  · El bucket es PÚBLICO en lectura. La foto del carro por detrás existe
--    para que el pasajero lo reconozca en la terminal: es información que
--    se enseña, no que se protege. Lo sensible —el número entero de la
--    placa— NO está en la base (vehicles guarda plate_last3); está en la
--    foto porque ese es su trabajo.
--
--  · Escribir solo puede el dueño y solo en SU carpeta: el primer tramo
--    del camino tiene que ser su auth.uid(). Así nadie sube a nombre de
--    otro ni pisa lo ajeno, con una sola condición.
--
--  · 3 MB de techo y solo imágenes. La app sube ~150 KB; el límite es la
--    red de seguridad contra un cliente que no reduzca.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('carros', 'carros', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Subir: el dueño, a su carpeta. `storage.foldername('a/b.jpg')` es `{a}`.
create policy carros_sube_el_dueno on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'carros'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reemplazar y borrar: mismo dueño, misma carpeta.
create policy carros_cambia_el_dueno on storage.objects
  for update to authenticated
  using (
    bucket_id = 'carros'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy carros_borra_el_dueno on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'carros'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Leer: cualquiera. El bucket ya sirve por URL pública; esta política deja
-- además listar y descargar por la API con la llave publicable.
create policy carros_se_ven on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'carros');

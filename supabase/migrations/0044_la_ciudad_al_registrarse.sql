-- =====================================================================
--  MIGRACIÓN 0044 — La ciudad, desde el momento de abrir la cuenta.
--
--  Pedido del dueño (27-08-2026): «à l'inscription, important de demander
--  où habite le client, comme ça on lui propose dans la home page des
--  voyages partant de cette ville».
--
--  QUÉ HABÍA. `profiles.home_city_id` existía desde el principio y no la
--  escribía nadie. El 27-08 se empezó a preguntar desde el inicio, con
--  una tarjeta. Eso sigue —hace falta para quien entra con Google o
--  Facebook, que no pasa por el formulario— pero llegaba tarde: la
--  primera pantalla que ve alguien recién registrado ya podía estar
--  enseñándole salidas desde su ciudad, y le enseñaba las de la capital.
--
--  QUÉ SE HACE. El formulario manda la ciudad en `options.data`, igual
--  que ya manda el nombre, y el disparador la escribe al crear el perfil.
--  Un solo viaje: no hace falta que el cliente se acuerde de guardar nada
--  después, ni que haya sesión abierta —con la confirmación por correo
--  todavía no la hay— para que el dato quede puesto.
--
--  LO QUE NO SE HACE. **Creerse el identificador.** Llega del cliente, y
--  un `uuid` cualquiera dejaría el perfil apuntando a una ciudad que no
--  existe. Se comprueba contra `cities`; si no está, se queda nulo y la
--  tarjeta del inicio lo volverá a preguntar. Un dato malo es peor que
--  ninguno: con nulo la app sabe que no sabe.
-- =====================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nombre text;
  apellido text;
  ciudad uuid;
begin
  nombre := nullif(trim(coalesce(
    meta ->> 'first_name',
    meta ->> 'name',
    meta ->> 'full_name'
  )), '');
  -- «ana.moreno@gmail.com» → «Ana». Mejor que un campo vacío, y la
  -- persona lo corrige en su cuenta cuando quiera.
  if nombre is null and new.email is not null then
    nombre := initcap(split_part(split_part(new.email, '@', 1), '.', 1));
  end if;
  nombre := coalesce(nullif(nombre, ''), 'Viajero');
  -- Si vino un nombre completo, la primera palabra es el nombre.
  if position(' ' in nombre) > 0 then
    apellido := split_part(nombre, ' ', 2);
    nombre := split_part(nombre, ' ', 1);
  end if;
  apellido := coalesce(nullif(trim(coalesce(meta ->> 'last_name', apellido)), ''), '');

  /* La ciudad de casa (0044). Se comprueba: el identificador viene del
     cliente y un `uuid` inventado dejaría el perfil apuntando a una ciudad
     que no existe. Si no casa, nulo — y el inicio la volverá a preguntar.
     El `exception` cubre el texto que ni siquiera es un uuid. */
  begin
    select c.id into ciudad
      from cities c
     where c.id = nullif(meta ->> 'home_city_id', '')::uuid;
  exception when invalid_text_representation then
    ciudad := null;
  end;

  insert into profiles (id, first_name, last_initial, phone, is_phone_verified, locale, home_city_id)
  values (
    new.id,
    nombre,
    nullif(upper(left(apellido, 1)), ''),
    new.phone,
    new.phone is not null,
    coalesce(nullif(meta ->> 'locale', ''), 'es'),
    ciudad
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- El disparador ya existe desde la 0017 y apunta a esta misma función,
-- así que no hace falta recrearlo: `create or replace` basta. Se rehace
-- de todas formas por si esta migración corre sobre una base donde la
-- 0017 se aplicó a medias.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

revoke execute on function handle_new_user() from anon, authenticated;

comment on function handle_new_user() is
  'Crea la fila de profiles al registrarse. Nombre y ciudad desde options.data; la ciudad se comprueba contra `cities`. Nunca inventa apellido.';

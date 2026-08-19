-- 0017 — EL PERFIL NACE CON LA CUENTA
--
-- `profiles` no tiene política de INSERT, y es a propósito: nadie crea un
-- perfil desde el navegador. Pero entonces, al registrarse, la persona
-- quedaba con una cuenta en `auth.users` y NADA en `profiles` — y como
-- casi todo el esquema cuelga de `profiles` (viajes, reservas, la
-- verificación de cédula), la app se habría quedado muda con un usuario
-- que sí existe.
--
-- El disparador lo resuelve del lado correcto: en la base, en el mismo
-- instante, sin que el cliente tenga que acordarse de nada ni pueda
-- inventarse un perfil ajeno.
--
-- El nombre viene de lo que la persona escribió en el formulario
-- (`options.data` al pedir el código). Si falta —OAuth de Google, por
-- ejemplo— se cae hacia el nombre de la cuenta, y en último caso a
-- «Viajero», porque `first_name` no admite nulos. Nunca se inventa un
-- apellido: solo la inicial, y solo si la dio.

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

  insert into profiles (id, first_name, last_initial, phone, is_phone_verified, locale)
  values (
    new.id,
    nombre,
    nullif(upper(left(apellido, 1)), ''),
    new.phone,
    new.phone is not null,
    coalesce(nullif(meta ->> 'locale', ''), 'es')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Un perfil se lee y se corrige solo por su dueño (esas políticas ya
-- existen). Crear, solo el disparador. Revocamos la ejecución pública de
-- la función: no es una RPC.
revoke execute on function handle_new_user() from anon, authenticated;

comment on function handle_new_user() is
  'Crea la fila de profiles al registrarse. Nombre desde options.data del OTP, o desde el correo. Nunca inventa apellido.';

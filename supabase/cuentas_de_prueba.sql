-- CUENTAS DE PRUEBA — para que unos colegas entren sin registrarse.
--
-- Por qué hace falta este archivo: las cuatro cuentas demo de `siembra.sql`
-- (andres@, carla@, jose@, yaris@) **no se puede entrar con ellas**. Se
-- insertaron directas en `auth.users` para que las claves foráneas de los
-- viajes apuntaran a alguien, sin contraseña y sin fila en `auth.identities`.
-- Medido: `encrypted_password` vacío, 0 identidades. GoTrue necesita las dos
-- cosas para dejar entrar con correo y contraseña.
--
-- Esto crea dos cuentas de verdad:
--
--   test@partimos.app        pasajera — buscar, pedir puesto, pagar, calificar
--   conductor@partimos.app   conductor — con carro y cédula verificada,
--                            que es lo que `prepararPublicacion` y
--                            `puedePublicar` exigen para dejar publicar
--
-- LA CONTRASEÑA NO SE ESCRIBE AQUÍ. Este repositorio es público y la base es
-- la de verdad; una contraseña en claro aquí es una puerta abierta indexada
-- por Google. Se pasa al ejecutar:
--
--   psql ... -v clave="'la-que-sea'" -f cuentas_de_prueba.sql
--
-- Mínimo 6 caracteres: lo exige `contrasenaValida` en `servicios/cuenta.ts` y
-- también Supabase por defecto. «test» a secas no vale.
--
-- PARA BORRARLAS cuando termine la ronda de pruebas — se lleva por delante sus
-- perfiles, carros, reservas y verificaciones por cascada:
--
--   delete from auth.users where email in ('test@partimos.app','conductor@partimos.app');

\set ON_ERROR_STOP on

do $$
declare
  v_pas uuid := gen_random_uuid();
  v_con uuid := gen_random_uuid();
  v_clave text := :'clave';
begin
  if length(v_clave) < 6 then
    raise exception 'La contraseña necesita 6 caracteres o más (cuenta.ts:LARGO_MINIMO)';
  end if;

  /* ── La pasajera ─────────────────────────────────────────────────────── */
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (
    '00000000-0000-0000-0000-000000000000', v_pas, 'authenticated', 'authenticated',
    'test@partimos.app', crypt(v_clave, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    /* El disparador `handle_new_user` (0017) lee estas dos claves para
       escribir el perfil, así que el nombre llega solo. */
    jsonb_build_object('first_name','Test','last_name','Pasajera',
                       'email','test@partimos.app','email_verified',true),
    now(), now());

  /* Sin esta fila no se puede entrar, por muy buena que sea la contraseña. */
  insert into auth.identities (provider_id, user_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  values (v_pas::text, v_pas,
    jsonb_build_object('sub', v_pas::text, 'email','test@partimos.app','email_verified',true),
    'email', now(), now(), now());

  /* ── El conductor ────────────────────────────────────────────────────── */
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (
    '00000000-0000-0000-0000-000000000000', v_con, 'authenticated', 'authenticated',
    'conductor@partimos.app', crypt(v_clave, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name','Test','last_name','Conductor',
                       'email','conductor@partimos.app','email_verified',true),
    now(), now());

  insert into auth.identities (provider_id, user_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  values (v_con::text, v_con,
    jsonb_build_object('sub', v_con::text, 'email','conductor@partimos.app','email_verified',true),
    'email', now(), now(), now());

  /* Un sedán estándar. 8 L/100 km es el consumo con el que el traspaso saca
     los 6,00 $ de Panamá → Chitré; con otro carro el aporte sale distinto y
     las capturas del diseño dejan de cuadrar. */
  insert into vehicles (owner_id, category_code, make, model, color, year,
                        seats_total, plate_last3, is_active, consumption_l_100km)
  values (v_con, 'standard', 'Hyundai', 'Elantra', 'Gris', 2019, 5, '482', true, 8.0);

  /* Cédula verificada: `estadoDeCedula(...).puedePublicar` es falso sin ella y
     publicar se queda cerrado. Solo el veredicto y la referencia — ni la
     imagen ni el número, que es la R6. */
  insert into identity_verifications (profile_id, provider, provider_ref, status,
                                      document_country, document_type, verified_at)
  values (v_con, 'didit', 'ver_prueba', 'verified', 'PA', 'cedula', now());
end $$;

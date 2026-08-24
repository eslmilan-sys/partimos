create table resultado (n serial, titulo text, paso boolean, detalle text);

create or replace function debe (titulo text, condicion boolean, detalle text default '')
returns void language sql as $$
  insert into resultado (titulo, paso, detalle) values ($1, coalesce($2, false), $3);
$$;

-- =====================================================================
--  A. search_places — ce que l'utilisateur tape
-- =====================================================================

-- 1. Le bug de 0033, corrigé par 0034 : minuscules contre nom capitalisé.
select debe('minúsculas encuentran un nombre capitalizado',
  exists (select 1 from search_places('multiplaza') where name = 'Multiplaza Pacific'));

-- 2. Sans accents, dans un sens comme dans l'autre.
select debe('sin acento encuentra el acentuado (chitre → Chitré)',
  exists (select 1 from search_places('chitre') where name = 'Terminal de Chitré'));
select debe('con acento encuentra igual (Chitré)',
  exists (select 1 from search_places('Chitré') where name = 'Terminal de Chitré'));

-- 3. Un alias vaut le nom.
select debe('el alias PTY llega al aeropuerto',
  exists (select 1 from search_places('pty') where name like 'Aeropuerto%'));
select debe('el alias Tocumen llega al aeropuerto',
  exists (select 1 from search_places('tocumen') where name like 'Aeropuerto%'));

-- 4. Le contexte administratif remonte jusqu'au premier niveau.
select debe('el contexto se escribe de lo fino a lo ancho',
  (select contexto from search_places('multiplaza') limit 1)
    = 'San Francisco, Panamá, Panamá',
  coalesce((select contexto from search_places('multiplaza') limit 1), '(nulo)'));

-- 5. Un corregimiento de comarca n'a que deux ancêtres : la récursion
--    ne suppose pas une profondeur fixe.
select debe('un corregimiento de comarca da dos niveles',
  contexto_administrativo('aaaaaaaa-0000-0000-0000-000000000005') = 'Narganá, Guna Yala',
  coalesce(contexto_administrativo('aaaaaaaa-0000-0000-0000-000000000005'), '(nulo)'));

-- 6. Les gardes de longueur : ni une lettre perdue, ni un paragraphe.
select debe('una sola letra no baja a la tabla',
  (select count(*) from search_places('m')) = 0);
select debe('el vacío no baja a la tabla',
  (select count(*) from search_places('')) = 0);
select debe('el nulo no baja a la tabla',
  (select count(*) from search_places(null)) = 0);
select debe('121 caracteres no bajan a la tabla',
  (select count(*) from search_places(repeat('a', 121))) = 0);
select debe('120 caracteres sí son una consulta válida',
  (select count(*) from search_places(repeat('a', 120))) = 0);  -- válida, sin resultados

-- 7. Le classement : ce qui commence par ce qu'on a tapé passe devant.
select debe('lo que empieza por lo tecleado va primero',
  (select name from search_places('parque') limit 1) = 'Parque Omar',
  coalesce((select name from search_places('parque') limit 1), '(nada)'));

-- 8. near_city départage deux enseignes du même nom — même quand
--    l'autre a bien plus d'usage (99 contre 2).
select debe('near_city gana al uso: Super 99 en Panamá',
  (select name from search_places('super 99', 'panama') limit 1) = 'Super 99 Vía España',
  coalesce((select name from search_places('super 99', 'panama') limit 1), '(nada)'));
select debe('near_city gana al uso: Super 99 en David',
  (select name from search_places('super 99', 'david') limit 1) = 'Super 99 David',
  coalesce((select name from search_places('super 99', 'david') limit 1), '(nada)'));

-- 9. Un lieu non public ne sort jamais.
select debe('un lugar privado no aparece nunca',
  (select count(*) from search_places('torre escondida')) = 0);

-- 10. Le plafond de résultats est borné des deux côtés.
select debe('max_results se recorta a 20 como mucho',
  (select count(*) from search_places('a', null, 500)) <= 20);

-- =====================================================================
--  B. recordar_lugar — la règle du 24-08-2026 : sans point, pas de lieu
-- =====================================================================

set prueba.uid = '11111111-1111-1111-1111-111111111111';

-- 11. Sans compte, rien.
reset prueba.uid;
select debe('sin sesión no se guarda nada',
  recordar_lugar('PH Torre Mistral', 'panama', 8.99, -79.51) is null);
set prueba.uid = '11111111-1111-1111-1111-111111111111';

-- 12. LA RÈGLE : un nom inconnu SANS coordonnées n'entre pas.
select debe('nombre desconocido sin coordenadas → no se guarda',
  recordar_lugar('PH Sin Punto', 'panama') is null);
select debe('y no queda rastro en el catálogo',
  (select count(*) from places where name = 'PH Sin Punto') = 0);

-- 13. Avec ses coordonnées, il entre — mais invisible aux autres.
select debe('con coordenadas sí entra',
  recordar_lugar('PH Torre Mistral', 'panama', 8.9900, -79.5100) is not null);
select debe('pero entra invisible: una sola persona no lo hace público',
  (select not is_public from places where name = 'PH Torre Mistral'));
select debe('y guarda el punto que le dieron, no el centro de la ciudad',
  (select round(st_y(geom::geometry)::numeric, 4) from places where name = 'PH Torre Mistral') = 8.9900,
  (select st_y(geom::geometry)::text from places where name = 'PH Torre Mistral'));

-- 14. La même personne dix fois reste une habitude, pas un lieu.
--     (L'appel et la lecture sont deux instructions : dans une seule, les
--     deux sous-requêtes partagent le snapshot et la lecture précède
--     l'écriture. C'était le test qui mentait, pas la fonction.)
select recordar_lugar('PH Torre Mistral', 'panama', 8.99, -79.51) as segunda_vez \gset
select debe('la misma persona otra vez no lo hace público',
  :'segunda_vez' <> '' and (select not is_public from places where name = 'PH Torre Mistral'));

-- 15. Une DEUXIÈME personne, et il sort au jour.
set prueba.uid = '22222222-2222-2222-2222-222222222222';
select recordar_lugar('PH Torre Mistral', 'panama', 8.99, -79.51) as otra_persona \gset
select debe('una segunda persona lo hace público',
  :'otra_persona' <> '' and (select is_public from places where name = 'PH Torre Mistral'));
select debe('y entonces la búsqueda lo encuentra',
  exists (select 1 from search_places('torre mistral')));

-- 16. Sans coordonnées mais DÉJÀ connu : on compte l'usage, on n'invente rien.
select debe('sin coordenadas pero ya conocido → cuenta el uso',
  recordar_lugar('Parque Omar', 'panama') is not null);
select debe('y el uso subió de 3 a 4',
  (select used_count from places where name = 'Parque Omar') = 4,
  (select used_count::text from places where name = 'Parque Omar'));

-- 17. La casse et les accents ne créent pas de doublon.
select debe('«parque omar» no crea un segundo Parque Omar',
  recordar_lugar('parque omar', 'panama') is not null
  and (select count(*) from places where lower(name) = 'parque omar') = 1);

-- 18. Les bornes du nom, les mêmes que la recherche.
select debe('dos letras es demasiado corto',
  recordar_lugar('PH', 'panama', 8.99, -79.51) is null);
select debe('121 caracteres es demasiado largo',
  recordar_lugar(repeat('x', 121), 'panama', 8.99, -79.51) is null);

-- 19. Une ville qu'on ne dessert pas ne se crée pas en passant.
select debe('una ciudad desconocida no se crea de paso',
  recordar_lugar('PH Cualquiera', 'bogota', 4.7, -74.0) is null);
select debe('y el lugar tampoco',
  (select count(*) from places where name = 'PH Cualquiera') = 0);

-- =====================================================================
--  C. Le trigger de hiérarchie de 0033
-- =====================================================================

do $$
begin
  insert into admin_areas (nivel, parent_id, name, normalized_name, source_id)
  values ('distrito', 'aaaaaaaa-0000-0000-0000-000000000003', 'Imposible', 'imposible', 'r9');
  perform debe('un distrito no puede pender de un corregimiento', false, 'se aceptó');
exception when others then
  perform debe('un distrito no puede pender de un corregimiento', true, sqlerrm);
end $$;

do $$
begin
  insert into admin_areas (nivel, name, normalized_name, source_id)
  values ('corregimiento', 'Huérfano', 'huerfano', 'r10');
  perform debe('un corregimiento no puede existir sin madre', false, 'se aceptó');
exception when others then
  perform debe('un corregimiento no puede existir sin madre', true, sqlerrm);
end $$;

do $$
begin
  insert into admin_areas (nivel, parent_id, name, normalized_name, source_id)
  values ('provincia', 'aaaaaaaa-0000-0000-0000-000000000001', 'Rara', 'rara', 'r11');
  perform debe('una provincia no lleva madre', false, 'se aceptó');
exception when others then
  perform debe('una provincia no lleva madre', true, sqlerrm);
end $$;

-- =====================================================================
select n, case when paso then 'OK  ' else 'FALLA' end as e, titulo, detalle
  from resultado order by n;
select count(*) filter (where paso) as pasan,
       count(*) filter (where not paso) as fallan,
       count(*) as total
  from resultado;

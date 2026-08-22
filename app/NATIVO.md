# La app en el teléfono — iOS y Android

Es el **mismo código** que el sitio: un solo proyecto Expo que compila a tres
sitios. Nada se reescribe para el teléfono, y por eso lo que se revisa aquí es
lo que corre allá.

## Cómo sacar una versión instalable

La compilación nativa la hace **EAS Build**, en los servidores de Expo. No hace
falta ni Xcode ni Android Studio en la máquina: hace falta una cuenta.

```bash
cd app
npm install
npx eas login          # cuenta de Expo, gratis
npx eas build -p android --profile revision
```

Al terminar, EAS devuelve un enlace con un **APK** que se instala en cualquier
Android. Eso es lo que se le manda a alguien para que pruebe. Tarda unos quince
minutos la primera vez.

Para iOS es igual pero **hace falta una cuenta de Apple Developer** (99 USD al
año): sin ella Apple no firma nada instalable en un teléfono real.

```bash
npx eas build -p ios --profile prueba      # se reparte por TestFlight
npx eas build -p ios --profile revision    # simulador, solo en un Mac
```

## Los tres perfiles, y por qué

| Perfil | Para qué | Datos |
|---|---|---|
| `revision` | Que alguien revise la app —seguridad, diseño, pruebas— | **Simulados.** No toca Supabase, no hay ni una persona real |
| `prueba` | Prueba cerrada con gente de verdad | Reales |
| `tiendas` | App Store y Google Play | Reales |

`revision` existe precisamente para una auditoría: la app entera funciona, se
navega completa, y no hay un solo dato de una persona real adentro. Es lo que
se entrega a quien la va a revisar.

Los perfiles reales necesitan las llaves en secretos de EAS, nunca en el
repositorio:

```bash
npx eas secret:create --name EXPO_PUBLIC_SUPABASE_URL   --value ...
npx eas secret:create --name EXPO_PUBLIC_SUPABASE_LLAVE --value ...
```

Son llaves **publicables** —van dentro del paquete que se descarga— y lo que
protege los datos son las políticas RLS, no el secreto de esa cadena. La llave
`service_role` no entra aquí jamás.

## Lo que ya quedó resuelto para el teléfono

- **La sesión vive en el llavero del sistema** (Keychain en iOS, Keystore en
  Android), no en AsyncStorage, que guarda texto plano en el disco. El llavero
  admite 2048 bytes por valor y la sesión de Supabase pasa de eso, así que se
  parte en trozos de 500 caracteres: `src/servicios/_fuente/supabase/almacen.ts`,
  con sus pruebas al lado.
- **Identificadores de paquete** — `com.partimos.app` en las dos plataformas.
  Sin ellos no existe compilación posible.
- **Ubicación solo en primer plano.** `ACCESS_BACKGROUND_LOCATION` está
  explícitamente bloqueado en `app.json`, y cada permiso lleva escrito en
  español para qué se pide.
- **Enlaces de la app verificados por dominio** (App Links) en vez de confiar
  en el esquema `partimos://`, que en Android cualquier otra app puede reclamar
  para interceptar el retorno del inicio de sesión.

## Lo que falta, y es de quien tenga las cuentas

- **La huella del certificado de firma.** Los App Links solo quedan verificados
  cuando `https://eslmilan-sys.github.io/.well-known/assetlinks.json` publica el
  SHA-256 de la llave de firma — que no existe hasta la primera compilación.
  Después de esa compilación: `npx eas credentials` da la huella.
- **Actualizaciones por aire.** Expo permite empujar código nuevo a todos los
  teléfonos sin pasar por revisión de Apple ni de Google. Es el punto de cadena
  de suministro del proyecto: esa cuenta va con doble factor y nadie publica
  desde su portátil — sale de CI o no sale.
- **Las cuentas de tienda**: Apple Developer y Google Play Console, con las
  declaraciones de privacidad (App Privacy y Data Safety) que deben coincidir
  exactamente con lo que se recolecta.

## Mientras tanto, sin instalar nada

La misma app corre en el navegador y está publicada:
**https://eslmilan-sys.github.io/partimos/app/** — y el código completo está en
este repositorio, que es público. Para una revisión de seguridad las dos cosas
sirven desde ya, sin esperar a ninguna cuenta de tienda.

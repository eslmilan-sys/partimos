import type { Metadata } from "next";
import { LegalPage, PendingLegalReview } from "@/components/site/LegalPage";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Qué datos guarda Partimos, cuáles no guarda —imágenes de cédula, números de documento, datos bancarios— y cómo pedir que se borren.",
  alternates: { canonical: canonical("/privacidad") },
};

export default function PrivacidadPage() {
  return (
    <LegalPage
      title="Aviso de privacidad"
      updatedAt="agosto 2026"
      intro="Qué guardamos, qué deliberadamente no guardamos y cómo pedir que se borre."
    >
      <PendingLegalReview />

      <h2>1. Qué datos guardamos</h2>
      <ul>
        <li>
          <b>De tu cuenta:</b> nombre, inicial del apellido, número de celular,
          foto de perfil si la subes, ciudad de residencia y el idioma de la
          app.
        </li>
        <li>
          <b>De tus viajes:</b> las rutas que buscaste, las que reservaste, los
          puntos de recogida elegidos y las calificaciones que diste y
          recibiste.
        </li>
        <li>
          <b>De la verificación de identidad:</b> únicamente si pasó o no, la
          fecha, y una referencia del expediente en el proveedor externo.
        </li>
        <li>
          <b>De los mensajes:</b> las conversaciones dentro de la app asociadas
          a una reserva.
        </li>
      </ul>

      <h2>2. Qué no guardamos</h2>
      <ul>
        <li>
          <b>Imágenes de cédula ni números de documento.</b> La verificación la
          hace un proveedor certificado y nosotros recibimos solo el resultado.
        </li>
        <li>
          <b>Números de tarjeta.</b> Si pagas en la app, la tarjeta la procesa
          una pasarela de pago certificada y nunca llega a nuestros servidores.
          Nosotros guardamos solo el estado del cobro y su referencia.
        </li>
        <li>
          <b>Tu ubicación en segundo plano.</b> Solo se comparte cuando tú
          activas «compartir mi viaje», y el enlace caduca al terminar.
        </li>
      </ul>

      <h2>3. Tu número de celular</h2>
      <p>
        Tu número no es público. Queda oculto hasta que existe una reserva
        confirmada entre dos personas, y entonces solo se muestra a esa persona.
        Esa restricción está aplicada en la base de datos, no en la pantalla: no
        depende de que la app funcione bien.
      </p>
      <p>
        Si dejaste tu número para que te avisáramos de una ruta, lo usamos solo
        para eso. Nunca para publicidad, y nunca se lo damos a un tercero.
      </p>

      <h2>4. Para qué usamos los datos</h2>
      <ul>
        <li>Para conectar a pasajeros con conductores de la misma ruta.</li>
        <li>
          Para avisarte cuando alguien publique un viaje que estabas buscando.
        </li>
        <li>
          Para entender qué rutas hacen falta y decidir cuáles abrir. Este
          análisis se hace en agregado, sin identificar a nadie.
        </li>
        <li>Para atender reportes de seguridad e incidentes.</li>
      </ul>

      <h2>5. Con quién los compartimos</h2>
      <p>
        Con el proveedor de verificación de identidad, con el proveedor de
        mensajería que envía las notificaciones y con nuestro proveedor de
        alojamiento. Nada más. No vendemos datos.
      </p>

      <h2>6. Cuánto tiempo los conservamos</h2>
      <p>
        Los datos de viajes y los registros del cálculo del aporte se conservan
        el tiempo necesario para responder ante una eventual verificación
        administrativa. Los números dejados para avisos se borran cuando te das
        de baja o cuando el aviso deja de tener sentido.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes pedir acceso a tus datos, su corrección o su eliminación
        escribiendo a{" "}
        <a
          href="mailto:privacidad@partimos.com"
          className="font-semibold text-accent-ink hover:underline"
        >
          privacidad@partimos.com
        </a>
        . Borrar tu cuenta elimina tu perfil y tus mensajes; los registros
        contables y los instantáneos del cálculo del aporte se conservan de
        forma anonimizada, porque son la prueba de que el viaje respetó el tope.
      </p>
    </LegalPage>
  );
}

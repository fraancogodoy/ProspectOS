import { DocSection, DocH2, DocP, DocList, DocCallout } from "@/components/documentacao/DocSection"

export function ConfiguracoesDoc() {
  return (
    <DocSection titulo="Configuración">
      <DocP>
        Todo lo que se configura una sola vez por instalación vive acá: tu
        perfil de vendedor, las claves de IA, la fuente de datos de Maps, tu
        cuenta de Instagram, los sonidos y la copia de seguridad de los
        datos.
      </DocP>

      <DocH2>Tu perfil de vendedor</DocH2>
      <DocP>
        Tu nombre, a qué te dedicás y tu diferencial (opcional). La IA usa
        estos datos para firmar los mensajes de prospección con tu voz, en
        primera persona.
      </DocP>

      <DocH2>Claves de API (generación de mensajes por IA)</DocH2>
      <DocP>
        Toda generación de mensaje por IA (copy de contacto/seguimiento en
        los dos canales, clasificación de leads de Instagram) depende de al
        menos un proveedor de IA configurado.
      </DocP>
      <DocList>
        <li>
          <strong>Google Gemini</strong> (<code>gemini-flash-latest</code>)
        </li>
        <li>
          <strong>Groq</strong> (<code>llama-3.3-70b-versatile</code>)
        </li>
        <li>
          <strong>NVIDIA Build</strong> (<code>nemotron-super-49b</code>)
        </li>
      </DocList>
      <DocP>
        Todos tienen capa gratuita. Configurar más de uno aumenta la
        confiabilidad — si uno se queda sin cuota, el sistema prueba el
        siguiente automáticamente.
      </DocP>
      <DocList>
        <li>Prueba los proveedores en el orden: Gemini → Groq → NVIDIA.</li>
        <li>Salta en silencio cualquier proveedor sin clave configurada.</li>
        <li>
          Si un proveedor se quedó sin cuota hace poco, queda en "espera" por
          5 minutos antes de reintentarlo.
        </li>
        <li>
          Si todos fallan, muestra un error traducido a lenguaje simple (sin
          jerga técnica).
        </li>
      </DocList>
      <DocCallout>
        Las claves configuradas desde la pantalla tienen prioridad sobre el
        archivo <code>.env</code> — pero si solo usás el <code>.env</code>{" "}
        seguís funcionando normal, sin necesidad de tocar la pantalla.
      </DocCallout>

      <DocH2>Fuente de datos de Google Maps</DocH2>
      <DocP>
        Elegís entre el <strong>scraper local</strong> (gratis, corre en tu
        PC, depende del <code>.exe</code> externo) y la{" "}
        <strong>Google Places API</strong> oficial (más estable, con cuota y
        cobro propios en Google Cloud). El cambio solo afecta a las búsquedas
        nuevas — las que ya corriste no se tocan.
      </DocP>

      <DocH2>Cuenta de Instagram</DocH2>
      <DocP>
        Conectá tu cuenta para poder analizar posts y enriquecer perfiles. El
        login reemplaza al viejo script de línea de comandos.
      </DocP>

      <DocH2>Sonidos</DocH2>
      <DocP>
        Prendé o apagá los sonidos de feedback (búsqueda terminada, lead
        cerrado, etc.) y ajustá el volumen.
      </DocP>

      <DocH2>Copia de todos los datos</DocH2>
      <DocP>
        Descargá un archivo JSON con todos los leads, el historial, las
        plantillas y las conversaciones de los dos canales, para llevarlos a
        otra instalación (por ejemplo, de tu PC a la versión en la nube) sin
        tener que correr las búsquedas de nuevo. No incluye las claves de
        API, que son propias de cada instalación. El mismo archivo se puede
        volver a importar desde acá.
      </DocP>

      <DocH2>Zona de peligro</DocH2>
      <DocCallout variante="warning">
        El botón "Eliminar todos los leads" borra de una vez todos los leads
        de Google Maps, junto con su historial y conversaciones. No hay
        vuelta atrás. Por eso pide escribir la frase de confirmación exacta
        antes de habilitarse — no está pensado para el uso diario, sino para
        vaciar una base de prueba y arrancar de cero. No afecta a los leads
        de Instagram.
      </DocCallout>
    </DocSection>
  )
}

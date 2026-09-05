import { DocSection, DocH2, DocP } from "@/components/documentacao/DocSection"

export function FaqDoc() {
  return (
    <DocSection titulo="Preguntas comunes">
      <DocH2>Corrí la misma búsqueda de nuevo, ¿los leads viejos se duplican?</DocH2>
      <DocP>
        No. Cada negocio se identifica por el <code>place_id</code> de
        Google, así que correr la misma búsqueda después solo actualiza los
        datos "vivos" (nombre, puntuación, teléfono) sin tocar el estado,
        etiquetas, notas o seguimiento que ya habías cargado. Tampoco te pisa
        la campaña ya asignada si el lead ya existía.
      </DocP>

      <DocH2>La búsqueda en Maps no trajo ningún resultado, ¿qué pasó?</DocH2>
      <DocP>
        Fijate si el <code>google-maps-scraper.exe</code> está en la carpeta
        correcta y si el rubro/ciudad está bien escrito. Rubros muy
        específicos o ciudades chicas pueden de verdad no tener ningún
        resultado que califique (buena puntuación + sin sitio web).
      </DocP>

      <DocH2>¿Puedo usarlo sin clave de IA configurada?</DocH2>
      <DocP>
        Sí, para buscar y organizar leads. Solo la generación de mensajes por
        IA (copy de contacto/seguimiento) y la clasificación automática de
        Instagram necesitan al menos una clave configurada en
        "Configuración".
      </DocP>

      <DocH2>Eliminé un lead sin querer, ¿se puede recuperar?</DocH2>
      <DocP>
        Si fue "ignorar", sí — solo queda escondido, buscalo con el filtro de
        estado "Ignorado". Si fue "eliminar definitivamente", no — esa acción
        borra de la base para siempre, por eso solo está permitida en leads
        ya ignorados (una protección extra contra un clic por error). El
        botón "Eliminar todos los leads" de Configuración es todavía más
        radical: borra absolutamente todos los leads de Maps de una vez, sin
        ninguna posibilidad de deshacerlo.
      </DocP>

      <DocH2>Instagram me pide iniciar sesión de nuevo, ¿es normal?</DocH2>
      <DocP>
        Sí, las sesiones vencen cada tanto. Alcanza con volver a iniciar
        sesión desde Configuración → Cuenta de Instagram.
      </DocP>

      <DocH2>¿Para qué sirve la "campaña" de una búsqueda?</DocH2>
      <DocP>
        Es un rótulo opcional para agrupar leads de varias búsquedas bajo un
        mismo nombre (ej.: todas las búsquedas de peluquerías, spas y
        centros de estética bajo la campaña "belleza"), aunque sean rubros
        distintos. Sirve para filtrar y organizar el trabajo de prospección
        por tema, no cambia en nada cómo se buscan o procesan los leads.
      </DocP>
    </DocSection>
  )
}

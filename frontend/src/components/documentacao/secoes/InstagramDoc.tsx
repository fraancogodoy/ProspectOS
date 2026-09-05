import {
  DocSection,
  DocH2,
  DocP,
  DocList,
  DocCallout,
} from "@/components/documentacao/DocSection"

export function InstagramDoc() {
  return (
    <DocSection titulo="Instagram">
      <DocP>
        El canal de Instagram analiza los comentarios de un post puntual,
        para encontrar personas que mostraron interés o se identifican como
        dueñas de un negocio dentro de un rubro que vos elegís.
      </DocP>

      <DocH2>Cómo analizar un post</DocH2>
      <DocP>
        Pegá la URL de un post (<code>/p/</code>, <code>/reel/</code> o{" "}
        <code>/tv/</code>) y, opcionalmente, un <strong>rubro objetivo</strong>{" "}
        (ej.: "abogados"). El rubro objetivo orienta la clasificación por IA
        — sin él, el análisis es más genérico.
      </DocP>

      <DocH2>Qué pasa detrás de escena (3 etapas)</DocH2>
      <DocList>
        <li>
          <strong>Raspado</strong>: extrae todos los comentarios del post
          (usuario + texto).
        </li>
        <li>
          <strong>Enriquecimiento</strong>: consulta cada perfil único —
          público o privado, bio, seguidores, si es cuenta comercial.
        </li>
        <li>
          <strong>Clasificación por IA</strong>: para cada perfil público,
          evalúa bio/seguidores/comentarios y devuelve prioridad, rubro
          identificado, justificación y una sugerencia de DM lista para usar.
        </li>
      </DocList>
      <DocCallout variante="warning">
        Los perfiles privados se descartan automáticamente antes de
        clasificar, sin gastar una llamada de IA. La etapa de enriquecimiento
        usa tu cuenta personal de Instagram — usala con moderación para
        reducir el riesgo de bloqueo.
      </DocCallout>

      <DocH2>Prioridad</DocH2>
      <DocP>
        Cada lead recibe una prioridad: <strong>alta</strong>,{" "}
        <strong>media</strong>, <strong>baja</strong> o{" "}
        <strong>descartado</strong>. Se puede reeditar a mano en cualquier
        momento.
      </DocP>

      <DocH2>Sugerencia de DM y seguimiento</DocH2>
      <DocP>
        La sugerencia de DM viene lista desde la clasificación, pero se puede
        regenerar (contacto o seguimiento), editar a mano, o usar como base
        para una plantilla. El seguimiento inteligente funciona igual que en
        Google Maps: marcar como enviado, sugerencia de próxima fecha, y
        sello de lead difícil.
      </DocP>

      <DocH2>Archivar y eliminar posts</DocH2>
      <DocP>
        Un post analizado se puede <strong>archivar</strong> (desaparece de
        la lista principal, pero sigue siendo recuperable) y después, en la
        pestaña "Archivados", <strong>restaurar</strong> o{" "}
        <strong>eliminar definitivamente</strong> — esto borra el post y
        todos sus leads para siempre de la base.
      </DocP>
    </DocSection>
  )
}

import {
  DocSection,
  DocH2,
  DocP,
  DocList,
} from "@/components/documentacao/DocSection"

export function VisaoGeralDoc() {
  return (
    <DocSection titulo="Visión general">
      <DocP>
        Esta es una herramienta de prospección de leads con dos canales de
        captación independientes — <strong>Google Maps</strong> e{" "}
        <strong>Instagram</strong> — que comparten el mismo vocabulario de
        embudo, etiquetas, notas y seguimiento inteligente, pero con flujos de
        captación bien distintos entre sí.
      </DocP>

      <DocH2>Los dos canales</DocH2>
      <DocList>
        <li>
          <strong>Google Maps</strong>: busca negocios por rubro + ciudad
          (ej.: "peluquería en Tandil"), filtra automáticamente solo los que
          tienen buena puntuación y no tienen sitio web — son los candidatos
          más obvios para venderles PresencIA.
        </li>
        <li>
          <strong>Instagram</strong>: analiza los comentarios de un post
          puntual, identifica a quienes comentaron y clasifica
          automáticamente por IA quién parece ser dueño de un negocio dentro
          de un rubro objetivo que vos elegís.
        </li>
      </DocList>

      <DocH2>Conceptos que valen para los dos canales</DocH2>
      <DocList>
        <li>
          <strong>Estado del embudo</strong>: todo lead avanza por{" "}
          <em>nuevo → contactado → respondió → cerró</em>. Existen además dos
          estados que salen del embudo: <em>rechazó</em> (dijo que no) e{" "}
          <em>ignorado</em> (lo escondiste, pero sigue en la base, se puede
          recuperar).
        </li>
        <li>
          <strong>Rubro</strong>: en Maps se extrae automáticamente del texto
          de la búsqueda. En Instagram lo identifica la IA al clasificar (y
          se puede editar después).
        </li>
        <li>
          <strong>Campaña</strong> (solo Maps): un rótulo libre y opcional que
          le podés poner a una búsqueda (ej.: "belleza", "inmobiliarias",
          "deportes") para agrupar varios rubros bajo un mismo nombre y
          filtrarlos juntos después en la lista de leads. Se define al lanzar
          la búsqueda, pero también se puede cambiar a mano en la ficha de
          cada lead.
        </li>
        <li>
          <strong>Prioridad</strong>: solo existe en Instagram (alta / media /
          baja / descartado) — indica qué tan prometedor es ese perfil.
        </li>
        <li>
          <strong>Lead difícil</strong>: un sello que aparece cuando un lead
          ya recibió al menos un seguimiento y lleva más de 5 días parado en{" "}
          <em>nuevo</em> o <em>contactado</em>. Es solo un aviso visual —
          archivarlo o no sigue siendo siempre tu decisión.
        </li>
      </DocList>

      <DocH2>Dónde está cada cosa</DocH2>
      <DocList>
        <li>
          <strong>Dashboard</strong> (página de inicio): métricas combinadas
          de los dos canales, embudo y ranking de rubros sumados, y accesos
          directos a las demás secciones.
        </li>
        <li>
          <strong>Google Maps</strong>: lista/kanban de leads, búsqueda nueva
          por texto o por mapa (con campañas), búsqueda por nombre, dirección
          o teléfono, edición de datos de contacto, seguimiento, plantillas.
        </li>
        <li>
          <strong>Instagram</strong>: análisis de posts, leads clasificados
          por prioridad, seguimiento, posts archivados.
        </li>
        <li>
          <strong>Configuración</strong>: tu perfil de vendedor, claves de API
          de los proveedores de IA, fuente de datos de Maps (scraper o Google
          Places), cuenta de Instagram, sonidos, copia de seguridad de todos
          los datos (exportar/importar) y la zona de peligro para borrar todo
          y empezar de cero.
        </li>
      </DocList>
    </DocSection>
  )
}

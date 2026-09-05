import { DocSection, DocH2, DocP, DocList } from "@/components/documentacao/DocSection"

export function DashboardDoc() {
  return (
    <DocSection titulo="Dashboard general">
      <DocP>
        La página de inicio del sistema es una vista ejecutiva combinada de
        los dos canales — no muestra listas de leads, solo métricas y
        accesos directos.
      </DocP>

      <DocH2>Qué muestra cada bloque</DocH2>
      <DocList>
        <li>
          <strong>Métricas combinadas</strong>: total de leads activos
          (separado por canal también), contactados, cerrados, tasa de
          conversión y seguimientos para hoy — sumando Maps + Instagram.
        </li>
        <li>
          <strong>Seguimientos de hoy</strong>: lista de los leads con
          seguimiento vencido o para hoy, de los dos canales juntos, con
          acceso directo a cada uno.
        </li>
        <li>
          <strong>Embudo de conversión combinado</strong>: cuántos leads
          llegaron a cada etapa (nuevo → contactado → respondió → cerró),
          sumando los dos canales.
        </li>
        <li>
          <strong>Ranking de rubros combinado</strong>: total y tasa de
          conversión por rubro, sumando los dos canales cuando el nombre del
          rubro coincide.
        </li>
        <li>
          <strong>Accesos directos</strong>: tarjetas de navegación rápida a
          Leads de Google Maps, Leads de Instagram y Analytics de Maps.
        </li>
      </DocList>
    </DocSection>
  )
}

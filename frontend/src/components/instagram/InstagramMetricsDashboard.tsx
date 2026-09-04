import { useMetricasInstagram } from "@/hooks/useInstagramAnalytics"
import { StatTile } from "@/components/dashboard/StatTile"
import { Skeleton } from "@/components/ui/skeleton"

export function InstagramMetricsDashboard() {
  const { data: metricas, isLoading } = useMetricasInstagram()

  if (isLoading || !metricas) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[74px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile rotulo="Leads activos" valor={metricas.total} />
      <StatTile
        rotulo="Contactados"
        valor={metricas.por_status.contatado ?? 0}
      />
      <StatTile
        rotulo="Respondieron"
        valor={metricas.por_status.respondeu ?? 0}
      />
      <StatTile
        rotulo="Cerrados"
        valor={metricas.por_status.fechou ?? 0}
        variante="destaque"
      />
      <StatTile
        rotulo="Tasa de conversión"
        valor={`${metricas.taxa_conversao}%`}
        variante="destaque"
      />
      <StatTile
        rotulo="Seguimientos para hoy"
        valor={metricas.lembretes_hoje ?? 0}
        variante={(metricas.lembretes_hoje ?? 0) > 0 ? "alerta" : "default"}
      />
    </div>
  )
}

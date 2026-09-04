import { SelectComVazio } from "@/components/filters/SelectComVazio"
import type { FiltrosLeads } from "@/types/lead"

interface SituacaoSiteSelectProps {
  valor: FiltrosLeads["site_status"]
  onChange: (valor: FiltrosLeads["site_status"]) => void
}

export function SituacaoSiteSelect({ valor, onChange }: SituacaoSiteSelectProps) {
  return (
    <SelectComVazio
      valor={valor}
      onChange={(v) => onChange(v as FiltrosLeads["site_status"])}
      opcoes={[
        { valor: "sem_site", label: "Sin web" },
        { valor: "site_ruim", label: "Web mala" },
        { valor: "site_ok", label: "Web ok" },
      ]}
      labelVazio="Cualquier situación"
      placeholder="Situación de la web"
      className="w-[170px]"
    />
  )
}

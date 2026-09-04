import type { OrdenacaoPrioridade } from "@/lib/constants"
import { SelectComVazio } from "@/components/filters/SelectComVazio"

interface OrdenacaoPrioridadeSelectProps {
  valor: OrdenacaoPrioridade
  onChange: (valor: OrdenacaoPrioridade) => void
}

export function OrdenacaoPrioridadeSelect({
  valor,
  onChange,
}: OrdenacaoPrioridadeSelectProps) {
  return (
    <SelectComVazio
      valor={valor}
      onChange={(v) => onChange(v as OrdenacaoPrioridade)}
      opcoes={[
        { valor: "prioridade-desc", label: "Mayor prioridad primero" },
        { valor: "prioridade-asc", label: "Menor prioridad primero" },
      ]}
      labelVazio="Orden por defecto"
      placeholder="Ordenar"
      className="w-[190px]"
    />
  )
}

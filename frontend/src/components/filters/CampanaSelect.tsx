import { useCampanas } from "@/hooks/useCampanas"
import { SelectComVazio } from "@/components/filters/SelectComVazio"

interface CampanaSelectProps {
  valor: string
  onChange: (valor: string) => void
}

export function CampanaSelect({ valor, onChange }: CampanaSelectProps) {
  const { data: campanas } = useCampanas()

  return (
    <SelectComVazio
      valor={valor}
      onChange={onChange}
      opcoes={(campanas ?? []).map((campana) => ({ valor: campana, label: campana }))}
      labelVazio="Todas las campañas"
      placeholder="Campaña"
      className="w-[200px]"
    />
  )
}

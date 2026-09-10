import { useQuery } from "@tanstack/react-query"
import { presenciaService } from "@/services/presenciaService"

// staleTime largo: la lista de plantillas aprobadas por Meta casi no cambia
// en el día a día, y cada carga es un pedido al PresencIA (login + Graph API).
export function usePresenciaPlantillas() {
  const query = useQuery({
    queryKey: ["presencia-plantillas"],
    queryFn: () => presenciaService.listarPlantillas(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return { plantillas: query.data ?? [], ...query }
}

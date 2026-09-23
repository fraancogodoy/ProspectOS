import { useQuery, useQueryClient } from "@tanstack/react-query"
import { presenciaService } from "@/services/presenciaService"

export function usePresenciaHeader(templateName: string | undefined) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["presencia-header", templateName],
    queryFn: () => presenciaService.obtenerHeader(templateName!),
    enabled: Boolean(templateName),
    staleTime: 60 * 1000,
  })

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ["presencia-header", templateName] })

  return { estado: query.data, invalidar, ...query }
}

import { useQuery } from "@tanstack/react-query"
import { buscaService } from "@/services/buscaService"

export function useCampanas() {
  return useQuery({
    queryKey: ["campanas"],
    queryFn: buscaService.campanas,
  })
}

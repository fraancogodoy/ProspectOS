import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { buscaService } from "@/services/buscaService"
import { useInvalidarLeads } from "@/hooks/useInvalidarLeads"
import { notificar, pedirPermissaoNotificacao } from "@/hooks/useNotificacaoNavegador"
import { tocarSom } from "@/hooks/useSom"
import type { AreaBuscaPayload, EstadoBusca } from "@/types/busca"

export function useBusca() {
  const queryClient = useQueryClient()
  const invalidarListaEMetricas = useInvalidarLeads()
  const [poll, setPoll] = useState(false)
  const [resultadoFinal, setResultadoFinal] = useState<EstadoBusca | null>(null)

  const aoDisparar = () => {
    setResultadoFinal(null)
    // remove o status cacheado da busca ANTERIOR (rodando:false) - senão o
    // effect abaixo veria !rodando e dispararia "conclusão" instantânea com o
    // resultado antigo antes desta busca começar
    queryClient.removeQueries({ queryKey: ["busca-status"] })
    setPoll(true)
    pedirPermissaoNotificacao()
  }

  const dispararBusca = useMutation({
    mutationFn: ({ queries, campana }: { queries: string; campana?: string }) =>
      buscaService.disparar(queries, campana),
    onSuccess: aoDisparar,
  })

  const dispararBuscaMapa = useMutation({
    mutationFn: ({
      nichos,
      areas,
      campana,
    }: {
      nichos: string[]
      areas: AreaBuscaPayload[]
      campana?: string
    }) => buscaService.dispararPorMapa(nichos, areas, campana),
    onSuccess: aoDisparar,
  })

  const statusBusca = useQuery({
    queryKey: ["busca-status"],
    queryFn: buscaService.consultarStatus,
    enabled: poll,
    refetchInterval: (query) => (query.state.data?.rodando ? 2000 : false),
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (poll && statusBusca.data && !statusBusca.data.rodando) {
      setPoll(false)
      setResultadoFinal(statusBusca.data)
      queryClient.invalidateQueries({ queryKey: ["nichos"] })
      queryClient.invalidateQueries({ queryKey: ["campanas"] })
      invalidarListaEMetricas()
      notificar("Búsqueda de leads terminada", statusBusca.data.mensagem)
      tocarSom("busca-maps-concluida")
    }
  }, [poll, statusBusca.data, queryClient, invalidarListaEMetricas])

  const limparResultado = () => setResultadoFinal(null)

  return {
    dispararBusca,
    dispararBuscaMapa,
    statusBusca,
    pollingAtivo: poll,
    resultadoFinal,
    limparResultado,
  }
}

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { leadsService } from "@/services/leadsService"
import { useInvalidarLeads } from "@/hooks/useInvalidarLeads"
import { tocarSom } from "@/hooks/useSom"
import type { StatusLead } from "@/types/lead"

interface EstadoFollowupAnterior {
  followUpsEnviadosAnterior: number
  ultimoFollowupEmAnterior: string | null
  proximoFollowupAnterior: string | null
}

export function useLeadMutations(placeId: string) {
  const invalidarListaEMetricas = useInvalidarLeads()
  const queryClient = useQueryClient()

  const atualizarStatus = useMutation({
    mutationFn: (status: StatusLead) =>
      leadsService.atualizarStatus(placeId, status),
    onSuccess: (_dados, status) => {
      invalidarListaEMetricas()
      if (status === "fechou") tocarSom("lead-fechou")
      toast.success("Estado actualizado.")
    },
  })

  const salvarTagsFollowup = useMutation({
    mutationFn: (input: { tags: string; proximoFollowup: string | null }) =>
      Promise.all([
        leadsService.atualizarTags(placeId, input.tags),
        leadsService.atualizarFollowup(placeId, input.proximoFollowup),
      ]),
    onSuccess: () => {
      invalidarListaEMetricas()
      toast.success("Etiquetas y seguimiento guardados.")
    },
  })

  const salvarObservacoes = useMutation({
    mutationFn: (observacoes: string) =>
      leadsService.atualizarObservacoes(placeId, observacoes),
    onSuccess: () => toast.success("Notas guardadas."),
  })

  const salvarContato = useMutation({
    mutationFn: (dados: Parameters<typeof leadsService.atualizarContato>[1]) =>
      leadsService.atualizarContato(placeId, dados),
    onSuccess: () => {
      invalidarListaEMetricas()
      queryClient.invalidateQueries({ queryKey: ["campanas"] })
      toast.success("Datos de contacto guardados.")
    },
  })

  const gerarMensagem = useMutation({
    mutationFn: ({
      forcarNova,
      tipo,
    }: {
      forcarNova: boolean
      tipo?: "contato" | "followup"
    }) => leadsService.gerarMensagem(placeId, forcarNova, tipo),
  })

  const marcarFollowupEnviado = useMutation({
    mutationFn: (estadoAnterior: EstadoFollowupAnterior) =>
      leadsService.marcarFollowupEnviado(placeId).then((resposta) => ({
        resposta,
        estadoAnterior,
      })),
    onSuccess: ({ resposta, estadoAnterior }) => {
      invalidarListaEMetricas()
      tocarSom("followup-marcado")
      toast.success(`Seguimiento nº ${resposta.follow_ups_enviados} registrado.`, {
        action: {
          label: "Deshacer",
          onClick: () => {
            leadsService
              .desfazerFollowupEnviado(placeId, estadoAnterior)
              .then(() => {
                invalidarListaEMetricas()
                toast.success("Seguimiento deshecho.")
              })
          },
        },
      })
    },
  })

  const ignorar = useMutation({
    mutationFn: (statusAnterior: StatusLead) => leadsService.ignorar(placeId).then(() => statusAnterior),
    onSuccess: (statusAnterior) => {
      invalidarListaEMetricas()
      toast("Lead ignorado.", {
        action: {
          label: "Deshacer",
          onClick: () => {
            leadsService.atualizarStatus(placeId, statusAnterior).then(() => {
              invalidarListaEMetricas()
              toast.success("Lead restaurado.")
            })
          },
        },
      })
    },
  })

  const reanalisarSite = useMutation({
    mutationFn: () => leadsService.reanalisarSite(placeId),
    onSuccess: (resultado) => {
      invalidarListaEMetricas()
      const rotulos = { sem_site: "sin web", site_ruim: "web mala", site_ok: "web ok" }
      const detalhe = resultado.site_problemas ? ` - ${resultado.site_problemas}` : ""
      toast.success(`Web reanalizada: ${rotulos[resultado.site_status]}${detalhe}`)
    },
  })

  const excluirDefinitivamente = useMutation({
    mutationFn: () => leadsService.excluirDefinitivamente(placeId),
    onSuccess: () => {
      invalidarListaEMetricas()
      tocarSom("apagar-lead")
      toast.success("Lead eliminado definitivamente.")
    },
  })

  return {
    atualizarStatus,
    salvarTagsFollowup,
    salvarObservacoes,
    salvarContato,
    gerarMensagem,
    marcarFollowupEnviado,
    ignorar,
    reanalisarSite,
    excluirDefinitivamente,
  }
}

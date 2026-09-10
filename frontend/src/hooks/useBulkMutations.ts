import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { leadsService } from "@/services/leadsService"
import { presenciaService } from "@/services/presenciaService"
import { useInvalidarLeads } from "@/hooks/useInvalidarLeads"
import { tocarSom } from "@/hooks/useSom"
import type { StatusLead } from "@/types/lead"

export function useBulkMutations() {
  const invalidarListaEMetricas = useInvalidarLeads()

  const atualizarStatusEmLote = useMutation({
    mutationFn: (input: { placeIds: string[]; status: StatusLead }) =>
      leadsService.atualizarStatusEmLote(input.placeIds, input.status),
    onSuccess: (resposta) => {
      invalidarListaEMetricas()
      toast.success(`${resposta.atualizados} lead(s) actualizado(s).`)
    },
  })

  const ignorarEmLote = useMutation({
    mutationFn: (placeIds: string[]) => leadsService.ignorarEmLote(placeIds),
    onSuccess: (resposta) => {
      invalidarListaEMetricas()
      toast.success(`${resposta.atualizados} lead(s) ignorado(s).`)
    },
  })

  const excluirEmLoteDefinitivamente = useMutation({
    mutationFn: (placeIds: string[]) =>
      leadsService.excluirEmLoteDefinitivamente(placeIds),
    onSuccess: (resposta) => {
      invalidarListaEMetricas()
      tocarSom("apagar-lead")
      toast.success(`${resposta.excluidos} lead(s) eliminado(s) definitivamente.`)
    },
  })

  const enviarPlantillaEmLote = useMutation({
    mutationFn: (input: {
      placeIds: string[]
      template_name: string
      language: string
      parameters: string[]
    }) =>
      presenciaService.enviarLote({
        place_ids: input.placeIds,
        template_name: input.template_name,
        language: input.language,
        parameters: input.parameters,
      }),
    onSuccess: (resposta) => {
      invalidarListaEMetricas()
      if (resposta.fallidos.length === 0) {
        toast.success(`Plantilla enviada a ${resposta.enviados} negocio(s).`)
      } else {
        toast.warning(
          `Enviada a ${resposta.enviados}. No salió en ${resposta.fallidos.length}: ` +
            resposta.fallidos
              .map((f) => `${f.nome ?? f.place_id} (${f.erro})`)
              .join("; ")
        )
      }
    },
  })

  return {
    atualizarStatusEmLote,
    ignorarEmLote,
    excluirEmLoteDefinitivamente,
    enviarPlantillaEmLote,
  }
}

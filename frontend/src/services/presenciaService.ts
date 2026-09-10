import { httpClient } from "@/services/httpClient"
import type { PresenciaPlantilla } from "@/types/lead"

export const presenciaService = {
  listarPlantillas: () =>
    httpClient
      .get<{ plantillas: PresenciaPlantilla[] }>("/api/presencia/plantillas")
      .then((d) => d.plantillas),

  enviar: (
    placeId: string,
    dados: { template_name: string; language: string; parameters: string[] }
  ) =>
    httpClient.post<{ ok: true }>(
      `/api/leads/${encodeURIComponent(placeId)}/presencia/enviar`,
      dados
    ),

  enviarLote: (dados: {
    place_ids: string[]
    template_name: string
    language: string
    parameters: string[]
  }) =>
    httpClient.post<{
      ok: true
      enviados: number
      fallidos: { place_id: string; nome: string | null; erro: string }[]
    }>("/api/presencia/enviar-lote", dados),
}

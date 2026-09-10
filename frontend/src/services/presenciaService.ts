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

  // Chequea contra PresencIA cuáles de los envíos recién hechos se entregaron
  // de verdad. Los que Meta rechazó al entregar (ej. 131049) vuelven a "novo".
  reconciliar: (placeIds: string[]) =>
    httpClient.post<{
      ok: true
      entregados: number
      pendientes: number
      revertidos: { place_id: string; nome: string; codigo: string | null }[]
    }>("/api/leads/presencia/reconciliar", { place_ids: placeIds }),
}

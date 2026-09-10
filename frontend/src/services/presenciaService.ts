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
}

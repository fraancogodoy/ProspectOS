import { httpClient, ApiError } from "@/services/httpClient"
import type { PresenciaPlantilla } from "@/types/lead"

export interface EstadoHeaderPlantilla {
  existe: boolean
  nombre_archivo?: string
  tamano?: number
}

export const presenciaService = {
  listarPlantillas: () =>
    httpClient
      .get<{ plantillas: PresenciaPlantilla[] }>("/api/presencia/plantillas")
      .then((d) => d.plantillas),

  // El header (imagen/video/documento) de una plantilla no queda guardado en
  // Meta - se sube una sola vez acá y el backend lo re-manda automáticamente
  // en cada envío de esa plantilla (ver backend/rotas_leads.py).
  obtenerHeader: (templateName: string) =>
    httpClient.get<EstadoHeaderPlantilla>(
      `/api/presencia/plantillas/${encodeURIComponent(templateName)}/header`
    ),

  subirHeader: async (templateName: string, archivo: File) => {
    const formData = new FormData()
    formData.append("arquivo", archivo)
    const resp = await fetch(
      `/api/presencia/plantillas/${encodeURIComponent(templateName)}/header`,
      { method: "POST", body: formData }
    )
    if (!resp.ok) {
      const dados = await resp.json().catch(() => null)
      throw new ApiError(dados?.erro || `Error del servidor (${resp.status}).`, resp.status)
    }
    return resp.json() as Promise<EstadoHeaderPlantilla>
  },

  borrarHeader: (templateName: string) =>
    httpClient.delete<{ ok: true }>(
      `/api/presencia/plantillas/${encodeURIComponent(templateName)}/header`
    ),

  enviar: (
    placeId: string,
    dados: { template_name: string; language: string; parameters: string[] }
  ) =>
    httpClient.post<{ ok: true }>(
      `/api/leads/${encodeURIComponent(placeId)}/presencia/enviar`,
      dados
    ),

  encolar: (dados: {
    place_ids: string[]
    template_name: string
    language: string
    parameters: string[]
  }) =>
    httpClient.post<{
      ok: true
      lote_id: string
      encolados: number
      omitidos: number
      en_cola: number
      minutos_estimados: number
    }>("/api/presencia/cola", dados),

  estadoCola: () =>
    httpClient.get<{
      activo: boolean
      lotes: string[]
      total: number
      pendientes: number
      enviados: number
      fallidos: number
      cancelados: number
      segundos_para_proximo: number | null
      lista_fallidos: { place_id: string; nome: string | null; erro: string }[]
    }>("/api/presencia/cola"),

  // Sin loteId cancela todo lo pendiente (el aviso de la página muestra la
  // cola entera, no un lote).
  cancelarCola: (loteId?: string) =>
    httpClient.post<{ ok: true; cancelados: number }>("/api/presencia/cola/cancelar", {
      lote_id: loteId ?? null,
    }),
}

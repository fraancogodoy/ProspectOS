import { httpClient } from "@/services/httpClient"
import type { AreaBuscaPayload, BuscaHistorico, EstadoBusca } from "@/types/busca"

export const buscaService = {
  disparar: (queries: string, campana?: string) =>
    httpClient.post<{ ok: true }>("/api/buscar", { queries, campana }),

  dispararPorMapa: (nichos: string[], areas: AreaBuscaPayload[], campana?: string) =>
    httpClient.post<{ ok: true }>("/api/buscar", { nichos, areas, campana }),

  consultarStatus: () => httpClient.get<EstadoBusca>("/api/buscar/status"),

  historico: () =>
    httpClient.get<{ buscas: BuscaHistorico[] }>("/api/buscar/historico"),

  campanas: () => httpClient.get<string[]>("/api/campanhas"),
}

import { httpClient } from "@/services/httpClient"

export interface EstadoAuth {
  logado: boolean
  usuario: string | null
  auth_habilitada: boolean
}

export const authService = {
  me: () => httpClient.get<EstadoAuth>("/api/auth/me"),

  login: (usuario: string, senha: string) =>
    httpClient.post<{ ok: true; logado: true; usuario?: string }>(
      "/api/auth/login",
      { usuario, senha }
    ),

  logout: () => httpClient.post<{ ok: true }>("/api/auth/logout"),
}
